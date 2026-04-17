/**
 * Unit Tests for Land Mobility Price Service v2.3.0
 */

import { describe, it, expect } from 'vitest';
import {
  compareLandMobilityPrices,
  calculateLandMobilityAggregation,
  rankLandMobilityPrices,
  generateLandMobilityMetadata,
  applyLandMobilityFilters,
  getCheapestOption,
  getMostExpensiveOption,
  calculatePercentageDifference,
  groupPricesByCategory,
  groupPricesByTerritory,
  filterBusByOperator,
  filterFuelByType,
  filterTaxiByServiceType,
} from '../landMobilityPriceService';
import type {
  BusPricePoint,
  TaxiPricePoint,
  FuelPricePoint,
} from '../../types/landMobilityComparison';

// Mock data for testing
const mockBusPrices: BusPricePoint[] = [
  {
    category: 'BUS',
    line: {
      lineNumber: '12',
      lineName: 'Fort-de-France - Schoelcher',
      territory: 'MQ',
      operator: 'Martinique Transport',
    },
    ticketType: 'single',
    price: 1.5,
    currency: 'EUR',
    priceUnit: 'ticket',
    observationDate: '2025-12-20T10:00:00Z',
    source: {
      type: 'official_site',
      url: 'https://www.martinique-transport.fr',
      observedAt: '2025-12-20T10:00:00Z',
      verificationMethod: 'automated',
      reliability: 'high',
    },
    volume: 50,
    confidence: 'high',
    verified: true,
  },
  {
    category: 'BUS',
    line: {
      lineNumber: 'A',
      lineName: 'Centre-ville',
      territory: 'MQ',
      operator: 'Urban Bus',
    },
    ticketType: 'single',
    price: 1.3,
    currency: 'EUR',
    priceUnit: 'ticket',
    observationDate: '2025-12-21T14:30:00Z',
    source: {
      type: 'user_report',
      observedAt: '2025-12-21T14:30:00Z',
      verificationMethod: 'manual',
      reliability: 'medium',
    },
    volume: 30,
    confidence: 'medium',
    verified: false,
  },
];

const mockTaxiPrices: TaxiPricePoint[] = [
  {
    category: 'TAXI',
    zone: {
      origin: 'Aéroport Aimé Césaire',
      destination: 'Fort-de-France Centre',
      distance: 8,
      territory: 'MQ',
    },
    serviceType: 'taxi',
    operator: 'Taxi Martinique',
    price: 25.0,
    baseFare: 5.0,
    perKmRate: 2.5,
    currency: 'EUR',
    priceUnit: 'trip',
    observationDate: '2025-12-20T10:00:00Z',
    source: {
      type: 'official_site',
      observedAt: '2025-12-20T10:00:00Z',
      verificationMethod: 'automated',
      reliability: 'high',
    },
    volume: 20,
    confidence: 'high',
    verified: true,
  },
  {
    category: 'TAXI',
    zone: {
      origin: 'Aéroport Aimé Césaire',
      destination: 'Fort-de-France Centre',
      distance: 8,
      territory: 'MQ',
    },
    serviceType: 'vtc',
    operator: 'Uber Martinique',
    price: 22.0,
    baseFare: 3.0,
    perKmRate: 2.2,
    currency: 'EUR',
    priceUnit: 'trip',
    observationDate: '2025-12-21T15:00:00Z',
    source: {
      type: 'official_site',
      observedAt: '2025-12-21T15:00:00Z',
      verificationMethod: 'automated',
      reliability: 'high',
    },
    volume: 35,
    confidence: 'high',
    verified: true,
  },
];

const mockFuelPrices: FuelPricePoint[] = [
  {
    category: 'FUEL',
    station: {
      stationId: 'TOTAL_FDF_01',
      stationName: 'Total Fort-de-France',
      brand: 'Total',
      territory: 'MQ',
      location: {
        city: 'Fort-de-France',
        postalCode: '97200',
      },
    },
    fuelType: 'SP95',
    pricePerLiter: 1.85,
    price: 1.85,
    currency: 'EUR',
    priceUnit: 'liter',
    observationDate: '2025-12-22T08:00:00Z',
    source: {
      type: 'official_site',
      url: 'https://www.prix-carburants.gouv.fr',
      observedAt: '2025-12-22T08:00:00Z',
      verificationMethod: 'automated',
      reliability: 'high',
    },
    volume: 100,
    confidence: 'high',
    verified: true,
  },
  {
    category: 'FUEL',
    station: {
      stationId: 'ESSO_FDF_02',
      stationName: 'Esso Lamentin',
      brand: 'Esso',
      territory: 'MQ',
      location: {
        city: 'Lamentin',
        postalCode: '97232',
      },
    },
    fuelType: 'SP95',
    pricePerLiter: 1.79,
    price: 1.79,
    currency: 'EUR',
    priceUnit: 'liter',
    observationDate: '2025-12-22T09:00:00Z',
    source: {
      type: 'official_site',
      url: 'https://www.prix-carburants.gouv.fr',
      observedAt: '2025-12-22T09:00:00Z',
      verificationMethod: 'automated',
      reliability: 'high',
    },
    volume: 80,
    confidence: 'high',
    verified: true,
  },
  {
    category: 'FUEL',
    station: {
      stationId: 'TOTAL_FDF_01',
      stationName: 'Total Fort-de-France',
      brand: 'Total',
      territory: 'MQ',
      location: {
        city: 'Fort-de-France',
        postalCode: '97200',
      },
    },
    fuelType: 'DIESEL',
    pricePerLiter: 1.65,
    price: 1.65,
    currency: 'EUR',
    priceUnit: 'liter',
    observationDate: '2025-12-22T08:00:00Z',
    source: {
      type: 'official_site',
      url: 'https://www.prix-carburants.gouv.fr',
      observedAt: '2025-12-22T08:00:00Z',
      verificationMethod: 'automated',
      reliability: 'high',
    },
    volume: 100,
    confidence: 'high',
    verified: true,
  },
];

describe('Land Mobility Price Service v2.3.0', () => {
  describe('compareLandMobilityPrices', () => {
    it('should return null for empty prices', () => {
      const result = compareLandMobilityPrices('BUS', [], 'MQ');
      expect(result).toBeNull();
    });

    it('should return null for null category', () => {
      const result = compareLandMobilityPrices(null as any, mockBusPrices, 'MQ');
      expect(result).toBeNull();
    });

    it('should return null when no prices match territory', () => {
      const result = compareLandMobilityPrices('BUS', mockBusPrices, 'GP');
      expect(result).toBeNull();
    });

    it('should successfully compare bus prices', () => {
      const result = compareLandMobilityPrices('BUS', mockBusPrices, 'MQ');

      expect(result).not.toBeNull();
      expect(result!.category).toBe('BUS');
      expect(result!.territory).toBe('MQ');
      expect(result!.rankings).toHaveLength(2);
      expect(result!.rankings[0].rank).toBe(1);
      expect(result!.rankings[0].mobilityPrice.price).toBe(1.3);
    });

    it('should successfully compare taxi prices', () => {
      const result = compareLandMobilityPrices('TAXI', mockTaxiPrices, 'MQ');

      expect(result).not.toBeNull();
      expect(result!.category).toBe('TAXI');
      expect(result!.rankings).toHaveLength(2);
      expect(result!.rankings[0].mobilityPrice.price).toBe(22.0);
    });

    it('should successfully compare fuel prices', () => {
      const result = compareLandMobilityPrices('FUEL', mockFuelPrices, 'MQ');

      expect(result).not.toBeNull();
      expect(result!.category).toBe('FUEL');
      expect(result!.rankings).toHaveLength(3);
    });
  });

  describe('applyLandMobilityFilters', () => {
    const allPrices = [...mockBusPrices, ...mockTaxiPrices, ...mockFuelPrices];

    it('should filter by category', () => {
      const filtered = applyLandMobilityFilters(allPrices, { category: 'BUS' });
      expect(filtered).toHaveLength(2);
      expect(filtered.every((p) => p.category === 'BUS')).toBe(true);
    });

    it('should filter by territory', () => {
      const filtered = applyLandMobilityFilters(allPrices, { territory: 'MQ' });
      expect(filtered).toHaveLength(7);
    });

    it('should filter by operator', () => {
      const filtered = applyLandMobilityFilters(mockBusPrices, { operator: 'Urban' });
      expect(filtered).toHaveLength(1);
      expect((filtered[0] as BusPricePoint).line.operator).toBe('Urban Bus');
    });

    it('should filter by fuel type', () => {
      const filtered = applyLandMobilityFilters(mockFuelPrices, { fuelType: 'DIESEL' });
      expect(filtered).toHaveLength(1);
      expect((filtered[0] as FuelPricePoint).fuelType).toBe('DIESEL');
    });

    it('should filter by verified only', () => {
      const filtered = applyLandMobilityFilters(mockBusPrices, { verifiedOnly: true });
      expect(filtered.every((p) => p.verified)).toBe(true);
      expect(filtered).toHaveLength(1);
    });

    it('should apply multiple filters', () => {
      const filtered = applyLandMobilityFilters(allPrices, {
        category: 'TAXI',
        territory: 'MQ',
        verifiedOnly: true,
      });
      expect(filtered).toHaveLength(2);
      expect(filtered.every((p) => p.category === 'TAXI' && p.verified)).toBe(true);
    });
  });

  describe('calculateLandMobilityAggregation', () => {
    it('should calculate aggregation correctly', () => {
      const aggregation = calculateLandMobilityAggregation(mockBusPrices, 'BUS', 'MQ');

      expect(aggregation.category).toBe('BUS');
      expect(aggregation.territory).toBe('MQ');
      expect(aggregation.providerCount).toBe(2);
      expect(aggregation.minPrice).toBe(1.3);
      expect(aggregation.maxPrice).toBe(1.5);
      expect(aggregation.averagePrice).toBe(1.4);
    });

    it('should throw error for empty price list', () => {
      expect(() => calculateLandMobilityAggregation([], 'BUS', 'MQ')).toThrow();
    });

    it('should handle single provider', () => {
      const singlePrice = [mockBusPrices[0]];
      const aggregation = calculateLandMobilityAggregation(singlePrice, 'BUS', 'MQ');

      expect(aggregation.providerCount).toBe(1);
      expect(aggregation.minPrice).toBe(aggregation.maxPrice);
      expect(aggregation.priceRange).toBe(0);
    });
  });

  describe('rankLandMobilityPrices', () => {
    it('should rank prices correctly', () => {
      const averagePrice = 1.4;
      const ranked = rankLandMobilityPrices(mockBusPrices, averagePrice);

      expect(ranked).toHaveLength(2);
      expect(ranked[0].rank).toBe(1);
      expect(ranked[0].priceCategory).toBe('cheapest');
      expect(ranked[1].rank).toBe(2);
      expect(ranked[1].priceCategory).toBe('most_expensive');
    });

    it('should calculate differences correctly', () => {
      const averagePrice = 1.4;
      const ranked = rankLandMobilityPrices(mockBusPrices, averagePrice);

      expect(ranked[0].absoluteDifferenceFromCheapest).toBe(0);
      expect(ranked[0].percentageDifferenceFromCheapest).toBe(0);
      expect(ranked[1].absoluteDifferenceFromCheapest).toBeCloseTo(0.2, 2);
    });

    it('should return empty array for empty input', () => {
      const ranked = rankLandMobilityPrices([], 0);
      expect(ranked).toHaveLength(0);
    });
  });

  describe('generateLandMobilityMetadata', () => {
    it('should generate metadata with correct structure', () => {
      const metadata = generateLandMobilityMetadata(mockBusPrices);

      expect(metadata.methodology).toBe('v2.3.0');
      expect(metadata.aggregationMethod).toBe('mean');
      expect(metadata.dataQuality.providersWithData).toBe(2);
      expect(metadata.limitations).toBeDefined();
      expect(metadata.limitations.length).toBeGreaterThan(0);
    });

    it('should calculate source summary correctly', () => {
      const metadata = generateLandMobilityMetadata(mockBusPrices);

      expect(metadata.sources.length).toBeGreaterThan(0);
      const totalPercentage = metadata.sources.reduce((sum, s) => sum + s.percentage, 0);
      expect(totalPercentage).toBeCloseTo(100, 0);
    });
  });

  describe('getCheapestOption', () => {
    it('should return cheapest option', () => {
      const cheapest = getCheapestOption(mockBusPrices);
      expect(cheapest).not.toBeNull();
      expect(cheapest!.price).toBe(1.3);
    });

    it('should return null for empty array', () => {
      const cheapest = getCheapestOption([]);
      expect(cheapest).toBeNull();
    });
  });

  describe('getMostExpensiveOption', () => {
    it('should return most expensive option', () => {
      const expensive = getMostExpensiveOption(mockBusPrices);
      expect(expensive).not.toBeNull();
      expect(expensive!.price).toBe(1.5);
    });

    it('should return null for empty array', () => {
      const expensive = getMostExpensiveOption([]);
      expect(expensive).toBeNull();
    });
  });

  describe('calculatePercentageDifference', () => {
    it('should calculate percentage difference correctly', () => {
      const diff = calculatePercentageDifference(1.5, 1.3);
      expect(diff).toBeCloseTo(15.38, 2);
    });

    it('should return 0 when base price is 0', () => {
      const diff = calculatePercentageDifference(1.5, 0);
      expect(diff).toBe(0);
    });
  });

  describe('groupPricesByCategory', () => {
    it('should group prices by category', () => {
      const allPrices = [...mockBusPrices, ...mockTaxiPrices, ...mockFuelPrices];
      const grouped = groupPricesByCategory(allPrices);

      expect(grouped.size).toBe(3);
      expect(grouped.get('BUS')).toHaveLength(2);
      expect(grouped.get('TAXI')).toHaveLength(2);
      expect(grouped.get('FUEL')).toHaveLength(3);
    });
  });

  describe('groupPricesByTerritory', () => {
    it('should group prices by territory', () => {
      const allPrices = [...mockBusPrices, ...mockTaxiPrices, ...mockFuelPrices];
      const grouped = groupPricesByTerritory(allPrices);

      expect(grouped.has('MQ')).toBe(true);
      expect(grouped.get('MQ')!.length).toBe(7);
    });
  });

  describe('filterBusByOperator', () => {
    it('should filter bus prices by operator', () => {
      const filtered = filterBusByOperator(mockBusPrices, 'Urban');
      expect(filtered).toHaveLength(1);
      expect(filtered[0].line.operator).toBe('Urban Bus');
    });
  });

  describe('filterFuelByType', () => {
    it('should filter fuel prices by type', () => {
      const filtered = filterFuelByType(mockFuelPrices, 'SP95');
      expect(filtered).toHaveLength(2);
      expect(filtered.every((p) => p.fuelType === 'SP95')).toBe(true);
    });
  });

  describe('filterTaxiByServiceType', () => {
    it('should filter taxi prices by service type', () => {
      const filtered = filterTaxiByServiceType(mockTaxiPrices, 'vtc');
      expect(filtered).toHaveLength(1);
      expect(filtered[0].serviceType).toBe('vtc');
    });
  });

  describe('Edge Cases', () => {
    it('should handle single provider scenario', () => {
      const singlePrice = [mockBusPrices[0]];
      const result = compareLandMobilityPrices('BUS', singlePrice, 'MQ');

      expect(result).not.toBeNull();
      expect(result!.rankings).toHaveLength(1);
      expect(result!.rankings[0].rank).toBe(1);
      expect(result!.rankings[0].priceCategory).toBe('cheapest');
    });

    it('should handle missing data gracefully', () => {
      const incompletePrice: BusPricePoint = {
        ...mockBusPrices[0],
        conditions: undefined,
      };
      const result = compareLandMobilityPrices('BUS', [incompletePrice], 'MQ');

      expect(result).not.toBeNull();
    });

    it('should handle identical prices', () => {
      const identicalPrices: BusPricePoint[] = [
        { ...mockBusPrices[0], price: 1.5 },
        { ...mockBusPrices[0], line: { ...mockBusPrices[0].line, operator: 'Other' }, price: 1.5 },
      ];
      const result = compareLandMobilityPrices('BUS', identicalPrices, 'MQ');

      expect(result).not.toBeNull();
      expect(result!.aggregation.priceRange).toBe(0);
    });

    it('should handle mixed fuel types', () => {
      const result = compareLandMobilityPrices('FUEL', mockFuelPrices, 'MQ');

      expect(result).not.toBeNull();
      expect(result!.rankings.length).toBe(3);
      // Should include both SP95 and DIESEL
      const fuelTypes = result!.rankings.map((r) => (r.mobilityPrice as FuelPricePoint).fuelType);
      expect(fuelTypes.includes('SP95')).toBe(true);
      expect(fuelTypes.includes('DIESEL')).toBe(true);
    });
  });
});
