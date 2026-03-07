 
/**
 * Data Validation Service Tests
 */

import { describe, it, expect } from 'vitest';
import {
  validateObservation,
  validateObservationBatch,
  getValidationStatistics,
  meetsQualityThreshold,
  filterByQuality,
} from '../dataValidationService';
import type { PriceObservation } from '../../types/PriceObservation';

describe('Data Validation Service', () => {
  const validObservation: PriceObservation = {
    id: 'obs-1',
    productId: '3560070123456',
    productLabel: 'Lait demi-écrémé',
    productCategory: 'Produits laitiers',
    territory: 'GP',
    price: 1.42,
    observedAt: '2026-01-03T10:15:00.000Z',
    storeLabel: 'Carrefour',
    sourceType: 'citizen',
    confidenceScore: 95,
    barcode: '3560070123456',
  };

  describe('validateObservation', () => {
    it('should validate a correct observation', () => {
      const result = validateObservation(validObservation);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing required fields', () => {
      const invalid = { ...validObservation, territory: undefined as any };
      const result = validateObservation(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should detect invalid EAN', () => {
      const invalid = {
        ...validObservation,
        barcode: '123',
      };
      const result = validateObservation(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('EAN'))).toBe(true);
    });

    it('should detect invalid price', () => {
      const invalid = { ...validObservation, price: -1 };
      const result = validateObservation(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('prix'))).toBe(true);
    });

    it('should detect invalid date format', () => {
      const invalid = { ...validObservation, observedAt: '2026/01/03' };
      const result = validateObservation(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('date'))).toBe(true);
    });

    it('should detect future dates', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);
      const invalid = {
        ...validObservation,
        observedAt: futureDate.toISOString(),
      };
      const result = validateObservation(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('futur'))).toBe(true);
    });

    it('should warn about old dates', () => {
      const oldDate = new Date();
      oldDate.setFullYear(oldDate.getFullYear() - 3);
      const observation = {
        ...validObservation,
        observedAt: oldDate.toISOString(),
      };
      const result = validateObservation(observation);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should detect invalid territoire', () => {
      const invalid = { ...validObservation, territory: 'XX' as any };
      const result = validateObservation(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Territoire'))).toBe(true);
    });

    it('should detect invalid category', () => {
      const invalid = {
        ...validObservation,
        productCategory: 'Invalid' as any,
      };
      const result = validateObservation(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Catégorie'))).toBe(true);
    });

    it('should detect invalid source', () => {
      const invalid = { ...validObservation, sourceType: 'unknown' as any };
      const result = validateObservation(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Source'))).toBe(true);
    });

    it('should detect invalid quality score', () => {
      const invalid = {
        ...validObservation,
        confidenceScore: 150,
      };
      const result = validateObservation(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('score'))).toBe(true);
    });

    it('should warn about unusual prices', () => {
      const unusual = { ...validObservation, price: 15000 };
      const result = validateObservation(unusual);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should accept EAN-8', () => {
      const obs = {
        ...validObservation,
        barcode: '12345678',
      };
      const result = validateObservation(obs);
      expect(result.valid).toBe(true);
    });

    it('should accept EAN-13', () => {
      const obs = {
        ...validObservation,
        barcode: '1234567890123',
      };
      const result = validateObservation(obs);
      expect(result.valid).toBe(true);
    });
  });

  describe('validateObservationBatch', () => {
    it('should validate multiple observations', () => {
      const observations = [validObservation, validObservation];
      const result = validateObservationBatch(observations);
      expect(result.valid).toBe(true);
      expect(result.validCount).toBe(2);
      expect(result.invalidCount).toBe(0);
    });

    it('should detect mixed valid/invalid observations', () => {
      const invalid = { ...validObservation, price: -1 };
      const observations = [validObservation, invalid];
      const result = validateObservationBatch(observations);
      expect(result.valid).toBe(false);
      expect(result.validCount).toBe(1);
      expect(result.invalidCount).toBe(1);
    });
  });

  describe('getValidationStatistics', () => {
    it('should calculate statistics correctly', () => {
      const result1 = validateObservation(validObservation);
      const result2 = validateObservation({ ...validObservation, price: -1 });
      
      const stats = getValidationStatistics([result1, result2]);
      
      expect(stats.totalObservations).toBe(2);
      expect(stats.validObservations).toBe(1);
      expect(stats.invalidObservations).toBe(1);
      expect(stats.validationRate).toBe(50);
    });
  });

  describe('meetsQualityThreshold', () => {
    it('should accept high quality score', () => {
      expect(meetsQualityThreshold(validObservation, 50)).toBe(true);
    });

    it('should reject low quality score', () => {
      const lowQuality = {
        ...validObservation,
        confidenceScore: 30,
      };
      expect(meetsQualityThreshold(lowQuality, 50)).toBe(false);
    });

    it('should reject missing score', () => {
      const noScore = {
        ...validObservation,
        confidenceScore: undefined,
      };
      expect(meetsQualityThreshold(noScore, 50)).toBe(false);
    });

  });

  describe('filterByQuality', () => {
    it('should filter observations by quality', () => {
      const highQuality = validObservation;
      const lowQuality = {
        ...validObservation,
        confidenceScore: 10,
      };
      
      const observations = [highQuality, lowQuality];
      const filtered = filterByQuality(observations, 50);
      
      expect(filtered).toHaveLength(1);
      expect(filtered[0]).toEqual(highQuality);
    });
  });
});
