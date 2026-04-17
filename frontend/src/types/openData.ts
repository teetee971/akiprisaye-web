/**
 * Open Data Export Types - v1.8.0
 *
 * Public data export in CSV and JSON formats
 * Raw data only - no enrichment or subjective filtering
 *
 * @module openData
 */

import type { TerritoryCode } from './extensions';

/**
 * Export format types
 */
export type ExportFormat = 'csv' | 'json';

/**
 * Data source type for traceability
 */
export type DataSourceType =
  | 'label_scan'
  | 'ticket_scan'
  | 'public_database'
  | 'user_report'
  | 'official_source';

/**
 * Mandatory metadata for all exports
 */
export interface ExportMetadata {
  /** Export generation timestamp */
  generatedAt: string; // ISO 8601

  /** Data version */
  dataVersion: string;

  /** Territory covered */
  territory: TerritoryCode | TerritoryCode[];

  /** Data sources included */
  sources: DataSourceType[];

  /** Total records exported */
  recordCount: number;

  /** Date range of data */
  dateRange: {
    start: string; // ISO 8601
    end: string; // ISO 8601
  };

  /** Export schema version */
  schemaVersion: string;

  /** Contact information */
  contact?: string;

  /** License */
  license: string;
}

/**
 * Product record for export
 */
export interface ProductExportRecord {
  /** Product EAN code */
  ean: string;

  /** Product name */
  name: string;

  /** Brand */
  brand: string;

  /** Category */
  category: string;

  /** Territory */
  territory: TerritoryCode;

  /** Observation date */
  observedAt: string; // ISO 8601

  /** Price (if available) */
  price?: number;

  /** Price unit */
  priceUnit?: string;

  /** Store/retailer */
  store?: string;

  /** Ingredients list (ordered) */
  ingredients: string[];

  /** Nutritional values per 100g */
  nutrition?: {
    energyKcal?: number;
    fats?: number;
    saturatedFats?: number;
    carbohydrates?: number;
    sugars?: number;
    proteins?: number;
    salt?: number;
    fiber?: number;
  };

  /** Additives codes */
  additives?: string[];

  /** Allergens */
  allergens?: string[];

  /** Labels/certifications */
  labels?: string[];

  /** Data source */
  source: DataSourceType;

  /** Source reference/ID */
  sourceReference: string;

  /** Data quality score (0-1) */
  qualityScore: number;
}

/**
 * Price record for export
 */
export interface PriceExportRecord {
  /** Product EAN */
  ean: string;

  /** Product name */
  productName: string;

  /** Brand */
  brand: string;

  /** Territory */
  territory: TerritoryCode;

  /** Store/retailer */
  store: string;

  /** Price observed */
  price: number;

  /** Price unit (e.g., "EUR/kg") */
  priceUnit: string;

  /** Observation date */
  observedAt: string; // ISO 8601

  /** Data source */
  source: DataSourceType;

  /** Source reference */
  sourceReference: string;
}

/**
 * Ingredient record for export
 */
export interface IngredientExportRecord {
  /** Ingredient name */
  name: string;

  /** Frequency in products */
  frequency: number; // Number of products containing this ingredient

  /** Product categories where found */
  categories: string[];

  /** Territories where observed */
  territories: TerritoryCode[];

  /** First observed date */
  firstObserved: string; // ISO 8601

  /** Last observed date */
  lastObserved: string; // ISO 8601
}

/**
 * Store/retailer record for export
 */
export interface StoreExportRecord {
  /** Store name */
  name: string;

  /** Territory */
  territory: TerritoryCode;

  /** Number of products tracked */
  productCount: number;

  /** Number of price observations */
  priceObservationCount: number;

  /** Date range covered */
  dateRange: {
    start: string; // ISO 8601
    end: string; // ISO 8601
  };
}

/**
 * Export request parameters
 */
export interface OpenDataExportRequest {
  /** Export format */
  format: ExportFormat;

  /** Data type to export */
  dataType: 'products' | 'prices' | 'ingredients' | 'stores' | 'all';

  /** Territory filter */
  territory?: TerritoryCode | TerritoryCode[];

  /** Date range filter */
  dateRange?: {
    start: string; // ISO 8601
    end: string; // ISO 8601
  };

  /** Include metadata file */
  includeMetadata?: boolean;

  /** Minimum quality score filter */
  minQualityScore?: number; // 0-1

  /** Maximum records to export */
  limit?: number;
}

/**
 * CSV export options
 */
export interface CSVExportOptions {
  /** Field delimiter */
  delimiter: string;

  /** Include header row */
  includeHeader: boolean;

  /** Quote character */
  quoteChar: string;

  /** Line ending */
  lineEnding: '\n' | '\r\n';

  /** Encoding */
  encoding: 'utf-8' | 'utf-16' | 'iso-8859-1';
}

/**
 * JSON export options
 */
export interface JSONExportOptions {
  /** Pretty print (formatted) */
  pretty: boolean;

  /** Indentation spaces (if pretty) */
  indent: number;

  /** Include metadata in same file */
  embedMetadata: boolean;
}

/**
 * Export result
 */
export interface OpenDataExportResponse {
  /** Success status */
  success: boolean;

  /** Export data (if successful) */
  data?: {
    /** Exported content */
    content: string;

    /** Content type */
    contentType: string;

    /** Suggested filename */
    filename: string;

    /** File size in bytes */
    sizeBytes: number;

    /** Metadata (if separate) */
    metadata?: ExportMetadata;
  };

  /** Error message (if failed) */
  error?: string;

  /** Processing metadata */
  processingMetadata: {
    /** Processing time in milliseconds */
    processingTime: number;

    /** Export version */
    exportVersion: string;

    /** Records processed */
    recordsProcessed: number;

    /** Records exported */
    recordsExported: number;
  };
}

/**
 * Batch export request for multiple data types
 */
export interface BatchExportRequest {
  /** Export format */
  format: ExportFormat;

  /** Data types to include */
  dataTypes: Array<'products' | 'prices' | 'ingredients' | 'stores'>;

  /** Common filters */
  filters: {
    territory?: TerritoryCode | TerritoryCode[];
    dateRange?: {
      start: string;
      end: string;
    };
    minQualityScore?: number;
  };

  /** Export options */
  options?: CSVExportOptions | JSONExportOptions;
}

/**
 * Batch export response
 */
export interface BatchExportResponse {
  /** Success status */
  success: boolean;

  /** Individual export results */
  exports?: Array<{
    dataType: string;
    content: string;
    filename: string;
    sizeBytes: number;
  }>;

  /** Combined metadata */
  metadata?: ExportMetadata;

  /** Error message (if failed) */
  error?: string;

  /** Processing metadata */
  processingMetadata: {
    processingTime: number;
    exportVersion: string;
    totalRecords: number;
  };
}

/**
 * Export validation result
 */
export interface ExportValidationResult {
  /** Validation passed */
  isValid: boolean;

  /** Validation errors */
  errors: string[];

  /** Validation warnings */
  warnings: string[];

  /** Statistics */
  stats: {
    totalRecords: number;
    validRecords: number;
    invalidRecords: number;
    missingFields: Record<string, number>;
  };
}
