import { describe, expect, it } from 'vitest';
import { computeTrend } from '../trend';

function daysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

describe('computeTrend', () => {
  it('detects up trend', () => {
    const result = computeTrend([
      { price: 10, observedAt: daysAgo(13) },
      { price: 10.5, observedAt: daysAgo(10) },
      { price: 12, observedAt: daysAgo(3) },
      { price: 12.2, observedAt: daysAgo(1) },
    ], 7);

    expect(result.trend).toBe('up');
    expect(result.deltaPct).not.toBeNull();
  });

  it('detects down trend', () => {
    const result = computeTrend([
      { price: 12, observedAt: daysAgo(13) },
      { price: 11.8, observedAt: daysAgo(10) },
      { price: 10.2, observedAt: daysAgo(3) },
      { price: 10, observedAt: daysAgo(1) },
    ], 7);

    expect(result.trend).toBe('down');
    expect(result.deltaPct).not.toBeNull();
  });

  it('detects flat trend with low variation', () => {
    const result = computeTrend([
      { price: 10, observedAt: daysAgo(13) },
      { price: 10.02, observedAt: daysAgo(10) },
      { price: 10.05, observedAt: daysAgo(3) },
      { price: 10.07, observedAt: daysAgo(1) },
    ], 7);

    expect(result.trend).toBe('flat');
  });
});
