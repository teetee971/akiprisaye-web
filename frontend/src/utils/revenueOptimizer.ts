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

export function analyzeRevenueMetrics(metrics: RevenueMetric[]): RevenueAction[] {
  const actions: RevenueAction[] = [];

  for (const m of metrics) {
    if (m.pageViews > 50 && m.affiliateClicks < 2) {
      actions.push({
        type: 'BOOST_CTA',
        priority: 'high',
        url: m.url,
        reason: `${m.pageViews} vues mais seulement ${m.affiliateClicks} clics affiliés — optimiser le CTA`,
      });
    } else if (m.ctr > 0.03 && m.affiliateClicks > 5) {
      actions.push({
        type: 'PRIORITIZE_PAGE',
        priority: 'high',
        url: m.url,
        reason: `CTR ${(m.ctr * 100).toFixed(1)}% et ${m.affiliateClicks} clics affiliés — page à fort potentiel`,
      });
    } else if (m.affiliateClicks > 10 && m.estimatedRevenue > 5) {
      actions.push({
        type: 'BOOST_RETAILER',
        priority: 'medium',
        url: m.url,
        reason: `${m.affiliateClicks} clics et ${m.estimatedRevenue.toFixed(2)} € générés — renforcer les retailers`,
      });
    } else if (m.pageViews > 30 && m.ctr < 0.01) {
      actions.push({
        type: 'TEST_VARIANT',
        priority: 'medium',
        url: m.url,
        reason: `CTR ${(m.ctr * 100).toFixed(2)}% faible pour ${m.pageViews} vues — tester une variante CTA`,
      });
    } else {
      actions.push({
        type: 'BOOST_CTA',
        priority: 'low',
        url: m.url,
        reason: `Améliorer le CTA pour augmenter les clics affiliés`,
      });
    }
  }

  return actions;
}
