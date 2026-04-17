/**
 * growthBrain.ts
 *
 * Central decision module for the autonomous growth system.
 *
 * Scores and ranks products by revenue + virality potential using three signals:
 *   clicks   — real user engagement (highest weight: direct revenue indicator)
 *   delta    — price spread across retailers (viral potential: bigger = more shocking)
 *   searches — estimated search demand (reach signal)
 *
 * Designed to work both in the browser (with real click data from revenueTracker)
 * and in Node.js scripts (with static price data from prices.json).
 *
 * Usage (browser):
 *   import { rankProducts } from './growthBrain';
 *   const ranked = rankProducts(getTopProducts(20).map(p => ({ ...p, delta: 0.3, searches: 0 })));
 *
 * Usage (Node.js script):
 *   import { rankProducts, classifyPriority } from './growthBrain.js';
 *   const ranked = rankProducts(products);
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export interface GrowthProduct {
  /** Canonical product name */
  name: string;
  /** Raw retailer click count (0 when unknown) */
  clicks: number;
  /** Price spread in euros between cheapest and most expensive retailer */
  delta: number;
  /** Estimated search demand score (0–100, 0 when unknown) */
  searches: number;
}

export type ProductPriority = 'HIGH' | 'MEDIUM' | 'LOW';

export interface RankedProduct extends GrowthProduct {
  /** Weighted composite score */
  score: number;
  /** Priority band derived from click count */
  priority: ProductPriority;
}

// ── Scoring weights ───────────────────────────────────────────────────────────

const WEIGHTS = {
  clicks: 0.5, // Direct revenue signal — most important
  delta: 0.3, // Viral potential — bigger price gap = more shareable
  searches: 0.2, // Reach — how much demand exists for this product
} as const;

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Compute a weighted growth score for a single product.
 *
 * Score is unbounded — compare products relative to each other, not to a fixed scale.
 *
 * @example
 * computeScore({ clicks: 10, delta: 0.36, searches: 50 })
 * // → 10*0.5 + 0.36*0.3 + 50*0.2 = 5 + 0.108 + 10 = 15.108
 */
export function computeScore(product: GrowthProduct): number {
  return (
    product.clicks * WEIGHTS.clicks +
    product.delta * WEIGHTS.delta +
    product.searches * WEIGHTS.searches
  );
}

/**
 * Classify a product's conversion priority based on its click count.
 *
 * HIGH   (>20 clicks)  — proven demand, push aggressively
 * MEDIUM (5–20 clicks) — growing, maintain visibility
 * LOW    (<5 clicks)   — limited signal, deprioritize
 */
export function classifyPriority(clicks: number): ProductPriority {
  if (clicks > 20) return 'HIGH';
  if (clicks >= 5) return 'MEDIUM';
  return 'LOW';
}

/**
 * Score, rank and classify an array of products.
 *
 * Returns a new array sorted by score descending, with `score` and `priority`
 * appended to each entry.  Does NOT mutate the input array.
 *
 * @example
 * const ranked = rankProducts(products);
 * const selected = ranked.filter(p => p.delta > 0.2 && p.priority !== 'LOW').slice(0, 5);
 */
export function rankProducts(products: GrowthProduct[]): RankedProduct[] {
  return products
    .map((p) => ({
      ...p,
      score: computeScore(p),
      priority: classifyPriority(p.clicks),
    }))
    .sort((a, b) => b.score - a.score);
}
