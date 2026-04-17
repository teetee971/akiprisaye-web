export interface ExpansionCandidate {
  sourceUrl: string;
  pageType: 'product' | 'category' | 'comparison' | 'inflation' | 'pillar';
  territory?: string;
  productName?: string;
  categoryName?: string;
  performanceScore: number;
}

export interface ExpansionSuggestion {
  sourceUrl: string;
  suggestedUrl: string;
  targetTerritory?: string;
  targetCategory?: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
}

const TERRITORY_ADJACENCY: Record<string, string[]> = {
  GP: ['MQ', 'RE'],
  MQ: ['GP', 'GF'],
  GF: ['MQ', 'YT'],
  RE: ['GP', 'MQ'],
  YT: ['RE', 'GF'],
};

const TERRITORY_SLUGS: Record<string, string> = {
  GP: 'guadeloupe',
  MQ: 'martinique',
  GF: 'guyane',
  RE: 'reunion',
  YT: 'mayotte',
};

export function generateExpansionSuggestions(
  candidates: ExpansionCandidate[]
): ExpansionSuggestion[] {
  const suggestions: ExpansionSuggestion[] = [];
  const seen = new Set<string>();

  for (const candidate of candidates) {
    if (candidate.performanceScore <= 50) continue;

    const territory = candidate.territory?.toUpperCase();
    const adjacent = territory ? (TERRITORY_ADJACENCY[territory] ?? []) : [];
    let count = 0;

    for (const adjTerritory of adjacent) {
      if (count >= 3) break;

      const adjSlug = TERRITORY_SLUGS[adjTerritory];
      const currentSlug = territory ? (TERRITORY_SLUGS[territory] ?? '') : '';
      const suggestedUrl = currentSlug
        ? candidate.sourceUrl.replace(currentSlug, adjSlug)
        : `${candidate.sourceUrl}-${adjSlug}`;

      if (suggestedUrl === candidate.sourceUrl || seen.has(suggestedUrl)) continue;
      seen.add(suggestedUrl);

      suggestions.push({
        sourceUrl: candidate.sourceUrl,
        suggestedUrl,
        targetTerritory: adjTerritory,
        reason: `Performance score ${candidate.performanceScore} — dupliquer vers ${adjSlug} (${adjTerritory})`,
        priority: candidate.performanceScore > 75 ? 'high' : 'medium',
      });
      count++;
    }

    if (candidate.pageType === 'comparison' && adjacent.length === 0 && count === 0) {
      const fallbackTerritory = 'MQ';
      const fallbackSlug = TERRITORY_SLUGS[fallbackTerritory];
      const suggestedUrl = `${candidate.sourceUrl}-${fallbackSlug}`;
      if (!seen.has(suggestedUrl)) {
        seen.add(suggestedUrl);
        suggestions.push({
          sourceUrl: candidate.sourceUrl,
          suggestedUrl,
          targetTerritory: fallbackTerritory,
          reason: `Page comparaison performante — étendre vers ${fallbackSlug}`,
          priority: 'medium',
        });
      }
    }
  }

  return suggestions;
}
