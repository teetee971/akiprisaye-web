/**
 * Tests for Anti-Crisis Reading Logic
 */

import { describe, it, expect } from 'vitest';
import {
  isAntiCrise,
  getNationalAverage,
  getTerritoryData,
  getAntiCrisisReading,
  getAllAntiCrisisReadings,
  explainAntiCrisisReading,
  formatStableCategories,
  getAntiCrisisReadingStats,
} from '../utils/antiCrisisReading';

describe('Anti-Crisis Reading', () => {
  describe('isAntiCrise', () => {
    const nationalAvg = 61.4;

    it('should return false if ILPP >= national average', () => {
      expect(isAntiCrise(65, nationalAvg, ['category1'])).toBe(false);
      expect(isAntiCrise(61.4, nationalAvg, ['category1'])).toBe(false);
    });

    it('should return false if no stable categories', () => {
      expect(isAntiCrise(55, nationalAvg, [])).toBe(false);
    });

    it('should return true if ILPP < national average AND has stable categories', () => {
      expect(isAntiCrise(55, nationalAvg, ['category1'])).toBe(true);
      expect(isAntiCrise(40, nationalAvg, ['cat1', 'cat2'])).toBe(true);
    });
  });

  describe('getNationalAverage', () => {
    it('should return the national average ILPP for 30d', () => {
      const avg = getNationalAverage('30d');
      expect(avg).toBeGreaterThan(0);
      expect(avg).toBeLessThan(100);
    });

    it('should return the national average ILPP for 90d', () => {
      const avg = getNationalAverage('90d');
      expect(avg).toBeGreaterThan(0);
      expect(avg).toBeLessThan(100);
    });

    it('should default to 90d if no parameter provided', () => {
      const avg = getNationalAverage();
      expect(avg).toBeGreaterThan(0);
      expect(avg).toBeLessThan(100);
    });
  });

  describe('getTerritoryData', () => {
    it('should return territory data for valid ID', () => {
      const data = getTerritoryData('FR-973');
      expect(data).not.toBeNull();
      expect(data?.name).toBe('Guyane');
      expect(data?.ilpp['90d']).toBe(55);
      expect(data?.antiCrise['90d']).toContain('produits frais');
    });

    it('should return null for invalid ID', () => {
      const data = getTerritoryData('INVALID');
      expect(data).toBeNull();
    });

    it('should have time-based data structure', () => {
      const data = getTerritoryData('FR-973');
      expect(data).not.toBeNull();
      expect(data?.ilpp).toHaveProperty('30d');
      expect(data?.ilpp).toHaveProperty('90d');
      expect(data?.antiCrise).toHaveProperty('30d');
      expect(data?.antiCrise).toHaveProperty('90d');
    });
  });

  describe('getAntiCrisisReading', () => {
    it('should return null for invalid territory', () => {
      const reading = getAntiCrisisReading('INVALID', '90d');
      expect(reading).toBeNull();
    });

    it('should return reading for valid territory (90d)', () => {
      const reading = getAntiCrisisReading('FR-973', '90d');

      expect(reading).not.toBeNull();
      expect(reading!.territoryId).toBe('FR-973');
      expect(reading!.territoryName).toBe('Guyane');
      expect(reading!.ilpp).toBe(55);
      expect(reading!.stableCategories.length).toBeGreaterThan(0);
    });

    it('should return reading for valid territory (30d)', () => {
      const reading = getAntiCrisisReading('FR-973', '30d');

      expect(reading).not.toBeNull();
      expect(reading!.territoryId).toBe('FR-973');
      expect(reading!.territoryName).toBe('Guyane');
      expect(reading!.ilpp).toBe(53);
    });

    it('should default to 90d if no time range specified', () => {
      const reading = getAntiCrisisReading('FR-973');
      expect(reading!.ilpp).toBe(55); // 90d value
    });

    it('should qualify territory with ILPP below average and stable categories', () => {
      const reading = getAntiCrisisReading('FR-973', '90d'); // ILPP 55, below 61.4

      expect(reading!.qualifiesForReading).toBe(true);
      expect(reading!.comparisonToNational).toBe('below');
      expect(reading!.differenceFromNational).toBeLessThan(0);
    });

    it('should not qualify territory with ILPP above average', () => {
      const reading = getAntiCrisisReading('FR-972', '90d'); // ILPP 72, above 61.4

      expect(reading!.qualifiesForReading).toBe(false);
      expect(reading!.comparisonToNational).toBe('above');
      expect(reading!.differenceFromNational).toBeGreaterThan(0);
    });

    it('should not qualify territory without stable categories', () => {
      const reading = getAntiCrisisReading('FR-976', '90d'); // Mayotte, empty antiCrise array

      expect(reading!.qualifiesForReading).toBe(false);
      expect(reading!.stableCategories.length).toBe(0);
    });

    it('should correctly determine comparison to national average', () => {
      const belowReading = getAntiCrisisReading('FR-69', '90d'); // ILPP 35
      expect(belowReading!.comparisonToNational).toBe('below');

      const aboveReading = getAntiCrisisReading('FR-972', '90d'); // ILPP 72
      expect(aboveReading!.comparisonToNational).toBe('above');
    });
  });

  describe('getAllAntiCrisisReadings', () => {
    it('should return only qualifying territories for 90d', () => {
      const readings = getAllAntiCrisisReadings('90d');

      expect(readings.length).toBeGreaterThan(0);
      readings.forEach((reading) => {
        expect(reading.qualifiesForReading).toBe(true);
      });
    });

    it('should return only qualifying territories for 30d', () => {
      const readings = getAllAntiCrisisReadings('30d');

      expect(readings.length).toBeGreaterThan(0);
      readings.forEach((reading) => {
        expect(reading.qualifiesForReading).toBe(true);
      });
    });

    it('should sort by ILPP ascending (lowest pressure first)', () => {
      const readings = getAllAntiCrisisReadings('90d');

      for (let i = 1; i < readings.length; i++) {
        expect(readings[i].ilpp).toBeGreaterThanOrEqual(readings[i - 1].ilpp);
      }
    });

    it('should only include territories with stable categories', () => {
      const readings = getAllAntiCrisisReadings('90d');

      readings.forEach((reading) => {
        expect(reading.stableCategories.length).toBeGreaterThan(0);
      });
    });
  });

  describe('explainAntiCrisisReading', () => {
    it('should explain qualifying territory', () => {
      const reading = getAntiCrisisReading('FR-973', '90d')!;
      const explanation = explainAntiCrisisReading(reading);

      expect(explanation).toContain('Guyane');
      expect(explanation).toContain('inférieure');
      expect(explanation).toContain('moyenne nationale');
      expect(explanation).toContain('stabilité');
    });

    it('should explain non-qualifying territory', () => {
      const reading = getAntiCrisisReading('FR-972', '90d')!;
      const explanation = explainAntiCrisisReading(reading);

      expect(explanation).toContain('Martinique');
      expect(explanation).toContain('supérieure');
      expect(explanation).toContain('moyenne nationale');
    });

    it('should never contain purchase advice or recommendations', () => {
      const allTerritories = ['FR-971', 'FR-972', 'FR-973', 'FR-974', 'FR-976'];

      allTerritories.forEach((territoryId) => {
        const reading = getAntiCrisisReading(territoryId, '90d');
        if (reading) {
          const explanation = explainAntiCrisisReading(reading);

          expect(explanation.toLowerCase()).not.toContain('acheter');
          expect(explanation.toLowerCase()).not.toContain('recommand');
          expect(explanation.toLowerCase()).not.toContain('conseil');
          expect(explanation.toLowerCase()).not.toContain('devriez');
          expect(explanation.toLowerCase()).not.toContain('devez');
        }
      });
    });
  });

  describe('formatStableCategories', () => {
    it('should return message for empty array', () => {
      expect(formatStableCategories([])).toBe('Aucune catégorie identifiée');
    });

    it('should return single category as-is', () => {
      expect(formatStableCategories(['fruits'])).toBe('fruits');
    });

    it('should join two categories with "et"', () => {
      expect(formatStableCategories(['fruits', 'légumes'])).toBe('fruits et légumes');
    });

    it('should format three or more categories with commas and "et"', () => {
      const result = formatStableCategories(['fruits', 'légumes', 'poisson']);
      expect(result).toBe('fruits, légumes et poisson');
    });

    it('should handle longer lists correctly', () => {
      const result = formatStableCategories(['a', 'b', 'c', 'd']);
      expect(result).toBe('a, b, c et d');
    });
  });

  describe('getAntiCrisisReadingStats', () => {
    it('should return valid statistics', () => {
      const stats = getAntiCrisisReadingStats();

      expect(stats.totalTerritories).toBeGreaterThan(0);
      expect(stats.qualifyingTerritories).toBeGreaterThanOrEqual(0);
      expect(stats.percentageQualifying).toBeGreaterThanOrEqual(0);
      expect(stats.percentageQualifying).toBeLessThanOrEqual(100);
    });

    it('should have qualifying territories less than or equal to total', () => {
      const stats = getAntiCrisisReadingStats();
      expect(stats.qualifyingTerritories).toBeLessThanOrEqual(stats.totalTerritories);
    });

    it('should have valid ILPP range for qualifying territories', () => {
      const stats = getAntiCrisisReadingStats();

      if (stats.lowestIlpp !== null && stats.highestIlpp !== null) {
        expect(stats.lowestIlpp).toBeLessThanOrEqual(stats.highestIlpp);
        expect(stats.lowestIlpp).toBeGreaterThanOrEqual(0);
        expect(stats.highestIlpp).toBeLessThanOrEqual(100);
      }
    });
  });

  describe('Legal compliance', () => {
    it('should never mention specific products in antiCrise arrays', () => {
      const allTerritories = [
        'FR-971',
        'FR-972',
        'FR-973',
        'FR-974',
        'FR-976',
        'FR-977',
        'FR-978',
        'FR-75',
        'FR-13',
        'FR-69',
      ];
      const timeRanges: Array<'30d' | '90d'> = ['30d', '90d'];

      allTerritories.forEach((territoryId) => {
        const data = getTerritoryData(territoryId);
        if (data) {
          timeRanges.forEach((timeRange) => {
            data.antiCrise[timeRange].forEach((category) => {
              // Should be categories, not specific products
              expect(category).toBeTruthy();
              expect(category.length).toBeGreaterThanOrEqual(3); // At least 3 characters

              // Should not contain brand names or store names (basic check)
              expect(category.toLowerCase()).not.toContain('carrefour');
              expect(category.toLowerCase()).not.toContain('leclerc');
              expect(category.toLowerCase()).not.toContain('auchan');
            });
          });
        }
      });
    });

    it('should use descriptive language only', () => {
      const readings90d = getAllAntiCrisisReadings('90d');
      const readings30d = getAllAntiCrisisReadings('30d');

      [...readings90d, ...readings30d].forEach((reading) => {
        const explanation = explainAntiCrisisReading(reading);

        // Should use observational language
        expect(explanation.toLowerCase()).toMatch(/présente|observ|constata|identifi|montrant/);

        // Should not use imperative or advisory language
        expect(explanation.toLowerCase()).not.toMatch(/achet|allez|préfér|choisiss|optez/);
      });
    });
  });
});
