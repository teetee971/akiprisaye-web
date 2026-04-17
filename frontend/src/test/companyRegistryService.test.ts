/**
 * Tests for Company Registry Service
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  registerCompany,
  getCompanyBySiret,
  getCompaniesBySiren,
  getCompanyByVat,
  getCompanyById,
  getCompany,
  searchCompanies,
  getAllCompanies,
  clearCompanyRegistry,
  getCompanyCount,
  isCompanyActive,
  getEstablishments,
  getHeadquarters,
} from '../services/companyRegistryService';
import type { Company } from '../types/company';

describe('Company Registry Service', () => {
  // Test data
  const testCompany1: Company = {
    id: 'company-001',
    siretCode: '73282932000074',
    sirenCode: '732829320',
    vatCode: 'FR32732829320',
    legalName: 'Carrefour Baie-Mahault',
    tradeName: 'Carrefour',
    activityStatus: 'ACTIVE',
    creationDate: '2010-01-15',
    headOffice: {
      streetNumber: '1',
      streetName: 'Centre Commercial Destrelande',
      city: 'Baie-Mahault',
      department: '971',
      postalCode: '97122',
      country: 'France',
    },
    geoLocation: {
      latitude: 16.2676,
      longitude: -61.5252,
    },
    lastUpdate: '2024-12-18T12:00:00Z',
    source: 'REGISTRE_ENTREPRISES',
  };

  const testCompany2: Company = {
    id: 'company-002',
    siretCode: '35600000000048',
    sirenCode: '356000000',
    vatCode: 'FR68356000000',
    legalName: 'Société Française des Magasins',
    activityStatus: 'ACTIVE',
    creationDate: '2005-03-20',
    headOffice: {
      streetName: 'Avenue des Champs',
      city: 'Fort-de-France',
      department: '972',
      postalCode: '97200',
      country: 'France',
    },
    geoLocation: {
      latitude: 14.6078,
      longitude: -61.0595,
    },
    lastUpdate: '2024-12-18T12:00:00Z',
    source: 'API_PUBLIQUE',
  };

  const testCompany3Ceased: Company = {
    id: 'company-003',
    siretCode: '12345678900001',
    sirenCode: '123456789',
    legalName: 'Ancien Magasin SARL',
    activityStatus: 'CEASED',
    creationDate: '2000-01-01',
    cessationDate: '2023-12-31',
    headOffice: {
      streetName: 'Rue Fermée',
      city: 'Cayenne',
      department: '973',
      postalCode: '97300',
      country: 'France',
    },
    geoLocation: {
      latitude: 4.938,
      longitude: -52.33,
    },
    lastUpdate: '2024-01-01T00:00:00Z',
    source: 'VALIDATION_INTERNE',
  };

  // Second establishment for same SIREN
  const testCompany4SameSiren: Company = {
    id: 'company-004',
    siretCode: '73282932000082',
    sirenCode: '732829320', // Same SIREN as company-001
    vatCode: 'FR32732829320',
    legalName: 'Carrefour Pointe-à-Pitre',
    tradeName: 'Carrefour',
    activityStatus: 'ACTIVE',
    creationDate: '2015-06-10',
    headOffice: {
      streetName: 'Centre Commercial',
      city: 'Pointe-à-Pitre',
      department: '971',
      postalCode: '97110',
      country: 'France',
    },
    geoLocation: {
      latitude: 16.2415,
      longitude: -61.5331,
    },
    lastUpdate: '2024-12-18T12:00:00Z',
    source: 'REGISTRE_ENTREPRISES',
  };

  beforeEach(() => {
    // Clear registry before each test
    clearCompanyRegistry();
  });

  describe('registerCompany', () => {
    it('should register a company', () => {
      registerCompany(testCompany1);
      expect(getCompanyCount()).toBe(1);
    });

    it('should register multiple companies', () => {
      registerCompany(testCompany1);
      registerCompany(testCompany2);
      expect(getCompanyCount()).toBe(2);
    });

    it('should update existing company if re-registered', () => {
      registerCompany(testCompany1);
      const updated = { ...testCompany1, legalName: 'Updated Name' };
      registerCompany(updated);

      const company = getCompanyById(testCompany1.id);
      expect(company?.legalName).toBe('Updated Name');
      expect(getCompanyCount()).toBe(1);
    });
  });

  describe('getCompanyBySiret', () => {
    beforeEach(() => {
      registerCompany(testCompany1);
      registerCompany(testCompany2);
    });

    it('should find company by SIRET', () => {
      const company = getCompanyBySiret('73282932000074');
      expect(company).not.toBeNull();
      expect(company?.id).toBe('company-001');
      expect(company?.legalName).toBe('Carrefour Baie-Mahault');
    });

    it('should handle SIRET with spaces', () => {
      const company = getCompanyBySiret('732 829 320 00074');
      expect(company).not.toBeNull();
      expect(company?.id).toBe('company-001');
    });

    it('should return null for non-existent SIRET', () => {
      const company = getCompanyBySiret('99999999999999');
      expect(company).toBeNull();
    });

    it('should return null for invalid SIRET', () => {
      const company = getCompanyBySiret('invalid');
      expect(company).toBeNull();
    });
  });

  describe('getCompaniesBySiren', () => {
    beforeEach(() => {
      registerCompany(testCompany1);
      registerCompany(testCompany2);
      registerCompany(testCompany4SameSiren);
    });

    it('should find all companies with same SIREN', () => {
      const companies = getCompaniesBySiren('732829320');
      expect(companies).toHaveLength(2);
      expect(companies.map((c) => c.id)).toContain('company-001');
      expect(companies.map((c) => c.id)).toContain('company-004');
    });

    it('should find single company by SIREN', () => {
      const companies = getCompaniesBySiren('356000000');
      expect(companies).toHaveLength(1);
      expect(companies[0].id).toBe('company-002');
    });

    it('should return empty array for non-existent SIREN', () => {
      const companies = getCompaniesBySiren('999999999');
      expect(companies).toHaveLength(0);
    });

    it('should handle SIREN with spaces', () => {
      const companies = getCompaniesBySiren('732 829 320');
      expect(companies).toHaveLength(2);
    });
  });

  describe('getCompanyByVat', () => {
    beforeEach(() => {
      registerCompany(testCompany1);
      registerCompany(testCompany2);
    });

    it('should find company by VAT code', () => {
      const company = getCompanyByVat('FR32732829320');
      expect(company).not.toBeNull();
      expect(company?.id).toBe('company-001');
    });

    it('should be case insensitive', () => {
      const company = getCompanyByVat('fr32732829320');
      expect(company).not.toBeNull();
      expect(company?.id).toBe('company-001');
    });

    it('should handle VAT with spaces', () => {
      const company = getCompanyByVat('FR 32 732829320');
      expect(company).not.toBeNull();
      expect(company?.id).toBe('company-001');
    });

    it('should return null for non-existent VAT', () => {
      const company = getCompanyByVat('FR99999999999');
      expect(company).toBeNull();
    });
  });

  describe('getCompanyById', () => {
    beforeEach(() => {
      registerCompany(testCompany1);
      registerCompany(testCompany2);
    });

    it('should find company by ID', () => {
      const company = getCompanyById('company-001');
      expect(company).not.toBeNull();
      expect(company?.legalName).toBe('Carrefour Baie-Mahault');
    });

    it('should return null for non-existent ID', () => {
      const company = getCompanyById('non-existent');
      expect(company).toBeNull();
    });
  });

  describe('getCompany - Unified Lookup', () => {
    beforeEach(() => {
      registerCompany(testCompany1);
      registerCompany(testCompany2);
    });

    it('should find company by internal ID', () => {
      const company = getCompany('company-001');
      expect(company).not.toBeNull();
      expect(company?.id).toBe('company-001');
    });

    it('should find company by SIRET', () => {
      const company = getCompany('73282932000074');
      expect(company).not.toBeNull();
      expect(company?.id).toBe('company-001');
    });

    it('should find company by SIREN', () => {
      const company = getCompany('732829320');
      expect(company).not.toBeNull();
      expect(company?.id).toBe('company-001');
    });

    it('should find company by VAT', () => {
      const company = getCompany('FR32732829320');
      expect(company).not.toBeNull();
      expect(company?.id).toBe('company-001');
    });

    it('should return null for invalid identifier', () => {
      const company = getCompany('invalid-id-12345');
      expect(company).toBeNull();
    });

    it('should return null for empty string', () => {
      const company = getCompany('');
      expect(company).toBeNull();
    });
  });

  describe('searchCompanies', () => {
    beforeEach(() => {
      registerCompany(testCompany1);
      registerCompany(testCompany2);
      registerCompany(testCompany3Ceased);
    });

    it('should search by SIRET', () => {
      const results = searchCompanies({ siretCode: '73282932000074' });
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('company-001');
    });

    it('should search by SIREN', () => {
      const results = searchCompanies({ sirenCode: '732829320' });
      expect(results.length).toBeGreaterThanOrEqual(1);
    });

    it('should search by legal name', () => {
      const results = searchCompanies({ legalName: 'Carrefour' });
      expect(results).toHaveLength(1);
      expect(results[0].legalName).toBe('Carrefour Baie-Mahault');
    });

    it('should search by territory/department', () => {
      const results = searchCompanies({ territory: '971' });
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results[0].headOffice.department).toBe('971');
    });

    it('should return empty array when no matches', () => {
      const results = searchCompanies({ legalName: 'NonExistentCompany' });
      expect(results).toHaveLength(0);
    });
  });

  describe('getAllCompanies', () => {
    it('should return empty array when no companies', () => {
      expect(getAllCompanies()).toHaveLength(0);
    });

    it('should return all registered companies', () => {
      registerCompany(testCompany1);
      registerCompany(testCompany2);
      registerCompany(testCompany3Ceased);

      const companies = getAllCompanies();
      expect(companies).toHaveLength(3);
    });
  });

  describe('isCompanyActive', () => {
    it('should return true for ACTIVE company', () => {
      expect(isCompanyActive(testCompany1)).toBe(true);
    });

    it('should return false for CEASED company', () => {
      expect(isCompanyActive(testCompany3Ceased)).toBe(false);
    });
  });

  describe('getEstablishments', () => {
    beforeEach(() => {
      registerCompany(testCompany1);
      registerCompany(testCompany4SameSiren);
    });

    it('should get all establishments for a SIREN', () => {
      const establishments = getEstablishments('732829320');
      expect(establishments).toHaveLength(2);
    });
  });

  describe('getHeadquarters', () => {
    it('should find headquarters (NIC = 00001)', () => {
      // Create a headquarters with SIRET ending in 00001
      const hq: Company = {
        ...testCompany1,
        id: 'company-hq',
        siretCode: '73282932000001', // Headquarters
      };
      registerCompany(hq);
      registerCompany(testCompany4SameSiren);

      const headquarters = getHeadquarters('732829320');
      expect(headquarters).not.toBeNull();
      expect(headquarters?.siretCode).toBe('73282932000001');
    });

    it('should return null when no headquarters found', () => {
      registerCompany(testCompany1);
      const headquarters = getHeadquarters('732829320');
      expect(headquarters).toBeNull();
    });
  });

  describe('clearCompanyRegistry', () => {
    it('should clear all data', () => {
      registerCompany(testCompany1);
      registerCompany(testCompany2);
      expect(getCompanyCount()).toBe(2);

      clearCompanyRegistry();
      expect(getCompanyCount()).toBe(0);
      expect(getAllCompanies()).toHaveLength(0);
    });
  });

  describe('Integration - Multiple establishments', () => {
    it('should handle company with multiple establishments correctly', () => {
      registerCompany(testCompany1);
      registerCompany(testCompany4SameSiren);

      // Find by SIREN should return both
      const bySiren = getCompaniesBySiren('732829320');
      expect(bySiren).toHaveLength(2);

      // Find by SIRET should return specific one
      const bySiret1 = getCompanyBySiret('73282932000074');
      expect(bySiret1?.id).toBe('company-001');

      const bySiret2 = getCompanyBySiret('73282932000082');
      expect(bySiret2?.id).toBe('company-004');

      // Unified lookup by SIREN returns first (or HQ if available)
      const byUnified = getCompany('732829320');
      expect(byUnified).not.toBeNull();
    });
  });
});
