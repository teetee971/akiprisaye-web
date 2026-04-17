/**
 * Temporal Aggregation Service
 *
 * Aggregates observatoire price snapshots into monthly and annual summaries,
 * computes trends, and provides multi-period views per product / category / territory.
 */

import type { ObservatoireSnapshot, ObservatoireObservation } from './observatoireDataLoader';

// ─── Types ────────────────────────────────────────────────────────────────────

export type Trend = 'up' | 'down' | 'stable';

export interface MonthlyAggregate {
  /** ISO month key, e.g. "2026-01" */
  month: string;
  productKey: string;
  productName: string;
  category: string;
  territory: string;
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
  observationCount: number;
  enseignes: string[];
}

export interface AnnualAggregate {
  /** 4-digit year string, e.g. "2026" */
  year: string;
  productKey: string;
  productName: string;
  category: string;
  territory: string;
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
  observationCount: number;
  monthsCovered: string[];
}

export interface PriceTrendSeries {
  productKey: string;
  productName: string;
  category: string;
  territory: string;
  monthly: MonthlyAggregate[];
  annual: AnnualAggregate[];
  /** Overall trend across available months */
  trend: Trend;
  /** Percentage change from first to last month (null when < 2 months) */
  changePercent: number | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Extract ISO month key (YYYY-MM) from a date_snapshot string */
function toMonthKey(dateSnapshot: string): string {
  // Accepts "2026-01-05" or "2026-01"
  return dateSnapshot.slice(0, 7);
}

/** Round to 2 decimal places */
function r2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Determine trend from an ordered price array */
function computeTrend(prices: number[]): Trend {
  if (prices.length < 2) return 'stable';
  const first = prices[0];
  const last = prices[prices.length - 1];
  if (first <= 0) return 'stable';
  const pct = ((last - first) / first) * 100;
  if (pct > 2) return 'up';
  if (pct < -2) return 'down';
  return 'stable';
}

// ─── Core aggregation ─────────────────────────────────────────────────────────

/**
 * Build monthly aggregates from a list of observatoire snapshots.
 * Snapshots from the same month are merged together.
 */
export function buildMonthlyAggregates(snapshots: ObservatoireSnapshot[]): MonthlyAggregate[] {
  // key: `${territory}|${productKey}|${month}`
  const map = new Map<
    string,
    {
      month: string;
      productKey: string;
      productName: string;
      category: string;
      territory: string;
      prices: number[];
      enseignes: Set<string>;
    }
  >();

  for (const snapshot of snapshots) {
    const month = toMonthKey(snapshot.date_snapshot);
    const territory = snapshot.territoire;

    for (const obs of snapshot.donnees) {
      const productKey = obs.ean || obs.produit;
      const mapKey = `${territory}|${productKey}|${month}`;

      if (!map.has(mapKey)) {
        map.set(mapKey, {
          month,
          productKey,
          productName: obs.produit,
          category: obs.categorie,
          territory,
          prices: [],
          enseignes: new Set(),
        });
      }
      const entry = map.get(mapKey)!;
      entry.prices.push(obs.prix);
      if (obs.enseigne) entry.enseignes.add(obs.enseigne);
    }
  }

  return Array.from(map.values()).map((e) => ({
    month: e.month,
    productKey: e.productKey,
    productName: e.productName,
    category: e.category,
    territory: e.territory,
    avgPrice: r2(e.prices.reduce((s, p) => s + p, 0) / e.prices.length),
    minPrice: r2(Math.min(...e.prices)),
    maxPrice: r2(Math.max(...e.prices)),
    observationCount: e.prices.length,
    enseignes: Array.from(e.enseignes),
  }));
}

/**
 * Build annual aggregates from monthly aggregates.
 */
export function buildAnnualAggregates(monthly: MonthlyAggregate[]): AnnualAggregate[] {
  const map = new Map<
    string,
    {
      year: string;
      productKey: string;
      productName: string;
      category: string;
      territory: string;
      prices: number[];
      months: Set<string>;
    }
  >();

  for (const m of monthly) {
    const year = m.month.slice(0, 4);
    const mapKey = `${m.territory}|${m.productKey}|${year}`;

    if (!map.has(mapKey)) {
      map.set(mapKey, {
        year,
        productKey: m.productKey,
        productName: m.productName,
        category: m.category,
        territory: m.territory,
        prices: [],
        months: new Set(),
      });
    }
    const entry = map.get(mapKey)!;
    // Contribute the individual prices through the monthly avg
    for (let i = 0; i < m.observationCount; i++) {
      entry.prices.push(m.avgPrice);
    }
    entry.months.add(m.month);
  }

  return Array.from(map.values()).map((e) => ({
    year: e.year,
    productKey: e.productKey,
    productName: e.productName,
    category: e.category,
    territory: e.territory,
    avgPrice: r2(e.prices.reduce((s, p) => s + p, 0) / e.prices.length),
    minPrice: r2(Math.min(...e.prices)),
    maxPrice: r2(Math.max(...e.prices)),
    observationCount: e.prices.length,
    monthsCovered: Array.from(e.months).sort(),
  }));
}

/**
 * Build complete price trend series per (territory, productKey).
 */
export function buildPriceTrendSeries(snapshots: ObservatoireSnapshot[]): PriceTrendSeries[] {
  const monthly = buildMonthlyAggregates(snapshots);
  const annual = buildAnnualAggregates(monthly);

  // Group monthly by territory+product
  const grouped = new Map<string, MonthlyAggregate[]>();
  for (const m of monthly) {
    const key = `${m.territory}|${m.productKey}`;
    const arr = grouped.get(key) ?? [];
    arr.push(m);
    grouped.set(key, arr);
  }

  const result: PriceTrendSeries[] = [];

  grouped.forEach((months, key) => {
    const sorted = [...months].sort((a, b) => a.month.localeCompare(b.month));
    const first = sorted[0];
    const prices = sorted.map((m) => m.avgPrice);
    const trend = computeTrend(prices);
    const changePercent =
      sorted.length >= 2 && prices[0] > 0
        ? r2(((prices[prices.length - 1] - prices[0]) / prices[0]) * 100)
        : null;

    const ann = annual.filter((a) => `${a.territory}|${a.productKey}` === key);

    result.push({
      productKey: first.productKey,
      productName: first.productName,
      category: first.category,
      territory: first.territory,
      monthly: sorted,
      annual: ann,
      trend,
      changePercent,
    });
  });

  return result;
}

// ─── Filtering helpers ────────────────────────────────────────────────────────

export interface AggregationFilter {
  territory?: string;
  category?: string;
  enseigne?: string;
  productKey?: string;
  fromMonth?: string; // "YYYY-MM"
  toMonth?: string; // "YYYY-MM"
}

/** Filter monthly aggregates by the given criteria */
export function filterMonthly(
  monthly: MonthlyAggregate[],
  filter: AggregationFilter
): MonthlyAggregate[] {
  return monthly.filter((m) => {
    if (filter.territory && m.territory.toLowerCase() !== filter.territory.toLowerCase())
      return false;
    if (filter.category && m.category.toLowerCase() !== filter.category.toLowerCase()) return false;
    if (
      filter.enseigne &&
      !m.enseignes.map((e) => e.toLowerCase()).includes(filter.enseigne.toLowerCase())
    )
      return false;
    if (filter.productKey && m.productKey !== filter.productKey) return false;
    if (filter.fromMonth && m.month < filter.fromMonth) return false;
    if (filter.toMonth && m.month > filter.toMonth) return false;
    return true;
  });
}

// ─── Observation-level helpers ────────────────────────────────────────────────

/** All distinct categories across snapshots */
export function getCategories(snapshots: ObservatoireSnapshot[]): string[] {
  const cats = new Set<string>();
  for (const s of snapshots) {
    for (const obs of s.donnees) {
      cats.add(obs.categorie);
    }
  }
  return Array.from(cats).sort();
}

/** All distinct enseignes across snapshots */
export function getEnseignes(snapshots: ObservatoireSnapshot[]): string[] {
  const ens = new Set<string>();
  for (const s of snapshots) {
    for (const obs of s.donnees) {
      if (obs.enseigne) ens.add(obs.enseigne);
    }
  }
  return Array.from(ens).sort();
}

/** Filter observations by category (case-insensitive) */
export function filterObservationsByCategory(
  obs: ObservatoireObservation[],
  category: string
): ObservatoireObservation[] {
  const lc = category.toLowerCase();
  return obs.filter((o) => o.categorie.toLowerCase() === lc);
}

// ─── Anomaly detection ────────────────────────────────────────────────────────

export interface PriceAnomaly {
  productKey: string;
  productName: string;
  territory: string;
  month: string;
  avgPrice: number;
  /** Z-score relative to the product's own monthly price series */
  zScore: number;
  /** Direction of the anomaly */
  direction: 'spike' | 'drop';
}

/**
 * Detect months where a product's price deviates more than `threshold` standard
 * deviations from its own mean across the available monthly series.
 *
 * Only products with at least 3 data-points (months) are evaluated —
 * fewer points cannot produce a meaningful σ.
 */
export function detectPriceAnomalies(monthly: MonthlyAggregate[], threshold = 1.5): PriceAnomaly[] {
  // Group by territory + productKey
  const groups = new Map<string, MonthlyAggregate[]>();
  for (const m of monthly) {
    const key = `${m.territory}|${m.productKey}`;
    const arr = groups.get(key) ?? [];
    arr.push(m);
    groups.set(key, arr);
  }

  const anomalies: PriceAnomaly[] = [];

  groups.forEach((months) => {
    if (months.length < 3) return; // need at least 3 months for meaningful σ
    const prices = months.map((m) => m.avgPrice);
    const mean = prices.reduce((s, p) => s + p, 0) / prices.length;
    const variance = prices.reduce((s, p) => s + (p - mean) ** 2, 0) / prices.length;
    const stdDev = Math.sqrt(variance);
    if (stdDev === 0) return; // perfectly stable — no anomaly possible

    for (const m of months) {
      const zScore = Math.abs(m.avgPrice - mean) / stdDev;
      if (zScore > threshold) {
        anomalies.push({
          productKey: m.productKey,
          productName: m.productName,
          territory: m.territory,
          month: m.month,
          avgPrice: m.avgPrice,
          zScore: Math.round(zScore * 100) / 100,
          direction: m.avgPrice > mean ? 'spike' : 'drop',
        });
      }
    }
  });

  return anomalies;
}
