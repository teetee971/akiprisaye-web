/**
 * Compare service (price comparison)
 *
 * Pipeline:
 *   1. Check cache
 *   2. Resolve product identity via provider aggregation
 *   3. Build price observations (internal mock → real providers in Phase 2)
 *   4. Filter by retailer, sort by price
 *   5. Compute summary (min / max / average / savings)
 *   6. Cache and return
 *
 * Phase 2 TODO: replace mockObservations with real DB + external provider calls.
 */

import { getCache, setCache } from './cache.service.js';
import { searchProducts } from './products.service.js';

export interface PriceObservationRow {
  retailer: string;
  territory: string;
  price: number;
  currency: 'EUR';
  observedAt: string;
  source: 'open_food_facts' | 'open_prices' | 'internal' | 'mock';
}

export interface CompareSummary {
  min: number | null;
  max: number | null;
  average: number | null;
  savings: number | null;
  count: number;
}

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

// Static observations used until real price data is wired.
// Structure mirrors what a real DB query would return.
const STATIC_OBSERVATIONS: PriceObservationRow[] = [
  { retailer: 'Leader Price', territory: 'GP', price: 2.89, currency: 'EUR', observedAt: '2026-03-20T08:30:00Z', source: 'mock' },
  { retailer: 'Carrefour',    territory: 'GP', price: 3.49, currency: 'EUR', observedAt: '2026-03-20T08:20:00Z', source: 'mock' },
  { retailer: 'Super U',      territory: 'GP', price: 3.72, currency: 'EUR', observedAt: '2026-03-20T07:55:00Z', source: 'mock' },
  { retailer: 'E.Leclerc',    territory: 'MQ', price: 2.95, currency: 'EUR', observedAt: '2026-03-20T08:15:00Z', source: 'mock' },
  { retailer: 'Match',        territory: 'MQ', price: 3.10, currency: 'EUR', observedAt: '2026-03-20T08:10:00Z', source: 'mock' },
];

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
    source: 'mock',
  };

  // 2 — Fetch price observations
  // Phase 2: replace STATIC_OBSERVATIONS with real DB query + provider merge
  const territoryCode = territory.toUpperCase();
  let observations = STATIC_OBSERVATIONS.filter(
    (o) => o.territory.toUpperCase() === territoryCode,
  );
  // Cross-territory fallback for demo territories with no data
  if (observations.length === 0) observations = [...STATIC_OBSERVATIONS];

  // 3 — Apply retailer filter
  if (retailer) observations = observations.filter((o) => o.retailer === retailer);

  // 4 — Sort by price ascending
  observations = [...observations].sort((a, b) => a.price - b.price);

  // 5 — Summarise
  const result: CompareResult = {
    product: {
      id:     product.id,
      name:   product.name,
      barcode: product.barcode,
      image:  product.image,
      brand:  product.brand,
    },
    territory,
    retailerFilter: retailer ?? null,
    observations,
    summary: buildSummary(observations),
  };

  setCache(cacheKey, result);
  return result;
}
