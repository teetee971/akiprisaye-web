/**
 * Tests for Product Suggestions
 */

import { describe, it, expect } from 'vitest';
import {
  getSuggestedProducts,
  getFrequentlyForgottenItems,
  analyzeShoppingList,
} from '../productSuggestions';

describe('Product Suggestions', () => {
  describe('getSuggestedProducts', () => {
    it('should return empty array for empty list', () => {
      const suggestions = getSuggestedProducts([]);
      expect(suggestions).toEqual([]);
    });

    it('should suggest complementary products', () => {
      const suggestions = getSuggestedProducts(['Pâtes']);

      expect(suggestions.length).toBeGreaterThan(0);
      const productNames = suggestions.map((s) => s.product);
      expect(productNames).toContain('Huile');
    });

    it('should not suggest products already in list', () => {
      const suggestions = getSuggestedProducts(['Pâtes', 'Huile']);

      const productNames = suggestions.map((s) => s.product);
      expect(productNames).not.toContain('Huile');
    });

    it('should suggest products for rice', () => {
      const suggestions = getSuggestedProducts(['Riz']);

      const productNames = suggestions.map((s) => s.product);
      expect(productNames.some((p) => ['Légumes', 'Viande', 'Huile'].includes(p))).toBe(true);
    });

    it('should limit suggestions to 5', () => {
      const suggestions = getSuggestedProducts(['Pâtes', 'Riz', 'Pain', 'Lait']);

      expect(suggestions.length).toBeLessThanOrEqual(5);
    });

    it('should include reason for each suggestion', () => {
      const suggestions = getSuggestedProducts(['Pâtes']);

      suggestions.forEach((suggestion) => {
        expect(suggestion.product).toBeDefined();
        expect(suggestion.reason).toBeDefined();
        expect(suggestion.category).toBeDefined();
      });
    });

    it('should detect meal patterns', () => {
      const suggestions = getSuggestedProducts(['Viande', 'Légumes']);

      const productNames = suggestions.map((s) => s.product);
      // Should suggest rice or pasta to complete a meal
      expect(productNames.some((p) => ['Riz', 'Pâtes'].includes(p))).toBe(true);
    });
  });

  describe('getFrequentlyForgottenItems', () => {
    it('should return essentials not in list', () => {
      const forgotten = getFrequentlyForgottenItems(['Pâtes']);

      expect(forgotten).toContain('Eau');
      expect(forgotten).toContain('Pain');
      expect(forgotten).toContain('Lait');
    });

    it('should not return items already in list', () => {
      const forgotten = getFrequentlyForgottenItems(['Eau', 'Pain', 'Lait']);

      expect(forgotten).toEqual([]);
    });

    it('should return partial list when some essentials present', () => {
      const forgotten = getFrequentlyForgottenItems(['Eau']);

      expect(forgotten).toContain('Pain');
      expect(forgotten).toContain('Lait');
      expect(forgotten).not.toContain('Eau');
    });
  });

  describe('analyzeShoppingList', () => {
    it('should provide insights for empty list', () => {
      const analysis = analyzeShoppingList([]);

      expect(analysis.totalItems).toBe(0);
      expect(analysis.suggestions).toContain(
        'Votre liste est vide. Commencez par ajouter des produits de base.'
      );
    });

    it('should provide insights for short list', () => {
      const analysis = analyzeShoppingList(['Pâtes', 'Riz']);

      expect(analysis.totalItems).toBe(2);
      expect(analysis.suggestions.length).toBeGreaterThan(0);
    });

    it('should provide insights for long list', () => {
      const longList = Array.from({ length: 20 }, (_, i) => `Product ${i}`);
      const analysis = analyzeShoppingList(longList);

      expect(analysis.totalItems).toBe(20);
      expect(analysis.suggestions.some((s) => s.includes('optimiser'))).toBe(true);
    });

    it('should count total items correctly', () => {
      const analysis = analyzeShoppingList(['Pâtes', 'Riz', 'Pain']);

      expect(analysis.totalItems).toBe(3);
    });
  });

  describe('Edge Cases', () => {
    it('should handle products with special characters', () => {
      const suggestions = getSuggestedProducts(['Café (non listé)']);

      expect(suggestions).toBeDefined();
      expect(Array.isArray(suggestions)).toBe(true);
    });

    it('should handle duplicate products in input', () => {
      const suggestions = getSuggestedProducts(['Pâtes', 'Pâtes', 'Riz']);

      expect(suggestions).toBeDefined();
      expect(Array.isArray(suggestions)).toBe(true);
    });

    it('should not crash with unknown products', () => {
      const suggestions = getSuggestedProducts(['Unknown Product XYZ']);

      expect(suggestions).toBeDefined();
      expect(Array.isArray(suggestions)).toBe(true);
    });
  });
});
