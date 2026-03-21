#!/usr/bin/env node
/**
 * generate-predictive-ranking.mjs — Predictive scoring pipeline (V3)
 *
 * Reads:   data/output/product-scores.json    (from compute-product-scores.mjs)
 *          data/output/click-export.json      (optional — localStorage events)
 * Writes:  data/output/predictive-ranking.json
 *          data/output/user-segments.json     (segment distribution summary)
 *
 * Applies the V3 predictive engine to re-rank products by:
 *   delta × 0.35 + clickTrend × 0.30 + recency × 0.20 + repeatUser × 0.15
 *
 * Usage:
 *   node scripts/generate-predictive-ranking.mjs
 *   node scripts/generate-predictive-ranking.mjs --min-delta=0.15 --limit=50
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname }                                    from 'node:path';
import { fileURLToPath }                                       from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT      = resolve(__dirname, '..');

function flag(name, fallback) {
  const arg = process.argv.find((a) => a.startsWith(`--${name}=`));
  return arg ? arg.split('=').slice(1).join('=') : fallback;
}

const SCORES_INPUT = resolve(ROOT, flag('input',     'data/output/product-scores.json'));
const CLICKS_INPUT = resolve(ROOT, flag('clicks',    'data/output/click-export.json'));
const RANKING_OUT  = resolve(ROOT, flag('output',    'data/output/predictive-ranking.json'));
const SEGMENTS_OUT = resolve(ROOT, 'data/output/user-segments.json');
const MIN_DELTA    = parseFloat(flag('min-delta', '0.10'));
const LIMIT        = parseInt(flag('limit', '50'), 10);

// ── Load products ─────────────────────────────────────────────────────────────

let products = [];
if (existsSync(SCORES_INPUT)) {
  try {
    const raw = JSON.parse(readFileSync(SCORES_INPUT, 'utf8'));
    products  = Array.isArray(raw) ? raw : (raw.products ?? []);
    console.log(`[predictive-ranking]   loaded ${products.length} scored products`);
  } catch (err) {
    console.error(`[predictive-ranking] ❌ Failed to parse products: ${err.message}`);
  }
} else {
  console.warn(`[predictive-ranking] ⚠ No product scores at ${SCORES_INPUT}`);
}

// ── Load click events (optional) ──────────────────────────────────────────────

const clickEvents = [];
if (existsSync(CLICKS_INPUT)) {
  try {
    const raw = JSON.parse(readFileSync(CLICKS_INPUT, 'utf8'));
    clickEvents.push(...(Array.isArray(raw) ? raw : (raw.events ?? [])));
    console.log(`[predictive-ranking]   loaded ${clickEvents.length} click events`);
  } catch { /* non-fatal */ }
}

// ── Build click trend map ─────────────────────────────────────────────────────

const now = Date.now();
const H24 = 24 * 60 * 60 * 1000;

const clickWindows = new Map(); // name → { last24h, prev24h }
const CLICK_TYPES  = new Set(['click', 'affiliate_click', 'conversion', 'deal_view']);

for (const e of clickEvents) {
  if (!e.product || !CLICK_TYPES.has(e.type)) continue;
  const key = String(e.product).toLowerCase().trim();
  if (!clickWindows.has(key)) clickWindows.set(key, { last24h: 0, prev24h: 0 });
  const win = clickWindows.get(key);
  const age = now - (e.ts ?? 0);
  if (age <= H24)       win.last24h++;
  else if (age <= 2*H24) win.prev24h++;
}

function computeTrend(key) {
  const win = clickWindows.get(key) ?? { last24h: 0, prev24h: 0 };
  const last = win.last24h, prev = win.prev24h;
  const raw  = prev === 0 ? (last > 0 ? 1 : 0) : (last - prev) / prev;
  // Normalise to 0–100
  return Math.round((Math.max(-1, Math.min(2, raw)) + 1) / 3 * 100);
}

// ── Compute recency score ─────────────────────────────────────────────────────

function computeRecency(product) {
  const ts = product.lastUpdatedAt
    ? Date.parse(product.lastUpdatedAt)
    : (product.scoredAt ? Date.parse(product.scoredAt) : 0);
  if (!ts) return 50;
  const ageMs = now - ts;
  const maxMs = 7 * 24 * H24;
  return Math.round(Math.max(0, 1 - ageMs / maxMs) * 100);
}

// ── Predictive score formula ──────────────────────────────────────────────────

const W_DELTA   = 0.35;
const W_TREND   = 0.30;
const W_RECENCY = 0.20;
const W_REPEAT  = 0.15;

function computePredictiveScore(product) {
  const deltaScore = Math.min(100, ((product.delta ?? 0) / 5) * 100);
  const trend      = computeTrend(String(product.name ?? '').toLowerCase().trim());
  const recency    = computeRecency(product);
  const repeat     = 0; // No repeat-user data in Node pipeline — set 0

  return Math.min(100, Math.max(0, Math.round(
    deltaScore * W_DELTA + trend * W_TREND + recency * W_RECENCY + repeat * W_REPEAT,
  )));
}

// ── Apply predictive scoring and filter ───────────────────────────────────────

function slugify(str) {
  return (str ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

const ranked = products
  .filter((p) => (p.delta ?? 0) >= MIN_DELTA)
  .map((p) => ({
    ...p,
    slug:            p.slug ?? slugify(`${p.name ?? p.productId ?? ''}-${p.territory ?? ''}`),
    predictiveScore: computePredictiveScore(p),
    trendScore:      computeTrend(String(p.name ?? '').toLowerCase().trim()),
    recencyScore:    computeRecency(p),
  }))
  .sort((a, b) => b.predictiveScore - a.predictiveScore)
  .slice(0, LIMIT);

console.log(`[predictive-ranking]   ranked: ${ranked.length} products`);

// ── Write ranking output ──────────────────────────────────────────────────────

const outputDir = resolve(RANKING_OUT, '..');
if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true });

writeFileSync(RANKING_OUT, JSON.stringify({
  generatedAt:   new Date().toISOString(),
  count:         ranked.length,
  minDelta:      MIN_DELTA,
  formula:       'delta×0.35 + clickTrend×0.30 + recency×0.20 + repeatUser×0.15',
  products:      ranked,
}, null, 2), 'utf8');

console.log(`[predictive-ranking] ✅ Written ${ranked.length} products → ${RANKING_OUT}`);

// ── Write user-segments summary (distribution by tier) ───────────────────────

const viral      = ranked.filter((p) => (p.delta ?? 0) > 0.30).length;
const opportunity = ranked.filter((p) => (p.delta ?? 0) > 0.15 && (p.delta ?? 0) <= 0.30).length;
const low        = ranked.length - viral - opportunity;

writeFileSync(SEGMENTS_OUT, JSON.stringify({
  generatedAt: new Date().toISOString(),
  tiers: { viral, opportunity, low, total: ranked.length },
  topRising: ranked.filter((p) => p.trendScore > 60).slice(0, 10).map((p) => ({
    name: p.name ?? p.productId, predictiveScore: p.predictiveScore, trendScore: p.trendScore,
  })),
}, null, 2), 'utf8');

console.log(`[predictive-ranking] ✅ Segments → ${SEGMENTS_OUT}`);
console.log(`[predictive-ranking]   🔥 viral: ${viral}  🟠 opportunity: ${opportunity}  🟢 low: ${low}`);
