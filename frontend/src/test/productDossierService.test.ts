 
/**
 * Product Dossier Service Tests - v1.6.0
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { safeLocalStorage } from '../utils/safeLocalStorage';
import {
  getProductDossier,
  addAnalysisToDossier,
  calculateTransformationInsight,
  calculateDataQuality,
  calculateProductDelta,
} from '../services/productDossierService';
import {
  getProductHistory,
  getReformulationTimeline,
  compareSnapshots,
  getProductEvolution,
} from '../services/productHistoryService';
import type { ProductInsight } from '../types/productInsight';
import type {
  ProductDossier,
  ProductAnalysisSnapshot,
  TransformationInsight,
} from '../types/productDossier';

describe('Product Dossier Service', () => {
  
  // Mock product insight for testing
  const mockProductInsight: ProductInsight = {
    ean: '3760074380534',
    name: 'Biscuits chocolat',
    brand: 'TestBrand',
    category: 'Biscuits',
    territory: 'GP',
    ingredients: [
      {
        name: 'Farine de blé',
        role: 'base',
        origin: 'vegetal',
        frequencyInProducts: 'very_common',
        regulatoryStatus: { EU: 'authorized' },
      },
      {
        name: 'Sucre',
        role: 'sweetener',
        origin: 'vegetal',
        frequencyInProducts: 'very_common',
        regulatoryStatus: { EU: 'authorized' },
      },
      {
        name: 'Huile de palme',
        role: 'base',
        origin: 'vegetal',
        frequencyInProducts: 'common',
        regulatoryStatus: { EU: 'authorized' },
      },
    ],
    allergens: [],
    additives: [
      {
        code: 'E330',
        name: 'Acide citrique',
        function: 'Acidifiant',
        regulatoryNotes: 'Autorisé dans l\'UE',
        countriesStatus: { EU: 'allowed' },
      },
    ],
    nutrition: {
      per100g: {
        energyKcal: 450,
        fats: 20,
        saturatedFats: 10,
        sugars: 25,
        salt: 1.5,
      },
      interpretation: {
        sugarDensity: 'high',
        saltDensity: 'moderate',
        caloricDensity: 'very_high',
      },
    },
    formulationAnalysis: {
      mainCategories: ['végétal'],
      processingLevel: 'processed',
      ingredientCount: 3,
      additiveCount: 1,
    },
    comparisons: {},
    confidence: {
      ocrConfidence: 0.85,
      sourceReliability: 'high',
      crossVerification: false,
    },
    sources: [
      {
        type: 'ocr',
        reference: 'Photo labels',
        accessedAt: new Date().toISOString(),
        confidence: 0.85,
      },
    ],
    generatedAt: new Date().toISOString(),
  };
  
  beforeEach(() => {
    // Clear safeLocalStorage before each test
    safeLocalStorage.clear();
  });
  
  describe('Product Dossier Management', () => {
    it('should create new dossier for unknown EAN', async () => {
      const request = {
        ean: '1234567890123',
        includeHistory: false,
      };
      
      const response = await getProductDossier(request);
      
      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(response.data?.ean).toBe('1234567890123');
      expect(response.data?.totalAnalyses).toBe(0);
    });
    
    it('should add analysis to dossier', async () => {
      const dossier = await addAnalysisToDossier(
        mockProductInsight.ean,
        mockProductInsight,
        'label_scan'
      );
      
      expect(dossier).toBeDefined();
      expect(dossier.ean).toBe(mockProductInsight.ean);
      expect(dossier.totalAnalyses).toBe(1);
      expect(dossier.analysisHistory.length).toBe(1);
      expect(dossier.territories.length).toBe(1);
    });
    
    it('should update canonical name from first insight', async () => {
      const dossier = await addAnalysisToDossier(
        mockProductInsight.ean,
        mockProductInsight,
        'label_scan'
      );
      
      expect(dossier.canonicalName).toBe('Biscuits chocolat');
      expect(dossier.brand).toBe('TestBrand');
      expect(dossier.category).toBe('Biscuits');
    });
    
    it('should track multiple analyses for same product', async () => {
      await addAnalysisToDossier(
        mockProductInsight.ean,
        mockProductInsight,
        'label_scan'
      );
      
      const dossier2 = await addAnalysisToDossier(
        mockProductInsight.ean,
        mockProductInsight,
        'label_scan'
      );
      
      expect(dossier2.totalAnalyses).toBe(2);
      expect(dossier2.analysisHistory.length).toBe(2);
    });
  });
  
  describe('Transformation Insight', () => {
    it('should classify low processing correctly', () => {
      const lowProcessingInsight: ProductInsight = {
        ...mockProductInsight,
        ingredients: mockProductInsight.ingredients.slice(0, 2),
        additives: [],
      };
      
      const transformation = calculateTransformationInsight(lowProcessingInsight);
      
      expect(transformation.processingLevel).toBe('low');
      expect(transformation.indicators.ingredientCount).toBe(2);
      expect(transformation.indicators.additiveCount).toBe(0);
    });
    
    it('should classify moderate processing correctly', () => {
      const transformation = calculateTransformationInsight(mockProductInsight);
      
      expect(transformation.processingLevel).toBe('moderate');
      expect(transformation.indicators.ingredientCount).toBe(3);
      expect(transformation.indicators.additiveCount).toBe(1);
    });
    
    it('should classify ultra processing correctly', () => {
      const ultraProcessingInsight: ProductInsight = {
        ...mockProductInsight,
        ingredients: Array(20).fill(mockProductInsight.ingredients[0]),
        additives: Array(6).fill(mockProductInsight.additives[0]),
      };
      
      const transformation = calculateTransformationInsight(ultraProcessingInsight);
      
      expect(transformation.processingLevel).toBe('ultra');
      expect(transformation.indicators.ingredientCount).toBe(20);
      expect(transformation.indicators.additiveCount).toBe(6);
    });
    
    it('should calculate synthetic ratio', () => {
      const syntheticInsight: ProductInsight = {
        ...mockProductInsight,
        ingredients: [
          {
            name: 'Synthetic ingredient',
            role: 'other',
            origin: 'synthetic',
            frequencyInProducts: 'common',
            regulatoryStatus: { EU: 'authorized' },
          },
          ...mockProductInsight.ingredients,
        ],
      };
      
      const transformation = calculateTransformationInsight(syntheticInsight);
      
      expect(transformation.indicators.syntheticRatio).toBeGreaterThan(0);
    });
    
    it('should provide human-readable explanation', () => {
      const transformation = calculateTransformationInsight(mockProductInsight);
      
      expect(transformation.explanation).toBeDefined();
      expect(transformation.explanation.length).toBeGreaterThan(0);
      expect(transformation.explanation).toContain('ingrédient');
    });
    
    it('should identify processing criteria', () => {
      const transformation = calculateTransformationInsight(mockProductInsight);
      
      expect(transformation.criteriaMatched).toBeInstanceOf(Array);
      // Low/moderate processing may have no criteria matched
      expect(transformation.criteriaMatched).toBeDefined();
    });
  });
  
  describe('Product Delta Calculation', () => {
    it('should detect ingredient additions', () => {
      const snapshot1: ProductAnalysisSnapshot = {
        id: 'snap1',
        timestamp: new Date().toISOString(),
        territory: 'GP',
        sourceType: 'label_scan',
        confidenceScore: 0.85,
        ingredients: mockProductInsight.ingredients.slice(0, 2),
        nutrition: mockProductInsight.nutrition,
        additives: mockProductInsight.additives,
        sources: mockProductInsight.sources,
      };
      
      const snapshot2: ProductAnalysisSnapshot = {
        ...snapshot1,
        id: 'snap2',
        ingredients: mockProductInsight.ingredients,
      };
      
      const delta = calculateProductDelta(snapshot1, snapshot2);
      
      expect(delta.ingredientChanges).toBeDefined();
      expect(delta.ingredientChanges?.added.length).toBeGreaterThan(0);
    });
    
    it('should detect ingredient removals', () => {
      const snapshot1: ProductAnalysisSnapshot = {
        id: 'snap1',
        timestamp: new Date().toISOString(),
        territory: 'GP',
        sourceType: 'label_scan',
        confidenceScore: 0.85,
        ingredients: mockProductInsight.ingredients,
        nutrition: mockProductInsight.nutrition,
        additives: mockProductInsight.additives,
        sources: mockProductInsight.sources,
      };
      
      const snapshot2: ProductAnalysisSnapshot = {
        ...snapshot1,
        id: 'snap2',
        ingredients: mockProductInsight.ingredients.slice(0, 2),
      };
      
      const delta = calculateProductDelta(snapshot1, snapshot2);
      
      expect(delta.ingredientChanges).toBeDefined();
      expect(delta.ingredientChanges?.removed.length).toBeGreaterThan(0);
    });
    
    it('should detect nutritional changes', () => {
      const snapshot1: ProductAnalysisSnapshot = {
        id: 'snap1',
        timestamp: new Date().toISOString(),
        territory: 'GP',
        sourceType: 'label_scan',
        confidenceScore: 0.85,
        ingredients: mockProductInsight.ingredients,
        nutrition: mockProductInsight.nutrition,
        additives: mockProductInsight.additives,
        sources: mockProductInsight.sources,
      };
      
      const snapshot2: ProductAnalysisSnapshot = {
        ...snapshot1,
        id: 'snap2',
        nutrition: {
          ...mockProductInsight.nutrition,
          per100g: {
            ...mockProductInsight.nutrition.per100g,
            sugars: 30, // Changed from 25
          },
        },
      };
      
      const delta = calculateProductDelta(snapshot1, snapshot2);
      
      expect(delta.nutritionalChanges).toBeDefined();
      expect(delta.nutritionalChanges?.sugars).toBeDefined();
      expect(delta.nutritionalChanges?.sugars?.percentChange).toBeCloseTo(20, 0);
    });
    
    it('should classify delta significance correctly', () => {
      const snapshot1: ProductAnalysisSnapshot = {
        id: 'snap1',
        timestamp: new Date().toISOString(),
        territory: 'GP',
        sourceType: 'label_scan',
        confidenceScore: 0.85,
        ingredients: mockProductInsight.ingredients,
        nutrition: mockProductInsight.nutrition,
        additives: mockProductInsight.additives,
        sources: mockProductInsight.sources,
      };
      
      // Minor change (no change at all)
      const snapshot2Minor: ProductAnalysisSnapshot = {
        ...snapshot1,
        id: 'snap2',
      };
      
      const deltaMinor = calculateProductDelta(snapshot1, snapshot2Minor);
      expect(deltaMinor.significance).toBe('minor');
      
      // Major change
      const snapshot2Major: ProductAnalysisSnapshot = {
        ...snapshot1,
        id: 'snap3',
        nutrition: {
          ...mockProductInsight.nutrition,
          per100g: {
            ...mockProductInsight.nutrition.per100g,
            sugars: 35, // Large change (40%)
          },
        },
      };
      
      const deltaMajor = calculateProductDelta(snapshot1, snapshot2Major);
      expect(deltaMajor.significance).toBe('major');
    });
    
    it('should generate human-readable description', () => {
      const snapshot1: ProductAnalysisSnapshot = {
        id: 'snap1',
        timestamp: new Date().toISOString(),
        territory: 'GP',
        sourceType: 'label_scan',
        confidenceScore: 0.85,
        ingredients: mockProductInsight.ingredients.slice(0, 2),
        nutrition: mockProductInsight.nutrition,
        additives: [],
        sources: mockProductInsight.sources,
      };
      
      const snapshot2: ProductAnalysisSnapshot = {
        ...snapshot1,
        id: 'snap2',
        ingredients: mockProductInsight.ingredients,
        additives: mockProductInsight.additives,
      };
      
      const delta = calculateProductDelta(snapshot1, snapshot2);
      
      expect(delta.description).toBeDefined();
      expect(delta.description.length).toBeGreaterThan(0);
    });
  });
  
  describe('Data Quality Metrics', () => {
    it('should calculate data quality for new dossier', async () => {
      const dossier = await addAnalysisToDossier(
        mockProductInsight.ean,
        mockProductInsight,
        'label_scan'
      );
      
      const quality = calculateDataQuality(dossier);
      
      expect(quality).toBeDefined();
      expect(quality.ocrReliability).toBeGreaterThan(0);
      expect(quality.sampleSize).toBe(1);
      expect(quality.verificationStatus).toBe('unverified');
    });
    
    it('should improve verification status with multiple analyses', async () => {
      let dossier = await addAnalysisToDossier(
        mockProductInsight.ean,
        mockProductInsight,
        'label_scan'
      );
      
      for (let i = 0; i < 3; i++) {
        dossier = await addAnalysisToDossier(
          mockProductInsight.ean,
          mockProductInsight,
          'label_scan'
        );
      }
      
      const quality = calculateDataQuality(dossier);
      
      expect(quality.sampleSize).toBe(4);
      expect(quality.verificationStatus).toBe('user_verified');
    });
    
    it('should generate warnings for low quality data', async () => {
      const lowQualityInsight = {
        ...mockProductInsight,
        confidence: {
          ...mockProductInsight.confidence,
          ocrConfidence: 0.5,
        },
      };
      
      const dossier = await addAnalysisToDossier(
        lowQualityInsight.ean,
        lowQualityInsight,
        'label_scan'
      );
      
      const quality = calculateDataQuality(dossier);
      
      expect(quality.warnings).toBeDefined();
      expect(quality.warnings!.length).toBeGreaterThan(0);
    });
    
    it('should generate quality notes', async () => {
      const dossier = await addAnalysisToDossier(
        mockProductInsight.ean,
        mockProductInsight,
        'label_scan'
      );
      
      const quality = calculateDataQuality(dossier);
      
      expect(quality.qualityNotes).toBeDefined();
      expect(quality.qualityNotes!.length).toBeGreaterThan(0);
    });
  });
  
  describe('Product History Service', () => {
    it('should retrieve product history', async () => {
      // Add some analyses
      await addAnalysisToDossier(
        mockProductInsight.ean,
        mockProductInsight,
        'label_scan'
      );
      
      await addAnalysisToDossier(
        mockProductInsight.ean,
        mockProductInsight,
        'label_scan'
      );
      
      const history = await getProductHistory({
        ean: mockProductInsight.ean,
      });
      
      expect(history.success).toBe(true);
      expect(history.data?.snapshots.length).toBe(2);
    });
    
    it('should filter history by territory', async () => {
      await addAnalysisToDossier(
        mockProductInsight.ean,
        mockProductInsight,
        'label_scan'
      );
      
      const mqInsight = { ...mockProductInsight, territory: 'MQ' as const };
      await addAnalysisToDossier(
        mqInsight.ean,
        mqInsight,
        'label_scan'
      );
      
      const history = await getProductHistory({
        ean: mockProductInsight.ean,
        territory: 'GP',
      });
      
      expect(history.success).toBe(true);
      expect(history.data?.snapshots.every(s => s.territory === 'GP')).toBe(true);
    });
    
    it('should return empty for unknown EAN', async () => {
      const history = await getProductHistory({
        ean: 'unknown-ean',
      });
      
      expect(history.success).toBe(false);
      expect(history.error).toBe('Product not found');
    });
  });
  
  describe('Edge Cases', () => {
    it('should handle empty ingredient list', () => {
      const emptyInsight: ProductInsight = {
        ...mockProductInsight,
        ingredients: [],
        additives: [],
      };
      
      const transformation = calculateTransformationInsight(emptyInsight);
      
      expect(transformation.processingLevel).toBe('low');
      expect(transformation.indicators.ingredientCount).toBe(0);
    });
    
    it('should handle missing optional fields', async () => {
      const minimalInsight: ProductInsight = {
        ...mockProductInsight,
        name: undefined,
        brand: undefined,
        category: undefined,
      };
      
      const dossier = await addAnalysisToDossier(
        minimalInsight.ean,
        minimalInsight,
        'label_scan'
      );
      
      expect(dossier).toBeDefined();
      // Should use defaults
      expect(dossier.canonicalName).toBeDefined();
    });
    
    it('should handle safeLocalStorage errors gracefully', async () => {
      // Mock safeLocalStorage to throw
      const originalSetItem = safeLocalStorage.setItem;
      safeLocalStorage.setItem = () => {
        throw new Error('Storage full');
      };
      
      // Should not throw
      await expect(
        addAnalysisToDossier(
          mockProductInsight.ean,
          mockProductInsight,
          'label_scan'
        )
      ).resolves.toBeDefined();
      
      // Restore
      safeLocalStorage.setItem = originalSetItem;
    });
  });
});
