/**
 * Tests for IEVR Calculation Utilities
 */

import { describe, it, expect } from 'vitest';
import {
  calculateIEVRScore,
  compareToReference,
  calculateEvolution,
  generateExplanation,
  getScoreColor,
  getTrendIcon,
  validateIEVRData,
} from '../utils/ievrCalculations';

describe('IEVR Calculations', () => {
  describe('calculateIEVRScore', () => {
    it('should calculate correct weighted score', () => {
      const categories = {
        alimentation: 65,
        hygiene: 68,
        transport: 72,
        energie: 70,
        autres: 67,
      };

      const weights = {
        alimentation: 0.4,
        hygiene: 0.15,
        transport: 0.15,
        energie: 0.15,
        autres: 0.15,
      };

      const score = calculateIEVRScore(categories, weights);

      // Expected: 65*0.4 + 68*0.15 + 72*0.15 + 70*0.15 + 67*0.15
      // = 26 + 10.2 + 10.8 + 10.5 + 10.05 = 67.55 ≈ 68
      expect(score).toBe(68);
    });

    it('should throw error if categories missing', () => {
      expect(() => calculateIEVRScore(null, {})).toThrow('Categories and weights are required');
    });

    it('should throw error if weights missing', () => {
      expect(() => calculateIEVRScore({}, null)).toThrow('Categories and weights are required');
    });

    it('should handle edge case of score 100', () => {
      const categories = {
        alimentation: 100,
        hygiene: 100,
        transport: 100,
        energie: 100,
        autres: 100,
      };

      const weights = {
        alimentation: 0.4,
        hygiene: 0.15,
        transport: 0.15,
        energie: 0.15,
        autres: 0.15,
      };

      const score = calculateIEVRScore(categories, weights);
      expect(score).toBe(100);
    });
  });

  describe('compareToReference', () => {
    it('should calculate correct difference for lower score', () => {
      const result = compareToReference(68, 100);

      expect(result.difference).toBe(-32);
      expect(result.percentDiff).toBe(-32);
      expect(result.interpretation).toBe('plus difficile');
    });

    it('should calculate correct difference for higher score', () => {
      const result = compareToReference(110, 100);

      expect(result.difference).toBe(10);
      expect(result.percentDiff).toBe(10);
      expect(result.interpretation).toBe('plus facile');
    });

    it('should identify similar scores', () => {
      const result = compareToReference(102, 100);

      expect(result.interpretation).toBe('similaire');
    });

    it('should use default reference of 100', () => {
      const result = compareToReference(68);

      expect(result.difference).toBe(-32);
    });
  });

  describe('calculateEvolution', () => {
    it('should calculate positive evolution', () => {
      const result = calculateEvolution(70, 68);

      expect(result.change).toBe(2);
      expect(result.percentChange).toBeCloseTo(2.9, 1);
      expect(result.trend).toBe('amélioration');
    });

    it('should calculate negative evolution', () => {
      const result = calculateEvolution(68, 70);

      expect(result.change).toBe(-2);
      expect(result.percentChange).toBeCloseTo(-2.9, 1);
      expect(result.trend).toBe('dégradation');
    });

    it('should identify stable trend', () => {
      const result = calculateEvolution(68, 68);

      expect(result.trend).toBe('stable');
    });

    it('should handle missing previous score', () => {
      const result = calculateEvolution(68, null);

      expect(result.change).toBe(0);
      expect(result.trend).toBe('stable');
    });
  });

  describe('generateExplanation', () => {
    it('should generate explanation for lower score', () => {
      const text = generateExplanation('Guadeloupe', 68, 100);

      expect(text).toContain('Guadeloupe');
      expect(text).toContain('plus difficile');
      expect(text).toContain('32%');
    });

    it('should generate explanation for similar score', () => {
      const text = generateExplanation('Test', 102, 100);

      expect(text).toContain('similaire');
    });

    it('should generate explanation for higher score', () => {
      const text = generateExplanation('Test', 110, 100);

      expect(text).toContain('plus facile');
    });
  });

  describe('getScoreColor', () => {
    it('should return green for high scores', () => {
      expect(getScoreColor(95)).toBe('#10b981');
    });

    it('should return blue for good scores', () => {
      expect(getScoreColor(80)).toBe('#3b82f6');
    });

    it('should return amber for medium scores', () => {
      expect(getScoreColor(65)).toBe('#f59e0b');
    });

    it('should return red for low scores', () => {
      expect(getScoreColor(55)).toBe('#ef4444');
    });
  });

  describe('getTrendIcon', () => {
    it('should return up arrow for amélioration', () => {
      expect(getTrendIcon('amélioration')).toBe('📈');
    });

    it('should return down arrow for dégradation', () => {
      expect(getTrendIcon('dégradation')).toBe('📉');
    });

    it('should return right arrow for stable', () => {
      expect(getTrendIcon('stable')).toBe('➡️');
    });
  });

  describe('validateIEVRData', () => {
    const validData = {
      metadata: {
        version: '1.0.0',
        reference: 'Hexagone',
      },
      categories: {
        alimentation: { weight: 0.4 },
        hygiene: { weight: 0.15 },
        transport: { weight: 0.15 },
        energie: { weight: 0.15 },
        autres: { weight: 0.15 },
      },
      territories: {
        FR: { name: 'France' },
      },
    };

    it('should validate correct data', () => {
      expect(validateIEVRData(validData)).toBe(true);
    });

    it('should throw error if metadata missing', () => {
      const invalidData = { ...validData };
      delete invalidData.metadata;

      expect(() => validateIEVRData(invalidData)).toThrow('Missing metadata');
    });

    it('should throw error if categories missing', () => {
      const invalidData = { ...validData };
      delete invalidData.categories;

      expect(() => validateIEVRData(invalidData)).toThrow('Missing categories');
    });

    it('should throw error if territories missing', () => {
      const invalidData = { ...validData };
      delete invalidData.territories;

      expect(() => validateIEVRData(invalidData)).toThrow('Missing territories');
    });

    it('should throw error if weights do not sum to 1', () => {
      const invalidData = {
        metadata: { version: '1.0.0' },
        categories: {
          alimentation: { weight: 0.4 },
          hygiene: { weight: 0.2 },
        },
        territories: { FR: { name: 'France' } },
      };

      expect(() => validateIEVRData(invalidData)).toThrow('Category weights sum to');
    });
  });
});
