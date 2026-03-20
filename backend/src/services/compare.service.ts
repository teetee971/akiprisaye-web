/**
 * Compare service (price comparison)
 *
 * Pipeline:
 *   1. Cache-aside — return immediately if fresh result exists
 *   2. Resolve product identity via provider aggregation
 *   3. Enrich with OpenFoodFacts (image / brand / category if missing)
 *   4. Fetch price observations from real providers in parallel
 *   5. Normalize retailer names + deduplicate + discard outliers
 *   6. Fall back to curated static observations only when providers return nothing
 *   7. Filter by territory, apply retailer filter, sort ascending
 *   8. Compute summary (min / max / average / savings)
 *   9. Store in cache and return
 *
 * Types are aligned with the shared contracts in shared/src/price.ts and
 * shared/src/api.ts — field names and value types are intentionally
 * identical so callers can use either definition interchangeably.
 */

import { withCache, CACHE_TTL_COMPARE_MS } from './cache.service.js';
import { searchProducts } from './products.service.js';
import { enrichProduct } from '../providers/openfoodfacts.provider.js';
import { fetchPriceObservations } from '../providers/openprices.provider.js';
import { internalProvider } from '../providers/internal.provider.js';

// ── Territory type — mirrors shared/src/price.ts TerritoryCode ────────────────
export type TerritoryCode =
  | 'GP' | 'MQ' | 'GF' | 'RE' | 'YT' | 'PM'
  | 'BL' | 'MF' | 'NC' | 'PF' | 'WF';

// ── Price source — mirrors shared/src/price.ts PriceSourceId ─────────────────
export type PriceSourceId = 'open_food_facts' | 'open_prices' | 'internal' | 'mock';

// ── Shared-compatible interfaces ──────────────────────────────────────────────

/** Mirrors shared/src/price.ts PriceObservation */
export interface PriceObservationRow {
  retailer: string;
  territory: string;
  price: number;
  currency: 'EUR';
  observedAt: string;
  source: PriceSourceId;
}

/** Mirrors shared/src/price.ts CompareSummary */
export interface CompareSummary {
  min: number | null;
  max: number | null;
  average: number | null;
  savings: number | null;
  count: number;
}

/** Mirrors shared/src/api.ts CompareResponse */
export interface CompareResult {
  product: {
    id: string;
    name: string;
    barcode: string;
    image?: string;
    brand?: string;
    category?: string;
  };
  territory: string;
  retailerFilter: string | null;
  observations: PriceObservationRow[];
  summary: CompareSummary;
}

export interface CompareParams {
  query: string;
  territory: string;
  retailer?: string;
}

// ── Curated fallback observations ─────────────────────────────────────────────
// Used ONLY when all real providers return empty results for the territory.
// Marked as 'mock' so the UI can display a data-quality indicator.
const FALLBACK_OBSERVATIONS: PriceObservationRow[] = [
  { retailer: 'Leader Price', territory: 'GP', price: 2.89, currency: 'EUR', observedAt: '2026-03-20T08:30:00Z', source: 'mock' },
  { retailer: 'Carrefour',    territory: 'GP', price: 3.49, currency: 'EUR', observedAt: '2026-03-20T08:20:00Z', source: 'mock' },
  { retailer: 'Super U',      territory: 'GP', price: 3.72, currency: 'EUR', observedAt: '2026-03-20T07:55:00Z', source: 'mock' },
  { retailer: 'E.Leclerc',    territory: 'MQ', price: 2.95, currency: 'EUR', observedAt: '2026-03-20T08:15:00Z', source: 'mock' },
  { retailer: 'Match',        territory: 'MQ', price: 3.10, currency: 'EUR', observedAt: '2026-03-20T08:10:00Z', source: 'mock' },
];

// ── Retailer canonical map ─────────────────────────────────────────────────────
// Maps lowercase variants to the canonical display name.
const RETAILER_CANON: Record<string, string> = {
  'leader price':     'Leader Price',
  'leaderprice':      'Leader Price',
  'carrefour market': 'Carrefour Market',
  'carrefour':        'Carrefour',
  'super u':          'Super U',
  'superu':           'Super U',
  'e.leclerc':        'E.Leclerc',
  'leclerc':          'E.Leclerc',
  'match':            'Match',
  'simply market':    'Simply Market',
  'simplymarket':     'Simply Market',
  'aldi':             'Aldi',
  'lidl':             'Lidl',
  'intermarché':      'Intermarché',
  'intermarche':      'Intermarché',
  'casino':           'Casino',
  'spar':             'Spar',
  'écomax':           'Écomax',
  'ecomax':           'Écomax',
};

// ── Aggregation utilities (exported for unit testing) ─────────────────────────

/**
 * Return the canonical display name for a retailer, falling back to the
 * original (trimmed) value when no mapping is found.
 */
export function normalizeRetailer(name: string): string {
  const lower = name.trim().toLowerCase();
  return RETAILER_CANON[lower] ?? name.trim();
}

/**
 * Deduplicate observations.
 * Key: (normalized-retailer, territory).
 * When multiple rows share the same key, keep the most recently observed one.
 */
export function deduplicateObservations(obs: PriceObservationRow[]): PriceObservationRow[] {
  const map = new Map<string, PriceObservationRow>();
  for (const o of obs) {
    const normalized = normalizeRetailer(o.retailer);
    const key = `${normalized.toLowerCase()}|${o.territory.toUpperCase()}`;
    const existing = map.get(key);
    if (!existing || o.observedAt > existing.observedAt) {
      map.set(key, { ...o, retailer: normalized });
    }
  }
  return Array.from(map.values());
}

// ── Statistics helpers ────────────────────────────────────────────────────────

/**
 * Interpolated quartile on a pre-sorted array of numbers.
 * Robust for all array sizes (avoids IQR=0 from floor-only indexing).
 *
 * @param sorted  Ascending-sorted price array (not mutated)
 * @param p       Quantile in [0, 1], e.g. 0.25 for Q1
 */
function interpolatedQuartile(sorted: number[], p: number): number {
  const idx = (sorted.length - 1) * p;
  const lo  = Math.floor(idx);
  const hi  = Math.ceil(idx);
  return lo === hi ? sorted[lo] : sorted[lo] + (idx - lo) * (sorted[hi] - sorted[lo]);
}

/**
 * Remove statistical outliers using the IQR method.
 * Skipped when there are fewer than 4 observations (IQR not meaningful).
 *
 * Uses linear interpolation for Q1/Q3 so bounds are accurate for all
 * array sizes (avoids IQR=0 edge cases with floor-only indexing).
 *
 * Bounds: [Q1 − 1.5×IQR , Q3 + 1.5×IQR]
 */
export function discardOutliers(obs: PriceObservationRow[]): PriceObservationRow[] {
  if (obs.length < 4) return obs;

  const sorted = [...obs].map((o) => o.price).sort((a, b) => a - b);

  const q1  = interpolatedQuartile(sorted, 0.25);
  const q3  = interpolatedQuartile(sorted, 0.75);
  const iqr = q3 - q1;

  // If all prices are identical IQR=0; keep everything to avoid empty result
  if (iqr === 0) return obs;

  const lower = q1 - 1.5 * iqr;
  const upper = q3 + 1.5 * iqr;

  return obs.filter((o) => o.price >= lower && o.price <= upper);
}

// ── Summary builder ───────────────────────────────────────────────────────────

function buildSummary(observations: PriceObservationRow[]): CompareSummary {
  if (observations.length === 0) {
    return { min: null, max: null, average: null, savings: null, count: 0 };
  }
  const prices = observations.map((o) => o.price);
  const min    = Math.min(...prices);
  const max    = Math.max(...prices);
  const average = parseFloat((prices.reduce((s, p) => s + p, 0) / prices.length).toFixed(2));
  return {
    min,
    max,
    average,
    savings: parseFloat((max - min).toFixed(2)),
    count: observations.length,
  };
}

// ── Service ───────────────────────────────────────────────────────────────────

export async function compareService(params: CompareParams): Promise<CompareResult> {
  const { query, territory, retailer } = params;
  const cacheKey = `compare:${territory}:${query}:${retailer ?? 'all'}`;

  return withCache(cacheKey, CACHE_TTL_COMPARE_MS, async () => {

    // 1 — Resolve product identity
    const products = await searchProducts(query);
    const base = products[0] ?? {
      id:      query,
      name:    query,
      barcode: query,
      source:  'mock' as const,
    };

    // 2 — Enrich with OpenFoodFacts for any missing metadata
    const enriched = await enrichProduct({
      barcode:  base.barcode,
      image:    base.image,
      brand:    base.brand,
      category: base.category,
    }).catch(() => null);

    const product = {
      id:       base.id,
      name:     enriched?.name ?? base.name,
      barcode:  base.barcode,
      image:    base.image    ?? enriched?.image,
      brand:    base.brand    ?? enriched?.brand,
      category: base.category ?? enriched?.category,
    };

    // 3 — Aggregate price observations from all real providers in parallel.
    //     Both providers degrade gracefully: they return [] on any error.
    const barcode = product.barcode || query;
    const [openPricesRows, internalRows] = await Promise.all([
      fetchPriceObservations(barcode, territory),
      internalProvider(query, territory),
    ]);

    const rawProviderRows: PriceObservationRow[] = [
      ...openPricesRows,
      ...internalRows,
    ];

    // 4 — Normalize → deduplicate → discard outliers
    const providerRows = discardOutliers(
      deduplicateObservations(rawProviderRows),
    );

    // 5 — Territory filter; fall back to curated static data when empty
    const territoryCode = territory.toUpperCase();
    let observations: PriceObservationRow[];

    if (providerRows.length > 0) {
      observations = providerRows.filter(
        (o) => o.territory.toUpperCase() === territoryCode,
      );
      // Cross-territory display is better than an empty response
      if (observations.length === 0) observations = providerRows;
    } else {
      // No real data — curated fallback with same territory logic
      observations = FALLBACK_OBSERVATIONS.filter(
        (o) => o.territory.toUpperCase() === territoryCode,
      );
      if (observations.length === 0) observations = [...FALLBACK_OBSERVATIONS];
    }

    // 6 — Optional retailer filter
    if (retailer) observations = observations.filter((o) => o.retailer === retailer);

    // 7 — Sort: cheapest first; most recent first as tie-breaker
    observations = [...observations].sort((a, b) => {
      const priceDiff = a.price - b.price;
      if (priceDiff !== 0) return priceDiff;
      return b.observedAt.localeCompare(a.observedAt);
    });

    // 8 — Build result
    return {
      product,
      territory,
      retailerFilter: retailer ?? null,
      observations,
      summary: buildSummary(observations),
    };
  });
}
