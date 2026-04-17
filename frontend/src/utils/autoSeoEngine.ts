import { capHighPriority, validateRecommendations } from './autoSeoGuardrails';

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

export type AutoSeoActionType =
  | 'IMPROVE_TITLE'
  | 'IMPROVE_META'
  | 'BOOST_LINKING'
  | 'ENRICH_CONTENT'
  | 'DUPLICATE_PAGE'
  | 'BOOST_CTA'
  | 'DEPRIORITIZE';

export interface AutoSeoRecommendation {
  type: AutoSeoActionType;
  priority: 'high' | 'medium' | 'low';
  url: string;
  reason: string;
  expectedImpact?: string;
  suggestedTarget?: string;
}

export const SAMPLE_SIGNALS: AutoSeoSignal[] = [
  {
    url: '/gp/produit/lait-entier',
    pageType: 'product',
    impressions: 120,
    clicks: 3,
    ctr: 0.025,
    pageViews: 45,
    affiliateClicks: 2,
    estimatedRevenue: 1.0,
    backlinks: 3,
    authorityScore: 35,
    performanceScore: 72,
  },
  {
    url: '/mq/produit/riz-blanc',
    pageType: 'product',
    impressions: 80,
    clicks: 1,
    ctr: 0.0125,
    pageViews: 18,
    affiliateClicks: 0,
    estimatedRevenue: 0.0,
    backlinks: 1,
    authorityScore: 20,
    performanceScore: 65,
  },
  {
    url: '/re/categorie/epicerie',
    pageType: 'category',
    impressions: 300,
    clicks: 12,
    ctr: 0.04,
    pageViews: 60,
    affiliateClicks: 5,
    estimatedRevenue: 2.5,
    backlinks: 8,
    authorityScore: 55,
    performanceScore: 80,
  },
  {
    url: '/gf/categorie/hygiene',
    pageType: 'category',
    impressions: 40,
    clicks: 0,
    ctr: 0.0,
    pageViews: 5,
    affiliateClicks: 0,
    estimatedRevenue: 0.0,
    backlinks: 0,
    authorityScore: 10,
    performanceScore: 50,
  },
  {
    url: '/yt/comparaison/supermarchés',
    pageType: 'comparison',
    impressions: 200,
    clicks: 8,
    ctr: 0.04,
    pageViews: 40,
    affiliateClicks: 3,
    estimatedRevenue: 1.5,
    backlinks: 5,
    authorityScore: 45,
    performanceScore: 75,
  },
  {
    url: '/mq/inflation/2024',
    pageType: 'inflation',
    impressions: 500,
    clicks: 20,
    ctr: 0.04,
    pageViews: 80,
    affiliateClicks: 1,
    estimatedRevenue: 0.5,
    backlinks: 12,
    authorityScore: 60,
    performanceScore: 85,
  },
  {
    url: '/re/inflation/alimentaire',
    pageType: 'inflation',
    impressions: 25,
    clicks: 0,
    ctr: 0.0,
    pageViews: 2,
    affiliateClicks: 0,
    estimatedRevenue: 0.0,
    backlinks: 0,
    authorityScore: 5,
    performanceScore: 40,
  },
  {
    url: '/gp/guide/comparer-prix',
    pageType: 'pillar',
    impressions: 800,
    clicks: 30,
    ctr: 0.0375,
    pageViews: 90,
    affiliateClicks: 8,
    estimatedRevenue: 4.0,
    backlinks: 20,
    authorityScore: 70,
    performanceScore: 88,
  },
  {
    url: '/mq/guide/economies-courses',
    pageType: 'pillar',
    impressions: 150,
    clicks: 4,
    ctr: 0.0267,
    pageViews: 12,
    affiliateClicks: 1,
    estimatedRevenue: 0.5,
    backlinks: 4,
    authorityScore: 30,
    performanceScore: 68,
  },
  {
    url: '/gf/produit/beurre-doux',
    pageType: 'product',
    impressions: 55,
    clicks: 1,
    ctr: 0.0182,
    pageViews: 22,
    affiliateClicks: 1,
    estimatedRevenue: 0.5,
    backlinks: 2,
    authorityScore: 22,
    performanceScore: 62,
  },
  {
    url: '/yt/produit/huile-tournesol',
    pageType: 'product',
    impressions: 3,
    clicks: 0,
    ctr: 0.0,
    pageViews: 1,
    affiliateClicks: 0,
    estimatedRevenue: 0.0,
    backlinks: 0,
    authorityScore: 5,
    performanceScore: 35,
  },
  {
    url: '/gp/comparaison/grandes-surfaces',
    pageType: 'comparison',
    impressions: 350,
    clicks: 14,
    ctr: 0.04,
    pageViews: 70,
    affiliateClicks: 7,
    estimatedRevenue: 3.5,
    backlinks: 10,
    authorityScore: 58,
    performanceScore: 83,
  },
];

export function computePageScore(signal: AutoSeoSignal): AutoSeoPageScore {
  const seoScore = Math.min(signal.impressions / 10 + signal.ctr * 1000, 100);
  const uxScore = Math.min(signal.pageViews, 100);
  const revenueScore = Math.min(signal.estimatedRevenue * 10 + signal.affiliateClicks * 5, 100);
  const authorityScore = Math.min(signal.authorityScore, 100);
  const globalScore = seoScore * 0.3 + uxScore * 0.2 + revenueScore * 0.3 + authorityScore * 0.2;
  return {
    url: signal.url,
    seoScore: parseFloat(seoScore.toFixed(2)),
    uxScore: parseFloat(uxScore.toFixed(2)),
    revenueScore: parseFloat(revenueScore.toFixed(2)),
    authorityScore: parseFloat(authorityScore.toFixed(2)),
    globalScore: parseFloat(globalScore.toFixed(2)),
  };
}

function suggestedTerritory(url: string): string {
  const territories = ['gp', 'mq', 're', 'gf', 'yt'];
  const current = territories.find((t) => url.includes(`/${t}/`));
  const others = territories.filter((t) => t !== current);
  return current ? url.replace(`/${current}/`, `/${others[0]}/`) : url + '-mq';
}

export function generateRecommendations(signals: AutoSeoSignal[]): AutoSeoRecommendation[] {
  const recs: AutoSeoRecommendation[] = [];

  for (const signal of signals) {
    const score = computePageScore(signal);

    if (signal.impressions > 50 && signal.ctr < 0.015) {
      recs.push({
        type: 'IMPROVE_TITLE',
        priority: 'high',
        url: signal.url,
        reason: `CTR de ${(signal.ctr * 100).toFixed(2)}% trop faible malgré ${signal.impressions} impressions`,
        expectedImpact: '+15-30% de clics organiques',
      });
    } else if (signal.impressions > 50 && signal.clicks < 5) {
      recs.push({
        type: 'IMPROVE_META',
        priority: 'medium',
        url: signal.url,
        reason: `Seulement ${signal.clicks} clics pour ${signal.impressions} impressions`,
        expectedImpact: '+10% de clics',
      });
    } else if (signal.affiliateClicks > 0 || signal.pageViews > 20) {
      recs.push({
        type: 'BOOST_LINKING',
        priority: 'medium',
        url: signal.url,
        reason: `${signal.pageViews} pages vues et ${signal.affiliateClicks} clics affiliés`,
        expectedImpact: '+20% de pages vues par session',
      });
    } else if (
      ['pillar', 'category', 'comparison'].includes(signal.pageType) &&
      signal.pageViews < 10
    ) {
      recs.push({
        type: 'ENRICH_CONTENT',
        priority: 'medium',
        url: signal.url,
        reason: `Page ${signal.pageType} avec seulement ${signal.pageViews} pages vues`,
        expectedImpact: "+25% d'engagement",
      });
    } else if (score.globalScore > 60 && signal.pageViews > 15) {
      recs.push({
        type: 'DUPLICATE_PAGE',
        priority: 'high',
        url: signal.url,
        reason: `Score global de ${score.globalScore.toFixed(1)} et ${signal.pageViews} pages vues`,
        expectedImpact: 'Nouvelle source de trafic organique',
        suggestedTarget: suggestedTerritory(signal.url),
      });
    } else if (signal.pageViews > 30 && signal.affiliateClicks < 3) {
      recs.push({
        type: 'BOOST_CTA',
        priority: 'high',
        url: signal.url,
        reason: `${signal.pageViews} pages vues mais seulement ${signal.affiliateClicks} clics affiliés`,
        expectedImpact: '+40% de conversions affiliées',
      });
    } else if (signal.impressions < 5 && signal.pageViews < 3 && signal.clicks === 0) {
      recs.push({
        type: 'DEPRIORITIZE',
        priority: 'low',
        url: signal.url,
        reason: `Faible visibilité : ${signal.impressions} impressions, 0 clics`,
        expectedImpact: 'Libère budget crawl',
      });
    } else {
      recs.push({
        type: 'BOOST_LINKING',
        priority: 'low',
        url: signal.url,
        reason: `Maillage interne à renforcer pour améliorer la découvrabilité`,
        expectedImpact: '+10% de trafic interne',
      });
    }
  }

  return validateRecommendations(capHighPriority(recs));
}

export interface SummaryStats {
  total: number;
  highPriority: number;
  toDuplicate: number;
  toBoostCta: number;
  toDeprioritize: number;
}

export function getSummaryStats(recs: AutoSeoRecommendation[]): SummaryStats {
  return {
    total: recs.length,
    highPriority: recs.filter((r) => r.priority === 'high').length,
    toDuplicate: recs.filter((r) => r.type === 'DUPLICATE_PAGE').length,
    toBoostCta: recs.filter((r) => r.type === 'BOOST_CTA').length,
    toDeprioritize: recs.filter((r) => r.type === 'DEPRIORITIZE').length,
  };
}
