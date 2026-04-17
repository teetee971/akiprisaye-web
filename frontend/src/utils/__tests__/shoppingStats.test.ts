/**
 * Tests for Shopping Statistics
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { loadStats, saveStats, trackTrip, clearStats, getBadges } from '../shoppingStats';

describe('Shopping Statistics', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    // Clean up after each test
    localStorage.clear();
  });

  describe('loadStats', () => {
    it('should return default stats when nothing stored', () => {
      const stats = loadStats();

      expect(stats.totalTrips).toBe(0);
      expect(stats.totalDistance).toBe(0);
      expect(stats.fuelSaved).toBe(0);
      expect(stats.co2Saved).toBe(0);
      expect(stats.favoriteStores).toEqual([]);
      expect(stats.mostBoughtProducts).toEqual([]);
    });

    it('should load existing stats from localStorage', () => {
      const existingStats = {
        totalTrips: 5,
        totalDistance: 25.5,
        fuelSaved: 2.3,
        co2Saved: 5.29,
        favoriteStores: ['Store A'],
        mostBoughtProducts: ['Pâtes'],
        lastUpdated: Date.now(),
      };

      localStorage.setItem('shopping-stats-v1', JSON.stringify(existingStats));
      const stats = loadStats();

      expect(stats.totalTrips).toBe(5);
      expect(stats.totalDistance).toBe(25.5);
      expect(stats.favoriteStores).toEqual(['Store A']);
    });

    it('should handle corrupted data gracefully', () => {
      localStorage.setItem('shopping-stats-v1', 'invalid json');
      const stats = loadStats();

      expect(stats).toBeDefined();
      expect(stats.totalTrips).toBe(0);
    });
  });

  describe('saveStats', () => {
    it('should save stats to localStorage', () => {
      const stats = {
        totalTrips: 3,
        totalDistance: 15.2,
        fuelSaved: 1.5,
        co2Saved: 3.45,
        favoriteStores: ['Store A', 'Store B'],
        mostBoughtProducts: ['Pâtes', 'Riz'],
        lastUpdated: Date.now(),
      };

      saveStats(stats);

      const stored = localStorage.getItem('shopping-stats-v1');
      expect(stored).toBeDefined();

      const parsed = JSON.parse(stored!);
      expect(parsed.totalTrips).toBe(3);
      expect(parsed.favoriteStores).toEqual(['Store A', 'Store B']);
    });

    it('should update lastUpdated timestamp', () => {
      const stats = {
        totalTrips: 1,
        totalDistance: 5,
        fuelSaved: 0.5,
        co2Saved: 1.15,
        favoriteStores: [],
        mostBoughtProducts: [],
        lastUpdated: 0,
      };

      const before = Date.now();
      saveStats(stats);
      const after = Date.now();

      const stored = JSON.parse(localStorage.getItem('shopping-stats-v1')!);
      expect(stored.lastUpdated).toBeGreaterThanOrEqual(before);
      expect(stored.lastUpdated).toBeLessThanOrEqual(after);
    });
  });

  describe('trackTrip', () => {
    it('should increment total trips', () => {
      const stats = trackTrip(5.5, ['Store A'], ['Pâtes'], 0.5, 1.15);

      expect(stats.totalTrips).toBe(1);
    });

    it('should accumulate distance', () => {
      trackTrip(5.5, ['Store A'], ['Pâtes'], 0.5, 1.15);
      const stats = trackTrip(3.2, ['Store B'], ['Riz'], 0.3, 0.69);

      expect(stats.totalDistance).toBeCloseTo(8.7, 1);
    });

    it('should accumulate fuel savings', () => {
      trackTrip(5.5, ['Store A'], ['Pâtes'], 0.5, 1.15);
      const stats = trackTrip(3.2, ['Store B'], ['Riz'], 0.3, 0.69);

      expect(stats.fuelSaved).toBeCloseTo(0.8, 1);
    });

    it('should accumulate CO2 savings', () => {
      trackTrip(5.5, ['Store A'], ['Pâtes'], 0.5, 1.15);
      const stats = trackTrip(3.2, ['Store B'], ['Riz'], 0.3, 0.69);

      expect(stats.co2Saved).toBeCloseTo(1.84, 1);
    });

    it('should track favorite stores', () => {
      trackTrip(5.5, ['Store A'], ['Pâtes'], 0.5, 1.15);
      const stats = trackTrip(3.2, ['Store B', 'Store C'], ['Riz'], 0.3, 0.69);

      expect(stats.favoriteStores).toContain('Store A');
      expect(stats.favoriteStores).toContain('Store B');
      expect(stats.favoriteStores).toContain('Store C');
    });

    it('should track bought products', () => {
      trackTrip(5.5, ['Store A'], ['Pâtes', 'Riz'], 0.5, 1.15);
      const stats = trackTrip(3.2, ['Store B'], ['Pain'], 0.3, 0.69);

      expect(stats.mostBoughtProducts).toContain('Pâtes');
      expect(stats.mostBoughtProducts).toContain('Riz');
      expect(stats.mostBoughtProducts).toContain('Pain');
    });

    it('should not duplicate stores', () => {
      trackTrip(5.5, ['Store A'], ['Pâtes'], 0.5, 1.15);
      const stats = trackTrip(3.2, ['Store A'], ['Riz'], 0.3, 0.69);

      const storeCount = stats.favoriteStores.filter((s) => s === 'Store A').length;
      expect(storeCount).toBe(1);
    });
  });

  describe('clearStats', () => {
    it('should remove stats from localStorage', () => {
      const stats = trackTrip(5.5, ['Store A'], ['Pâtes'], 0.5, 1.15);
      expect(localStorage.getItem('shopping-stats-v1')).toBeDefined();

      clearStats();

      expect(localStorage.getItem('shopping-stats-v1')).toBeNull();
    });
  });

  describe('getBadges', () => {
    it('should return all badge definitions', () => {
      const stats = loadStats();
      const badges = getBadges(stats);

      expect(badges.length).toBeGreaterThan(0);
      badges.forEach((badge) => {
        expect(badge.id).toBeDefined();
        expect(badge.name).toBeDefined();
        expect(badge.icon).toBeDefined();
        expect(badge.description).toBeDefined();
        expect(typeof badge.unlocked).toBe('boolean');
      });
    });

    it('should unlock first trip badge', () => {
      const stats = trackTrip(5.5, ['Store A'], ['Pâtes'], 0.5, 1.15);
      const badges = getBadges(stats);

      const firstTripBadge = badges.find((b) => b.id === 'first_trip');
      expect(firstTripBadge?.unlocked).toBe(true);
    });

    it('should not unlock badges before reaching target', () => {
      const stats = trackTrip(5.5, ['Store A'], ['Pâtes'], 0.5, 1.15);
      const badges = getBadges(stats);

      const ecoWarrior = badges.find((b) => b.id === 'eco_warrior');
      expect(ecoWarrior?.unlocked).toBe(false);
      expect(ecoWarrior?.progress).toBeLessThan(ecoWarrior?.target || 100);
    });

    it('should track progress towards badges', () => {
      const stats = trackTrip(5.5, ['Store A'], ['Pâtes'], 25, 57.5);
      const badges = getBadges(stats);

      const fuelSaver = badges.find((b) => b.id === 'fuel_saver');
      expect(fuelSaver?.progress).toBe(25);
      expect(fuelSaver?.target).toBe(50);
      expect(fuelSaver?.unlocked).toBe(false);
    });

    it('should unlock multiple badges', () => {
      // Track enough trips to unlock multiple badges
      for (let i = 0; i < 25; i++) {
        trackTrip(25, ['Store A'], ['Pâtes'], 3, 6.9);
      }

      const stats = loadStats();
      const badges = getBadges(stats);
      const unlockedBadges = badges.filter((b) => b.unlocked);

      expect(unlockedBadges.length).toBeGreaterThan(1);
    });
  });
});
