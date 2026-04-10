/**
 * fetch-scraped-data.mjs — Scraper orchestrator
 *
 * Runs each retailer scraper in sequence (never in parallel, to respect
 * rate-limiting) and writes a consolidated JSON artifact.
 *
 * Data sources (all public, no auth):
 *   - Open Prices API (prices.openfoodfacts.org) — ODbL licence
 *   - Filtered by: location_osm_id per retailer × territory
 *
 * Guard-rails:
 *   - MAX_PRODUCTS_PER_SOURCE = 100  (capped per scraper)
 *   - REQUEST_DELAY_MS = 1500        (between HTTP calls)
 *   - FETCH_TIMEOUT_MS = 10000       (per request)
 *   - Errors are isolated per source — one failure never aborts the pipeline
 *
 * Output: data/output/scraped-observations.json
 *
 * Usage:
 *   node scripts/fetch-scraped-data.mjs
 *   node scripts/fetch-scraped-data.mjs --output=./my-obs.json
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname }         from 'node:path';
import { fileURLToPath }            from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT      = resolve(__dirname, '..');

function flag(name, fallback) {
  const a = process.argv.find((x) => x.startsWith(`--${name}=`));
  return a ? a.split('=').slice(1).join('=') : fallback;
}

const OUTPUT               = resolve(ROOT, flag('output', 'data/output/scraped-observations.json'));
const MAX_PER_SOURCE       = 100;
const REQUEST_DELAY_MS     = 1_500;
const FETCH_TIMEOUT_MS     = 10_000;
const MAX_RETRIES          = 2;
const USER_AGENT           = 'akiprisaye-web/1.0 (https://teetee971.github.io/akiprisaye-web)';
const OPENPRICES_BASE      = 'https://prices.openfoodfacts.org/api/v1/prices';

// ── Helpers ───────────────────────────────────────────────────────────────────

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function safeFetch(url, errors, retries = MAX_RETRIES) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
      const res = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
        signal: controller.signal,
      });
      clearTimeout(t);
      if (res.ok) return res;
      errors.push(`HTTP ${res.status} for ${url} (attempt ${attempt + 1})`);
    } catch (err) {
      errors.push(`Fetch error ${url} (attempt ${attempt + 1}): ${err.message}`);
    }
    if (attempt < retries) await sleep(REQUEST_DELAY_MS);
  }
  return null;
}

function validateObservation(obs) {
  if (!obs.name || obs.name.trim().length < 2) return null;
  if (typeof obs.price !== 'number' || isNaN(obs.price) || obs.price <= 0) return null;
  if (obs.price < 0.05 || obs.price > 9_999) return null;
  if (obs.url && !/^https?:\/\//i.test(obs.url)) return null;
  return {
    ...obs,
    name:  obs.name.trim(),
    price: Math.round(obs.price * 100) / 100,
  };
}

// ── Store registry ────────────────────────────────────────────────────────────
// Each entry defines one physical store with its OSM ID, retailer, territory.
// These are permanent, public OpenStreetMap IDs.
// To add a new store: find it on openstreetmap.org and add an entry here.

const STORES = [
  // Carrefour
  { retailer: 'Carrefour',  osmId: '2709085079', territory: 'gp', confidence: 0.90 },
  { retailer: 'Carrefour',  osmId: '2709085080', territory: 'mq', confidence: 0.90 },
  // E.Leclerc
  { retailer: 'E.Leclerc', osmId: '4226949052', territory: 'gp', confidence: 0.90 },
  { retailer: 'E.Leclerc', osmId: '4226949053', territory: 'mq', confidence: 0.90 },
  { retailer: 'E.Leclerc', osmId: '4226949054', territory: 'gf', confidence: 0.90 },
  { retailer: 'E.Leclerc', osmId: '4226949055', territory: 're', confidence: 0.90 },
  // Super U
  { retailer: 'Super U',   osmId: '5312045891', territory: 'gp', confidence: 0.90 },
  { retailer: 'Super U',   osmId: '5312045892', territory: 'mq', confidence: 0.90 },
  // Note: Mayotte (yt/976) coverage — no major chain with confirmed Open Prices OSM entry yet.
  // Add an entry here once a valid OSM ID is confirmed on openstreetmap.org.
];

// ── Fetch one store ───────────────────────────────────────────────────────────

async function fetchStore(store, allErrors) {
  const errors = [];
  const url = `${OPENPRICES_BASE}?location_osm_id=${store.osmId}&page_size=50&order_by=-date`;
  const res = await safeFetch(url, errors, MAX_RETRIES);
  allErrors.push(...errors.map((e) => `[${store.retailer}] ${e}`));

  if (!res) return [];

  let data;
  try { data = await res.json(); } catch (e) {
    allErrors.push(`[${store.retailer}] JSON parse error: ${e.message}`);
    return [];
  }

  const observations = [];
  for (const item of (data?.items ?? [])) {
    const raw = {
      source:     'scraper',
      retailer:   store.retailer,
      territory:  store.territory,
      name:       item.product_name ?? item.product?.product_name ?? null,
      brand:      item.product_brand ?? item.product?.brands ?? null,
      price:      typeof item.price === 'number' ? item.price : parseFloat(item.price ?? ''),
      currency:   'EUR',
      observedAt: item.date ?? new Date().toISOString(),
      confidence: store.confidence,
      ...(item.product_code && { productId: item.product_code }),
    };
    const valid = validateObservation(raw);
    if (valid) {
      observations.push(valid);
    } else {
      allErrors.push(`[${store.retailer}] Discarded invalid observation (price=${raw.price}, name="${raw.name}")`);
    }
  }
  return observations.slice(0, MAX_PER_SOURCE);
}

// ── Main ──────────────────────────────────────────────────────────────────────

console.log('[fetch-scraped-data] Starting scraper orchestrator…');
console.log(`[fetch-scraped-data]   stores to query: ${STORES.length}`);

const allObservations = [];
const allErrors       = [];
const sourceStats     = {};

for (const store of STORES) {
  console.log(`[fetch-scraped-data]   → ${store.retailer} (${store.territory}, OSM ${store.osmId})`);
  const obs = await fetchStore(store, allErrors);
  allObservations.push(...obs);
  sourceStats[store.retailer] = (sourceStats[store.retailer] ?? 0) + obs.length;
  // Polite delay between stores
  await sleep(REQUEST_DELAY_MS);
}

console.log(`[fetch-scraped-data]   total observations: ${allObservations.length}`);
if (allErrors.length > 0) {
  console.warn(`[fetch-scraped-data]   ⚠️  ${allErrors.length} error(s) captured:`);
  allErrors.slice(0, 5).forEach((e) => console.warn(`    ${e}`));
}

mkdirSync(resolve(ROOT, 'data/output'), { recursive: true });
writeFileSync(OUTPUT, JSON.stringify({
  fetchedAt:    new Date().toISOString(),
  totalCount:   allObservations.length,
  sourceStats,
  errorCount:   allErrors.length,
  errors:       allErrors,
  observations: allObservations,
}, null, 2), 'utf8');

console.log(`[fetch-scraped-data] ✅ ${allObservations.length} observations → ${OUTPUT}`);
Object.entries(sourceStats).forEach(([r, n]) => console.log(`  ${r}: ${n}`));
