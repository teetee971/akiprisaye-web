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

export function computeGlobalScore(
  metric: Omit<GlobalPageMetric, 'globalScore' | 'recommendedAction'>
): number {
  const seoScore = Math.min(metric.ctr * 1000, 100);
  const uxScore = Math.min(metric.pageViews, 100);
  const revenueScore = Math.min(metric.estimatedRevenue * 20, 100);
  const authScore = metric.authorityScore;
  return Math.round(seoScore * 0.3 + uxScore * 0.2 + revenueScore * 0.3 + authScore * 0.2);
}

export type PageClassification = 'HIGH_VALUE' | 'OPPORTUNITY' | 'CONVERSION_GAP' | 'LOW_VALUE';

export function classifyPage(score: number): PageClassification {
  if (score > 70) return 'HIGH_VALUE';
  if (score > 50) return 'OPPORTUNITY';
  if (score > 30) return 'CONVERSION_GAP';
  return 'LOW_VALUE';
}

export function getActionLabel(classification: string): string {
  switch (classification) {
    case 'HIGH_VALUE':
      return 'Dupliquer sur territoire adjacent';
    case 'OPPORTUNITY':
      return 'Renforcer le maillage interne';
    case 'CONVERSION_GAP':
      return 'Améliorer le titre et le CTA';
    default:
      return 'Déprioritiser — faible potentiel';
  }
}
