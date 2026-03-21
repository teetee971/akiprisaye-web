/**
 * compute-product-scores.mjs
 *
 * Step 3 of the data pipeline: score normalised products by revenue potential.
 *
 * Reads:   data/output/normalized-products.json  (from normalize-price-data.mjs)
 * Writes:  data/output/product-scores.json
 *
 * Scoring formula (aligns with shared/src/revenue.ts ScoredProduct):
 *   globalScore = deltaScore * 0.35
 *               + clickScore * 0.30
 *               + demandScore * 0.20
 *               + recencyScore * 0.15
 *
 * Where:
 *   deltaScore   — normalised price spread (0–100)
 *   clickScore   — 0 (no localStorage in Node; can be injected via --clicks=file.json)
 *   demandScore  — how many territories have data for this product (0–100)
 *   recencyScore — time-decay from most recent observation (0–100 over 7 days)
 *
 * Usage:
 *   node scripts/compute-product-scores.mjs
 *   node scripts/compute-product-scores.mjs --input=./norm.json --output=./scores.json
 *   node scripts/compute-product-scores.mjs --clicks=./click-export.json
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname }                                    from 'node:path';
import { fileURLToPath }                                       from 'node:url';

const HERE   = dirname(fileURLToPath(import.meta.url));
const ROOT   = resolve(HERE, '..');
const INPUT  = resolve(process.argv.find(a => a.startsWith('--input='))?.slice(8)  ?? ROOT, 'data/output/normalized-products.json');
const OUTPUT = resolve(process.argv.find(a => a.startsWith('--output='))?.slice(9) ?? ROOT, 'data/output/product-scores.json');

// Optional click data injected from localStorage export
const CLICKS_FILE = process.argv.find(a => a.startsWith('--clicks='))?.slice(9);

const RECENCY_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;  // 7 days

// ── Load click data (optional) ────────────────────────────────────────────────

let clicksByProduct = new Map();
if (CLICKS_FILE && existsSync(CLICKS_FILE)) {
  try {
    const clickData = JSON.parse(readFileSync(CLICKS_FILE, 'utf8'));
    const events = Array.isArray(clickData) ? clickData : (clickData.events ?? []);
    for (const e of events) {
      if (!e.product) continue;
      const key = String(e.product).toLowerCase().trim();
      clicksByProduct.set(key, (clicksByProduct.get(key) ?? 0) + 1);
    }
    console.log(`[compute-product-scores]   loaded ${events.length} click events from ${CLICKS_FILE}`);
  } catch { /* non-fatal */ }
}

// ── Main ──────────────────────────────────────────────────────────────────────

console.log('[compute-product-scores] Starting…');

if (!existsSync(INPUT)) {
  console.error(`[compute-product-scores] ❌ Input not found: ${INPUT}`);
  console.error('  Run scripts/normalize-price-data.mjs first.');
  process.exit(1);
}

const raw      = JSON.parse(readFileSync(INPUT, 'utf8'));
const products = Array.isArray(raw) ? raw : (raw.products ?? []);
console.log(`[compute-product-scores]   products to score: ${products.length}`);

// ── Score each product ────────────────────────────────────────────────────────

const now = Date.now();

// Count territories per product for demandScore
const territoryCounts = new Map();
for (const p of products) {
  const key = p.productId;
  if (!territoryCounts.has(key)) territoryCounts.set(key, new Set());
  territoryCounts.get(key).add(p.territory);
}
const maxTerritories = Math.max(1, ...Array.from(territoryCounts.values()).map(s => s.size));

// Find max delta across all products (for normalisation)
function computeDelta(observations) {
  const prices = observations.map(o => o.price).filter(p => p > 0);
  if (prices.length < 2) return 0;
  return +(Math.max(...prices) - Math.min(...prices)).toFixed(2);
}

const deltas = products.map(p => computeDelta(p.observations ?? []));
const maxDelta = Math.max(0.01, ...deltas);

const scored = products.map((p, idx) => {
  const observations = p.observations ?? [];
  const prices = observations.map(o => o.price).filter(x => x > 0);
  if (prices.length < 2) return null;

  const sortedPrices = [...prices].sort((a, b) => a - b);
  const bestPrice    = sortedPrices[0];
  const worstPrice   = sortedPrices[sortedPrices.length - 1];
  const delta        = +(worstPrice - bestPrice).toFixed(2);

  const bestObs    = observations.find(o => o.price === bestPrice);
  const bestRetailer = bestObs?.retailer ?? 'Inconnu';

  // Scores (all 0–100)
  const deltaScore   = Math.round((delta / maxDelta) * 100);
  const demandScore  = Math.round(((territoryCounts.get(p.productId)?.size ?? 1) / maxTerritories) * 100);

  // Recency: most recent observation time-decayed over 7 days
  const latestObsAt  = Math.max(...observations.map(o => new Date(o.observedAt || 0).getTime()).filter(t => t > 0));
  const ageMs        = latestObsAt > 0 ? now - latestObsAt : RECENCY_WINDOW_MS;
  const recencyScore = Math.max(0, Math.round((1 - ageMs / RECENCY_WINDOW_MS) * 100));

  // Clicks — from injected file or 0
  const clickKey   = (p.name ?? '').toLowerCase().trim();
  const rawClicks  = clicksByProduct.get(clickKey) ?? 0;
  const maxClicks  = Math.max(1, ...Array.from(clicksByProduct.values()));
  const clickScore = Math.round((rawClicks / maxClicks) * 100);

  // Base composite score (0–100 range before modifiers)
  let rawScore =
    deltaScore   * 0.35 +
    clickScore   * 0.30 +
    demandScore  * 0.20 +
    recencyScore * 0.15;

  // ── Business modifiers ────────────────────────────────────────────────────
  // Penalty: tiny price spread → low viral / revenue potential
  if (delta < 0.10) rawScore *= 0.5;
  // Bonus: expensive product → higher absolute affiliate value
  if (bestPrice > 10) rawScore *= 1.2;

  const globalScore = +Math.min(rawScore, 100).toFixed(1);

  return {
    productId:     p.productId,
    name:          p.name,
    territory:     p.territory,
    bestRetailer,
    bestPrice,
    worstPrice,
    delta,
    clicks:        rawClicks,
    deltaScore,
    demandScore,
    recencyScore,
    clickScore,
    globalScore,
  };
}).filter(Boolean).sort((a, b) => b.globalScore - a.globalScore);

console.log(`[compute-product-scores]   scored: ${scored.length}`);

// ── Write output ──────────────────────────────────────────────────────────────

mkdirSync(resolve(ROOT, 'data/output'), { recursive: true });
writeFileSync(OUTPUT, JSON.stringify({
  scoredAt:  new Date().toISOString(),
  count:     scored.length,
  formula:   'globalScore = (delta×0.35 + click×0.30 + demand×0.20 + recency×0.15) × penalty(delta<0.1:×0.5) × bonus(price>10:×1.2)',
  top10:     scored.slice(0, 10).map(s => `${s.name} (${s.territory}) — Δ${s.delta}€ score:${s.globalScore}`),
  products:  scored,
}, null, 2), 'utf8');

console.log(`[compute-product-scores] ✅ ${scored.length} products → ${OUTPUT}`);

// Log top 5 for CI summary
console.log('[compute-product-scores] Top 5:');
scored.slice(0, 5).forEach((s, i) =>
  console.log(`  ${i + 1}. ${s.name} (${s.territory}) | Δ${s.delta}€ | score: ${s.globalScore} | best: ${s.bestRetailer} ${s.bestPrice}€`)
);
