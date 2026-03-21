/**
 * ai-growth-system.mjs
 *
 * Central orchestrator for the AI Growth Loop.
 *
 * Pipeline:
 *   read prices → score products → filter top by delta → generate content → write output
 *
 * Designed to run in Node.js (no browser APIs).
 * Reads:   frontend/public/data/prices.json (+ seed data fallback)
 * Writes:  growth-output.json  (or --output=<path>)
 *
 * Usage:
 *   node scripts/ai-growth-system.mjs
 *   node scripts/ai-growth-system.mjs --top=5 --min-delta=0.20 --output=./out.json
 *   SITE_URL=https://example.com node scripts/ai-growth-system.mjs
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateContent } from './auto-content-engine.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');

// ── growthBrain (inline for Node.js compatibility) ────────────────────────────
// mirrors frontend/src/utils/growthBrain.ts — kept in sync manually

function computeScore(product) {
  return (
    (product.clicks   ?? 0) * 0.5 +
    (product.delta    ?? 0) * 0.3 +
    (product.searches ?? 0) * 0.2
  );
}

function classifyPriority(clicks) {
  if (clicks > 20) return 'HIGH';
  if (clicks >= 5) return 'MEDIUM';
  return 'LOW';
}

function rankProducts(products) {
  return products
    .map((p) => ({ ...p, score: computeScore(p), priority: classifyPriority(p.clicks ?? 0) }))
    .sort((a, b) => b.score - a.score);
}

// ── CLI args ─────────────────────────────────────────────────────────────────

const args = Object.fromEntries(
  process.argv.slice(2)
    .filter((a) => a.startsWith('--'))
    .map((a) => a.slice(2).split('=')),
);

const OUTPUT    = args.output ?? resolve(process.cwd(), 'growth-output.json');
const TOP       = Math.min(Math.max(parseInt(args.top       ?? '10',  10), 1), 50);
const MIN_DELTA = parseFloat(args['min-delta'] ?? '0.20');

// SITE_URL can be overridden via environment variable (set in CI secrets)
process.env.SITE_URL ??= 'https://teetee971.github.io/akiprisaye-web/';

// ── Load price data ───────────────────────────────────────────────────────────

const DATA_PATHS = [
  args.data,
  resolve(ROOT, 'frontend/public/data/prices.json'),
  resolve(ROOT, 'frontend/public/data/expanded-prices.json'),
  resolve(ROOT, 'public/data/prices.json'),
].filter(Boolean).map((p) => resolve(p));

// Seed data — ensures output is never empty even without real price files
const SEED_PRICES = [
  { productLabel: 'Coca-Cola 1,5 L',       storeName: 'E.Leclerc', price: 2.49 },
  { productLabel: 'Coca-Cola 1,5 L',       storeName: 'Carrefour', price: 2.85 },
  { productLabel: 'Coca-Cola 1,5 L',       storeName: 'Super U',   price: 2.69 },
  { productLabel: 'Riz blanc 1 kg',        storeName: 'E.Leclerc', price: 1.99 },
  { productLabel: 'Riz blanc 1 kg',        storeName: 'Carrefour', price: 2.45 },
  { productLabel: 'Riz blanc 1 kg',        storeName: 'Super U',   price: 2.20 },
  { productLabel: 'Lait UHT 1 L',          storeName: 'E.Leclerc', price: 1.05 },
  { productLabel: 'Lait UHT 1 L',          storeName: 'Carrefour', price: 1.35 },
  { productLabel: 'Huile tournesol 1 L',   storeName: 'E.Leclerc', price: 2.10 },
  { productLabel: 'Huile tournesol 1 L',   storeName: 'Carrefour', price: 2.65 },
  { productLabel: 'Sucre cristallisé 1 kg', storeName: 'E.Leclerc', price: 1.15 },
  { productLabel: 'Sucre cristallisé 1 kg', storeName: 'Carrefour', price: 1.55 },
];

let rawPrices = [];
for (const p of DATA_PATHS) {
  if (!existsSync(p)) continue;
  try {
    const parsed = JSON.parse(readFileSync(p, 'utf8'));
    const items  = Array.isArray(parsed) ? parsed : Object.values(parsed).flat();
    if (items.length >= 2) { rawPrices = items; break; }
  } catch { /* try next */ }
}
rawPrices = [...rawPrices, ...SEED_PRICES];

// ── Score products ────────────────────────────────────────────────────────────

function groupByProduct(prices) {
  const map = new Map();
  for (const p of prices) {
    const label = p.productLabel ?? p.productId ?? 'Produit';
    if (!map.has(label)) map.set(label, []);
    map.get(label).push(p);
  }
  return map;
}

function computeSavings(group) {
  const sorted = [...group].sort((a, b) => a.price - b.price);
  if (sorted.length < 2) return null;
  const best  = sorted[0];
  const worst = sorted[sorted.length - 1];
  const delta = +(worst.price - best.price).toFixed(2);
  if (delta <= 0) return null;
  return {
    name:          best.productLabel ?? best.productId,
    bestRetailer:  best.storeName,
    bestPrice:     best.price,
    worstRetailer: worst.storeName,
    worstPrice:    worst.price,
    delta,
    // Simple score: 60% delta weight + 40% retailer count
    globalScore:   +(delta * 60 + Math.min(group.length, 5) * 8).toFixed(1),
  };
}

const groups = groupByProduct(rawPrices);
const seenNames = new Set();
const allProducts = Array.from(groups.values())
  .map(computeSavings)
  .filter(Boolean)
  // Deduplicate by name (seed + file data may overlap) — O(n) via Set
  .filter((p) => !seenNames.has(p.name) && seenNames.add(p.name));

// ── Rank with growthBrain, filter by delta, take top N ───────────────────────

const ranked = rankProducts(allProducts);

const filtered = ranked
  .filter((p) => p.delta >= MIN_DELTA)
  .slice(0, TOP);

// ── Generate content for each top product ────────────────────────────────────

const outputs = filtered.map((product) => ({
  product: {
    name:          product.name,
    bestRetailer:  product.bestRetailer,
    bestPrice:     product.bestPrice,
    worstRetailer: product.worstRetailer,
    worstPrice:    product.worstPrice,
    delta:         product.delta,
    score:         product.score,
    priority:      product.priority,
  },
  content: generateContent({
    name:         product.name,
    bestRetailer: product.bestRetailer,
    bestPrice:    product.bestPrice,
    worstRetailer: product.worstRetailer,
    worstPrice:   product.worstPrice,
    delta:        product.delta,
  }),
}));

// ── Write output ──────────────────────────────────────────────────────────────

const result = {
  generatedAt:  new Date().toISOString(),
  siteUrl:      process.env.SITE_URL,
  topN:         TOP,
  minDelta:     MIN_DELTA,
  totalScored:  allProducts.length,
  totalOutput:  outputs.length,
  outputs,
};

writeFileSync(OUTPUT, JSON.stringify(result, null, 2), 'utf8');

console.log(`[ai-growth-system] ✅ ${outputs.length} produits → ${OUTPUT}`);
if (outputs.length > 0) {
  console.log('[ai-growth-system] Top 3:');
  outputs.slice(0, 3).forEach((o, i) => {
    console.log(`  ${i + 1}. ${o.product.name} — delta ${o.product.delta}€ (score ${o.product.globalScore})`);
  });
}
