#!/usr/bin/env node
/**
 * boost-engine.mjs — Automatic product booster based on click performance.
 *
 * Reads:   data/output/product-scores.json  (scored product list)
 *          data/output/click-export.json     (optional — localStorage click export)
 * Writes:  data/output/boosted-products.json
 *
 * Logic:
 *   1. Load scored products
 *   2. Load click data (if available)
 *   3. Products with clicks > BOOST_THRESHOLD get product.boost = true
 *   4. Boosted products receive a +BOOST_SCORE bonus to their score
 *   5. Re-sort by adjusted score descending
 *
 * Usage:
 *   node scripts/boost-engine.mjs
 *   node scripts/boost-engine.mjs --clicks=./click-export.json
 *   node scripts/boost-engine.mjs --threshold=30 --boost=8
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname }                                    from 'node:path';
import { fileURLToPath }                                       from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT      = resolve(__dirname, '..');

// ── CLI flags ─────────────────────────────────────────────────────────────────

function flag(name, fallback) {
  const arg = process.argv.find((a) => a.startsWith(`--${name}=`));
  return arg ? arg.split('=').slice(1).join('=') : fallback;
}

const SCORES_INPUT   = resolve(ROOT, flag('input',  'data/output/product-scores.json'));
const CLICKS_INPUT   = resolve(ROOT, flag('clicks', 'data/output/click-export.json'));
const OUTPUT         = resolve(ROOT, flag('output', 'data/output/boosted-products.json'));
const BOOST_THRESHOLD = parseInt(flag('threshold', '50'),  10); // clicks to trigger boost
const BOOST_SCORE     = parseInt(flag('boost',     '5'),   10); // score bonus for boosted products

// ── Load product scores ───────────────────────────────────────────────────────

if (!existsSync(SCORES_INPUT)) {
  console.warn(`[boost-engine] ⚠ Scores not found: ${SCORES_INPUT}. Generating empty output.`);
}

let products = [];
if (existsSync(SCORES_INPUT)) {
  try {
    const raw = JSON.parse(readFileSync(SCORES_INPUT, 'utf8'));
    products  = Array.isArray(raw) ? raw : (raw.products ?? []);
    console.log(`[boost-engine]   loaded ${products.length} scored products`);
  } catch (err) {
    console.error(`[boost-engine] ❌ Failed to parse ${SCORES_INPUT}: ${err.message}`);
  }
}

// ── Load click data (optional) ────────────────────────────────────────────────

const clicksByProduct = new Map(); // lowercase name → click count

if (existsSync(CLICKS_INPUT)) {
  try {
    const raw    = JSON.parse(readFileSync(CLICKS_INPUT, 'utf8'));
    const events = Array.isArray(raw) ? raw : (raw.events ?? []);
    for (const e of events) {
      if (!e.product) continue;
      const key = String(e.product).toLowerCase().trim();
      clicksByProduct.set(key, (clicksByProduct.get(key) ?? 0) + 1);
    }
    console.log(`[boost-engine]   loaded ${events.length} click events from ${CLICKS_INPUT}`);
  } catch (err) {
    console.warn(`[boost-engine] ⚠ Could not load clicks: ${err.message}`);
  }
} else {
  console.log(`[boost-engine]   no click file found at ${CLICKS_INPUT} — running without click signals`);
}

// ── Apply boosts ──────────────────────────────────────────────────────────────

let boostedCount = 0;

const boosted = products.map((p) => {
  const key    = String(p.name ?? p.productId ?? '').toLowerCase().trim();
  const clicks = clicksByProduct.get(key) ?? 0;
  const shouldBoost = clicks > BOOST_THRESHOLD;

  if (shouldBoost) boostedCount++;

  return {
    ...p,
    clicks,
    boost:       shouldBoost,
    score:       shouldBoost ? Math.min(100, (p.globalScore ?? p.score ?? 0) + BOOST_SCORE) : (p.globalScore ?? p.score ?? 0),
    boostedAt:   shouldBoost ? new Date().toISOString() : undefined,
  };
});

// Re-sort by adjusted score
boosted.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

console.log(`[boost-engine]   boosted: ${boostedCount} / ${products.length} products (threshold: ${BOOST_THRESHOLD} clicks)`);

// ── Write output ──────────────────────────────────────────────────────────────

const outputDir = resolve(OUTPUT, '..');
if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true });

const out = {
  generatedAt:    new Date().toISOString(),
  count:          boosted.length,
  boostedCount,
  boostThreshold: BOOST_THRESHOLD,
  boostScore:     BOOST_SCORE,
  products:       boosted,
};

writeFileSync(OUTPUT, JSON.stringify(out, null, 2), 'utf8');
console.log(`[boost-engine] ✅ Written ${boosted.length} products → ${OUTPUT}`);
