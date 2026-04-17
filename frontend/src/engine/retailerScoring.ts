/**
 * retailerScoring.ts — Retailer performance scoring (V4)
 *
 * Computes a performance score for each retailer based on:
 *   - click volume (traffic signal)
 *   - conversion rate (money signal)
 *   - average basket value (monetisation signal)
 *
 * Formula:
 *   retailerScore =
 *     clicks         × 0.40
 *     conversions    × 0.40
 *     avgBasketValue × 0.20
 *
 * Outputs are used for:
 *   - ranking retailers in the UI
 *   - detecting which retailers deserve more visibility
 *   - B2B commercial targeting (future sponsor candidates)
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export interface RetailerStats {
  /** Total clicks to this retailer */
  clicks?: number;
  /** Total affiliate conversions */
  conversions?: number;
  /** Average basket value at this retailer in EUR */
  avgBasketValue?: number;
  /** Number of distinct products listed at this retailer */
  productCount?: number;
  /** Territories where this retailer is active */
  territories?: string[];
}

export interface ScoredRetailer {
  name: string;
  stats: RetailerStats;
  /** Computed performance score 0–100 */
  retailerScore: number;
  /** Tier label */
  tier: 'top' | 'mid' | 'low';
}

// ── Normalisation caps ────────────────────────────────────────────────────────

const MAX_CLICKS = 500; // clicks → 100
const MAX_CONVERSIONS = 100; // conversions → 100
const MAX_AVG_BASKET = 50; // EUR → 100

// ── Core scoring ──────────────────────────────────────────────────────────────

/**
 * Compute the performance score for a single retailer.
 *
 * @param retailer  Retailer name
 * @param stats     Aggregated behavioural and commercial stats
 */
export function computeRetailerScore(retailer: string, stats: RetailerStats): number {
  void retailer; // name is used for identification, not scoring
  const clickScore = Math.min(100, ((stats.clicks ?? 0) / MAX_CLICKS) * 100);
  const convScore = Math.min(100, ((stats.conversions ?? 0) / MAX_CONVERSIONS) * 100);
  const basketScore = Math.min(100, ((stats.avgBasketValue ?? 0) / MAX_AVG_BASKET) * 100);

  return Math.min(
    100,
    Math.max(0, Math.round(clickScore * 0.4 + convScore * 0.4 + basketScore * 0.2))
  );
}

/**
 * Classify a retailer score into a tier.
 *
 *   top  ≥ 70 → strategic partner, highest visibility
 *   mid  ≥ 40 → active partner, standard visibility
 *   low   < 40 → low priority
 */
export function classifyRetailerTier(score: number): ScoredRetailer['tier'] {
  if (score >= 70) return 'top';
  if (score >= 40) return 'mid';
  return 'low';
}

/**
 * Score and rank a list of retailers.
 *
 * @param retailers  Map of retailer name → RetailerStats
 */
export function rankRetailers(retailers: Map<string, RetailerStats>): ScoredRetailer[] {
  return [...retailers.entries()]
    .map(([name, stats]) => {
      const score = computeRetailerScore(name, stats);
      return { name, stats, retailerScore: score, tier: classifyRetailerTier(score) };
    })
    .sort((a, b) => b.retailerScore - a.retailerScore);
}

/**
 * Build a RetailerStats map from a flat event log.
 *
 * @param events  { type, retailer, price?, ts }[]
 */
export function buildRetailerStatsMap(
  events: { type: string; retailer?: string; price?: number; ts: number }[]
): Map<string, RetailerStats> {
  const map = new Map<string, RetailerStats>();

  for (const e of events) {
    if (!e.retailer) continue;
    const key = e.retailer.trim();
    if (!map.has(key)) map.set(key, { clicks: 0, conversions: 0, avgBasketValue: 0 });
    const s = map.get(key)!;

    if (e.type === 'click' || e.type === 'affiliate_click' || e.type === 'deal_view') {
      s.clicks = (s.clicks ?? 0) + 1;
    }
    if (e.type === 'conversion') {
      s.conversions = (s.conversions ?? 0) + 1;
      // Running average of basket value
      if (e.price) {
        const prev = s.avgBasketValue ?? 0;
        const n = s.conversions;
        s.avgBasketValue = prev + (e.price - prev) / n;
      }
    }
  }

  return map;
}
