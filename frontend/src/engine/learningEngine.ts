/**
 * learningEngine.ts — Self-learning score adjuster.
 *
 * The learning engine consumes behavioural events (clicks, conversions)
 * and raises the effective score of products that generate real revenue.
 *
 * WHAT GENERATES MONEY RISES AUTOMATICALLY.
 *
 * Design constraints:
 *   - Pure functions — no I/O, no side effects
 *   - RGPD-safe — receives anonymised aggregates, not individual events
 *   - Reversible — original score is preserved alongside adjustedScore
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ProductEvents {
  /** Total click count for this product (from localStorage export) */
  clicks?: number;
  /** Total conversion count (affiliate link clicked → retailer reached) */
  conversions?: number;
  /** Total social-share count (WhatsApp / Facebook) */
  shares?: number;
}

export interface LearningInput {
  /** Canonical product name or id — used to match events to product */
  name: string;
  /** Current composite score (0–100) */
  score: number;
  /** All other product fields are passed through unchanged */
  [key: string]: unknown;
}

export interface LearningOutput extends LearningInput {
  /** Original score before learning adjustment */
  baseScore: number;
  /** Adjusted score after applying click + conversion signals */
  adjustedScore: number;
  /** Total contribution from learning signals */
  learningDelta: number;
}

// ── Signal weights ────────────────────────────────────────────────────────────

const CLICK_WEIGHT = 0.5; // each click adds 0.5 to score
const CONVERSION_WEIGHT = 2.0; // each conversion adds 2.0 (high-value signal)
const SHARE_WEIGHT = 1.0; // each share adds 1.0 (virality signal)
const MAX_ADJUSTMENT = 30; // cap learning delta to avoid runaway scores

// ── Core API ──────────────────────────────────────────────────────────────────

/**
 * Adjust a product's score based on observed behavioural events.
 *
 * @param product  Any scored product with a numeric `score` field
 * @param events   Aggregated click / conversion counts for this product
 *
 * @example
 * const adjusted = adjustScore(product, { clicks: 12, conversions: 2 });
 * // adjustedScore = product.score + 12*0.5 + 2*2.0 = product.score + 10
 */
export function adjustScore(product: LearningInput, events: ProductEvents): LearningOutput {
  const clicks = Math.max(0, Math.round(events.clicks ?? 0));
  const conversions = Math.max(0, Math.round(events.conversions ?? 0));
  const shares = Math.max(0, Math.round(events.shares ?? 0));

  const rawDelta = clicks * CLICK_WEIGHT + conversions * CONVERSION_WEIGHT + shares * SHARE_WEIGHT;

  const learningDelta = Math.min(MAX_ADJUSTMENT, rawDelta);
  const adjustedScore = Math.min(100, product.score + learningDelta);

  return {
    ...product,
    baseScore: product.score,
    score: adjustedScore,
    adjustedScore,
    learningDelta,
  };
}

/**
 * Apply learning adjustments to a full product list.
 *
 * `eventMap` keys are lowercased product names or IDs.
 * Products without events are returned unchanged (learningDelta = 0).
 *
 * @param products  Array of scored products
 * @param eventMap  Map of product name (lowercase) → ProductEvents
 */
export function applyLearning(
  products: LearningInput[],
  eventMap: Map<string, ProductEvents>
): LearningOutput[] {
  return products.map((p) => {
    const key = String(p.name).toLowerCase().trim();
    const events = eventMap.get(key) ?? {};
    return adjustScore(p, events);
  });
}

/**
 * Build an event map from a flat array of tracked events (e.g. from localStorage).
 *
 * @param events  Raw event log: { type: 'click'|'conversion'|'share', product: string }[]
 */
export function buildEventMap(
  events: { type: string; product: string }[]
): Map<string, ProductEvents> {
  const map = new Map<string, ProductEvents>();

  for (const e of events) {
    if (!e.product) continue;
    const key = String(e.product).toLowerCase().trim();
    if (!map.has(key)) map.set(key, { clicks: 0, conversions: 0, shares: 0 });
    const entry = map.get(key)!;

    if (e.type === 'click') entry.clicks = (entry.clicks ?? 0) + 1;
    if (e.type === 'conversion') entry.conversions = (entry.conversions ?? 0) + 1;
    if (e.type === 'share') entry.shares = (entry.shares ?? 0) + 1;
  }

  return map;
}
