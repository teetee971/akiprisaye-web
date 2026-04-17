export type SeoLoopActionType =
  | 'IMPROVE_TITLE'
  | 'ENRICH_CONTENT'
  | 'BOOST_LINKING'
  | 'DUPLICATE_PAGE'
  | 'BOOST_CTA'
  | 'DEPRIORITIZE';

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

export function analyzeSeoLoop(metrics: SeoLoopMetric[]): SeoLoopAction[] {
  const actions: SeoLoopAction[] = [];

  for (const m of metrics) {
    if (m.impressions > 50 && m.ctr < 0.015) {
      actions.push({
        type: 'IMPROVE_TITLE',
        priority: 'high',
        url: m.url,
        reason: `CTR ${(m.ctr * 100).toFixed(2)}% trop bas malgré ${m.impressions} impressions`,
      });
    } else if ((m.pageType === 'pillar' || m.pageType === 'category') && m.pageViews < 10) {
      actions.push({
        type: 'ENRICH_CONTENT',
        priority: 'medium',
        url: m.url,
        reason: `Page ${m.pageType} avec seulement ${m.pageViews} vues — contenu à enrichir`,
      });
    } else if (m.ctr > 0.03 && m.pageViews > 20) {
      const territories: Record<string, string> = {
        GP: 'martinique',
        MQ: 'reunion',
        RE: 'guyane',
        GF: 'mayotte',
        YT: 'guadeloupe',
      };
      const suggestedTarget = m.territory
        ? m.url.replace(m.territory.toLowerCase(), territories[m.territory] ?? 'martinique')
        : undefined;
      actions.push({
        type: 'DUPLICATE_PAGE',
        priority: 'high',
        url: m.url,
        reason: `Excellentes performances (CTR ${(m.ctr * 100).toFixed(1)}%, ${m.pageViews} vues) — dupliquer sur territoire adjacent`,
        suggestedTarget,
      });
    } else if (m.pageViews > 100 && m.affiliateClicks < 3) {
      actions.push({
        type: 'BOOST_CTA',
        priority: 'high',
        url: m.url,
        reason: `${m.pageViews} vues mais seulement ${m.affiliateClicks} clics affiliés — optimiser le CTA`,
      });
    } else if (m.affiliateClicks > 0 || m.pageViews > 50) {
      actions.push({
        type: 'BOOST_LINKING',
        priority: 'medium',
        url: m.url,
        reason: `Page avec engagement (${m.pageViews} vues, ${m.affiliateClicks} clics) — renforcer le maillage interne`,
      });
    } else if (m.impressions < 10 && m.pageViews < 5 && m.clicks === 0) {
      actions.push({
        type: 'DEPRIORITIZE',
        priority: 'low',
        url: m.url,
        reason: `Page sans trafic (${m.impressions} impressions, ${m.clicks} clics) — déprioritiser`,
      });
    } else {
      actions.push({
        type: 'BOOST_LINKING',
        priority: 'low',
        url: m.url,
        reason: `Renforcer le maillage interne pour améliorer la visibilité`,
      });
    }
  }

  return actions;
}
