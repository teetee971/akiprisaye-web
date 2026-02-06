/**
 * Unit Tests for Food Basket Observatory Service v2.5.0
 */

import { describe, it, expect } from 'vitest';
import {
  compareFoodBasketCosts,
  calculateFoodBasketAggregation,
  rankFoodBasketStores,
  generateFoodBasketMetadata,
  applyFoodBasketFilters,
  buildFoodBasketHistory,
  calculateFoodBasketVariation,
} from '../foodBasketService';
import type {
  FoodBasket,
  FoodBasketObservation,
  FoodBasketItem,
} from '../../types/foodBasket';

// Mock basic food basket
const mockBasicBasket: FoodBasket = {
  basketId: 'BASIC_WEEKLY_MQ',
  name: 'Panier Basique Hebdomadaire',
  type: 'BASIC',
  description: 'Panier alimentaire de base pour une semaine',
  items: [
    {
      name: 'Pain',
      category: 'BREAD_CEREALS',
      quantity: 7,
      unit: 'unit',
    },
    {
      name: 'Lait',
      category: 'DAIRY',
      quantity: 2,
      unit: 'L',
    },
    {
      name: 'Riz',
      category: 'BREAD_CEREALS',
      quantity: 1,
      unit: 'kg',
    },
  ],
  period: 'weekly',
  metadata: {
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    version: '1.0',
    methodology: 'Based on average household consumption',
  },
};

// Mock observations
const mockObservations: FoodBasketObservation[] = [
  {
    basket: mockBasicBasket,
    territory: 'MQ',
    storeName: 'Carrefour Fort-de-France',
    itemPrices: [
      {
        item: mockBasicBasket.items[0],
        storeName: 'Carrefour Fort-de-France',
        price: 7.70, // 7 × 1.10
        pricePerUnit: 1.10,
        territory: 'MQ',
        observationDate: '2025-12-20T10:00:00Z',
        source: {
          type: 'user_report',
          observedAt: '2025-12-20T10:00:00Z',
          verificationMethod: 'manual',
          reliability: 'high',
        },
        volume: 5,
        confidence: 'high',
        verified: true,
      },
      {
        item: mockBasicBasket.items[1],
        storeName: 'Carrefour Fort-de-France',
        price: 4.80, // 2 × 2.40
        pricePerUnit: 2.40,
        territory: 'MQ',
        observationDate: '2025-12-20T10:00:00Z',
        source: {
          type: 'user_report',
          observedAt: '2025-12-20T10:00:00Z',
          verificationMethod: 'manual',
          reliability: 'high',
        },
        volume: 5,
        confidence: 'high',
        verified: true,
      },
      {
        item: mockBasicBasket.items[2],
        storeName: 'Carrefour Fort-de-France',
        price: 2.50,
        pricePerUnit: 2.50,
        territory: 'MQ',
        observationDate: '2025-12-20T10:00:00Z',
        source: {
          type: 'user_report',
          observedAt: '2025-12-20T10:00:00Z',
          verificationMethod: 'manual',
          reliability: 'high',
        },
        volume: 5,
        confidence: 'high',
        verified: true,
      },
    ],
    totalCost: 15.00,
    completeness: 100,
    observationDate: '2025-12-20T10:00:00Z',
    sources: [{
      type: 'user_report',
      observedAt: '2025-12-20T10:00:00Z',
      verificationMethod: 'manual',
      reliability: 'high',
    }],
  },
  {
    basket: mockBasicBasket,
    territory: 'MQ',
    storeName: 'Leader Price Schoelcher',
    itemPrices: [
      {
        item: mockBasicBasket.items[0],
        storeName: 'Leader Price Schoelcher',
        price: 6.30,
        pricePerUnit: 0.90,
        territory: 'MQ',
        observationDate: '2025-12-21T10:00:00Z',
        source: {
          type: 'official_site',
          observedAt: '2025-12-21T10:00:00Z',
          verificationMethod: 'automated',
          reliability: 'high',
        },
        volume: 10,
        confidence: 'high',
        verified: true,
      },
      {
        item: mockBasicBasket.items[1],
        storeName: 'Leader Price Schoelcher',
        price: 4.20,
        pricePerUnit: 2.10,
        territory: 'MQ',
        observationDate: '2025-12-21T10:00:00Z',
        source: {
          type: 'official_site',
          observedAt: '2025-12-21T10:00:00Z',
          verificationMethod: 'automated',
          reliability: 'high',
        },
        volume: 10,
        confidence: 'high',
        verified: true,
      },
      {
        item: mockBasicBasket.items[2],
        storeName: 'Leader Price Schoelcher',
        price: 2.20,
        pricePerUnit: 2.20,
        territory: 'MQ',
        observationDate: '2025-12-21T10:00:00Z',
        source: {
          type: 'official_site',
          observedAt: '2025-12-21T10:00:00Z',
          verificationMethod: 'automated',
          reliability: 'high',
        },
        volume: 10,
        confidence: 'high',
        verified: true,
      },
    ],
    totalCost: 12.70,
    completeness: 100,
    observationDate: '2025-12-21T10:00:00Z',
    sources: [{
      type: 'official_site',
      observedAt: '2025-12-21T10:00:00Z',
      verificationMethod: 'automated',
      reliability: 'high',
    }],
  },
];

describe('Food Basket Observatory Service v2.5.0', () => {
  describe('compareFoodBasketCosts', () => {
    it('should return null for empty observations', () => {
      const result = compareFoodBasketCosts(mockBasicBasket, [], 'MQ');
      expect(result).toBeNull();
    });

    it('should return null when no observations match territory', () => {
      const result = compareFoodBasketCosts(mockBasicBasket, mockObservations, 'GP');
      expect(result).toBeNull();
    });

    it('should successfully compare food basket costs', () => {
      const result = compareFoodBasketCosts(mockBasicBasket, mockObservations, 'MQ');
      
      expect(result).not.toBeNull();
      expect(result!.territory).toBe('MQ');
      expect(result!.observations.length).toBe(2);
      expect(result!.ranking.length).toBe(2);
    });

    it('should rank stores from cheapest to most expensive', () => {
      const result = compareFoodBasketCosts(mockBasicBasket, mockObservations, 'MQ');
      
      expect(result!.ranking[0].observation.storeName).toBe('Leader Price Schoelcher');
      expect(result!.ranking[0].observation.totalCost).toBe(12.70);
      expect(result!.ranking[1].observation.totalCost).toBe(15.00);
    });
  });

  describe('calculateFoodBasketAggregation', () => {
    it('should calculate aggregation correctly', () => {
      const aggregation = calculateFoodBasketAggregation(mockBasicBasket, mockObservations, 'MQ');
      
      expect(aggregation.territory).toBe('MQ');
      expect(aggregation.statistics.observationCount).toBe(2);
      expect(aggregation.statistics.storeCount).toBe(2);
      expect(aggregation.statistics.averageCost).toBeCloseTo(13.85, 2);
      expect(aggregation.statistics.medianCost).toBeCloseTo(13.85, 2);
      expect(aggregation.statistics.minCost).toBe(12.70);
      expect(aggregation.statistics.maxCost).toBe(15.00);
    });

    it('should throw error for empty observations', () => {
      expect(() => calculateFoodBasketAggregation(mockBasicBasket, [], 'MQ')).toThrow();
    });

    it('should calculate item breakdown', () => {
      const aggregation = calculateFoodBasketAggregation(mockBasicBasket, mockObservations, 'MQ');
      
      expect(aggregation.itemBreakdown.length).toBe(3);
      expect(aggregation.itemBreakdown[0].item.name).toBe('Pain');
      expect(aggregation.itemBreakdown[0].availabilityRate).toBe(100);
    });
  });

  describe('rankFoodBasketStores', () => {
    it('should rank stores correctly', () => {
      const ranked = rankFoodBasketStores(mockObservations, 13.85);
      
      expect(ranked.length).toBe(2);
      expect(ranked[0].rank).toBe(1);
      expect(ranked[0].priceCategory).toBe('cheapest');
      expect(ranked[1].rank).toBe(2);
      expect(ranked[1].priceCategory).toBe('most_expensive');
    });

    it('should calculate differences correctly', () => {
      const ranked = rankFoodBasketStores(mockObservations, 13.85);
      
      expect(ranked[0].absoluteDifferenceFromCheapest).toBe(0);
      expect(ranked[1].absoluteDifferenceFromCheapest).toBeCloseTo(2.30, 2);
    });

    it('should return empty for empty input', () => {
      const ranked = rankFoodBasketStores([], 0);
      expect(ranked).toHaveLength(0);
    });
  });

  describe('generateFoodBasketMetadata', () => {
    it('should generate metadata with correct structure', () => {
      const metadata = generateFoodBasketMetadata(mockObservations);
      
      expect(metadata.methodology).toBe('v2.5.0');
      expect(metadata.aggregationMethod).toBe('median');
      expect(metadata.dataQuality.totalObservations).toBe(2);
      expect(metadata.limitations).toBeDefined();
      expect(metadata.limitations.length).toBeGreaterThan(0);
    });

    it('should calculate source summary', () => {
      const metadata = generateFoodBasketMetadata(mockObservations);
      
      expect(metadata.sources.length).toBeGreaterThan(0);
    });
  });

  describe('applyFoodBasketFilters', () => {
    it('should filter by territory', () => {
      const filtered = applyFoodBasketFilters(mockObservations, { territory: 'MQ' });
      expect(filtered.length).toBe(2);
    });

    it('should filter by store chain', () => {
      const filtered = applyFoodBasketFilters(mockObservations, { storeChain: 'Leader' });
      expect(filtered.length).toBe(1);
      expect(filtered[0].storeName).toContain('Leader Price');
    });

    it('should filter by completeness', () => {
      const filtered = applyFoodBasketFilters(mockObservations, { minCompleteness: 100 });
      expect(filtered.length).toBe(2);
      expect(filtered.every(o => o.completeness === 100)).toBe(true);
    });

    it('should filter by basket type', () => {
      const filtered = applyFoodBasketFilters(mockObservations, { basketType: 'BASIC' });
      expect(filtered.length).toBe(2);
    });
  });

  describe('buildFoodBasketHistory', () => {
    it('should build history', () => {
      const history = buildFoodBasketHistory(mockBasicBasket, mockObservations, 'MQ');
      
      expect(history.length).toBeGreaterThan(0);
      expect(history[0].territory).toBe('MQ');
    });

    it('should return empty for no data', () => {
      const history = buildFoodBasketHistory(mockBasicBasket, [], 'MQ');
      expect(history).toHaveLength(0);
    });
  });

  describe('calculateFoodBasketVariation', () => {
    it('should calculate variation', () => {
      const history = [
        {
          date: '2025-W01',
          basket: mockBasicBasket,
          territory: 'MQ' as const,
          averageCost: 13.00,
          medianCost: 13.00,
          minCost: 12.00,
          maxCost: 14.00,
          observationCount: 5,
          averageCompleteness: 100,
          sources: [],
        },
        {
          date: '2025-W04',
          basket: mockBasicBasket,
          territory: 'MQ' as const,
          averageCost: 14.00,
          medianCost: 14.00,
          minCost: 13.00,
          maxCost: 15.00,
          observationCount: 5,
          averageCompleteness: 100,
          sources: [],
        },
      ];
      
      const variation = calculateFoodBasketVariation(history);
      
      expect(variation).not.toBeNull();
      expect(variation!.variation.absoluteChange).toBeCloseTo(1.00, 2);
      expect(variation!.variation.percentageChange).toBeCloseTo(7.69, 2);
      expect(variation!.variation.direction).toBe('increase');
    });

    it('should return null for insufficient data', () => {
      const history = [{
        date: '2025-W01',
        basket: mockBasicBasket,
        territory: 'MQ' as const,
        averageCost: 13.00,
        medianCost: 13.00,
        minCost: 12.00,
        maxCost: 14.00,
        observationCount: 5,
        averageCompleteness: 100,
        sources: [],
      }];
      
      const variation = calculateFoodBasketVariation(history);
      expect(variation).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('should handle incomplete basket', () => {
      const incompleteObs: FoodBasketObservation = {
        ...mockObservations[0],
        itemPrices: [mockObservations[0].itemPrices[0]], // Only 1 of 3 items
        totalCost: 7.70,
        completeness: 33.33,
      };
      
      const result = compareFoodBasketCosts(mockBasicBasket, [incompleteObs], 'MQ');
      
      expect(result).not.toBeNull();
      expect(result!.observations[0].completeness).toBeCloseTo(33.33, 2);
    });

    it('should handle multi-store data', () => {
      const result = compareFoodBasketCosts(mockBasicBasket, mockObservations, 'MQ');
      
      expect(result).not.toBeNull();
      expect(result!.aggregation.statistics.storeCount).toBe(2);
    });

    it('should handle territorial variations', () => {
      const gpObservation: FoodBasketObservation = {
        ...mockObservations[0],
        territory: 'GP',
        totalCost: 16.50,
      };
      
      const allObs = [...mockObservations, gpObservation];
      
      const mqResult = compareFoodBasketCosts(mockBasicBasket, allObs, 'MQ');
      const gpResult = compareFoodBasketCosts(mockBasicBasket, allObs, 'GP');
      
      expect(mqResult).not.toBeNull();
      expect(gpResult).not.toBeNull();
      expect(mqResult!.observations.length).toBe(2);
      expect(gpResult!.observations.length).toBe(1);
    });
  });
});
