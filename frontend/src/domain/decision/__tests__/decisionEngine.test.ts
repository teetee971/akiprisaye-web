import { describe, expect, it } from 'vitest';
import { decideForItem } from '../decisionEngine';

const item = { id: 'item-1' };

describe('decisionEngine', () => {
  it('returns BUY_NOW when recent drop is significant', () => {
    const rec = decideForItem(item, [
      { source: 'x', price: 5, currency: 'EUR', observedAt: '2026-01-01' },
      { source: 'x', price: 5, currency: 'EUR', observedAt: '2026-01-02' },
      { source: 'x', price: 4, currency: 'EUR', observedAt: '2026-01-03' },
    ]);
    expect(rec.verdict).toBe('BUY_NOW');
  });

  it('returns WAIT when price is above median', () => {
    const rec = decideForItem(item, [
      { source: 'x', price: 2, currency: 'EUR', observedAt: '2026-01-01' },
      { source: 'x', price: 2.1, currency: 'EUR', observedAt: '2026-01-02' },
      { source: 'x', price: 2.5, currency: 'EUR', observedAt: '2026-01-03' },
    ]);
    expect(rec.verdict).toBe('WAIT');
  });

  it('returns WATCH when history is insufficient', () => {
    const rec = decideForItem(item, [
      { source: 'x', price: 2.1, currency: 'EUR', observedAt: '2026-01-02' },
    ]);
    expect(rec.verdict).toBe('WATCH');
  });
});
