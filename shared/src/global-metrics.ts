export interface GlobalPageMetric {
  url: string;
  pageType: 'product' | 'category' | 'comparison' | 'inflation' | 'pillar';
  territory?: string;
  impressions: number;
  clicks: number;
  ctr: number;
  position?: number;
  pageViews: number;
  affiliateClicks: number;
  ctaCtr: number;
  estimatedRevenue: number;
  performanceScore: number;
  duplicationPotential: boolean;
  backlinks: number;
  authorityScore: number;
  globalScore: number;
  recommendedAction: string;
}
