import type { TipRule } from '../types';

export const ruleHighVariance: TipRule = {
  id: 'high-variance',
  run(ctx) {
    const min = ctx.interval?.min;
    const max = ctx.interval?.max;

    if (!min || !max || max <= 0 || min <= 0 || max <= min) {
      return [];
    }

    const spread = (max - min) / max;
    if (spread < 0.2) {
      return [];
    }

    return [
      {
        id: 'tip.highVariance',
        message:
          'Écart important entre enseignes : vous pouvez économiser en changeant de magasin.',
        severity: 'info',
        confidence: Math.min(1, spread * 2),
        tags: ['écart', 'enseignes'],
      },
    ];
  },
};
