/**
 * b2bScoringEngine.ts — B2B retailer and insight scoring (V6)
 */

export interface B2BRetailerSignals {
  clicks?: number;
  conversions?: number;
  avgBasketValue?: number;
  territories?: string[];
  productCount?: number;
}

export interface ScoredB2BRetailer {
  name: string;
  score: number;
  tier: 'premium' | 'pro' | 'starter';
  territories: string[];
}

export function computeB2BRetailerScore(signals: B2BRetailerSignals): number {
  const c = Math.min(100, ((signals.clicks ?? 0) / 500) * 100);
  const v = Math.min(100, ((signals.conversions ?? 0) / 100) * 100);
  const b = Math.min(100, ((signals.avgBasketValue ?? 0) / 50) * 100);
  return Math.min(100, Math.max(0, Math.round(c * 0.4 + v * 0.4 + b * 0.2)));
}

export function classifyB2BTier(score: number): ScoredB2BRetailer['tier'] {
  if (score >= 70) return 'premium';
  if (score >= 40) return 'pro';
  return 'starter';
}

export function rankB2BRetailers(retailers: Map<string, B2BRetailerSignals>): ScoredB2BRetailer[] {
  return [...retailers.entries()]
    .map(([name, s]) => {
      const score = computeB2BRetailerScore(s);
      return { name, score, tier: classifyB2BTier(score), territories: s.territories ?? [] };
    })
    .sort((a, b) => b.score - a.score);
}
