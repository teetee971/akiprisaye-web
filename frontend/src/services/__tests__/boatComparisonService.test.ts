/**
 * Unit Tests for Boat Comparison Service
 */

import { describe, it, expect } from 'vitest';
import {
  compareBoatPricesByRoute,
  filterBoatPrices,
  getCheapestBoat,
  getMostExpensiveBoat,
} from '../boatComparisonService';
import type { BoatPricePoint, BoatRoute, Port } from '../../types/boatComparison';

const POINTE_A_PITRE: Port = {
  code: 'PPT',
  name: 'Port de Pointe-à-Pitre',
  city: 'Pointe-à-Pitre',
  territory: 'GP',
};
const MARIE_GALANTE: Port = {
  code: 'MGT',
  name: 'Port de Marie-Galante',
  city: 'Grand-Bourg',
  territory: 'GP',
};

const mockRoute: BoatRoute = {
  origin: POINTE_A_PITRE,
  destination: MARIE_GALANTE,
  routeType: 'inter_island',
  islandGroup: 'Antilles',
};

const makeBoatPrice = (
  id: string,
  operator: string,
  passengerPrice: number,
  serviceClass: BoatPricePoint['serviceClass'] = 'standard',
  verified = true
): BoatPricePoint => ({
  id,
  operator,
  operatorCode: operator.substring(0, 3).toUpperCase(),
  route: mockRoute,
  pricing: {
    passengerPrice,
  },
  currency: 'EUR',
  serviceClass,
  fareConditions: {
    refundable: false,
    changeable: false,
    mealsIncluded: false,
    deckAccess: true,
    cabinAvailable: false,
  },
  observationDate: '2026-01-10T10:00:00Z',
  source: {
    type: 'user_report',
    observedAt: '2026-01-10T10:00:00Z',
    verificationMethod: 'manual',
    reliability: 'high',
  },
  volume: 10,
  confidence: 'high',
  verified,
  schedule: {
    frequency: 'daily',
    duration: '1h15',
  },
});

const mockPrices: BoatPricePoint[] = [
  makeBoatPrice('b1', 'CTM', 15),
  makeBoatPrice('b2', 'Jeans for Freedom', 18),
  makeBoatPrice('b3', 'Archipel Caraïbes', 20),
];

describe('compareBoatPricesByRoute', () => {
  it('returns null for empty prices', () => {
    expect(compareBoatPricesByRoute(mockRoute, [])).toBeNull();
  });

  it('returns null when no prices match the route', () => {
    const otherRoute: BoatRoute = {
      origin: { ...POINTE_A_PITRE, code: 'FDF' },
      destination: MARIE_GALANTE,
      routeType: 'inter_island',
    };
    expect(compareBoatPricesByRoute(otherRoute, mockPrices)).toBeNull();
  });

  it('returns valid comparison result', () => {
    const result = compareBoatPricesByRoute(mockRoute, mockPrices);
    expect(result).not.toBeNull();
    expect(result!.operators).toHaveLength(3);
    expect(result!.aggregation).toBeDefined();
    expect(result!.metadata).toBeDefined();
  });

  it('ranks operators from cheapest to most expensive', () => {
    const result = compareBoatPricesByRoute(mockRoute, mockPrices);
    const prices = result!.operators.map((r) => r.boatPrice.pricing.passengerPrice);
    expect(prices[0]).toBeLessThanOrEqual(prices[1]);
    expect(prices[1]).toBeLessThanOrEqual(prices[2]);
  });

  it('marks cheapest operator correctly', () => {
    const result = compareBoatPricesByRoute(mockRoute, mockPrices);
    expect(result!.operators[0].rank).toBe(1);
    expect(result!.operators[0].priceCategory).toBe('cheapest');
    expect(result!.operators[0].boatPrice.operator).toBe('CTM');
  });

  it('marks most expensive operator correctly', () => {
    const result = compareBoatPricesByRoute(mockRoute, mockPrices);
    const lastOp = result!.operators[result!.operators.length - 1];
    expect(lastOp.priceCategory).toBe('most_expensive');
    expect(lastOp.boatPrice.pricing.passengerPrice).toBe(20);
  });
});

describe('filterBoatPrices', () => {
  it('returns all prices for empty filter', () => {
    expect(filterBoatPrices(mockPrices, {})).toHaveLength(3);
  });

  it('filters by routeType', () => {
    const coastal = {
      ...mockPrices[0],
      id: 'b4',
      route: { ...mockRoute, routeType: 'coastal' as const },
    };
    const all = [...mockPrices, coastal];
    const filtered = filterBoatPrices(all, { routeType: 'coastal' });
    expect(filtered).toHaveLength(1);
  });

  it('filters by origin territory', () => {
    const mq = {
      ...mockPrices[0],
      id: 'b5',
      route: { ...mockRoute, origin: { ...POINTE_A_PITRE, territory: 'MQ' as const } },
    };
    const all = [...mockPrices, mq];
    const filtered = filterBoatPrices(all, { originTerritory: 'MQ' });
    expect(filtered).toHaveLength(1);
  });

  it('filters by operator name (case-insensitive)', () => {
    const filtered = filterBoatPrices(mockPrices, { operator: 'ctm' });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].operator).toBe('CTM');
  });

  it('filters by serviceClass', () => {
    const premiumBoat = makeBoatPrice('b6', 'CTM', 30, 'premium');
    const all = [...mockPrices, premiumBoat];
    const filtered = filterBoatPrices(all, { serviceClass: 'premium' });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].serviceClass).toBe('premium');
  });

  it('filters by verifiedOnly', () => {
    const unverified = makeBoatPrice('b7', 'TestOp', 25, 'standard', false);
    const all = [...mockPrices, unverified];
    const filtered = filterBoatPrices(all, { verifiedOnly: true });
    expect(filtered.every((p) => p.verified)).toBe(true);
    expect(filtered).toHaveLength(3);
  });

  it('filters by minConfidence', () => {
    const mediumConf = {
      ...mockPrices[0],
      id: 'b8',
      confidence: 'medium' as const,
    };
    const all = [...mockPrices, mediumConf];
    const filtered = filterBoatPrices(all, { minConfidence: 'high' });
    expect(filtered.every((p) => p.confidence === 'high')).toBe(true);
  });
});

describe('getCheapestBoat', () => {
  it('returns null for empty array', () => {
    expect(getCheapestBoat([])).toBeNull();
  });

  it('returns cheapest boat', () => {
    const cheapest = getCheapestBoat(mockPrices);
    expect(cheapest!.pricing.passengerPrice).toBe(15);
    expect(cheapest!.operator).toBe('CTM');
  });

  it('handles single boat', () => {
    const cheapest = getCheapestBoat([mockPrices[0]]);
    expect(cheapest!.pricing.passengerPrice).toBe(15);
  });
});

describe('getMostExpensiveBoat', () => {
  it('returns null for empty array', () => {
    expect(getMostExpensiveBoat([])).toBeNull();
  });

  it('returns most expensive boat', () => {
    const expensive = getMostExpensiveBoat(mockPrices);
    expect(expensive!.pricing.passengerPrice).toBe(20);
    expect(expensive!.operator).toBe('Archipel Caraïbes');
  });
});
