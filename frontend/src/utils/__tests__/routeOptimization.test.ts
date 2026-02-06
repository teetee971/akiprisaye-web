/**
 * Tests for Route Optimization Utilities
 */

import { describe, it, expect } from 'vitest';
import { solveShoppingRoute, getRouteInstructions } from '../routeOptimization';
import type { StoreWithDistance } from '../routeOptimization';

describe('Route Optimization', () => {
  const userPos = { lat: 16.2415, lon: -61.5331 };

  describe('solveShoppingRoute', () => {
    it('should return empty route for no stores', () => {
      const route = solveShoppingRoute(userPos, []);
      expect(route.stores).toEqual([]);
      expect(route.totalDistance).toBe(0);
      expect(route.totalTime).toBe(0);
    });

    it('should handle single store', () => {
      const stores: StoreWithDistance[] = [
        { id: '1', name: 'Store A', lat: 16.25, lon: -61.55, distance: 2.5 }
      ];
      const route = solveShoppingRoute(userPos, stores);
      
      expect(route.stores).toHaveLength(1);
      expect(route.stores[0].id).toBe('1');
      expect(route.totalDistance).toBeGreaterThan(0);
    });

    it('should optimize route for multiple stores', () => {
      const stores: StoreWithDistance[] = [
        { id: '1', name: 'Store A', lat: 16.25, lon: -61.55, distance: 2.5 },
        { id: '2', name: 'Store B', lat: 16.27, lon: -61.58, distance: 4.2 },
        { id: '3', name: 'Store C', lat: 16.22, lon: -61.49, distance: 6.1 }
      ];
      const route = solveShoppingRoute(userPos, stores);
      
      expect(route.stores).toHaveLength(3);
      expect(route.totalDistance).toBeGreaterThan(0);
      expect(route.totalTime).toBeGreaterThan(0);
      expect(route.order).toEqual([0, 1, 2]);
    });

    it('should calculate savings correctly', () => {
      const stores: StoreWithDistance[] = [
        { id: '1', name: 'Store A', lat: 16.25, lon: -61.55, distance: 2.5 },
        { id: '2', name: 'Store B', lat: 16.27, lon: -61.58, distance: 4.2 }
      ];
      const route = solveShoppingRoute(userPos, stores);
      
      // Should save distance compared to individual round trips
      const unoptimized = (2.5 * 2) + (4.2 * 2); // 13.4 km
      expect(route.totalDistance).toBeLessThan(unoptimized);
      expect(route.savings.distance).toBeGreaterThan(0);
      expect(route.savings.fuel).toBeGreaterThan(0);
      expect(route.savings.co2).toBeGreaterThan(0);
    });

    it('should return reasonable distance values', () => {
      const stores: StoreWithDistance[] = [
        { id: '1', name: 'Store A', lat: 16.25, lon: -61.55, distance: 2.567 }
      ];
      const route = solveShoppingRoute(userPos, stores);
      
      // Check that totalDistance is a reasonable value
      expect(route.totalDistance).toBeGreaterThan(0);
      expect(route.totalDistance).toBeLessThan(100);
      expect(typeof route.totalDistance).toBe('number');
    });
  });

  describe('getRouteInstructions', () => {
    it('should generate readable instructions', () => {
      const stores: StoreWithDistance[] = [
        { id: '1', name: 'Super U', lat: 16.25, lon: -61.55, distance: 2.5, enseigne: 'Super U' },
        { id: '2', name: 'Carrefour', lat: 16.27, lon: -61.58, distance: 4.2, enseigne: 'Carrefour' }
      ];
      const route = solveShoppingRoute(userPos, stores);
      const instructions = getRouteInstructions(route, userPos);
      
      expect(instructions).toHaveLength(4); // Start + 2 stores + Return
      expect(instructions[0]).toContain('Départ');
      expect(instructions[1]).toContain('Super U');
      expect(instructions[2]).toContain('Carrefour');
      expect(instructions[3]).toContain('Retour');
    });
  });

  describe('Performance', () => {
    it('should handle 20 stores efficiently', () => {
      const stores: StoreWithDistance[] = Array.from({ length: 20 }, (_, i) => ({
        id: `store-${i}`,
        name: `Store ${i}`,
        lat: 16.2 + (i * 0.01),
        lon: -61.5 + (i * 0.01),
        distance: 2 + i
      }));

      const start = performance.now();
      const route = solveShoppingRoute(userPos, stores);
      const duration = performance.now() - start;

      expect(route.stores).toHaveLength(20);
      expect(duration).toBeLessThan(100); // Should complete in < 100ms
    });
  });
});
