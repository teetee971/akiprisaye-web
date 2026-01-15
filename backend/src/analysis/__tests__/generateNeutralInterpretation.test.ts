/**
 * Tests for Neutral Interpretation Generation Module
 */

import { describe, it, expect } from 'vitest';
import {
  generateNeutralInterpretation,
  calculateDispersionIndex,
  validateNeutralText,
  type ObservationStats,
} from '../generateNeutralInterpretation';

describe('generateNeutralInterpretation', () => {
  describe('Signal Level Calculation', () => {
    it('should generate strong signal (80-100) with high stats', () => {
      const stats: ObservationStats = {
        observationsUsed: 2000,
        observationsMax: 2500,
        territoriesCovered: 4,
        dispersionIndex: 75,
        method: 'full',
      };

      const result = generateNeutralInterpretation(stats);

      expect(result.signalLevel).toBeGreaterThanOrEqual(80);
      expect(result.signalLevel).toBeLessThanOrEqual(100);
      expect(result.method).toBe('full');
    });

    it('should generate moderate signal (40-59) with medium stats', () => {
      const stats: ObservationStats = {
        observationsUsed: 300,
        observationsMax: 800,
        territoriesCovered: 2,
        dispersionIndex: 40,
        method: 'stratified',
      };

      const result = generateNeutralInterpretation(stats);

      expect(result.signalLevel).toBeGreaterThanOrEqual(40);
      expect(result.signalLevel).toBeLessThan(60);
      expect(result.method).toBe('stratified');
    });

    it('should generate minimal signal (0-19) with low stats', () => {
      const stats: ObservationStats = {
        observationsUsed: 15,
        observationsMax: 500,
        territoriesCovered: 1,
        dispersionIndex: 10,
        method: 'full',
      };

      const result = generateNeutralInterpretation(stats);

      expect(result.signalLevel).toBeLessThan(20);
    });

    it('should cap signal level at 100', () => {
      const stats: ObservationStats = {
        observationsUsed: 10000,
        observationsMax: 10000,
        territoriesCovered: 10,
        dispersionIndex: 100,
        method: 'full',
      };

      const result = generateNeutralInterpretation(stats);

      expect(result.signalLevel).toBeLessThanOrEqual(100);
    });
  });

  describe('Interpretation Text Generation', () => {
    it('should generate text for strong signal', () => {
      const stats: ObservationStats = {
        observationsUsed: 1500,
        observationsMax: 2000,
        territoriesCovered: 4,
        dispersionIndex: 70,
        method: 'full',
      };

      const result = generateNeutralInterpretation(stats);

      expect(result.interpretation).toContain('dynamique significative');
      expect(result.interpretation).toContain('observations');
      expect(result.interpretation.length).toBeGreaterThan(100);
    });

    it('should generate text for moderate signal', () => {
      const stats: ObservationStats = {
        observationsUsed: 400,
        observationsMax: 900,
        territoriesCovered: 2,
        dispersionIndex: 45,
        method: 'stratified',
      };

      const result = generateNeutralInterpretation(stats);

      expect(result.interpretation).toContain('évolutions modérées');
      expect(result.interpretation).toContain('échantillonnage stratifié');
    });

    it('should generate text for minimal signal', () => {
      const stats: ObservationStats = {
        observationsUsed: 20,
        observationsMax: 300,
        territoriesCovered: 1,
        dispersionIndex: 5,
        method: 'full',
      };

      const result = generateNeutralInterpretation(stats);

      expect(result.interpretation).toContain('volume limité');
      expect(result.interpretation).toContain('prudence');
    });

    it('should include observation count in text', () => {
      const stats: ObservationStats = {
        observationsUsed: 847,
        observationsMax: 1200,
        territoriesCovered: 3,
        dispersionIndex: 55,
        method: 'full',
      };

      const result = generateNeutralInterpretation(stats);

      expect(result.interpretation).toContain('847');
    });

    it('should use "exhaustive" for full method', () => {
      const stats: ObservationStats = {
        observationsUsed: 500,
        observationsMax: 800,
        territoriesCovered: 2,
        dispersionIndex: 50,
        method: 'full',
      };

      const result = generateNeutralInterpretation(stats);

      expect(result.interpretation).toContain('exhaustive');
    });

    it('should use "échantillonnage stratifié" for stratified method', () => {
      const stats: ObservationStats = {
        observationsUsed: 500,
        observationsMax: 800,
        territoriesCovered: 2,
        dispersionIndex: 50,
        method: 'stratified',
      };

      const result = generateNeutralInterpretation(stats);

      expect(result.interpretation).toContain('échantillonnage stratifié');
    });
  });

  describe('Input Validation', () => {
    it('should throw error for negative observations', () => {
      const stats: ObservationStats = {
        observationsUsed: -10,
        observationsMax: 100,
        territoriesCovered: 2,
        dispersionIndex: 30,
        method: 'full',
      };

      expect(() => generateNeutralInterpretation(stats)).toThrow('Invalid observation counts');
    });

    it('should throw error for zero max observations', () => {
      const stats: ObservationStats = {
        observationsUsed: 10,
        observationsMax: 0,
        territoriesCovered: 2,
        dispersionIndex: 30,
        method: 'full',
      };

      expect(() => generateNeutralInterpretation(stats)).toThrow('Invalid observation counts');
    });

    it('should throw error for negative territories', () => {
      const stats: ObservationStats = {
        observationsUsed: 100,
        observationsMax: 200,
        territoriesCovered: -1,
        dispersionIndex: 30,
        method: 'full',
      };

      expect(() => generateNeutralInterpretation(stats)).toThrow('Invalid territory count');
    });

    it('should throw error for invalid dispersion index', () => {
      const stats: ObservationStats = {
        observationsUsed: 100,
        observationsMax: 200,
        territoriesCovered: 2,
        dispersionIndex: 150,
        method: 'full',
      };

      expect(() => generateNeutralInterpretation(stats)).toThrow('Dispersion index must be between 0 and 100');
    });
  });

  describe('Neutrality Validation', () => {
    it('should generate neutral text without prohibited terms', () => {
      const stats: ObservationStats = {
        observationsUsed: 500,
        observationsMax: 800,
        territoriesCovered: 3,
        dispersionIndex: 50,
        method: 'full',
      };

      const result = generateNeutralInterpretation(stats);

      // Check for prohibited terms
      const prohibitedTerms = [
        'responsable',
        'cause',
        'hausse abusive',
        'enseigne dominante',
        'surprofit',
        'abus',
        'fraude',
      ];

      for (const term of prohibitedTerms) {
        expect(result.interpretation.toLowerCase()).not.toContain(term.toLowerCase());
      }
    });

    it('should pass neutrality validation', () => {
      const stats: ObservationStats = {
        observationsUsed: 500,
        observationsMax: 800,
        territoriesCovered: 3,
        dispersionIndex: 50,
        method: 'full',
      };

      const result = generateNeutralInterpretation(stats);

      expect(validateNeutralText(result.interpretation)).toBe(true);
    });
  });
});

describe('validateNeutralText', () => {
  it('should reject text with prohibited terms', () => {
    const badTexts = [
      'Cette hausse abusive est inacceptable',
      'L\'enseigne dominante est responsable',
      'Un surprofit évident',
      'Cet abus doit être sanctionné',
      'Une fraude manifeste',
    ];

    for (const text of badTexts) {
      expect(validateNeutralText(text)).toBe(false);
    }
  });

  it('should accept neutral descriptive text', () => {
    const goodTexts = [
      'L\'analyse statistique révèle une variation observée',
      'Les observations collectées montrent une dispersion',
      'Le volume statistique permet d\'identifier une tendance',
    ];

    for (const text of goodTexts) {
      expect(validateNeutralText(text)).toBe(true);
    }
  });

  it('should require at least one approved term', () => {
    const textWithoutApprovedTerms = 'Ce texte ne contient rien de pertinent';
    expect(validateNeutralText(textWithoutApprovedTerms)).toBe(false);
  });
});

describe('calculateDispersionIndex', () => {
  it('should return 0 for less than 2 prices', () => {
    expect(calculateDispersionIndex([])).toBe(0);
    expect(calculateDispersionIndex([1.50])).toBe(0);
  });

  it('should return 0 for identical prices', () => {
    const prices = [2.50, 2.50, 2.50, 2.50];
    expect(calculateDispersionIndex(prices)).toBe(0);
  });

  it('should calculate dispersion for varied prices', () => {
    const prices = [1.00, 1.50, 2.00, 2.50, 3.00];
    const dispersion = calculateDispersionIndex(prices);

    expect(dispersion).toBeGreaterThan(0);
    expect(dispersion).toBeLessThanOrEqual(100);
  });

  it('should return higher dispersion for more varied prices', () => {
    const lowVariation = [1.90, 1.95, 2.00, 2.05, 2.10];
    const highVariation = [1.00, 2.00, 3.00, 4.00, 5.00];

    const lowDispersion = calculateDispersionIndex(lowVariation);
    const highDispersion = calculateDispersionIndex(highVariation);

    expect(highDispersion).toBeGreaterThan(lowDispersion);
  });

  it('should cap dispersion at 100', () => {
    const extremePrices = [0.10, 100.00, 0.50, 200.00];
    const dispersion = calculateDispersionIndex(extremePrices);

    expect(dispersion).toBeLessThanOrEqual(100);
  });

  it('should handle realistic price data', () => {
    // Realistic grocery prices
    const prices = [1.89, 1.72, 1.95, 1.85, 2.10, 1.65];
    const dispersion = calculateDispersionIndex(prices);

    expect(dispersion).toBeGreaterThan(0);
    expect(dispersion).toBeLessThan(50); // Should be moderate for realistic data
  });
});
