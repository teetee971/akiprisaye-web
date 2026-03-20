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
