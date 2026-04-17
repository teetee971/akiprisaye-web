/**
 * growthBrain.ts — Central decision engine for viral product selection.
 *
 * DATA → SCORE → SELECTION → CONTENT → DISTRIBUTION
 *
 * Responsibilities:
 *   1. Filter products with meaningful price spread (delta > minDelta)
 *   2. Classify them into viral / opportunity / low tiers
 *   3. Compute a final boost-adjusted score for ranking
 *
 * Intentionally pure and side-effect-free so it can run on both client and server.
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export type ViralTier = 'viral' | 'opportunity' | 'low';

export interface ScoredProduct {
  /** Canonical product name */
  name: string;
  /** Price spread (max – min) in EUR */
  delta: number;
  /** Base composite score from the pipeline (0–100) */
  score: number;
  /** Gross margin proxy (bestPrice / worstPrice – 1), 0–1 */
  margin?: number;
  /** Cumulative click count (injected from localStorage export) */
  clicks?: number;
  /** Milliseconds since last price update */
  ageMs?: number;
  /** Best (lowest) observed price in EUR */
  bestPrice?: number;
  /** Name of the cheapest retailer */
  bestRetailer?: string;
  /** ISO territory code, e.g. 'gp', 'mq' */
  territory?: string;
  /** URL-safe slug (product + territory) */
  slug?: string;
  /** Whether the product has been boosted by the boost engine */
  boost?: boolean;
}

export interface FinalScoredProduct extends ScoredProduct {
  /** Composite score after applying trending / click / recency boosts */
  scoreFinal: number;
  /** Viral tier label */
  tier: ViralTier;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const DEFAULT_MIN_DELTA = 0.15;
const DEFAULT_LIMIT = 20;
const RECENCY_WINDOW_MS = 24 * 60 * 60 * 1000; // 1 day = maximum recency boost

// ── Core functions ────────────────────────────────────────────────────────────

/**
 * Select the top viral products from a scored product list.
 *
 * @param products  Full pipeline output
 * @param minDelta  Minimum price spread (€) to qualify (default 0.15)
 * @param limit     Maximum products to return (default 20)
 */
export function selectViralProducts(
  products: ScoredProduct[],
  minDelta = DEFAULT_MIN_DELTA,
  limit = DEFAULT_LIMIT
): FinalScoredProduct[] {
  return products
    .filter((p) => typeof p.delta === 'number' && p.delta >= minDelta)
    .map(applyFinalScore)
    .sort((a, b) => b.scoreFinal - a.scoreFinal)
    .slice(0, limit);
}

/**
 * Classify a product into a viral tier based on its price spread.
 *
 *   'viral'       → delta > 0.30 € — post on social ASAP, top of page
 *   'opportunity' → delta > 0.15 € — worth promoting
 *   'low'         → delta ≤ 0.15 € — informational only
 */
export function classifyProduct(p: Pick<ScoredProduct, 'delta'>): ViralTier {
  if (p.delta > 0.3) return 'viral';
  if (p.delta > 0.15) return 'opportunity';
  return 'low';
}

/**
 * Compute the final composite score with trending, click, and recency boosts.
 *
 * scoreFinal = baseScore
 *            + trendingBoost   (up to +10 for viral tier)
 *            + clickBoost      (up to +15 for high-click products)
 *            + recencyBoost    (up to +10 for very recent updates)
 *
 * Capped at 100.
 */
export function computeFinalScore(p: ScoredProduct): number {
  const base = typeof p.score === 'number' ? p.score : 0;

  // Trending boost — products with a very large spread rise automatically
  const trendingBoost = p.delta >= 0.5 ? 10 : p.delta >= 0.3 ? 5 : 0;

  // Click boost — products that already attract clicks get more exposure
  const clicks = p.clicks ?? 0;
  const clickBoost = clicks >= 100 ? 15 : clicks >= 50 ? 10 : clicks >= 10 ? 5 : 0;

  // Recency boost — freshest data wins
  const recencyBoost =
    typeof p.ageMs === 'number' && p.ageMs < RECENCY_WINDOW_MS
      ? Math.round(10 * (1 - p.ageMs / RECENCY_WINDOW_MS))
      : 0;

  // Boost flag (from boost-engine.mjs pipeline)
  const boostExtra = p.boost ? 5 : 0;

  return Math.min(100, base + trendingBoost + clickBoost + recencyBoost + boostExtra);
}

// ── Internal helpers ──────────────────────────────────────────────────────────

function applyFinalScore(p: ScoredProduct): FinalScoredProduct {
  return {
    ...p,
    scoreFinal: computeFinalScore(p),
    tier: classifyProduct(p),
  };
}
