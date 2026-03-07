 
/**
 * Unit Tests for Housing Cost Observatory Service v2.4.0
 */

import { describe, it, expect } from 'vitest';
import {
  analyzeHousingCosts,
  calculateHousingAggregation,
  generateHousingMetadata,
  applyHousingFilters,
  buildHousingHistory,
  calculateHousingVariation,
  rankHousingByRentPerM2,
} from '../housingCostService';
import type { HousingPricePoint } from '../../types/housingCost';

// Mock data for testing
const mockUrbanHousing: HousingPricePoint[] = [
  {
    housingId: 'MQ_FDF_001',
    type: 'T2',
    surface: 50,
    rent: 650,
    charges: 80,
    territory: 'MQ',
    location: {
      city: 'Fort-de-France',
      postalCode: '97200',
      urbanRuralClassification: 'urban',
    },
    furnished: false,
    observationDate: '2025-12-20T10:00:00Z',
    source: {
      type: 'official_site',
      url: 'https://example.com',
      observedAt: '2025-12-20T10:00:00Z',
      verificationMethod: 'automated',
      reliability: 'high',
    },
    volume: 10,
    confidence: 'high',
    verified: true,
  },
  {
    housingId: 'MQ_FDF_002',
    type: 'T2',
    surface: 48,
    rent: 600,
    charges: 75,
    territory: 'MQ',
    location: {
      city: 'Fort-de-France',
      postalCode: '97200',
      urbanRuralClassification: 'urban',
    },
    furnished: false,
    observationDate: '2025-12-21T10:00:00Z',
    source: {
      type: 'user_report',
      observedAt: '2025-12-21T10:00:00Z',
      verificationMethod: 'manual',
      reliability: 'medium',
    },
    volume: 5,
    confidence: 'medium',
    verified: false,
  },
  {
    housingId: 'MQ_FDF_003',
    type: 'T3',
    surface: 75,
    rent: 900,
    charges: 100,
    territory: 'MQ',
    location: {
      city: 'Fort-de-France',
      postalCode: '97200',
      urbanRuralClassification: 'urban',
    },
    furnished: true,
    observationDate: '2025-12-22T10:00:00Z',
    source: {
      type: 'official_site',
      observedAt: '2025-12-22T10:00:00Z',
      verificationMethod: 'automated',
      reliability: 'high',
    },
    volume: 8,
    confidence: 'high',
    verified: true,
  },
];

const mockRuralHousing: HousingPricePoint[] = [
  {
    housingId: 'MQ_RURAL_001',
    type: 'HOUSE',
    surface: 120,
    rent: 1000,
    charges: 50,
    territory: 'MQ',
    location: {
      city: 'Le Marin',
      postalCode: '97290',
      urbanRuralClassification: 'rural',
    },
    furnished: false,
    observationDate: '2025-12-20T10:00:00Z',
    source: {
      type: 'official_site',
      observedAt: '2025-12-20T10:00:00Z',
      verificationMethod: 'automated',
      reliability: 'high',
    },
    volume: 3,
    confidence: 'high',
    verified: true,
  },
];

describe('Housing Cost Observatory Service v2.4.0', () => {
  describe('analyzeHousingCosts', () => {
    it('should return null for empty price points', () => {
      const result = analyzeHousingCosts([], 'MQ');
      expect(result).toBeNull();
    });

    it('should return null for null price points', () => {
      const result = analyzeHousingCosts(null as any, 'MQ');
      expect(result).toBeNull();
    });

    it('should return null when no prices match territory', () => {
      const result = analyzeHousingCosts(mockUrbanHousing, 'GP');
      expect(result).toBeNull();
    });

    it('should successfully analyze housing costs', () => {
      const result = analyzeHousingCosts(mockUrbanHousing, 'MQ');
      
      expect(result).not.toBeNull();
      expect(result!.territory).toBe('MQ');
      expect(result!.pricePoints.length).toBe(3);
      expect(result!.aggregation.statistics.listingCount).toBe(3);
    });

    it('should filter by housing type', () => {
      const result = analyzeHousingCosts(mockUrbanHousing, 'MQ', 'T2');
      
      expect(result).not.toBeNull();
      expect(result!.pricePoints.length).toBe(2);
      expect(result!.housingType).toBe('T2');
    });

    it('should calculate rent per m²', () => {
      const result = analyzeHousingCosts(mockUrbanHousing, 'MQ');
      
      expect(result).not.toBeNull();
      expect(result!.pricePoints[0].rentPerM2).toBeGreaterThan(0);
      expect(result!.pricePoints[0].rentPerM2).toBe(Math.round((650 / 50) * 100) / 100);
    });
  });

  describe('calculateHousingAggregation', () => {
    it('should calculate aggregation correctly', () => {
      const aggregation = calculateHousingAggregation(mockUrbanHousing, 'MQ');
      
      expect(aggregation.territory).toBe('MQ');
      expect(aggregation.statistics.listingCount).toBe(3);
      expect(aggregation.statistics.averageRent).toBeCloseTo(716.67, 2);
      expect(aggregation.statistics.medianRent).toBe(650);
      expect(aggregation.statistics.minRent).toBe(600);
      expect(aggregation.statistics.maxRent).toBe(900);
    });

    it('should throw error for empty price list', () => {
      expect(() => calculateHousingAggregation([], 'MQ')).toThrow();
    });

    it('should calculate dispersion metrics', () => {
      const aggregation = calculateHousingAggregation(mockUrbanHousing, 'MQ');
      
      expect(aggregation.dispersion.standardDeviation).toBeGreaterThan(0);
      expect(aggregation.dispersion.coefficientOfVariation).toBeGreaterThan(0);
      expect(aggregation.dispersion.interquartileRange).toBeGreaterThanOrEqual(0);
    });

    it('should calculate urban/rural breakdown', () => {
      const allHousing = [...mockUrbanHousing, ...mockRuralHousing];
      const aggregation = calculateHousingAggregation(allHousing, 'MQ');
      
      expect(aggregation.urbanRuralBreakdown).toBeDefined();
      expect(aggregation.urbanRuralBreakdown!.urban).toBe(3);
      expect(aggregation.urbanRuralBreakdown!.rural).toBe(1);
    });
  });

  describe('applyHousingFilters', () => {
    const allHousing = [...mockUrbanHousing, ...mockRuralHousing];

    it('should filter by territory', () => {
      const filtered = applyHousingFilters(allHousing, { territory: 'MQ' });
      expect(filtered.length).toBe(4);
    });

    it('should filter by housing type', () => {
      const filtered = applyHousingFilters(allHousing, { housingType: 'T2' });
      expect(filtered.length).toBe(2);
      expect(filtered.every(h => h.type === 'T2')).toBe(true);
    });

    it('should filter by surface range', () => {
      const filtered = applyHousingFilters(allHousing, { minSurface: 50, maxSurface: 80 });
      expect(filtered.length).toBe(2);
      expect(filtered.every(h => h.surface >= 50 && h.surface <= 80)).toBe(true);
    });

    it('should filter by rent range', () => {
      const filtered = applyHousingFilters(allHousing, { minRent: 650, maxRent: 900 });
      expect(filtered.length).toBe(2);
      expect(filtered.every(h => h.rent >= 650 && h.rent <= 900)).toBe(true);
    });

    it('should filter by furnished status', () => {
      const filtered = applyHousingFilters(allHousing, { furnished: true });
      expect(filtered.length).toBe(1);
      expect(filtered[0].type).toBe('T3');
    });

    it('should filter by urban/rural classification', () => {
      const filtered = applyHousingFilters(allHousing, { urbanRuralClassification: 'rural' });
      expect(filtered.length).toBe(1);
      expect(filtered[0].type).toBe('HOUSE');
    });

    it('should filter by verified only', () => {
      const filtered = applyHousingFilters(allHousing, { verifiedOnly: true });
      expect(filtered.every(h => h.verified)).toBe(true);
      expect(filtered.length).toBe(3);
    });

    it('should apply multiple filters', () => {
      const filtered = applyHousingFilters(allHousing, {
        territory: 'MQ',
        housingType: 'T2',
        minSurface: 48,
        verifiedOnly: true,
      });
      expect(filtered.length).toBe(1);
      expect(filtered[0].housingId).toBe('MQ_FDF_001');
    });
  });

  describe('generateHousingMetadata', () => {
    it('should generate metadata with correct structure', () => {
      const metadata = generateHousingMetadata(mockUrbanHousing);
      
      expect(metadata.methodology).toBe('v2.4.0');
      expect(metadata.aggregationMethod).toBe('median');
      expect(metadata.dataQuality.totalListings).toBe(3);
      expect(metadata.limitations).toBeDefined();
      expect(metadata.limitations.length).toBeGreaterThan(0);
    });

    it('should calculate source summary', () => {
      const metadata = generateHousingMetadata(mockUrbanHousing);
      
      expect(metadata.sources.length).toBeGreaterThan(0);
      const totalPercentage = metadata.sources.reduce((sum, s) => sum + s.percentage, 0);
      expect(totalPercentage).toBeCloseTo(100, 0);
    });
  });

  describe('buildHousingHistory', () => {
    it('should build housing history', () => {
      const history = buildHousingHistory(mockUrbanHousing, 'MQ');
      
      expect(history.length).toBeGreaterThan(0);
      expect(history[0].territory).toBe('MQ');
      expect(history[0].averageRent).toBeGreaterThan(0);
    });

    it('should return empty for no data', () => {
      const history = buildHousingHistory([], 'MQ');
      expect(history).toHaveLength(0);
    });

    it('should filter by housing type', () => {
      const history = buildHousingHistory(mockUrbanHousing, 'MQ', 'T2');
      
      expect(history.length).toBeGreaterThan(0);
      expect(history[0].housingType).toBe('T2');
    });

    it('should group by month', () => {
      // Create housing data across multiple months
      const multiMonthData: HousingPricePoint[] = [
        { ...mockUrbanHousing[0], observationDate: '2025-01-15T10:00:00Z' },
        { ...mockUrbanHousing[1], observationDate: '2025-02-15T10:00:00Z' },
        { ...mockUrbanHousing[2], observationDate: '2025-03-15T10:00:00Z' },
      ];
      
      const history = buildHousingHistory(multiMonthData, 'MQ');
      expect(history.length).toBe(3);
    });
  });

  describe('calculateHousingVariation', () => {
    it('should calculate variation correctly', () => {
      const history = [
        {
          date: '2025-01-01',
          territory: 'MQ' as const,
          averageRent: 600,
          medianRent: 600,
          averageRentPerM2: 12,
          medianRentPerM2: 12,
          listingCount: 10,
          sources: [],
        },
        {
          date: '2025-06-01',
          territory: 'MQ' as const,
          averageRent: 660,
          medianRent: 660,
          averageRentPerM2: 13.2,
          medianRentPerM2: 13.2,
          listingCount: 10,
          sources: [],
        },
      ];
      
      const variation = calculateHousingVariation(history);
      
      expect(variation).not.toBeNull();
      expect(variation!.variation.absoluteChange).toBe(60);
      expect(variation!.variation.percentageChange).toBe(10);
      expect(variation!.variation.direction).toBe('increase');
    });

    it('should return null for insufficient data', () => {
      const history = [
        {
          date: '2025-01-01',
          territory: 'MQ' as const,
          averageRent: 600,
          medianRent: 600,
          averageRentPerM2: 12,
          medianRentPerM2: 12,
          listingCount: 10,
          sources: [],
        },
      ];
      
      const variation = calculateHousingVariation(history);
      expect(variation).toBeNull();
    });

    it('should detect stable variation', () => {
      const history = [
        {
          date: '2025-01-01',
          territory: 'MQ' as const,
          averageRent: 600,
          medianRent: 600,
          averageRentPerM2: 12,
          medianRentPerM2: 12,
          listingCount: 10,
          sources: [],
        },
        {
          date: '2025-02-01',
          territory: 'MQ' as const,
          averageRent: 610,
          medianRent: 610,
          averageRentPerM2: 12.2,
          medianRentPerM2: 12.2,
          listingCount: 10,
          sources: [],
        },
      ];
      
      const variation = calculateHousingVariation(history);
      
      expect(variation).not.toBeNull();
      expect(variation!.variation.direction).toBe('stable');
    });
  });

  describe('rankHousingByRentPerM2', () => {
    it('should rank housing by rent per m²', () => {
      const medianRentPerM2 = 13;
      const ranked = rankHousingByRentPerM2(mockUrbanHousing, medianRentPerM2);
      
      expect(ranked.length).toBe(3);
      expect(ranked[0].rank).toBe(1);
      expect(ranked[0].rentPerM2).toBeLessThanOrEqual(ranked[1].rentPerM2);
    });

    it('should categorize prices correctly', () => {
      const medianRentPerM2 = 13;
      const ranked = rankHousingByRentPerM2(mockUrbanHousing, medianRentPerM2);
      
      expect(ranked.every(r => r.priceCategory)).toBeDefined();
    });

    it('should return empty for empty input', () => {
      const ranked = rankHousingByRentPerM2([], 13);
      expect(ranked).toHaveLength(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle single listing', () => {
      const singleListing = [mockUrbanHousing[0]];
      const result = analyzeHousingCosts(singleListing, 'MQ');
      
      expect(result).not.toBeNull();
      expect(result!.pricePoints.length).toBe(1);
      expect(result!.aggregation.statistics.minRent).toBe(result!.aggregation.statistics.maxRent);
    });

    it('should handle atypical housing (very large or very small)', () => {
      const atypicalHousing: HousingPricePoint = {
        housingId: 'ATYPICAL_001',
        type: 'STUDIO',
        surface: 15, // Very small
        rent: 400,
        territory: 'MQ',
        observationDate: '2025-12-20T10:00:00Z',
        source: {
          type: 'official_site',
          observedAt: '2025-12-20T10:00:00Z',
          verificationMethod: 'automated',
          reliability: 'high',
        },
        volume: 1,
        confidence: 'high',
        verified: true,
      };
      
      const result = analyzeHousingCosts([atypicalHousing], 'MQ');
      
      expect(result).not.toBeNull();
      expect(result!.pricePoints[0].rentPerM2).toBeGreaterThan(20); // High per m² due to small surface
    });

    it('should handle low volume data', () => {
      const lowVolume = [mockUrbanHousing[0], mockUrbanHousing[1]];
      const result = analyzeHousingCosts(lowVolume, 'MQ');
      
      expect(result).not.toBeNull();
      expect(result!.aggregation.statistics.listingCount).toBe(2);
    });

    it('should handle missing optional fields', () => {
      const incomplete: HousingPricePoint = {
        housingId: 'INCOMPLETE_001',
        type: 'T2',
        surface: 50,
        rent: 650,
        territory: 'MQ',
        observationDate: '2025-12-20T10:00:00Z',
        source: {
          type: 'user_report',
          observedAt: '2025-12-20T10:00:00Z',
          verificationMethod: 'manual',
          reliability: 'medium',
        },
        volume: 1,
        confidence: 'medium',
        verified: false,
      };
      
      const result = analyzeHousingCosts([incomplete], 'MQ');
      
      expect(result).not.toBeNull();
      expect(result!.pricePoints[0].totalCostPerM2).toBeUndefined();
    });
  });
});
