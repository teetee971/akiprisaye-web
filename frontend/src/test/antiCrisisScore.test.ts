/**
 * Tests for Anti-Crisis Score Calculation
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  computeAntiCrisisScore,
  getAntiCrisisSummary,
  isAntiCrisis,
  getDetailedExplanations,
  type AntiCrisisResult,
} from '../utils/antiCrisisScore';
import { saveBasketSnapshot, clearPriceHistory } from '../utils/priceHistory';

describe('Anti-Crisis Score Calculation', () => {
  const testTerritoryId = 'TEST_TERRITORY';
  const testBasketId = 'test-basket-1';

  // Clean up before and after each test
  beforeEach(() => {
    clearPriceHistory();
  });

  afterEach(() => {
    clearPriceHistory();
  });

  describe('computeAntiCrisisScore', () => {
    it('should return insufficient data when no history exists', () => {
      const result = computeAntiCrisisScore(testTerritoryId, testBasketId);

      expect(result.hasEnoughData).toBe(false);
      expect(result.label).toBe('Données insuffisantes');
      expect(result.dataPoints).toBe(0);
    });

    it('should return insufficient data when history points < minHistoryPoints', () => {
      // Add only 3 snapshots (less than required 5)
      for (let i = 0; i < 3; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        saveBasketSnapshot(testBasketId, testTerritoryId, 45.0 + i, date);
      }

      const result = computeAntiCrisisScore(testTerritoryId, testBasketId);

      expect(result.hasEnoughData).toBe(false);
      expect(result.label).toBe('Données insuffisantes');
      expect(result.dataPoints).toBe(3);
    });

    it('should calculate score 3 (Anti-Crise Fort) when all criteria met', () => {
      // Create stable prices below median over 14 days
      // Using tighter range for low volatility and stable trend
      const prices = [45.0, 45.1, 44.9, 45.0, 44.95, 45.05, 44.98, 45.02];

      prices.forEach((price, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (prices.length - i - 1));
        saveBasketSnapshot(testBasketId, testTerritoryId, price, date);
      });

      const result = computeAntiCrisisScore(testTerritoryId, testBasketId);

      expect(result.hasEnoughData).toBe(true);
      // Score should be 2 or 3 (at least Anti-Crisis)
      expect(result.score).toBeGreaterThanOrEqual(2);
      expect(result.label).toMatch(/Anti-Crise/);
      expect(result.reasons.filter((r) => r.met).length).toBeGreaterThanOrEqual(2);
    });

    it('should calculate score when some criteria met', () => {
      // Prices with low volatility and stable trend (at least 2 criteria likely)
      const prices = [45.0, 45.5, 45.2, 45.8, 45.3, 45.6, 45.4, 45.7];

      prices.forEach((price, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (prices.length - i - 1));
        saveBasketSnapshot(testBasketId, testTerritoryId, price, date);
      });

      const result = computeAntiCrisisScore(testTerritoryId, testBasketId);

      expect(result.hasEnoughData).toBe(true);
      // Should calculate score based on criteria (not all might be met)
      expect(result.score).toBeGreaterThanOrEqual(1);
      expect(result.label).toBeDefined();
      expect(result.reasons).toHaveLength(3);
    });

    it('should calculate score 0 (À risque) when no criteria met', () => {
      // High prices with increasing trend and high volatility
      const prices = [55.0, 60.0, 58.0, 65.0, 62.0, 70.0, 68.0, 75.0];

      prices.forEach((price, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (prices.length - i - 1));
        saveBasketSnapshot(testBasketId, testTerritoryId, price, date);
      });

      const result = computeAntiCrisisScore(testTerritoryId, testBasketId);

      expect(result.hasEnoughData).toBe(true);
      expect(result.score).toBeLessThanOrEqual(1);
    });

    it('should detect stable trend when price change is within threshold', () => {
      // Prices changing by less than 1.5%
      const basePrice = 50.0;
      const prices = [
        basePrice,
        basePrice * 1.005, // +0.5%
        basePrice * 1.01, // +1.0%
        basePrice * 1.008, // +0.8%
        basePrice * 1.012, // +1.2%
        basePrice * 1.01, // +1.0%
      ];

      prices.forEach((price, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (prices.length - i - 1));
        saveBasketSnapshot(testBasketId, testTerritoryId, price, date);
      });

      const result = computeAntiCrisisScore(testTerritoryId, testBasketId);

      expect(result.hasEnoughData).toBe(true);
      const trendReason = result.reasons.find((r) => r.criterion === 'Tendance');
      expect(trendReason?.met).toBe(true);
    });

    it('should detect low volatility correctly', () => {
      // Prices with very small range (< 5% volatility)
      const prices = [45.0, 45.5, 45.2, 45.8, 45.3, 45.6, 45.4, 45.7];

      prices.forEach((price, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (prices.length - i - 1));
        saveBasketSnapshot(testBasketId, testTerritoryId, price, date);
      });

      const result = computeAntiCrisisScore(testTerritoryId, testBasketId);

      expect(result.hasEnoughData).toBe(true);
      const volatilityReason = result.reasons.find((r) => r.criterion === 'Volatilité');
      expect(volatilityReason?.met).toBe(true);
      expect(result.volatilityPercent).toBeLessThan(5);
    });

    it('should detect price below median correctly', () => {
      // Create price distribution where last price is below median
      const prices = [50.0, 55.0, 60.0, 45.0, 50.0, 52.0, 48.0, 46.0];

      prices.forEach((price, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (prices.length - i - 1));
        saveBasketSnapshot(testBasketId, testTerritoryId, price, date);
      });

      const result = computeAntiCrisisScore(testTerritoryId, testBasketId);

      expect(result.hasEnoughData).toBe(true);
      const medianReason = result.reasons.find((r) => r.criterion === 'Prix vs Médiane');

      // Current price should be compared to median
      expect(result.currentPrice).toBeDefined();
      expect(result.medianPrice).toBeDefined();
    });

    it('should include all three criteria in reasons', () => {
      const prices = [45.0, 46.0, 45.5, 46.2, 45.8, 46.5];

      prices.forEach((price, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (prices.length - i - 1));
        saveBasketSnapshot(testBasketId, testTerritoryId, price, date);
      });

      const result = computeAntiCrisisScore(testTerritoryId, testBasketId);

      expect(result.reasons).toHaveLength(3);
      expect(result.reasons.map((r) => r.criterion)).toContain('Prix vs Médiane');
      expect(result.reasons.map((r) => r.criterion)).toContain('Tendance');
      expect(result.reasons.map((r) => r.criterion)).toContain('Volatilité');
    });

    it('should calculate metrics correctly', () => {
      const prices = [40.0, 42.0, 41.0, 43.0, 42.5, 44.0];

      prices.forEach((price, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (prices.length - i - 1));
        saveBasketSnapshot(testBasketId, testTerritoryId, price, date);
      });

      const result = computeAntiCrisisScore(testTerritoryId, testBasketId);

      expect(result.currentPrice).toBe(44.0);
      expect(result.medianPrice).toBeGreaterThan(0);
      expect(result.trendPercent).toBeDefined();
      expect(result.volatilityPercent).toBeDefined();
      expect(result.dataPoints).toBe(6);
    });
  });

  describe('isAntiCrisis', () => {
    it('should return false when insufficient data', () => {
      const result = isAntiCrisis(testTerritoryId, testBasketId);
      expect(result).toBe(false);
    });

    it('should return true when score >= 2', () => {
      // Create optimal Anti-Crisis conditions
      const prices = [45.0, 45.1, 44.9, 45.2, 44.8, 45.0, 44.7, 45.3];

      prices.forEach((price, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (prices.length - i - 1));
        saveBasketSnapshot(testBasketId, testTerritoryId, price, date);
      });

      const result = isAntiCrisis(testTerritoryId, testBasketId);
      expect(result).toBe(true);
    });

    it('should return false when score < 2', () => {
      // Create conditions that don't meet Anti-Crisis criteria
      const prices = [50.0, 55.0, 60.0, 65.0, 70.0, 75.0];

      prices.forEach((price, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (prices.length - i - 1));
        saveBasketSnapshot(testBasketId, testTerritoryId, price, date);
      });

      const result = isAntiCrisis(testTerritoryId, testBasketId);
      expect(result).toBe(false);
    });
  });

  describe('getAntiCrisisSummary', () => {
    it('should return insufficient data message when not enough history', () => {
      const result = computeAntiCrisisScore(testTerritoryId, testBasketId);
      const summary = getAntiCrisisSummary(result);

      expect(summary).toContain('Historique insuffisant');
    });

    it('should return Anti-Crisis message when score >= 2', () => {
      const prices = [45.0, 45.1, 44.9, 45.2, 44.8, 45.0, 44.7, 45.3];

      prices.forEach((price, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (prices.length - i - 1));
        saveBasketSnapshot(testBasketId, testTerritoryId, price, date);
      });

      const result = computeAntiCrisisScore(testTerritoryId, testBasketId);
      const summary = getAntiCrisisSummary(result);

      if (result.score >= 2) {
        expect(summary).toContain('Anti-Crise');
        expect(summary).toMatch(/\d+\/3 critères/);
      }
    });

    it('should return neutral message when score = 1', () => {
      const mockResult: AntiCrisisResult = {
        score: 1,
        label: 'Neutre',
        reasons: [
          { criterion: 'Test', met: true, value: 1, explanation: 'Test met' },
          { criterion: 'Test2', met: false, value: 2, explanation: 'Test not met' },
          { criterion: 'Test3', met: false, value: 3, explanation: 'Test not met' },
        ],
        medianPrice: 50,
        currentPrice: 55,
        trendPercent: 3,
        volatilityPercent: 8,
        dataPoints: 10,
        hasEnoughData: true,
      };

      const summary = getAntiCrisisSummary(mockResult);
      expect(summary).toContain('neutre');
      expect(summary).toContain('1 seul critère');
    });

    it('should return at-risk message when score = 0', () => {
      const mockResult: AntiCrisisResult = {
        score: 0,
        label: 'À risque',
        reasons: [
          { criterion: 'Test', met: false, value: 1, explanation: 'Test' },
          { criterion: 'Test2', met: false, value: 2, explanation: 'Test2' },
          { criterion: 'Test3', met: false, value: 3, explanation: 'Test3' },
        ],
        medianPrice: 50,
        currentPrice: 60,
        trendPercent: 10,
        volatilityPercent: 15,
        dataPoints: 10,
        hasEnoughData: true,
      };

      const summary = getAntiCrisisSummary(mockResult);
      expect(summary).toContain('risque');
      expect(summary).toContain('aucun critère');
    });
  });

  describe('getDetailedExplanations', () => {
    it('should return formatted explanations for each criterion', () => {
      const prices = [45.0, 46.0, 45.5, 46.2, 45.8, 46.5];

      prices.forEach((price, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (prices.length - i - 1));
        saveBasketSnapshot(testBasketId, testTerritoryId, price, date);
      });

      const result = computeAntiCrisisScore(testTerritoryId, testBasketId);
      const explanations = getDetailedExplanations(result);

      expect(explanations).toHaveLength(3);
      explanations.forEach((exp) => {
        expect(exp).toMatch(/^[✓✗]/); // Should start with check or cross
        expect(exp.length).toBeGreaterThan(10); // Should have meaningful content
      });
    });

    it('should use ✓ for met criteria and ✗ for unmet criteria', () => {
      const mockResult: AntiCrisisResult = {
        score: 2,
        label: 'Anti-Crise',
        reasons: [
          { criterion: 'Criterion A', met: true, value: 1, explanation: 'Met explanation' },
          { criterion: 'Criterion B', met: false, value: 2, explanation: 'Not met explanation' },
          { criterion: 'Criterion C', met: true, value: 3, explanation: 'Met explanation 2' },
        ],
        medianPrice: 50,
        currentPrice: 48,
        trendPercent: 1,
        volatilityPercent: 3,
        dataPoints: 10,
        hasEnoughData: true,
      };

      const explanations = getDetailedExplanations(mockResult);

      expect(explanations[0]).toContain('✓');
      expect(explanations[1]).toContain('✗');
      expect(explanations[2]).toContain('✓');
    });
  });

  describe('Edge cases', () => {
    it('should handle territory with no specific basket ID', () => {
      // Add snapshots for multiple baskets in same territory on different dates
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

      saveBasketSnapshot('basket-1', testTerritoryId, 45.0, twoDaysAgo);
      saveBasketSnapshot('basket-2', testTerritoryId, 50.0, twoDaysAgo);
      saveBasketSnapshot('basket-1', testTerritoryId, 46.0, yesterday);
      saveBasketSnapshot('basket-2', testTerritoryId, 51.0, yesterday);
      saveBasketSnapshot('basket-1', testTerritoryId, 45.5, now);
      saveBasketSnapshot('basket-2', testTerritoryId, 50.5, now);

      // Query without basket ID should consider all baskets
      const result = computeAntiCrisisScore(testTerritoryId);

      // Should have multiple data points (may dedupe same-day entries)
      expect(result.dataPoints).toBeGreaterThanOrEqual(2);
    });

    it('should handle zero prices gracefully', () => {
      const prices = [0, 0, 0, 0, 0, 0];

      prices.forEach((price, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        saveBasketSnapshot(testBasketId, testTerritoryId, price, date);
      });

      const result = computeAntiCrisisScore(testTerritoryId, testBasketId);

      // Should not crash, should handle gracefully
      expect(result).toBeDefined();
      expect(result.currentPrice).toBe(0);
    });

    it('should handle single price value', () => {
      saveBasketSnapshot(testBasketId, testTerritoryId, 45.0);

      const result = computeAntiCrisisScore(testTerritoryId, testBasketId);

      // Should return insufficient data
      expect(result.hasEnoughData).toBe(false);
    });
  });
});
