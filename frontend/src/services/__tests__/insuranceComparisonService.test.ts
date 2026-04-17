/**
 * Unit Tests for Insurance Comparison Service
 */

import { describe, it, expect } from 'vitest';
import {
  compareInsuranceByType,
  calculateInsuranceAggregation,
  filterInsurances,
} from '../insuranceComparisonService';
import type { InsurancePricePoint } from '../../types/insuranceComparison';

const makeSource = () => ({
  type: 'official_website' as const,
  observedAt: '2026-01-10T10:00:00Z',
  reliability: 'high' as const,
});

const mockInsurances: InsurancePricePoint[] = [
  {
    id: 'i1',
    providerName: 'AXA',
    offerName: 'Auto Essentiel',
    insuranceType: 'auto',
    coverageLevel: 'basic',
    annualPriceTTC: 480,
    territory: 'GP',
    mainCoverages: ['Responsabilité civile', 'Vol'],
    observationDate: '2026-01-10T10:00:00Z',
    source: makeSource(),
  },
  {
    id: 'i2',
    providerName: 'Groupama',
    offerName: 'Auto Confort',
    insuranceType: 'auto',
    coverageLevel: 'intermediate',
    annualPriceTTC: 650,
    territory: 'GP',
    mainCoverages: ['Responsabilité civile', 'Vol', 'Bris de glace'],
    observationDate: '2026-01-11T10:00:00Z',
    source: makeSource(),
  },
  {
    id: 'i3',
    providerName: 'Allianz',
    offerName: 'Auto Premium',
    insuranceType: 'auto',
    coverageLevel: 'comprehensive',
    annualPriceTTC: 820,
    territory: 'GP',
    mainCoverages: ['Tous risques', 'Assistance', 'Véhicule de remplacement'],
    observationDate: '2026-01-12T10:00:00Z',
    source: makeSource(),
  },
  {
    id: 'i4',
    providerName: 'AXA',
    offerName: 'Habitation Essentiel',
    insuranceType: 'home',
    coverageLevel: 'basic',
    annualPriceTTC: 250,
    territory: 'MQ',
    mainCoverages: ['Incendie', 'Dégâts des eaux'],
    observationDate: '2026-01-10T10:00:00Z',
    source: makeSource(),
  },
];

describe('compareInsuranceByType', () => {
  it('returns null for empty input', () => {
    expect(compareInsuranceByType('auto', 'GP', [])).toBeNull();
  });

  it('returns null when no insurances match type and territory', () => {
    expect(compareInsuranceByType('auto', 'RE', mockInsurances)).toBeNull();
  });

  it('returns null for missing parameters', () => {
    // @ts-expect-error - testing null type
    expect(compareInsuranceByType(null, 'GP', mockInsurances)).toBeNull();
  });

  it('returns valid result for GP auto', () => {
    const result = compareInsuranceByType('auto', 'GP', mockInsurances);
    expect(result).not.toBeNull();
    expect(result!.insuranceType).toBe('auto');
    expect(result!.territory).toBe('GP');
    expect(result!.rankedOffers).toHaveLength(3);
  });

  it('ranks from cheapest to most expensive', () => {
    const result = compareInsuranceByType('auto', 'GP', mockInsurances);
    const prices = result!.rankedOffers.map((r) => r.insurance.annualPriceTTC);
    expect(prices[0]).toBeLessThanOrEqual(prices[1]);
    expect(prices[1]).toBeLessThanOrEqual(prices[2]);
  });

  it('marks cheapest offer correctly', () => {
    const result = compareInsuranceByType('auto', 'GP', mockInsurances);
    expect(result!.rankedOffers[0].rank).toBe(1);
    expect(result!.rankedOffers[0].priceCategory).toBe('cheapest');
    expect(result!.rankedOffers[0].insurance.annualPriceTTC).toBe(480);
  });

  it('marks most expensive offer correctly', () => {
    const result = compareInsuranceByType('auto', 'GP', mockInsurances);
    const lastOffer = result!.rankedOffers[result!.rankedOffers.length - 1];
    expect(lastOffer.priceCategory).toBe('most_expensive');
    expect(lastOffer.insurance.annualPriceTTC).toBe(820);
  });

  it('correctly isolates home insurance in MQ', () => {
    const result = compareInsuranceByType('home', 'MQ', mockInsurances);
    expect(result).not.toBeNull();
    expect(result!.rankedOffers).toHaveLength(1);
  });
});

describe('calculateInsuranceAggregation', () => {
  it('calculates correct min and max', () => {
    const gpAuto = mockInsurances.filter((i) => i.insuranceType === 'auto' && i.territory === 'GP');
    const agg = calculateInsuranceAggregation(gpAuto);
    expect(agg.minPrice).toBe(480);
    expect(agg.maxPrice).toBe(820);
  });

  it('calculates correct average price', () => {
    const gpAuto = mockInsurances.filter((i) => i.insuranceType === 'auto' && i.territory === 'GP');
    const agg = calculateInsuranceAggregation(gpAuto);
    // (480 + 650 + 820) / 3 ≈ 650
    expect(agg.averagePrice).toBeCloseTo(650, 0);
  });

  it('calculates correct price range', () => {
    const gpAuto = mockInsurances.filter((i) => i.insuranceType === 'auto' && i.territory === 'GP');
    const agg = calculateInsuranceAggregation(gpAuto);
    expect(agg.priceRange).toBe(340);
  });

  it('counts total offers correctly', () => {
    const gpAuto = mockInsurances.filter((i) => i.insuranceType === 'auto' && i.territory === 'GP');
    const agg = calculateInsuranceAggregation(gpAuto);
    expect(agg.totalOffers).toBe(3);
  });

  it('lists available coverage levels', () => {
    const gpAuto = mockInsurances.filter((i) => i.insuranceType === 'auto' && i.territory === 'GP');
    const agg = calculateInsuranceAggregation(gpAuto);
    expect(agg.coverageLevels).toContain('basic');
    expect(agg.coverageLevels).toContain('intermediate');
    expect(agg.coverageLevels).toContain('comprehensive');
  });
});

describe('filterInsurances', () => {
  it('filters by insurance type', () => {
    const filtered = filterInsurances(mockInsurances, { insuranceType: 'home' });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].insuranceType).toBe('home');
  });

  it('filters by territory', () => {
    const filtered = filterInsurances(mockInsurances, { territory: 'MQ' });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].territory).toBe('MQ');
  });

  it('filters by coverage level', () => {
    const filtered = filterInsurances(mockInsurances, { coverageLevel: 'comprehensive' });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].coverageLevel).toBe('comprehensive');
  });

  it('filters by maxAnnualPrice', () => {
    const filtered = filterInsurances(mockInsurances, { maxAnnualPrice: 500 });
    expect(filtered.every((i) => i.annualPriceTTC <= 500)).toBe(true);
  });

  it('filters by provider', () => {
    const filtered = filterInsurances(mockInsurances, { provider: 'AXA' });
    expect(filtered).toHaveLength(2);
    expect(filtered.every((i) => i.providerName === 'AXA')).toBe(true);
  });

  it('combines multiple filters', () => {
    const filtered = filterInsurances(mockInsurances, {
      insuranceType: 'auto',
      territory: 'GP',
      maxAnnualPrice: 700,
    });
    expect(filtered).toHaveLength(2);
    expect(filtered.every((i) => i.annualPriceTTC <= 700)).toBe(true);
  });

  it('returns empty array when no match', () => {
    const filtered = filterInsurances(mockInsurances, { insuranceType: 'health' });
    expect(filtered).toHaveLength(0);
  });
});
