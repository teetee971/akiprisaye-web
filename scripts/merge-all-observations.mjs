/**
 * merge-all-observations.mjs — Observation merger (Step 2 of scraping pipeline)
 *
 * Reads:
 *   data/output/price-observations.json   (API/catalog sources — high confidence)
 *   data/output/scraped-observations.json  (scraper sources — lower confidence)
 *
 * Writes:
 *   data/output/merged-observations.json  (deduplicated, priority-sorted)
 *
 * Merge strategy:
 *   1. Priority = confidence × 0.7 + recencyScore × 0.3
 *   2. When two observations match the same product + retailer + territory,
 *      keep only the one with the highest priority score.
 *   3. Source priority order for tie-breaks: api > catalog > scraper
 *
 * Usage:
 *   node scripts/merge-all-observations.mjs
 *   node scripts/merge-all-observations.mjs --api=./obs.json --scraped=./scraped.json
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname }                                    from 'node:path';
import { fileURLToPath }                                       from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT      = resolve(__dirname, '..');

function flag(name, fallback) {
  const a = process.argv.find((x) => x.startsWith(`--${name}=`));
  return a ? a.split('=').slice(1).join('=') : fallback;
}

const API_INPUT     = resolve(ROOT, flag('api',     'data/output/price-observations.json'));
const SCRAPED_INPUT = resolve(ROOT, flag('scraped', 'data/output/scraped-observations.json'));
const OUTPUT        = resolve(ROOT, flag('output',  'data/output/merged-observations.json'));

const RECENCY_WINDOW_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// ── Source priority for tie-breaking ─────────────────────────────────────────
const SOURCE_PRIORITY = { api: 3, openfoodfacts: 3, openprices: 3, catalog: 2, internal: 2, scraper: 1 };

// ── Helpers ───────────────────────────────────────────────────────────────────

function loadObservations(path, label) {
  if (!existsSync(path)) {
    console.warn(`[merge-all-observations] ⚠️  ${label} not found: ${path} — skipping`);
    return [];
  }
  try {
    const raw = JSON.parse(readFileSync(path, 'utf8'));
    return Array.isArray(raw) ? raw : (raw.observations ?? raw.products ?? []);
  } catch (err) {
    console.error(`[merge-all-observations] ❌ Failed to parse ${label}: ${err.message}`);
    return [];
  }
}

function recencyScore(observedAt) {
  try {
    const ageMs = Date.now() - new Date(observedAt).getTime();
    return Math.max(0, 1 - ageMs / RECENCY_WINDOW_MS);
  } catch {
    return 0;
  }
}

/**
 * Composite merge priority:
 *   priority = confidence × 0.7 + recencyScore × 0.3
 */
function mergePriority(obs) {
  const confidence = obs.confidence ?? (obs.source === 'scraper' ? 0.75 : 0.90);
  return confidence * 0.7 + recencyScore(obs.observedAt) * 0.3;
}

/**
 * Deduplication key: product name (normalised) + retailer + territory.
 * When a barcode/productId is available it takes precedence.
 */
function dedupKey(obs) {
  const id = obs.productId ?? obs.name?.toLowerCase().trim().replace(/\s+/g, '-');
  const retailer = obs.retailer?.toLowerCase().trim() ?? 'unknown';
  const territory = obs.territory?.toLowerCase().trim() ?? '';
  return `${id}|${retailer}|${territory}`;
}

// ── Load ──────────────────────────────────────────────────────────────────────

console.log('[merge-all-observations] Loading sources…');
const apiObs     = loadObservations(API_INPUT,     'API observations');
const scrapedObs = loadObservations(SCRAPED_INPUT, 'Scraped observations');

console.log(`[merge-all-observations]   API/catalog: ${apiObs.length}`);
console.log(`[merge-all-observations]   Scraped:     ${scrapedObs.length}`);

// ── Merge ─────────────────────────────────────────────────────────────────────

// Combined list — API observations first (higher default confidence)
const combined = [...apiObs, ...scrapedObs];

// Deduplicate: for each unique key keep the highest-priority observation
const best = new Map();

for (const obs of combined) {
  if (!obs.name || typeof obs.price !== 'number') continue;
  const key = dedupKey(obs);
  const existing = best.get(key);
  if (!existing) {
    best.set(key, obs);
  } else {
    const existingPri = mergePriority(existing);
    const newPri      = mergePriority(obs);
    if (
      newPri > existingPri ||
      // Tie-break: prefer higher source priority
      (newPri === existingPri &&
        (SOURCE_PRIORITY[obs.source] ?? 0) > (SOURCE_PRIORITY[existing.source] ?? 0))
    ) {
      best.set(key, obs);
    }
  }
}

const merged = Array.from(best.values())
  .sort((a, b) => mergePriority(b) - mergePriority(a));

// ── Stats ─────────────────────────────────────────────────────────────────────

const bySource = {};
for (const obs of merged) {
  bySource[obs.source] = (bySource[obs.source] ?? 0) + 1;
}

const byRetailer = {};
for (const obs of merged) {
  byRetailer[obs.retailer] = (byRetailer[obs.retailer] ?? 0) + 1;
}

const duplicatesRemoved = combined.length - merged.length;
console.log(`[merge-all-observations]   merged total: ${merged.length} (${duplicatesRemoved} duplicates removed)`);
Object.entries(bySource).forEach(([s, n]) => console.log(`    source ${s}: ${n}`));

// ── Write ─────────────────────────────────────────────────────────────────────

mkdirSync(resolve(ROOT, 'data/output'), { recursive: true });
writeFileSync(OUTPUT, JSON.stringify({
  mergedAt:          new Date().toISOString(),
  totalCount:        merged.length,
  duplicatesRemoved,
  bySource,
  byRetailer,
  observations:      merged,
}, null, 2), 'utf8');

console.log(`[merge-all-observations] ✅ ${merged.length} merged observations → ${OUTPUT}`);
