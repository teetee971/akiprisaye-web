/**
 * Fuel Comparison Types v1.0.0
 *
 * Principles:
 * - Observer, not sell: Transparent price observation without affiliate links
 * - Read-only comparison (no data modification)
 * - Territory-based fuel station matching
 * - Official price cap tracking (Prix Plafonnés)
 * - Transparent data sources (API gouvernementale)
 * - Historical price tracking
 */

import type { Territory, DataSource } from './priceAlerts';
export type { Territory };

/**
 * Fuel types available
 */
export type FuelType = 'SP95' | 'SP98' | 'E10' | 'E85' | 'DIESEL' | 'GPL';

/**
 * Fuel station information
 */
export interface FuelStation {
  id: string;
  name: string;
  address: string;
  city: string;
  territory: Territory;
  location?: {
    lat: number;
    lng: number;
  };
  brand?: string;
  services?: string[];
}

/**
 * Source reference for fuel price data
 */
export interface FuelSourceReference {
  type: 'official_api' | 'prefectoral_decree' | 'user_report';
  url?: string;
  observedAt: string; // ISO 8601
  reliability: 'high' | 'medium' | 'low';
}

/**
 * Fuel price data point
 */
export interface FuelPricePoint {
  id: string;
  station: FuelStation;
  fuelType: FuelType;
  pricePerLiter: number;
  currency: string;
  observationDate: string; // ISO 8601
  source: FuelSourceReference;
  isPriceCapPlafonne: boolean;
  territory: Territory;
  lastUpdate?: string; // ISO 8601
}

/**
 * Fuel price ranking
 */
export interface FuelPriceRanking {
  rank: number;
  fuelPrice: FuelPricePoint;
  absoluteDifferenceFromCheapest: number;
  percentageDifferenceFromCheapest: number;
  absoluteDifferenceFromAverage: number;
  percentageDifferenceFromAverage: number;
  priceCategory: 'cheapest' | 'below_average' | 'average' | 'above_average' | 'most_expensive';
}

/**
 * Fuel price aggregation statistics
 */
export interface FuelAggregation {
  minPrice: number;
  maxPrice: number;
  averagePrice: number;
  medianPrice: number;
  priceRange: number;
  priceRangePercentage: number;
  standardDeviation: number;
  priceCapOfficiel?: number;
  totalStations: number;
  lastUpdate: string; // ISO 8601
}

/**
 * Fuel comparison result
 */
export interface FuelComparisonResult {
  territory: Territory;
  fuelType: FuelType;
  rankedPrices: FuelPriceRanking[];
  aggregation: FuelAggregation;
  comparisonDate: string; // ISO 8601
  metadata: {
    totalStations: number;
    dataSource: string;
    methodology: string;
    coveragePercentage: number;
    oldestObservation?: string;
    newestObservation?: string;
    warnings?: string[];
    limitations?: string[];
  };
}

/**
 * Historical fuel price data point
 */
export interface FuelHistoricalDataPoint {
  date: string; // ISO 8601
  averagePrice: number;
  minPrice: number;
  maxPrice: number;
  observationCount: number;
}

/**
 * Fuel price history
 */
export interface FuelPriceHistory {
  territory: Territory;
  fuelType: FuelType;
  timeSeries: FuelHistoricalDataPoint[];
  period: {
    startDate: string; // ISO 8601
    endDate: string; // ISO 8601
  };
}

/**
 * Filter options for fuel queries
 */
export interface FuelComparisonFilter {
  territory?: Territory;
  fuelType?: FuelType;
  maxPrice?: number;
  onlyPriceCap?: boolean;
  brand?: string;
  city?: string;
  maxDistanceKm?: number;
  userLocation?: {
    lat: number;
    lng: number;
  };
}

/**
 * Territory fuel statistics
 */
export interface TerritoryFuelStatistics {
  territory: Territory;
  fuelTypes: {
    fuelType: FuelType;
    averagePrice: number;
    minPrice: number;
    maxPrice: number;
    stationCount: number;
    hasPriceCap: boolean;
    priceCapValue?: number;
  }[];
  totalStations: number;
  comparisonDate: string; // ISO 8601
}
