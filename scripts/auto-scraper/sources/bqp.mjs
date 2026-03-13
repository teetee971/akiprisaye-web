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

  console.log(`  📊 [bqp] ${allEntries.length} prix BQP collectés au total`);
  return allEntries;
}
