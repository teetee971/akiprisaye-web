/**
 * revenue-top-products.mjs
 *
 * Ranks products by revenue potential using static price data.
 * Runs in Node.js (no browser APIs) — safe to call in CI pipelines.
 *
 * Scoring (per product):
 *   marginScore : max price spread across retailers (€ saved per purchase)
 *   demandScore : number of distinct retailers carrying the product
 *   globalScore : 60% margin + 40% demand (0–100)
 *
 * Reads:  frontend/public/data/prices.json (and expanded-prices.json as fallback)
 * Writes: revenue-top-products.json (or --output=<path>)
 *
 * Usage:
 *   node frontend/scripts/revenue-top-products.mjs
 *   node frontend/scripts/revenue-top-products.mjs --top=20 --output=top.json
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');

// ── CLI args ─────────────────────────────────────────────────────────────────

const args = Object.fromEntries(
  process.argv.slice(2)
    .filter((a) => a.startsWith('--'))
    .map((a) => a.slice(2).split('=')),
);

const OUTPUT = args.output ?? resolve(process.cwd(), 'revenue-top-products.json');
const TOP    = Math.min(Math.max(parseInt(args.top ?? '20', 10), 1), 100);

// ── Load price data ───────────────────────────────────────────────────────────

const DATA_CANDIDATES = [
  args.data,
  resolve(ROOT, 'public/data/prices.json'),
  resolve(ROOT, 'public/data/expanded-prices.json'),
  resolve(ROOT, 'public/data/prices-territories.json'),
].filter(Boolean).map((p) => resolve(p));

// Hardcoded seed data so the script is never empty-handed
const SEED_PRICES = [
  { productId: 'coca-cola-15l',     productLabel: 'Coca-Cola 1,5 L',      storeName: 'E.Leclerc',  price: 2.49, territory: 'GP' },
  { productId: 'coca-cola-15l',     productLabel: 'Coca-Cola 1,5 L',      storeName: 'Carrefour',  price: 2.85, territory: 'GP' },
  { productId: 'coca-cola-15l',     productLabel: 'Coca-Cola 1,5 L',      storeName: 'Super U',    price: 2.69, territory: 'GP' },
  { productId: 'riz-blanc-1kg',     productLabel: 'Riz blanc 1 kg',       storeName: 'E.Leclerc',  price: 1.99, territory: 'GP' },
  { productId: 'riz-blanc-1kg',     productLabel: 'Riz blanc 1 kg',       storeName: 'Carrefour',  price: 2.45, territory: 'GP' },
  { productId: 'riz-blanc-1kg',     productLabel: 'Riz blanc 1 kg',       storeName: 'Super U',    price: 2.20, territory: 'GP' },
  { productId: 'lait-uht-1l',       productLabel: 'Lait UHT 1 L',         storeName: 'E.Leclerc',  price: 1.05, territory: 'GP' },
  { productId: 'lait-uht-1l',       productLabel: 'Lait UHT 1 L',         storeName: 'Carrefour',  price: 1.35, territory: 'GP' },
  { productId: 'lait-uht-1l',       productLabel: 'Lait UHT 1 L',         storeName: 'Super U',    price: 1.20, territory: 'GP' },
  { productId: 'huile-tournesol-1l', productLabel: 'Huile tournesol 1 L', storeName: 'E.Leclerc',  price: 2.10, territory: 'GP' },
  { productId: 'huile-tournesol-1l', productLabel: 'Huile tournesol 1 L', storeName: 'Carrefour',  price: 2.65, territory: 'GP' },
  { productId: 'sucre-1kg',         productLabel: 'Sucre cristallisé 1 kg', storeName: 'E.Leclerc', price: 1.15, territory: 'GP' },
  { productId: 'sucre-1kg',         productLabel: 'Sucre cristallisé 1 kg', storeName: 'Carrefour', price: 1.55, territory: 'GP' },
];

let prices = [];
for (const candidate of DATA_CANDIDATES) {
  if (!existsSync(candidate)) continue;
  try {
    const raw    = readFileSync(candidate, 'utf8');
    const parsed = JSON.parse(raw);
    const items  = Array.isArray(parsed) ? parsed : Object.values(parsed).flat();
    if (items.length >= 2) { prices = items; break; }
  } catch { /* try next */ }
}
// Always include seed so the output is never empty
prices = [...prices, ...SEED_PRICES];

// ── Aggregate per product ─────────────────────────────────────────────────────

const byProduct = new Map();

for (const p of prices) {
  const id    = p.productId ?? p.productLabel ?? 'unknown';
  const label = p.productLabel ?? p.productId ?? id;
  if (!byProduct.has(id)) {
    byProduct.set(id, { id, label, prices: [], retailers: new Set(), territories: new Set() });
  }
  const entry = byProduct.get(id);
  if (typeof p.price === 'number' && p.price > 0) entry.prices.push(p.price);
  if (p.storeName)  entry.retailers.add(p.storeName);
  if (p.territory)  entry.territories.add(p.territory);
}

// ── Score each product ────────────────────────────────────────────────────────

function score(entry) {
  if (entry.prices.length < 2) return null;

  const minPrice = Math.min(...entry.prices);
  const maxPrice = Math.max(...entry.prices);
  const spread   = +(maxPrice - minPrice).toFixed(2);
  if (spread <= 0) return null;

  const retailerCount  = entry.retailers.size;
  const territoryCount = entry.territories.size;

  // marginScore: 0–100, based on savings ÷ max observed (2€ spread → 100%)
  const marginScore = Math.min(Math.round((spread / 2) * 100), 100);

  // demandScore: 0–100, based on how many retailers carry it (5 retailers → 100%)
  const demandScore = Math.min(Math.round((retailerCount / 5) * 100), 100);

  // globalScore: 60% margin + 40% demand
  const globalScore = +(marginScore * 0.6 + demandScore * 0.4).toFixed(1);

  return {
    productId:    entry.id,
    product:      entry.label,
    bestPrice:    minPrice,
    worstPrice:   maxPrice,
    savingsEur:   spread,
    retailers:    Array.from(entry.retailers),
    territories:  Array.from(entry.territories),
    retailerCount,
    territoryCount,
    marginScore,
    demandScore,
    globalScore,
  };
}

const scored = Array.from(byProduct.values())
  .map(score)
  .filter(Boolean)
  .sort((a, b) => b.globalScore - a.globalScore)
  // deduplicate by product label (seed + real data may overlap)
  .filter((item, idx, arr) => arr.findIndex((x) => x.product === item.product) === idx)
  .slice(0, TOP);

// ── Write output ─────────────────────────────────────────────────────────────

const output = {
  generatedAt: new Date().toISOString(),
  source:      DATA_CANDIDATES.find((c) => existsSync(c)) ?? 'seed-data',
  count:       scored.length,
  products:    scored,
};

writeFileSync(OUTPUT, JSON.stringify(output, null, 2), 'utf8');

console.log(`[revenue-top-products] ✅ ${scored.length} produits → ${OUTPUT}`);
if (scored.length > 0) {
  console.log(`[revenue-top-products] Top 3:`);
  scored.slice(0, 3).forEach((p, i) => {
    console.log(`  ${i + 1}. ${p.product} — économie ${p.savingsEur}€ (score ${p.globalScore})`);
  });
}
