/**
 * Tests for Inflation Pressure Index (ILPP)
 */

import { describe, it, expect } from 'vitest';
import {
  computeILPP,
  getPressureLevel,
  explainILPP,
  calculateILPPComponents,
  computeILPPFromSnapshots,
  compareILPP,
  getILPPColorClass,
  getILPPTextColorClass,
  type ILPPInputData,
  type ILPPResult,
} from '../utils/inflationPressureIndex';
import type { BasketPriceSnapshot } from '../utils/priceHistory';

describe('Inflation Pressure Index (ILPP)', () => {
  describe('computeILPP', () => {
    it('should calculate ILPP score correctly with all components', () => {
      const data: ILPPInputData = {
        avgChange: 10, // 10% average increase
        volatility: 15, // 15% volatility
        increaseFrequency: 60, // 60% increases
        dispersion: 20, // 20% dispersion
      };

      const score = computeILPP(data);

      // Expected: (10/50*100)*0.4 + 15*0.3 + 60*0.2 + 20*0.1
      //         = 20*0.4 + 15*0.3 + 60*0.2 + 20*0.1
      //         = 8 + 4.5 + 12 + 2 = 26.5 ≈ 27
      expect(score).toBeGreaterThanOrEqual(20);
      expect(score).toBeLessThanOrEqual(35);
    });

    it('should return 0 for all-zero inputs', () => {
      const data: ILPPInputData = {
        avgChange: 0,
        volatility: 0,
        increaseFrequency: 0,
        dispersion: 0,
      };

      const score = computeILPP(data);
      expect(score).toBe(0);
    });

    it('should cap score at 100', () => {
      const data: ILPPInputData = {
        avgChange: 100,
        volatility: 100,
        increaseFrequency: 100,
        dispersion: 100,
      };

      const score = computeILPP(data);
      expect(score).toBe(100);
    });

    it('should handle negative values gracefully', () => {
      const data: ILPPInputData = {
        avgChange: -5, // Price decrease
        volatility: 10,
        increaseFrequency: 30,
        dispersion: 15,
      };

      const score = computeILPP(data);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe('getPressureLevel', () => {
    it('should return "Très faible" for score 0-20', () => {
      expect(getPressureLevel(0)).toBe('Très faible');
      expect(getPressureLevel(10)).toBe('Très faible');
      expect(getPressureLevel(20)).toBe('Très faible');
    });

    it('should return "Modérée" for score 21-40', () => {
      expect(getPressureLevel(21)).toBe('Modérée');
      expect(getPressureLevel(30)).toBe('Modérée');
      expect(getPressureLevel(40)).toBe('Modérée');
    });

    it('should return "Notable" for score 41-60', () => {
      expect(getPressureLevel(41)).toBe('Notable');
      expect(getPressureLevel(50)).toBe('Notable');
      expect(getPressureLevel(60)).toBe('Notable');
    });

    it('should return "Forte" for score 61-80', () => {
      expect(getPressureLevel(61)).toBe('Forte');
      expect(getPressureLevel(70)).toBe('Forte');
      expect(getPressureLevel(80)).toBe('Forte');
    });

    it('should return "Très élevée" for score 81-100', () => {
      expect(getPressureLevel(81)).toBe('Très élevée');
      expect(getPressureLevel(90)).toBe('Très élevée');
      expect(getPressureLevel(100)).toBe('Très élevée');
    });
  });

  describe('explainILPP', () => {
    it('should provide appropriate explanation for each pressure level', () => {
      const lowExplanation = explainILPP(15);
      expect(lowExplanation).toContain('stables');

      const moderateExplanation = explainILPP(35);
      expect(moderateExplanation).toContain('modérée');

      const notableExplanation = explainILPP(55);
      expect(notableExplanation).toContain('augmentation régulière');

      const strongExplanation = explainILPP(75);
      expect(strongExplanation).toContain('forte pression');

      const veryHighExplanation = explainILPP(95);
      expect(veryHighExplanation).toContain('très élevée');
    });

    it('should never mention predictions or advice', () => {
      const allExplanations = [0, 20, 40, 60, 80, 100].map((score) => explainILPP(score));

      allExplanations.forEach((explanation) => {
        expect(explanation.toLowerCase()).not.toContain('va');
        expect(explanation.toLowerCase()).not.toContain('sera');
        expect(explanation.toLowerCase()).not.toContain('conseil');
        expect(explanation.toLowerCase()).not.toContain('recommand');
        expect(explanation.toLowerCase()).not.toContain('devriez');
      });
    });
  });

  describe('calculateILPPComponents', () => {
    it('should calculate components from price snapshots', () => {
      const snapshots: BasketPriceSnapshot[] = [
        {
          basketId: 'b1',
          territoryId: 't1',
          totalPrice: 100,
          timestamp: Date.now() - 6 * 24 * 60 * 60 * 1000,
          date: '2024-01-01',
        },
        {
          basketId: 'b1',
          territoryId: 't1',
          totalPrice: 105,
          timestamp: Date.now() - 5 * 24 * 60 * 60 * 1000,
          date: '2024-01-02',
        },
        {
          basketId: 'b1',
          territoryId: 't1',
          totalPrice: 103,
          timestamp: Date.now() - 4 * 24 * 60 * 60 * 1000,
          date: '2024-01-03',
        },
        {
          basketId: 'b1',
          territoryId: 't1',
          totalPrice: 108,
          timestamp: Date.now() - 3 * 24 * 60 * 60 * 1000,
          date: '2024-01-04',
        },
        {
          basketId: 'b1',
          territoryId: 't1',
          totalPrice: 107,
          timestamp: Date.now() - 2 * 24 * 60 * 60 * 1000,
          date: '2024-01-05',
        },
        {
          basketId: 'b1',
          territoryId: 't1',
          totalPrice: 110,
          timestamp: Date.now() - 1 * 24 * 60 * 60 * 1000,
          date: '2024-01-06',
        },
        {
          basketId: 'b1',
          territoryId: 't1',
          totalPrice: 112,
          timestamp: Date.now(),
          date: '2024-01-07',
        },
      ];

      const components = calculateILPPComponents(snapshots);

      expect(components).not.toBeNull();
      expect(components!.avgChange).toBeGreaterThan(0); // Prices increased
      expect(components!.volatility).toBeGreaterThan(0);
      expect(components!.increaseFrequency).toBeGreaterThan(0);
      expect(components!.increaseFrequency).toBeLessThanOrEqual(100);
    });

    it('should return null for insufficient data', () => {
      const snapshots: BasketPriceSnapshot[] = [
        {
          basketId: 'b1',
          territoryId: 't1',
          totalPrice: 100,
          timestamp: Date.now(),
          date: '2024-01-01',
        },
      ];

      const components = calculateILPPComponents(snapshots);
      expect(components).toBeNull();
    });

    it('should handle stable prices', () => {
      const snapshots: BasketPriceSnapshot[] = [
        {
          basketId: 'b1',
          territoryId: 't1',
          totalPrice: 100,
          timestamp: Date.now() - 3 * 24 * 60 * 60 * 1000,
          date: '2024-01-01',
        },
        {
          basketId: 'b1',
          territoryId: 't1',
          totalPrice: 100,
          timestamp: Date.now() - 2 * 24 * 60 * 60 * 1000,
          date: '2024-01-02',
        },
        {
          basketId: 'b1',
          territoryId: 't1',
          totalPrice: 100,
          timestamp: Date.now() - 1 * 24 * 60 * 60 * 1000,
          date: '2024-01-03',
        },
        {
          basketId: 'b1',
          territoryId: 't1',
          totalPrice: 100,
          timestamp: Date.now(),
          date: '2024-01-04',
        },
      ];

      const components = calculateILPPComponents(snapshots);

      expect(components).not.toBeNull();
      expect(components!.avgChange).toBe(0);
      expect(components!.volatility).toBe(0);
      expect(components!.increaseFrequency).toBe(0);
    });
  });

  describe('computeILPPFromSnapshots', () => {
    it('should return unreliable result for insufficient data', () => {
      const snapshots: BasketPriceSnapshot[] = [
        {
          basketId: 'b1',
          territoryId: 't1',
          totalPrice: 100,
          timestamp: Date.now(),
          date: '2024-01-01',
        },
        {
          basketId: 'b1',
          territoryId: 't1',
          totalPrice: 105,
          timestamp: Date.now(),
          date: '2024-01-02',
        },
      ];

      const result = computeILPPFromSnapshots(snapshots, 't1');

      expect(result.isReliable).toBe(false);
      expect(result.explanation).toContain('insuffisantes');
    });

    it('should compute complete ILPP for sufficient data', () => {
      const snapshots: BasketPriceSnapshot[] = Array.from({ length: 10 }, (_, i) => ({
        basketId: 'b1',
        territoryId: 't1',
        totalPrice: 100 + i * 2, // Gradual increase
        timestamp: Date.now() - (10 - i) * 24 * 60 * 60 * 1000,
        date: `2024-01-${String(i + 1).padStart(2, '0')}`,
      }));

      const result = computeILPPFromSnapshots(snapshots, 't1');

      expect(result.isReliable).toBe(true);
      expect(result.score).toBeGreaterThan(0);
      expect(result.level).toBeDefined();
      expect(result.explanation).toBeTruthy();
      expect(result.dataPoints).toBe(10);
    });

    it('should detect low pressure for stable prices', () => {
      const snapshots: BasketPriceSnapshot[] = Array.from({ length: 10 }, (_, i) => ({
        basketId: 'b1',
        territoryId: 't1',
        totalPrice: 100, // Completely stable
        timestamp: Date.now() - (10 - i) * 24 * 60 * 60 * 1000,
        date: `2024-01-${String(i + 1).padStart(2, '0')}`,
      }));

      const result = computeILPPFromSnapshots(snapshots, 't1');

      expect(result.isReliable).toBe(true);
      expect(result.score).toBeLessThanOrEqual(20);
      expect(result.level).toBe('Très faible');
    });
  });

  describe('compareILPP', () => {
    it('should identify similar pressure levels', () => {
      const ilpp1: ILPPResult = {
        score: 45,
        level: 'Notable',
        explanation: 'Test',
        components: { avgChange: 5, volatility: 10, increaseFrequency: 50, dispersion: 15 },
        dataPoints: 10,
        isReliable: true,
      };

      const ilpp2: ILPPResult = {
        score: 47,
        level: 'Notable',
        explanation: 'Test',
        components: { avgChange: 6, volatility: 11, increaseFrequency: 52, dispersion: 16 },
        dataPoints: 10,
        isReliable: true,
      };

      const comparison = compareILPP(ilpp1, ilpp2);
      expect(comparison).toContain('similaire');
    });

    it('should identify significant differences', () => {
      const ilpp1: ILPPResult = {
        score: 30,
        level: 'Modérée',
        explanation: 'Test',
        components: { avgChange: 3, volatility: 8, increaseFrequency: 40, dispersion: 12 },
        dataPoints: 10,
        isReliable: true,
      };

      const ilpp2: ILPPResult = {
        score: 70,
        level: 'Forte',
        explanation: 'Test',
        components: { avgChange: 15, volatility: 20, increaseFrequency: 80, dispersion: 25 },
        dataPoints: 10,
        isReliable: true,
      };

      const comparison = compareILPP(ilpp1, ilpp2);
      expect(comparison).toContain('plus élevée');
      expect(comparison).toMatch(/\d+ points/);
    });
  });

  describe('getILPPColorClass', () => {
    it('should return appropriate color for each pressure level', () => {
      expect(getILPPColorClass(10)).toContain('green');
      expect(getILPPColorClass(30)).toContain('blue');
      expect(getILPPColorClass(50)).toContain('yellow');
      expect(getILPPColorClass(70)).toContain('orange');
      expect(getILPPColorClass(90)).toContain('red');
    });
  });

  describe('getILPPTextColorClass', () => {
    it('should return appropriate text color for each pressure level', () => {
      expect(getILPPTextColorClass(10)).toContain('green');
      expect(getILPPTextColorClass(30)).toContain('blue');
      expect(getILPPTextColorClass(50)).toContain('yellow');
      expect(getILPPTextColorClass(70)).toContain('orange');
      expect(getILPPTextColorClass(90)).toContain('red');
    });
  });
});
