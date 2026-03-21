/**
 * export-top-deals.mjs — Step 4 of the data pipeline
 *
 * Reads:   data/output/product-scores.json  (from compute-product-scores.mjs)
 * Writes:  data/output/top-deals.json
 *
 * Filters scored products to those with a significant price spread (delta ≥
 * MIN_DELTA) and emits a canonical, slim JSON file consumed by:
 *   - Frontend: LandingPage TopDealsSection (served statically)
 *   - SEO scripts: generate-longtail-pages.mjs (priority products)
 *   - Social scripts: generate-social-posts.mjs (content generation)
 *
 * Having ONE canonical source of truth for "top deals" prevents drift between
 * the UI, the SEO pipeline, and the social-posting workflow.
 *
 * Usage:
 *   node scripts/export-top-deals.mjs
 *   node scripts/export-top-deals.mjs --min-delta=0.20 --limit=30
 *   node scripts/export-top-deals.mjs --input=./scores.json --output=./deals.json
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

const INPUT     = resolve(ROOT, flag('input',     'data/output/product-scores.json'));
const OUTPUT    = resolve(ROOT, flag('output',    'data/output/top-deals.json'));
const MIN_DELTA = parseFloat(flag('min-delta',   '0.15'));
const LIMIT     = parseInt(flag('limit',          '20'), 10);

// ── Load scored products ──────────────────────────────────────────────────────

if (!existsSync(INPUT)) {
  console.error(`[export-top-deals] ❌ Input not found: ${INPUT}`);
  console.error('  Run scripts/compute-product-scores.mjs first.');
  process.exit(1);
}

const raw      = JSON.parse(readFileSync(INPUT, 'utf8'));
const products = Array.isArray(raw) ? raw : (raw.products ?? []);
console.log(`[export-top-deals]   scored products loaded: ${products.length}`);

// ── Filter & shape ────────────────────────────────────────────────────────────

/**
 * Classify the "heat" of a deal based on its price spread.
 *   hot    → delta ≥ 0.50 € — post on social today
 *   warm   → delta ≥ 0.30 € — worth promoting
 *   normal → delta < 0.30 € — informational
 */
function classifyHeat(delta) {
  if (delta >= 0.5) return 'hot';
  if (delta >= 0.3) return 'warm';
  return 'normal';
}

/**
 * Build a URL-safe slug from a product name + territory.
 * Example: "Huile Tournesol 1 L" + "gp" → "huile-tournesol-1-l-gp"
 */
function slugify(name, territory) {
  const base = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return territory ? `${base}-${territory.toLowerCase()}` : base;
}

const deals = products
  .filter((p) => typeof p.delta === 'number' && p.delta >= MIN_DELTA)
  .slice(0, LIMIT)
  .map((p) => ({
    /** Canonical product name */
    product:      p.name,
    /** ISO-like territory code ('gp', 'mq', 'gf', 're', 'yt') */
    territory:    (p.territory ?? '').toLowerCase(),
    /** Best (lowest) observed price in EUR */
    bestPrice:    p.bestPrice,
    /** Worst (highest) observed price in EUR */
    worstPrice:   p.worstPrice,
    /** Price spread (max – min) rounded to 2 decimal places */
    delta:        p.delta,
    /** Cheapest retailer name */
    bestRetailer: p.bestRetailer ?? null,
    /** Composite score from the pipeline (0–100) */
    score:        p.globalScore,
    /** Deal heat classification */
    heat:         classifyHeat(p.delta),
    /** URL-safe slug for comparator deep-links */
    slug:         slugify(p.name, p.territory),
    /** ISO timestamp of when the observation data was last recorded */
    scoredAt:     raw.scoredAt ?? null,
  }));

console.log(`[export-top-deals]   deals after filter (delta ≥ ${MIN_DELTA}€): ${deals.length}`);

// ── Write output ──────────────────────────────────────────────────────────────

mkdirSync(resolve(ROOT, 'data/output'), { recursive: true });

const output = {
  exportedAt: new Date().toISOString(),
  minDelta:   MIN_DELTA,
  count:      deals.length,
  deals,
};

writeFileSync(OUTPUT, JSON.stringify(output, null, 2), 'utf8');
console.log(`[export-top-deals] ✅ ${deals.length} top deals → ${OUTPUT}`);
if (deals.length > 0) {
  const hot = deals.filter((d) => d.heat === 'hot').length;
  const warm = deals.filter((d) => d.heat === 'warm').length;
  console.log(`  🔥 hot: ${hot}  🟠 warm: ${warm}  🟢 normal: ${deals.length - hot - warm}`);
  deals.slice(0, 5).forEach((d, i) => {
    console.log(
      `  ${i + 1}. ${d.product} (${d.territory}) | Δ${d.delta}€ | score: ${d.score} | best: ${d.bestRetailer} ${d.bestPrice}€`,
    );
  });
}
