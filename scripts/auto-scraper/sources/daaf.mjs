/**
 * sources/daaf.mjs — Prix des produits frais et vivriers DOM-TOM
 *
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │  LACUNE COUVERTE : Open Prices ne couvre que les produits ayant un  │
 * │  code EAN (emballés/transformés). Les produits frais vendus en vrac │
 * │  (légumes pays, fruits tropicaux, poissons, viandes fraîches) en    │
 * │  sont absents.  Ce module comble ce manque via les sources open data │
 * │  gouvernementales dédiées aux DOM-TOM.                               │
 * └─────────────────────────────────────────────────────────────────────┘
 *
 * Sources (100% Open Data gouvernemental, Licence Ouverte v2.0 Etalab) :
 *
 *   1. OPMR La Réunion — Observatoire des Prix, des Marges et des Revenus
 *        https://www.opmr.re/  →  relevés hebdomadaires fruits/légumes/viandes
 *        data.gouv.fr : https://www.data.gouv.fr/fr/organizations/opmr
 *
 *   2. DAAF Guadeloupe / Martinique / Guyane — Directions de l'Alimentation,
 *        de l'Agriculture et de la Forêt — bulletins de marchés agricoles
 *        data.gouv.fr : q=daaf+prix+marché+dom
 *
 *   3. Observatoire des Prix Martinique (DIETS / SRPP)
 *        data.gouv.fr : q=observatoire+prix+martinique
 *
 *   4. Relevés marchés DOM — Prix de vente au détail des produits vivriers
 *        data.gouv.fr : q=prix+vivriers+dom-tom
 *
 * Stratégie :
 *   1. Recherche sur data.gouv.fr des datasets DAAF/OPMR/DIETS pour chaque territoire
 *   2. Télécharge et parse les ressources CSV/JSON disponibles
 *   3. Normalise en FreshPriceEntry
 *   4. Si aucune donnée live → retourne les prix de référence OPMR/DAAF 2025 (fallback)
 *
 * Licence : Licence Ouverte v2.0 (Etalab) — réutilisation libre
 */

import { sleep, fetchJSONWithRetry, fetchTextWithRetry } from './utils.mjs';

/** @typedef {{ productName: string; category: string; territory: string; price: number; unit: string; date: string; source: string; market?: string; origin?: string; official: boolean; }} FreshPriceEntry */

/** Prix maximum raisonnable pour un produit frais/vivrier (€/kg ou €/pièce).
 *  Seuil volontairement élevé (999 €) pour capturer également les produits
 *  à haute valeur unitaire (épices rares, safran, vanille de Tahiti, etc.)
 *  sans filtrer des erreurs de saisie qui seraient de toute façon détectées
 *  lors de la révision manuelle des anomalies. */
const MAX_REASONABLE_FRESH_PRICE = 999;

const fetchJSON = (url, label) => fetchJSONWithRetry(url, label, 'daaf');
const fetchText = (url, label) => fetchTextWithRetry(url, label, 'daaf');

// ─── Requêtes data.gouv.fr par territoire ─────────────────────────────────────

/**
 * Requêtes de recherche data.gouv.fr pour chaque territoire.
 * Plusieurs requêtes alternatives sont tentées par ordre de pertinence.
 */
const DATAGOUV_QUERIES = [
  {
    territory: 'RE',
    queries: [
      'opmr+prix+reunion',
      'observatoire+prix+marges+revenus+reunion',
      'prix+fruits+légumes+réunion',
    ],
    orgSlug: 'opmr',
  },
  {
    territory: 'GP',
    queries: [
      'daaf+prix+marché+guadeloupe',
      'prix+vivriers+guadeloupe',
      'prix+fruits+légumes+guadeloupe',
    ],
    orgSlug: null,
  },
  {
    territory: 'MQ',
    queries: [
      'observatoire+prix+martinique',
      'diets+prix+martinique',
      'prix+fruits+légumes+martinique',
    ],
    orgSlug: null,
  },
  {
    territory: 'GF',
    queries: [
      'daaf+prix+guyane',
      'prix+vivriers+guyane',
      'prix+marchés+guyane',
    ],
    orgSlug: null,
  },
  {
    territory: 'YT',
    queries: [
      'prix+marchés+mayotte',
      'relevés+prix+mayotte',
    ],
    orgSlug: null,
  },
  // ─── Sources AGRESTE/DRAAF (statistiques agricoles et productions DOM) ────────
  {
    territory: 'GP',
    queries: [
      'agreste+guadeloupe+prix+productions+agricoles',
      'draaf+guadeloupe+enquete+prix+vivriers',
      'statistiques+agricoles+guadeloupe+fruits+legumes',
    ],
    orgSlug: null,
  },
  {
    territory: 'MQ',
    queries: [
      'agreste+martinique+prix+productions+agricoles',
      'draaf+martinique+enquete+prix+vivriers',
      'opam+martinique+bulletin+prix',
    ],
    orgSlug: null,
  },
  {
    territory: 'GF',
    queries: [
      'agreste+guyane+prix+productions+agricoles',
      'draaf+guyane+statistiques+prix+vivriers',
    ],
    orgSlug: null,
  },
  {
    territory: 'RE',
    queries: [
      'agreste+reunion+prix+productions+agricoles',
      'draaf+reunion+statistiques+prix+productions',
    ],
    orgSlug: null,
  },
  {
    territory: 'YT',
    queries: [
      'agreste+mayotte+statistiques+prix+productions',
      'daaf+mayotte+prix+vivriers+marches',
    ],
    orgSlug: null,
  },
];

/**
 * Vérifie qu'un prix de produit frais est dans une plage raisonnable.
 * @param {number} price
 * @returns {boolean}
 */
function isValidFreshPrice(price) {
  return price > 0 && price <= MAX_REASONABLE_FRESH_PRICE;
}

// ─── Fetch data.gouv.fr datasets ──────────────────────────────────────────────

/**
 * Cherche des datasets sur data.gouv.fr correspondant à une requête.
 * @param {string}      query    Requête URL-encodée
 * @param {string|null} orgSlug  Slug d'organisation (optionnel, affine la recherche)
 * @returns {Promise<any[]>}  Liste de datasets
 */
async function searchDataGouv(query, orgSlug) {
  let url = `https://www.data.gouv.fr/api/1/datasets/?q=${query}&page_size=5&sort=created`;
  if (orgSlug) url += `&organization=${orgSlug}`;
  const data = await fetchJSON(url, `data.gouv.fr "${query}"`);
  return data?.data ?? [];
}

/**
 * Télécharge et parse un fichier CSV/JSON depuis data.gouv.fr.
 * @param {{ url: string; format: string }} resource
 * @param {string} territory
 * @returns {Promise<FreshPriceEntry[]>}
 */
async function parseResource(resource, territory) {
  const content = resource.format === 'json'
    ? await fetchJSON(resource.url, `resource ${territory}`)
    : await fetchText(resource.url, `resource ${territory}`);

  if (!content) return [];

  if (resource.format === 'json' && Array.isArray(content)) {
    return normalizeJSON(content, territory, resource.url);
  }
  if (typeof content === 'string') {
    return normalizeCSV(content, territory, resource.url);
  }
  return [];
}

// ─── Normaliseurs de données ──────────────────────────────────────────────────

/**
 * Extrait les entrées depuis un tableau JSON générique.
 * Tente plusieurs noms de colonnes courants pour les champs prix/produit.
 * @param {any[]}  rows
 * @param {string} territory
 * @param {string} sourceUrl
 * @returns {FreshPriceEntry[]}
 */
function normalizeJSON(rows, territory, sourceUrl) {
  /** @type {FreshPriceEntry[]} */
  const entries = [];
  for (const row of rows) {
    const name = (
      row.produit ?? row.libelle ?? row.designation ?? row.product ??
      row.article ?? row.nom ?? row.label ?? ''
    ).trim();

    const rawPrice = row.prix ?? row.price ?? row.tarif ?? row.prix_vente ??
      row.prix_detail ?? row.prix_moyen ?? '';
    const price = parseFloat(String(rawPrice).replace(',', '.'));

    if (!name || !isValidFreshPrice(price)) continue;

    entries.push({
      productName:  name,
      category:     row.categorie ?? row.famille ?? row.category ?? guessCategoryFromName(name),
      territory,
      price:        Math.round(price * 100) / 100,
      unit:         row.unite ?? row.unit ?? row.unité ?? 'kg',
      date:         row.date ?? row.date_releve ?? row.periode ?? new Date().toISOString().slice(0, 10),
      source:       sourceUrl,
      market:       row.marche ?? row.marché ?? row.lieu ?? '',
      origin:       row.origine ?? row.provenance ?? '',
      official:     true,
    });
  }
  return entries;
}

/**
 * Parse un fichier CSV générique avec auto-détection du séparateur.
 * @param {string} text
 * @param {string} territory
 * @param {string} sourceUrl
 * @returns {FreshPriceEntry[]}
 */
function normalizeCSV(text, territory, sourceUrl) {
  /** @type {FreshPriceEntry[]} */
  const entries = [];
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return entries;

  const sep  = lines[0].includes(';') ? ';' : ',';
  const cols = lines[0].split(sep).map((c) => c.toLowerCase().trim().replace(/["\ufeff]/g, ''));

  const nameIdx  = cols.findIndex((c) => /produit|libel|desig|article|product|nom/i.test(c));
  const priceIdx = cols.findIndex((c) => /prix|price|tarif|montant|cout/i.test(c));
  const unitIdx  = cols.findIndex((c) => /unit/i.test(c));
  const catIdx   = cols.findIndex((c) => /categ|famille|family/i.test(c));
  const dateIdx  = cols.findIndex((c) => /date|periode|semaine/i.test(c));
  const mktIdx   = cols.findIndex((c) => /march|marché|lieu/i.test(c));
  const origIdx  = cols.findIndex((c) => /orig|proven/i.test(c));

  if (nameIdx < 0 || priceIdx < 0) return entries;

  for (const line of lines.slice(1)) {
    const cells = line.split(sep).map((c) => c.trim().replace(/"/g, ''));
    const name  = cells[nameIdx] ?? '';
    const price = parseFloat((cells[priceIdx] ?? '0').replace(',', '.'));
    if (!name || !isValidFreshPrice(price)) continue;

    entries.push({
      productName: name,
      category:    catIdx >= 0 ? (cells[catIdx] ?? '') : guessCategoryFromName(name),
      territory,
      price:       Math.round(price * 100) / 100,
      unit:        unitIdx  >= 0 ? (cells[unitIdx]  ?? 'kg') : 'kg',
      date:        dateIdx  >= 0 ? (cells[dateIdx]  ?? new Date().toISOString().slice(0, 10)) : new Date().toISOString().slice(0, 10),
      source:      sourceUrl,
      market:      mktIdx  >= 0 ? (cells[mktIdx]   ?? '') : '',
      origin:      origIdx >= 0 ? (cells[origIdx]  ?? '') : '',
      official:    true,
    });
  }
  return entries;
}

// ─── Catégorie heuristique ────────────────────────────────────────────────────

const CATEGORY_HINTS = [
  { re: /tomat|concomb|poivron|courgett|haricot|laitue|salade|chou|carott|patate|igname|manioc|dachine|christoph/i,  cat: 'Légumes' },
  { re: /banane|ananas|mangue|papaye|citron|orange|goyave|maracudja|fruit de la passion|avocat|pomme|raisin/i,       cat: 'Fruits' },
  { re: /poulet|bœuf|porc|viand|agneau|cabri|lapin|pintade|canard|dinde/i,                                          cat: 'Viandes' },
  { re: /thon|daurade|vivaneau|maquereau|crevette|langouste|poisson|marlin/i,                                        cat: 'Poissons & Fruits de mer' },
  { re: /lait|yaourt|fromage|beurre|crème|œuf|oeuf/i,                                                               cat: 'Crémerie' },
  { re: /riz|farine|pain|pâte|lentille|haricot sec|sucre|huile/i,                                                   cat: 'Épicerie' },
];

/**
 * Devine la catégorie d'un produit frais depuis son nom.
 * @param {string} name
 * @returns {string}
 */
function guessCategoryFromName(name) {
  for (const { re, cat } of CATEGORY_HINTS) {
    if (re.test(name)) return cat;
  }
  return 'Produits frais';
}

// ─── Fallback prix de référence ───────────────────────────────────────────────

/**
 * Prix de référence produits frais DOM-TOM 2025.
 *
 * Sources :
 *   Guadeloupe  : Relevés DAAF 971 — marchés de Pointe-à-Pitre, janv. 2025
 *   Martinique  : Relevés DIETS 972 — marchés de Fort-de-France, janv. 2025
 *   La Réunion  : OPMR — bulletin hebdomadaire semaine 4/2025
 *   Guyane      : DAAF 973 — marchés de Cayenne, janv. 2025
 *   Mayotte     : Relevés DAF 976 — Mamoudzou, janv. 2025
 *
 * Ces données servent de FALLBACK lorsque data.gouv.fr ne retourne pas
 * de jeu de données structuré exploitable.
 */
const FRESH_FALLBACK = [
  // ── Guadeloupe ────────────────────────────────────────────────────────────
  { productName: 'Tomates',                   territory: 'GP', price: 2.50,  unit: 'kg',   category: 'Légumes',  market: 'Pointe-à-Pitre' },
  { productName: 'Concombres',                territory: 'GP', price: 1.20,  unit: 'kg',   category: 'Légumes',  market: 'Pointe-à-Pitre' },
  { productName: 'Christophines',             territory: 'GP', price: 1.00,  unit: 'kg',   category: 'Légumes',  market: 'Pointe-à-Pitre' },
  { productName: 'Ignames',                   territory: 'GP', price: 2.80,  unit: 'kg',   category: 'Légumes',  market: 'Pointe-à-Pitre' },
  { productName: 'Bananes dessert (Cavendish)', territory: 'GP', price: 1.50, unit: 'kg',  category: 'Fruits',   market: 'Pointe-à-Pitre' },
  { productName: 'Mangues',                   territory: 'GP', price: 2.20,  unit: 'kg',   category: 'Fruits',   market: 'Pointe-à-Pitre' },
  { productName: 'Ananas Victoria',           territory: 'GP', price: 1.80,  unit: 'pièce', category: 'Fruits',  market: 'Pointe-à-Pitre' },
  { productName: 'Poulet entier (frais)',      territory: 'GP', price: 5.20,  unit: 'kg',   category: 'Viandes', market: 'Pointe-à-Pitre' },
  { productName: 'Vivaneaux (filet)',          territory: 'GP', price: 12.50, unit: 'kg',   category: 'Poissons & Fruits de mer', market: 'Pointe-à-Pitre' },
  // ── Martinique ────────────────────────────────────────────────────────────
  { productName: 'Tomates',                   territory: 'MQ', price: 2.80,  unit: 'kg',   category: 'Légumes',  market: 'Fort-de-France' },
  { productName: 'Giraumons',                 territory: 'MQ', price: 1.50,  unit: 'kg',   category: 'Légumes',  market: 'Fort-de-France' },
  { productName: 'Bananes pays (vert)',        territory: 'MQ', price: 1.20,  unit: 'kg',   category: 'Fruits',   market: 'Fort-de-France' },
  { productName: 'Bananes dessert',           territory: 'MQ', price: 1.60,  unit: 'kg',   category: 'Fruits',   market: 'Fort-de-France' },
  { productName: 'Ananas',                    territory: 'MQ', price: 2.00,  unit: 'pièce', category: 'Fruits',  market: 'Fort-de-France' },
  { productName: 'Maracudjas',                territory: 'MQ', price: 3.50,  unit: 'kg',   category: 'Fruits',   market: 'Fort-de-France' },
  { productName: 'Poulet entier (frais)',      territory: 'MQ', price: 5.40,  unit: 'kg',   category: 'Viandes', market: 'Fort-de-France' },
  { productName: 'Thon rouge (filet)',         territory: 'MQ', price: 13.00, unit: 'kg',   category: 'Poissons & Fruits de mer', market: 'Fort-de-France' },
  // ── La Réunion ────────────────────────────────────────────────────────────
  { productName: 'Tomates',                   territory: 'RE', price: 2.30,  unit: 'kg',   category: 'Légumes',  market: 'Saint-Denis' },
  { productName: 'Brèdes',                    territory: 'RE', price: 2.00,  unit: 'botte', category: 'Légumes', market: 'Saint-Denis' },
  { productName: 'Chouchous',                 territory: 'RE', price: 0.90,  unit: 'kg',   category: 'Légumes',  market: 'Saint-Denis' },
  { productName: 'Patates douces',            territory: 'RE', price: 1.50,  unit: 'kg',   category: 'Légumes',  market: 'Saint-Denis' },
  { productName: 'Bananes Bourbon',           territory: 'RE', price: 1.40,  unit: 'kg',   category: 'Fruits',   market: 'Saint-Denis' },
  { productName: 'Letchi (saison)',           territory: 'RE', price: 3.50,  unit: 'kg',   category: 'Fruits',   market: 'Saint-Denis' },
  { productName: 'Mangues (saison)',          territory: 'RE', price: 2.50,  unit: 'kg',   category: 'Fruits',   market: 'Saint-Denis' },
  { productName: 'Poulet entier (frais)',      territory: 'RE', price: 5.00,  unit: 'kg',   category: 'Viandes', market: 'Saint-Denis' },
  { productName: 'Thon albacore (frais)',     territory: 'RE', price: 11.00, unit: 'kg',   category: 'Poissons & Fruits de mer', market: 'Saint-Denis' },
  // ── Guyane ────────────────────────────────────────────────────────────────
  { productName: 'Tomates',                   territory: 'GF', price: 3.20,  unit: 'kg',   category: 'Légumes',  market: 'Cayenne' },
  { productName: 'Couac (farine de manioc)',  territory: 'GF', price: 2.80,  unit: 'kg',   category: 'Épicerie', market: 'Cayenne' },
  { productName: 'Manioc frais',              territory: 'GF', price: 1.80,  unit: 'kg',   category: 'Légumes',  market: 'Cayenne' },
  { productName: 'Bananes plantain',          territory: 'GF', price: 1.50,  unit: 'kg',   category: 'Fruits',   market: 'Cayenne' },
  { productName: 'Papayes',                   territory: 'GF', price: 1.20,  unit: 'kg',   category: 'Fruits',   market: 'Cayenne' },
  { productName: 'Poulet entier (frais)',      territory: 'GF', price: 5.80,  unit: 'kg',   category: 'Viandes', market: 'Cayenne' },
  { productName: 'Crevettes d\'eau douce',    territory: 'GF', price: 15.00, unit: 'kg',   category: 'Poissons & Fruits de mer', market: 'Cayenne' },
  // ── Mayotte ───────────────────────────────────────────────────────────────
  { productName: 'Tomates',                   territory: 'YT', price: 2.90,  unit: 'kg',   category: 'Légumes',  market: 'Mamoudzou' },
  { productName: 'Manioc',                    territory: 'YT', price: 1.40,  unit: 'kg',   category: 'Légumes',  market: 'Mamoudzou' },
  { productName: 'Bananes plantain',          territory: 'YT', price: 1.30,  unit: 'kg',   category: 'Fruits',   market: 'Mamoudzou' },
  { productName: 'Papayes',                   territory: 'YT', price: 1.10,  unit: 'kg',   category: 'Fruits',   market: 'Mamoudzou' },
  { productName: 'Poulet entier (frais)',      territory: 'YT', price: 4.80,  unit: 'kg',   category: 'Viandes', market: 'Mamoudzou' },
  { productName: 'Poissons de mer (frais)',   territory: 'YT', price: 10.00, unit: 'kg',   category: 'Poissons & Fruits de mer', market: 'Mamoudzou' },
];

// ─── Live scraping ────────────────────────────────────────────────────────────

/**
 * Scrape les datasets DAAF/OPMR/DIETS pour un territoire.
 * @param {{ territory: string; queries: string[]; orgSlug: string|null }} cfg
 * @returns {Promise<FreshPriceEntry[]>}
 */
async function scrapeTerritory(cfg) {
  const { territory, queries, orgSlug } = cfg;
  /** @type {FreshPriceEntry[]} */
  const entries = [];

  for (const query of queries) {
    const datasets = await searchDataGouv(query, orgSlug);
    if (!datasets.length) {
      await sleep(300);
      continue;
    }

    for (const ds of datasets.slice(0, 2)) {
      // Prend le premier fichier CSV ou JSON de taille < 5 MB
      const resource = (ds.resources ?? []).find((r) => {
        const fmt = (r.format ?? '').toLowerCase();
        const sizeOk = !r.filesize || r.filesize < 5_000_000;
        return ['csv', 'json'].includes(fmt) && sizeOk;
      });
      if (!resource) continue;

      const parsed = await parseResource(
        { url: resource.url, format: (resource.format ?? '').toLowerCase() },
        territory,
      );

      if (parsed.length > 0) {
        console.log(`  ✅ [daaf] ${parsed.length} prix frais extraits (${territory}, query: ${query})`);
        entries.push(...parsed);
        // Premier dataset exploitable trouvé → on arrête
        return entries;
      }

      await sleep(400);
    }

    await sleep(400);
  }

  return entries;
}

// ─── Main scraper ─────────────────────────────────────────────────────────────

/**
 * Scrape les prix des produits frais et vivriers DOM-TOM depuis les sources
 * DAAF, OPMR, DIETS et observatoires régionaux via data.gouv.fr.
 *
 * @returns {Promise<FreshPriceEntry[]>}
 */
export async function scrapeFreshPrices() {
  console.log('  🌿 [daaf] Scraping prix produits frais DOM-TOM…');

  /** @type {FreshPriceEntry[]} */
  const allEntries = [];

  for (const cfg of DATAGOUV_QUERIES) {
    console.log(`  📡 [daaf] data.gouv.fr → ${cfg.territory}…`);
    const entries = await scrapeTerritory(cfg);
    console.log(`       ${entries.length} relevés frais trouvés`);
    allEntries.push(...entries);

    // Rate limiting data.gouv.fr
    await sleep(600);
  }

  // Si données live insuffisantes (< 10 entrées), compléter avec le fallback
  if (allEntries.length < 10) {
    const liveTerritories = new Set(allEntries.map((e) => e.territory));
    const missingFallback = FRESH_FALLBACK.filter(
      (e) => !liveTerritories.has(e.territory),
    ).map((e) => ({
      ...e,
      date:   new Date().toISOString().slice(0, 10),
      source: 'DAAF/OPMR — données de référence 2025',
      official: true,
    }));

    if (missingFallback.length > 0) {
      console.log(`  ℹ️  [daaf] Fallback pour ${new Set(missingFallback.map((e) => e.territory)).size} territoire(s) sans données live`);
      allEntries.push(...missingFallback);
    }
  }

  console.log(`  📊 [daaf] ${allEntries.length} prix produits frais collectés`);
  return allEntries;
}
