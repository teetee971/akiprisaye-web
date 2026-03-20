/**
 * cro.ts — Shared CRO (Conversion Rate Optimization) types.
 *
 * Used by:
 *   - frontend/src/utils/conversionTracker.ts
 *   - frontend/src/utils/croAnalyzer.ts
 *   - frontend/src/utils/croScore.ts
 *   - frontend/src/pages/CRODashboardPage.tsx
 */

// ── Behavior signals (collected per URL) ──────────────────────────────────────

export interface UserBehaviorMetric {
  url: string;
  pageViews: number;
  avgScrollDepth: number;   // 0–100 (%)
  avgTimeOnPage: number;    // seconds
  ctaClicks: number;
  retailerClicks: number;
  compareInteractions: number;
}

// ── Composite score per URL ───────────────────────────────────────────────────

export interface CroScore {
  url: string;
  seoScore: number;         // 0–100
  engagementScore: number;  // 0–100
  conversionScore: number;  // 0–100
  revenueScore: number;     // 0–100
  globalScore: number;      // weighted composite
}

// ── Recommendation produced by the analyzer ───────────────────────────────────

export type CroRecommendationType =
  | 'BOOST_CTA'
  | 'SIMPLIFY_HERO'
  | 'BOOST_PRICE_SIGNAL'
  | 'REORDER_BLOCKS'
  | 'DEPRIORITIZE_PAGE';

export interface CroRecommendation {
  type: CroRecommendationType;
  priority: 'high' | 'medium' | 'low';
  url: string;
  reason: string;
}
