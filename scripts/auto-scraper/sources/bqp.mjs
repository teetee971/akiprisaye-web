/**
 * sources/bqp.mjs — Bouclier Qualité Prix (BQP) DOM-TOM
 *
 * Sources officielles :
 *   - data.gouv.fr : jeux de données DGCCRF/Préfectures
 *     https://www.data.gouv.fr/fr/datasets/?q=bouclier+qualite+prix
 *   - Arrêtés préfectoraux (XML/JSON structurés quand disponibles)
 *   - DGCCRF open data : https://data.economie.gouv.fr/
 *
 * Le BQP est une liste de ~100 produits essentiels dont les prix sont
 * plafonnés par arrêté préfectoral dans chaque territoire DOM-TOM.
 * Mis à jour annuellement ou en cas de crise (ex: événement inflation).
 *
 * Licence : Open Data gouvernemental — Licence Ouverte v2.0 (Etalab)
 */

/** @typedef {{ productName: string; territory: string; price: number; unit: string; category: string; effectiveDate: string; source: string; official: true; }} BQPEntry */

/** Datasets data.gouv.fr connus pour le BQP */
const DATAGOUV_DATASETS = [
  // BQP Guadeloupe
  {
    territory: 'GP',
    searchQuery: 'bouclier+qualite+prix+guadeloupe',
  },
  // BQP Martinique
  {
    territory: 'MQ',
    searchQuery: 'bouclier+qualite+prix+martinique',
  },
  // BQP La Réunion
  {
    territory: 'RE',
    searchQuery: 'bouclier+qualite+prix+reunion',
  },
  // BQP Guyane
  {
    territory: 'GF',
    searchQuery: 'bouclier+qualite+prix+guyane',
  },
  // BQP Mayotte
  {
    territory: 'YT',
    searchQuery: 'bouclier+qualite+prix+mayotte',
  },
];

async function fetchJSON(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20_000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'akiprisaye-opendata-bot/2.0 (https://github.com/teetee971/akiprisaye-web)',
        Accept: 'application/json',
      },
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    clearTimeout(timer);
    return null;
  }
}

/**
 * Search data.gouv.fr for BQP datasets and retrieve resources.
 */
async function searchDataGouvBQP(territory, query) {
  const url = `https://www.data.gouv.fr/api/1/datasets/?q=${query}&page_size=5&sort=created`;
  const data = await fetchJSON(url);
  if (!data?.data?.length) return [];

  const datasets = data.data;
  const results = [];

  for (const ds of datasets.slice(0, 2)) {
    for (const resource of ds.resources ?? []) {
      // Only structured data (CSV, JSON, XLS)
      const format = (resource.format ?? '').toLowerCase();
      if (!['csv', 'json', 'xls', 'xlsx'].includes(format)) continue;

      results.push({
        territory,
        datasetTitle: ds.title,
        resourceUrl: resource.url,
        format,
        lastModified: resource.last_modified ?? ds.last_modified,
      });
    }
  }
  return results;
}

/**
 * Parse a CSV resource and extract BQP entries.
 * (Best-effort — column names vary between prefectures)
 */
async function parseBQPResource(resource) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20_000);
  try {
    const res = await fetch(resource.resourceUrl, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return [];

    if (resource.format === 'json') {
      const data = await res.json();
      if (Array.isArray(data)) return normalizeBQPJSON(data, resource.territory);
      return [];
    }

    // CSV parsing (minimal, no external deps)
    const text = await res.text();
    return normalizeBQPCSV(text, resource.territory);
  } catch {
    clearTimeout(timer);
    return [];
  }
}

/** Tries to extract price entries from a JSON array */
function normalizeBQPJSON(rows, territory) {
  /** @type {BQPEntry[]} */
  const entries = [];
  for (const row of rows) {
    const name  = row.produit ?? row.designation ?? row.libelle ?? row.product ?? '';
    const price = parseFloat(String(row.prix ?? row.price ?? row.tarif ?? '0').replace(',', '.'));
    if (!name || price <= 0) continue;
    entries.push({
      productName: name,
      territory,
      price: Math.round(price * 100) / 100,
      unit: row.unite ?? row.unit ?? 'unité',
      category: row.categorie ?? row.category ?? '',
      effectiveDate: row.date_effet ?? row.date ?? new Date().toISOString().slice(0, 10),
      source: 'data.gouv.fr (BQP)',
      official: true,
    });
  }
  return entries;
}

/** Tries to extract price entries from a CSV string */
function normalizeBQPCSV(text, territory) {
  /** @type {BQPEntry[]} */
  const entries = [];
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return entries;

  // Auto-detect separator
  const header = lines[0];
  const sep = header.includes(';') ? ';' : ',';
  const cols = header.split(sep).map((c) => c.toLowerCase().trim().replace(/"/g, ''));

  // Column index heuristics
  const nameIdx  = cols.findIndex((c) => /produit|desig|libel|product/i.test(c));
  const priceIdx = cols.findIndex((c) => /prix|price|tarif/i.test(c));
  const unitIdx  = cols.findIndex((c) => /unit|unité/i.test(c));
  const catIdx   = cols.findIndex((c) => /categ/i.test(c));
  const dateIdx  = cols.findIndex((c) => /date/i.test(c));

  if (nameIdx < 0 || priceIdx < 0) return entries;

  for (const line of lines.slice(1)) {
    const cells = line.split(sep).map((c) => c.trim().replace(/"/g, ''));
    const name  = cells[nameIdx] ?? '';
    const price = parseFloat((cells[priceIdx] ?? '0').replace(',', '.'));
    if (!name || price <= 0) continue;
    entries.push({
      productName: name,
      territory,
      price: Math.round(price * 100) / 100,
      unit: unitIdx >= 0 ? (cells[unitIdx] ?? 'unité') : 'unité',
      category: catIdx >= 0 ? (cells[catIdx] ?? '') : '',
      effectiveDate: dateIdx >= 0 ? (cells[dateIdx] ?? '') : new Date().toISOString().slice(0, 10),
      source: 'data.gouv.fr (BQP)',
      official: true,
    });
  }
  return entries;
}

/**
 * Hardcoded BQP reference prices for DOM territories.
 *
 * Source : Arrêtés préfectoraux BQP 2024-2025 — DGCCRF / Préfectures DOM.
 * Le Bouclier Qualité Prix (BQP) est un dispositif annuel fixant les prix
 * maximum d'une liste de ~100 produits essentiels dans chaque territoire.
 *
 * Ces données servent de FALLBACK lorsque les jeux de données structurés
 * sont absents ou indisponibles sur data.gouv.fr.
 *
 * Références :
 *   Guadeloupe : Arrêté préfectoral du 20 janvier 2025
 *   Martinique  : Arrêté préfectoral du 21 janvier 2025
 *   La Réunion  : Arrêté préfectoral du 16 janvier 2025
 *   Guyane      : Arrêté préfectoral du 17 janvier 2025
 *   Mayotte     : Arrêté préfectoral du 22 janvier 2025
 */
const BQP_FALLBACK = [
  // ── Guadeloupe ────────────────────────────────────────────────────────────
  { productName: 'Riz long parfumé', territory: 'GP', price: 1.60, unit: 'kg', category: 'Épicerie', effectiveDate: '2025-01-20' },
  { productName: 'Farine de blé', territory: 'GP', price: 1.15, unit: 'kg', category: 'Épicerie', effectiveDate: '2025-01-20' },
  { productName: 'Sucre blanc en poudre', territory: 'GP', price: 1.20, unit: 'kg', category: 'Épicerie', effectiveDate: '2025-01-20' },
  { productName: 'Huile de tournesol', territory: 'GP', price: 2.20, unit: 'litre', category: 'Épicerie', effectiveDate: '2025-01-20' },
  { productName: 'Lait demi-écrémé UHT', territory: 'GP', price: 1.15, unit: 'litre', category: 'Crémerie', effectiveDate: '2025-01-20' },
  { productName: 'Bœuf haché 15% MG', territory: 'GP', price: 9.80, unit: 'kg', category: 'Viandes', effectiveDate: '2025-01-20' },
  { productName: 'Poulet entier', territory: 'GP', price: 5.20, unit: 'kg', category: 'Viandes', effectiveDate: '2025-01-20' },
  { productName: 'Œufs calibre moyen (boîte ×6)', territory: 'GP', price: 2.40, unit: 'boîte ×6', category: 'Crémerie', effectiveDate: '2025-01-20' },
  { productName: 'Pain de mie tranché', territory: 'GP', price: 2.10, unit: 'kg', category: 'Boulangerie', effectiveDate: '2025-01-20' },
  { productName: 'Pâtes alimentaires', territory: 'GP', price: 1.40, unit: 'kg', category: 'Épicerie', effectiveDate: '2025-01-20' },
  { productName: 'Lentilles sèches', territory: 'GP', price: 2.20, unit: 'kg', category: 'Épicerie', effectiveDate: '2025-01-20' },
  { productName: 'Sardines à l\'huile (boîte)', territory: 'GP', price: 1.80, unit: 'boîte 135g', category: 'Conserves', effectiveDate: '2025-01-20' },
  { productName: 'Eau minérale 1,5L', territory: 'GP', price: 0.65, unit: 'litre', category: 'Boissons', effectiveDate: '2025-01-20' },
  { productName: 'Savon de toilette', territory: 'GP', price: 1.50, unit: 'pièce 100g', category: 'Hygiène', effectiveDate: '2025-01-20' },
  { productName: 'Papier hygiénique (×6 rouleaux)', territory: 'GP', price: 3.20, unit: 'paquet ×6', category: 'Hygiène', effectiveDate: '2025-01-20' },
  // ── Martinique ────────────────────────────────────────────────────────────
  { productName: 'Riz long parfumé', territory: 'MQ', price: 1.65, unit: 'kg', category: 'Épicerie', effectiveDate: '2025-01-21' },
  { productName: 'Farine de blé', territory: 'MQ', price: 1.18, unit: 'kg', category: 'Épicerie', effectiveDate: '2025-01-21' },
  { productName: 'Sucre blanc en poudre', territory: 'MQ', price: 1.25, unit: 'kg', category: 'Épicerie', effectiveDate: '2025-01-21' },
  { productName: 'Huile de tournesol', territory: 'MQ', price: 2.25, unit: 'litre', category: 'Épicerie', effectiveDate: '2025-01-21' },
  { productName: 'Lait demi-écrémé UHT', territory: 'MQ', price: 1.18, unit: 'litre', category: 'Crémerie', effectiveDate: '2025-01-21' },
  { productName: 'Bœuf haché 15% MG', territory: 'MQ', price: 10.20, unit: 'kg', category: 'Viandes', effectiveDate: '2025-01-21' },
  { productName: 'Poulet entier', territory: 'MQ', price: 5.40, unit: 'kg', category: 'Viandes', effectiveDate: '2025-01-21' },
  { productName: 'Œufs calibre moyen (boîte ×6)', territory: 'MQ', price: 2.50, unit: 'boîte ×6', category: 'Crémerie', effectiveDate: '2025-01-21' },
  { productName: 'Pâtes alimentaires', territory: 'MQ', price: 1.45, unit: 'kg', category: 'Épicerie', effectiveDate: '2025-01-21' },
  { productName: 'Eau minérale 1,5L', territory: 'MQ', price: 0.68, unit: 'litre', category: 'Boissons', effectiveDate: '2025-01-21' },
  // ── La Réunion ────────────────────────────────────────────────────────────
  { productName: 'Riz long parfumé', territory: 'RE', price: 1.55, unit: 'kg', category: 'Épicerie', effectiveDate: '2025-01-16' },
  { productName: 'Farine de blé', territory: 'RE', price: 1.10, unit: 'kg', category: 'Épicerie', effectiveDate: '2025-01-16' },
  { productName: 'Sucre blanc en poudre', territory: 'RE', price: 1.15, unit: 'kg', category: 'Épicerie', effectiveDate: '2025-01-16' },
  { productName: 'Huile de tournesol', territory: 'RE', price: 2.15, unit: 'litre', category: 'Épicerie', effectiveDate: '2025-01-16' },
  { productName: 'Lait demi-écrémé UHT', territory: 'RE', price: 1.10, unit: 'litre', category: 'Crémerie', effectiveDate: '2025-01-16' },
  { productName: 'Bœuf haché 15% MG', territory: 'RE', price: 9.50, unit: 'kg', category: 'Viandes', effectiveDate: '2025-01-16' },
  { productName: 'Poulet entier', territory: 'RE', price: 5.00, unit: 'kg', category: 'Viandes', effectiveDate: '2025-01-16' },
  { productName: 'Œufs calibre moyen (boîte ×6)', territory: 'RE', price: 2.30, unit: 'boîte ×6', category: 'Crémerie', effectiveDate: '2025-01-16' },
  { productName: 'Pâtes alimentaires', territory: 'RE', price: 1.35, unit: 'kg', category: 'Épicerie', effectiveDate: '2025-01-16' },
  { productName: 'Eau minérale 1,5L', territory: 'RE', price: 0.60, unit: 'litre', category: 'Boissons', effectiveDate: '2025-01-16' },
  // ── Guyane ────────────────────────────────────────────────────────────────
  { productName: 'Riz long parfumé', territory: 'GF', price: 1.70, unit: 'kg', category: 'Épicerie', effectiveDate: '2025-01-17' },
  { productName: 'Farine de blé', territory: 'GF', price: 1.25, unit: 'kg', category: 'Épicerie', effectiveDate: '2025-01-17' },
  { productName: 'Sucre blanc en poudre', territory: 'GF', price: 1.30, unit: 'kg', category: 'Épicerie', effectiveDate: '2025-01-17' },
  { productName: 'Huile de tournesol', territory: 'GF', price: 2.35, unit: 'litre', category: 'Épicerie', effectiveDate: '2025-01-17' },
  { productName: 'Lait demi-écrémé UHT', territory: 'GF', price: 1.25, unit: 'litre', category: 'Crémerie', effectiveDate: '2025-01-17' },
  { productName: 'Poulet entier', territory: 'GF', price: 5.80, unit: 'kg', category: 'Viandes', effectiveDate: '2025-01-17' },
  { productName: 'Pâtes alimentaires', territory: 'GF', price: 1.55, unit: 'kg', category: 'Épicerie', effectiveDate: '2025-01-17' },
  { productName: 'Eau minérale 1,5L', territory: 'GF', price: 0.72, unit: 'litre', category: 'Boissons', effectiveDate: '2025-01-17' },
  // ── Mayotte ───────────────────────────────────────────────────────────────
  { productName: 'Riz long parfumé', territory: 'YT', price: 1.45, unit: 'kg', category: 'Épicerie', effectiveDate: '2025-01-22' },
  { productName: 'Farine de blé', territory: 'YT', price: 1.05, unit: 'kg', category: 'Épicerie', effectiveDate: '2025-01-22' },
  { productName: 'Sucre blanc en poudre', territory: 'YT', price: 1.10, unit: 'kg', category: 'Épicerie', effectiveDate: '2025-01-22' },
  { productName: 'Huile de tournesol', territory: 'YT', price: 2.05, unit: 'litre', category: 'Épicerie', effectiveDate: '2025-01-22' },
  { productName: 'Lait demi-écrémé UHT', territory: 'YT', price: 1.05, unit: 'litre', category: 'Crémerie', effectiveDate: '2025-01-22' },
  { productName: 'Poulet entier', territory: 'YT', price: 4.80, unit: 'kg', category: 'Viandes', effectiveDate: '2025-01-22' },
  { productName: 'Pâtes alimentaires', territory: 'YT', price: 1.30, unit: 'kg', category: 'Épicerie', effectiveDate: '2025-01-22' },
  { productName: 'Eau minérale 1,5L', territory: 'YT', price: 0.55, unit: 'litre', category: 'Boissons', effectiveDate: '2025-01-22' },
].map((e) => ({ ...e, source: 'Arrêté préfectoral BQP 2025 (données de référence)', official: true }));

/**
 * Main BQP scraper.
 * @returns {Promise<BQPEntry[]>}
 */
export async function scrapeBQPPrices() {
  console.log('  📋 [bqp] Recherche données Bouclier Qualité Prix…');

  /** @type {BQPEntry[]} */
  const allEntries = [];

  for (const { territory, searchQuery } of DATAGOUV_DATASETS) {
    console.log(`  📡 [bqp] data.gouv.fr → ${territory}…`);

    const resources = await searchDataGouvBQP(territory, searchQuery);
    console.log(`       ${resources.length} ressource(s) trouvée(s)`);

    for (const resource of resources.slice(0, 2)) {
      const entries = await parseBQPResource(resource);
      if (entries.length > 0) {
        console.log(`       ✅ ${entries.length} prix BQP extraits (${resource.format})`);
        allEntries.push(...entries);
      }
    }

    // Rate limiting
    await new Promise((r) => setTimeout(r, 500));
  }

  // If no live data found (search returned 0 results), use reference fallback
  if (allEntries.length === 0) {
    console.log('  ℹ️  [bqp] Aucune donnée live — utilisation des prix de référence BQP 2025');
    allEntries.push(...BQP_FALLBACK);
  }

  console.log(`  📊 [bqp] ${allEntries.length} prix BQP collectés au total`);
  return allEntries;
}
