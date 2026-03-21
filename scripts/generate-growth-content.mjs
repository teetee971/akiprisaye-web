#!/usr/bin/env node
/**
 * generate-growth-content.mjs — Multi-format content generator (V2 Growth Brain)
 *
 * Reads:   data/output/product-scores.json  (from compute-product-scores.mjs)
 *          data/output/top-deals.json       (optional — preferred when available)
 * Writes:  data/output/growth-content.json
 *
 * Produces ready-to-distribute content in 3 formats for each viral product:
 *   tiktok   — short hook line for Reels / TikTok caption
 *   whatsapp — friendly broadcast message
 *   seo      — optimised product + territory title for page H1 / meta
 *
 * Usage:
 *   node scripts/generate-growth-content.mjs
 *   node scripts/generate-growth-content.mjs --min-delta=0.20 --limit=30
 *   node scripts/generate-growth-content.mjs --input=./scores.json
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

const MIN_DELTA = parseFloat(flag('min-delta', '0.15'));
const LIMIT     = parseInt(flag('limit',        '20'), 10);
const OUTPUT    = resolve(ROOT, flag('output', 'data/output/growth-content.json'));

const SITE_URL = (process.env.SITE_URL ?? 'https://teetee971.github.io/akiprisaye-web').replace(/\/$/, '');

// ── Try top-deals.json first, fall back to product-scores.json ────────────────

const CANDIDATES = [
  resolve(ROOT, flag('input', 'data/output/top-deals.json')),
  resolve(ROOT, 'data/output/product-scores.json'),
];

let products = [];
for (const p of CANDIDATES) {
  if (!existsSync(p)) continue;
  try {
    const raw = JSON.parse(readFileSync(p, 'utf8'));
    products  = Array.isArray(raw) ? raw : (raw.products ?? raw.deals ?? []);
    if (products.length > 0) {
      console.log(`[generate-growth-content]   loaded ${products.length} products from ${p}`);
      break;
    }
  } catch { /* try next */ }
}

if (products.length === 0) {
  console.warn('[generate-growth-content] ⚠ No product data found. Generating empty output.');
}

// ── Territory labels ──────────────────────────────────────────────────────────

const TERRITORY_LABELS = {
  gp: 'Guadeloupe', mq: 'Martinique', gf: 'Guyane', re: 'La Réunion', yt: 'Mayotte',
};

function territory(code) {
  return TERRITORY_LABELS[(code ?? '').toLowerCase()] ?? (code?.toUpperCase() ?? '');
}

// ── Slugify ───────────────────────────────────────────────────────────────────

function slugify(str) {
  return (str ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ── Content generators ────────────────────────────────────────────────────────

/**
 * Generate multi-format content for a single product.
 *
 * @param {object} product  Scored product (name, delta, bestPrice, territory, slug, …)
 * @returns {{ tiktok: string, whatsapp: string, seo: string }}
 */
function generateContent(product) {
  const name      = product.name ?? product.product ?? 'produit';
  const price     = product.bestPrice ?? product.price ?? 0;
  const delta     = typeof product.delta === 'number' ? product.delta : 0;
  const pct       = price > 0 ? Math.round((delta / (price + delta)) * 100) : 0;
  const terr      = territory(product.territory ?? product.code);
  const slug      = product.slug ?? slugify(`${name}-${product.territory ?? ''}`);
  const pageUrl   = `${SITE_URL}/comparateur/${slug}`;
  const bestStore = product.bestRetailer ?? product.retailer ?? 'l\'enseigne la moins chère';

  const tiktok = delta >= 0.5
    ? `🔥 ${name} à ${price.toFixed(2).replace('.', ',')}€ — tu paies ${delta.toFixed(2).replace('.', ',')}€ de trop ailleurs 😳`
    : `📉 Prix en baisse : ${name} à ${price.toFixed(2).replace('.', ',')}€ chez ${bestStore}`;

  const whatsapp = pct >= 10
    ? `🔥 Bon plan détecté : ${name} à ${price.toFixed(2).replace('.', ',')}€ chez ${bestStore} — soit -${pct}% vs le prix le plus cher.\n👉 ${pageUrl}`
    : `Promo détectée : ${name} maintenant ${price.toFixed(2).replace('.', ',')}€ chez ${bestStore}.\n👉 ${pageUrl}`;

  const seo = terr
    ? `${name} prix le moins cher ${terr} — comparateur de prix`
    : `${name} prix le moins cher — comparateur de prix DOM-TOM`;

  return { tiktok, whatsapp, seo, url: pageUrl, product: name, territory: terr, delta, heat: classifyHeat(delta) };
}

function classifyHeat(delta) {
  if (delta >= 0.5) return 'hot';
  if (delta >= 0.3) return 'warm';
  return 'normal';
}

// ── Viral selection ───────────────────────────────────────────────────────────

const selected = products
  .filter((p) => (p.delta ?? 0) >= MIN_DELTA)
  .sort((a, b) => (b.score ?? b.scoreFinal ?? 0) - (a.score ?? a.scoreFinal ?? 0))
  .slice(0, LIMIT);

console.log(`[generate-growth-content]   viral products selected: ${selected.length} (min delta: ${MIN_DELTA}€)`);

const content = selected.map(generateContent);

// ── Write output ──────────────────────────────────────────────────────────────

const outputDir = resolve(OUTPUT, '..');
if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true });

const out = {
  generatedAt: new Date().toISOString(),
  count:       content.length,
  minDelta:    MIN_DELTA,
  items:       content,
};

writeFileSync(OUTPUT, JSON.stringify(out, null, 2), 'utf8');
console.log(`[generate-growth-content] ✅ Written ${content.length} items → ${OUTPUT}`);

// ── Summary (for GitHub Actions step summary) ─────────────────────────────────

const viral = content.filter((c) => c.heat === 'hot').length;
const warm  = content.filter((c) => c.heat === 'warm').length;
console.log(`[generate-growth-content]   🔥 hot: ${viral}  🟠 warm: ${warm}  🟢 normal: ${content.length - viral - warm}`);
