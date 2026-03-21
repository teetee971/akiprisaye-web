/**
 * normalize-price-data.mjs
 *
 * Step 2 of the data pipeline: read raw price observations, deduplicate,
 * clean and validate them, then write a normalised JSON file.
 *
 * Reads:   data/output/price-observations.json  (from fetch-price-data.mjs)
 * Writes:  data/output/normalized-products.json
 *
 * Normalisation rules:
 *   - Remove observations with price ≤ 0 or price > 1000 (sanity)
 *   - Trim and title-case product names
 *   - Canonical retailer names (same map as fetch script)
 *   - Canonical territory codes (gp / mq / gf / re)
 *   - Keep only the most recent observation per (productId, retailer, territory)
 *   - Group into products with all retailer prices
 *
 * Usage:
 *   node scripts/normalize-price-data.mjs
 *   node scripts/normalize-price-data.mjs --input=./my-obs.json --output=./out.json
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname }                                    from 'node:path';
import { fileURLToPath }                                       from 'node:url';

const HERE   = dirname(fileURLToPath(import.meta.url));
const ROOT   = resolve(HERE, '..');
const INPUT  = resolve(process.argv.find(a => a.startsWith('--input='))?.slice(8)  ?? ROOT, 'data/output/price-observations.json');
const OUTPUT = resolve(process.argv.find(a => a.startsWith('--output='))?.slice(9) ?? ROOT, 'data/output/normalized-products.json');

// ── Normalisation helpers ─────────────────────────────────────────────────────

const RETAILER_ALIASES = new Map([
  ['e.leclerc', 'E.Leclerc'], ['leclerc', 'E.Leclerc'],
  ['carrefour market', 'Carrefour Market'], ['carrefour', 'Carrefour'],
  ['super u', 'Super U'], ['superu', 'Super U'], ['u express', 'Super U'],
  ['intermarché', 'Intermarché'], ['intermarche', 'Intermarché'],
  ['leader price', 'Leader Price'],
  ['aldi', 'Aldi'], ['lidl', 'Lidl'], ['casino', 'Casino'],
  ['écomax', 'Écomax'], ['ecomax', 'Écomax'],
]);

const TERRITORY_ALIASES = new Map([
  ['gp', 'gp'], ['guadeloupe', 'gp'],
  ['mq', 'mq'], ['martinique', 'mq'],
  ['gf', 'gf'], ['guyane', 'gf'],
  ['re', 're'], ['réunion', 're'], ['reunion', 're'],
]);

function normaliseRetailer(raw) {
  const key = String(raw ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  for (const [alias, canonical] of RETAILER_ALIASES) {
    if (key.includes(alias)) return canonical;
  }
  return String(raw ?? 'Inconnu').trim();
}

function normaliseTerritory(raw) {
  const key = String(raw ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  return TERRITORY_ALIASES.get(key) ?? 'gp';
}

function normaliseName(raw) {
  return String(raw ?? 'Produit').trim().replace(/\s+/g, ' ');
}

function isValidPrice(p) {
  return typeof p === 'number' && isFinite(p) && p > 0 && p < 1_000;
}

// ── Main ──────────────────────────────────────────────────────────────────────

console.log('[normalize-price-data] Starting…');

// 1. Load raw observations
if (!existsSync(INPUT)) {
  console.error(`[normalize-price-data] ❌ Input not found: ${INPUT}`);
  console.error('  Run scripts/fetch-price-data.mjs first.');
  process.exit(1);
}

const raw        = JSON.parse(readFileSync(INPUT, 'utf8'));
const rawObs     = Array.isArray(raw) ? raw : (raw.observations ?? []);
console.log(`[normalize-price-data]   raw observations: ${rawObs.length}`);

// 2. Clean and validate each observation
const cleaned = rawObs
  .map(o => ({
    productId:  String(o.productId ?? o.id ?? 'unknown').trim(),
    name:       normaliseName(o.name),
    brand:      o.brand ? String(o.brand).trim() : undefined,
    retailer:   normaliseRetailer(o.retailer),
    territory:  normaliseTerritory(o.territory),
    price:      +parseFloat(o.price ?? 0).toFixed(2),
    currency:   'EUR',
    observedAt: o.observedAt ?? new Date().toISOString(),
    source:     o.source ?? 'internal',
  }))
  .filter(o => isValidPrice(o.price) && o.productId !== 'unknown' && o.retailer !== 'Inconnu');

console.log(`[normalize-price-data]   valid after cleaning: ${cleaned.length}`);

// 3. Keep only the most recent observation per (productId, retailer, territory)
const latestMap = new Map();
for (const o of cleaned) {
  const key = `${o.productId}|${o.retailer}|${o.territory}`;
  const existing = latestMap.get(key);
  if (!existing || o.observedAt > existing.observedAt) {
    latestMap.set(key, o);
  }
}
const deduplicated = Array.from(latestMap.values());
console.log(`[normalize-price-data]   after dedup: ${deduplicated.length}`);

// 4. Group by product for downstream scoring
const byProduct = new Map();
for (const o of deduplicated) {
  const key = `${o.productId}|${o.territory}`;
  if (!byProduct.has(key)) {
    byProduct.set(key, {
      productId:   o.productId,
      name:        o.name,
      brand:       o.brand,
      territory:   o.territory,
      observations: [],
    });
  }
  byProduct.get(key).observations.push({
    retailer:   o.retailer,
    price:      o.price,
    observedAt: o.observedAt,
    source:     o.source,
  });
}

const products = Array.from(byProduct.values())
  // Only include products with at least 2 retailer prices (needed for comparison)
  .filter(p => p.observations.length >= 2)
  .sort((a, b) => a.name.localeCompare(b.name));

console.log(`[normalize-price-data]   comparable products: ${products.length}`);

// 5. Write output
mkdirSync(resolve(ROOT, 'data/output'), { recursive: true });
writeFileSync(OUTPUT, JSON.stringify({
  normalizedAt: new Date().toISOString(),
  count:        products.length,
  rawCount:     rawObs.length,
  cleanedCount: cleaned.length,
  products,
}, null, 2), 'utf8');

console.log(`[normalize-price-data] ✅ ${products.length} products → ${OUTPUT}`);
