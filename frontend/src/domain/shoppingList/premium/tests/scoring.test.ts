import { describe, expect, it } from 'vitest';
import { computeConfidenceScore } from '../scoring';

function daysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

describe('computeConfidenceScore', () => {
  it('increases score for reliable source, freshness and enough points', () => {
    const score = computeConfidenceScore({
      source: 'open_prices',
      lastObservedAt: daysAgo(2),
      priceHistory: [
        { price: 10, observedAt: daysAgo(10) },
        { price: 10.1, observedAt: daysAgo(8) },
        { price: 10.2, observedAt: daysAgo(6) },
        { price: 10.3, observedAt: daysAgo(4) },
        { price: 10.4, observedAt: daysAgo(2) },
      ],
    });

    expect(score).toBeGreaterThanOrEqual(80);
  });

  it('decreases score when price dispersion is high', () => {
    const score = computeConfidenceScore({
      source: 'scan_utilisateur',
      lastObservedAt: daysAgo(20),
      priceHistory: [
        { price: 2, observedAt: daysAgo(30) },
        { price: 20, observedAt: daysAgo(20) },
        { price: 3, observedAt: daysAgo(10) },
        { price: 15, observedAt: daysAgo(5) },
        { price: 1, observedAt: daysAgo(1) },
      ],
    });

    expect(score).toBeLessThanOrEqual(50);
  });
});
