/**
 * Open Data Export Service - v1.8.0
 *
 * Public data export in CSV and JSON formats
 * Raw data only - no transformation or enrichment
 * Read-only operations with mandatory metadata
 *
 * @module openDataExportService
 */

import { safeLocalStorage } from '../utils/safeLocalStorage';
import type {
  OpenDataExportRequest,
  OpenDataExportResponse,
  BatchExportRequest,
  BatchExportResponse,
  ExportMetadata,
  ProductExportRecord,
  PriceExportRecord,
  IngredientExportRecord,
  StoreExportRecord,
  CSVExportOptions,
  JSONExportOptions,
  ExportValidationResult,
} from '../types/openData';
import type { TerritoryCode } from '../types/extensions';

/**
 * Feature flag check
 */
function isFeatureEnabled(): boolean {
  return import.meta.env.VITE_FEATURE_OPEN_DATA_EXPORT === 'true';
}

/**
 * Default CSV export options
 */
const DEFAULT_CSV_OPTIONS: CSVExportOptions = {
  delimiter: ',',
  includeHeader: true,
  quoteChar: '"',
  lineEnding: '\n',
  encoding: 'utf-8',
};

/**
 * Default JSON export options
 */
const DEFAULT_JSON_OPTIONS: JSONExportOptions = {
  pretty: true,
  indent: 2,
  embedMetadata: true,
};

/**
 * Load product data from storage
 */
async function loadProductData(): Promise<ProductExportRecord[]> {
  try {
    const data = safeLocalStorage.getItem('open_data_products');
    if (data) {
      return JSON.parse(data) as ProductExportRecord[];
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('Failed to load product data:', error);
    }
  }
  return [];
}

/**
 * Load price data from storage
 */
async function loadPriceData(): Promise<PriceExportRecord[]> {
  try {
    const data = safeLocalStorage.getItem('open_data_prices');
    if (data) {
      return JSON.parse(data) as PriceExportRecord[];
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('Failed to load price data:', error);
    }
  }
  return [];
}

/**
 * Load ingredient data from storage
 */
async function loadIngredientData(): Promise<IngredientExportRecord[]> {
  try {
    const data = safeLocalStorage.getItem('open_data_ingredients');
    if (data) {
      return JSON.parse(data) as IngredientExportRecord[];
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('Failed to load ingredient data:', error);
    }
  }
  return [];
}

/**
 * Load store data from storage
 */
async function loadStoreData(): Promise<StoreExportRecord[]> {
  try {
    const data = safeLocalStorage.getItem('open_data_stores');
    if (data) {
      return JSON.parse(data) as StoreExportRecord[];
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('Failed to load store data:', error);
    }
  }
  return [];
}

/**
 * Filter records by territory
 */
function filterByTerritory<T extends { territory: TerritoryCode }>(
  records: T[],
  territory?: TerritoryCode | TerritoryCode[]
): T[] {
  if (!territory) {
    return records;
  }

  const territories = Array.isArray(territory) ? territory : [territory];
  return records.filter((r) => territories.includes(r.territory));
}

/**
 * Filter records by date range
 */
function filterByDateRange<T extends { observedAt?: string; firstObserved?: string }>(
  records: T[],
  dateRange?: { start: string; end: string }
): T[] {
  if (!dateRange) {
    return records;
  }

  const startTime = new Date(dateRange.start).getTime();
  const endTime = new Date(dateRange.end).getTime();

  return records.filter((r) => {
    const recordDate = r.observedAt || r.firstObserved;
    if (!recordDate) return false;

    const recordTime = new Date(recordDate).getTime();
    return recordTime >= startTime && recordTime <= endTime;
  });
}

/**
 * Filter records by quality score
 */
function filterByQuality<T extends { qualityScore?: number }>(
  records: T[],
  minQualityScore?: number
): T[] {
  if (minQualityScore === undefined) {
    return records;
  }

  return records.filter((r) => r.qualityScore !== undefined && r.qualityScore >= minQualityScore);
}

/**
 * Escape CSV field
 */
function escapeCSVField(value: any, quoteChar: string = '"'): string {
  if (value === null || value === undefined) {
    return '';
  }

  const str = String(value);

  // If contains delimiter, quote char, or newline, wrap in quotes
  if (str.includes(',') || str.includes(quoteChar) || str.includes('\n') || str.includes('\r')) {
    return `${quoteChar}${str.replace(new RegExp(quoteChar, 'g'), quoteChar + quoteChar)}${quoteChar}`;
  }

  return str;
}

/**
 * Convert array to CSV string
 */
function arrayToCSV<T extends Record<string, any>>(
  records: T[],
  options: CSVExportOptions = DEFAULT_CSV_OPTIONS
): string {
  if (records.length === 0) {
    return '';
  }

  const lines: string[] = [];

  // Get headers from first record
  const headers = Object.keys(records[0]);

  // Add header row if requested
  if (options.includeHeader) {
    lines.push(headers.map((h) => escapeCSVField(h, options.quoteChar)).join(options.delimiter));
  }

  // Add data rows
  for (const record of records) {
    const values = headers.map((h) => {
      const value = record[h];

      // Handle arrays and objects
      if (Array.isArray(value)) {
        return escapeCSVField(value.join(';'), options.quoteChar);
      } else if (typeof value === 'object' && value !== null) {
        return escapeCSVField(JSON.stringify(value), options.quoteChar);
      }

      return escapeCSVField(value, options.quoteChar);
    });

    lines.push(values.join(options.delimiter));
  }

  return lines.join(options.lineEnding);
}

/**
 * Convert array to JSON string
 */
function arrayToJSON<T>(
  records: T[],
  metadata?: ExportMetadata,
  options: JSONExportOptions = DEFAULT_JSON_OPTIONS
): string {
  const data = options.embedMetadata && metadata ? { metadata, records } : records;

  if (options.pretty) {
    return JSON.stringify(data, null, options.indent);
  }

  return JSON.stringify(data);
}

/**
 * Generate export metadata
 */
function generateMetadata(
  records: any[],
  territory: TerritoryCode | TerritoryCode[] | undefined,
  dateRange: { start: string; end: string } | undefined
): ExportMetadata {
  // Determine territories
  let territories: TerritoryCode[];
  if (territory) {
    territories = Array.isArray(territory) ? territory : [territory];
  } else {
    // Extract unique territories from records
    const uniqueTerritories = new Set<TerritoryCode>();
    for (const record of records) {
      if (record.territory) {
        uniqueTerritories.add(record.territory);
      }
    }
    territories = Array.from(uniqueTerritories);
  }

  // Determine date range
  let finalDateRange: { start: string; end: string };
  if (dateRange) {
    finalDateRange = dateRange;
  } else {
    // Extract date range from records
    let minDate = new Date().toISOString();
    let maxDate = new Date(0).toISOString();

    for (const record of records) {
      const date = record.observedAt || record.firstObserved || record.lastObserved;
      if (date) {
        if (date < minDate) minDate = date;
        if (date > maxDate) maxDate = date;
      }
    }

    finalDateRange = { start: minDate, end: maxDate };
  }

  // Extract unique sources
  const sources = new Set<string>();
  for (const record of records) {
    if (record.source) {
      sources.add(record.source);
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    dataVersion: '1.8.0',
    territory: territories.length === 1 ? territories[0] : territories,
    sources: Array.from(sources) as any,
    recordCount: records.length,
    dateRange: finalDateRange,
    schemaVersion: '1.0.0',
    license: 'Open Data Commons Open Database License (ODbL) v1.0',
  };
}

/**
 * Export open data
 */
export async function exportOpenData(
  request: OpenDataExportRequest
): Promise<OpenDataExportResponse> {
  const startTime = Date.now();

  if (!isFeatureEnabled()) {
    return {
      success: false,
      error: 'Feature not enabled',
      processingMetadata: {
        processingTime: Date.now() - startTime,
        exportVersion: '1.8.0',
        recordsProcessed: 0,
        recordsExported: 0,
      },
    };
  }

  try {
    let records: any[] = [];
    const dataType = request.dataType;

    // Load data based on type - use independent ifs so 'all' loads everything
    if (dataType === 'products' || dataType === 'all') {
      const products = await loadProductData();
      records = records.concat(products);
    }
    if (dataType === 'prices' || dataType === 'all') {
      const prices = await loadPriceData();
      records = records.concat(prices);
    }
    if (dataType === 'ingredients' || dataType === 'all') {
      const ingredients = await loadIngredientData();
      records = records.concat(ingredients);
    }
    if (dataType === 'stores' || dataType === 'all') {
      const stores = await loadStoreData();
      records = records.concat(stores);
    }

    const recordsProcessed = records.length;

    if (records.length === 0) {
      return {
        success: false,
        error: 'No data available for export',
        processingMetadata: {
          processingTime: Date.now() - startTime,
          exportVersion: '1.8.0',
          recordsProcessed: 0,
          recordsExported: 0,
        },
      };
    }

    // Apply filters
    if (request.territory) {
      records = filterByTerritory(records, request.territory);
    }

    if (request.dateRange) {
      records = filterByDateRange(records, request.dateRange);
    }

    if (request.minQualityScore !== undefined) {
      records = filterByQuality(records, request.minQualityScore);
    }

    // Apply limit
    if (request.limit && records.length > request.limit) {
      records = records.slice(0, request.limit);
    }

    if (records.length === 0) {
      return {
        success: false,
        error: 'No records match the specified filters',
        processingMetadata: {
          processingTime: Date.now() - startTime,
          exportVersion: '1.8.0',
          recordsProcessed,
          recordsExported: 0,
        },
      };
    }

    // Generate metadata
    const metadata =
      request.includeMetadata !== false
        ? generateMetadata(records, request.territory, request.dateRange)
        : undefined;

    // Export based on format
    let content: string;
    let contentType: string;
    let fileExtension: string;

    if (request.format === 'csv') {
      content = arrayToCSV(records, DEFAULT_CSV_OPTIONS);
      contentType = 'text/csv; charset=utf-8';
      fileExtension = 'csv';
    } else {
      // JSON format
      content = arrayToJSON(records, metadata, DEFAULT_JSON_OPTIONS);
      contentType = 'application/json; charset=utf-8';
      fileExtension = 'json';
    }

    // Generate filename
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `akiprisaye_${dataType}_${timestamp}.${fileExtension}`;

    return {
      success: true,
      data: {
        content,
        contentType,
        filename,
        sizeBytes: new Blob([content]).size,
        metadata,
      },
      processingMetadata: {
        processingTime: Date.now() - startTime,
        exportVersion: '1.8.0',
        recordsProcessed,
        recordsExported: records.length,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      processingMetadata: {
        processingTime: Date.now() - startTime,
        exportVersion: '1.8.0',
        recordsProcessed: 0,
        recordsExported: 0,
      },
    };
  }
}

/**
 * Export multiple data types in batch
 */
export async function exportBatch(request: BatchExportRequest): Promise<BatchExportResponse> {
  const startTime = Date.now();

  if (!isFeatureEnabled()) {
    return {
      success: false,
      error: 'Feature not enabled',
      processingMetadata: {
        processingTime: Date.now() - startTime,
        exportVersion: '1.8.0',
        totalRecords: 0,
      },
    };
  }

  try {
    const exports: Array<{
      dataType: string;
      content: string;
      filename: string;
      sizeBytes: number;
    }> = [];

    let totalRecords = 0;

    for (const dataType of request.dataTypes) {
      const exportRequest: OpenDataExportRequest = {
        format: request.format,
        dataType,
        territory: request.filters.territory,
        dateRange: request.filters.dateRange,
        minQualityScore: request.filters.minQualityScore,
        includeMetadata: false, // Individual exports don't include metadata
      };

      const result = await exportOpenData(exportRequest);

      if (result.success && result.data) {
        exports.push({
          dataType,
          content: result.data.content,
          filename: result.data.filename,
          sizeBytes: result.data.sizeBytes,
        });

        totalRecords += result.processingMetadata.recordsExported;
      }
    }

    if (exports.length === 0) {
      return {
        success: false,
        error: 'No data available for any requested data type',
        processingMetadata: {
          processingTime: Date.now() - startTime,
          exportVersion: '1.8.0',
          totalRecords: 0,
        },
      };
    }

    // Generate combined metadata
    const metadata = generateMetadata([], request.filters.territory, request.filters.dateRange);
    metadata.recordCount = totalRecords;

    return {
      success: true,
      exports,
      metadata,
      processingMetadata: {
        processingTime: Date.now() - startTime,
        exportVersion: '1.8.0',
        totalRecords,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      processingMetadata: {
        processingTime: Date.now() - startTime,
        exportVersion: '1.8.0',
        totalRecords: 0,
      },
    };
  }
}

/**
 * Validate export data quality
 */
export function validateExportData<T extends Record<string, any>>(
  records: T[],
  requiredFields: string[]
): ExportValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const missingFields: Record<string, number> = {};

  let validRecords = 0;
  let invalidRecords = 0;

  // Initialize missing fields counter
  for (const field of requiredFields) {
    missingFields[field] = 0;
  }

  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    let recordValid = true;

    // Check required fields
    for (const field of requiredFields) {
      if (record[field] === undefined || record[field] === null || record[field] === '') {
        missingFields[field]++;
        recordValid = false;
      }
    }

    if (recordValid) {
      validRecords++;
    } else {
      invalidRecords++;
      warnings.push(`Record ${i + 1} is missing required fields`);
    }
  }

  // Check if too many invalid records
  const invalidPercentage = (invalidRecords / records.length) * 100;
  if (invalidPercentage > 50) {
    errors.push(`High rate of invalid records: ${invalidPercentage.toFixed(1)}%`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    stats: {
      totalRecords: records.length,
      validRecords,
      invalidRecords,
      missingFields,
    },
  };
}

/**
 * Generate export preview (first N records)
 */
export async function previewExport(
  request: OpenDataExportRequest,
  previewSize: number = 10
): Promise<OpenDataExportResponse> {
  const previewRequest = {
    ...request,
    limit: previewSize,
    includeMetadata: false,
  };

  return exportOpenData(previewRequest);
}

/**
 * Get available data statistics
 */
export async function getExportStatistics(): Promise<{
  products: number;
  prices: number;
  ingredients: number;
  stores: number;
  territories: TerritoryCode[];
  dateRange: { start: string; end: string };
}> {
  if (!isFeatureEnabled()) {
    return {
      products: 0,
      prices: 0,
      ingredients: 0,
      stores: 0,
      territories: [],
      dateRange: { start: '', end: '' },
    };
  }

  try {
    const products = await loadProductData();
    const prices = await loadPriceData();
    const ingredients = await loadIngredientData();
    const stores = await loadStoreData();

    // Extract unique territories
    const territoriesSet = new Set<TerritoryCode>();
    [...products, ...prices, ...stores].forEach((r) => {
      if (r.territory) {
        territoriesSet.add(r.territory);
      }
    });

    // Extract date range
    let minDate = new Date().toISOString();
    let maxDate = new Date(0).toISOString();

    [...products, ...prices].forEach((r) => {
      if (r.observedAt) {
        if (r.observedAt < minDate) minDate = r.observedAt;
        if (r.observedAt > maxDate) maxDate = r.observedAt;
      }
    });

    return {
      products: products.length,
      prices: prices.length,
      ingredients: ingredients.length,
      stores: stores.length,
      territories: Array.from(territoriesSet),
      dateRange: { start: minDate, end: maxDate },
    };
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('Failed to get export statistics:', error);
    }

    return {
      products: 0,
      prices: 0,
      ingredients: 0,
      stores: 0,
      territories: [],
      dateRange: { start: '', end: '' },
    };
  }
}
