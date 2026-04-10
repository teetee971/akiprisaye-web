/**
 * sources/food.mjs — Scraper produits alimentaires via Open Food Facts + Open Prices
 *
 * Sources (100% légales, licences Open Data) :
 *   - OpenFoodFacts API v2  : https://world.openfoodfacts.org/api/v2/
 *     Licence : Open Database License (ODbL)
 *   - Open Prices API       : https://prices.openfoodfacts.org/api/v1/
 *     Licence : CC-BY-SA 4.0
 *   - Open Prices — filtre  : location_country=GP/MQ/GF/RE/YT
 *   - Overpass API (OSM)    : découverte dynamique des magasins DOM-TOM
 *     Licence données : ODbL (OpenStreetMap contributors)
 *
 * Stratégie normale :
 *   1. Scrape par pays (GP/MQ/GF/RE/YT) — 3 pages × 100 résultats
 *   2. Scrape par enseigne (location_name__icontains) pour couvrir
 *      Leader Price, Intermarché, Cora, Géant non couverts par les
 *      8 OSM IDs hardcodés — 2 pages × 100 résultats par enseigne
 *   3. Enrichit les EAN inconnus via Open Food Facts
 *
 * Stratégie deep-scan (--deep-scan, exécution hebdomadaire) :
 *   1. Scrape par pays — 10 pages × 100 résultats (×3 données en plus)
 *   2. Scrape par enseigne — 5 pages × 100 résultats
 *   3. Découverte des magasins via Overpass API + scrape par OSM ID
 *   4. Enrichissement étendu via Open Food Facts
 */

import { sleep, fetchJSONWithRetry } from './utils.mjs';
import { discoverDOMStores } from './osm-stores.mjs';

/** @typedef {{ ean: string; productName: string; brand: string; category: string; territory: string; price: number; currency: string; store?: string; city?: string; date: string; source: string; nutritionGrade?: string; }} FoodPriceEntry */

/** Codes ISO-3166-1 alpha-2 des territoires DOM */
const DOM_COUNTRIES = {
  GP: 'GP',
  MQ: 'MQ',
  GF: 'GF',
  RE: 'RE',
  YT: 'YT',
};

/**
 * Enseignes DOM-TOM à cibler par nom (location_name__icontains).
 * Ces enseignes sont sous-représentées dans les requêtes par pays car
 * elles n'ont pas de OSM ID hardcodé dans le pipeline existant.
 * Interrogées pour chaque territoire.
 *
 * Utiliser uniquement des formes ASCII sans accent : l'API Open Prices
 * effectue une recherche insensible à la casse ET aux accents côté serveur
 * (`icontains` sur PostgreSQL avec `unaccent`).
 */
const RETAILER_NAME_FILTERS = [
  // Utiliser uniquement des formes ASCII sans accent : l'API Open Prices
  // effectue une recherche insensible à la casse ET aux accents côté serveur
  // (`icontains` sur PostgreSQL avec `unaccent`).
  'leader price',
  'intermarche',
  'cora',
  'geant casino',
  'hyper u',
  'lidl',
  'casino',
  'spar',
  'maxi',
  'jumbo',         // Jumbo — grande enseigne discount GP/MQ (groupe GBH/Vivalya)
  'carrefour',     // Carrefour Market DOM (GP/MQ/RE/GF)
  'simply',        // Simply Market DOM (devenu Carrefour Market dans certains territoires)
  'match',         // Match DOM — enseigne nord présente en GP
  'aldi',          // Aldi — présent en GP (Baie-Mahault/Les Abymes 2022-2023) et MQ (Le Lamentin 2023)
  'score',         // Score / Jumbo Score — La Réunion (groupe LEAL, leader de la grande distribution RE)
  'monoprix',      // Monoprix — présent en Martinique (Fort-de-France)
  'ecomax',        // Ecomax — enseigne discount Antilles (GP/MQ)
  'lolo',          // Lolo — petites épiceries locales de quartier typiques des DOM (Antilles/Réunion)
  'auchan',        // Auchan — présent à La Réunion (Grand Saint-Denis) depuis 2012
  'franprix',      // Franprix — supérettes franchisées présentes en Martinique (Fort-de-France)
  'netto',         // Netto — enseigne discount du groupe U, présente en GP/MQ/RE
  'u express',     // U Express — supérettes de proximité réseau U (GP/MQ/RE/GF)
  'coccinelle',    // Coccinelle / Vival — réseau de petites épiceries U, Antilles/Réunion
  'g20',           // G20 — supérettes groupe Casino présentes dans les DOM urbains (GP/MQ/RE)
  'tropic',        // Tropic / Carib — enseignes/épiceries d'import-distribution locales DOM
];

/** Pause entre les requêtes API pour respecter les rate limits */
const REQUEST_DELAY_MS = 500;

// ─── Helpers de normalisation ─────────────────────────────────────────────────

/**
 * Normalise un item Open Prices en FoodPriceEntry.
 * @param {any}    item
 * @param {string} territory  Code territoire (ex: 'GP')
 * @returns {FoodPriceEntry}
 */
function normalizeItem(item, territory) {
  const price = parseFloat(item.price ?? '0');
  return {
    ean:           item.product_code ?? item.code ?? '',
    productName:   item.product?.product_name ?? item.product_name ?? 'Produit inconnu',
    brand:         item.product?.brands ?? '',
    category:      (item.product?.categories_tags ?? [])[0]?.replace('en:', '').replace('fr:', '') ?? '',
    territory,
    price:         Math.round(price * 100) / 100,
    currency:      item.currency ?? 'EUR',
    store:         item.location?.osm_name ?? item.location?.name ?? '',
    city:          item.location?.city ?? '',
    date:          item.date ?? new Date().toISOString().slice(0, 10),
    source:        'prices.openfoodfacts.org',
    nutritionGrade: item.product?.nutrition_grades ?? '',
  };
}

// ─── Fetch par pays ───────────────────────────────────────────────────────────

/**
 * Récupère les prix récents pour un pays DOM depuis Open Prices API,
 * avec pagination (max `maxPages` pages de 100 résultats) et ré-essais automatiques.
 * @param {string} countryCode  ex: 'GP'
 * @param {number} maxPages     nombre maximal de pages à charger
 * @returns {Promise<any[]>}
 */
async function fetchOpenPricesByCountry(countryCode, maxPages) {
  const pageSize = 100; // API cap
  const all = [];

  for (let page = 1; page <= maxPages; page++) {
    const url =
      `https://prices.openfoodfacts.org/api/v1/prices?` +
      `location_country=${countryCode}&order_by=-date&size=${pageSize}&page=${page}`;

    const data = await fetchJSONWithRetry(url, `OpenPrices ${countryCode} p${page}`, 'food');
    const items = data?.items ?? [];
    all.push(...items);

    // Stop early if the page was not full (last page)
    if (items.length < pageSize) break;

    await sleep(REQUEST_DELAY_MS);
  }

  return all;
}

// ─── Fetch par enseigne ───────────────────────────────────────────────────────

/**
 * Récupère les prix pour une enseigne donnée dans un pays DOM
 * via le filtre `location_name__icontains` de l'API Open Prices.
 *
 * Ce filtre cible spécifiquement les enseignes (Leader Price, Intermarché, Cora…)
 * qui ne sont pas couvertes par les requêtes génériques par pays.
 *
 * @param {string} retailerName  Nom ou fragment de nom (ex: 'leader price')
 * @param {string} countryCode   Code pays (ex: 'GP')
 * @param {number} maxPages      Nombre de pages à charger
 * @returns {Promise<any[]>}
 */
async function fetchOpenPricesByRetailerName(retailerName, countryCode, maxPages) {
  const pageSize = 100;
  const all = [];
  const encodedName = encodeURIComponent(retailerName);

  for (let page = 1; page <= maxPages; page++) {
    const url =
      `https://prices.openfoodfacts.org/api/v1/prices?` +
      `location_country=${countryCode}` +
      `&location_name__icontains=${encodedName}` +
      `&order_by=-date&size=${pageSize}&page=${page}`;

    const data = await fetchJSONWithRetry(
      url,
      `OpenPrices ${countryCode} "${retailerName}" p${page}`,
      'food',
    );
    const items = data?.items ?? [];
    all.push(...items);

    if (items.length < pageSize) break;

    await sleep(REQUEST_DELAY_MS);
  }

  return all;
}

// ─── Fetch par OSM ID ─────────────────────────────────────────────────────────

/**
 * Récupère les prix pour un magasin spécifique via son OSM ID.
 * Utilisé en mode deep-scan avec les stores découverts par Overpass.
 *
 * @param {string} osmId
 * @param {string} territory  Code territoire pour normalisation
 * @returns {Promise<any[]>}
 */
async function fetchOpenPricesByOsmId(osmId, territory) {
  const url =
    `https://prices.openfoodfacts.org/api/v1/prices?` +
    `location_osm_id=${osmId}&order_by=-date&size=100`;

  const data = await fetchJSONWithRetry(url, `OpenPrices OSM ${osmId}`, 'food');
  return data?.items ?? [];
}

// ─── Enrichissement EAN ───────────────────────────────────────────────────────

/**
 * Enrichit un EAN avec les données Open Food Facts (nom, marque, catégorie, nutri-grade).
 * @param {string} ean
 */
async function fetchProductInfo(ean) {
  const url = `https://world.openfoodfacts.org/api/v2/product/${ean}?fields=product_name,brands,categories_tags,nutrition_grades`;
  const data = await fetchJSONWithRetry(url, `OFF EAN ${ean}`, 'food');
  if (!data?.product) return null;
  const p = data.product;
  return {
    name: p.product_name ?? '',
    brand: p.brands ?? '',
    category: (p.categories_tags ?? [])[0]?.replace('en:', '').replace('fr:', '') ?? '',
    nutritionGrade: p.nutrition_grades ?? '',
  };
}

// ─── Normalisation et déduplication ──────────────────────────────────────────

/**
 * Ajoute un item à la liste de résultats en vérifiant les invariants.
 * Retourne true si l'item a été ajouté.
 *
 * @param {FoodPriceEntry[]} entries
 * @param {any}    item
 * @param {string} territory
 * @returns {boolean}
 */
function addEntry(entries, item, territory) {
  const ean   = item.product_code ?? item.code ?? '';
  const price = parseFloat(item.price ?? '0');
  if (!ean || price <= 0 || price > 500) return false;

  entries.push(normalizeItem(item, territory));
  return true;
}

// ─── Main scraper ─────────────────────────────────────────────────────────────

/**
 * Main food scraper — fetches recent DOM-TOM food prices from Open Prices.
 *
 * @param {{ deepScan?: boolean }} [options]
 *   deepScan : true → pagination étendue (10 pages) + filtres enseigne +
 *              découverte OSM via Overpass (hebdomadaire)
 *              false (défaut) → 3 pages + filtres enseigne (2 pages chacun)
 * @returns {Promise<FoodPriceEntry[]>}
 */
export async function scrapeFoodPrices({ deepScan = false } = {}) {
  const modeLabel   = deepScan ? 'DEEP-SCAN' : 'normal';
  const countryPages  = deepScan ? 10 : 3;
  const retailerPages = deepScan ? 5  : 2;

  console.log(`  🥦 [food] Scraping Open Prices DOM-TOM (mode: ${modeLabel})…`);

  /** @type {FoodPriceEntry[]} */
  const entries  = [];
  const seenEans = new Set();

  // ── 1. Fetch par pays ────────────────────────────────────────────────────
  console.log(`  📄 [food] Fetch par pays (${countryPages} pages/territoire)…`);
  for (const [territoryCode, countryCode] of Object.entries(DOM_COUNTRIES)) {
    console.log(`  📡 [food] Open Prices pays → ${territoryCode}…`);
    const items = await fetchOpenPricesByCountry(countryCode, countryPages);
    console.log(`       ${items.length} relevés trouvés`);

    for (const item of items) {
      addEntry(entries, item, territoryCode);
    }

    await sleep(REQUEST_DELAY_MS);
  }

  const afterCountry = entries.length;
  console.log(`  ✅ [food] Après fetch pays : ${afterCountry} entrées`);

  // ── 2. Fetch par enseigne (filtre location_name__icontains) ──────────────
  console.log(`  🏪 [food] Fetch par enseigne (${retailerPages} pages/enseigne/territoire)…`);
  for (const retailer of RETAILER_NAME_FILTERS) {
    for (const [territoryCode, countryCode] of Object.entries(DOM_COUNTRIES)) {
      const items = await fetchOpenPricesByRetailerName(retailer, countryCode, retailerPages);
      if (items.length > 0) {
        console.log(`       ${items.length} relevés "${retailer}" → ${territoryCode}`);
      }

      for (const item of items) {
        addEntry(entries, item, territoryCode);
      }

      await sleep(REQUEST_DELAY_MS);
    }
  }

  const afterRetailer = entries.length;
  const newFromRetailer = afterRetailer - afterCountry;
  console.log(`  ✅ [food] Après fetch enseignes : +${newFromRetailer} entrées supplémentaires`);

  // ── 3. Deep-scan : fetch par OSM IDs découverts via Overpass ────────────
  if (deepScan) {
    console.log('  🗺️  [food] Deep-scan : découverte des magasins via Overpass…');
    let osmEntries = 0;

    try {
      const stores = await discoverDOMStores();
      console.log(`  📦 [food] ${stores.length} magasins OSM à interroger…`);

      for (const store of stores) {
        const items = await fetchOpenPricesByOsmId(store.osmId, store.territory);
        if (items.length > 0) {
          console.log(`       ${items.length} relevés OSM ${store.osmId} (${store.retailer}, ${store.territory})`);
          for (const item of items) {
            if (addEntry(entries, item, store.territory)) osmEntries++;
          }
        }

        await sleep(REQUEST_DELAY_MS);
      }
    } catch (err) {
      // Overpass est optionnel — une erreur ne doit pas bloquer le scraping principal
      console.log(`  ⚠️  [food] Overpass échoué (${err.message}) — ignoré`);
    }

    console.log(`  ✅ [food] Après fetch OSM : +${osmEntries} entrées supplémentaires`);
  }

  // ── 4. Enrichissement EAN inconnus via Open Food Facts ───────────────────
  let enriched = 0;
  for (const entry of entries) {
    if (seenEans.has(entry.ean) || entry.productName.trim()) continue;
    seenEans.add(entry.ean);
    await sleep(REQUEST_DELAY_MS);
    const info = await fetchProductInfo(entry.ean);
    if (info) {
      entry.productName    = info.name  || entry.productName;
      entry.brand          = info.brand || entry.brand;
      entry.category       = info.category || entry.category;
      entry.nutritionGrade = info.nutritionGrade || entry.nutritionGrade;
      enriched++;
    }
  }
  if (enriched > 0) {
    console.log(`  🔬 [food] ${enriched} EAN enrichis via Open Food Facts`);
  }

  console.log(`  📊 [food] ${entries.length} relevés alimentaires collectés au total`);
  return entries;
}
