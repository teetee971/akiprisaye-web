/**
 * Ingredient Evolution Service Tests - v1.7.0
 * 
 * Comprehensive test suite for ingredient evolution tracking
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getIngredientEvolution,
  compareMultiBrands,
  getHistoricalFormulation,
  getChangeDetectionStats,
  validateSnapshotQuality,
} from '../services/ingredientEvolutionService';
import type {
  FormulationSnapshot,
  IngredientEvolutionRequest,
  MultiBrandComparisonRequest,
  HistoricalFormulationQuery,
} from '../types/ingredientEvolution';

describe('Ingredient Evolution Service - v1.7.0', () => {
  
  // Mock localStorage (used by safeLocalStorage)
  const mockStorage: Record<string, string> = {};
  
  beforeEach(() => {
    // Setup localStorage mock
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: (key: string) => mockStorage[key] || null,
        setItem: (key: string, value: string) => {
          mockStorage[key] = value;
        },
        removeItem: (key: string) => {
          delete mockStorage[key];
        },
        clear: () => {
          Object.keys(mockStorage).forEach(key => delete mockStorage[key]);
        },
        length: Object.keys(mockStorage).length,
        key: (index: number) => Object.keys(mockStorage)[index] || null,
      } as Storage,
      configurable: true,
    });
    
    // Enable feature flag
    vi.stubEnv('VITE_FEATURE_INGREDIENT_EVOLUTION', 'true');
  });
  
  afterEach(() => {
    vi.unstubAllEnvs();
    Object.keys(mockStorage).forEach(key => delete mockStorage[key]);
  });
  
  // Helper function to create mock snapshots
  function createMockSnapshot(
    ean: string,
    brand: string,
    timestamp: string,
    ingredients: string[],
    territory: 'GP' | 'MQ' | 'GF' | 'RE' | 'YT' = 'GP'
  ): FormulationSnapshot {
    return {
      id: `snapshot_${Date.now()}_${Math.random()}`,
      ean,
      brand,
      productName: 'Test Product',
      territory,
      timestamp,
      ingredients,
      sources: [{
        type: 'label_scan',
        id: 'test_source',
        observedAt: timestamp,
        territory,
        confidence: 0.95,
      }],
      quality: 0.9,
    };
  }
  
  describe('Feature Flag', () => {
    it('should return error when feature is disabled', async () => {
      vi.stubEnv('VITE_FEATURE_INGREDIENT_EVOLUTION', 'false');
      
      const request: IngredientEvolutionRequest = {
        ean: '3760074380534',
      };
      
      const result = await getIngredientEvolution(request);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Feature not enabled');
    });
    
    it('should process request when feature is enabled', async () => {
      const snapshots = [
        createMockSnapshot('3760074380534', 'TestBrand', '2025-01-01T00:00:00Z', ['Farine', 'Sucre']),
      ];
      
      mockStorage['formulation_history_3760074380534'] = JSON.stringify(snapshots);
      
      const request: IngredientEvolutionRequest = {
        ean: '3760074380534',
      };
      
      const result = await getIngredientEvolution(request);
      
      expect(result.success).toBe(true);
      expect(result.metadata.dataVersion).toBe('1.7.0');
    });
  });
  
  describe('getIngredientEvolution', () => {
    it('should return error for non-existent product', async () => {
      const request: IngredientEvolutionRequest = {
        ean: 'nonexistent',
      };
      
      const result = await getIngredientEvolution(request);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('No formulation data found');
    });
    
    it('should detect added ingredients', async () => {
      const snapshots = [
        createMockSnapshot('3760074380534', 'TestBrand', '2025-01-01T00:00:00Z', ['Farine', 'Sucre']),
        createMockSnapshot('3760074380534', 'TestBrand', '2025-02-01T00:00:00Z', ['Farine', 'Sucre', 'Sel']),
      ];
      
      mockStorage['formulation_history_3760074380534'] = JSON.stringify(snapshots);
      
      const request: IngredientEvolutionRequest = {
        ean: '3760074380534',
      };
      
      const result = await getIngredientEvolution(request);
      
      expect(result.success).toBe(true);
      expect(result.data?.totalChanges).toBeGreaterThan(0);
      expect(result.data?.changesByType.added).toBeGreaterThan(0);
      
      // Check timeline
      const timeline = result.data?.timeline || [];
      const lastEntry = timeline[timeline.length - 1];
      expect(lastEntry.changes.some(c => c.type === 'added' && c.ingredientName === 'Sel')).toBe(true);
    });
    
    it('should detect removed ingredients', async () => {
      const snapshots = [
        createMockSnapshot('3760074380534', 'TestBrand', '2025-01-01T00:00:00Z', ['Farine', 'Sucre', 'Sel']),
        createMockSnapshot('3760074380534', 'TestBrand', '2025-02-01T00:00:00Z', ['Farine', 'Sucre']),
      ];
      
      mockStorage['formulation_history_3760074380534'] = JSON.stringify(snapshots);
      
      const request: IngredientEvolutionRequest = {
        ean: '3760074380534',
      };
      
      const result = await getIngredientEvolution(request);
      
      expect(result.success).toBe(true);
      expect(result.data?.changesByType.removed).toBeGreaterThan(0);
      
      const timeline = result.data?.timeline || [];
      const lastEntry = timeline[timeline.length - 1];
      expect(lastEntry.changes.some(c => c.type === 'removed' && c.ingredientName === 'Sel')).toBe(true);
    });
    
    it('should detect moved ingredients', async () => {
      const snapshots = [
        createMockSnapshot('3760074380534', 'TestBrand', '2025-01-01T00:00:00Z', ['Farine', 'Sucre', 'Sel']),
        createMockSnapshot('3760074380534', 'TestBrand', '2025-02-01T00:00:00Z', ['Farine', 'Sel', 'Sucre']),
      ];
      
      mockStorage['formulation_history_3760074380534'] = JSON.stringify(snapshots);
      
      const request: IngredientEvolutionRequest = {
        ean: '3760074380534',
      };
      
      const result = await getIngredientEvolution(request);
      
      expect(result.success).toBe(true);
      expect(result.data?.changesByType.moved).toBeGreaterThan(0);
    });
    
    it('should filter by brand', async () => {
      const snapshots = [
        createMockSnapshot('3760074380534', 'BrandA', '2025-01-01T00:00:00Z', ['Farine', 'Sucre']),
        createMockSnapshot('3760074380534', 'BrandB', '2025-02-01T00:00:00Z', ['Farine', 'Sel']),
      ];
      
      mockStorage['formulation_history_3760074380534'] = JSON.stringify(snapshots);
      
      const request: IngredientEvolutionRequest = {
        ean: '3760074380534',
        brand: 'BrandA',
      };
      
      const result = await getIngredientEvolution(request);
      
      expect(result.success).toBe(true);
      expect(result.data?.brand).toBe('BrandA');
      expect(result.metadata.sourcesAnalyzed).toBe(1);
    });
    
    it('should filter by territory', async () => {
      const snapshots = [
        createMockSnapshot('3760074380534', 'TestBrand', '2025-01-01T00:00:00Z', ['Farine', 'Sucre'], 'GP'),
        createMockSnapshot('3760074380534', 'TestBrand', '2025-02-01T00:00:00Z', ['Farine', 'Sel'], 'MQ'),
      ];
      
      mockStorage['formulation_history_3760074380534'] = JSON.stringify(snapshots);
      
      const request: IngredientEvolutionRequest = {
        ean: '3760074380534',
        territory: 'GP',
      };
      
      const result = await getIngredientEvolution(request);
      
      expect(result.success).toBe(true);
      expect(result.data?.territories).toContain('GP');
      expect(result.data?.territories).not.toContain('MQ');
    });
    
    it('should filter by date range', async () => {
      const snapshots = [
        createMockSnapshot('3760074380534', 'TestBrand', '2025-01-01T00:00:00Z', ['Farine']),
        createMockSnapshot('3760074380534', 'TestBrand', '2025-02-01T00:00:00Z', ['Farine', 'Sucre']),
        createMockSnapshot('3760074380534', 'TestBrand', '2025-03-01T00:00:00Z', ['Farine', 'Sucre', 'Sel']),
      ];
      
      mockStorage['formulation_history_3760074380534'] = JSON.stringify(snapshots);
      
      const request: IngredientEvolutionRequest = {
        ean: '3760074380534',
        startDate: '2025-02-01T00:00:00Z',
        endDate: '2025-02-28T23:59:59Z',
      };
      
      const result = await getIngredientEvolution(request);
      
      expect(result.success).toBe(true);
      const timeline = result.data?.timeline || [];
      expect(timeline.length).toBe(1);
      expect(timeline[0].timestamp).toBe('2025-02-01T00:00:00Z');
    });
    
    it('should filter significant changes only', async () => {
      const snapshots = [
        createMockSnapshot('3760074380534', 'TestBrand', '2025-01-01T00:00:00Z', ['Farine', 'Sucre']),
        createMockSnapshot('3760074380534', 'TestBrand', '2025-02-01T00:00:00Z', ['Farine', 'Sucre']), // No change
        createMockSnapshot('3760074380534', 'TestBrand', '2025-03-01T00:00:00Z', ['Farine', 'Sucre', 'Sel']), // Change
      ];
      
      mockStorage['formulation_history_3760074380534'] = JSON.stringify(snapshots);
      
      const request: IngredientEvolutionRequest = {
        ean: '3760074380534',
        significantOnly: true,
      };
      
      const result = await getIngredientEvolution(request);
      
      expect(result.success).toBe(true);
      const timeline = result.data?.timeline || [];
      // Should exclude entry with no changes
      expect(timeline.every(entry => entry.changes.length > 0)).toBe(true);
    });
    
    it('should apply limit to timeline entries', async () => {
      const snapshots = Array.from({ length: 10 }, (_, i) =>
        createMockSnapshot(
          '3760074380534',
          'TestBrand',
          `2025-01-${String(i + 1).padStart(2, '0')}T00:00:00Z`,
          ['Farine', ...Array.from({ length: i }, (_, j) => `Ingredient${j}`)]
        )
      );
      
      mockStorage['formulation_history_3760074380534'] = JSON.stringify(snapshots);
      
      const request: IngredientEvolutionRequest = {
        ean: '3760074380534',
        limit: 3,
      };
      
      const result = await getIngredientEvolution(request);
      
      expect(result.success).toBe(true);
      expect(result.data?.timeline.length).toBeLessThanOrEqual(3);
    });
    
    it('should handle single EAN from array', async () => {
      const snapshots = [
        createMockSnapshot('3760074380534', 'TestBrand', '2025-01-01T00:00:00Z', ['Farine', 'Sucre']),
      ];
      
      mockStorage['formulation_history_3760074380534'] = JSON.stringify(snapshots);
      
      const request: IngredientEvolutionRequest = {
        ean: ['3760074380534', '1234567890123'], // Multiple EANs
      };
      
      const result = await getIngredientEvolution(request);
      
      expect(result.success).toBe(true);
      expect(result.data?.ean).toBe('3760074380534');
    });
    
    it('should be case-insensitive for ingredient comparison', async () => {
      const snapshots = [
        createMockSnapshot('3760074380534', 'TestBrand', '2025-01-01T00:00:00Z', ['Farine de Blé']),
        createMockSnapshot('3760074380534', 'TestBrand', '2025-02-01T00:00:00Z', ['farine de blé', 'Sucre']),
      ];
      
      mockStorage['formulation_history_3760074380534'] = JSON.stringify(snapshots);
      
      const request: IngredientEvolutionRequest = {
        ean: '3760074380534',
      };
      
      const result = await getIngredientEvolution(request);
      
      expect(result.success).toBe(true);
      // Should only detect "Sucre" as added, not "farine de blé" as removed/added
      expect(result.data?.changesByType.added).toBe(1);
      expect(result.data?.changesByType.removed).toBe(0);
    });
    
    it('should handle empty formulation list', async () => {
      mockStorage['formulation_history_3760074380534'] = JSON.stringify([]);
      
      const request: IngredientEvolutionRequest = {
        ean: '3760074380534',
      };
      
      const result = await getIngredientEvolution(request);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('No formulation data found');
    });
    
    it('should return error for non-existent brand', async () => {
      const snapshots = [
        createMockSnapshot('3760074380534', 'BrandA', '2025-01-01T00:00:00Z', ['Farine', 'Sucre']),
      ];
      
      mockStorage['formulation_history_3760074380534'] = JSON.stringify(snapshots);
      
      const request: IngredientEvolutionRequest = {
        ean: '3760074380534',
        brand: 'NonExistentBrand',
      };
      
      const result = await getIngredientEvolution(request);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('No data for specified brand');
    });
    
    it('should include metadata in response', async () => {
      const snapshots = [
        createMockSnapshot('3760074380534', 'TestBrand', '2025-01-01T00:00:00Z', ['Farine', 'Sucre']),
      ];
      
      mockStorage['formulation_history_3760074380534'] = JSON.stringify(snapshots);
      
      const request: IngredientEvolutionRequest = {
        ean: '3760074380534',
      };
      
      const result = await getIngredientEvolution(request);
      
      expect(result.success).toBe(true);
      expect(result.metadata).toBeDefined();
      expect(result.metadata.processingTime).toBeGreaterThanOrEqual(0);
      expect(result.metadata.dataVersion).toBe('1.7.0');
      expect(result.metadata.sourcesAnalyzed).toBeGreaterThan(0);
    });
  });
  
  describe('compareMultiBrands', () => {
    it('should return error when feature is disabled', async () => {
      vi.stubEnv('VITE_FEATURE_INGREDIENT_EVOLUTION', 'false');
      
      const request: MultiBrandComparisonRequest = {
        category: 'Biscuits',
        brands: ['BrandA', 'BrandB'],
        timeRange: {
          start: '2025-01-01T00:00:00Z',
          end: '2025-12-31T23:59:59Z',
        },
      };
      
      const result = await compareMultiBrands(request);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Feature not enabled');
    });
    
    it('should return comparison structure', async () => {
      const request: MultiBrandComparisonRequest = {
        category: 'Biscuits',
        brands: ['BrandA', 'BrandB'],
        timeRange: {
          start: '2025-01-01T00:00:00Z',
          end: '2025-12-31T23:59:59Z',
        },
      };
      
      const result = await compareMultiBrands(request);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.brands).toEqual(['BrandA', 'BrandB']);
      expect(result.data?.category).toBe('Biscuits');
    });
    
    it('should include metadata', async () => {
      const request: MultiBrandComparisonRequest = {
        category: 'Biscuits',
        brands: ['BrandA', 'BrandB'],
        timeRange: {
          start: '2025-01-01T00:00:00Z',
          end: '2025-12-31T23:59:59Z',
        },
      };
      
      const result = await compareMultiBrands(request);
      
      expect(result.metadata).toBeDefined();
      expect(result.metadata.dataVersion).toBe('1.7.0');
      expect(result.metadata.processingTime).toBeGreaterThanOrEqual(0);
    });
  });
  
  describe('getHistoricalFormulation', () => {
    it('should return null when feature is disabled', async () => {
      vi.stubEnv('VITE_FEATURE_INGREDIENT_EVOLUTION', 'false');
      
      const query: HistoricalFormulationQuery = {
        ean: '3760074380534',
        date: '2025-06-01T00:00:00Z',
      };
      
      const result = await getHistoricalFormulation(query);
      
      expect(result).toBeNull();
    });
    
    it('should return null for non-existent product', async () => {
      const query: HistoricalFormulationQuery = {
        ean: 'nonexistent',
        date: '2025-06-01T00:00:00Z',
      };
      
      const result = await getHistoricalFormulation(query);
      
      expect(result).toBeNull();
    });
    
    it('should return closest snapshot before target date', async () => {
      const snapshots = [
        createMockSnapshot('3760074380534', 'TestBrand', '2025-01-01T00:00:00Z', ['Farine']),
        createMockSnapshot('3760074380534', 'TestBrand', '2025-03-01T00:00:00Z', ['Farine', 'Sucre']),
        createMockSnapshot('3760074380534', 'TestBrand', '2025-09-01T00:00:00Z', ['Farine', 'Sucre', 'Sel']),
      ];
      
      mockStorage['formulation_history_3760074380534'] = JSON.stringify(snapshots);
      
      const query: HistoricalFormulationQuery = {
        ean: '3760074380534',
        date: '2025-06-01T00:00:00Z',
      };
      
      const result = await getHistoricalFormulation(query);
      
      expect(result).not.toBeNull();
      expect(result?.timestamp).toBe('2025-03-01T00:00:00Z');
      expect(result?.ingredients).toEqual(['Farine', 'Sucre']);
    });
    
    it('should filter by territory', async () => {
      const snapshots = [
        createMockSnapshot('3760074380534', 'TestBrand', '2025-01-01T00:00:00Z', ['Farine'], 'GP'),
        createMockSnapshot('3760074380534', 'TestBrand', '2025-02-01T00:00:00Z', ['Farine', 'Sucre'], 'MQ'),
      ];
      
      mockStorage['formulation_history_3760074380534'] = JSON.stringify(snapshots);
      
      const query: HistoricalFormulationQuery = {
        ean: '3760074380534',
        date: '2025-06-01T00:00:00Z',
        territory: 'GP',
      };
      
      const result = await getHistoricalFormulation(query);
      
      expect(result).not.toBeNull();
      expect(result?.territory).toBe('GP');
      expect(result?.ingredients).toEqual(['Farine']);
    });
    
    it('should return null if no snapshot before target date', async () => {
      const snapshots = [
        createMockSnapshot('3760074380534', 'TestBrand', '2025-03-01T00:00:00Z', ['Farine', 'Sucre']),
      ];
      
      mockStorage['formulation_history_3760074380534'] = JSON.stringify(snapshots);
      
      const query: HistoricalFormulationQuery = {
        ean: '3760074380534',
        date: '2025-01-01T00:00:00Z', // Before any snapshot
      };
      
      const result = await getHistoricalFormulation(query);
      
      expect(result).toBeNull();
    });
  });
  
  describe('getChangeDetectionStats', () => {
    it('should return empty stats when feature is disabled', async () => {
      vi.stubEnv('VITE_FEATURE_INGREDIENT_EVOLUTION', 'false');
      
      const result = await getChangeDetectionStats(['3760074380534']);
      
      expect(result.totalFormulations).toBe(0);
      expect(result.totalChanges).toBe(0);
    });
    
    it('should calculate statistics across multiple products', async () => {
      // Product 1 - stable
      const snapshots1 = [
        createMockSnapshot('1111111111111', 'BrandA', '2025-01-01T00:00:00Z', ['Farine', 'Sucre']),
        createMockSnapshot('1111111111111', 'BrandA', '2025-02-01T00:00:00Z', ['Farine', 'Sucre']),
      ];
      
      // Product 2 - volatile
      const snapshots2 = [
        createMockSnapshot('2222222222222', 'BrandB', '2025-01-01T00:00:00Z', ['Eau']),
        createMockSnapshot('2222222222222', 'BrandB', '2025-02-01T00:00:00Z', ['Eau', 'Sel']),
        createMockSnapshot('2222222222222', 'BrandB', '2025-03-01T00:00:00Z', ['Eau', 'Sel', 'Sucre']),
      ];
      
      mockStorage['formulation_history_1111111111111'] = JSON.stringify(snapshots1);
      mockStorage['formulation_history_2222222222222'] = JSON.stringify(snapshots2);
      
      const result = await getChangeDetectionStats(['1111111111111', '2222222222222']);
      
      expect(result.totalFormulations).toBeGreaterThan(0);
      expect(result.mostStable.length).toBeGreaterThan(0);
      expect(result.mostVolatile.length).toBeGreaterThan(0);
    });
    
    it('should calculate average changes per formulation', async () => {
      const snapshots = [
        createMockSnapshot('3760074380534', 'TestBrand', '2025-01-01T00:00:00Z', ['Farine']),
        createMockSnapshot('3760074380534', 'TestBrand', '2025-02-01T00:00:00Z', ['Farine', 'Sucre']),
      ];
      
      mockStorage['formulation_history_3760074380534'] = JSON.stringify(snapshots);
      
      const result = await getChangeDetectionStats(['3760074380534']);
      
      expect(result.averageChangesPerFormulation).toBeGreaterThanOrEqual(0);
    });
  });
  
  describe('validateSnapshotQuality', () => {
    it('should validate valid snapshot', () => {
      const snapshot = createMockSnapshot(
        '3760074380534',
        'TestBrand',
        '2025-01-01T00:00:00Z',
        ['Farine', 'Sucre']
      );
      
      const result = validateSnapshotQuality(snapshot);
      
      expect(result.isValid).toBe(true);
      expect(result.issues.length).toBe(0);
    });
    
    it('should detect missing EAN', () => {
      const snapshot = createMockSnapshot(
        '',
        'TestBrand',
        '2025-01-01T00:00:00Z',
        ['Farine', 'Sucre']
      );
      
      const result = validateSnapshotQuality(snapshot);
      
      expect(result.isValid).toBe(false);
      expect(result.issues).toContain('Missing EAN');
    });
    
    it('should detect missing brand', () => {
      const snapshot = createMockSnapshot(
        '3760074380534',
        '',
        '2025-01-01T00:00:00Z',
        ['Farine', 'Sucre']
      );
      
      const result = validateSnapshotQuality(snapshot);
      
      expect(result.isValid).toBe(false);
      expect(result.issues).toContain('Missing brand');
    });
    
    it('should detect empty ingredients list', () => {
      const snapshot = createMockSnapshot(
        '3760074380534',
        'TestBrand',
        '2025-01-01T00:00:00Z',
        []
      );
      
      const result = validateSnapshotQuality(snapshot);
      
      expect(result.isValid).toBe(false);
      expect(result.issues).toContain('Missing or empty ingredients list');
    });
    
    it('should detect invalid quality score', () => {
      const snapshot = createMockSnapshot(
        '3760074380534',
        'TestBrand',
        '2025-01-01T00:00:00Z',
        ['Farine', 'Sucre']
      );
      snapshot.quality = 1.5; // Invalid (> 1)
      
      const result = validateSnapshotQuality(snapshot);
      
      expect(result.isValid).toBe(false);
      expect(result.issues).toContain('Invalid quality score (must be 0-1)');
    });
    
    it('should detect missing sources', () => {
      const snapshot = createMockSnapshot(
        '3760074380534',
        'TestBrand',
        '2025-01-01T00:00:00Z',
        ['Farine', 'Sucre']
      );
      snapshot.sources = [];
      
      const result = validateSnapshotQuality(snapshot);
      
      expect(result.isValid).toBe(false);
      expect(result.issues).toContain('Missing sources');
    });
  });
  
  describe('Edge Cases', () => {
    it('should handle malformed safeLocalStorage data', async () => {
      mockStorage['formulation_history_3760074380534'] = 'invalid json';
      
      const request: IngredientEvolutionRequest = {
        ean: '3760074380534',
      };
      
      const result = await getIngredientEvolution(request);
      
      expect(result.success).toBe(false);
    });
    
    it('should handle snapshots with whitespace in ingredient names', async () => {
      const snapshots = [
        createMockSnapshot('3760074380534', 'TestBrand', '2025-01-01T00:00:00Z', ['  Farine  ', ' Sucre ']),
        createMockSnapshot('3760074380534', 'TestBrand', '2025-02-01T00:00:00Z', ['Farine', 'Sucre']),
      ];
      
      mockStorage['formulation_history_3760074380534'] = JSON.stringify(snapshots);
      
      const request: IngredientEvolutionRequest = {
        ean: '3760074380534',
      };
      
      const result = await getIngredientEvolution(request);
      
      expect(result.success).toBe(true);
      // Should not detect changes due to whitespace normalization
      expect(result.data?.totalChanges).toBe(0);
    });
    
    it('should handle very large ingredient lists', async () => {
      const largeIngredientList = Array.from({ length: 100 }, (_, i) => `Ingredient${i}`);
      
      const snapshots = [
        createMockSnapshot('3760074380534', 'TestBrand', '2025-01-01T00:00:00Z', largeIngredientList),
        createMockSnapshot('3760074380534', 'TestBrand', '2025-02-01T00:00:00Z', [...largeIngredientList, 'NewIngredient']),
      ];
      
      mockStorage['formulation_history_3760074380534'] = JSON.stringify(snapshots);
      
      const request: IngredientEvolutionRequest = {
        ean: '3760074380534',
      };
      
      const result = await getIngredientEvolution(request);
      
      expect(result.success).toBe(true);
      expect(result.data?.totalChanges).toBeGreaterThan(0);
    });
  });
});
