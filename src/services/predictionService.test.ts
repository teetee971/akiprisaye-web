import { expect, test } from 'vitest';
import { computePrediction } from './predictionService';

test('computePrediction returns Baisse probable on clear downward trend', () => {
  const obs = [
    { date: '2026-01-01T00:00:00Z', price: 10 },
    { date: '2026-01-08T00:00:00Z', price: 9.5 },
    { date: '2026-01-15T00:00:00Z', price: 9.0 },
    { date: '2026-01-22T00:00:00Z', price: 8.5 },
    { date: '2026-01-29T00:00:00Z', price: 8.0 },
  ];
  const res = computePrediction(obs, { window: 5, epsSlope: 0.01, volatilityThreshold: 0.2 });
  expect(res.label).toBe('Baisse probable');
});
