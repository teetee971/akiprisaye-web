/**
 * revenueEngine.ts
 *
 * Scores products by revenue potential using real user click events from
 * revenueTracker.ts (localStorage, RGPD-safe).
 *
 * Scoring model (no ML required — simple heuristics are already powerful):
 *   clickScore   : raw click count for the product (direct revenue signal)
 *   marginScore  : number of distinct retailers clicked (comparison depth)
 *   recencyScore : time-decay — recent clicks score higher (0–100)
 *   globalScore  : weighted composite — 40% clicks + 40% margin + 20% recency
 *
 * Usage:
 *   import { computeProductScores, getKPISummary } from './revenueEngine';
 *   const top5 = computeProductScores().slice(0, 5);
 *   const kpi  = getKPISummary();
 */

import { getRevenueEvents } from './revenueTracker';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ProductScore {
  /** Canonical product name */
  product: string;
  /** Raw retailer click count */
  clickScore: number;
  /** Number of distinct retailers clicked for this product (×10, cap 100) */
  marginScore: number;
  /** 0–100 — how recently the product was last clicked (time-decayed) */
  recencyScore: number;
  /** Weighted composite score — 40% clicks + 40% margin + 20% recency */
  globalScore: number;
}

/** Snapshot of key performance indicators derived from revenue click events. */
export interface KPISummary {
  /** Total unique page-view events recorded in statsTracker (approximated from revenue events) */
  revenueEvents: number;
  /** Total retailer clicks recorded */
  clicks: number;
  /** Distinct products clicked */
  products: number;
  /** Distinct retailers clicked */
  retailers: number;
  /** Most recent click timestamp (ms), or null when no events exist */
  lastClickAt: number | null;
}

// ── Internal constants ────────────────────────────────────────────────────────

/** Events newer than this are considered "very recent" (full recency score). */
const RECENCY_WINDOW_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// ── Engine ────────────────────────────────────────────────────────────────────

/**
 * Compute product scores from real user click events (browser-side).
 *
 * Scoring weights:
 *   clicks   × 0.4  — products that are clicked often are revenue leaders
 *   margin   × 0.4  — products compared across many retailers have higher CPC potential
 *   recency  × 0.2  — fresh signal beats stale data
 *
 * Returns products sorted by globalScore descending.
 * Returns [] when no events have been recorded yet.
 */
export function computeProductScores(): ProductScore[] {
  const events = getRevenueEvents();
  if (events.length === 0) return [];

  const now = Date.now();

  // Aggregate per product
  const byProduct = new Map<
    string,
    { clicks: number; retailers: Set<string>; lastClickAt: number; priceSum: number }
  >();

  for (const e of events) {
    if (!e.product) continue;
    let entry = byProduct.get(e.product);
    if (!entry) {
      entry = { clicks: 0, retailers: new Set(), lastClickAt: 0, priceSum: 0 };
      byProduct.set(e.product, entry);
    }
    entry.clicks += 1;
    if (e.retailer) entry.retailers.add(e.retailer);
    if (e.clickedAt > entry.lastClickAt) entry.lastClickAt = e.clickedAt;
    if (typeof e.price === 'number' && e.price > 0) entry.priceSum += e.price;
  }

  const maxClicks = Math.max(1, ...Array.from(byProduct.values()).map((v) => v.clicks));

  return Array.from(byProduct.entries())
    .map(([product, data]) => {
      const clickScore = data.clicks;

      // margin: number of retailers compared (each retailer = ~10 pts, cap 100)
      const marginScore = Math.min(data.retailers.size * 10, 100);

      // recency: linear decay over RECENCY_WINDOW_MS — 100 if clicked now, 0 if older
      const ageMs = now - data.lastClickAt;
      const recencyScore = Math.max(0, Math.round((1 - ageMs / RECENCY_WINDOW_MS) * 100));

      // Base weighted composite — 40% clicks + 40% margin + 20% recency
      let rawScore = (clickScore / maxClicks) * 40 + marginScore * 0.4 + recencyScore * 0.2;

      // ── Business modifiers ─────────────────────────────────────────────────
      // Price bonus: if the average clicked price is > 10€, reward the product
      // (higher absolute affiliate value per click).
      const avgPrice = data.clicks > 0 ? data.priceSum / data.clicks : 0;
      if (avgPrice > 10) rawScore *= 1.2;

      const globalScore = Math.round(Math.min(rawScore, 100) * 10) / 10;

      return { product, clickScore, marginScore, recencyScore, globalScore };
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

/**
 * Return a lightweight KPI snapshot from stored revenue click events.
 * Intended for a mini dashboard (console log, analytics panel, or UI widget).
 *
 * @example
 * const kpi = getKPISummary();
 * console.table(kpi);
 * // { revenueEvents: 42, clicks: 42, products: 7, retailers: 3, lastClickAt: 1711... }
 */
export function getKPISummary(): KPISummary {
  const events = getRevenueEvents();

  const products = new Set<string>();
  const retailers = new Set<string>();
  let lastClickAt: number | null = null;

  for (const e of events) {
    if (e.product) products.add(e.product);
    if (e.retailer) retailers.add(e.retailer);
    if (lastClickAt === null || e.clickedAt > lastClickAt) lastClickAt = e.clickedAt;
  }

  return {
    revenueEvents: events.length,
    clicks: events.length,
    products: products.size,
    retailers: retailers.size,
    lastClickAt,
  };
}
