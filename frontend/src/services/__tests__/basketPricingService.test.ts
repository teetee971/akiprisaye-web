/**
 * Tests for Basket Pricing Service
 * Phase 8: Test basket analysis and optimization
 */

import { describe, it, expect } from 'vitest';
import { analyzeBasketPricing, analyzeBasketPriceTrends } from '../basketPricingService';

describe('Basket Pricing Service', () => {
  describe('analyzeBasketPricing', () => {
    it('should analyze basket pricing without user position', () => {
      const basketItems = [
        { id: '3017620422003', quantity: 1, meta: { name: 'Nutella 400g' } },
        { id: '3029330003533', quantity: 2, meta: { name: 'Ricoré 100g' } },
      ];

      const result = analyzeBasketPricing(basketItems);

      expect(result).toBeDefined();
      expect(result.basket.items).toBe(2);
      expect(result.basket.totalQuantity).toBe(3);
      expect(result.bestOption).toBeDefined();
      expect(result.comparison).toBeDefined();
      expect(result.recommendations).toBeDefined();
      expect(Array.isArray(result.recommendations)).toBe(true);
    });

    it('should include distance calculations with user position', () => {
      const basketItems = [{ id: '3017620422003', quantity: 1, meta: { name: 'Nutella 400g' } }];

      const userPosition = { lat: 16.2415, lon: -61.5331 };

      const result = analyzeBasketPricing(basketItems, userPosition);

      expect(result.bestOption).toBeDefined();
      if (result.bestOption.distance !== undefined) {
        expect(result.bestOption.distance).toBeTypeOf('number');
      }

      if (result.multiStoreOption) {
        if (result.multiStoreOption.extraDistance !== undefined) {
          expect(result.multiStoreOption.extraDistance).toBeTypeOf('number');
        }
      }
    });

    it('should calculate price comparisons', () => {
      const basketItems = [{ id: '3017620422003', quantity: 2, meta: { name: 'Nutella 400g' } }];

      const result = analyzeBasketPricing(basketItems);

      expect(result.comparison.lowestPrice).toBeDefined();
      expect(result.comparison.highestPrice).toBeDefined();
      expect(result.comparison.averagePrice).toBeDefined();
      expect(result.comparison.priceRange).toBe(
        result.comparison.highestPrice - result.comparison.lowestPrice
      );
      expect(result.comparison.potentialSavings).toBe(result.comparison.priceRange);
    });

    it('should generate recommendations', () => {
      const basketItems = [
        { id: '3017620422003', quantity: 1, meta: { name: 'Nutella 400g' } },
        { id: '3029330003533', quantity: 1, meta: { name: 'Ricoré 100g' } },
      ];

      const result = analyzeBasketPricing(basketItems);

      expect(result.recommendations).toBeDefined();
      expect(Array.isArray(result.recommendations)).toBe(true);

      if (result.recommendations.length > 0) {
        const rec = result.recommendations[0];
        expect(rec.type).toBeDefined();
        expect(rec.priority).toBeDefined();
        expect(rec.title).toBeDefined();
        expect(rec.description).toBeDefined();
      }
    });

    it('should sort recommendations by priority', () => {
      const basketItems = [{ id: '3017620422003', quantity: 1, meta: { name: 'Nutella 400g' } }];

      const result = analyzeBasketPricing(basketItems);

      if (result.recommendations.length > 1) {
        const priorities = result.recommendations.map((r) => r.priority);
        const priorityOrder = { high: 0, medium: 1, low: 2 };

        for (let i = 1; i < priorities.length; i++) {
          expect(priorityOrder[priorities[i]]).toBeGreaterThanOrEqual(
            priorityOrder[priorities[i - 1]]
          );
        }
      }
    });

    it('should handle empty basket', () => {
      const result = analyzeBasketPricing([]);

      expect(result.basket.items).toBe(0);
      expect(result.basket.totalQuantity).toBe(0);
    });

    it('should calculate multi-store strategy', () => {
      const basketItems = [
        { id: '3017620422003', quantity: 1, meta: { name: 'Nutella 400g' } },
        { id: '3029330003533', quantity: 1, meta: { name: 'Ricoré 100g' } },
      ];

      const result = analyzeBasketPricing(basketItems);

      if (result.multiStoreOption) {
        expect(result.multiStoreOption.stores).toBeDefined();
        expect(Array.isArray(result.multiStoreOption.stores)).toBe(true);
        expect(result.multiStoreOption.totalPrice).toBeDefined();
        expect(result.multiStoreOption.savings).toBeDefined();
        expect(result.multiStoreOption.worthwhile).toBeDefined();
        expect(result.multiStoreOption.reason).toBeDefined();
      }
    });
  });

  describe('analyzeBasketPriceTrends', () => {
    it('should analyze price trends for basket items', () => {
      const basketItems = [{ id: '3017620422003', quantity: 1, meta: { name: 'Nutella 400g' } }];

      const trends = analyzeBasketPriceTrends(basketItems);

      expect(Array.isArray(trends)).toBe(true);
    });

    it('should return trend data for valid products', () => {
      const basketItems = [{ id: '3017620422003', quantity: 1, meta: { name: 'Nutella 400g' } }];

      const trends = analyzeBasketPriceTrends(basketItems);

      trends.forEach((trend) => {
        expect(trend.product).toBeDefined();
        expect(trend.currentPrice).toBeDefined();
        expect(trend.trend).toBeDefined();
        expect(trend.recommendation).toBeDefined();
      });
    });

    it('should handle empty basket', () => {
      const trends = analyzeBasketPriceTrends([]);
      expect(trends).toEqual([]);
    });

    it('should skip invalid products', () => {
      const basketItems = [{ id: 'invalid-ean', quantity: 1, meta: { name: 'Unknown Product' } }];

      const trends = analyzeBasketPriceTrends(basketItems);
      expect(trends).toEqual([]);
    });
  });

  describe('recommendation types', () => {
    it('should generate price recommendations', () => {
      const basketItems = [{ id: '3017620422003', quantity: 1, meta: { name: 'Nutella 400g' } }];

      const result = analyzeBasketPricing(basketItems);
      const priceRecs = result.recommendations.filter((r) => r.type === 'price');

      priceRecs.forEach((rec) => {
        expect(rec.savings).toBeDefined();
        expect(rec.savings).toBeGreaterThan(0);
      });
    });

    it('should generate distance recommendations with user position', () => {
      const basketItems = [{ id: '3017620422003', quantity: 1, meta: { name: 'Nutella 400g' } }];

      const userPosition = { lat: 16.2415, lon: -61.5331 };
      const result = analyzeBasketPricing(basketItems, userPosition);
      const distanceRecs = result.recommendations.filter((r) => r.type === 'distance');

      distanceRecs.forEach((rec) => {
        expect(rec.extraDistance).toBeDefined();
      });
    });
  });
});
