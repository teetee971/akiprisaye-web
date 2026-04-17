/**
 * Tests for Company validation utilities
 */

import { describe, it, expect } from 'vitest';
import {
  isValidSiret,
  isValidSiren,
  isValidVat,
  extractSirenFromSiret,
  extractSirenFromVat,
  normalizeSiret,
  normalizeSiren,
  normalizeVat,
  validateCompany,
  deriveActivityStatus,
} from '../utils/companyValidation';
import type { Company } from '../types/company';

describe('Company Validation Utilities', () => {
  describe('isValidSiret', () => {
    it('should validate correct SIRET codes', () => {
      expect(isValidSiret('73282932000074')).toBe(true);
      expect(isValidSiret('35600000000048')).toBe(true);
    });

    it('should accept SIRET with spaces or dashes', () => {
      expect(isValidSiret('732 829 320 00074')).toBe(true);
      expect(isValidSiret('732-829-320-00074')).toBe(true);
    });

    it('should reject invalid SIRET codes', () => {
      expect(isValidSiret('12345')).toBe(false);
      expect(isValidSiret('1234567890123')).toBe(false); // 13 digits
      expect(isValidSiret('123456789012345')).toBe(false); // 15 digits
      expect(isValidSiret('ABCD1234567890')).toBe(false); // letters
      expect(isValidSiret('')).toBe(false);
      expect(isValidSiret(undefined)).toBe(false);
    });
  });

  describe('isValidSiren', () => {
    it('should validate correct SIREN codes', () => {
      expect(isValidSiren('732829320')).toBe(true);
      expect(isValidSiren('356000000')).toBe(true);
    });

    it('should accept SIREN with spaces or dashes', () => {
      expect(isValidSiren('732 829 320')).toBe(true);
      expect(isValidSiren('732-829-320')).toBe(true);
    });

    it('should reject invalid SIREN codes', () => {
      expect(isValidSiren('12345')).toBe(false);
      expect(isValidSiren('12345678')).toBe(false); // 8 digits
      expect(isValidSiren('1234567890')).toBe(false); // 10 digits
      expect(isValidSiren('ABCD12345')).toBe(false); // letters
      expect(isValidSiren('')).toBe(false);
      expect(isValidSiren(undefined)).toBe(false);
    });
  });

  describe('isValidVat', () => {
    it('should validate correct French VAT codes', () => {
      expect(isValidVat('FR32732829320')).toBe(true);
      expect(isValidVat('FR68356000000')).toBe(true);
    });

    it('should accept VAT with spaces or dashes', () => {
      expect(isValidVat('FR 32 732829320')).toBe(true);
      expect(isValidVat('FR-32-732829320')).toBe(true);
    });

    it('should be case insensitive', () => {
      expect(isValidVat('fr32732829320')).toBe(true);
      expect(isValidVat('Fr32732829320')).toBe(true);
    });

    it('should reject invalid VAT codes', () => {
      expect(isValidVat('FR123456789')).toBe(false); // wrong length
      expect(isValidVat('DE32732829320')).toBe(false); // wrong country
      expect(isValidVat('FR')).toBe(false);
      expect(isValidVat('732829320')).toBe(false); // missing FR prefix
      expect(isValidVat('')).toBe(false);
      expect(isValidVat(undefined)).toBe(false);
    });
  });

  describe('extractSirenFromSiret', () => {
    it('should extract SIREN from valid SIRET', () => {
      expect(extractSirenFromSiret('73282932000074')).toBe('732829320');
      expect(extractSirenFromSiret('35600000000048')).toBe('356000000');
    });

    it('should handle SIRET with spaces/dashes', () => {
      expect(extractSirenFromSiret('732 829 320 00074')).toBe('732829320');
    });

    it('should return null for invalid SIRET', () => {
      expect(extractSirenFromSiret('invalid')).toBeNull();
      expect(extractSirenFromSiret('12345')).toBeNull();
    });
  });

  describe('extractSirenFromVat', () => {
    it('should extract SIREN from valid VAT', () => {
      expect(extractSirenFromVat('FR32732829320')).toBe('732829320');
      expect(extractSirenFromVat('FR68356000000')).toBe('356000000');
    });

    it('should handle VAT with spaces/dashes', () => {
      expect(extractSirenFromVat('FR 32 732829320')).toBe('732829320');
    });

    it('should return null for invalid VAT', () => {
      expect(extractSirenFromVat('invalid')).toBeNull();
      expect(extractSirenFromVat('DE12345678901')).toBeNull();
    });
  });

  describe('normalizeSiret', () => {
    it('should normalize valid SIRET', () => {
      expect(normalizeSiret('732 829 320 00074')).toBe('73282932000074');
      expect(normalizeSiret('732-829-320-00074')).toBe('73282932000074');
    });

    it('should return null for invalid SIRET', () => {
      expect(normalizeSiret('invalid')).toBeNull();
    });
  });

  describe('normalizeSiren', () => {
    it('should normalize valid SIREN', () => {
      expect(normalizeSiren('732 829 320')).toBe('732829320');
      expect(normalizeSiren('732-829-320')).toBe('732829320');
    });

    it('should return null for invalid SIREN', () => {
      expect(normalizeSiren('invalid')).toBeNull();
    });
  });

  describe('normalizeVat', () => {
    it('should normalize valid VAT', () => {
      expect(normalizeVat('fr 32 732829320')).toBe('FR32732829320');
      expect(normalizeVat('FR-32-732829320')).toBe('FR32732829320');
    });

    it('should return null for invalid VAT', () => {
      expect(normalizeVat('invalid')).toBeNull();
    });
  });

  describe('deriveActivityStatus', () => {
    it('should return CEASED when cessation date exists', () => {
      expect(deriveActivityStatus('2024-01-01')).toBe('CEASED');
      expect(deriveActivityStatus('2023-12-31')).toBe('CEASED');
    });

    it('should return ACTIVE when no cessation date', () => {
      expect(deriveActivityStatus()).toBe('ACTIVE');
      expect(deriveActivityStatus(undefined)).toBe('ACTIVE');
    });
  });

  describe('validateCompany', () => {
    const validCompany: Company = {
      id: 'company-123',
      siretCode: '73282932000074',
      sirenCode: '732829320',
      vatCode: 'FR32732829320',
      legalName: 'Test Company SARL',
      tradeName: 'TestCo',
      activityStatus: 'ACTIVE',
      creationDate: '2020-01-01',
      headOffice: {
        streetNumber: '123',
        streetName: 'Rue de la Paix',
        city: 'Paris',
        department: '75',
        postalCode: '75001',
        country: 'France',
      },
      geoLocation: {
        latitude: 48.8566,
        longitude: 2.3522,
      },
      lastUpdate: '2024-12-18T12:00:00Z',
      source: 'REGISTRE_ENTREPRISES',
    };

    it('should validate a complete valid company', () => {
      const result = validateCompany(validCompany);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should require ID', () => {
      const company = { ...validCompany, id: '' };
      const result = validateCompany(company);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('ID is required');
    });

    it('should require legal name', () => {
      const company = { ...validCompany, legalName: '' };
      const result = validateCompany(company);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Legal name is required');
    });

    it('should require creation date', () => {
      const company = { ...validCompany, creationDate: '' };
      const result = validateCompany(company);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Creation date is required');
    });

    it('should validate creation date format', () => {
      const company = { ...validCompany, creationDate: 'invalid-date' };
      const result = validateCompany(company);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Creation date must be in ISO 8601 format (YYYY-MM-DD)');
    });

    it('should validate activity status', () => {
      const company = { ...validCompany, activityStatus: 'INVALID' as any };
      const result = validateCompany(company);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Activity status must be ACTIVE or CEASED');
    });

    it('should require cessation date for CEASED status', () => {
      const company = {
        ...validCompany,
        activityStatus: 'CEASED' as const,
        cessationDate: undefined,
      };
      const result = validateCompany(company);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Cessation date is required for CEASED companies');
    });

    it('should validate SIRET/SIREN consistency', () => {
      const company = {
        ...validCompany,
        siretCode: '73282932000074',
        sirenCode: '999999999', // inconsistent
      };
      const result = validateCompany(company);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('SIRET and SIREN codes are inconsistent');
    });

    it('should validate head office information', () => {
      const company = {
        ...validCompany,
        headOffice: {
          streetName: '',
          city: '',
          department: '',
          postalCode: '',
          country: '',
        },
      };
      const result = validateCompany(company);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should validate geolocation coordinates', () => {
      const company = {
        ...validCompany,
        geoLocation: {
          latitude: 91, // invalid
          longitude: 2.3522,
        },
      };
      const result = validateCompany(company);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid latitude (must be between -90 and 90)');
    });

    it('should validate longitude range', () => {
      const company = {
        ...validCompany,
        geoLocation: {
          latitude: 48.8566,
          longitude: 181, // invalid
        },
      };
      const result = validateCompany(company);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid longitude (must be between -180 and 180)');
    });
  });
});
