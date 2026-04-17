/**
 * croAnalyzer.ts — CRO recommendation engine.
 *
 * Analyses UserBehaviorMetric signals (+ optional SEO/revenue inputs)
 * and emits a prioritised list of CroRecommendations.
 *
 * Rules (deterministic, no randomness):
 *   1. high pageViews + low ctaClicks        → BOOST_CTA
 *   2. high pageViews + low retailerClicks   → BOOST_PRICE_SIGNAL
 *   3. high impressions/clicks + weak scroll → SIMPLIFY_HERO
 *   4. high compareInteractions + weak clicks→ REORDER_BLOCKS
 *   5. very weak all-around signals          → DEPRIORITIZE_PAGE
 *
 * RGPD: pure computation — no storage, no network.
 */

import type { UserBehaviorMetric, CroRecommendation } from '../../../shared/src/cro';

// ── Optional supplemental metric shapes ───────────────────────────────────────

export interface SeoMetric {
  url: string;
  impressions?: number;
  clicks?: number;
  ctr?: number;
  pageViews?: number;
}

export interface RevenueMetric {
  url: string;
  affiliateClicks?: number;
  estimatedRevenue?: number;
}

// ── Thresholds ────────────────────────────────────────────────────────────────

const HIGH_VIEWS = 10; // min pageViews to be considered "high traffic"
const LOW_CTA_RATIO = 0.05; // ctaClicks / pageViews below this → weak CTA
const LOW_RETAILER_RATIO = 0.03; // retailerClicks / pageViews below this → weak price signal
const LOW_SCROLL = 40; // avgScrollDepth below this → hero may be too complex
const HIGH_COMPARE = 3; // compareInteractions above this → compare block is prominent
const VERY_WEAK_VIEWS = 3; // pageViews below this → deprioritise
const VERY_WEAK_CLICKS = 1; // ctaClicks + retailerClicks below this → deprioritise

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Analyse a list of behavior metrics and return CRO recommendations.
 *
 * @param metrics   - Per-URL behavior signals (required)
 * @param seoMetrics    - Optional SEO signals (impressions, clicks, ctr)
 * @param revenueMetrics - Optional revenue signals
 */
export function analyzeCro(
  metrics: UserBehaviorMetric[],
  seoMetrics?: SeoMetric[],
  revenueMetrics?: RevenueMetric[]
): CroRecommendation[] {
  if (!Array.isArray(metrics) || metrics.length === 0) return [];

  const seoMap = new Map<string, SeoMetric>((seoMetrics ?? []).map((s) => [s.url, s]));
  const revMap = new Map<string, RevenueMetric>((revenueMetrics ?? []).map((r) => [r.url, r]));

  const recommendations: CroRecommendation[] = [];

  for (const m of metrics) {
    const { url, pageViews, ctaClicks, retailerClicks, avgScrollDepth, compareInteractions } = m;
    const seo = seoMap.get(url);
    const rev = revMap.get(url);

    const ctaRatio = pageViews > 0 ? ctaClicks / pageViews : 0;
    const retailerRatio = pageViews > 0 ? retailerClicks / pageViews : 0;
    const totalClicks = ctaClicks + retailerClicks + (rev?.affiliateClicks ?? 0);

    // ── Rule 5 — deprioritise first (most severe) ───────────────────────────
    if (pageViews < VERY_WEAK_VIEWS && totalClicks < VERY_WEAK_CLICKS) {
      recommendations.push({
        type: 'DEPRIORITIZE_PAGE',
        priority: 'low',
        url,
        reason: `Seulement ${pageViews} vues et ${totalClicks} clics — page à faible impact.`,
      });
      continue; // no further rules for this URL
    }

    // ── Rule 1 — BOOST_CTA ───────────────────────────────────────────────────
    if (pageViews >= HIGH_VIEWS && ctaRatio < LOW_CTA_RATIO) {
      recommendations.push({
        type: 'BOOST_CTA',
        priority: 'high',
        url,
        reason: `${pageViews} vues mais seulement ${ctaClicks} clics CTA (ratio ${(ctaRatio * 100).toFixed(1)}%) — renforcer l'appel à l'action.`,
      });
    }

    // ── Rule 2 — BOOST_PRICE_SIGNAL ─────────────────────────────────────────
    if (pageViews >= HIGH_VIEWS && retailerRatio < LOW_RETAILER_RATIO) {
      recommendations.push({
        type: 'BOOST_PRICE_SIGNAL',
        priority: ctaRatio < LOW_CTA_RATIO ? 'high' : 'medium',
        url,
        reason: `${pageViews} vues mais seulement ${retailerClicks} clics enseigne (ratio ${(retailerRatio * 100).toFixed(1)}%) — mettre le bloc prix en avant.`,
      });
    }

    // ── Rule 3 — SIMPLIFY_HERO ───────────────────────────────────────────────
    const hasStrongSeoSignal = seo != null && (seo.impressions ?? 0) > 100 && (seo.clicks ?? 0) > 5;
    if (hasStrongSeoSignal && avgScrollDepth < LOW_SCROLL) {
      recommendations.push({
        type: 'SIMPLIFY_HERO',
        priority: 'medium',
        url,
        reason: `Bonne visibilité SEO (${seo!.impressions} impressions) mais profondeur de scroll faible (${avgScrollDepth}%) — simplifier le hero.`,
      });
    }

    // ── Rule 4 — REORDER_BLOCKS ─────────────────────────────────────────────
    if (compareInteractions > HIGH_COMPARE && retailerRatio < LOW_RETAILER_RATIO) {
      recommendations.push({
        type: 'REORDER_BLOCKS',
        priority: 'medium',
        url,
        reason: `${compareInteractions} interactions comparateur mais peu de clics enseigne — remonter le bloc comparaison avant le contenu éditorial.`,
      });
    }
  }

  // Sort: high → medium → low, then by url for determinism
  const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 } as const;
  return recommendations.sort(
    (a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] || a.url.localeCompare(b.url)
  );
}
