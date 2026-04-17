/**
 * revenueOS.ts — Revenue Operating System (V4 core)
 *
 * Cash-first product arbitration engine.
 *
 * Decides:
 *   - which products to surface on homepage
 *   - which SEO pages to boost
 *   - which alerts to send
 *   - which sponsored opportunities to show
 *
 * Score formula (weights sum to 1.00):
 *   revenueOSScore =
 *     clicks        × 0.20   (traffic signal)
 *     conversions   × 0.30   (money signal — highest weight)
 *     margin/delta  × 0.20   (price spread as margin proxy)
 *     sponsorBoost  × 0.15   (paid placement, capped and labelled)
 *     recency       × 0.10   (freshness of data)
 *     strategic     × 0.05   (manual strategic boost by operator)
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export interface RevenueOSStats {
  /** Raw click count for this product */
  clicks?: number;
  /** Affiliate conversion count */
  conversions?: number;
  /** Recency score 0–100 (100 = updated in last hour) */
  recency?: number;
}

export interface RevenueOSProduct {
  name: string;
  /** Price spread max–min in EUR */
  delta?: number;
  /** Operator-set sponsor boost (0–100) */
  sponsorBoost?: number;
  /** Operator-set strategic importance (0–100) */
  strategicBoost?: number;
  /** Whether this product has paid placement */
  isSponsored?: boolean;
  [key: string]: unknown;
}

export interface RevenueOSScoredProduct extends RevenueOSProduct {
  revenueOSScore: number;
  revenueTier: 'cash-max' | 'growth' | 'background';
}

// ── Weights ───────────────────────────────────────────────────────────────────

const W_CLICKS = 0.2;
const W_CONVERSIONS = 0.3;
const W_MARGIN = 0.2;
const W_SPONSOR = 0.15;
const W_RECENCY = 0.1;
const W_STRATEGIC = 0.05;

// ── Core scoring ──────────────────────────────────────────────────────────────

/**
 * Compute the Revenue OS score for a single product.
 *
 * All inputs are normalised to 0–100 before weighting.
 * The output is capped at 100.
 *
 * @param product  Product fields (delta, sponsorBoost, strategicBoost)
 * @param stats    Behavioural stats (clicks, conversions, recency)
 */
export function computeRevenueOSScore(product: RevenueOSProduct, stats: RevenueOSStats): number {
  // Normalise click count: assume 200 clicks = max score
  const clickScore = Math.min(100, ((stats.clicks ?? 0) / 200) * 100);
  // Normalise conversion count: assume 50 conversions = max score
  const conversionScore = Math.min(100, ((stats.conversions ?? 0) / 50) * 100);
  // Normalise delta: assume 5 € max useful spread
  const marginScore = Math.min(100, ((product.delta ?? 0) / 5) * 100);
  const sponsorScore = Math.min(100, product.sponsorBoost ?? 0);
  const recencyScore = Math.min(100, stats.recency ?? 50);
  const strategicScore = Math.min(100, product.strategicBoost ?? 0);

  const raw =
    clickScore * W_CLICKS +
    conversionScore * W_CONVERSIONS +
    marginScore * W_MARGIN +
    sponsorScore * W_SPONSOR +
    recencyScore * W_RECENCY +
    strategicScore * W_STRATEGIC;

  return Math.min(100, Math.max(0, Math.round(raw)));
}

/**
 * Score and tier a full product list.
 *
 * @param products   Product list
 * @param statsMap   Map of lowercased product name → RevenueOSStats
 */
export function scoreProducts(
  products: RevenueOSProduct[],
  statsMap: Map<string, RevenueOSStats> = new Map()
): RevenueOSScoredProduct[] {
  return products
    .map((p) => {
      const key = String(p.name).toLowerCase().trim();
      const stats = statsMap.get(key) ?? {};
      const score = computeRevenueOSScore(p, stats);
      return {
        ...p,
        revenueOSScore: score,
        revenueTier: classifyRevenueTier(score),
      };
    })
    .sort((a, b) => b.revenueOSScore - a.revenueOSScore);
}

/**
 * Classify a Revenue OS score into an action tier.
 *
 *   cash-max   ≥ 80 → push everywhere: homepage, push, social, SEO block
 *   growth    ≥ 50 → push moderately: SEO, comparator, secondary alerts
 *   background < 50 → keep but do not actively promote
 */
export function classifyRevenueTier(score: number): RevenueOSScoredProduct['revenueTier'] {
  if (score >= 80) return 'cash-max';
  if (score >= 50) return 'growth';
  return 'background';
}
