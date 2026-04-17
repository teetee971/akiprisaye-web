/**
 * Unit Tests for Price Comparison Service v1.4.0
 */

import { describe, it, expect } from 'vitest';
import {
  comparePricesByEAN,
  calculateTerritoryAggregation,
  rankStorePrices,
  generateComparisonMetadata,
  calculatePercentageDifference,
  filterStorePrices,
  getCheapestStore,
  getMostExpensiveStore,
  calculatePotentialSavings,
} from '../priceComparisonService';
import type { StorePricePoint } from '../../types/priceComparison';

// Mock data for testing
const mockStorePrices: StorePricePoint[] = [
  {
    storeId: 'store1',
    storeName: 'Leader Price Schoelcher',
    storeChain: 'Leader Price',
    price: 1.79,
    territory: 'MQ',
    observationDate: '2025-12-20T10:00:00Z',
    source: 'user_report',
    volume: 45,
    confidence: 'high',
    verified: true,
  },
  {
    storeId: 'store2',
    storeName: 'Super U Lamentin',
    storeChain: 'Super U',
    price: 1.89,
    territory: 'MQ',
    observationDate: '2025-12-21T14:30:00Z',
    source: 'official_site',
    volume: 30,
    confidence: 'high',
    verified: true,
  },
  {
    storeId: 'store3',
    storeName: 'Carrefour Fort-de-France',
    storeChain: 'Carrefour',
    price: 1.95,
    territory: 'MQ',
    observationDate: '2025-12-22T09:15:00Z',
    source: 'user_report',
    volume: 52,
    confidence: 'medium',
    verified: false,
  },
];

describe('Price Comparison Service v1.4.0', () => {
  describe('comparePricesByEAN', () => {
    it('should return null for empty EAN', () => {
      const result = comparePricesByEAN('', mockStorePrices, 'MQ');
      expect(result).toBeNull();
    });

    it('should return null for empty price array', () => {
      const result = comparePricesByEAN('3228857000906', [], 'MQ');
      expect(result).toBeNull();
    });

    it('should return null for territory with no prices', () => {
      const result = comparePricesByEAN('3228857000906', mockStorePrices, 'GP');
      expect(result).toBeNull();
    });

    it('should return valid comparison result', () => {
      const result = comparePricesByEAN('3228857000906', mockStorePrices, 'MQ');

      expect(result).not.toBeNull();
      expect(result!.territory).toBe('MQ');
      expect(result!.storePrices).toHaveLength(3);
      expect(result!.aggregation).toBeDefined();
      expect(result!.metadata).toBeDefined();
    });

    it('should rank stores from cheapest to most expensive', () => {
      const result = comparePricesByEAN('3228857000906', mockStorePrices, 'MQ');

      expect(result!.storePrices[0].rank).toBe(1);
      expect(result!.storePrices[0].storePrice.price).toBe(1.79);
      expect(result!.storePrices[2].rank).toBe(3);
      expect(result!.storePrices[2].storePrice.price).toBe(1.95);
    });
  });

  describe('calculateTerritoryAggregation', () => {
    it('should throw error for empty price array', () => {
      expect(() => calculateTerritoryAggregation([], 'MQ')).toThrow(
        'Cannot calculate aggregation with no prices'
      );
    });

    it('should calculate correct aggregation statistics', () => {
      const aggregation = calculateTerritoryAggregation(mockStorePrices, 'MQ');

      expect(aggregation.territory).toBe('MQ');
      expect(aggregation.storeCount).toBe(3);
      expect(aggregation.minPrice).toBe(1.79);
      expect(aggregation.maxPrice).toBe(1.95);
      expect(aggregation.priceRange).toBe(0.16);

      // Average: (1.79 + 1.89 + 1.95) / 3 = 1.88 (rounded)
      expect(aggregation.averagePrice).toBe(1.88);

      // Range percentage: (0.16 / 1.79) * 100 ≈ 8.94%
      expect(aggregation.priceRangePercentage).toBeCloseTo(8.94, 1);

      // Total observations: 45 + 30 + 52 = 127
      expect(aggregation.totalObservations).toBe(127);
    });

    it('should calculate observation period correctly', () => {
      const aggregation = calculateTerritoryAggregation(mockStorePrices, 'MQ');

      expect(aggregation.observationPeriod.from).toBe('2025-12-20T10:00:00.000Z');
      expect(aggregation.observationPeriod.to).toBe('2025-12-22T09:15:00.000Z');
    });

    it('should handle single store correctly', () => {
      const singlePrice = [mockStorePrices[0]];
      const aggregation = calculateTerritoryAggregation(singlePrice, 'MQ');

      expect(aggregation.storeCount).toBe(1);
      expect(aggregation.minPrice).toBe(1.79);
      expect(aggregation.maxPrice).toBe(1.79);
      expect(aggregation.priceRange).toBe(0);
      expect(aggregation.priceRangePercentage).toBe(0);
    });

    it('should avoid infinite range percentage when minimum price is zero', () => {
      const zeroMinPrices = [{ ...mockStorePrices[0], price: 0 }, mockStorePrices[1]];

      const aggregation = calculateTerritoryAggregation(zeroMinPrices, 'MQ');

      expect(aggregation.minPrice).toBe(0);
      expect(aggregation.priceRange).toBeCloseTo(mockStorePrices[1].price, 2);
      expect(aggregation.priceRangePercentage).toBe(0);
    });
  });

  describe('rankStorePrices', () => {
    it('should return empty array for empty input', () => {
      const aggregation = {
        territory: 'MQ' as const,
        storeCount: 0,
        averagePrice: 0,
        minPrice: 0,
        maxPrice: 0,
        priceRange: 0,
        priceRangePercentage: 0,
        observationPeriod: { from: '', to: '' },
        totalObservations: 0,
        lastUpdate: '',
      };

      const rankings = rankStorePrices([], aggregation);
      expect(rankings).toHaveLength(0);
    });

    it('should assign correct ranks', () => {
      const sortedPrices = [...mockStorePrices].sort((a, b) => a.price - b.price);
      const aggregation = calculateTerritoryAggregation(mockStorePrices, 'MQ');
      const rankings = rankStorePrices(sortedPrices, aggregation);

      expect(rankings[0].rank).toBe(1);
      expect(rankings[1].rank).toBe(2);
      expect(rankings[2].rank).toBe(3);
    });

    it('should calculate correct differences from cheapest', () => {
      const sortedPrices = [...mockStorePrices].sort((a, b) => a.price - b.price);
      const aggregation = calculateTerritoryAggregation(mockStorePrices, 'MQ');
      const rankings = rankStorePrices(sortedPrices, aggregation);

      // First store (cheapest)
      expect(rankings[0].absoluteDifferenceFromCheapest).toBe(0);
      expect(rankings[0].percentageDifferenceFromCheapest).toBe(0);

      // Second store: 1.89 - 1.79 = 0.10
      expect(rankings[1].absoluteDifferenceFromCheapest).toBeCloseTo(0.1, 2);
      // (0.10 / 1.79) * 100 ≈ 5.59%
      expect(rankings[1].percentageDifferenceFromCheapest).toBeCloseTo(5.59, 1);

      // Third store: 1.95 - 1.79 = 0.16
      expect(rankings[2].absoluteDifferenceFromCheapest).toBeCloseTo(0.16, 2);
      // (0.16 / 1.79) * 100 ≈ 8.94%
      expect(rankings[2].percentageDifferenceFromCheapest).toBeCloseTo(8.94, 1);
    });

    it('should calculate correct differences from average', () => {
      const sortedPrices = [...mockStorePrices].sort((a, b) => a.price - b.price);
      const aggregation = calculateTerritoryAggregation(mockStorePrices, 'MQ');
      const rankings = rankStorePrices(sortedPrices, aggregation);

      // Average is 1.88
      // First store: 1.79 - 1.88 = -0.09
      expect(rankings[0].absoluteDifferenceFromAverage).toBeCloseTo(-0.09, 2);
      expect(rankings[0].percentageDifferenceFromAverage).toBeCloseTo(-4.79, 1);
    });

    it('should categorize prices correctly', () => {
      const sortedPrices = [...mockStorePrices].sort((a, b) => a.price - b.price);
      const aggregation = calculateTerritoryAggregation(mockStorePrices, 'MQ');
      const rankings = rankStorePrices(sortedPrices, aggregation);

      expect(rankings[0].priceCategory).toBe('cheapest');
      // Second price (1.89) is very close to average (1.88), within 5% tolerance, so it's categorized as 'average'
      expect(rankings[1].priceCategory).toBe('average');
      expect(rankings[2].priceCategory).toBe('most_expensive');
    });
  });

  describe('generateComparisonMetadata', () => {
    it('should generate correct metadata', () => {
      const metadata = generateComparisonMetadata(mockStorePrices);

      expect(metadata.methodology).toBe('v1.4.0');
      expect(metadata.aggregationMethod).toBe('mean');
      expect(metadata.dataQuality.totalStores).toBe(3);
      expect(metadata.dataQuality.storesWithData).toBe(3);
      expect(metadata.dataQuality.coveragePercentage).toBe(100);
    });

    it('should aggregate sources correctly', () => {
      const metadata = generateComparisonMetadata(mockStorePrices);

      expect(metadata.sources).toHaveLength(2);

      const userReportSource = metadata.sources.find((s) => s.source === 'user_report');
      expect(userReportSource).toBeDefined();
      expect(userReportSource!.observationCount).toBe(97); // 45 + 52
      expect(userReportSource!.storeCount).toBe(2);

      const officialSiteSource = metadata.sources.find((s) => s.source === 'official_site');
      expect(officialSiteSource).toBeDefined();
      expect(officialSiteSource!.observationCount).toBe(30);
      expect(officialSiteSource!.storeCount).toBe(1);
    });

    it('should not generate warnings for good data', () => {
      const metadata = generateComparisonMetadata(mockStorePrices);
      expect(metadata.warnings).toBeUndefined();
    });

    it('should generate warning for low coverage', () => {
      const limitedPrices = [mockStorePrices[0]];
      // Create stores with no volume to simulate low coverage
      const pricesWithLowCoverage = [
        limitedPrices[0],
        { ...mockStorePrices[1], volume: 0 },
        { ...mockStorePrices[2], volume: 0 },
      ];

      const metadata = generateComparisonMetadata(pricesWithLowCoverage);
      expect(metadata.warnings).toBeDefined();
      expect(metadata.warnings!.some((w) => w.includes('Limited data coverage'))).toBe(true);
    });
  });

  describe('calculatePercentageDifference', () => {
    it('should calculate positive difference correctly', () => {
      const diff = calculatePercentageDifference(1.95, 1.79);
      // (1.95 - 1.79) / 1.79 * 100 ≈ 8.94%
      expect(diff).toBeCloseTo(8.94, 1);
    });

    it('should calculate negative difference correctly', () => {
      const diff = calculatePercentageDifference(1.79, 1.95);
      // (1.79 - 1.95) / 1.95 * 100 ≈ -8.21%
      expect(diff).toBeCloseTo(-8.21, 1);
    });

    it('should return 0 for identical prices', () => {
      const diff = calculatePercentageDifference(1.79, 1.79);
      expect(diff).toBe(0);
    });

    it('should return 0 when reference price is 0', () => {
      const diff = calculatePercentageDifference(1.79, 0);
      expect(diff).toBe(0);
    });
  });

  describe('filterStorePrices', () => {
    it('should filter by territory', () => {
      const gpPrices = [{ ...mockStorePrices[0], territory: 'GP' as const }];
      const allPrices = [...mockStorePrices, ...gpPrices];

      const filtered = filterStorePrices(allPrices, { territory: 'GP' });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].territory).toBe('GP');
    });

    it('should filter by store chain', () => {
      const filtered = filterStorePrices(mockStorePrices, {
        storeChain: 'Super U',
      });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].storeChain).toBe('Super U');
    });

    it('should filter by max price age', () => {
      const oldPrice = {
        ...mockStorePrices[0],
        observationDate: '2025-11-01T10:00:00Z', // 50+ days old
      };
      const allPrices = [oldPrice, ...mockStorePrices.slice(1)];

      const filtered = filterStorePrices(allPrices, { maxPriceAge: 30 });
      expect(filtered.length).toBeLessThan(allPrices.length);
    });

    it('should filter by confidence level', () => {
      const filtered = filterStorePrices(mockStorePrices, {
        minConfidence: 'high',
      });
      expect(filtered).toHaveLength(2);
      expect(filtered.every((p) => p.confidence === 'high')).toBe(true);
    });

    it('should filter by verified status', () => {
      const filtered = filterStorePrices(mockStorePrices, {
        verifiedOnly: true,
      });
      expect(filtered).toHaveLength(2);
      expect(filtered.every((p) => p.verified)).toBe(true);
    });

    it('should apply multiple filters', () => {
      const filtered = filterStorePrices(mockStorePrices, {
        territory: 'MQ',
        minConfidence: 'high',
        verifiedOnly: true,
      });
      expect(filtered).toHaveLength(2);
    });
  });

  describe('getCheapestStore', () => {
    it('should return null for empty array', () => {
      const result = getCheapestStore([]);
      expect(result).toBeNull();
    });

    it('should return the cheapest store', () => {
      const cheapest = getCheapestStore(mockStorePrices);
      expect(cheapest).not.toBeNull();
      expect(cheapest!.price).toBe(1.79);
      expect(cheapest!.storeName).toBe('Leader Price Schoelcher');
    });

    it('should handle single store', () => {
      const cheapest = getCheapestStore([mockStorePrices[0]]);
      expect(cheapest).not.toBeNull();
      expect(cheapest!.price).toBe(1.79);
    });
  });

  describe('getMostExpensiveStore', () => {
    it('should return null for empty array', () => {
      const result = getMostExpensiveStore([]);
      expect(result).toBeNull();
    });

    it('should return the most expensive store', () => {
      const expensive = getMostExpensiveStore(mockStorePrices);
      expect(expensive).not.toBeNull();
      expect(expensive!.price).toBe(1.95);
      expect(expensive!.storeName).toBe('Carrefour Fort-de-France');
    });

    it('should handle single store', () => {
      const expensive = getMostExpensiveStore([mockStorePrices[0]]);
      expect(expensive).not.toBeNull();
      expect(expensive!.price).toBe(1.79);
    });
  });

  describe('calculatePotentialSavings', () => {
    it('should return null for empty array', () => {
      const result = calculatePotentialSavings([]);
      expect(result).toBeNull();
    });

    it('should calculate correct savings', () => {
      const savings = calculatePotentialSavings(mockStorePrices);
      expect(savings).not.toBeNull();

      // 1.95 - 1.79 = 0.16
      expect(savings!.absolute).toBe(0.16);

      // (1.95 - 1.79) / 1.79 * 100 ≈ 8.94%
      expect(savings!.percentage).toBeCloseTo(8.94, 1);
    });

    it('should return zero savings for single store', () => {
      const savings = calculatePotentialSavings([mockStorePrices[0]]);
      expect(savings).not.toBeNull();
      expect(savings!.absolute).toBe(0);
      expect(savings!.percentage).toBe(0);
    });

    it('should return zero savings for identical prices', () => {
      const identicalPrices = [
        mockStorePrices[0],
        { ...mockStorePrices[0], storeId: 'store2', storeName: 'Store 2' },
      ];
      const savings = calculatePotentialSavings(identicalPrices);
      expect(savings).not.toBeNull();
      expect(savings!.absolute).toBe(0);
      expect(savings!.percentage).toBe(0);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle prices with same value correctly', () => {
      const samePrices = [
        { ...mockStorePrices[0], price: 1.89 },
        { ...mockStorePrices[1], price: 1.89 },
        { ...mockStorePrices[2], price: 1.89 },
      ];

      const aggregation = calculateTerritoryAggregation(samePrices, 'MQ');
      expect(aggregation.minPrice).toBe(1.89);
      expect(aggregation.maxPrice).toBe(1.89);
      expect(aggregation.priceRange).toBe(0);
    });

    it('should handle very small price differences', () => {
      const smallDiffPrices = [
        { ...mockStorePrices[0], price: 1.7901 },
        { ...mockStorePrices[1], price: 1.7902 },
      ];

      const cheapest = getCheapestStore(smallDiffPrices);
      expect(cheapest!.price).toBe(1.7901);
    });

    it('should handle large price differences', () => {
      const largeDiffPrices = [
        { ...mockStorePrices[0], price: 1.0 },
        { ...mockStorePrices[1], price: 10.0 },
      ];

      const diff = calculatePercentageDifference(10.0, 1.0);
      expect(diff).toBe(900); // 900% increase
    });
  });
});
