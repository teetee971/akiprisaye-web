import { expect, test } from 'vitest';
import { computeComparison } from './comparisonService';

test('computeComparison returns sorted list and best', () => {
  const obs = [
    { date: '2026-01-01', price: 2.5, store: 'A' },
    { date: '2026-01-02', price: 2.4, store: 'B' },
    { date: '2026-01-03', price: 2.6, store: 'A' }, // newer for A
  ];
  const res = computeComparison(obs as any);
  expect(res.list[0].store).toBe('B');
  expect(res.best?.store).toBe('B');
});
