export type SeoLoopActionType = 'IMPROVE_TITLE' | 'ENRICH_CONTENT' | 'BOOST_LINKING' | 'DUPLICATE_PAGE' | 'BOOST_CTA' | 'DEPRIORITIZE';

export interface SeoLoopMetric {
  url: string;
  title: string;
  pageType: 'product' | 'category' | 'comparison' | 'inflation' | 'pillar';
  impressions: number;
  clicks: number;
  ctr: number;
  pageViews: number;
  affiliateClicks: number;
  estimatedRevenue: number;
  territory?: string;
  productName?: string;
  categoryName?: string;
}

export interface SeoLoopAction {
  type: SeoLoopActionType;
  priority: 'high' | 'medium' | 'low';
  url: string;
  reason: string;
  suggestedTarget?: string;
}

export interface SeoLoopReport {
  generatedAt: string;
  metricsCount: number;
  actions: SeoLoopAction[];
}
