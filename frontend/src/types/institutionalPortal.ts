/**
 * Institutional Portal Types - v4.0.0
 *
 * Types for institutional access to the cost of living observatory
 * Read-only access with transparent methodology
 *
 * @module institutionalPortalTypes
 */

import type { TerritoryCode } from './extensions';

/**
 * Type of institutional user
 */
export type InstitutionalUserType = 'institution' | 'research' | 'press';

/**
 * Institutional user profile
 */
export interface InstitutionalUser {
  id: string;
  type: InstitutionalUserType;
  organization: string;
  contactEmail: string;
  accessLevel: AccessLevel;
  createdAt: string;
  lastAccess?: string;
}

/**
 * Access level for institutional users
 */
export type AccessLevel = 'basic' | 'standard' | 'advanced';

/**
 * Access scope definition
 */
export interface AccessScope {
  userId: string;
  allowedTerritories: TerritoryCode[] | 'all';
  allowedDatasets: string[] | 'all';
  allowedExports: ExportFormat[];
  rateLimit: {
    requestsPerHour: number;
    requestsPerDay: number;
  };
  validUntil?: string; // ISO 8601 date
}

/**
 * Export format for institutional data
 */
export type ExportFormat = 'json' | 'csv' | 'xml' | 'xlsx';

/**
 * Dataset descriptor for institutional access
 */
export interface DatasetDescriptor {
  id: string;
  name: string;
  description: string;
  version: string;
  methodology: string; // URL or reference to methodology document
  lastUpdate: string; // ISO 8601
  updateFrequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  coverage: {
    territories: TerritoryCode[];
    startDate: string; // ISO 8601
    endDate?: string; // ISO 8601, undefined if ongoing
  };
  fields: DatasetField[];
  sourceReferences: string[]; // Citations and source URLs
  license: string; // License type (e.g., "Open Data License")
  permanentUrl: string; // Permanent URL for citation
}

/**
 * Field definition in a dataset
 */
export interface DatasetField {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean';
  description: string;
  unit?: string; // e.g., "EUR", "%", "count"
  nullable: boolean;
}

/**
 * Global indices available for institutional access
 */
export interface GlobalIndex {
  id: string;
  name: string;
  description: string;
  value: number;
  unit: string;
  territory: TerritoryCode;
  date: string; // ISO 8601
  methodology: string;
  components: IndexComponent[];
}

/**
 * Component of a global index
 */
export interface IndexComponent {
  id: string;
  name: string;
  weight: number; // 0-1, sum of all weights = 1
  value: number;
  unit: string;
}

/**
 * Multi-territory comparison result
 */
export interface MultiTerritoryComparison {
  referenceTerritory: TerritoryCode;
  comparisonTerritories: TerritoryCode[];
  indicator: string;
  date: string; // ISO 8601
  results: TerritoryComparisonResult[];
  methodology: string;
}

/**
 * Single territory comparison result
 */
export interface TerritoryComparisonResult {
  territory: TerritoryCode;
  value: number;
  unit: string;
  percentageDifference: number; // Relative to reference territory
  ranking?: number; // Optional ranking among compared territories
}

/**
 * Historical data access request
 */
export interface HistoricalDataRequest {
  datasetId: string;
  territory: TerritoryCode;
  startDate: string; // ISO 8601
  endDate: string; // ISO 8601
  aggregation?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
}

/**
 * Historical data response
 */
export interface HistoricalDataResponse {
  request: HistoricalDataRequest;
  data: HistoricalDataPoint[];
  metadata: {
    totalPoints: number;
    firstDate: string;
    lastDate: string;
    methodology: string;
  };
}

/**
 * Single historical data point
 */
export interface HistoricalDataPoint {
  date: string; // ISO 8601
  value: number;
  unit: string;
  source: string;
  quality?: 'verified' | 'estimated' | 'preliminary';
}

/**
 * Metadata access response
 */
export interface MetadataResponse {
  datasets: DatasetDescriptor[];
  indices: GlobalIndex[];
  territories: TerritoryMetadata[];
  methodologies: MethodologyReference[];
  lastUpdate: string; // ISO 8601
}

/**
 * Territory metadata
 */
export interface TerritoryMetadata {
  code: TerritoryCode;
  name: string;
  type: 'metropole' | 'dom' | 'rom' | 'com';
  population?: number;
  area?: number; // km²
  currency: string;
  dataAvailability: {
    startDate: string;
    endDate?: string;
    coverage: number; // 0-100 percentage
  };
}

/**
 * Methodology reference
 */
export interface MethodologyReference {
  id: string;
  title: string;
  version: string;
  description: string;
  publicationDate: string; // ISO 8601
  url: string; // Permanent URL
  authors?: string[];
  citations?: string[];
}

/**
 * API access log entry
 */
export interface AccessLogEntry {
  timestamp: string; // ISO 8601
  userId: string;
  action: string;
  datasetId?: string;
  territory?: TerritoryCode;
  success: boolean;
  errorMessage?: string;
}
