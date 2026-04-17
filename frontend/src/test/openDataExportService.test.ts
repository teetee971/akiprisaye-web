/**
 * Open Data Export Service Tests - v1.8.0
 *
 * Comprehensive test suite for open data export functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  exportOpenData,
  exportBatch,
  validateExportData,
  previewExport,
  getExportStatistics,
} from '../services/openDataExportService';
import type {
  OpenDataExportRequest,
  ProductExportRecord,
  PriceExportRecord,
  IngredientExportRecord,
  StoreExportRecord,
  BatchExportRequest,
} from '../types/openData';

describe('Open Data Export Service - v1.8.0', () => {
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
          Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
        },
        length: Object.keys(mockStorage).length,
        key: (index: number) => Object.keys(mockStorage)[index] || null,
      } as Storage,
      configurable: true,
    });

    // Enable feature flag
    vi.stubEnv('VITE_FEATURE_OPEN_DATA_EXPORT', 'true');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
  });

  // Helper function to create mock product records
  function createMockProduct(
    ean: string,
    territory: 'GP' | 'MQ' | 'GF' | 'RE' | 'YT' = 'GP',
    observedAt: string = '2025-01-01T00:00:00Z'
  ): ProductExportRecord {
    return {
      ean,
      name: 'Test Product',
      brand: 'TestBrand',
      category: 'Biscuits',
      territory,
      observedAt,
      price: 3.5,
      priceUnit: 'EUR',
      store: 'TestStore',
      ingredients: ['Farine', 'Sucre'],
      nutrition: {
        energyKcal: 500,
        fats: 20,
        sugars: 30,
      },
      additives: ['E330'],
      source: 'label_scan',
      sourceReference: 'test_ref',
      qualityScore: 0.9,
    };
  }

  describe('Feature Flag', () => {
    it('should return error when feature is disabled', async () => {
      vi.stubEnv('VITE_FEATURE_OPEN_DATA_EXPORT', 'false');

      const request: OpenDataExportRequest = {
        format: 'json',
        dataType: 'products',
      };

      const result = await exportOpenData(request);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Feature not enabled');
    });

    it('should process request when feature is enabled', async () => {
      const products = [createMockProduct('3760074380534')];
      mockStorage['open_data_products'] = JSON.stringify(products);

      const request: OpenDataExportRequest = {
        format: 'json',
        dataType: 'products',
      };

      const result = await exportOpenData(request);

      expect(result.success).toBe(true);
      expect(result.processingMetadata.exportVersion).toBe('1.8.0');
    });
  });

  describe('exportOpenData - JSON Format', () => {
    it('should export products as JSON', async () => {
      const products = [createMockProduct('3760074380534'), createMockProduct('1234567890123')];
      mockStorage['open_data_products'] = JSON.stringify(products);

      const request: OpenDataExportRequest = {
        format: 'json',
        dataType: 'products',
      };

      const result = await exportOpenData(request);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.contentType).toBe('application/json; charset=utf-8');
      expect(result.data?.filename).toContain('akiprisaye_products_');
      expect(result.data?.filename).toContain('.json');

      // Verify content is valid JSON
      const parsed = JSON.parse(result.data!.content);
      expect(parsed).toBeDefined();
    });

    it('should include metadata when requested', async () => {
      const products = [createMockProduct('3760074380534')];
      mockStorage['open_data_products'] = JSON.stringify(products);

      const request: OpenDataExportRequest = {
        format: 'json',
        dataType: 'products',
        includeMetadata: true,
      };

      const result = await exportOpenData(request);

      expect(result.success).toBe(true);
      expect(result.data?.metadata).toBeDefined();
      expect(result.data?.metadata?.recordCount).toBe(1);
      expect(result.data?.metadata?.dataVersion).toBe('1.8.0');
    });

    it('should embed metadata in JSON when pretty print is enabled', async () => {
      const products = [createMockProduct('3760074380534')];
      mockStorage['open_data_products'] = JSON.stringify(products);

      const request: OpenDataExportRequest = {
        format: 'json',
        dataType: 'products',
        includeMetadata: true,
      };

      const result = await exportOpenData(request);

      expect(result.success).toBe(true);
      const parsed = JSON.parse(result.data!.content);
      expect(parsed.metadata).toBeDefined();
      expect(parsed.records).toBeDefined();
    });
  });

  describe('exportOpenData - CSV Format', () => {
    it('should export products as CSV', async () => {
      const products = [createMockProduct('3760074380534')];
      mockStorage['open_data_products'] = JSON.stringify(products);

      const request: OpenDataExportRequest = {
        format: 'csv',
        dataType: 'products',
      };

      const result = await exportOpenData(request);

      expect(result.success).toBe(true);
      expect(result.data?.contentType).toBe('text/csv; charset=utf-8');
      expect(result.data?.filename).toContain('.csv');
    });

    it('should include headers in CSV', async () => {
      const products = [createMockProduct('3760074380534')];
      mockStorage['open_data_products'] = JSON.stringify(products);

      const request: OpenDataExportRequest = {
        format: 'csv',
        dataType: 'products',
      };

      const result = await exportOpenData(request);

      expect(result.success).toBe(true);
      const lines = result.data!.content.split('\n');
      expect(lines[0]).toContain('ean');
      expect(lines[0]).toContain('name');
      expect(lines[0]).toContain('brand');
    });

    it('should escape CSV fields with special characters', async () => {
      const product = createMockProduct('3760074380534');
      product.name = 'Test, Product "Special"';

      mockStorage['open_data_products'] = JSON.stringify([product]);

      const request: OpenDataExportRequest = {
        format: 'csv',
        dataType: 'products',
      };

      const result = await exportOpenData(request);

      expect(result.success).toBe(true);
      expect(result.data!.content).toContain('"Test, Product ""Special"""');
    });

    it('should handle arrays in CSV format', async () => {
      const product = createMockProduct('3760074380534');
      product.ingredients = ['Farine de blé', 'Sucre', 'Sel'];

      mockStorage['open_data_products'] = JSON.stringify([product]);

      const request: OpenDataExportRequest = {
        format: 'csv',
        dataType: 'products',
      };

      const result = await exportOpenData(request);

      expect(result.success).toBe(true);
      expect(result.data!.content).toContain('Farine de blé;Sucre;Sel');
    });
  });

  describe('exportOpenData - Filtering', () => {
    it('should filter by territory', async () => {
      const products = [
        createMockProduct('1111111111111', 'GP'),
        createMockProduct('2222222222222', 'MQ'),
        createMockProduct('3333333333333', 'GP'),
      ];
      mockStorage['open_data_products'] = JSON.stringify(products);

      const request: OpenDataExportRequest = {
        format: 'json',
        dataType: 'products',
        territory: 'GP',
      };

      const result = await exportOpenData(request);

      expect(result.success).toBe(true);
      expect(result.processingMetadata.recordsExported).toBe(2);
    });

    it('should filter by multiple territories', async () => {
      const products = [
        createMockProduct('1111111111111', 'GP'),
        createMockProduct('2222222222222', 'MQ'),
        createMockProduct('3333333333333', 'GF'),
      ];
      mockStorage['open_data_products'] = JSON.stringify(products);

      const request: OpenDataExportRequest = {
        format: 'json',
        dataType: 'products',
        territory: ['GP', 'MQ'],
      };

      const result = await exportOpenData(request);

      expect(result.success).toBe(true);
      expect(result.processingMetadata.recordsExported).toBe(2);
    });

    it('should filter by date range', async () => {
      const products = [
        createMockProduct('1111111111111', 'GP', '2025-01-01T00:00:00Z'),
        createMockProduct('2222222222222', 'GP', '2025-06-01T00:00:00Z'),
        createMockProduct('3333333333333', 'GP', '2025-12-01T00:00:00Z'),
      ];
      mockStorage['open_data_products'] = JSON.stringify(products);

      const request: OpenDataExportRequest = {
        format: 'json',
        dataType: 'products',
        dateRange: {
          start: '2025-05-01T00:00:00Z',
          end: '2025-11-01T00:00:00Z',
        },
      };

      const result = await exportOpenData(request);

      expect(result.success).toBe(true);
      expect(result.processingMetadata.recordsExported).toBe(1);
    });

    it('should filter by quality score', async () => {
      const products = [
        { ...createMockProduct('1111111111111'), qualityScore: 0.95 },
        { ...createMockProduct('2222222222222'), qualityScore: 0.75 },
        { ...createMockProduct('3333333333333'), qualityScore: 0.5 },
      ];
      mockStorage['open_data_products'] = JSON.stringify(products);

      const request: OpenDataExportRequest = {
        format: 'json',
        dataType: 'products',
        minQualityScore: 0.8,
      };

      const result = await exportOpenData(request);

      expect(result.success).toBe(true);
      expect(result.processingMetadata.recordsExported).toBe(1);
    });

    it('should apply limit', async () => {
      const products = Array.from({ length: 100 }, (_, i) =>
        createMockProduct(`${i}`.padStart(13, '0'))
      );
      mockStorage['open_data_products'] = JSON.stringify(products);

      const request: OpenDataExportRequest = {
        format: 'json',
        dataType: 'products',
        limit: 10,
      };

      const result = await exportOpenData(request);

      expect(result.success).toBe(true);
      expect(result.processingMetadata.recordsExported).toBe(10);
    });

    it('should combine multiple filters', async () => {
      const products = [
        { ...createMockProduct('1111111111111', 'GP', '2025-01-01T00:00:00Z'), qualityScore: 0.95 },
        { ...createMockProduct('2222222222222', 'GP', '2025-06-01T00:00:00Z'), qualityScore: 0.85 },
        { ...createMockProduct('3333333333333', 'MQ', '2025-06-01T00:00:00Z'), qualityScore: 0.9 },
        { ...createMockProduct('4444444444444', 'GP', '2025-06-01T00:00:00Z'), qualityScore: 0.6 },
      ];
      mockStorage['open_data_products'] = JSON.stringify(products);

      const request: OpenDataExportRequest = {
        format: 'json',
        dataType: 'products',
        territory: 'GP',
        dateRange: {
          start: '2025-05-01T00:00:00Z',
          end: '2025-12-01T00:00:00Z',
        },
        minQualityScore: 0.8,
      };

      const result = await exportOpenData(request);

      expect(result.success).toBe(true);
      expect(result.processingMetadata.recordsExported).toBe(1); // Only product 2
    });
  });

  describe('exportOpenData - Error Handling', () => {
    it('should return error for no data available', async () => {
      const request: OpenDataExportRequest = {
        format: 'json',
        dataType: 'products',
      };

      const result = await exportOpenData(request);

      expect(result.success).toBe(false);
      expect(result.error).toBe('No data available for export');
    });

    it('should return error when no records match filters', async () => {
      const products = [createMockProduct('1111111111111', 'GP')];
      mockStorage['open_data_products'] = JSON.stringify(products);

      const request: OpenDataExportRequest = {
        format: 'json',
        dataType: 'products',
        territory: 'MQ', // Different territory
      };

      const result = await exportOpenData(request);

      expect(result.success).toBe(false);
      expect(result.error).toBe('No records match the specified filters');
    });

    it('should handle malformed data gracefully', async () => {
      mockStorage['open_data_products'] = 'invalid json';

      const request: OpenDataExportRequest = {
        format: 'json',
        dataType: 'products',
      };

      const result = await exportOpenData(request);

      expect(result.success).toBe(false);
    });
  });

  describe('exportBatch', () => {
    it('should return error when feature is disabled', async () => {
      vi.stubEnv('VITE_FEATURE_OPEN_DATA_EXPORT', 'false');

      const request: BatchExportRequest = {
        format: 'json',
        dataTypes: ['products', 'prices'],
        filters: {},
      };

      const result = await exportBatch(request);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Feature not enabled');
    });

    it('should export multiple data types', async () => {
      const products = [createMockProduct('3760074380534')];
      mockStorage['open_data_products'] = JSON.stringify(products);

      const request: BatchExportRequest = {
        format: 'json',
        dataTypes: ['products'],
        filters: {},
      };

      const result = await exportBatch(request);

      expect(result.success).toBe(true);
      expect(result.exports).toBeDefined();
      expect(result.exports?.length).toBeGreaterThan(0);
    });

    it('should include combined metadata', async () => {
      const products = [createMockProduct('3760074380534')];
      mockStorage['open_data_products'] = JSON.stringify(products);

      const request: BatchExportRequest = {
        format: 'json',
        dataTypes: ['products'],
        filters: {},
      };

      const result = await exportBatch(request);

      expect(result.success).toBe(true);
      expect(result.metadata).toBeDefined();
      expect(result.metadata?.dataVersion).toBe('1.8.0');
    });
  });

  describe('validateExportData', () => {
    it('should validate valid records', () => {
      const records = [createMockProduct('3760074380534'), createMockProduct('1234567890123')];

      const result = validateExportData(records, ['ean', 'name', 'brand']);

      expect(result.isValid).toBe(true);
      expect(result.stats.validRecords).toBe(2);
      expect(result.stats.invalidRecords).toBe(0);
    });

    it('should detect missing required fields', () => {
      const records = [
        createMockProduct('3760074380534'),
        { ...createMockProduct('1234567890123'), ean: '' },
      ];

      const result = validateExportData(records, ['ean', 'name', 'brand']);

      expect(result.stats.invalidRecords).toBe(1);
      expect(result.stats.missingFields['ean']).toBe(1);
    });

    it('should generate warnings for invalid records', () => {
      const records = [
        createMockProduct('3760074380534'),
        { ...createMockProduct('1234567890123'), name: '' },
      ];

      const result = validateExportData(records, ['ean', 'name', 'brand']);

      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should generate errors for high invalid rate', () => {
      const records = [
        createMockProduct('3760074380534'),
        { ...createMockProduct('1111111111111'), ean: '' },
        { ...createMockProduct('2222222222222'), name: '' },
        { ...createMockProduct('3333333333333'), brand: '' },
      ];

      const result = validateExportData(records, ['ean', 'name', 'brand']);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('previewExport', () => {
    it('should return limited preview', async () => {
      const products = Array.from({ length: 100 }, (_, i) =>
        createMockProduct(`${i}`.padStart(13, '0'))
      );
      mockStorage['open_data_products'] = JSON.stringify(products);

      const request: OpenDataExportRequest = {
        format: 'json',
        dataType: 'products',
      };

      const result = await previewExport(request, 5);

      expect(result.success).toBe(true);
      expect(result.processingMetadata.recordsExported).toBe(5);
    });
  });

  describe('getExportStatistics', () => {
    it('should return empty stats when feature is disabled', async () => {
      vi.stubEnv('VITE_FEATURE_OPEN_DATA_EXPORT', 'false');

      const stats = await getExportStatistics();

      expect(stats.products).toBe(0);
      expect(stats.prices).toBe(0);
      expect(stats.territories).toHaveLength(0);
    });

    it('should return statistics for available data', async () => {
      const products = [
        createMockProduct('1111111111111', 'GP'),
        createMockProduct('2222222222222', 'MQ'),
      ];
      mockStorage['open_data_products'] = JSON.stringify(products);

      const stats = await getExportStatistics();

      expect(stats.products).toBe(2);
      expect(stats.territories).toContain('GP');
      expect(stats.territories).toContain('MQ');
    });

    it('should calculate date range', async () => {
      const products = [
        createMockProduct('1111111111111', 'GP', '2025-01-01T00:00:00Z'),
        createMockProduct('2222222222222', 'GP', '2025-12-31T23:59:59Z'),
      ];
      mockStorage['open_data_products'] = JSON.stringify(products);

      const stats = await getExportStatistics();

      expect(stats.dateRange.start).toBe('2025-01-01T00:00:00Z');
      expect(stats.dateRange.end).toBe('2025-12-31T23:59:59Z');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty ingredient arrays', async () => {
      const product = createMockProduct('3760074380534');
      product.ingredients = [];

      mockStorage['open_data_products'] = JSON.stringify([product]);

      const request: OpenDataExportRequest = {
        format: 'json',
        dataType: 'products',
      };

      const result = await exportOpenData(request);

      expect(result.success).toBe(true);
    });

    it('should handle null/undefined optional fields', async () => {
      const product = createMockProduct('3760074380534');
      product.price = undefined;
      product.nutrition = undefined;

      mockStorage['open_data_products'] = JSON.stringify([product]);

      const request: OpenDataExportRequest = {
        format: 'csv',
        dataType: 'products',
      };

      const result = await exportOpenData(request);

      expect(result.success).toBe(true);
    });
  });
});
