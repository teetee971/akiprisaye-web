/**
 * Unit tests for Price Alert Service
 *
 * Tests the deterministic alert detection logic
 */

import { describe, it, expect } from 'vitest';
import {
  detectPriceDrop,
  detectPriceIncrease,
  detectShrinkflation,
  DEFAULT_ALERT_PREFERENCES,
} from '../priceAlertService';

describe('Price Alert Service', () => {
  describe('detectPriceDrop', () => {
    it('should detect a price drop', () => {
      const result = detectPriceDrop(10.0, 8.0, DEFAULT_ALERT_PREFERENCES);
      expect(result).not.toBeNull();
      expect(result.triggered).toBe(true);
      expect(result.absoluteChange).toBe(-2.0);
      expect(result.percentageChange).toBe(-20);
    });

    it('should not trigger when price increases', () => {
      const result = detectPriceDrop(10.0, 12.0, DEFAULT_ALERT_PREFERENCES);
      expect(result).toBeNull();
    });

    it('should not trigger when price stays the same', () => {
      const result = detectPriceDrop(10.0, 10.0, DEFAULT_ALERT_PREFERENCES);
      expect(result).toBeNull();
    });

    it('should not trigger when disabled', () => {
      const preferences = { ...DEFAULT_ALERT_PREFERENCES, priceDropEnabled: false };
      const result = detectPriceDrop(10.0, 8.0, preferences);
      expect(result).toBeNull();
    });

    it('should calculate severity correctly for high drop', () => {
      const result = detectPriceDrop(10.0, 8.0, DEFAULT_ALERT_PREFERENCES);
      expect(result.severity).toBe('high'); // -20% is >= 10%
    });

    it('should calculate severity correctly for medium drop', () => {
      const result = detectPriceDrop(10.0, 9.2, DEFAULT_ALERT_PREFERENCES);
      expect(result.severity).toBe('medium'); // -8% is >= 5% but < 10%
    });

    it('should calculate severity correctly for low drop', () => {
      const result = detectPriceDrop(10.0, 9.6, DEFAULT_ALERT_PREFERENCES);
      expect(result.severity).toBe('low'); // -4% is < 5%
    });
  });

  describe('detectPriceIncrease', () => {
    it('should detect price increase exceeding percentage threshold', () => {
      const result = detectPriceIncrease(10.0, 11.0, DEFAULT_ALERT_PREFERENCES);
      expect(result).not.toBeNull();
      expect(result.triggered).toBe(true);
      expect(result.absoluteChange).toBe(1.0);
      expect(result.percentageChange).toBe(10);
    });

    it('should detect price increase exceeding absolute threshold', () => {
      const result = detectPriceIncrease(10.0, 10.6, DEFAULT_ALERT_PREFERENCES);
      expect(result).not.toBeNull();
      expect(result.triggered).toBe(true);
      expect(result.absoluteChange).toBeCloseTo(0.6, 2);
    });

    it('should not trigger when below both thresholds', () => {
      const result = detectPriceIncrease(10.0, 10.3, DEFAULT_ALERT_PREFERENCES);
      expect(result).toBeNull(); // +3% and +0.30€ both below thresholds
    });

    it('should not trigger when price decreases', () => {
      const result = detectPriceIncrease(10.0, 9.0, DEFAULT_ALERT_PREFERENCES);
      expect(result).toBeNull();
    });

    it('should not trigger when disabled', () => {
      const preferences = { ...DEFAULT_ALERT_PREFERENCES, priceIncreaseEnabled: false };
      const result = detectPriceIncrease(10.0, 12.0, preferences);
      expect(result).toBeNull();
    });

    it('should respect custom percentage threshold', () => {
      const preferences = {
        ...DEFAULT_ALERT_PREFERENCES,
        increasePercentageThreshold: 10,
        increaseAbsoluteThreshold: 1.0,
      };
      const result = detectPriceIncrease(10.0, 10.8, preferences);
      expect(result).toBeNull(); // +8% below 10% threshold AND +0.80€ below 1.00€ threshold
    });

    it('should respect custom absolute threshold', () => {
      const preferences = {
        ...DEFAULT_ALERT_PREFERENCES,
        increasePercentageThreshold: 20,
        increaseAbsoluteThreshold: 1.0,
      };
      const result = detectPriceIncrease(10.0, 10.8, preferences);
      expect(result).toBeNull(); // +8% below 20% threshold AND +0.80€ below 1.00€ threshold
    });

    it('should trigger when exceeding only percentage threshold', () => {
      const preferences = {
        ...DEFAULT_ALERT_PREFERENCES,
        increasePercentageThreshold: 5,
        increaseAbsoluteThreshold: 2.0,
      };
      const result = detectPriceIncrease(10.0, 10.6, preferences);
      expect(result).not.toBeNull(); // +6% exceeds 5% threshold even though +0.60€ is below 2.00€
      expect(result.percentageChange).toBeCloseTo(6, 1);
    });

    it('should trigger when exceeding only absolute threshold', () => {
      const preferences = {
        ...DEFAULT_ALERT_PREFERENCES,
        increasePercentageThreshold: 20,
        increaseAbsoluteThreshold: 0.3,
      };
      const result = detectPriceIncrease(10.0, 10.4, preferences);
      expect(result).not.toBeNull(); // +0.40€ exceeds 0.30€ threshold even though +4% is below 20%
      expect(result.absoluteChange).toBeCloseTo(0.4, 2);
    });
  });

  describe('detectShrinkflation', () => {
    it('should detect shrinkflation (quantity reduction with price increase)', () => {
      const result = detectShrinkflation(
        10.0, // previous price
        10.0, // current price (same)
        1000, // previous quantity (g)
        900, // current quantity (g) - 10% reduction
        DEFAULT_ALERT_PREFERENCES
      );
      expect(result).not.toBeNull();
      expect(result.triggered).toBe(true);
      expect(result.shrinkflationDetails.quantityReduction).toBe(100);
      expect(result.shrinkflationDetails.quantityReductionPercentage).toBeCloseTo(10, 1);
      expect(result.shrinkflationDetails.effectivePriceIncrease).toBeCloseTo(11.11, 1);
    });

    it('should detect shrinkflation even when price slightly decreases', () => {
      const result = detectShrinkflation(
        10.0, // previous price
        9.5, // current price (-5%)
        1000, // previous quantity
        800, // current quantity (-20%)
        DEFAULT_ALERT_PREFERENCES
      );
      expect(result).not.toBeNull();
      expect(result.triggered).toBe(true);
      // Effective increase: (9.50/800) vs (10/1000) = 0.011875 vs 0.01 = +18.75%
      expect(result.shrinkflationDetails.effectivePriceIncrease).toBeCloseTo(18.75, 1);
    });

    it('should not trigger when quantity increases', () => {
      const result = detectShrinkflation(
        10.0,
        10.0,
        1000,
        1100, // quantity increased
        DEFAULT_ALERT_PREFERENCES
      );
      expect(result).toBeNull();
    });

    it('should not trigger when quantity stays the same', () => {
      const result = detectShrinkflation(
        10.0,
        12.0,
        1000,
        1000, // quantity same
        DEFAULT_ALERT_PREFERENCES
      );
      expect(result).toBeNull();
    });

    it('should not trigger when quantity is missing', () => {
      const result = detectShrinkflation(
        10.0,
        10.0,
        null, // no quantity data
        900,
        DEFAULT_ALERT_PREFERENCES
      );
      expect(result).toBeNull();
    });

    it('should not trigger when effective price per unit decreases', () => {
      const result = detectShrinkflation(
        10.0,
        8.0, // significant price drop
        1000,
        900, // small quantity reduction
        DEFAULT_ALERT_PREFERENCES
      );
      expect(result).toBeNull(); // Effective price per unit: 0.00889 < 0.01
    });

    it('should not trigger when disabled', () => {
      const preferences = { ...DEFAULT_ALERT_PREFERENCES, shrinkflationEnabled: false };
      const result = detectShrinkflation(10.0, 10.0, 1000, 900, preferences);
      expect(result).toBeNull();
    });
  });

  describe('Alert Severity Calculation', () => {
    it('should classify high severity for >=10% change', () => {
      const result = detectPriceIncrease(10.0, 11.0, DEFAULT_ALERT_PREFERENCES);
      expect(result.severity).toBe('high');
    });

    it('should classify medium severity for 5-10% change', () => {
      const result = detectPriceIncrease(10.0, 10.7, DEFAULT_ALERT_PREFERENCES);
      expect(result.severity).toBe('medium');
    });

    it('should classify severity based on percentage change', () => {
      const result = detectPriceIncrease(10.0, 10.51, DEFAULT_ALERT_PREFERENCES);
      expect(result).not.toBeNull(); // +0.51€ exceeds 0.50€ threshold
      expect(result.severity).toBe('medium'); // +5.1% is >= 5%
    });
  });

  describe('Edge Cases', () => {
    it('should handle very small price changes', () => {
      const result = detectPriceIncrease(1.0, 1.01, DEFAULT_ALERT_PREFERENCES);
      expect(result).toBeNull(); // +1% below threshold, +0.01€ below threshold
    });

    it('should handle large price changes', () => {
      const result = detectPriceIncrease(10.0, 50.0, DEFAULT_ALERT_PREFERENCES);
      expect(result).not.toBeNull();
      expect(result.percentageChange).toBe(400);
      expect(result.severity).toBe('high');
    });

    it('should handle zero previous price gracefully', () => {
      // This is an edge case that shouldn't happen in real data
      // but we should not crash
      expect(() => {
        detectPriceIncrease(0, 10.0, DEFAULT_ALERT_PREFERENCES);
      }).not.toThrow();
    });
  });
});
