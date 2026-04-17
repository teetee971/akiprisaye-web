interface SeoLoopMetric {
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

export interface DuplicationSuggestion {
  sourceUrl: string;
  suggestedUrl: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
}

const TERRITORY_NEXT: Record<string, string> = {
  GP: 'martinique',
  MQ: 'reunion',
  RE: 'guyane',
  GF: 'mayotte',
  YT: 'guadeloupe',
};

export function generateDuplicationSuggestions(metrics: SeoLoopMetric[]): DuplicationSuggestion[] {
  const suggestions: DuplicationSuggestion[] = [];
  const seen = new Set<string>();

  for (const m of metrics) {
    if (m.ctr <= 0.02) continue;

    const territory = m.territory?.toUpperCase();
    const nextTerritorySlug = territory ? TERRITORY_NEXT[territory] : null;

    if (!nextTerritorySlug) {
      if (m.pageType === 'comparison') {
        const suggestedUrl = `${m.url}-martinique`;
        if (suggestedUrl !== m.url && !seen.has(suggestedUrl)) {
          seen.add(suggestedUrl);
          suggestions.push({
            sourceUrl: m.url,
            suggestedUrl,
            reason: `Page comparaison performante (CTR ${(m.ctr * 100).toFixed(1)}%) — variante territoire`,
            priority: m.ctr > 0.05 ? 'high' : 'medium',
          });
        }
      }
      continue;
    }

    const currentSlug = territory ? territory.toLowerCase() : '';
    const suggestedUrl = currentSlug
      ? m.url.replace(currentSlug, nextTerritorySlug)
      : `${m.url}-${nextTerritorySlug}`;

    if (suggestedUrl === m.url || seen.has(suggestedUrl)) continue;
    seen.add(suggestedUrl);

    suggestions.push({
      sourceUrl: m.url,
      suggestedUrl,
      reason: `CTR ${(m.ctr * 100).toFixed(1)}% — dupliquer vers ${nextTerritorySlug}`,
      priority: m.ctr > 0.05 ? 'high' : 'medium',
    });
  }

  return suggestions;
}
