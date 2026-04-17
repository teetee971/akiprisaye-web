/**
 * recommendationV3.ts — Personalised product recommendation engine (V3)
 *
 * Filters and ranks products based on the user's behavioural profile,
 * producing a personalised list prioritised by predictive score.
 *
 * This is the bridge between the predictive engine and the UI:
 *   - "Recommandé pour vous"
 *   - "En hausse aujourd'hui"
 *   - "Deals proches de vos habitudes"
 *
 * Design constraints:
 *   - Pure function — no I/O, no side effects
 *   - Degrades gracefully: if profile is empty, returns top-scored products
 *   - No external ML library required
 */

import type { UserProfile } from './userProfileEngine';
import type { PredictiveProduct } from './predictiveEngine';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface RecommendationResult {
  /** Recommended products in priority order */
  products: PredictiveProduct[];
  /** Reason for this recommendation set (for UI display) */
  reason: string;
  /** Block title for the landing page */
  blockTitle: string;
}

// ── Core recommender ──────────────────────────────────────────────────────────

/**
 * Recommend the best products for a user based on their profile.
 *
 * Personalisation rules (in priority order):
 *   1. Products in the user's favourite categories → top of the list
 *   2. Products from the user's most-clicked retailers → boosted
 *   3. Products previously viewed but not yet clicked → re-engagement
 *   4. Top-scored products (fallback when profile is sparse)
 *
 * @param products  Full predictively-ranked product list
 * @param profile   UserProfile from userProfileEngine
 * @param limit     Max products to return (default 10)
 */
export function recommendForUser(
  products: PredictiveProduct[],
  profile: UserProfile,
  limit = 10
): RecommendationResult {
  const hasProfile =
    profile.favoriteCategories.length > 0 ||
    profile.clickedRetailers.length > 0 ||
    profile.viewedProducts.length > 0;

  if (!hasProfile) {
    // Cold start — return top predictive products
    return {
      products: products.slice(0, limit),
      reason: 'top-scored',
      blockTitle: '🔥 Meilleures opportunités du moment',
    };
  }

  const categorySet = new Set(profile.favoriteCategories.map((c) => c.toLowerCase()));
  const retailerSet = new Set(profile.clickedRetailers.map((r) => r.toLowerCase()));
  const viewedSet = new Set(profile.viewedProducts.map((v) => v.toLowerCase()));
  const clickedSet = new Set(profile.clickedProducts.map((c) => c.toLowerCase()));

  // Score each product for personalisation fit
  const scored = products.map((p) => {
    let bonus = 0;
    const key = p.name.toLowerCase();
    const cat = String(p.category ?? '').toLowerCase();

    if (categorySet.has(cat)) bonus += 30; // strong category match
    if (retailerSet.has(String(p.bestRetailer ?? '').toLowerCase())) bonus += 15;
    if (viewedSet.has(key) && !clickedSet.has(key)) bonus += 20; // re-engagement
    if (p.territory && profile.territory === p.territory) bonus += 10; // territory match

    return { ...p, _personalScore: (p.predictiveScore ?? 0) + bonus };
  });

  const ranked = scored
    .sort((a, b) => b._personalScore - a._personalScore)
    .slice(0, limit)
    .map(({ _personalScore: _, ...rest }) => rest as PredictiveProduct);

  const blockTitle =
    profile.favoriteCategories.length > 0
      ? '⭐ Recommandé pour vous'
      : profile.clickedRetailers.length > 0
        ? '📍 Deals proches de vos habitudes'
        : "🔥 En hausse aujourd'hui";

  return {
    products: ranked,
    reason: 'personalised',
    blockTitle,
  };
}

/**
 * Return the top-rising products (for the "En hausse aujourd'hui" block).
 *
 * Selects products with a positive click trend (trendScore > 60).
 */
export function getRisingProducts(
  products: (PredictiveProduct & { trendScore?: number })[],
  limit = 6
): PredictiveProduct[] {
  return products
    .filter((p) => (p.trendScore ?? 0) > 60)
    .sort((a, b) => (b.trendScore ?? 0) - (a.trendScore ?? 0))
    .slice(0, limit);
}

/**
 * Return products the user has viewed but not yet clicked (re-engagement).
 */
export function getReEngagementProducts(
  products: PredictiveProduct[],
  profile: UserProfile,
  limit = 5
): PredictiveProduct[] {
  const viewed = new Set(profile.viewedProducts.map((v) => v.toLowerCase()));
  const clicked = new Set(profile.clickedProducts.map((c) => c.toLowerCase()));

  return products
    .filter((p) => viewed.has(p.name.toLowerCase()) && !clicked.has(p.name.toLowerCase()))
    .sort((a, b) => b.predictiveScore - a.predictiveScore)
    .slice(0, limit);
}
