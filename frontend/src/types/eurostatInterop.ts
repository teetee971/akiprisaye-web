/**
 * Eurostat Interoperability Types - v4.2.0
 * 
 * Types for Eurostat live data interoperability (read-only)
 * 
 * @module eurostatInteropTypes
 */

/**
 * Eurostat dataset identifier
 */
export type EurostatDatasetCode = string; // e.g., 'prc_hicp_midx', 'nama_10_gdp'

/**
 * Eurostat dataset
 */
export interface EurostatDataset {
  code: EurostatDatasetCode;
  title: string;
  description: string;
  lastUpdate: string; // ISO 8601
  dimensions: EurostatDimension[];
  url: string;
}

/**
 * Eurostat dimension
 */
export interface EurostatDimension {
  id: string;
  label: string;
  values: EurostatDimensionValue[];
}

/**
 * Eurostat dimension value
 */
export interface EurostatDimensionValue {
  code: string;
  label: string;
}

/**
 * Eurostat indicator
 */
export interface EurostatIndicator {
  code: string;
  name: string;
  unit: string;
  frequency: 'annual' | 'quarterly' | 'monthly' | 'daily';
  coverage: {
    countries: string[];
    startPeriod: string;
    endPeriod?: string;
  };
}

/**
 * Interoperability status
 */
export interface InteropStatus {
  service: 'eurostat' | 'insee' | 'oecd';
  status: 'online' | 'offline' | 'degraded';
  lastCheck: string; // ISO 8601
  lastSuccessfulSync: string; // ISO 8601
  errorMessage?: string;
  cacheAvailable: boolean;
  cacheAge?: number; // milliseconds
}

/**
 * Cache entry
 */
export interface CacheEntry<T> {
  key: string;
  data: T;
  timestamp: string; // ISO 8601
  checksum: string; // SHA-256
  expiresAt: string; // ISO 8601
}

/**
 * Data mapping
 */
export interface DataMapping {
  externalCode: string;
  externalLabel: string;
  internalCode: string;
  internalLabel: string;
  conversionFactor?: number;
  notes?: string;
}
