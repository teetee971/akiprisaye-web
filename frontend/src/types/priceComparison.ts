/**
 * Type definitions for Price Comparison Feature v1.4.0
 *
 * Principles:
 * - Read-only comparison (no data modification)
 * - EAN-based product matching
 * - Multi-store aggregation by territory
 * - Transparent data sources
 * - Ranking from cheapest to most expensive
 * - Percentage difference calculations
 */

import { Territory, DataSource } from './priceAlerts';

/**
 * Product identifier with EAN code
 */
export interface ProductIdentifier {
  ean: string; // European Article Number (barcode)
  productName: string; // Product name for display
  category?: string; // Product category
  brand?: string; // Product brand
  unit?: string; // Unit of measure (kg, L, unit)
  quantity?: number; // Quantity in unit
}

/**
 * Store price data point for a specific product
 */
export interface StorePricePoint {
  storeId: string; // Store identifier
  storeName: string; // Store display name
  storeChain?: string; // Parent chain if applicable
  price: number; // Price in euros
  territory: Territory; // Territory where store is located
  observationDate: string; // ISO 8601 date of price observation
  source: DataSource; // Data source transparency
  volume: number; // Number of observations used
  confidence: 'high' | 'medium' | 'low'; // Confidence level
  verified: boolean; // Has been verified by multiple sources
}

/**
 * Aggregated price data for a territory
 */
export interface TerritoryPriceAggregation {
  territory: Territory;
  storeCount: number; // Number of stores in aggregation
  averagePrice: number; // Average price across stores
  minPrice: number; // Minimum price found
  maxPrice: number; // Maximum price found
  priceRange: number; // Difference between min and max
  priceRangePercentage: number; // Range as percentage of min
  observationPeriod: {
    from: string; // ISO 8601 start date
    to: string; // ISO 8601 end date
  };
  totalObservations: number; // Total number of price observations
  lastUpdate: string; // ISO 8601 last update timestamp
}

/**
 * Price comparison result for a product across stores
 */
export interface PriceComparisonResult {
  product: ProductIdentifier;
  territory: Territory;
  storePrices: StorePriceRanking[];
  aggregation: TerritoryPriceAggregation;
  comparisonDate: string; // ISO 8601 comparison timestamp
  metadata: PriceComparisonMetadata;
}

/**
 * Store price with ranking and differences
 */
export interface StorePriceRanking {
  rank: number; // 1 = cheapest
  storePrice: StorePricePoint;
  absoluteDifferenceFromCheapest: number; // Difference in euros
  percentageDifferenceFromCheapest: number; // Difference in percentage
  absoluteDifferenceFromAverage: number; // Difference from average
  percentageDifferenceFromAverage: number; // Percentage from average
  priceCategory: 'cheapest' | 'below_average' | 'average' | 'above_average' | 'most_expensive';
}

/**
 * Metadata for price comparison transparency
 */
export interface PriceComparisonMetadata {
  methodology: string; // Methodology version (e.g., "v1.4.0")
  aggregationMethod: 'mean' | 'median' | 'weighted';
  dataQuality: {
    totalStores: number;
    storesWithData: number;
    coveragePercentage: number;
    oldestObservation: string; // ISO 8601
    newestObservation: string; // ISO 8601
  };
  sources: DataSourceSummary[];
  warnings?: string[]; // Any data quality warnings
}

/**
 * Summary of data sources used in comparison
 */
export interface DataSourceSummary {
  source: DataSource;
  observationCount: number;
  storeCount: number;
  percentage: number; // Percentage of total data
}

/**
 * Filter options for price comparison queries
 */
export interface PriceComparisonFilter {
  ean?: string; // Filter by specific EAN
  territory?: Territory; // Filter by territory
  storeChain?: string; // Filter by store chain
  maxPriceAge?: number; // Max age in days
  minConfidence?: 'low' | 'medium' | 'high';
  verifiedOnly?: boolean; // Only verified prices
}

/**
 * Price comparison configuration
 */
export interface PriceComparisonConfig {
  enabled: boolean; // Feature flag
  maxPriceAgeDays: number; // Maximum age for price data
  minObservationsPerStore: number; // Minimum observations required
  defaultTerritory: Territory; // Default territory for queries
  cacheTimeout: number; // Cache timeout in seconds
}

/**
 * Price history point for trending
 */
export interface PriceHistoryPoint {
  date: string; // ISO 8601 date
  averagePrice: number;
  minPrice: number;
  maxPrice: number;
  observationCount: number;
  source: DataSource;
}

/**
 * Multi-territory price comparison
 */
export interface MultiTerritoryComparison {
  product: ProductIdentifier;
  territoryComparisons: TerritoryPriceComparison[];
  baseTerritory?: Territory; // Reference territory for comparison
  comparisonDate: string;
}

/**
 * Price comparison for a single territory
 */
export interface TerritoryPriceComparison {
  territory: Territory;
  averagePrice: number;
  cheapestPrice: number;
  mostExpensivePrice: number;
  storeCount: number;
  differenceFromBase?: {
    absolute: number;
    percentage: number;
  };
}
