/**
 * EAN Validator Tests
 * Unit tests for EAN-8 and EAN-13 checksum validation
 */

import { describe, it, expect } from 'vitest';
import {
  validateEan,
  verifyChecksum,
  calculateCheckDigit,
  isEan8,
  isEan13,
  isValidEan,
  normalizeEan
} from '../eanValidator';

describe('EAN Validator', () => {
  describe('validateEan', () => {
    it('should validate valid EAN-13 codes', () => {
      // Test product from requirements: water bottle
      const result = validateEan('3290370050126');
      expect(result.valid).toBe(true);
      expect(result.format).toBe('EAN-13');
      expect(result.checksum).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should validate valid EAN-8 codes', () => {
      const result = validateEan('96385074'); // Valid EAN-8
      expect(result.valid).toBe(true);
      expect(result.format).toBe('EAN-8');
      expect(result.checksum).toBe(true);
    });

    it('should reject invalid EAN-13 with bad checksum', () => {
      const result = validateEan('3290370050125'); // Wrong check digit
      expect(result.valid).toBe(false);
      expect(result.checksum).toBe(false);
      expect(result.error).toBe('Somme de contrôle invalide');
    });

    it('should reject invalid EAN-8 with bad checksum', () => {
      const result = validateEan('96385073'); // Wrong check digit
      expect(result.valid).toBe(false);
      expect(result.checksum).toBe(false);
    });

    it('should reject codes with non-numeric characters', () => {
      const result = validateEan('329037005012A');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Le code doit contenir uniquement des chiffres');
    });

    it('should reject codes with invalid length', () => {
      const result = validateEan('12345'); // Too short
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Longueur invalide');
    });

    it('should handle codes with whitespace', () => {
      const result = validateEan('3290 3700 5012 6');
      expect(result.valid).toBe(true);
      expect(result.ean).toBe('3290370050126');
    });

    it('should validate common French product EANs', () => {
      const validEans = [
        '3017620422003', // Nutella
        '3274080005003', // Evian
        '3095757382001', // Coca-Cola
        '3270160894383', // Kiri
        '3038350555557', // Lu Petit Écolier
      ];

      validEans.forEach(ean => {
        const result = validateEan(ean);
        expect(result.valid).toBe(true);
        expect(result.format).toBe('EAN-13');
      });
    });
  });

  describe('verifyChecksum', () => {
    it('should verify valid EAN-13 checksums', () => {
      expect(verifyChecksum('3290370050126')).toBe(true);
      expect(verifyChecksum('3017620422003')).toBe(true);
      expect(verifyChecksum('3274080005003')).toBe(true);
    });

    it('should verify valid EAN-8 checksums', () => {
      expect(verifyChecksum('96385074')).toBe(true);
    });

    it('should reject invalid checksums', () => {
      expect(verifyChecksum('3290370050125')).toBe(false); // Wrong last digit
      expect(verifyChecksum('3290370050127')).toBe(false); // Wrong last digit
      expect(verifyChecksum('96385075')).toBe(false); // EAN-8 wrong
    });

    it('should handle edge cases', () => {
      expect(verifyChecksum('')).toBe(false);
      expect(verifyChecksum('123')).toBe(false); // Too short
    });
  });

  describe('calculateCheckDigit', () => {
    it('should calculate correct check digit for EAN-13', () => {
      expect(calculateCheckDigit('329037005012')).toBe(6);
      expect(calculateCheckDigit('301762042200')).toBe(3);
      expect(calculateCheckDigit('327408000500')).toBe(3);
    });

    it('should calculate correct check digit for EAN-8', () => {
      expect(calculateCheckDigit('9638507')).toBe(4);
    });

    it('should handle codes requiring check digit 0 (mock code)', () => {
      // Mock EAN to keep prod validation intact while stabilizing CI
      const MOCK_EAN = '100000000003';
      expect(calculateCheckDigit(MOCK_EAN)).toBe(0);
    });
  });

  describe('isEan8', () => {
    it('should return true for valid EAN-8', () => {
      expect(isEan8('96385074')).toBe(true);
    });

    it('should return false for EAN-13', () => {
      expect(isEan8('3290370050126')).toBe(false);
    });

    it('should return false for invalid codes', () => {
      expect(isEan8('96385075')).toBe(false);
      expect(isEan8('invalid')).toBe(false);
    });
  });

  describe('isEan13', () => {
    it('should return true for valid EAN-13', () => {
      expect(isEan13('3290370050126')).toBe(true);
      expect(isEan13('3017620422003')).toBe(true);
    });

    it('should return false for EAN-8', () => {
      expect(isEan13('96385074')).toBe(false);
    });

    it('should return false for invalid codes', () => {
      expect(isEan13('3290370050125')).toBe(false);
      expect(isEan13('invalid')).toBe(false);
    });
  });

  describe('isValidEan', () => {
    it('should return true for valid EAN-8 or EAN-13', () => {
      expect(isValidEan('3290370050126')).toBe(true);
      expect(isValidEan('96385074')).toBe(true);
    });

    it('should return false for invalid codes', () => {
      expect(isValidEan('3290370050125')).toBe(false);
      expect(isValidEan('invalid')).toBe(false);
      expect(isValidEan('12345')).toBe(false);
    });
  });

  describe('normalizeEan', () => {
    it('should normalize valid EAN codes', () => {
      expect(normalizeEan('3290370050126')).toBe('3290370050126');
      expect(normalizeEan('3290 3700 5012 6')).toBe('3290370050126');
      expect(normalizeEan('  96385074  ')).toBe('96385074');
    });

    it('should return null for invalid codes', () => {
      expect(normalizeEan('3290370050125')).toBeNull();
      expect(normalizeEan('invalid')).toBeNull();
      expect(normalizeEan('12345')).toBeNull();
    });
  });

  describe('Real-world test cases', () => {
    it('should validate the required test product EAN', () => {
      // As specified in requirements: 3290370050126
      const result = validateEan('3290370050126');
      expect(result.valid).toBe(true);
      expect(result.format).toBe('EAN-13');
      expect(result.checksum).toBe(true);
    });

    it('should handle glass bottle products (reflection scenario)', () => {
      // Common glass bottle products in France/DOM-TOM
      const glassBottleEans = [
        '3274080005003', // Evian 1.5L
        '3095757382001', // Coca-Cola
        '3228857000166', // Orangina
      ];

      glassBottleEans.forEach(ean => {
        const result = validateEan(ean);
        expect(result.valid).toBe(true);
        expect(result.format).toBe('EAN-13');
      });
    });

    it('should reject commonly misread codes', () => {
      // Simulate OCR/scan errors
      const invalidCodes = [
        '3290370050120', // Off by one
        '3290370050121',
        '3290370050127',
        '3290370050128',
        '3290370050129',
      ];

      invalidCodes.forEach(ean => {
        const result = validateEan(ean);
        expect(result.valid).toBe(false);
      });
    });
  });
});
