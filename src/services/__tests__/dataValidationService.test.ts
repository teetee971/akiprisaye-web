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
import type { CanonicalPriceObservation } from '../../types/canonicalPriceObservation';

describe('Data Validation Service', () => {
  const validObservation: CanonicalPriceObservation = {
    territoire: 'Guadeloupe',
    commune: 'Les Abymes',
    enseigne: 'Carrefour',
    produit: {
      nom: 'Lait demi-écrémé',
      ean: '3560070123456',
      categorie: 'Produits laitiers',
      unite: '1L',
      marque: 'Lactel',
    },
    prix: 1.42,
    date_releve: '2026-01-03',
    source: 'releve_citoyen',
    qualite: {
      niveau: 'verifie',
      preuve: true,
      score: 0.95,
    },
  };

  describe('validateObservation', () => {
    it('should validate a correct observation', () => {
      const result = validateObservation(validObservation);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing required fields', () => {
      const invalid = { ...validObservation, territoire: undefined as any };
      const result = validateObservation(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should detect invalid EAN', () => {
      const invalid = {
        ...validObservation,
        produit: { ...validObservation.produit, ean: '123' },
      };
      const result = validateObservation(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('EAN'))).toBe(true);
    });

    it('should detect invalid price', () => {
      const invalid = { ...validObservation, prix: -1 };
      const result = validateObservation(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('prix'))).toBe(true);
    });

    it('should detect invalid date format', () => {
      const invalid = { ...validObservation, date_releve: '2026/01/03' };
      const result = validateObservation(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('date'))).toBe(true);
    });

    it('should detect future dates', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);
      const invalid = {
        ...validObservation,
        date_releve: futureDate.toISOString().split('T')[0],
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
        date_releve: oldDate.toISOString().split('T')[0],
      };
      const result = validateObservation(observation);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should detect invalid territoire', () => {
      const invalid = { ...validObservation, territoire: 'Paris' as any };
      const result = validateObservation(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Territoire'))).toBe(true);
    });

    it('should detect invalid category', () => {
      const invalid = {
        ...validObservation,
        produit: { ...validObservation.produit, categorie: 'Invalid' as any },
      };
      const result = validateObservation(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Catégorie'))).toBe(true);
    });

    it('should detect invalid source', () => {
      const invalid = { ...validObservation, source: 'unknown' as any };
      const result = validateObservation(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Source'))).toBe(true);
    });

    it('should detect invalid quality level', () => {
      const invalid = {
        ...validObservation,
        qualite: { ...validObservation.qualite, niveau: 'bad' as any },
      };
      const result = validateObservation(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('qualité'))).toBe(true);
    });

    it('should detect invalid quality score', () => {
      const invalid = {
        ...validObservation,
        qualite: { ...validObservation.qualite, score: 1.5 },
      };
      const result = validateObservation(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('score'))).toBe(true);
    });

    it('should warn about unusual prices', () => {
      const unusual = { ...validObservation, prix: 15000 };
      const result = validateObservation(unusual);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should accept EAN-8', () => {
      const obs = {
        ...validObservation,
        produit: { ...validObservation.produit, ean: '12345678' },
      };
      const result = validateObservation(obs);
      expect(result.valid).toBe(true);
    });

    it('should accept EAN-13', () => {
      const obs = {
        ...validObservation,
        produit: { ...validObservation.produit, ean: '1234567890123' },
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
      const invalid = { ...validObservation, prix: -1 };
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
      const result2 = validateObservation({ ...validObservation, prix: -1 });
      
      const stats = getValidationStatistics([result1, result2]);
      
      expect(stats.totalObservations).toBe(2);
      expect(stats.validObservations).toBe(1);
      expect(stats.invalidObservations).toBe(1);
      expect(stats.validationRate).toBe(50);
    });
  });

  describe('meetsQualityThreshold', () => {
    it('should accept high quality score', () => {
      expect(meetsQualityThreshold(validObservation, 0.5)).toBe(true);
    });

    it('should reject low quality score', () => {
      const lowQuality = {
        ...validObservation,
        qualite: { ...validObservation.qualite, score: 0.3 },
      };
      expect(meetsQualityThreshold(lowQuality, 0.5)).toBe(false);
    });

    it('should accept verified without score', () => {
      const noScore = {
        ...validObservation,
        qualite: { niveau: 'verifie' as const, preuve: true },
      };
      expect(meetsQualityThreshold(noScore, 0.5)).toBe(true);
    });

    it('should reject "a_verifier" without score', () => {
      const toVerify = {
        ...validObservation,
        qualite: { niveau: 'a_verifier' as const, preuve: false },
      };
      expect(meetsQualityThreshold(toVerify, 0.5)).toBe(false);
    });
  });

  describe('filterByQuality', () => {
    it('should filter observations by quality', () => {
      const highQuality = validObservation;
      const lowQuality = {
        ...validObservation,
        qualite: { niveau: 'a_verifier' as const, preuve: false },
      };
      
      const observations = [highQuality, lowQuality];
      const filtered = filterByQuality(observations, 0.5);
      
      expect(filtered).toHaveLength(1);
      expect(filtered[0]).toEqual(highQuality);
    });
  });
});
