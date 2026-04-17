/**
 * predictiveEngine.ts — Predictive product scoring (V3)
 *
 * Combines pipeline score, click trend, recency, and repeat-user interest
 * to predict which products should be surfaced next — before they go cold.
 *
 * Formula:
 *   predictiveScore =
 *     delta        × 0.35  (price spread — fundamental value signal)
 *     clickTrend   × 0.30  (normalised 0–100 momentum)
 *     recency      × 0.20  (freshness of last price observation)
 *     repeatUser   × 0.15  (how many repeat users have viewed this product)
 *
 * Output is a 0–100 score capped to avoid runaway values.
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PredictiveStats {
  /**
   * Normalised click trend score 0–100.
   * Use trendEngine.normaliseTrend(computeClickTrend(...)).
   */
  clickTrend: number;
  /**
   * Recency score 0–100: 100 = updated in the last hour, 0 = older than 7 days.
   */
  recency: number;
  /**
   * Repeat-user interest 0–100: fraction of views from users with repeatVisits ≥ 2,
   * scaled to 0–100.
   */
  repeatUserInterest: number;
}

export interface PredictiveProduct {
  name: string;
  /** Price spread max–min in EUR */
  delta: number;
  /** Pre-existing pipeline score (0–100) */
  score?: number;
  /** Computed predictive score (0–100) */
  predictiveScore: number;
  /** Territory ISO code */
  territory?: string;
  /** URL-safe slug */
  slug?: string;
  [key: string]: unknown;
}

// ── Weights ───────────────────────────────────────────────────────────────────

const W_DELTA = 0.35;
const W_TREND = 0.3;
const W_RECENCY = 0.2;
const W_REPEAT = 0.15;

// ── Core scoring ──────────────────────────────────────────────────────────────

/**
 * Compute the predictive score for a single product.
 *
 * @param product  Product with at least { delta: number }
 * @param stats    Computed behavioural stats for this product
 *
 * @example
 * const score = computePredictiveScore(
 *   { name: 'Coca-Cola 1,5 L', delta: 0.36 },
 *   { clickTrend: 80, recency: 90, repeatUserInterest: 60 },
 * );
 * // → 0.36×0.35 + 80×0.30 + 90×0.20 + 60×0.15 = ~51.1 (before cap)
 */
export function computePredictiveScore(product: { delta: number }, stats: PredictiveStats): number {
  // delta is in EUR (e.g. 0.36); we scale it to 0–100 assuming max useful delta = 5 €
  const deltaScore = Math.min(100, (product.delta / 5) * 100);

  const raw =
    deltaScore * W_DELTA +
    stats.clickTrend * W_TREND +
    stats.recency * W_RECENCY +
    stats.repeatUserInterest * W_REPEAT;

  return Math.min(100, Math.max(0, Math.round(raw)));
}

/**
 * Compute a recency score 0–100 from an ISO timestamp or a milliseconds age.
 *
 * 100 → updated in the last hour
 *  50 → updated ~1 day ago
 *   0 → older than 7 days
 */
export function computeRecencyScore(lastUpdatedAt: string | number): number {
  const ts = typeof lastUpdatedAt === 'string' ? Date.parse(lastUpdatedAt) : lastUpdatedAt;
  if (!ts || Number.isNaN(ts)) return 0;

  const ageMs = Date.now() - ts;
  const maxAgeMs = 7 * 24 * 60 * 60 * 1000; // 7 days
  const normalized = Math.max(0, 1 - ageMs / maxAgeMs);

  return Math.round(normalized * 100);
}

/**
 * Annotate a list of products with predictive scores.
 *
 * @param products   Scored product list (from pipeline)
 * @param statsMap   Map of product name (lowercase) → PredictiveStats
 */
export function rankPredictively(
  products: { name: string; delta: number; score?: number; [k: string]: unknown }[],
  statsMap: Map<string, PredictiveStats>
): PredictiveProduct[] {
  return products
    .map((p) => {
      const key = p.name.toLowerCase().trim();
      const stats = statsMap.get(key) ?? { clickTrend: 50, recency: 50, repeatUserInterest: 0 };

      return {
        ...p,
        predictiveScore: computePredictiveScore(p, stats),
      } as PredictiveProduct;
    })
    .sort((a, b) => b.predictiveScore - a.predictiveScore);
}

/**
 * Build a default PredictiveStats map from a simple click-count map and
 * product update timestamps.
 *
 * Useful for the Node.js pipeline where full event logs are not available.
 *
 * @param products         Array of { name, lastUpdatedAt? }
 * @param clickTrendMap    Map of lowercased name → normalised trend score (0–100)
 * @param repeatUserMap    Map of lowercased name → repeat-user count (raw)
 * @param maxRepeatUsers   Max repeat-user count across all products (for scaling)
 */
export function buildStatsMap(
  products: { name: string; lastUpdatedAt?: string | number }[],
  clickTrendMap: Map<string, number> = new Map(),
  repeatUserMap: Map<string, number> = new Map(),
  maxRepeatUsers = 1
): Map<string, PredictiveStats> {
  const map = new Map<string, PredictiveStats>();

  for (const p of products) {
    const key = p.name.toLowerCase().trim();
    const trend = clickTrendMap.get(key) ?? 50;
    const recency = p.lastUpdatedAt ? computeRecencyScore(p.lastUpdatedAt) : 50;
    const rawRepeat = repeatUserMap.get(key) ?? 0;
    const repeatUserInterest =
      maxRepeatUsers > 0 ? Math.round((rawRepeat / maxRepeatUsers) * 100) : 0;

    map.set(key, { clickTrend: trend, recency, repeatUserInterest });
  }

  return map;
}
