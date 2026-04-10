/**
 * sources/osm-stores.mjs — Découverte dynamique de magasins DOM-TOM via l'API Overpass
 *
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │  Problème résolu : le pipeline food.mjs ne couvrait que 8 magasins  │
 * │  hardcodés (OSM IDs en dur dans fetch-scraped-data.mjs).            │
 * │  Ce module interroge Overpass pour TOUS les supermarchés DOM-TOM    │
 * │  (971/972/973/974/976) et retourne leur OSM ID dynamiquement.       │
 * └─────────────────────────────────────────────────────────────────────┘
 *
 * Source : OpenStreetMap contributors
 * Licence données : Open Database License (ODbL)
 * API Overpass  : https://overpass-api.de — usage public, polite access requis
 *
 * Flux :
 *   1. Pour chaque département DOM (971→976), construit une requête Overpass QL
 *   2. Interroge les miroirs Overpass avec retry
 *   3. Normalise les noms d'enseignes (brand / name OSM → nom canonique)
 *   4. Retourne une liste { osmId, osmType, retailer, territory, city, confidence }
 *      prête à être passée à Open Prices (?location_osm_id=)
 *
 * Utilisation dans food.mjs :
 *   import { discoverDOMStores } from './osm-stores.mjs';
 *   const stores = await discoverDOMStores();
 *   // → [{ osmId:'12345678', osmType:'N', retailer:'Carrefour', territory:'GP', … }]
 */

import { fetchJSONWithRetry, sleep } from './utils.mjs';

// ─── Constantes ───────────────────────────────────────────────────────────────

/**
 * Miroirs Overpass API (ordre de préférence).
 * Plusieurs endpoints évitent les indisponibilités ponctuelles.
 */
const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://lz4.overpass-api.de/api/interpreter',
  'https://z.overpass-api.de/api/interpreter',
];

/** Délai poli entre deux requêtes Overpass (rate limit public : ~2 req/s ;
 *  on utilise 1 500 ms pour une marge de sécurité confortable et respecter
 *  la politique d'accès "poli" décrite dans les CGU Overpass API). */
const OVERPASS_DELAY_MS = 1_500;

/** Départements DOM-TOM avec leur préfixe de code postal */
const DOM_DEPTS = [
  { prefix: '971', territory: 'GP', name: 'Guadeloupe' },
  { prefix: '972', territory: 'MQ', name: 'Martinique' },
  { prefix: '973', territory: 'GF', name: 'Guyane' },
  { prefix: '974', territory: 'RE', name: 'La Réunion' },
  { prefix: '976', territory: 'YT', name: 'Mayotte' },
];

/**
 * Table de normalisation des noms d'enseignes.
 * OSM utilise parfois le tag `brand`, parfois le tag `name` — les deux
 * peuvent contenir des graphies différentes (accents, espaces, etc.).
 */
const RETAILER_PATTERNS = [
  { pattern: /carrefour\s*(market|express|city|contact)?/i, name: 'Carrefour' },
  { pattern: /e\.?\s*leclerc|leclerc/i,                    name: 'E.Leclerc' },
  { pattern: /intermarché|intermarche/i,                   name: 'Intermarché' },
  { pattern: /leader\s*price/i,                            name: 'Leader Price' },
  { pattern: /cora/i,                                      name: 'Cora' },
  { pattern: /géant\s*casino|geant\s*casino/i,             name: 'Géant Casino' },
  { pattern: /hyper\s*u/i,                                 name: 'Hyper U' },
  { pattern: /super\s*u/i,                                 name: 'Super U' },
  { pattern: /marché\s*u|marche\s*u/i,                     name: 'Marché U' },
  { pattern: /casino/i,                                    name: 'Casino' },
  { pattern: /lidl/i,                                      name: 'Lidl' },
  { pattern: /aldi/i,                                      name: 'Aldi' },
  { pattern: /spar/i,                                      name: 'Spar' },
  { pattern: /match/i,                                     name: 'Match' },
  { pattern: /netto/i,                                     name: 'Netto' },
  { pattern: /maxi\s*k?|maxi\s*bazar/i,                   name: 'Maxi' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Normalise un nom d'enseigne OSM vers un nom canonique reconnu.
 * @param {string|undefined} rawName
 * @returns {string}
 */
function normalizeRetailer(rawName) {
  if (!rawName) return 'Supermarché';
  for (const { pattern, name } of RETAILER_PATTERNS) {
    if (pattern.test(rawName)) return name;
  }
  return rawName.trim().replace(/\s+/g, ' ');
}

/**
 * Construit la requête Overpass QL pour un département.
 *
 * Cherche les tags `shop=supermarket` et `shop=hypermarket` avec le code
 * postal correspondant au département (ex: 971xx pour la Guadeloupe).
 *
 * @param {string} prefix  Préfixe code postal (ex: '971')
 * @returns {string}
 */
function buildQuery(prefix) {
  return (
    `[out:json][timeout:40];` +
    `(` +
    `  node["shop"="supermarket"]["addr:postcode"~"^${prefix}"];` +
    `  way["shop"="supermarket"]["addr:postcode"~"^${prefix}"];` +
    `  node["shop"="hypermarket"]["addr:postcode"~"^${prefix}"];` +
    `  way["shop"="hypermarket"]["addr:postcode"~"^${prefix}"];` +
    `);` +
    `out center tags;`
  );
}

// ─── Typage JSDoc ─────────────────────────────────────────────────────────────

/**
 * @typedef {{
 *   osmId:      string;
 *   osmType:    'N'|'W';
 *   retailer:   string;
 *   rawName:    string;
 *   territory:  string;
 *   city:       string;
 *   confidence: number;
 * }} OSMStore
 */

// ─── Fetch ────────────────────────────────────────────────────────────────────

/**
 * Interroge Overpass pour tous les supermarchés d'un département DOM.
 * Essaie plusieurs miroirs en cas d'échec.
 *
 * @param {{ prefix: string; territory: string; name: string }} dept
 * @returns {Promise<OSMStore[]>}
 */
async function fetchStoresForTerritory(dept) {
  const query = buildQuery(dept.prefix);

  for (const endpoint of OVERPASS_ENDPOINTS) {
    const url = `${endpoint}?data=${encodeURIComponent(query)}`;
    const data = await fetchJSONWithRetry(
      url,
      `Overpass ${dept.name}`,
      'osm-stores',
      2,
    );
    if (!data?.elements?.length) continue;

    /** @type {OSMStore[]} */
    const stores = data.elements.map((el) => {
      const tags  = el.tags ?? {};
      const brand = tags.brand ?? tags['brand:fr'] ?? '';
      const name  = tags.name  ?? tags['name:fr']  ?? '';
      return {
        osmId:      String(el.id),
        osmType:    el.type === 'way' ? 'W' : 'N',
        retailer:   normalizeRetailer(brand || name),
        rawName:    name,
        territory:  dept.territory,
        city:       tags['addr:city'] ?? tags['addr:municipality'] ?? '',
        // Confidence : plus élevée si OSM a un tag brand explicite
        confidence: brand ? 0.92 : 0.80,
      };
    });

    return stores;
  }

  return [];
}

// ─── Export principal ─────────────────────────────────────────────────────────

/**
 * Découvre dynamiquement tous les supermarchés et hypermarchés des cinq
 * départements DOM-TOM en interrogeant l'API Overpass (OpenStreetMap).
 *
 * Les OSM IDs retournés peuvent être passés directement à l'API Open Prices :
 *   GET /api/v1/prices?location_osm_id=<osmId>&order_by=-date&size=100
 *
 * @returns {Promise<OSMStore[]>}
 */
export async function discoverDOMStores() {
  console.log('  🗺️  [osm-stores] Découverte dynamique des magasins DOM-TOM…');

  /** @type {OSMStore[]} */
  const all = [];

  for (const dept of DOM_DEPTS) {
    console.log(`  📡 [osm-stores] Overpass → ${dept.name} (code postal ${dept.prefix}*)…`);
    const stores = await fetchStoresForTerritory(dept);
    console.log(`       ${stores.length} magasin(s) trouvé(s)`);
    all.push(...stores);

    // Délai poli entre les requêtes Overpass
    await sleep(OVERPASS_DELAY_MS);
  }

  // Déduplique par osmId (un way et un node peuvent correspondre au même lieu)
  const seen = new Set();
  const deduped = all.filter((s) => {
    if (seen.has(s.osmId)) return false;
    seen.add(s.osmId);
    return true;
  });

  console.log(`  📊 [osm-stores] ${deduped.length} magasins uniques DOM-TOM découverts`);
  return deduped;
}
