import { describe, expect, it } from 'vitest';
import { simulateMonthlySavings } from '../savingsSimulator';

function daysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

describe('simulateMonthlySavings', () => {
  it('computes savings when trend is down and min30 is lower than last price', () => {
    const result = simulateMonthlySavings([
      {
        quantity: 2,
        trend30: 'down',
        lastPrice: 4,
        priceHistory: [
          { price: 3.5, observedAt: daysAgo(10) },
          { price: 4, observedAt: daysAgo(1) },
        ],
      },
    ]);

    expect(result.potentialSavings).toBeCloseTo(1, 4);
  });

  it('ignores items with flat or up trend', () => {
    const result = simulateMonthlySavings([
      {
        quantity: 3,
        trend30: 'flat',
        lastPrice: 5,
        priceHistory: [{ price: 4, observedAt: daysAgo(5) }],
      },
    ]);

    expect(result.potentialSavings).toBe(0);
  });
});
