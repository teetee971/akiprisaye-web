/**
 * Unit Tests for Global Mobility Cost Index Service v3.0.0
 */

import { describe, it, expect } from 'vitest';
import {
  calculateGlobalMobilityIndex,
  compareMobilityIndexPeriods,
  compareTerritoriesMobilityIndex,
  applyMobilityIndexFilters,
} from '../globalMobilityIndexService';
import type { MobilityCostComponent, MobilityIndexPeriod } from '../../types/globalMobilityIndex';

// Mock transport components
const mockTransportComponents: MobilityCostComponent[] = [
  {
    type: 'TRANSPORT',
    mode: 'plane',
    averageCost: 400,
    observationCount: 50,
    weight: 0.7,
    weightRationale: 'Primary mode for island territories',
    sources: [{
      type: 'official_site',
      url: 'https://example.com',
      observedAt: '2025-12-20T10:00:00Z',
      verificationMethod: 'automated',
      reliability: 'high',
    }],
  },
  {
    type: 'TRANSPORT',
    mode: 'boat',
    averageCost: 80,
    observationCount: 30,
    weight: 0.3,
    weightRationale: 'Inter-island connectivity',
    sources: [{
      type: 'official_site',
      observedAt: '2025-12-20T10:00:00Z',
      verificationMethod: 'automated',
      reliability: 'high',
    }],
  },
];

// Mock land mobility components
const mockLandMobilityComponents: MobilityCostComponent[] = [
  {
    type: 'LAND_MOBILITY',
    mode: 'BUS',
    averageCost: 1.50,
    observationCount: 100,
    weight: 0.4,
    weightRationale: 'Public transit usage',
    sources: [{
      type: 'user_report',
      observedAt: '2025-12-20T10:00:00Z',
      verificationMethod: 'manual',
      reliability: 'medium',
    }],
  },
  {
    type: 'LAND_MOBILITY',
    mode: 'TAXI',
    averageCost: 25,
    observationCount: 50,
    weight: 0.3,
    weightRationale: 'Taxi/VTC usage',
    sources: [{
      type: 'official_site',
      observedAt: '2025-12-20T10:00:00Z',
      verificationMethod: 'automated',
      reliability: 'high',
    }],
  },
  {
    type: 'LAND_MOBILITY',
    mode: 'FUEL',
    averageCost: 1.80,
    observationCount: 200,
    weight: 0.3,
    weightRationale: 'Personal vehicle usage',
    sources: [{
      type: 'official_site',
      observedAt: '2025-12-20T10:00:00Z',
      verificationMethod: 'automated',
      reliability: 'high',
    }],
  },
];

describe('Global Mobility Cost Index Service v3.0.0', () => {
  describe('calculateGlobalMobilityIndex', () => {
    it('should return null for empty components', () => {
      const result = calculateGlobalMobilityIndex('MQ', [], []);
      expect(result).toBeNull();
    });

    it('should successfully calculate mobility index', () => {
      const result = calculateGlobalMobilityIndex(
        'MQ',
        mockTransportComponents,
        mockLandMobilityComponents
      );
      
      expect(result).not.toBeNull();
      expect(result!.territory).toBe('MQ');
      expect(result!.indexValue).toBeGreaterThan(0);
      expect(result!.profile.classification).toBe('ISLAND');
    });

    it('should handle transport-only data', () => {
      const result = calculateGlobalMobilityIndex(
        'MQ',
        mockTransportComponents,
        []
      );
      
      expect(result).not.toBeNull();
      expect(result!.breakdown.transportCost).toBeGreaterThan(0);
      expect(result!.breakdown.landMobilityCost).toBe(0);
      expect(result!.metadata.warnings).toContain('No land mobility data available');
    });

    it('should handle land-mobility-only data', () => {
      const result = calculateGlobalMobilityIndex(
        'MQ',
        [],
        mockLandMobilityComponents
      );
      
      expect(result).not.toBeNull();
      expect(result!.breakdown.transportCost).toBe(0);
      expect(result!.breakdown.landMobilityCost).toBeGreaterThan(0);
      expect(result!.metadata.warnings).toContain('No transport data available');
    });

    it('should classify island territories correctly', () => {
      const result = calculateGlobalMobilityIndex(
        'MQ',
        mockTransportComponents,
        mockLandMobilityComponents
      );
      
      expect(result!.profile.classification).toBe('ISLAND');
      expect(result!.profile.characteristics.hasAirTransport).toBe(true);
      expect(result!.profile.characteristics.hasMaritimeTransport).toBe(true);
    });

    it('should classify archipelago territories correctly', () => {
      const result = calculateGlobalMobilityIndex(
        'PF', // Polynésie française
        mockTransportComponents,
        mockLandMobilityComponents
      );
      
      expect(result!.profile.classification).toBe('ARCHIPELAGO');
    });

    it('should classify continental territories correctly', () => {
      const result = calculateGlobalMobilityIndex(
        'FR',
        mockTransportComponents,
        mockLandMobilityComponents
      );
      
      expect(result!.profile.classification).toBe('CONTINENTAL');
    });

    it('should calculate weighted average correctly', () => {
      const result = calculateGlobalMobilityIndex(
        'MQ',
        mockTransportComponents,
        mockLandMobilityComponents
      );
      
      expect(result!.breakdown.transportWeight).toBe(0.6);
      expect(result!.breakdown.landMobilityWeight).toBe(0.4);
      
      // Verify calculation
      const expectedIndex = 
        (result!.breakdown.transportCost * 0.6) + 
        (result!.breakdown.landMobilityCost * 0.4);
      
      expect(result!.indexValue).toBeCloseTo(expectedIndex, 2);
    });

    it('should include explicit methodology', () => {
      const result = calculateGlobalMobilityIndex(
        'MQ',
        mockTransportComponents,
        mockLandMobilityComponents
      );
      
      expect(result!.metadata.methodology).toBeDefined();
      expect(result!.metadata.methodology.version).toBe('v3.0.0');
      expect(result!.metadata.methodology.calculationFormula).toBeDefined();
      expect(result!.metadata.methodology.assumptions).toBeDefined();
      expect(result!.metadata.methodology.assumptions.length).toBeGreaterThan(0);
    });

    it('should include limitations', () => {
      const result = calculateGlobalMobilityIndex(
        'MQ',
        mockTransportComponents,
        mockLandMobilityComponents
      );
      
      expect(result!.metadata.limitations).toBeDefined();
      expect(result!.metadata.limitations.length).toBeGreaterThan(0);
      expect(result!.metadata.limitations.some(l => 
        l.includes('DESCRIPTIVE ONLY')
      )).toBe(true);
    });
  });

  describe('compareMobilityIndexPeriods', () => {
    const mockPeriods: MobilityIndexPeriod[] = [
      {
        period: '2025-01',
        indexValue: 200,
        transportCost: 300,
        landMobilityCost: 10,
      },
      {
        period: '2025-06',
        indexValue: 220,
        transportCost: 330,
        landMobilityCost: 11,
      },
    ];

    it('should return null for insufficient periods', () => {
      const result = compareMobilityIndexPeriods('MQ', [mockPeriods[0]]);
      expect(result).toBeNull();
    });

    it('should calculate period comparison correctly', () => {
      const result = compareMobilityIndexPeriods('MQ', mockPeriods);
      
      expect(result).not.toBeNull();
      expect(result!.territory).toBe('MQ');
      expect(result!.variation.absoluteChange).toBe(20);
      expect(result!.variation.percentageChange).toBe(10);
      expect(result!.variation.direction).toBe('increase');
    });

    it('should detect stable variation', () => {
      const stablePeriods: MobilityIndexPeriod[] = [
        { period: '2025-01', indexValue: 200, transportCost: 300, landMobilityCost: 10 },
        { period: '2025-02', indexValue: 205, transportCost: 305, landMobilityCost: 10 },
      ];
      
      const result = compareMobilityIndexPeriods('MQ', stablePeriods);
      
      expect(result!.variation.direction).toBe('stable');
    });

    it('should calculate component variations', () => {
      const result = compareMobilityIndexPeriods('MQ', mockPeriods);
      
      expect(result!.componentVariations).toHaveLength(2);
      expect(result!.componentVariations[0].component).toBe('Transport');
      expect(result!.componentVariations[1].component).toBe('Land Mobility');
    });
  });

  describe('compareTerritoriesMobilityIndex', () => {
    const mockIndices = [
      calculateGlobalMobilityIndex('MQ', mockTransportComponents, mockLandMobilityComponents)!,
      calculateGlobalMobilityIndex('GP', mockTransportComponents, mockLandMobilityComponents)!,
    ];

    it('should compare territories', () => {
      const result = compareTerritoriesMobilityIndex(mockIndices);
      
      expect(result.territories).toHaveLength(2);
      expect(result.comparisonDate).toBeDefined();
      expect(result.methodology).toBeDefined();
    });

    it('should calculate differences from base territory', () => {
      // Modify GP to have different costs
      const gpIndex = calculateGlobalMobilityIndex(
        'GP',
        [{...mockTransportComponents[0], averageCost: 450}],
        mockLandMobilityComponents
      )!;
      
      const result = compareTerritoriesMobilityIndex(
        [mockIndices[0], gpIndex],
        'MQ'
      );
      
      expect(result.baseTerritory).toBe('MQ');
      expect(result.territories[1].differenceFromBase).toBeDefined();
      expect(result.territories[1].differenceFromBase!.absoluteIndex).not.toBe(0);
    });
  });

  describe('applyMobilityIndexFilters', () => {
    const mockIndices = [
      calculateGlobalMobilityIndex('MQ', mockTransportComponents, mockLandMobilityComponents)!,
      calculateGlobalMobilityIndex('FR', mockTransportComponents, mockLandMobilityComponents)!,
      calculateGlobalMobilityIndex('PF', mockTransportComponents, mockLandMobilityComponents)!,
    ];

    it('should filter by territory', () => {
      const filtered = applyMobilityIndexFilters(mockIndices, { territory: 'MQ' });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].territory).toBe('MQ');
    });

    it('should filter by classification', () => {
      const filtered = applyMobilityIndexFilters(mockIndices, { classification: 'ISLAND' });
      expect(filtered.length).toBeGreaterThan(0);
      expect(filtered.every(i => i.profile.classification === 'ISLAND')).toBe(true);
    });

    it('should filter by coverage percentage', () => {
      const filtered = applyMobilityIndexFilters(mockIndices, { minCoveragePercent: 50 });
      expect(filtered.every(i => i.metadata.dataQuality.coveragePercentage >= 50)).toBe(true);
    });

    it('should exclude partial data by default', () => {
      const filtered = applyMobilityIndexFilters(mockIndices, { includePartialData: false });
      expect(filtered.every(i => i.metadata.dataQuality.coveragePercentage >= 30)).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle territories with isolated characteristics', () => {
      const isolatedComponents: MobilityCostComponent[] = [
        {
          type: 'TRANSPORT',
          mode: 'plane',
          averageCost: 600,
          observationCount: 20,
          weight: 1.0,
          weightRationale: 'Only connection mode',
          sources: [{
            type: 'official_site',
            observedAt: '2025-12-20T10:00:00Z',
            verificationMethod: 'automated',
            reliability: 'high',
          }],
        },
      ];
      
      const result = calculateGlobalMobilityIndex('WF', isolatedComponents, []);
      
      expect(result).not.toBeNull();
      expect(result!.profile.characteristics.isIsolated).toBe(true);
    });

    it('should handle continental territories', () => {
      const result = calculateGlobalMobilityIndex(
        'FR',
        mockTransportComponents,
        mockLandMobilityComponents
      );
      
      expect(result!.profile.classification).toBe('CONTINENTAL');
      expect(result!.profile.characteristics.isIsolated).toBe(false);
    });

    it('should handle partial data gracefully', () => {
      const partialTransport: MobilityCostComponent[] = [{
        ...mockTransportComponents[0],
        observationCount: 5,
      }];
      
      const result = calculateGlobalMobilityIndex('MQ', partialTransport, []);
      
      expect(result).not.toBeNull();
      expect(result!.metadata.warnings).toBeDefined();
      expect(result!.metadata.warnings!.length).toBeGreaterThan(0);
    });
  });
});
