/**
 * revenueEngine.ts
 *
 * Scores products by revenue potential using real user click events from
 * revenueTracker.ts (localStorage, RGPD-safe).
 *
 * Scoring model (no ML required — simple heuristics are already powerful):
 *   clickScore  : raw click count for the product (direct revenue signal)
 *   demandScore : unique pages / sessions that generated clicks (reach)
 *   marginScore : number of distinct retailers clicked (comparison depth)
 *   globalScore : weighted composite — 50% clicks, 30% demand, 20% margin
 *
 * Usage:
 *   import { computeProductScores } from './revenueEngine';
 *   const top5 = computeProductScores().slice(0, 5);
 */

import { getRevenueEvents } from './revenueTracker';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ProductScore {
  /** Canonical product name */
  product: string;
  /** Raw retailer click count */
  clickScore: number;
  /** 0–100 — share of unique source pages that generated clicks */
  demandScore: number;
  /** Number of distinct retailers clicked for this product */
  marginScore: number;
  /** Weighted composite score (0–100) */
  globalScore: number;
}

// ── Engine ────────────────────────────────────────────────────────────────────

/**
 * Compute product scores from real user click events (browser-side).
 * Returns products sorted by globalScore descending.
 * Returns [] when no events have been recorded yet.
 */
export function computeProductScores(): ProductScore[] {
  const events = getRevenueEvents();
  if (events.length === 0) return [];

  // Aggregate per product
  const byProduct = new Map<
    string,
    { clicks: number; pages: Set<string>; retailers: Set<string> }
  >();

  for (const e of events) {
    if (!e.product) continue;
    let entry = byProduct.get(e.product);
    if (!entry) {
      entry = { clicks: 0, pages: new Set(), retailers: new Set() };
      byProduct.set(e.product, entry);
    }
    entry.clicks += 1;
    if (e.url) entry.pages.add(e.url);
    if (e.retailer) entry.retailers.add(e.retailer);
  }

  const maxClicks = Math.max(1, ...Array.from(byProduct.values()).map((v) => v.clicks));
  const totalProducts = byProduct.size;

  return Array.from(byProduct.entries())
    .map(([product, data]) => {
      const clickScore = data.clicks;
      // demand: share of unique page sources (normalised to 0–100)
      const demandScore = Math.min(
        Math.round((data.pages.size / Math.max(1, totalProducts)) * 100),
        100,
      );
      // margin: number of retailers compared (each retailer = ~10 pts, cap 100)
      const marginScore = Math.min(data.retailers.size * 10, 100);

      // Weighted composite (0–100)
      const globalScore = Math.round(
        ((clickScore / maxClicks) * 50 + demandScore * 0.3 + marginScore * 0.2) * 10,
      ) / 10;

      return { product, clickScore, demandScore, marginScore, globalScore };
    })
    .sort((a, b) => b.globalScore - a.globalScore);
}

/**
 * Return the top N products by revenue potential.
 * Convenient wrapper around computeProductScores().
 */
export function getTopProducts(n = 5): ProductScore[] {
  return computeProductScores().slice(0, n);
}
