/**
 * topDealsEngine.ts
 *
 * Filters and ranks products to surface the best affiliate opportunities:
 *   - significant price spread (delta > minDelta) → worth promoting
 *   - sorted by composite score descending (price delta + relevance)
 *   - sliced to a fixed display limit
 *
 * Integrates with the data-pipeline output (product-scores.json) and the
 * front-end revenue engine (revenueEngine.ts), sharing the same scoring
 * modifiers (delta < 0.10 → ×0.5, bestPrice > 10 → ×1.2).
 *
 * Usage:
 *   import { getTopDeals } from '../modules/topDealsEngine';
 *   const deals = getTopDeals(products);           // top 20, delta > 0.15
 *   const hotDeals = getTopDeals(products, 0.30);  // only big spreads
 */

// ── Types ─────────────────────────────────────────────────────────────────────

/** Minimal product shape expected by getTopDeals. */
export interface DealProduct {
  /** Canonical product name */
  name: string;
  /** Price spread (max – min) in EUR */
  delta: number;
  /** Composite score from the growth-brain pipeline (0–100) */
  score: number;
  /** Best (lowest) observed price in EUR */
  bestPrice?: number;
  /** Name of the cheapest retailer */
  bestRetailer?: string;
  /** ISO territory code, e.g. 'gp', 'mq' */
  territory?: string;
  /** URL-safe slug for deep-linking into the comparator */
  slug?: string;
}

/** A Deal is a DealProduct guaranteed to have passed the delta threshold. */
export type Deal = DealProduct & { delta: number };

// ── Engine ────────────────────────────────────────────────────────────────────

/**
 * Return the top deals from a product list.
 *
 * @param products  Full scored product list (from pipeline or revenueEngine)
 * @param minDelta  Minimum price spread in EUR to qualify (default 0.15)
 * @param limit     Maximum number of deals to return (default 20)
 *
 * @example
 * const deals = getTopDeals(products);
 * const urgentDeals = getTopDeals(products, 0.30, 5);
 */
export function getTopDeals(products: DealProduct[], minDelta = 0.15, limit = 20): Deal[] {
  return products
    .filter((p) => p.delta >= minDelta)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit) as Deal[];
}

/**
 * Classify a deal's heat level based on delta magnitude.
 *
 * Returned values are used to drive badge colours in the UI:
 *   'hot'    → delta ≥ 0.50 € — 🔥  bright red  — post on social ASAP
 *   'warm'   → delta ≥ 0.30 € — 🟠  amber
 *   'normal' → delta < 0.30 € — 🟢  green
 */
export function classifyDealHeat(delta: number): 'hot' | 'warm' | 'normal' {
  if (delta >= 0.5) return 'hot';
  if (delta >= 0.3) return 'warm';
  return 'normal';
}

/**
 * Format a delta value as a human-readable string, e.g. "0,36 €".
 */
export function formatDelta(delta: number): string {
  return (
    delta.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) +
    '\u00a0€'
  );
}
