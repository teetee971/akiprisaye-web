export interface RevenueMetric {
  url: string;
  productName?: string;
  retailer?: string;
  pageViews: number;
  affiliateClicks: number;
  ctr: number;
  estimatedRevenue: number;
  avgPrice?: number;
  bestPrice?: number;
}

export type RevenueActionType = 'BOOST_CTA' | 'BOOST_RETAILER' | 'TEST_VARIANT' | 'PRIORITIZE_PAGE';

export interface RevenueAction {
  type: RevenueActionType;
  priority: 'high' | 'medium' | 'low';
  url: string;
  reason: string;
}
