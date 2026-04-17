/**
 * trendEngine.ts — Click-trend computation (V3)
 *
 * Tracks momentum, not just cumulative counts.
 * A product that had 5 clicks yesterday and 15 today is MORE interesting
 * than one that has 1 000 cumulative clicks with zero recent activity.
 *
 * Usage:
 *   const trend = computeClickTrend({ last24h: 15, previous24h: 5 });
 *   // trend = 2.0  (200% growth)
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ProductEventWindow {
  /** Click count in the most recent 24-hour window */
  last24h: number;
  /** Click count in the 24 hours before that */
  previous24h: number;
  /** Optional: clicks in the last 7 days (for slower-moving products) */
  last7d?: number;
  /** Optional: clicks in the 7 days before that */
  previous7d?: number;
}

export interface TrendedProduct {
  name: string;
  /** Raw click counts */
  events: ProductEventWindow;
  /** Computed trend coefficient (-1 to +∞, normalised to -1..+1 for scoring) */
  trend: number;
  /** Normalised trend score 0–100 for use in predictive scoring */
  trendScore: number;
  /** Human-readable label */
  trendLabel: 'rising' | 'stable' | 'falling' | 'new';
}

// ── Core computation ──────────────────────────────────────────────────────────

/**
 * Compute the click trend for a product.
 *
 * Returns a ratio:
 *   > 0  → positive momentum (rising)
 *   = 0  → stable or no data
 *   < 0  → declining
 *
 * Special cases:
 *   previous24h = 0 AND last24h = 0  → 0 (no signal)
 *   previous24h = 0 AND last24h > 0  → +1 (new activity — treat as rising)
 *
 * @param productEvents  Click counts for two consecutive 24-hour windows
 */
export function computeClickTrend(productEvents: ProductEventWindow): number {
  const last = productEvents.last24h ?? 0;
  const previous = productEvents.previous24h ?? 0;

  if (previous === 0) {
    return last > 0 ? 1 : 0;
  }

  return (last - previous) / previous;
}

/**
 * Normalise a raw trend coefficient into a 0–100 score.
 *
 * Mapping:
 *   trend ≥ +2  → 100 (explosive growth)
 *   trend = 0   → 50  (neutral)
 *   trend ≤ -1  → 0   (complete collapse)
 */
export function normaliseTrend(trend: number): number {
  // Clamp to [-1, 2] then scale to [0, 100]
  const clamped = Math.max(-1, Math.min(2, trend));
  return Math.round(((clamped + 1) / 3) * 100);
}

/**
 * Compute a human-readable trend label.
 */
export function trendLabel(
  trend: number,
  events?: Pick<ProductEventWindow, 'last24h' | 'previous24h'>
): TrendedProduct['trendLabel'] {
  if (trend > 0.2) return 'rising';
  if (trend < -0.2) return 'falling';
  // trend === 0: distinguish "new activity" from "no signal / stable"
  if (trend === 0) {
    if (events && events.previous24h === 0 && events.last24h > 0) return 'new';
    return 'stable';
  }
  return 'stable';
}

/**
 * Annotate a list of products with trend data.
 *
 * @param products   Array of { name: string } objects
 * @param eventMap   Map of product name (lowercase) → ProductEventWindow
 */
export function annotateTrends(
  products: { name: string; [k: string]: unknown }[],
  eventMap: Map<string, ProductEventWindow>
): TrendedProduct[] {
  return products.map((p) => {
    const key = p.name.toLowerCase().trim();
    const events = eventMap.get(key) ?? { last24h: 0, previous24h: 0 };
    const trend = computeClickTrend(events);

    return {
      ...p,
      name: p.name,
      events,
      trend,
      trendScore: normaliseTrend(trend),
      trendLabel: trendLabel(trend),
    } as TrendedProduct;
  });
}

/**
 * Build a ProductEventWindow map from a flat event log.
 *
 * Splits events by whether they fall in the last 24h or the 24h before.
 *
 * @param events  Raw event array: { type: string, product: string, ts: number }[]
 */
export function buildEventWindowMap(
  events: { type: string; product?: string; ts: number }[]
): Map<string, ProductEventWindow> {
  const now = Date.now();
  const h24 = 24 * 60 * 60 * 1000;
  const map = new Map<string, ProductEventWindow>();

  const clickTypes = new Set(['click', 'affiliate_click', 'conversion', 'deal_view']);

  for (const e of events) {
    if (!e.product || !clickTypes.has(e.type)) continue;
    const key = e.product.toLowerCase().trim();
    if (!map.has(key)) map.set(key, { last24h: 0, previous24h: 0 });
    const win = map.get(key)!;

    const age = now - e.ts;
    if (age <= h24) win.last24h++;
    else if (age <= 2 * h24) win.previous24h++;
  }

  return map;
}
