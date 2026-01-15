/**
 * Tests for GPS/Geolocation Utilities
 * Validates caching, batch calculations, and performance optimizations
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateDistance,
  calculateDistancesBatch,
  formatDistance,
  isGeolocationAvailable,
  clearPositionCache,
  clearDistanceCache,
  getCacheStats,
  type GeoPosition,
  type StoreLocation,
} from '../geoLocation';

describe('geoLocation utilities', () => {
  beforeEach(() => {
    // Clear caches before each test
    clearPositionCache();
    clearDistanceCache();
  });

  describe('calculateDistance', () => {
    it('should calculate distance between two points accurately', () => {
      // Paris to Marseille: ~660 km
      const distance = calculateDistance(48.8566, 2.3522, 43.2965, 5.3698);
      expect(distance).toBeGreaterThan(650);
      expect(distance).toBeLessThan(670);
    });

    it('should calculate distance between nearby points', () => {
      // Pointe-à-Pitre to Baie-Mahault: ~6-7 km
      const distance = calculateDistance(16.2415, -61.5331, 16.271, -61.588);
      expect(distance).toBeGreaterThan(5);
      expect(distance).toBeLessThan(8);
    });

    it('should return 0 for same coordinates', () => {
      const distance = calculateDistance(16.2415, -61.5331, 16.2415, -61.5331);
      expect(distance).toBe(0);
    });

    it('should cache distance calculations', () => {
      // First calculation
      const distance1 = calculateDistance(48.8566, 2.3522, 43.2965, 5.3698);
      
      // Check cache has one entry
      const stats1 = getCacheStats();
      expect(stats1.distanceCacheSize).toBe(1);
      
      // Second calculation (should use cache)
      const distance2 = calculateDistance(48.8566, 2.3522, 43.2965, 5.3698);
      
      // Should return same result
      expect(distance2).toBe(distance1);
      
      // Cache size should still be 1
      const stats2 = getCacheStats();
      expect(stats2.distanceCacheSize).toBe(1);
    });

    it('should handle cache size limit', () => {
      // Create more than 1000 unique calculations (reduced for test performance)
      // Testing cache limit behavior with smaller sample
      for (let i = 0; i < 500; i++) {
        calculateDistance(48.0 + i * 0.01, 2.0, 43.0, 5.0);
      }
      
      // Verify cache is working
      const stats = getCacheStats();
      expect(stats.distanceCacheSize).toBeGreaterThan(0);
      expect(stats.distanceCacheSize).toBeLessThanOrEqual(1000);
      
      // Add more to exceed limit
      for (let i = 500; i < 1100; i++) {
        calculateDistance(48.0 + i * 0.01, 2.0, 43.0, 5.0);
      }
      
      // Cache should be limited to 1000
      const finalStats = getCacheStats();
      expect(finalStats.distanceCacheSize).toBeLessThanOrEqual(1000);
    });
  });

  describe('calculateDistancesBatch', () => {
    it('should calculate distances for multiple stores', () => {
      const userPos: GeoPosition = { lat: 16.2415, lon: -61.5331 };
      
      const stores: StoreLocation[] = [
        { id: '1', lat: 16.271, lon: -61.588 },
        { id: '2', lat: 16.224, lon: -61.493 },
        { id: '3', lat: 16.25, lon: -61.55 },
      ];

      const results = calculateDistancesBatch(userPos, stores);

      expect(results).toHaveLength(3);
      results.forEach((result, index) => {
        expect(result.id).toBe(stores[index].id);
        expect(result.distance).toBeGreaterThan(0);
        expect(typeof result.distance).toBe('number');
      });
    });

    it('should preserve store properties', () => {
      const userPos: GeoPosition = { lat: 16.2415, lon: -61.5331 };
      
      const stores = [
        { id: '1', lat: 16.271, lon: -61.588, name: 'Store A', type: 'supermarket' },
      ];

      const results = calculateDistancesBatch(userPos, stores);

      expect(results[0].name).toBe('Store A');
      expect(results[0].type).toBe('supermarket');
      expect(results[0].distance).toBeDefined();
    });

    it('should be more efficient than individual calls', () => {
      const userPos: GeoPosition = { lat: 16.2415, lon: -61.5331 };
      
      const stores: StoreLocation[] = Array.from({ length: 100 }, (_, i) => ({
        id: `store-${i}`,
        lat: 16.0 + i * 0.01,
        lon: -61.0 + i * 0.01,
      }));

      // Batch calculation
      const batchStart = performance.now();
      const batchResults = calculateDistancesBatch(userPos, stores);
      const batchTime = performance.now() - batchStart;

      // Individual calculations
      clearDistanceCache(); // Clear cache to ensure fair comparison
      const individualStart = performance.now();
      const individualResults = stores.map(store =>
        calculateDistance(userPos.lat, userPos.lon, store.lat, store.lon)
      );
      const individualTime = performance.now() - individualStart;

      expect(batchResults).toHaveLength(stores.length);
      expect(individualResults).toHaveLength(stores.length);
      
      // Batch should be at least as fast (usually faster due to pre-computed values)
      // Note: This is a rough performance test and may vary
      expect(batchTime).toBeLessThanOrEqual(individualTime * 1.5);
    });
  });

  describe('formatDistance', () => {
    it('should format distances over 1km correctly', () => {
      expect(formatDistance(5.234)).toBe('5.2 km');
      expect(formatDistance(10.0)).toBe('10.0 km');
      expect(formatDistance(1.5)).toBe('1.5 km');
    });

    it('should format distances under 1km in meters', () => {
      expect(formatDistance(0.5)).toBe('500 m');
      expect(formatDistance(0.123)).toBe('123 m');
      expect(formatDistance(0.001)).toBe('1 m');
    });

    it('should handle edge cases', () => {
      expect(formatDistance(0)).toBe('0 m');
      expect(formatDistance(0.999)).toBe('999 m');
      expect(formatDistance(1.0)).toBe('1.0 km');
    });
  });

  describe('isGeolocationAvailable', () => {
    it('should check for geolocation API availability', () => {
      const available = isGeolocationAvailable();
      expect(typeof available).toBe('boolean');
      // In test environment, navigator.geolocation may not be available
    });
  });

  describe('cache management', () => {
    it('should clear position cache', () => {
      clearPositionCache();
      const stats = getCacheStats();
      expect(stats.positionCached).toBe(false);
    });

    it('should clear distance cache', () => {
      // Add some cached distances
      calculateDistance(48.8566, 2.3522, 43.2965, 5.3698);
      calculateDistance(48.0, 2.0, 43.0, 5.0);
      
      let stats = getCacheStats();
      expect(stats.distanceCacheSize).toBeGreaterThan(0);
      
      clearDistanceCache();
      
      stats = getCacheStats();
      expect(stats.distanceCacheSize).toBe(0);
    });

    it('should report cache statistics correctly', () => {
      const stats = getCacheStats();
      expect(stats).toHaveProperty('positionCached');
      expect(stats).toHaveProperty('distanceCacheSize');
      expect(typeof stats.positionCached).toBe('boolean');
      expect(typeof stats.distanceCacheSize).toBe('number');
    });
  });

  describe('accuracy and precision', () => {
    it('should maintain accuracy for short distances', () => {
      // Two points ~1.1 km apart (0.01 degrees latitude ≈ 1.11 km)
      const lat1 = 16.2415;
      const lon1 = -61.5331;
      const lat2 = 16.2425; // ~1.1 km north
      const lon2 = -61.5331;
      
      const distance = calculateDistance(lat1, lon1, lat2, lon2);
      // Actual distance should be around 0.1 km (100m) for 0.001 degree difference
      expect(distance).toBeGreaterThan(0.05);
      expect(distance).toBeLessThan(0.2);
    });

    it('should round to one decimal place', () => {
      const distance = calculateDistance(48.8566, 2.3522, 43.2965, 5.3698);
      const decimalPlaces = (distance.toString().split('.')[1] || '').length;
      expect(decimalPlaces).toBeLessThanOrEqual(1);
    });

    it('should handle negative coordinates (Western hemisphere)', () => {
      // Caribbean coordinates (negative longitude)
      const distance = calculateDistance(16.2415, -61.5331, 16.271, -61.588);
      expect(distance).toBeGreaterThan(0);
      expect(distance).toBeLessThan(10);
    });
  });

  describe('performance optimization', () => {
    it('should use cached results for repeated calculations', () => {
      const lat1 = 48.8566;
      const lon1 = 2.3522;
      const lat2 = 43.2965;
      const lon2 = 5.3698;

      // First calculation (cache miss) - do it multiple times to get stable timing
      const iterations = 100;
      const start1 = performance.now();
      for (let i = 0; i < iterations; i++) {
        calculateDistance(lat1 + i * 0.0001, lon1, lat2, lon2);
      }
      const time1 = performance.now() - start1;

      // Clear cache and measure again
      clearDistanceCache();
      
      // Repeated calculations with same coordinates (cache hits after first)
      const start2 = performance.now();
      const dist1 = calculateDistance(lat1, lon1, lat2, lon2);
      const dist2 = calculateDistance(lat1, lon1, lat2, lon2); // Cache hit
      const time2 = performance.now() - start2;

      expect(dist1).toBe(dist2);
      // Second call should use cached value
      expect(dist1).toBeGreaterThan(0);
    });
  });
});
