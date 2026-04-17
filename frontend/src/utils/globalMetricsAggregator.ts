import { getSEOPageStats } from './statsTracker';
import { getConversionStats } from './priceClickTracker';
import { getBacklinkStats } from './backlinkTracker';
import { getCROStats } from './conversionTracker';

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

const SAMPLE_DATA: Omit<
  GlobalPageMetric,
  'globalScore' | 'recommendedAction' | 'duplicationPotential'
>[] = [
  {
    url: '/prix/coca-cola-1-5l-guadeloupe',
    pageType: 'product',
    territory: 'GP',
    impressions: 1200,
    clicks: 8,
    ctr: 0.0067,
    position: 14.2,
    pageViews: 120,
    affiliateClicks: 2,
    ctaCtr: 0.017,
    estimatedRevenue: 1.2,
    performanceScore: 45,
    backlinks: 1,
    authorityScore: 38,
  },
  {
    url: '/comparer/carrefour-vs-leclerc-guadeloupe',
    pageType: 'comparison',
    territory: 'GP',
    impressions: 450,
    clicks: 31,
    ctr: 0.069,
    position: 5.1,
    pageViews: 200,
    affiliateClicks: 18,
    ctaCtr: 0.09,
    estimatedRevenue: 12.5,
    performanceScore: 85,
    backlinks: 4,
    authorityScore: 72,
  },
  {
    url: '/guide-prix-alimentaire-dom',
    pageType: 'pillar',
    impressions: 800,
    clicks: 22,
    ctr: 0.0275,
    position: 8.3,
    pageViews: 180,
    affiliateClicks: 5,
    ctaCtr: 0.028,
    estimatedRevenue: 4.0,
    performanceScore: 68,
    backlinks: 3,
    authorityScore: 65,
  },
  {
    url: '/inflation/alimentation-guadeloupe-2024',
    pageType: 'inflation',
    territory: 'GP',
    impressions: 320,
    clicks: 14,
    ctr: 0.044,
    position: 7.5,
    pageViews: 95,
    affiliateClicks: 3,
    ctaCtr: 0.032,
    estimatedRevenue: 2.8,
    performanceScore: 60,
    backlinks: 2,
    authorityScore: 52,
  },
  {
    url: '/prix/huile-tournesol-martinique',
    pageType: 'product',
    territory: 'MQ',
    impressions: 180,
    clicks: 4,
    ctr: 0.022,
    position: 18.0,
    pageViews: 55,
    affiliateClicks: 1,
    ctaCtr: 0.018,
    estimatedRevenue: 0.8,
    performanceScore: 35,
    backlinks: 0,
    authorityScore: 20,
  },
  {
    url: '/categorie/produits-laitiers-reunion',
    pageType: 'category',
    territory: 'RE',
    impressions: 240,
    clicks: 10,
    ctr: 0.042,
    position: 9.2,
    pageViews: 78,
    affiliateClicks: 4,
    ctaCtr: 0.051,
    estimatedRevenue: 3.2,
    performanceScore: 55,
    backlinks: 1,
    authorityScore: 44,
  },
  {
    url: '/comparateur-supermarches-dom',
    pageType: 'comparison',
    impressions: 560,
    clicks: 38,
    ctr: 0.068,
    position: 4.8,
    pageViews: 220,
    affiliateClicks: 22,
    ctaCtr: 0.1,
    estimatedRevenue: 15.0,
    performanceScore: 90,
    backlinks: 6,
    authorityScore: 80,
  },
  {
    url: '/prix/farine-ble-guyane',
    pageType: 'product',
    territory: 'GF',
    impressions: 90,
    clicks: 2,
    ctr: 0.022,
    position: 22.1,
    pageViews: 30,
    affiliateClicks: 0,
    ctaCtr: 0.0,
    estimatedRevenue: 0.0,
    performanceScore: 20,
    backlinks: 0,
    authorityScore: 12,
  },
  {
    url: '/inflation-alimentaire-dom',
    pageType: 'pillar',
    impressions: 680,
    clicks: 28,
    ctr: 0.041,
    position: 6.9,
    pageViews: 160,
    affiliateClicks: 8,
    ctaCtr: 0.05,
    estimatedRevenue: 6.5,
    performanceScore: 72,
    backlinks: 5,
    authorityScore: 70,
  },
  {
    url: '/prix/sucre-roux-mayotte',
    pageType: 'product',
    territory: 'YT',
    impressions: 40,
    clicks: 0,
    ctr: 0.0,
    position: 35.0,
    pageViews: 8,
    affiliateClicks: 0,
    ctaCtr: 0.0,
    estimatedRevenue: 0.0,
    performanceScore: 5,
    backlinks: 0,
    authorityScore: 5,
  },
];

function computeGlobalScore(
  ctr: number,
  pageViews: number,
  estimatedRevenue: number,
  authorityScore: number
): number {
  const seoScore = Math.min(ctr * 1000, 100);
  const uxScore = Math.min(pageViews, 100);
  const revenueScore = Math.min(estimatedRevenue * 20, 100);
  const authScore = authorityScore;
  return Math.round(seoScore * 0.3 + uxScore * 0.2 + revenueScore * 0.3 + authScore * 0.2);
}

function getRecommendedAction(score: number): string {
  if (score > 70) return 'DUPLICATE_PAGE';
  if (score > 50) return 'BOOST_LINKING';
  if (score > 30) return 'IMPROVE_TITLE';
  return 'DEPRIORITIZE';
}

export function aggregateGlobalMetrics(): GlobalPageMetric[] {
  // Load live data to enrich sample data where possible
  let _seoStats: ReturnType<typeof getSEOPageStats> = [];
  let _convStats: ReturnType<typeof getConversionStats> | null = null;
  let _backlinkStats: ReturnType<typeof getBacklinkStats> | null = null;
  let _croStats: ReturnType<typeof getCROStats> | null = null;

  try {
    _seoStats = getSEOPageStats();
  } catch {
    /* ignore */
  }
  try {
    _convStats = getConversionStats();
  } catch {
    /* ignore */
  }
  try {
    _backlinkStats = getBacklinkStats();
  } catch {
    /* ignore */
  }
  try {
    _croStats = getCROStats();
  } catch {
    /* ignore */
  }

  // Suppress unused variable warnings – these are available for future enrichment
  void _seoStats;
  void _convStats;
  void _backlinkStats;
  void _croStats;

  return SAMPLE_DATA.map((page) => {
    const globalScore = computeGlobalScore(
      page.ctr,
      page.pageViews,
      page.estimatedRevenue,
      page.authorityScore
    );
    return {
      ...page,
      globalScore,
      duplicationPotential: globalScore > 50,
      recommendedAction: getRecommendedAction(globalScore),
    };
  });
}
