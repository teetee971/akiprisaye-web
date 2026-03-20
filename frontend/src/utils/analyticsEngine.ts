/**
 * analyticsEngine.ts — Unified analytics aggregator.
 *
 * Reads from the three existing localStorage tracking layers:
 *   - conversionTracker  → CTA clicks, variant breakdown, conversion rate
 *   - priceClickTracker  → affiliate clicks, revenue, top products
 *   - statsTracker       → SEO page views, top pages
 *
 * Returns a single `AnalyticsSnapshot` that can drive dashboards or
 * be fed into the optimisation loop.
 *
 * RGPD: reads localStorage only, no network calls, no external SDK.
 */

import { getCROStats }         from './conversionTracker';
import { getConversionStats }  from './priceClickTracker';
import { getSEOPageStats }     from './statsTracker';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AnalyticsSnapshot {
  /** Total SEO page views (all pages, 30-day window) */
  visits: number;
  /** Total CTA + affiliate clicks */
  clicks: number;
  /** Affiliate clicks that led to a retailer visit */
  conversions: number;
  /** Estimated affiliate revenue in EUR (2% commission on clicked prices) */
  revenue: number;
  /** Click-through rate: clicks / visits */
  ctr: number;
  /** Estimated revenue today (EUR) */
  dailyRevenue: number;
  /** Top 5 pages by CTA clicks */
  topPages: { url: string; clicks: number }[];
  /** Top 5 retailers by affiliate clicks */
  topRetailers: { retailer: string; clicks: number }[];
  /** Top 5 products by views */
  topProducts: { barcode: string; name: string; views: number; ctr: number }[];
  /** Subscription clicks (WhatsApp + Telegram channels) */
  subscriptionClicks: number;
  /** Variant breakdown from A/B/C CTA tests */
  variantBreakdown: Record<string, number>;
  /** Snapshot timestamp */
  generatedAt: string;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Build a unified analytics snapshot from all local tracking sources.
 * Safe to call on every render — pure reads, no writes.
 */
export function getAnalyticsSnapshot(): AnalyticsSnapshot {
  let visits      = 0;
  let clicks      = 0;
  let conversions = 0;
  let revenue     = 0;
  let dailyRevenue        = 0;
  let topPages: { url: string; clicks: number }[]              = [];
  let topRetailers: { retailer: string; clicks: number }[]     = [];
  let topProducts: { barcode: string; name: string; views: number; ctr: number }[] = [];
  let subscriptionClicks  = 0;
  let variantBreakdown: Record<string, number> = { A: 0, B: 0, C: 0 };

  // ── 1. CRO stats (CTA clicks + conversion rate + top pages) ──────────────
  try {
    const cro = getCROStats();
    clicks    = cro.totalClicks;
    topPages  = cro.topPages.map((p) => ({ url: p.url, clicks: p.clicks }));
    variantBreakdown = cro.byVariant;

    // Count subscription clicks from retailer names that start with "alerte-"
    subscriptionClicks = cro.topRetailers
      .filter((r) => r.retailer.startsWith('alerte-') || r.retailer.startsWith('share-'))
      .reduce((sum, r) => sum + r.clicks, 0);

    // Total visits from conversionRate denominator
    if (cro.conversionRate > 0 && cro.totalClicks > 0) {
      visits = Math.round(cro.totalClicks / cro.conversionRate);
    }
  } catch {
    // Silently ignore if storage unavailable
  }

  // ── 2. Price click / revenue stats ───────────────────────────────────────
  try {
    const pcs = getConversionStats(30);
    conversions = pcs.totalClicks;
    revenue     = pcs.estimatedRevenue;

    // Merge visit count (take the larger of the two estimates)
    if (pcs.totalViews > visits) visits = pcs.totalViews;

    // Merge topRetailers
    topRetailers = pcs.topRetailers
      .slice(0, 5)
      .map((r) => ({ retailer: r.retailer, clicks: r.clicks }));

    // Top products
    topProducts = pcs.topProducts.slice(0, 5).map((p) => ({
      barcode: p.barcode,
      name:    p.name,
      views:   p.views,
      ctr:     p.ctr,
    }));
  } catch {
    // Silently ignore
  }

  // ── 3. SEO page stats → visit count ──────────────────────────────────────
  try {
    const seoStats = getSEOPageStats();
    const seoViews = seoStats.reduce((sum, s) => sum + s.views, 0);
    if (seoViews > visits) visits = seoViews;
  } catch {
    // Silently ignore
  }

  // ── 4. Derived metrics ────────────────────────────────────────────────────
  const totalClicks = clicks + conversions;
  const ctr = visits > 0 ? totalClicks / visits : 0;
  // Rough daily revenue: divide 30-day estimate by 30
  dailyRevenue = revenue / 30;

  return {
    visits,
    clicks:             totalClicks,
    conversions,
    revenue:            +revenue.toFixed(2),
    ctr:                +ctr.toFixed(4),
    dailyRevenue:       +dailyRevenue.toFixed(2),
    topPages,
    topRetailers,
    topProducts,
    subscriptionClicks,
    variantBreakdown,
    generatedAt:        new Date().toISOString(),
  };
}

/**
 * Format CTR as a human-readable percentage string.
 * @example formatCtr(0.1234) → "12.3%"
 */
export function formatCtr(ctr: number): string {
  return `${(ctr * 100).toFixed(1)}%`;
}

/**
 * Return a colour token based on CTR relative to the 10% target.
 *   green  → CTR ≥ 10%
 *   amber  → CTR ≥ 5%
 *   red    → CTR < 5%
 */
export function ctrStatus(ctr: number): 'green' | 'amber' | 'red' {
  if (ctr >= 0.10) return 'green';
  if (ctr >= 0.05) return 'amber';
  return 'red';
}
