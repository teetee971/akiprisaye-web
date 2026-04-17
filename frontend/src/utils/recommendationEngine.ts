/**
 * recommendationEngine.ts
 *
 * Recommends products to the current user based on their click history.
 * Uses revenueTracker events (localStorage, RGPD-safe) — no external model.
 *
 * Simple but effective heuristics:
 *   - Products clicked most often → highest score
 *   - Preferred retailer from click history → boosted in display
 *   - Territory-aware filtering (future extension point)
 *
 * Usage:
 *   const { topProducts, preferredRetailer } = getUserProfile();
 *   const recs = recommendProducts(getRevenueEvents());
 */

import { getRevenueEvents, type RevenueEvent } from './revenueTracker';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface UserProfile {
  /** Products the user interacted with, most-viewed first */
  topProducts: string[];
  /** The retailer clicked most often, or null if no data */
  preferredRetailer: string | null;
  /** Total click events recorded */
  totalEvents: number;
}

// ── Engine ────────────────────────────────────────────────────────────────────

/**
 * Return the top-N product recommendations based on click events.
 * Accepts an optional events array (defaults to reading from localStorage).
 */
export function recommendProducts(
  events: RevenueEvent[] = getRevenueEvents(),
  limit = 5
): string[] {
  if (events.length === 0) return [];

  const scores: Record<string, number> = {};

  for (const e of events) {
    if (!e.product) continue;
    scores[e.product] = (scores[e.product] ?? 0) + 1;
  }

  return Object.entries(scores)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([product]) => product);
}

/**
 * Build a lightweight user profile from click history.
 * Returns null when there is no data (new/anonymous visitor).
 */
export function getUserProfile(): UserProfile | null {
  const events = getRevenueEvents();
  if (events.length === 0) return null;

  // Count products
  const productCounts: Record<string, number> = {};
  const retailerCounts: Record<string, number> = {};

  for (const e of events) {
    if (e.product) productCounts[e.product] = (productCounts[e.product] ?? 0) + 1;
    if (e.retailer) retailerCounts[e.retailer] = (retailerCounts[e.retailer] ?? 0) + 1;
  }

  const topProducts = Object.entries(productCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([p]) => p);

  const preferredRetailer =
    Object.entries(retailerCounts).sort(([, a], [, b]) => b - a)[0]?.[0] ?? null;

  return { topProducts, preferredRetailer, totalEvents: events.length };
}
