export type AutoSeoActionType =
  | 'IMPROVE_TITLE'
  | 'IMPROVE_META'
  | 'BOOST_LINKING'
  | 'ENRICH_CONTENT'
  | 'DUPLICATE_PAGE'
  | 'BOOST_CTA'
  | 'DEPRIORITIZE';

export interface AutoSeoSignal {
  url: string;
  pageType: 'product' | 'category' | 'comparison' | 'inflation' | 'pillar';
  impressions: number;
  clicks: number;
  ctr: number;
  pageViews: number;
  affiliateClicks: number;
  estimatedRevenue: number;
  backlinks: number;
  authorityScore: number;
  performanceScore: number;
}

export interface AutoSeoPageScore {
  url: string;
  seoScore: number;
  uxScore: number;
  revenueScore: number;
  authorityScore: number;
  globalScore: number;
}

export interface AutoSeoRecommendation {
  type: AutoSeoActionType;
  priority: 'high' | 'medium' | 'low';
  url: string;
  reason: string;
  expectedImpact?: string;
  suggestedTarget?: string;
}

export interface AutoSeoPatch {
  file: string;
  changeType: 'update' | 'append' | 'generate';
  description: string;
  recommendationType: AutoSeoActionType;
  targetUrl: string;
}
