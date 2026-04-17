/**
 * Test suite for stores data
 */

import { describe, it, expect } from 'vitest';
import {
  SEED_STORES,
  getStoreById,
  getStoresByTerritory,
  getAllStores,
  searchStores,
  getStoresByChain,
  getAvailableTerritories,
  getTerritoryNameFromCode,
} from '../data/seedStores.js';

describe('Stores Data', () => {
  describe('SEED_STORES', () => {
    it('should have stores defined', () => {
      expect(SEED_STORES).toBeDefined();
      expect(Array.isArray(SEED_STORES)).toBe(true);
      expect(SEED_STORES.length).toBeGreaterThan(0);
    });

    it('should have valid store structure', () => {
      const store = SEED_STORES[0];
      expect(store).toHaveProperty('id');
      expect(store).toHaveProperty('name');
      expect(store).toHaveProperty('chain');
      expect(store).toHaveProperty('territory');
      expect(store).toHaveProperty('city');
      expect(store).toHaveProperty('coordinates');
      expect(store.coordinates).toHaveProperty('lat');
      expect(store.coordinates).toHaveProperty('lon');
    });

    it('should have unique store IDs', () => {
      const ids = SEED_STORES.map((s) => s.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have valid coordinates', () => {
      SEED_STORES.forEach((store) => {
        expect(store.coordinates.lat).toBeTypeOf('number');
        expect(store.coordinates.lon).toBeTypeOf('number');
        expect(store.coordinates.lat).toBeGreaterThanOrEqual(-90);
        expect(store.coordinates.lat).toBeLessThanOrEqual(90);
        expect(store.coordinates.lon).toBeGreaterThanOrEqual(-180);
        expect(store.coordinates.lon).toBeLessThanOrEqual(180);
      });
    });
  });

  describe('getStoreById', () => {
    it('should return store by ID', () => {
      const store = getStoreById('carrefour_baie_mahault');
      expect(store).toBeDefined();
      expect(store.name).toBe('Carrefour Baie-Mahault');
      expect(store.territory).toBe('Guadeloupe');
    });

    it('should return null for non-existent ID', () => {
      const store = getStoreById('non_existent_store');
      expect(store).toBeNull();
    });
  });

  describe('getStoresByTerritory', () => {
    it('should return stores for Guadeloupe', () => {
      const stores = getStoresByTerritory('Guadeloupe');
      expect(stores.length).toBeGreaterThan(0);
      stores.forEach((store) => {
        expect(store.territory).toBe('Guadeloupe');
      });
    });

    it('should return all stores when territory is "all"', () => {
      const stores = getStoresByTerritory('all');
      expect(stores.length).toBe(SEED_STORES.length);
    });

    it('should be case insensitive', () => {
      const stores1 = getStoresByTerritory('Guadeloupe');
      const stores2 = getStoresByTerritory('guadeloupe');
      expect(stores1.length).toBe(stores2.length);
    });

    it('should return empty array for unknown territory', () => {
      const stores = getStoresByTerritory('Unknown Territory');
      expect(stores).toEqual([]);
    });
  });

  describe('getAllStores', () => {
    it('should return all stores', () => {
      const stores = getAllStores();
      expect(stores.length).toBe(SEED_STORES.length);
    });
  });

  describe('searchStores', () => {
    it('should search by store name', () => {
      const results = searchStores('Carrefour');
      expect(results.length).toBeGreaterThan(0);
      results.forEach((store) => {
        expect(store.name.toLowerCase()).toContain('carrefour');
      });
    });

    it('should search by city', () => {
      const results = searchStores('Saint-Denis');
      expect(results.length).toBeGreaterThan(0);
      results.forEach((store) => {
        expect(store.city.toLowerCase()).toContain('saint-denis');
      });
    });

    it('should return empty for short query', () => {
      const results = searchStores('a');
      expect(results).toEqual([]);
    });

    it('should return empty for empty query', () => {
      const results = searchStores('');
      expect(results).toEqual([]);
    });
  });

  describe('getStoresByChain', () => {
    it('should return stores by chain name', () => {
      const stores = getStoresByChain('Carrefour');
      expect(stores.length).toBeGreaterThan(0);
      stores.forEach((store) => {
        expect(store.chain).toBe('Carrefour');
      });
    });

    it('should be case insensitive', () => {
      const stores1 = getStoresByChain('Carrefour');
      const stores2 = getStoresByChain('carrefour');
      expect(stores1.length).toBe(stores2.length);
    });
  });

  describe('getAvailableTerritories', () => {
    it('should return sorted list of territories', () => {
      const territories = getAvailableTerritories();
      expect(territories.length).toBeGreaterThan(0);
      expect(territories).toContain('Guadeloupe');
      expect(territories).toContain('Martinique');

      // Check if sorted
      const sorted = [...territories].sort();
      expect(territories).toEqual(sorted);
    });
  });

  describe('getTerritoryNameFromCode', () => {
    it('should convert territory code to name', () => {
      expect(getTerritoryNameFromCode('guadeloupe')).toBe('Guadeloupe');
      expect(getTerritoryNameFromCode('martinique')).toBe('Martinique');
      expect(getTerritoryNameFromCode('reunion')).toBe('La Réunion');
    });

    it('should return code if mapping not found', () => {
      expect(getTerritoryNameFromCode('unknown')).toBe('unknown');
    });
  });

  describe('Territory Coverage', () => {
    it('should have stores for main territories', () => {
      const mainTerritories = ['Guadeloupe', 'Martinique', 'Guyane', 'La Réunion', 'Mayotte'];

      mainTerritories.forEach((territory) => {
        const stores = getStoresByTerritory(territory);
        expect(stores.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Stores consistency with seedProducts', () => {
    it('should have stores referenced in seedProducts', () => {
      // Common store IDs from seedProducts.js
      const productStoreIds = [
        'superu_petit_canal',
        'carrefour_baie_mahault',
        'leader_price_pointe_pitre',
        'super_score_fort_de_france',
        'hyper_u_saint_denis',
        'hyper_u_cayenne',
      ];

      productStoreIds.forEach((storeId) => {
        const store = getStoreById(storeId);
        expect(store).not.toBeNull();
        expect(store).toBeDefined();
      });
    });
  });
});
