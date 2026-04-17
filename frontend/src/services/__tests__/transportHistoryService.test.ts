/**
 * Unit Tests for Transport History Service v2.2.1
 */

import { describe, it, expect } from 'vitest';
import {
  buildTimeSeries,
  buildOperatorTimeSeries,
  detectSignificantVariations,
  analyzeSeasonality,
  calculateRollingAverage,
  comparePeriods,
  getPeriodStatistics,
  identifyOutliers,
  hasDiscontinuousData,
  getDateRange,
} from '../transportHistoryService';
import type {
  TransportPricePoint,
  TransportRouteIdentifier,
} from '../../types/transportComparison';

// Mock data for testing
const mockRoute: TransportRouteIdentifier = {
  origin: 'FDF',
  destination: 'ORY',
  originTerritory: 'MQ',
  destinationTerritory: 'FR',
  mode: 'plane',
  routeName: 'Fort-de-France → Paris Orly',
};

// Create mock prices over time
const createMockPriceHistory = (): TransportPricePoint[] => {
  const prices: TransportPricePoint[] = [];
  const basePrice = 400;

  // Generate 15 months of data
  for (let month = 0; month < 15; month++) {
    const date = new Date(2024, month, 15);
    const dateStr = date.toISOString();

    // Simulate seasonality (higher prices in summer and holidays)
    let seasonalFactor = 1.0;
    const monthOfYear = month % 12;
    if (monthOfYear >= 6 && monthOfYear <= 8) {
      // Summer season
      seasonalFactor = 1.15;
    } else if (monthOfYear === 11) {
      // December holidays
      seasonalFactor = 1.2;
    } else if (monthOfYear >= 1 && monthOfYear <= 2) {
      // Low season
      seasonalFactor = 0.9;
    }

    prices.push({
      operatorId: 'AF',
      operatorName: 'Air France',
      route: mockRoute,
      price: Math.round(basePrice * seasonalFactor * 100) / 100,
      currency: 'EUR',
      priceType: 'base',
      observationDate: dateStr,
      source: {
        type: 'official_site',
        url: 'https://www.airfrance.fr',
        observedAt: dateStr,
        verificationMethod: 'automated',
        reliability: 'high',
      },
      volume: 20 + Math.floor(Math.random() * 10),
      confidence: 'high',
      verified: true,
    });
  }

  return prices;
};

describe('Transport History Service v2.2.1', () => {
  describe('buildTimeSeries', () => {
    it('should build time series from price points', () => {
      const prices = createMockPriceHistory().slice(0, 5);
      const timeSeries = buildTimeSeries(prices, mockRoute);

      expect(timeSeries).toHaveLength(5);
      expect(timeSeries[0].route).toEqual(mockRoute);
      expect(timeSeries[0].averagePrice).toBeGreaterThan(0);
    });

    it('should return empty array for no prices', () => {
      const timeSeries = buildTimeSeries([], mockRoute);
      expect(timeSeries).toHaveLength(0);
    });

    it('should filter by route', () => {
      const prices = createMockPriceHistory();
      const differentRoute: TransportRouteIdentifier = {
        ...mockRoute,
        destination: 'CDG',
      };

      // Add some prices with different route
      const mixedPrices = [...prices.slice(0, 3), { ...prices[0], route: differentRoute }];

      const timeSeries = buildTimeSeries(mixedPrices, mockRoute);
      expect(timeSeries).toHaveLength(3);
    });

    it('should sort by date', () => {
      const prices = createMockPriceHistory().slice(0, 5).reverse();
      const timeSeries = buildTimeSeries(prices, mockRoute);

      for (let i = 1; i < timeSeries.length; i++) {
        expect(new Date(timeSeries[i].date).getTime()).toBeGreaterThanOrEqual(
          new Date(timeSeries[i - 1].date).getTime()
        );
      }
    });

    it('should aggregate same-day prices', () => {
      const sameDate = '2024-06-15T10:00:00Z';
      const prices: TransportPricePoint[] = [
        {
          operatorId: 'AF',
          operatorName: 'Air France',
          route: mockRoute,
          price: 400,
          currency: 'EUR',
          priceType: 'base',
          observationDate: sameDate,
          source: {
            type: 'official_site',
            observedAt: sameDate,
            verificationMethod: 'automated',
            reliability: 'high',
          },
          volume: 10,
          confidence: 'high',
          verified: true,
        },
        {
          operatorId: 'AC',
          operatorName: 'Air Caraïbes',
          route: mockRoute,
          price: 380,
          currency: 'EUR',
          priceType: 'base',
          observationDate: sameDate,
          source: {
            type: 'official_site',
            observedAt: sameDate,
            verificationMethod: 'automated',
            reliability: 'high',
          },
          volume: 15,
          confidence: 'high',
          verified: true,
        },
      ];

      const timeSeries = buildTimeSeries(prices, mockRoute);
      expect(timeSeries).toHaveLength(1);
      expect(timeSeries[0].averagePrice).toBe(390); // (400 + 380) / 2
      expect(timeSeries[0].minPrice).toBe(380);
      expect(timeSeries[0].maxPrice).toBe(400);
    });
  });

  describe('buildOperatorTimeSeries', () => {
    it('should build time series for specific operator', () => {
      const prices = createMockPriceHistory();
      const timeSeries = buildOperatorTimeSeries(prices, mockRoute, 'AF');

      expect(timeSeries.length).toBeGreaterThan(0);
      expect(timeSeries.every((p) => p.operatorId === 'AF')).toBe(true);
    });

    it('should return empty for non-existent operator', () => {
      const prices = createMockPriceHistory();
      const timeSeries = buildOperatorTimeSeries(prices, mockRoute, 'UNKNOWN');

      expect(timeSeries).toHaveLength(0);
    });
  });

  describe('detectSignificantVariations', () => {
    it('should detect significant price increases', () => {
      const prices = createMockPriceHistory();
      const timeSeries = buildTimeSeries(prices, mockRoute);
      const variations = detectSignificantVariations(timeSeries);

      expect(variations.length).toBeGreaterThan(0);
      const increases = variations.filter((v) => v.direction === 'increase');
      expect(increases.length).toBeGreaterThan(0);
    });

    it('should return empty for insufficient data', () => {
      const prices = createMockPriceHistory().slice(0, 1);
      const timeSeries = buildTimeSeries(prices, mockRoute);
      const variations = detectSignificantVariations(timeSeries);

      expect(variations).toHaveLength(0);
    });

    it('should calculate percentage changes correctly', () => {
      const mockTimeSeries = [
        {
          date: '2024-01-15',
          route: mockRoute,
          averagePrice: 400,
          minPrice: 390,
          maxPrice: 410,
          observationCount: 50,
          sources: [],
        },
        {
          date: '2024-02-15',
          route: mockRoute,
          averagePrice: 480, // 20% increase
          minPrice: 470,
          maxPrice: 490,
          observationCount: 50,
          sources: [],
        },
      ];

      const variations = detectSignificantVariations(mockTimeSeries);

      expect(variations).toHaveLength(1);
      expect(variations[0].direction).toBe('increase');
      expect(variations[0].percentageChange).toBe(20);
    });
  });

  describe('analyzeSeasonality', () => {
    it('should detect seasonality with sufficient data', () => {
      const prices = createMockPriceHistory();
      const timeSeries = buildTimeSeries(prices, mockRoute);
      const seasonality = analyzeSeasonality(timeSeries, mockRoute);

      expect(seasonality).not.toBeNull();
      expect(seasonality!.seasonalityDetected).toBe(true);
      expect(seasonality!.patterns).toBeDefined();
      expect(seasonality!.patterns!.highSeasonMonths.length).toBeGreaterThan(0);
    });

    it('should return null for insufficient data', () => {
      const prices = createMockPriceHistory().slice(0, 3);
      const timeSeries = buildTimeSeries(prices, mockRoute);
      const seasonality = analyzeSeasonality(timeSeries, mockRoute);

      expect(seasonality).toBeNull();
    });

    it('should identify high season months', () => {
      const prices = createMockPriceHistory();
      const timeSeries = buildTimeSeries(prices, mockRoute);
      const seasonality = analyzeSeasonality(timeSeries, mockRoute);

      expect(seasonality).not.toBeNull();
      expect(seasonality!.patterns).toBeDefined();
      // Summer months (7, 8, 9) and December (12) should be high season
      const highSeasonMonths = seasonality!.patterns!.highSeasonMonths;
      expect(highSeasonMonths.some((m) => (m >= 7 && m <= 9) || m === 12)).toBe(true);
    });

    it('should identify low season months', () => {
      const prices = createMockPriceHistory();
      const timeSeries = buildTimeSeries(prices, mockRoute);
      const seasonality = analyzeSeasonality(timeSeries, mockRoute);

      expect(seasonality).not.toBeNull();
      expect(seasonality!.patterns).toBeDefined();
      // Winter months (2, 3) should be low season
      const lowSeasonMonths = seasonality!.patterns!.lowSeasonMonths;
      expect(lowSeasonMonths.some((m) => m >= 2 && m <= 3)).toBe(true);
    });

    it('should calculate confidence based on data points', () => {
      const prices = createMockPriceHistory();
      const timeSeries = buildTimeSeries(prices, mockRoute);
      const seasonality = analyzeSeasonality(timeSeries, mockRoute);

      expect(seasonality).not.toBeNull();
      expect(seasonality!.confidence).toBe('high');
    });
  });

  describe('calculateRollingAverage', () => {
    it('should calculate rolling average', () => {
      const prices = createMockPriceHistory().slice(0, 10);
      const timeSeries = buildTimeSeries(prices, mockRoute);
      const rolling = calculateRollingAverage(timeSeries, 3);

      expect(rolling.length).toBeGreaterThan(0);
      expect(rolling.length).toBe(timeSeries.length - 2);
    });

    it('should return empty for insufficient window', () => {
      const prices = createMockPriceHistory().slice(0, 2);
      const timeSeries = buildTimeSeries(prices, mockRoute);
      const rolling = calculateRollingAverage(timeSeries, 3);

      expect(rolling).toHaveLength(0);
    });

    it('should smooth fluctuations', () => {
      const mockTimeSeries = [
        {
          date: '2024-01-01',
          route: mockRoute,
          averagePrice: 100,
          minPrice: 100,
          maxPrice: 100,
          observationCount: 10,
          sources: [],
        },
        {
          date: '2024-01-02',
          route: mockRoute,
          averagePrice: 200,
          minPrice: 200,
          maxPrice: 200,
          observationCount: 10,
          sources: [],
        },
        {
          date: '2024-01-03',
          route: mockRoute,
          averagePrice: 100,
          minPrice: 100,
          maxPrice: 100,
          observationCount: 10,
          sources: [],
        },
      ];

      const rolling = calculateRollingAverage(mockTimeSeries, 3);

      expect(rolling).toHaveLength(1);
      expect(rolling[0].rollingAverage).toBeCloseTo(133.33, 2);
    });
  });

  describe('comparePeriods', () => {
    it('should compare two time periods', () => {
      const prices = createMockPriceHistory();
      const timeSeries = buildTimeSeries(prices, mockRoute);

      const comparison = comparePeriods(
        timeSeries,
        '2024-01-01',
        '2024-03-31',
        '2024-07-01',
        '2024-09-30'
      );

      expect(comparison).not.toBeNull();
      expect(comparison!.period1Average).toBeGreaterThan(0);
      expect(comparison!.period2Average).toBeGreaterThan(0);
      expect(comparison!.trend).toBe('increasing'); // Summer is more expensive
    });

    it('should return null for periods with no data', () => {
      const prices = createMockPriceHistory().slice(0, 3);
      const timeSeries = buildTimeSeries(prices, mockRoute);

      const comparison = comparePeriods(
        timeSeries,
        '2024-01-01',
        '2024-01-31',
        '2025-01-01',
        '2025-01-31'
      );

      expect(comparison).toBeNull();
    });

    it('should detect decreasing trend', () => {
      const mockTimeSeries = [
        {
          date: '2024-01-15',
          route: mockRoute,
          averagePrice: 500,
          minPrice: 500,
          maxPrice: 500,
          observationCount: 10,
          sources: [],
        },
        {
          date: '2024-02-15',
          route: mockRoute,
          averagePrice: 450,
          minPrice: 450,
          maxPrice: 450,
          observationCount: 10,
          sources: [],
        },
      ];

      const comparison = comparePeriods(
        mockTimeSeries,
        '2024-01-01',
        '2024-01-31',
        '2024-02-01',
        '2024-02-28'
      );

      expect(comparison).not.toBeNull();
      expect(comparison!.trend).toBe('decreasing');
    });
  });

  describe('getPeriodStatistics', () => {
    it('should calculate statistics for period', () => {
      const prices = createMockPriceHistory();
      const timeSeries = buildTimeSeries(prices, mockRoute);
      const stats = getPeriodStatistics(timeSeries);

      expect(stats).not.toBeNull();
      expect(stats!.averagePrice).toBeGreaterThan(0);
      expect(stats!.minPrice).toBeLessThanOrEqual(stats!.averagePrice);
      expect(stats!.maxPrice).toBeGreaterThanOrEqual(stats!.averagePrice);
      expect(stats!.standardDeviation).toBeGreaterThanOrEqual(0);
    });

    it('should filter by date range', () => {
      const prices = createMockPriceHistory();
      const timeSeries = buildTimeSeries(prices, mockRoute);
      const stats = getPeriodStatistics(timeSeries, '2024-06-01', '2024-08-31');

      expect(stats).not.toBeNull();
      expect(stats!.dataPoints).toBeLessThan(timeSeries.length);
    });

    it('should return null for empty period', () => {
      const prices = createMockPriceHistory();
      const timeSeries = buildTimeSeries(prices, mockRoute);
      // Use a date range that's definitely outside the data range
      const stats = getPeriodStatistics(timeSeries, '2026-01-01', '2026-12-31');

      expect(stats).toBeNull();
    });
  });

  describe('identifyOutliers', () => {
    it('should identify outliers', () => {
      const mockTimeSeries = [
        {
          date: '2024-01-01',
          route: mockRoute,
          averagePrice: 400,
          minPrice: 400,
          maxPrice: 400,
          observationCount: 10,
          sources: [],
        },
        {
          date: '2024-01-02',
          route: mockRoute,
          averagePrice: 410,
          minPrice: 410,
          maxPrice: 410,
          observationCount: 10,
          sources: [],
        },
        {
          date: '2024-01-03',
          route: mockRoute,
          averagePrice: 405,
          minPrice: 405,
          maxPrice: 405,
          observationCount: 10,
          sources: [],
        },
        {
          date: '2024-01-04',
          route: mockRoute,
          averagePrice: 1000,
          minPrice: 1000,
          maxPrice: 1000,
          observationCount: 10,
          sources: [],
        }, // Strong outlier
      ];

      // Use a threshold of 1.5 standard deviations to detect the outlier
      const outliers = identifyOutliers(mockTimeSeries, 1.5);

      expect(outliers).toHaveLength(4);
      const outlierPoints = outliers.filter((o) => o.isOutlier);
      expect(outlierPoints.length).toBeGreaterThan(0);
      // The outlier should be the one with price 1000
      const strongOutlier = outliers.find((o) => o.price === 1000);
      expect(strongOutlier).toBeDefined();
      expect(strongOutlier!.isOutlier).toBe(true);
    });

    it('should return empty for insufficient data', () => {
      const mockTimeSeries = [
        {
          date: '2024-01-01',
          route: mockRoute,
          averagePrice: 400,
          minPrice: 400,
          maxPrice: 400,
          observationCount: 10,
          sources: [],
        },
      ];

      const outliers = identifyOutliers(mockTimeSeries);
      expect(outliers).toHaveLength(0);
    });
  });

  describe('hasDiscontinuousData', () => {
    it('should detect discontinuous data', () => {
      const mockTimeSeries = [
        {
          date: '2024-01-01',
          route: mockRoute,
          averagePrice: 400,
          minPrice: 400,
          maxPrice: 400,
          observationCount: 10,
          sources: [],
        },
        {
          date: '2024-01-15',
          route: mockRoute,
          averagePrice: 400,
          minPrice: 400,
          maxPrice: 400,
          observationCount: 10,
          sources: [],
        }, // 14 days gap
      ];

      const isDiscontinuous = hasDiscontinuousData(mockTimeSeries, 7);
      expect(isDiscontinuous).toBe(true);
    });

    it('should return false for continuous data', () => {
      const mockTimeSeries = [
        {
          date: '2024-01-01',
          route: mockRoute,
          averagePrice: 400,
          minPrice: 400,
          maxPrice: 400,
          observationCount: 10,
          sources: [],
        },
        {
          date: '2024-01-03',
          route: mockRoute,
          averagePrice: 400,
          minPrice: 400,
          maxPrice: 400,
          observationCount: 10,
          sources: [],
        },
        {
          date: '2024-01-05',
          route: mockRoute,
          averagePrice: 400,
          minPrice: 400,
          maxPrice: 400,
          observationCount: 10,
          sources: [],
        },
      ];

      const isDiscontinuous = hasDiscontinuousData(mockTimeSeries, 7);
      expect(isDiscontinuous).toBe(false);
    });

    it('should return false for insufficient data', () => {
      const mockTimeSeries = [
        {
          date: '2024-01-01',
          route: mockRoute,
          averagePrice: 400,
          minPrice: 400,
          maxPrice: 400,
          observationCount: 10,
          sources: [],
        },
      ];

      const isDiscontinuous = hasDiscontinuousData(mockTimeSeries);
      expect(isDiscontinuous).toBe(false);
    });
  });

  describe('getDateRange', () => {
    it('should return date range', () => {
      const prices = createMockPriceHistory();
      const timeSeries = buildTimeSeries(prices, mockRoute);
      const range = getDateRange(timeSeries);

      expect(range).not.toBeNull();
      expect(range!.startDate).toBeDefined();
      expect(range!.endDate).toBeDefined();
      expect(range!.durationDays).toBeGreaterThan(0);
    });

    it('should return null for empty time series', () => {
      const range = getDateRange([]);
      expect(range).toBeNull();
    });

    it('should calculate duration correctly', () => {
      const mockTimeSeries = [
        {
          date: '2024-01-01',
          route: mockRoute,
          averagePrice: 400,
          minPrice: 400,
          maxPrice: 400,
          observationCount: 10,
          sources: [],
        },
        {
          date: '2024-01-31',
          route: mockRoute,
          averagePrice: 400,
          minPrice: 400,
          maxPrice: 400,
          observationCount: 10,
          sources: [],
        },
      ];

      const range = getDateRange(mockTimeSeries);

      expect(range).not.toBeNull();
      expect(range!.durationDays).toBe(30);
    });
  });

  describe('Edge Cases - Discontinuous Data', () => {
    it('should handle long gaps in data', () => {
      const prices: TransportPricePoint[] = [
        {
          operatorId: 'AF',
          operatorName: 'Air France',
          route: mockRoute,
          price: 400,
          currency: 'EUR',
          priceType: 'base',
          observationDate: '2024-01-15T10:00:00Z',
          source: {
            type: 'official_site',
            observedAt: '2024-01-15T10:00:00Z',
            verificationMethod: 'automated',
            reliability: 'high',
          },
          volume: 10,
          confidence: 'high',
          verified: true,
        },
        {
          operatorId: 'AF',
          operatorName: 'Air France',
          route: mockRoute,
          price: 450,
          currency: 'EUR',
          priceType: 'base',
          observationDate: '2024-06-15T10:00:00Z', // 5 months gap
          source: {
            type: 'official_site',
            observedAt: '2024-06-15T10:00:00Z',
            verificationMethod: 'automated',
            reliability: 'high',
          },
          volume: 10,
          confidence: 'high',
          verified: true,
        },
      ];

      const timeSeries = buildTimeSeries(prices, mockRoute);
      expect(timeSeries).toHaveLength(2);

      const isDiscontinuous = hasDiscontinuousData(timeSeries, 30);
      expect(isDiscontinuous).toBe(true);
    });
  });

  describe('Edge Cases - Short and Long Periods', () => {
    it('should handle short period (< 3 months)', () => {
      const prices = createMockPriceHistory().slice(0, 2);
      const timeSeries = buildTimeSeries(prices, mockRoute);

      expect(timeSeries.length).toBe(2);
      const stats = getPeriodStatistics(timeSeries);
      expect(stats).not.toBeNull();
    });

    it('should handle long period (> 12 months)', () => {
      const prices = createMockPriceHistory(); // 15 months
      const timeSeries = buildTimeSeries(prices, mockRoute);

      expect(timeSeries.length).toBeGreaterThan(12);
      const seasonality = analyzeSeasonality(timeSeries, mockRoute);
      expect(seasonality).not.toBeNull();
      expect(seasonality!.confidence).toBe('high');
    });
  });
});
