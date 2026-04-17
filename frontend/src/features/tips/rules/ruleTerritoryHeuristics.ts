import type { TipRule } from '../types';

const DOM_TERRITORIES = new Set(['gp', 'mq', 'gf', 're', 'yt']);

export const ruleTerritoryHeuristics: TipRule = {
  id: 'territory-heuristics',
  run(ctx) {
    if (!ctx.territory || !DOM_TERRITORIES.has(ctx.territory)) {
      return [];
    }

    return [
      {
        id: 'tip.domHeuristic',
        message:
          'En DOM-TOM, les arrivages influencent fortement les prix : surveillez les variations hebdomadaires.',
        severity: 'info',
        confidence: 0.75,
        tags: ['domtom', 'arrivages'],
      },
    ];
  },
};
