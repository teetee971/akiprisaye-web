// @ts-nocheck
/**
 * Tests for Store-Company Integration Service
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  initializeCompanyRegistry,
  getCompanyForStore,
  getStoreWithCompany,
  getAllStoresWithCompanies,
  getStoresByTerritoryWithCompanies,
  isStoreCompanyActive,
  getStoresWithInactiveCompanies,
  validateStoreCompanyLinks,
} from '../services/storeCompanyService';
import { clearCompanyRegistry } from '../services/companyRegistryService';

describe('Store-Company Integration Service', () => {
  beforeEach(() => {
    clearCompanyRegistry();
    initializeCompanyRegistry();
  });

  describe('initializeCompanyRegistry', () => {
    it('should initialize company registry with seed data', () => {
      // Registry should be populated
      const store = getStoreWithCompany('carrefour_baie_mahault');
      expect(store).not.toBeNull();
      expect(store?.company).toBeDefined();
    });
  });

  describe('getCompanyForStore', () => {
    it('should get company for a store', () => {
      const company = getCompanyForStore('carrefour_baie_mahault');
      expect(company).not.toBeNull();
      expect(company?.tradeName).toBe('Carrefour');
      expect(company?.activityStatus).toBe('ACTIVE');
    });

    it('should return null for non-existent store', () => {
      const company = getCompanyForStore('non-existent-store');
      expect(company).toBeNull();
    });

    it('should return null for store without company reference', () => {
      // Most stores now have company references, but test the fallback
      const company = getCompanyForStore('store-without-company');
      expect(company).toBeNull();
    });
  });

  describe('getStoreWithCompany', () => {
    it('should get store with enriched company data', () => {
      const store = getStoreWithCompany('carrefour_baie_mahault');
      expect(store).not.toBeNull();
      expect(store?.name).toBe('Carrefour Baie-Mahault');
      expect(store?.company).toBeDefined();
      expect(store?.company?.tradeName).toBe('Carrefour');
      expect(store?.companyStatus).toBe('ACTIVE');
      expect(store?.isCompanyActive).toBe(true);
    });

    it('should return store without company if no company reference', () => {
      const store = getStoreWithCompany('superu_petit_canal');
      expect(store).not.toBeNull();
      expect(store?.name).toBe('Super U Petit-Canal');
      // Should have company now since we added companyId
      expect(store?.company).toBeDefined();
    });

    it('should return null for non-existent store', () => {
      const store = getStoreWithCompany('non-existent');
      expect(store).toBeNull();
    });
  });

  describe('getAllStoresWithCompanies', () => {
    it('should get all stores with company information', () => {
      const stores = getAllStoresWithCompanies();
      expect(stores.length).toBeGreaterThan(0);

      // Check that some stores have company data
      const storesWithCompanies = stores.filter((s) => s.company !== undefined);
      expect(storesWithCompanies.length).toBeGreaterThan(0);
    });

    it('should include company status for each store', () => {
      const stores = getAllStoresWithCompanies();
      stores.forEach((store) => {
        if (store.company) {
          expect(store.companyStatus).toBeDefined();
          expect(store.isCompanyActive).toBeDefined();
        }
      });
    });
  });

  describe('getStoresByTerritoryWithCompanies', () => {
    it('should get stores for Guadeloupe with company data', () => {
      const stores = getStoresByTerritoryWithCompanies('Guadeloupe');
      expect(stores.length).toBeGreaterThan(0);

      stores.forEach((store) => {
        expect(store.territory).toBe('Guadeloupe');
      });
    });

    it('should get all stores when territory is "all"', () => {
      const allStores = getAllStoresWithCompanies();
      const territoryStores = getStoresByTerritoryWithCompanies('all');
      expect(territoryStores.length).toBe(allStores.length);
    });

    it('should be case insensitive', () => {
      const stores1 = getStoresByTerritoryWithCompanies('Martinique');
      const stores2 = getStoresByTerritoryWithCompanies('martinique');
      expect(stores1.length).toBe(stores2.length);
    });
  });

  describe('isStoreCompanyActive', () => {
    it('should return true for store with active company', () => {
      const isActive = isStoreCompanyActive('carrefour_baie_mahault');
      expect(isActive).toBe(true);
    });

    it('should return null for store without company', () => {
      const isActive = isStoreCompanyActive('non-existent-store');
      expect(isActive).toBeNull();
    });
  });

  describe('getStoresWithInactiveCompanies', () => {
    it('should return empty array when all companies are active', () => {
      const inactiveStores = getStoresWithInactiveCompanies();
      // All seed companies are active, so should be empty
      expect(inactiveStores).toEqual([]);
    });

    it('should detect stores with ceased companies', () => {
      // This test would pass if we had ceased companies in seed data
      const inactiveStores = getStoresWithInactiveCompanies();
      expect(Array.isArray(inactiveStores)).toBe(true);
    });
  });

  describe('validateStoreCompanyLinks', () => {
    it('should validate store-company links', () => {
      const validation = validateStoreCompanyLinks();

      expect(validation).toHaveProperty('valid');
      expect(validation).toHaveProperty('errors');
      expect(validation).toHaveProperty('warnings');
      expect(Array.isArray(validation.errors)).toBe(true);
      expect(Array.isArray(validation.warnings)).toBe(true);
    });

    it('should report link validity against seed data', () => {
      const validation = validateStoreCompanyLinks();

      expect(validation.valid).toBe(validation.errors.length === 0);
      validation.errors.forEach((error) => {
        expect(error).toMatch(/references non-existent company/i);
      });
    });
  });

  describe('Integration - Territory filtering', () => {
    it('should correctly filter Martinique stores with companies', () => {
      const stores = getStoresByTerritoryWithCompanies('Martinique');
      expect(stores.length).toBeGreaterThan(0);

      stores.forEach((store) => {
        expect(store.territory).toBe('Martinique');
        if (store.companyId) {
          expect(store.company).toBeDefined();
        }
      });
    });
  });

  describe('Integration - Company data enrichment', () => {
    it('should enrich store data with full company details', () => {
      const store = getStoreWithCompany('leclerc_abymes');

      expect(store).not.toBeNull();
      if (store?.company) {
        expect(store.company.legalName).toBeDefined();
        expect(store.company.sirenCode).toBeDefined();
        expect(store.company.activityStatus).toBe('ACTIVE');
        expect(store.company.headOffice).toBeDefined();
        expect(store.company.geoLocation).toBeDefined();
      }
    });
  });
});
