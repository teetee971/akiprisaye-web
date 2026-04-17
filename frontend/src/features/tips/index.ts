import { runTips } from './engine';
import { computeSavingsScore, isPremiumTipEnabled } from './scorer';
import { ruleHighVariance } from './rules/ruleHighVariance';
import { rulePriceAboveMedian } from './rules/rulePriceAboveMedian';
import { ruleSeasonality } from './rules/ruleSeasonality';
import { ruleTerritoryHeuristics } from './rules/ruleTerritoryHeuristics';
import type { Tip, TipContext, TipRule } from './types';

export const tipRules: TipRule[] = [
  rulePriceAboveMedian,
  ruleHighVariance,
  ruleTerritoryHeuristics,
  ruleSeasonality,
];

export function buildTips(ctx: TipContext): {
  tips: Tip[];
  score: number;
  premiumEnabled: boolean;
} {
  const score = computeSavingsScore(ctx);
  const tips = runTips(tipRules, ctx);
  const premiumEnabled = isPremiumTipEnabled(score);

  const premiumTip: Tip[] = premiumEnabled
    ? [
        {
          id: 'tip.premium',
          message:
            'Astuce Premium : comparez 2 enseignes + marque distributeur, l’économie potentielle est élevée.',
          severity: 'premium',
          confidence: 0.9,
          tags: ['premium', 'économie'],
        },
      ]
    : [];

  return {
    tips: [...premiumTip, ...tips],
    score,
    premiumEnabled,
  };
}

export type { Tip, TipContext, TipRule } from './types';
