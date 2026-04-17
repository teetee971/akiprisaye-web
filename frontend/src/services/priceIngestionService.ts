/**
 * Price Data Ingestion Service
 *
 * Module A – Pipeline d'ingestion des sources
 *
 * Normalises, deduplicates and caches price observations coming from:
 *  - OpenFoodFacts / OpenPrices API (via Cloudflare Functions proxy)
 *  - Local expanded-prices JSON files
 *  - Citizen contributions
 *
 * The result lands in priceCacheService (IndexedDB) for offline access.
 */
import {
  getCachedPrices,
  setCachedPrices,
  computePriceStats,
  type CachedObservation,
} from './priceCacheService';
import { normalizePriceValue } from './priceSearch/priceNormalizer';
import type { TerritoryCode } from '../constants/territories';
import { logWarn, logInfo } from '../utils/logger';

/** Time-to-live for ingested records (ms) */
const INGESTION_TTL_MS = 24 * 60 * 60 * 1000; // 24 h

/** Maximum age for an observation to be considered "fresh" and worth ingesting (days) */
const MAX_OBS_AGE_DAYS = 90;

/** Minimum valid price (€) – values below this are likely data errors */
const MIN_PRICE_EUR = 0.01;

/** Maximum plausible price for a single item (€) – outlier guard at ingestion */
const MAX_PRICE_EUR = 5000;

// ---------------------------------------------------------------------------
// Normalisation helpers
// ---------------------------------------------------------------------------

/** Normalise a raw source name to a consistent store identifier */
function normaliseSource(raw: string): string {
  const s = raw.trim().toLowerCase();
  if (s.includes('open_food_facts') || s.includes('openfoodfacts')) return 'open_food_facts';
  if (s.includes('open_prices') || s.includes('openprices')) return 'open_prices';
  if (s.includes('data.gouv') || s.includes('data_gouv')) return 'data_gouv';
  if (s.includes('citizen') || s.includes('citoyen') || s.includes('contribution'))
    return 'citizen';
  return s;
}

/** Guard: is this observation worth keeping? */
function isObservationValid(obs: { price: number; observedAt: string }): boolean {
  const price = normalizePriceValue(obs.price);
  if (!Number.isFinite(price) || price < MIN_PRICE_EUR || price > MAX_PRICE_EUR) return false;
  const ageMs = Date.now() - new Date(obs.observedAt).getTime();
  if (ageMs > MAX_OBS_AGE_DAYS * 24 * 60 * 60 * 1000) return false;
  return true;
}

/** Deduplication key for an observation */
function dedupKey(obs: CachedObservation): string {
  const day = obs.observedAt.slice(0, 10); // YYYY-MM-DD
  return `${obs.storeName}|${obs.price}|${day}`;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface RawObservation {
  ean: string;
  productName: string;
  price: number;
  storeName: string;
  currency?: string;
  observedAt: string;
  source: string;
}

/**
 * Ingest a batch of raw price observations for a given territory.
 *
 * - Validates and normalises each record
 * - Merges with any existing cached observations (no duplicates)
 * - Persists to IndexedDB via priceCacheService
 *
 * @returns number of new observations ingested
 */
export async function ingestPriceObservations(
  territory: TerritoryCode,
  rawObservations: RawObservation[]
): Promise<number> {
  // Group by EAN
  const byEAN = new Map<string, { productName: string; obs: RawObservation[] }>();
  for (const raw of rawObservations) {
    if (!raw.ean || !isObservationValid(raw)) continue;
    if (!byEAN.has(raw.ean)) {
      byEAN.set(raw.ean, { productName: raw.productName, obs: [] });
    }
    byEAN.get(raw.ean)!.obs.push(raw);
  }

  let totalNew = 0;

  for (const [ean, { productName, obs }] of byEAN.entries()) {
    // Load existing cached observations (even if expired, to merge)
    const existing = await getCachedPrices(territory, ean, true);
    const existingObs: CachedObservation[] = existing?.observations ?? [];

    // Build dedup set from existing
    const seen = new Set(existingObs.map(dedupKey));

    const newObs: CachedObservation[] = [];
    for (const raw of obs) {
      const candidate: CachedObservation = {
        storeName: raw.storeName.trim(),
        price: normalizePriceValue(raw.price),
        currency: raw.currency ?? 'EUR',
        observedAt: raw.observedAt,
        source: normaliseSource(raw.source),
      };
      const key = dedupKey(candidate);
      if (!seen.has(key)) {
        seen.add(key);
        newObs.push(candidate);
      }
    }

    if (newObs.length === 0) continue;

    const merged = [...existingObs, ...newObs];
    await setCachedPrices(territory, ean, productName, merged, INGESTION_TTL_MS);
    totalNew += newObs.length;
  }

  logInfo(`[ingestion] ${territory}: ${totalNew} new observations ingested`, {
    products: byEAN.size,
  });

  return totalNew;
}

/**
 * Fetch and ingest prices from the Cloudflare Function proxy.
 * Silently skips on error (caller decides whether to surface the failure).
 *
 * @param territory  Territory code
 * @param query      Product name or EAN to search
 */
export async function fetchAndIngestFromAPI(
  territory: TerritoryCode,
  query: string
): Promise<void> {
  const base = import.meta.env.BASE_URL ?? '/';
  const url = `${base}api/price-search?q=${encodeURIComponent(query)}&territory=${territory}`;

  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
      logWarn(`[ingestion] API returned ${res.status} for query="${query}"`);
      return;
    }
    const data = (await res.json()) as { observations?: RawObservation[] };
    if (Array.isArray(data.observations) && data.observations.length > 0) {
      await ingestPriceObservations(territory, data.observations);
    }
  } catch (err) {
    logWarn('[ingestion] API fetch failed – using cached data', err);
  }
}

/**
 * Compute statistics for a cached EAN in a territory.
 * Returns null when no cached data is available.
 */
export async function getPriceStats(territory: TerritoryCode, ean: string) {
  const cached = await getCachedPrices(territory, ean);
  if (!cached) return null;
  return {
    stats: computePriceStats(cached.observations),
    productName: cached.productName,
    cachedAt: new Date(cached.cachedAt),
    expiresAt: new Date(cached.expiresAt),
    storeCount: new Set(cached.observations.map((o) => o.storeName)).size,
  };
}
