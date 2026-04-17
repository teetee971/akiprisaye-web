/**
 * Unit Tests for Transport Price Service v2.2.0
 */

import { describe, it, expect } from 'vitest';
import {
  compareTransportPricesByRoute,
  calculateRouteAggregation,
  rankTransportPrices,
  generateTransportMetadata,
  calculatePercentageDifference,
  filterPricesByRoute,
  filterPricesByTerritory,
  filterPricesByMode,
  applyTransportFilters,
  getCheapestOperator,
  getMostExpensiveOperator,
  calculatePotentialSavings,
  groupPricesByMode,
  groupPricesByTerritory,
  hasPricesForRoute,
  getUniqueRoutes,
} from '../transportPriceService';
import type {
  TransportPricePoint,
  TransportRouteIdentifier,
} from '../../types/transportComparison';

// Mock data for testing
const mockRoute: TransportRouteIdentifier = {
  origin: 'FDF',
  destination: 'ORY',
  originTerritory: 'MQ',
  destinationTerritory: 'FR',
  mode: 'plane',
  routeName: 'Fort-de-France → Paris Orly',
};

const mockOperatorPrices: TransportPricePoint[] = [
  {
    operatorId: 'AF',
    operatorName: 'Air France',
    route: mockRoute,
    price: 450.0,
    currency: 'EUR',
    priceType: 'base',
    observationDate: '2025-12-20T10:00:00Z',
    source: {
      type: 'official_site',
      url: 'https://www.airfrance.fr',
      observedAt: '2025-12-20T10:00:00Z',
      verificationMethod: 'automated',
      reliability: 'high',
    },
    volume: 25,
    confidence: 'high',
    verified: true,
  },
  {
    operatorId: 'AC',
    operatorName: 'Air Caraïbes',
    route: mockRoute,
    price: 389.0,
    currency: 'EUR',
    priceType: 'base',
    observationDate: '2025-12-21T14:30:00Z',
    source: {
      type: 'official_site',
      url: 'https://www.aircaraibes.com',
      observedAt: '2025-12-21T14:30:00Z',
      verificationMethod: 'automated',
      reliability: 'high',
    },
    volume: 30,
    confidence: 'high',
    verified: true,
  },
  {
    operatorId: 'TO',
    operatorName: 'French Bee',
    route: mockRoute,
    price: 425.5,
    currency: 'EUR',
    priceType: 'promotional',
    observationDate: '2025-12-22T09:15:00Z',
    source: {
      type: 'user_report',
      observedAt: '2025-12-22T09:15:00Z',
      verificationMethod: 'manual',
      reliability: 'medium',
    },
    volume: 15,
    confidence: 'medium',
    verified: false,
  },
];

const mockBoatRoute: TransportRouteIdentifier = {
  origin: 'FDF',
  destination: 'PTP',
  originTerritory: 'MQ',
  destinationTerritory: 'GP',
  mode: 'boat',
  routeName: 'Fort-de-France → Pointe-à-Pitre',
};

const mockBoatPrices: TransportPricePoint[] = [
  {
    operatorId: 'EXPRESS',
    operatorName: "L'Express des Îles",
    route: mockBoatRoute,
    price: 85.0,
    currency: 'EUR',
    priceType: 'base',
    observationDate: '2025-12-20T10:00:00Z',
    source: {
      type: 'official_site',
      url: 'https://www.express-des-iles.com',
      observedAt: '2025-12-20T10:00:00Z',
      verificationMethod: 'automated',
      reliability: 'high',
    },
    volume: 50,
    confidence: 'high',
    verified: true,
  },
];

const mockInterIslandRoute: TransportRouteIdentifier = {
  origin: 'PTP',
  destination: 'LSS',
  originTerritory: 'GP',
  destinationTerritory: 'GP',
  mode: 'inter_island',
  routeName: 'Pointe-à-Pitre → Les Saintes',
};

const mockInterIslandPrices: TransportPricePoint[] = [
  {
    operatorId: 'CTM',
    operatorName: 'CTM Deher',
    route: mockInterIslandRoute,
    price: 35.0,
    currency: 'EUR',
    priceType: 'base',
    observationDate: '2025-12-20T10:00:00Z',
    source: {
      type: 'official_site',
      observedAt: '2025-12-20T10:00:00Z',
      verificationMethod: 'automated',
      reliability: 'high',
    },
    volume: 100,
    confidence: 'high',
    verified: true,
  },
  {
    operatorId: 'VAL',
    operatorName: "Val'Ferry",
    route: mockInterIslandRoute,
    price: 38.5,
    currency: 'EUR',
    priceType: 'base',
    observationDate: '2025-12-20T11:00:00Z',
    source: {
      type: 'official_site',
      observedAt: '2025-12-20T11:00:00Z',
      verificationMethod: 'automated',
      reliability: 'high',
    },
    volume: 80,
    confidence: 'high',
    verified: true,
  },
];

describe('Transport Price Service v2.2.0', () => {
  describe('compareTransportPricesByRoute', () => {
    it('should return null for empty operator prices', () => {
      const result = compareTransportPricesByRoute(mockRoute, []);
      expect(result).toBeNull();
    });

    it('should return null for null route', () => {
      const result = compareTransportPricesByRoute(null as any, mockOperatorPrices);
      expect(result).toBeNull();
    });

    it('should return null when no prices match route', () => {
      const differentRoute: TransportRouteIdentifier = {
        ...mockRoute,
        destination: 'CDG',
      };
      const result = compareTransportPricesByRoute(differentRoute, mockOperatorPrices);
      expect(result).toBeNull();
    });

    it('should successfully compare prices for a route', () => {
      const result = compareTransportPricesByRoute(mockRoute, mockOperatorPrices);

      expect(result).not.toBeNull();
      expect(result!.route).toEqual(mockRoute);
      expect(result!.operatorPrices).toHaveLength(3);
      expect(result!.operatorPrices[0].rank).toBe(1);
      expect(result!.operatorPrices[0].transportPrice.operatorName).toBe('Air Caraïbes');
      expect(result!.aggregation.operatorCount).toBe(3);
    });

    it('should rank operators from cheapest to most expensive', () => {
      const result = compareTransportPricesByRoute(mockRoute, mockOperatorPrices);

      expect(result!.operatorPrices[0].transportPrice.price).toBe(389.0); // Air Caraïbes
      expect(result!.operatorPrices[1].transportPrice.price).toBe(425.5); // French Bee
      expect(result!.operatorPrices[2].transportPrice.price).toBe(450.0); // Air France
    });
  });

  describe('filterPricesByRoute', () => {
    it('should filter prices by route', () => {
      const allPrices = [...mockOperatorPrices, ...mockBoatPrices];
      const filtered = filterPricesByRoute(allPrices, mockRoute);

      expect(filtered).toHaveLength(3);
      expect(filtered.every((p) => p.route.mode === 'plane')).toBe(true);
    });

    it('should return empty array when no matches', () => {
      const differentRoute: TransportRouteIdentifier = {
        origin: 'PTP',
        destination: 'FDF',
        originTerritory: 'GP',
        destinationTerritory: 'MQ',
        mode: 'boat',
      };
      const filtered = filterPricesByRoute(mockOperatorPrices, differentRoute);

      expect(filtered).toHaveLength(0);
    });
  });

  describe('filterPricesByTerritory', () => {
    it('should filter by origin territory', () => {
      const allPrices = [...mockOperatorPrices, ...mockBoatPrices];
      const filtered = filterPricesByTerritory(allPrices, 'MQ', undefined);

      expect(filtered).toHaveLength(4);
      expect(filtered.every((p) => p.route.originTerritory === 'MQ')).toBe(true);
    });

    it('should filter by destination territory', () => {
      const allPrices = [...mockOperatorPrices, ...mockBoatPrices];
      const filtered = filterPricesByTerritory(allPrices, undefined, 'GP');

      expect(filtered).toHaveLength(1);
      expect(filtered[0].route.destinationTerritory).toBe('GP');
    });

    it('should filter by both territories', () => {
      const allPrices = [...mockOperatorPrices, ...mockBoatPrices];
      const filtered = filterPricesByTerritory(allPrices, 'MQ', 'GP');

      expect(filtered).toHaveLength(1);
      expect(filtered[0].route.mode).toBe('boat');
    });
  });

  describe('filterPricesByMode', () => {
    it('should filter by plane mode', () => {
      const allPrices = [...mockOperatorPrices, ...mockBoatPrices, ...mockInterIslandPrices];
      const filtered = filterPricesByMode(allPrices, 'plane');

      expect(filtered).toHaveLength(3);
      expect(filtered.every((p) => p.route.mode === 'plane')).toBe(true);
    });

    it('should filter by boat mode', () => {
      const allPrices = [...mockOperatorPrices, ...mockBoatPrices, ...mockInterIslandPrices];
      const filtered = filterPricesByMode(allPrices, 'boat');

      expect(filtered).toHaveLength(1);
      expect(filtered[0].operatorName).toBe("L'Express des Îles");
    });

    it('should filter by inter_island mode', () => {
      const allPrices = [...mockOperatorPrices, ...mockBoatPrices, ...mockInterIslandPrices];
      const filtered = filterPricesByMode(allPrices, 'inter_island');

      expect(filtered).toHaveLength(2);
      expect(filtered.every((p) => p.route.mode === 'inter_island')).toBe(true);
    });
  });

  describe('applyTransportFilters', () => {
    const allPrices = [...mockOperatorPrices, ...mockBoatPrices, ...mockInterIslandPrices];

    it('should apply mode filter', () => {
      const filtered = applyTransportFilters(allPrices, { mode: 'boat' });
      expect(filtered).toHaveLength(1);
    });

    it('should apply operator name filter', () => {
      const filtered = applyTransportFilters(allPrices, { operatorName: 'Air' });
      expect(filtered).toHaveLength(2); // Air France, Air Caraïbes
    });

    it('should apply verified only filter', () => {
      const filtered = applyTransportFilters(allPrices, { verifiedOnly: true });
      expect(filtered.every((p) => p.verified)).toBe(true);
      expect(filtered.length).toBeLessThan(allPrices.length);
    });

    it('should apply confidence level filter', () => {
      const filtered = applyTransportFilters(allPrices, { minConfidence: 'high' });
      expect(filtered.every((p) => p.confidence === 'high')).toBe(true);
    });

    it('should apply multiple filters', () => {
      const filtered = applyTransportFilters(allPrices, {
        mode: 'plane',
        verifiedOnly: true,
        minConfidence: 'high',
      });
      expect(filtered).toHaveLength(2); // Air France, Air Caraïbes
      expect(filtered.every((p) => p.verified && p.confidence === 'high')).toBe(true);
    });
  });

  describe('calculateRouteAggregation', () => {
    it('should calculate aggregation correctly', () => {
      const aggregation = calculateRouteAggregation(mockOperatorPrices, mockRoute);

      expect(aggregation.operatorCount).toBe(3);
      expect(aggregation.minPrice).toBe(389.0);
      expect(aggregation.maxPrice).toBe(450.0);
      expect(aggregation.priceRange).toBe(61.0);
      expect(aggregation.averagePrice).toBeCloseTo(421.5, 2);
    });

    it('should throw error for empty price list', () => {
      expect(() => calculateRouteAggregation([], mockRoute)).toThrow();
    });

    it('should handle single operator', () => {
      const singlePrice = [mockOperatorPrices[0]];
      const aggregation = calculateRouteAggregation(singlePrice, mockRoute);

      expect(aggregation.operatorCount).toBe(1);
      expect(aggregation.minPrice).toBe(aggregation.maxPrice);
      expect(aggregation.priceRange).toBe(0);
    });
  });

  describe('rankTransportPrices', () => {
    it('should rank prices correctly', () => {
      const averagePrice = 421.5;
      const ranked = rankTransportPrices(mockOperatorPrices, averagePrice);

      expect(ranked).toHaveLength(3);
      expect(ranked[0].rank).toBe(1);
      expect(ranked[0].priceCategory).toBe('cheapest');
      expect(ranked[2].rank).toBe(3);
      expect(ranked[2].priceCategory).toBe('most_expensive');
    });

    it('should calculate differences from cheapest', () => {
      const averagePrice = 421.5;
      const ranked = rankTransportPrices(mockOperatorPrices, averagePrice);

      expect(ranked[0].absoluteDifferenceFromCheapest).toBe(0);
      expect(ranked[0].percentageDifferenceFromCheapest).toBe(0);
      expect(ranked[1].absoluteDifferenceFromCheapest).toBeCloseTo(36.5, 2);
      expect(ranked[2].absoluteDifferenceFromCheapest).toBeCloseTo(61.0, 2);
    });

    it('should return empty array for empty input', () => {
      const ranked = rankTransportPrices([], 0);
      expect(ranked).toHaveLength(0);
    });
  });

  describe('generateTransportMetadata', () => {
    it('should generate metadata with correct structure', () => {
      const metadata = generateTransportMetadata(mockOperatorPrices);

      expect(metadata.methodology).toBe('v2.2.0');
      expect(metadata.aggregationMethod).toBe('mean');
      expect(metadata.dataQuality.totalOperators).toBe(3);
      expect(metadata.sources).toHaveLength(2); // official_site, user_report
      expect(metadata.limitations).toBeDefined();
      expect(metadata.limitations.length).toBeGreaterThan(0);
    });

    it('should calculate source summary correctly', () => {
      const metadata = generateTransportMetadata(mockOperatorPrices);

      const officialSource = metadata.sources.find((s) => s.source === 'official_site');
      expect(officialSource).toBeDefined();
      expect(officialSource!.observationCount).toBe(2);
      expect(officialSource!.operatorCount).toBe(2);
    });
  });

  describe('calculatePercentageDifference', () => {
    it('should calculate percentage difference correctly', () => {
      const diff = calculatePercentageDifference(450, 389);
      expect(diff).toBeCloseTo(15.68, 2);
    });

    it('should return 0 when base price is 0', () => {
      const diff = calculatePercentageDifference(100, 0);
      expect(diff).toBe(0);
    });

    it('should handle negative differences', () => {
      const diff = calculatePercentageDifference(389, 450);
      expect(diff).toBeLessThan(0);
    });
  });

  describe('getCheapestOperator', () => {
    it('should return cheapest operator', () => {
      const cheapest = getCheapestOperator(mockOperatorPrices);
      expect(cheapest).not.toBeNull();
      expect(cheapest!.operatorName).toBe('Air Caraïbes');
      expect(cheapest!.price).toBe(389.0);
    });

    it('should return null for empty array', () => {
      const cheapest = getCheapestOperator([]);
      expect(cheapest).toBeNull();
    });
  });

  describe('getMostExpensiveOperator', () => {
    it('should return most expensive operator', () => {
      const expensive = getMostExpensiveOperator(mockOperatorPrices);
      expect(expensive).not.toBeNull();
      expect(expensive!.operatorName).toBe('Air France');
      expect(expensive!.price).toBe(450.0);
    });

    it('should return null for empty array', () => {
      const expensive = getMostExpensiveOperator([]);
      expect(expensive).toBeNull();
    });
  });

  describe('calculatePotentialSavings', () => {
    it('should calculate savings correctly', () => {
      const savings = calculatePotentialSavings(450, 389);
      expect(savings.absolute).toBe(61.0);
      expect(savings.percentage).toBeCloseTo(15.68, 2);
    });

    it('should return zero savings when current is cheaper', () => {
      const savings = calculatePotentialSavings(350, 389);
      expect(savings.absolute).toBe(0);
      expect(savings.percentage).toBe(0);
    });
  });

  describe('groupPricesByMode', () => {
    it('should group prices by transport mode', () => {
      const allPrices = [...mockOperatorPrices, ...mockBoatPrices, ...mockInterIslandPrices];
      const grouped = groupPricesByMode(allPrices);

      expect(grouped.size).toBe(3);
      expect(grouped.get('plane')).toHaveLength(3);
      expect(grouped.get('boat')).toHaveLength(1);
      expect(grouped.get('inter_island')).toHaveLength(2);
    });
  });

  describe('groupPricesByTerritory', () => {
    it('should group prices by territory', () => {
      const allPrices = [...mockOperatorPrices, ...mockBoatPrices];
      const grouped = groupPricesByTerritory(allPrices);

      expect(grouped.has('MQ')).toBe(true);
      expect(grouped.has('FR')).toBe(true);
      expect(grouped.has('GP')).toBe(true);
    });

    it('should handle single territory routes', () => {
      const grouped = groupPricesByTerritory(mockInterIslandPrices);

      expect(grouped.has('GP')).toBe(true);
      expect(grouped.get('GP')).toHaveLength(2);
    });
  });

  describe('hasPricesForRoute', () => {
    it('should return true when prices exist for route', () => {
      const allPrices = [...mockOperatorPrices, ...mockBoatPrices];
      const result = hasPricesForRoute(allPrices, mockRoute);
      expect(result).toBe(true);
    });

    it('should return false when no prices exist for route', () => {
      const differentRoute: TransportRouteIdentifier = {
        origin: 'CDG',
        destination: 'FDF',
        originTerritory: 'FR',
        destinationTerritory: 'MQ',
        mode: 'plane',
      };
      const result = hasPricesForRoute(mockOperatorPrices, differentRoute);
      expect(result).toBe(false);
    });
  });

  describe('getUniqueRoutes', () => {
    it('should return unique routes', () => {
      const allPrices = [...mockOperatorPrices, ...mockBoatPrices, ...mockInterIslandPrices];
      const routes = getUniqueRoutes(allPrices);

      expect(routes).toHaveLength(3);
      expect(routes.some((r) => r.mode === 'plane')).toBe(true);
      expect(routes.some((r) => r.mode === 'boat')).toBe(true);
      expect(routes.some((r) => r.mode === 'inter_island')).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle single operator scenario', () => {
      const singlePrice = [mockOperatorPrices[0]];
      const result = compareTransportPricesByRoute(mockRoute, singlePrice);

      expect(result).not.toBeNull();
      expect(result!.operatorPrices).toHaveLength(1);
      expect(result!.operatorPrices[0].rank).toBe(1);
      expect(result!.operatorPrices[0].priceCategory).toBe('cheapest');
      expect(result!.aggregation.priceRange).toBe(0);
    });

    it('should handle missing data gracefully', () => {
      const incompletePrice: TransportPricePoint = {
        ...mockOperatorPrices[0],
        additionalFees: undefined,
        conditions: undefined,
      };
      const result = compareTransportPricesByRoute(mockRoute, [incompletePrice]);

      expect(result).not.toBeNull();
      expect(result!.operatorPrices).toHaveLength(1);
    });

    it('should handle identical prices', () => {
      const identicalPrices: TransportPricePoint[] = [
        { ...mockOperatorPrices[0], operatorId: 'OP1', price: 400 },
        { ...mockOperatorPrices[0], operatorId: 'OP2', price: 400 },
        { ...mockOperatorPrices[0], operatorId: 'OP3', price: 400 },
      ];
      const result = compareTransportPricesByRoute(mockRoute, identicalPrices);

      expect(result).not.toBeNull();
      expect(result!.aggregation.priceRange).toBe(0);
      expect(result!.aggregation.averagePrice).toBe(400);
      expect(result!.operatorPrices[0].priceCategory).toBe('cheapest');
      expect(result!.operatorPrices[2].priceCategory).toBe('most_expensive');
      expect(result!.operatorPrices.every((p) => p.absoluteDifferenceFromCheapest === 0)).toBe(
        true
      );
    });

    it('should handle very large price differences', () => {
      const extremePrices: TransportPricePoint[] = [
        { ...mockOperatorPrices[0], price: 100 },
        { ...mockOperatorPrices[1], price: 1000 },
      ];
      const result = compareTransportPricesByRoute(mockRoute, extremePrices);

      expect(result).not.toBeNull();
      expect(result!.aggregation.priceRangePercentage).toBe(900);
      expect(result!.operatorPrices[1].percentageDifferenceFromCheapest).toBe(900);
    });
  });
});
