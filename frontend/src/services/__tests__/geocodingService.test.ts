 
/**
 * Tests for Geocoding Service
 * Phase 7: Test address-to-coordinates conversion and batch operations
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  validateCoordinates,
  formatCoordinates,
  clearGeocodingCache,
  getGeocodingCacheSize,
} from '../geocodingService';

describe('Geocoding Service', () => {
  beforeEach(() => {
    clearGeocodingCache();
  });

  describe('validateCoordinates', () => {
    it('should validate correct coordinates', () => {
      expect(validateCoordinates(16.2415, -61.5331)).toBe(true);
      expect(validateCoordinates(0, 0)).toBe(true);
      expect(validateCoordinates(90, 180)).toBe(true);
      expect(validateCoordinates(-90, -180)).toBe(true);
    });

    it('should reject invalid coordinates', () => {
      expect(validateCoordinates(91, 0)).toBe(false);
      expect(validateCoordinates(0, 181)).toBe(false);
      expect(validateCoordinates(-91, 0)).toBe(false);
      expect(validateCoordinates(0, -181)).toBe(false);
      expect(validateCoordinates(NaN, 0)).toBe(false);
      expect(validateCoordinates(0, NaN)).toBe(false);
    });
  });

  describe('formatCoordinates', () => {
    it('should format coordinates with default precision', () => {
      const result = formatCoordinates(16.2415, -61.5331);
      expect(result).toBe('16.241500, -61.533100');
    });

    it('should format coordinates with custom precision', () => {
      const result = formatCoordinates(16.2415, -61.5331, 2);
      expect(result).toBe('16.24, -61.53');
    });
  });

  describe('cache management', () => {
    it('should track cache size', () => {
      const initialSize = getGeocodingCacheSize();
      expect(typeof initialSize).toBe('number');
      expect(initialSize).toBeGreaterThanOrEqual(0);
    });

    it('should clear cache', () => {
      clearGeocodingCache();
      expect(getGeocodingCacheSize()).toBe(0);
    });
  });
});
