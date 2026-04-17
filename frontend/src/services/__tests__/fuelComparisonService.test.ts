/**
 * Unit Tests for Fuel Comparison Service
 */

import { describe, it, expect } from 'vitest';
import {
  compareFuelPricesByTerritory,
  calculateFuelAggregation,
  filterFuelPrices,
} from '../fuelComparisonService';
import type { FuelPricePoint } from '../../types/fuelComparison';

const makeStation = (id: string, city: string, brand?: string) => ({
  id,
  name: `Station ${id}`,
  address: '1 rue Exemple',
  city,
  territory: 'GP' as const,
  brand,
});

const makeSource = () => ({
  type: 'official_api' as const,
  observedAt: '2026-01-10T10:00:00Z',
  reliability: 'high' as const,
});

const mockPrices: FuelPricePoint[] = [
  {
    id: 'fp1',
    station: makeStation('s1', 'Pointe-à-Pitre', 'Total'),
    fuelType: 'SP95',
    pricePerLiter: 1.65,
    currency: 'EUR',
    observationDate: '2026-01-10T10:00:00Z',
    source: makeSource(),
    isPriceCapPlafonne: false,
    territory: 'GP',
  },
  {
    id: 'fp2',
    station: makeStation('s2', 'Baie-Mahault', 'Shell'),
    fuelType: 'SP95',
    pricePerLiter: 1.7,
    currency: 'EUR',
    observationDate: '2026-01-11T10:00:00Z',
    source: makeSource(),
    isPriceCapPlafonne: true,
    territory: 'GP',
  },
  {
    id: 'fp3',
    station: makeStation('s3', 'Les Abymes'),
    fuelType: 'SP95',
    pricePerLiter: 1.75,
    currency: 'EUR',
    observationDate: '2026-01-12T10:00:00Z',
    source: makeSource(),
    isPriceCapPlafonne: false,
    territory: 'GP',
  },
  {
    id: 'fp4',
    station: makeStation('s4', 'Fort-de-France', 'Total'),
    fuelType: 'SP95',
    pricePerLiter: 1.68,
    currency: 'EUR',
    observationDate: '2026-01-10T10:00:00Z',
    source: makeSource(),
    isPriceCapPlafonne: false,
    territory: 'MQ',
  },
];

describe('compareFuelPricesByTerritory', () => {
  it('returns null for empty inputs', () => {
    expect(compareFuelPricesByTerritory('GP', 'SP95', [])).toBeNull();
  });

  it('returns null when no prices match territory and fuel type', () => {
    expect(compareFuelPricesByTerritory('RE', 'SP95', mockPrices)).toBeNull();
  });

  it('returns null for missing parameters', () => {
    // @ts-expect-error - testing null territory
    expect(compareFuelPricesByTerritory(null, 'SP95', mockPrices)).toBeNull();
  });

  it('returns valid comparison for GP SP95', () => {
    const result = compareFuelPricesByTerritory('GP', 'SP95', mockPrices);
    expect(result).not.toBeNull();
    expect(result!.territory).toBe('GP');
    expect(result!.fuelType).toBe('SP95');
    expect(result!.rankedPrices).toHaveLength(3);
  });

  it('ranks from cheapest to most expensive', () => {
    const result = compareFuelPricesByTerritory('GP', 'SP95', mockPrices);
    const prices = result!.rankedPrices.map((r) => r.fuelPrice.pricePerLiter);
    expect(prices[0]).toBeLessThanOrEqual(prices[1]);
    expect(prices[1]).toBeLessThanOrEqual(prices[2]);
  });

  it('marks cheapest station correctly', () => {
    const result = compareFuelPricesByTerritory('GP', 'SP95', mockPrices);
    expect(result!.rankedPrices[0].rank).toBe(1);
    expect(result!.rankedPrices[0].priceCategory).toBe('cheapest');
    expect(result!.rankedPrices[0].fuelPrice.pricePerLiter).toBe(1.65);
  });

  it('filters correctly by territory (MQ has only 1 price)', () => {
    const result = compareFuelPricesByTerritory('MQ', 'SP95', mockPrices);
    expect(result).not.toBeNull();
    expect(result!.rankedPrices).toHaveLength(1);
  });

  it('includes aggregation statistics', () => {
    const result = compareFuelPricesByTerritory('GP', 'SP95', mockPrices);
    expect(result!.aggregation.minPrice).toBe(1.65);
    expect(result!.aggregation.maxPrice).toBe(1.75);
  });
});

describe('calculateFuelAggregation', () => {
  it('calculates correct min and max', () => {
    const gpPrices = mockPrices.filter((p) => p.territory === 'GP');
    const agg = calculateFuelAggregation(gpPrices);
    expect(agg.minPrice).toBe(1.65);
    expect(agg.maxPrice).toBe(1.75);
  });

  it('calculates correct average', () => {
    const gpPrices = mockPrices.filter((p) => p.territory === 'GP');
    const agg = calculateFuelAggregation(gpPrices);
    // (1.65 + 1.70 + 1.75) / 3 ≈ 1.700
    expect(agg.averagePrice).toBeCloseTo(1.7, 2);
  });

  it('calculates correct price range', () => {
    const gpPrices = mockPrices.filter((p) => p.territory === 'GP');
    const agg = calculateFuelAggregation(gpPrices);
    expect(agg.priceRange).toBeCloseTo(0.1, 3);
  });

  it('detects official price cap', () => {
    const gpPrices = mockPrices.filter((p) => p.territory === 'GP');
    const agg = calculateFuelAggregation(gpPrices);
    // fp2 has isPriceCapPlafonne = true, price = 1.70
    expect(agg.priceCapOfficiel).toBe(1.7);
  });

  it('handles single price', () => {
    const agg = calculateFuelAggregation([mockPrices[0]]);
    expect(agg.minPrice).toBe(1.65);
    expect(agg.maxPrice).toBe(1.65);
    expect(agg.priceRange).toBe(0);
  });
});

describe('filterFuelPrices', () => {
  it('filters by territory', () => {
    const filtered = filterFuelPrices(mockPrices, { territory: 'MQ' });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].territory).toBe('MQ');
  });

  it('filters by fuelType', () => {
    const extra = {
      ...mockPrices[0],
      id: 'fp5',
      fuelType: 'DIESEL' as const,
    };
    const filtered = filterFuelPrices([...mockPrices, extra], { fuelType: 'DIESEL' });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].fuelType).toBe('DIESEL');
  });

  it('filters by maxPrice', () => {
    const filtered = filterFuelPrices(mockPrices, { maxPrice: 1.67 });
    expect(filtered.every((p) => p.pricePerLiter <= 1.67)).toBe(true);
  });

  it('filters by onlyPriceCap', () => {
    const filtered = filterFuelPrices(mockPrices, { onlyPriceCap: true });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].isPriceCapPlafonne).toBe(true);
  });

  it('filters by brand', () => {
    const filtered = filterFuelPrices(mockPrices, { brand: 'Total' });
    expect(filtered).toHaveLength(2);
    expect(filtered.every((p) => p.station.brand === 'Total')).toBe(true);
  });

  it('filters by city', () => {
    const filtered = filterFuelPrices(mockPrices, { city: 'Pointe-à-Pitre' });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].station.city).toBe('Pointe-à-Pitre');
  });

  it('combines multiple filters', () => {
    const filtered = filterFuelPrices(mockPrices, { territory: 'GP', maxPrice: 1.7 });
    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.every((p) => p.territory === 'GP' && p.pricePerLiter <= 1.7)).toBe(true);
  });
});
