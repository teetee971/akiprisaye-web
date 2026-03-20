/**
 * Compare service (price comparison)
 *
 * Pipeline:
 *   1. Check cache
 *   2. Resolve product identity via provider aggregation
 *   3. Fetch price observations from real providers (Open Prices, internal)
 *   4. Fall back to curated static observations only when providers return nothing
 *   5. Filter by retailer, sort by price
 *   6. Compute summary (min / max / average / savings)
 *   7. Cache and return
 *
 * Types are aligned with the shared contracts in shared/src/price.ts and
 * shared/src/api.ts — field names and value types are intentionally
 * identical so callers can use either definition interchangeably.
 */

import { getCache, setCache } from './cache.service.js';
import { searchProducts } from './products.service.js';
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
// Used only when all real providers return empty results for the territory.
// Marked as 'mock' so the UI can indicate data quality to the user.
const FALLBACK_OBSERVATIONS: PriceObservationRow[] = [
  { retailer: 'Leader Price', territory: 'GP', price: 2.89, currency: 'EUR', observedAt: '2026-03-20T08:30:00Z', source: 'mock' },
  { retailer: 'Carrefour',    territory: 'GP', price: 3.49, currency: 'EUR', observedAt: '2026-03-20T08:20:00Z', source: 'mock' },
  { retailer: 'Super U',      territory: 'GP', price: 3.72, currency: 'EUR', observedAt: '2026-03-20T07:55:00Z', source: 'mock' },
  { retailer: 'E.Leclerc',    territory: 'MQ', price: 2.95, currency: 'EUR', observedAt: '2026-03-20T08:15:00Z', source: 'mock' },
  { retailer: 'Match',        territory: 'MQ', price: 3.10, currency: 'EUR', observedAt: '2026-03-20T08:10:00Z', source: 'mock' },
];

// ── Helper ────────────────────────────────────────────────────────────────────

function buildSummary(observations: PriceObservationRow[]): CompareSummary {
  if (observations.length === 0) {
    return { min: null, max: null, average: null, savings: null, count: 0 };
  }
  const prices = observations.map((o) => o.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
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
  const cached = getCache<CompareResult>(cacheKey);
  if (cached) return cached;

  // 1 — Resolve product identity
  const products = await searchProducts(query);
  const product = products[0] ?? {
    id: query,
    name: query,
    barcode: query,
    source: 'mock' as const,
  };

  // 2 — Aggregate price observations from real providers in parallel.
  //     Both providers degrade gracefully: they return [] on any error.
  const barcode = product.barcode || query;
  const [openPricesRows, internalRows] = await Promise.all([
    fetchPriceObservations(barcode, territory),
    internalProvider(query, territory),
  ]);

  const providerRows: PriceObservationRow[] = [
    ...openPricesRows,
    ...internalRows,
  ];

  // 3 — Filter by territory; fall back to curated static data when empty.
  const territoryCode = territory.toUpperCase();
  let observations: PriceObservationRow[];

  if (providerRows.length > 0) {
    observations = providerRows.filter(
      (o) => o.territory.toUpperCase() === territoryCode,
    );
    // If the territory filter removes everything, keep all provider rows
    // (cross-territory display is better than an empty response).
    if (observations.length === 0) observations = providerRows;
  } else {
    // No real data — use curated fallback, same territory-filter logic.
    observations = FALLBACK_OBSERVATIONS.filter(
      (o) => o.territory.toUpperCase() === territoryCode,
    );
    if (observations.length === 0) observations = [...FALLBACK_OBSERVATIONS];
  }

  // 4 — Apply optional retailer filter
  if (retailer) observations = observations.filter((o) => o.retailer === retailer);

  // 5 — Sort by price ascending
  observations = [...observations].sort((a, b) => a.price - b.price);

  // 6 — Summarise
  const result: CompareResult = {
    product: {
      id:      product.id,
      name:    product.name,
      barcode: product.barcode,
      image:   product.image,
      brand:   product.brand,
    },
    territory,
    retailerFilter: retailer ?? null,
    observations,
    summary: buildSummary(observations),
  };

  setCache(cacheKey, result);
  return result;
}
