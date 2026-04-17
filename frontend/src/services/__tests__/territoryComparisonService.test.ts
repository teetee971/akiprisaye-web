import { describe, expect, it } from 'vitest';
import type { PriceObservation } from '../../types/priceObservation';
import {
  buildTerritoryTimeSeries,
  calculateTerritoryAverages,
  calculateTerritoryComparison,
} from '../territoryComparisonService';

const baseObservation = {
  productId: 'milk-1l',
  productLabel: 'Lait UHT 1L',
  source: 'open-data',
} as const;

const makeObs = (
  territory: PriceObservation['territory'],
  price: number,
  observedAt: string
): PriceObservation => ({
  ...baseObservation,
  territory,
  price,
  observedAt,
});

describe('territoryComparisonService', () => {
  it('calculates averages per territory', () => {
    const observations: PriceObservation[] = [
      makeObs('FR', 1.1, '2026-01-01'),
      makeObs('FR', 1.3, '2026-01-02'),
      makeObs('GP', 1.5, '2026-01-01'),
      makeObs('GP', 1.7, '2026-01-02'),
    ];

    const averages = calculateTerritoryAverages(observations);

    expect(averages.FR).toBeCloseTo(1.2);
    expect(averages.GP).toBeCloseTo(1.6);
  });

  it('computes comparison with FR as base (absolute & relative gaps + ranking)', () => {
    const observations: PriceObservation[] = [
      makeObs('FR', 1.2, '2026-01-01'),
      makeObs('GP', 1.5, '2026-01-01'),
      makeObs('MQ', 1.4, '2026-01-01'),
      makeObs('GF', 1.8, '2026-01-01'),
    ];

    const comparison = calculateTerritoryComparison(observations, 'FR');

    expect(comparison).toHaveLength(4);
    expect(comparison[0]).toMatchObject({
      territory: 'FR',
      averagePrice: 1.2,
      absoluteGap: 0,
      relativeGap: 0,
      rank: 1,
    });
    expect(comparison[1]).toMatchObject({
      territory: 'MQ',
      rank: 2,
    });
    expect(comparison[2]).toMatchObject({
      territory: 'GP',
      rank: 3,
    });
    expect(comparison[3]).toMatchObject({
      territory: 'GF',
      rank: 4,
    });
    expect(comparison[1].absoluteGap).toBeCloseTo(0.2);
    expect(comparison[1].relativeGap).toBeCloseTo((0.2 / 1.2) * 100);
    expect(comparison[2].absoluteGap).toBeCloseTo(0.3);
    expect(comparison[2].relativeGap).toBeCloseTo(25);
    expect(comparison[3].absoluteGap).toBeCloseTo(0.6);
    expect(comparison[3].relativeGap).toBeCloseTo(50);
  });

  it('falls back to lowest average when base territory missing', () => {
    const observations: PriceObservation[] = [
      makeObs('GP', 1.6, '2026-01-01'),
      makeObs('MQ', 1.4, '2026-01-01'),
    ];

    const comparison = calculateTerritoryComparison(observations, 'FR');

    expect(comparison[0].territory).toBe('MQ');
    expect(comparison[0].relativeGap).toBe(0);
  });

  it('builds time series sorted by date with per-territory averages', () => {
    const observations: PriceObservation[] = [
      makeObs('FR', 1.2, '2026-01-02'),
      makeObs('FR', 1.4, '2026-01-01'),
      makeObs('GP', 1.6, '2026-01-01'),
      makeObs('GP', 1.8, '2026-01-02'),
      makeObs('MQ', 1.5, '2026-01-02'),
    ];

    const series = buildTerritoryTimeSeries(observations);

    expect(series).toEqual([
      { date: '2026-01-01', FR: 1.4, GP: 1.6 },
      { date: '2026-01-02', FR: 1.2, GP: 1.8, MQ: 1.5 },
    ]);
  });

  it('ignores territories outside scope gracefully', () => {
    const observations: PriceObservation[] = [
      makeObs('FR', 1.2, '2026-01-01'),
      makeObs('YT', 1.3, '2026-01-01'),
    ];

    const comparison = calculateTerritoryComparison(observations);

    expect(comparison).toHaveLength(1);
    expect(comparison[0].territory).toBe('FR');
  });
});
