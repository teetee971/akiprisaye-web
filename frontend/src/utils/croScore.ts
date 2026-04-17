/**
 * croScore.ts — CRO global score engine.
 *
 * Computes a deterministic weighted global score from four sub-scores:
 *
 *   globalScore =
 *     seoScore        × 0.25
 *   + engagementScore × 0.25
 *   + conversionScore × 0.30
 *   + revenueScore    × 0.20
 *
 * All inputs and outputs are typed and clamped to [0, 100].
 * No randomness — identical inputs always produce identical outputs.
 *
 * RGPD: pure computation — no storage, no network.
 */

import type { UserBehaviorMetric, CroScore } from '../../../shared/src/cro';
import type { SeoMetric, RevenueMetric } from './croAnalyzer';

// ── Score weights ─────────────────────────────────────────────────────────────

const W_SEO = 0.25;
const W_ENGAGEMENT = 0.25;
const W_CONVERSION = 0.3;
const W_REVENUE = 0.2;

// ── Normalisation helpers ─────────────────────────────────────────────────────

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Compute an engagement score (0–100) from behavior signals.
 *
 * Weights:
 *   - avgScrollDepth  × 0.50  (already 0–100)
 *   - avgTimeOnPage   × 0.30  (capped at 180 s → 100)
 *   - pageViews bonus × 0.20  (log scale, capped at 100)
 */
function computeEngagementScore(m: UserBehaviorMetric): number {
  const scrollScore = clamp(m.avgScrollDepth);
  const timeScore = clamp((m.avgTimeOnPage / 180) * 100);
  const viewsScore = clamp(Math.log1p(m.pageViews) * 20); // log1p(5)≈37, log1p(50)≈80
  return clamp(scrollScore * 0.5 + timeScore * 0.3 + viewsScore * 0.2);
}

/**
 * Compute a conversion score (0–100) from CTA + retailer click ratios.
 *
 * ctaRatio and retailerRatio are each capped at 0.30 (30% CTR → 100 pts).
 */
function computeConversionScore(m: UserBehaviorMetric): number {
  if (m.pageViews === 0) return 0;
  const ctaRatio = m.ctaClicks / m.pageViews;
  const retailerRatio = m.retailerClicks / m.pageViews;
  const ctaScore = clamp((ctaRatio / 0.3) * 100);
  const retailerScore = clamp((retailerRatio / 0.3) * 100);
  return clamp(ctaScore * 0.6 + retailerScore * 0.4);
}

/**
 * Compute a revenue score (0–100) from revenue metric.
 *
 * Normalises affiliateClicks CTR against 0.15 (15% → 100 pts)
 * and estimatedRevenue against €50 (→ 100 pts).
 * Falls back to 0 when no revenue data is available.
 */
function computeRevenueScore(m: UserBehaviorMetric, rev: RevenueMetric | undefined): number {
  if (!rev) return 0;
  const affiliateClicks = rev.affiliateClicks ?? 0;
  const estimatedRevenue = rev.estimatedRevenue ?? 0;
  const ctrScore = m.pageViews > 0 ? clamp((affiliateClicks / m.pageViews / 0.15) * 100) : 0;
  const revenueScore = clamp((estimatedRevenue / 50) * 100);
  return clamp(ctrScore * 0.5 + revenueScore * 0.5);
}

/**
 * Compute an SEO score (0–100) from SEO metric.
 *
 * Normalises CTR against 0.10 (10% → 100 pts)
 * and position (1 → 100 pts, absent → 50 pts neutral).
 * Falls back to 50 (neutral) when no SEO data.
 */
function computeSeoScore(seo: SeoMetric | undefined): number {
  if (!seo) return 50; // neutral fallback
  const ctr = seo.ctr ?? (seo.impressions && seo.clicks ? seo.clicks / seo.impressions : 0);
  return clamp((ctr / 0.1) * 100);
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Compute a CroScore for a single URL.
 */
export function computeCroScore(
  m: UserBehaviorMetric,
  seo?: SeoMetric,
  rev?: RevenueMetric
): CroScore {
  const seoScore = computeSeoScore(seo);
  const engagementScore = computeEngagementScore(m);
  const conversionScore = computeConversionScore(m);
  const revenueScore = computeRevenueScore(m, rev);

  const globalScore = clamp(
    seoScore * W_SEO +
      engagementScore * W_ENGAGEMENT +
      conversionScore * W_CONVERSION +
      revenueScore * W_REVENUE
  );

  return {
    url: m.url,
    seoScore: Math.round(seoScore),
    engagementScore: Math.round(engagementScore),
    conversionScore: Math.round(conversionScore),
    revenueScore: Math.round(revenueScore),
    globalScore: Math.round(globalScore),
  };
}

/**
 * Compute CroScores for a list of behavior metrics.
 * Results are sorted by globalScore descending.
 */
export function computeAllCroScores(
  metrics: UserBehaviorMetric[],
  seoMetrics?: SeoMetric[],
  revenueMetrics?: RevenueMetric[]
): CroScore[] {
  if (!Array.isArray(metrics) || metrics.length === 0) return [];

  const seoMap = new Map<string, SeoMetric>((seoMetrics ?? []).map((s) => [s.url, s]));
  const revMap = new Map<string, RevenueMetric>((revenueMetrics ?? []).map((r) => [r.url, r]));

  return metrics
    .map((m) => computeCroScore(m, seoMap.get(m.url), revMap.get(m.url)))
    .sort((a, b) => b.globalScore - a.globalScore);
}
