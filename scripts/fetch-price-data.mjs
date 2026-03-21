/**
 * fetch-price-data.mjs
 *
 * Step 1 of the data pipeline: fetch raw price observations from all
 * available providers and write a consolidated JSON file.
 *
 * Providers (in priority order):
 *   1. OpenPrices (Open Food Facts crowd-sourced prices) — live API
 *   2. internal    — local JSON catalogues in frontend/public/data/
 *   3. seed        — hardcoded demo data (always appended as fallback)
 *
 * Output: data/output/price-observations.json
 *
 * Usage:
 *   node scripts/fetch-price-data.mjs
 *   node scripts/fetch-price-data.mjs --barcodes=5449000000996,3017620422003
 *   node scripts/fetch-price-data.mjs --limit=50 --output=./out.json
 */

import { writeFileSync, readFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname }                                    from 'node:path';
import { fileURLToPath }                                       from 'node:url';

const HERE    = dirname(fileURLToPath(import.meta.url));
const ROOT    = resolve(HERE, '..');
const OUTPUT  = resolve(process.argv.find(a => a.startsWith('--output='))?.slice(9) ?? ROOT, 'data/output/price-observations.json');
const LIMIT   = parseInt(process.argv.find(a => a.startsWith('--limit='))?.slice(8) ?? '200', 10);
const TIMEOUT = 8_000; // ms per API call

// ── Canonical retailer normalisation map ──────────────────────────────────────

const RETAILER_ALIASES = new Map([
  ['e.leclerc', 'E.Leclerc'], ['leclerc', 'E.Leclerc'], ['eleclerc', 'E.Leclerc'],
  ['carrefour market', 'Carrefour Market'], ['carrefour', 'Carrefour'],
  ['super u', 'Super U'], ['superu', 'Super U'], ['u express', 'Super U'],
  ['intermarché', 'Intermarché'], ['intermarche', 'Intermarché'],
  ['leader price', 'Leader Price'], ['leaderprice', 'Leader Price'],
  ['aldi', 'Aldi'], ['lidl', 'Lidl'], ['casino', 'Casino'],
  ['écomax', 'Écomax'], ['ecomax', 'Écomax'],
]);

const TERRITORY_ALIASES = new Map([
  ['gp', 'gp'], ['guadeloupe', 'gp'], ['971', 'gp'],
  ['mq', 'mq'], ['martinique', 'mq'], ['972', 'mq'],
  ['gf', 'gf'], ['guyane', 'gf'], ['973', 'gf'],
  ['re', 're'], ['réunion', 're'], ['reunion', 're'], ['974', 're'],
]);

function normaliseRetailer(raw) {
  const key = (raw ?? '').toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  for (const [alias, canonical] of RETAILER_ALIASES) {
    if (key.includes(alias)) return canonical;
  }
  return raw ? raw.trim() : 'Inconnu';
}

function normaliseTerritory(raw) {
  const key = (raw ?? '').toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return TERRITORY_ALIASES.get(key) ?? 'gp'; // default Guadeloupe
}

// ── Seed data ─────────────────────────────────────────────────────────────────

const SEED = [
  { productId: '5449000000996', name: 'Coca-Cola 1,5 L',       brand: 'Coca-Cola', retailer: 'E.Leclerc', territory: 'gp', price: 2.49 },
  { productId: '5449000000996', name: 'Coca-Cola 1,5 L',       brand: 'Coca-Cola', retailer: 'Carrefour', territory: 'gp', price: 2.85 },
  { productId: '5449000000996', name: 'Coca-Cola 1,5 L',       brand: 'Coca-Cola', retailer: 'Super U',   territory: 'gp', price: 2.69 },
  { productId: 'riz-blanc-1kg', name: 'Riz blanc 1 kg',        brand: undefined,   retailer: 'E.Leclerc', territory: 'gp', price: 1.99 },
  { productId: 'riz-blanc-1kg', name: 'Riz blanc 1 kg',        brand: undefined,   retailer: 'Carrefour', territory: 'gp', price: 2.45 },
  { productId: 'riz-blanc-1kg', name: 'Riz blanc 1 kg',        brand: undefined,   retailer: 'Super U',   territory: 'gp', price: 2.20 },
  { productId: 'lait-uht-1l',   name: 'Lait UHT 1 L',         brand: undefined,   retailer: 'E.Leclerc', territory: 'gp', price: 1.05 },
  { productId: 'lait-uht-1l',   name: 'Lait UHT 1 L',         brand: undefined,   retailer: 'Carrefour', territory: 'gp', price: 1.35 },
  { productId: 'huile-tsol-1l', name: 'Huile tournesol 1 L',  brand: undefined,   retailer: 'E.Leclerc', territory: 'gp', price: 2.10 },
  { productId: 'huile-tsol-1l', name: 'Huile tournesol 1 L',  brand: undefined,   retailer: 'Carrefour', territory: 'gp', price: 2.65 },
  { productId: 'sucre-crist-1kg', name: 'Sucre cristallisé 1 kg', brand: undefined, retailer: 'E.Leclerc', territory: 'gp', price: 1.15 },
  { productId: 'sucre-crist-1kg', name: 'Sucre cristallisé 1 kg', brand: undefined, retailer: 'Carrefour', territory: 'gp', price: 1.55 },
].map(s => ({
  ...s,
  currency: 'EUR',
  observedAt: new Date().toISOString(),
  source: 'internal',
}));

// ── Provider: internal catalogues ─────────────────────────────────────────────

function loadInternalCatalogues() {
  const candidates = [
    resolve(ROOT, 'frontend/public/data/prices.json'),
    resolve(ROOT, 'frontend/public/data/expanded-prices.json'),
  ];
  const observations = [];
  for (const p of candidates) {
    if (!existsSync(p)) continue;
    try {
      const raw   = JSON.parse(readFileSync(p, 'utf8'));
      const items = Array.isArray(raw) ? raw : Object.values(raw).flat();
      for (const item of items) {
        const price = parseFloat(item.price ?? item.prix ?? 0);
        if (!price || price <= 0) continue;
        observations.push({
          productId:   item.barcode ?? item.id ?? String(item.productLabel ?? 'unknown').toLowerCase().replace(/\s+/g, '-'),
          name:        item.productLabel ?? item.name ?? 'Produit',
          brand:       item.brand ?? undefined,
          retailer:    normaliseRetailer(item.storeName ?? item.retailer),
          territory:   normaliseTerritory(item.territory ?? item.pays ?? 'gp'),
          price:       +price.toFixed(2),
          currency:    'EUR',
          observedAt:  item.observedAt ?? item.date ?? new Date().toISOString(),
          source:      'catalog',
        });
      }
      if (observations.length > 0) break;
    } catch { /* try next */ }
  }
  return observations;
}

// ── Provider: OpenPrices API ──────────────────────────────────────────────────

async function fetchOpenPrices(barcode) {
  const url = `https://prices.openfoodfacts.org/api/v1/prices?product_code=${barcode}&page_size=20`;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'AKiPriSaYe/1.0 (https://github.com/teetee971/akiprisaye-web)' },
      signal:  AbortSignal.timeout(TIMEOUT),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.items ?? []).map(item => ({
      productId:  barcode,
      name:       item.product?.product_name ?? `Produit ${barcode}`,
      brand:      item.product?.brands ?? undefined,
      retailer:   normaliseRetailer(item.location_osm_name ?? item.location?.name ?? 'Inconnu'),
      territory:  normaliseTerritory(item.location?.country ?? 'gp'),
      price:      +(item.price ?? 0),
      currency:   'EUR',
      observedAt: item.date ?? new Date().toISOString(),
      source:     'openprices',
    })).filter(o => o.price > 0);
  } catch {
    return [];
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

const barcodeArg = process.argv.find(a => a.startsWith('--barcodes='))?.slice(11);
const barcodes   = barcodeArg ? barcodeArg.split(',') : ['5449000000996', '3017620422003', '3245413391393'];

console.log('[fetch-price-data] Starting…');

// 1. Internal catalogues
const internal = loadInternalCatalogues();
console.log(`[fetch-price-data]   internal: ${internal.length} observations`);

// 2. OpenPrices (live API — gracefully skip on network failure)
const liveObs = [];
for (const barcode of barcodes.slice(0, 10)) {
  const obs = await fetchOpenPrices(barcode.trim());
  liveObs.push(...obs);
  if (obs.length > 0) console.log(`[fetch-price-data]   openprices ${barcode}: ${obs.length} rows`);
}
console.log(`[fetch-price-data]   openprices total: ${liveObs.length} observations`);

// 3. Merge — seed is always last so real data wins
const all = [...internal, ...liveObs, ...SEED];

// 4. Deduplicate: keep first occurrence of (productId, retailer, territory)
const seen = new Set();
const deduped = all.filter(o => {
  const key = `${o.productId}|${o.retailer}|${o.territory}`;
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
}).slice(0, LIMIT);

// 5. Write output
mkdirSync(resolve(ROOT, 'data/output'), { recursive: true });
writeFileSync(OUTPUT, JSON.stringify({
  fetchedAt: new Date().toISOString(),
  count:     deduped.length,
  observations: deduped,
}, null, 2), 'utf8');

console.log(`[fetch-price-data] ✅ ${deduped.length} observations → ${OUTPUT}`);
