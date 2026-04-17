/**
 * Unit Tests for Flight Comparison Service
 */

import { describe, it, expect } from 'vitest';
import {
  compareFlightPricesByRoute,
  filterFlightPrices,
  rankFlightPrices,
  getCheapestFlight,
  getMostExpensiveFlight,
  calculateFlightRouteAggregation,
} from '../flightComparisonService';
import type { FlightPricePoint, FlightRoute, Airport } from '../../types/flightComparison';

const PTP: Airport = {
  code: 'PTP',
  name: 'Pointe-à-Pitre',
  city: 'Pointe-à-Pitre',
  territory: 'GP',
  region: 'DOM',
};
const ORY: Airport = {
  code: 'ORY',
  name: 'Paris Orly',
  city: 'Paris',
  territory: 'GP',
  region: 'Métropole',
};

const mockRoute: FlightRoute = {
  origin: PTP,
  destination: ORY,
  routeType: 'dom_metropole',
};

const makeFlightPrice = (
  id: string,
  airline: string,
  price: number,
  priceType: FlightPricePoint['priceType'] = 'economy',
  verified = true
): FlightPricePoint => ({
  id,
  airline,
  airlineCode: airline.substring(0, 2).toUpperCase(),
  route: mockRoute,
  price,
  currency: 'EUR',
  priceType,
  fareConditions: {
    refundable: false,
    changeable: false,
    baggageIncluded: true,
    seatSelection: false,
  },
  timing: {
    purchaseDate: '2026-01-10T10:00:00Z',
    travelDate: '2026-02-15T10:00:00Z',
    daysBeforeDeparture: 36,
    season: 'low',
    isHoliday: false,
  },
  source: {
    type: 'user_report',
    observedAt: '2026-01-10T10:00:00Z',
    verificationMethod: 'manual',
    reliability: 'high',
  },
  volume: 5,
  confidence: 'high',
  verified,
  stops: 0,
  duration: '8h30',
});

const mockPrices: FlightPricePoint[] = [
  makeFlightPrice('f1', 'Air Caraïbes', 350),
  makeFlightPrice('f2', 'Air France', 450),
  makeFlightPrice('f3', 'Corsair', 400),
];

describe('compareFlightPricesByRoute', () => {
  it('returns null for empty prices', () => {
    expect(compareFlightPricesByRoute(mockRoute, [])).toBeNull();
  });

  it('returns null when no prices match the route', () => {
    const otherRoute: FlightRoute = {
      origin: { ...PTP, code: 'FDF' },
      destination: ORY,
      routeType: 'dom_metropole',
    };
    expect(compareFlightPricesByRoute(otherRoute, mockPrices)).toBeNull();
  });

  it('returns valid comparison result', () => {
    const result = compareFlightPricesByRoute(mockRoute, mockPrices);
    expect(result).not.toBeNull();
    expect(result!.airlines).toHaveLength(3);
    expect(result!.aggregation).toBeDefined();
    expect(result!.metadata).toBeDefined();
  });

  it('ranks airlines from cheapest to most expensive', () => {
    const result = compareFlightPricesByRoute(mockRoute, mockPrices);
    const prices = result!.airlines.map((r) => r.flightPrice.price);
    expect(prices[0]).toBeLessThanOrEqual(prices[1]);
    expect(prices[1]).toBeLessThanOrEqual(prices[2]);
  });

  it('marks cheapest airline correctly', () => {
    const result = compareFlightPricesByRoute(mockRoute, mockPrices);
    expect(result!.airlines[0].rank).toBe(1);
    expect(result!.airlines[0].priceCategory).toBe('cheapest');
    expect(result!.airlines[0].flightPrice.airline).toBe('Air Caraïbes');
  });

  it('marks most expensive airline correctly', () => {
    const result = compareFlightPricesByRoute(mockRoute, mockPrices);
    const lastAirline = result!.airlines[result!.airlines.length - 1];
    expect(lastAirline.priceCategory).toBe('most_expensive');
    expect(lastAirline.flightPrice.price).toBe(450);
  });
});

describe('calculateFlightRouteAggregation', () => {
  it('calculates correct statistics', () => {
    const agg = calculateFlightRouteAggregation(mockPrices, mockRoute);
    expect(agg.minPrice).toBe(350);
    expect(agg.maxPrice).toBe(450);
    // (350 + 400 + 450) / 3 ≈ 400
    expect(agg.averagePrice).toBeCloseTo(400, 0);
    expect(agg.airlineCount).toBe(3);
  });

  it('calculates correct price range', () => {
    const agg = calculateFlightRouteAggregation(mockPrices, mockRoute);
    expect(agg.priceRange).toBe(100);
  });
});

describe('rankFlightPrices', () => {
  it('returns empty array for empty input', () => {
    expect(rankFlightPrices([], 400)).toHaveLength(0);
  });

  it('sorts by price ascending', () => {
    const ranked = rankFlightPrices(mockPrices, 400);
    expect(ranked[0].flightPrice.price).toBe(350);
    expect(ranked[2].flightPrice.price).toBe(450);
  });

  it('assigns rank 1 to cheapest', () => {
    const ranked = rankFlightPrices(mockPrices, 400);
    expect(ranked[0].rank).toBe(1);
    expect(ranked[0].absoluteDifferenceFromCheapest).toBe(0);
    expect(ranked[0].percentageDifferenceFromCheapest).toBe(0);
  });

  it('calculates correct differences from cheapest', () => {
    const ranked = rankFlightPrices(mockPrices, 400);
    // Corsair (400): 400 - 350 = 50, (50/350)*100 ≈ 14.29%
    expect(ranked[1].absoluteDifferenceFromCheapest).toBeCloseTo(50, 2);
    expect(ranked[1].percentageDifferenceFromCheapest).toBeCloseTo(14.29, 1);
  });
});

describe('filterFlightPrices', () => {
  it('returns all prices for empty filter', () => {
    expect(filterFlightPrices(mockPrices, {})).toHaveLength(3);
  });

  it('filters by routeType', () => {
    const otherPrice = {
      ...mockPrices[0],
      id: 'f_inter',
      route: { ...mockRoute, routeType: 'inter_dom' as const },
    };
    const all = [...mockPrices, otherPrice];
    const filtered = filterFlightPrices(all, { routeType: 'inter_dom' });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].route.routeType).toBe('inter_dom');
  });

  it('filters by airline name (case-insensitive)', () => {
    const filtered = filterFlightPrices(mockPrices, { airline: 'air france' });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].airline).toBe('Air France');
  });

  it('filters by priceType', () => {
    const businessPrice = makeFlightPrice('f4', 'Air France', 1200, 'business');
    const all = [...mockPrices, businessPrice];
    const filtered = filterFlightPrices(all, { priceType: 'business' });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].priceType).toBe('business');
  });

  it('filters by directOnly', () => {
    const stopFlight = {
      ...mockPrices[0],
      id: 'f_stop',
      stops: 1,
    };
    const all = [...mockPrices, stopFlight];
    const filtered = filterFlightPrices(all, { directOnly: true });
    expect(filtered).toHaveLength(3); // mockPrices all have stops: 0
    expect(filtered.every((p) => p.stops === 0)).toBe(true);
  });

  it('filters by season', () => {
    const highSeasonFlight = {
      ...mockPrices[0],
      id: 'f_high',
      timing: { ...mockPrices[0].timing, season: 'high' as const },
    };
    const all = [...mockPrices, highSeasonFlight];
    const filtered = filterFlightPrices(all, { season: 'high' });
    expect(filtered).toHaveLength(1);
  });

  it('filters by verifiedOnly', () => {
    const unverified = makeFlightPrice('f5', 'Corsair', 380, 'economy', false);
    const all = [...mockPrices, unverified];
    const filtered = filterFlightPrices(all, { verifiedOnly: true });
    expect(filtered.every((p) => p.verified)).toBe(true);
  });

  it('filters by daysBeforeDeparture', () => {
    const lastMinute = {
      ...mockPrices[0],
      id: 'f_last',
      timing: { ...mockPrices[0].timing, daysBeforeDeparture: 3 },
    };
    const all = [...mockPrices, lastMinute];
    const filtered = filterFlightPrices(all, { daysBeforeDeparture: { max: 7 } });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].timing.daysBeforeDeparture).toBe(3);
  });
});

describe('getCheapestFlight', () => {
  it('returns null for empty array', () => {
    expect(getCheapestFlight([])).toBeNull();
  });

  it('returns cheapest flight', () => {
    const cheapest = getCheapestFlight(mockPrices);
    expect(cheapest!.price).toBe(350);
    expect(cheapest!.airline).toBe('Air Caraïbes');
  });
});

describe('getMostExpensiveFlight', () => {
  it('returns null for empty array', () => {
    expect(getMostExpensiveFlight([])).toBeNull();
  });

  it('returns most expensive flight', () => {
    const expensive = getMostExpensiveFlight(mockPrices);
    expect(expensive!.price).toBe(450);
    expect(expensive!.airline).toBe('Air France');
  });
});
