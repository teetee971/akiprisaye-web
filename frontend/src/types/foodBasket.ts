/**
 * Type definitions for Food Basket Observatory Feature v2.5.0
 * 
 * Principles:
 * - Read-only observation (no data modification)
 * - Type basket analysis (basic, family, local)
 * - Observed data only (receipts, field observations, open data)
 * - Transparent data sources (mandatory SourceReference)
 * - No nutrition score or dietary advice
 * - No purchase recommendations
 * - Territorial variation tracking
 */

import type { Territory, DataSource } from './priceAlerts';
import type { SourceReference } from './transportComparison';

/**
 * Food basket type classification
 */
export type FoodBasketType = 'BASIC' | 'FAMILY' | 'LOCAL';

/**
 * Food category classification
 */
export type FoodCategory = 
  | 'FRUITS_VEGETABLES'
  | 'MEAT_FISH'
  | 'DAIRY'
  | 'BREAD_CEREALS'
  | 'BEVERAGES'
  | 'CONDIMENTS'
  | 'FROZEN'
  | 'OTHER';

/**
 * Food basket item
 */
export interface FoodBasketItem {
  itemId?: string;                // Optional item identifier
  name: string;                   // Item name (e.g., "Lait demi-écrémé")
  category: FoodCategory;
  quantity: number;               // Quantity needed
  unit: string;                   // Unit (kg, L, unit, etc.)
  ean?: string;                   // Optional EAN code
  brand?: string;                 // Optional brand
  localProduct?: boolean;         // Is it a local product?
}

/**
 * Food basket item price observation
 */
export interface FoodBasketItemPrice {
  item: FoodBasketItem;
  storeId?: string;
  storeName: string;
  storeChain?: string;
  price: number;                  // Price for the quantity needed
  pricePerUnit: number;           // Price per kg/L/unit
  territory: Territory;
  observationDate: string;        // ISO 8601
  source: SourceReference;        // Mandatory source
  volume: number;                 // Number of observations
  confidence: 'high' | 'medium' | 'low';
  verified: boolean;
  availability?: 'in_stock' | 'out_of_stock' | 'seasonal';
}

/**
 * Food basket definition
 */
export interface FoodBasket {
  basketId: string;
  name: string;
  type: FoodBasketType;
  description: string;
  items: FoodBasketItem[];
  period: 'daily' | 'weekly' | 'monthly';
  targetHouseholdSize?: number;   // Number of people
  territory?: Territory;          // Optional territory specification
  metadata: {
    createdAt: string;            // ISO 8601
    updatedAt: string;            // ISO 8601
    version: string;              // Basket version
    methodology: string;          // How items were selected
  };
}

/**
 * Food basket observation (prices for all items)
 */
export interface FoodBasketObservation {
  basket: FoodBasket;
  territory: Territory;
  storeId?: string;
  storeName?: string;
  itemPrices: FoodBasketItemPrice[];
  totalCost: number;
  completeness: number;           // Percentage of items found (0-100)
  observationDate: string;        // ISO 8601
  sources: SourceReference[];
}

/**
 * Food basket aggregation by territory
 */
export interface FoodBasketAggregation {
  basket: FoodBasket;
  territory: Territory;
  statistics: {
    observationCount: number;
    storeCount: number;
    averageCost: number;
    medianCost: number;
    minCost: number;
    maxCost: number;
    averageCompleteness: number;  // Average % of items found
  };
  dispersion: {
    standardDeviation: number;
    coefficientOfVariation: number;
    interquartileRange: number;
  };
  itemBreakdown: FoodBasketItemBreakdown[];
  observationPeriod: {
    from: string;                 // ISO 8601
    to: string;                   // ISO 8601
  };
  lastUpdate: string;             // ISO 8601
}

/**
 * Item-level breakdown in basket
 */
export interface FoodBasketItemBreakdown {
  item: FoodBasketItem;
  averagePrice: number;
  minPrice: number;
  maxPrice: number;
  priceRange: number;
  priceRangePercentage: number;
  availabilityRate: number;       // % of stores where item is available
  observationCount: number;
}

/**
 * Food basket comparison result
 */
export interface FoodBasketComparisonResult {
  basket: FoodBasket;
  territory: Territory;
  observations: FoodBasketObservation[];
  aggregation: FoodBasketAggregation;
  ranking: FoodBasketStoreRanking[];
  comparisonDate: string;         // ISO 8601
  metadata: FoodBasketMetadata;
}

/**
 * Store ranking for food basket
 */
export interface FoodBasketStoreRanking {
  rank: number;
  observation: FoodBasketObservation;
  absoluteDifferenceFromCheapest: number;
  percentageDifferenceFromCheapest: number;
  absoluteDifferenceFromMedian: number;
  percentageDifferenceFromMedian: number;
  priceCategory: 'cheapest' | 'below_median' | 'median' | 'above_median' | 'most_expensive';
  completenessScore: number;      // How complete the basket is
}

/**
 * Metadata for food basket transparency
 */
export interface FoodBasketMetadata {
  methodology: string;            // Methodology version (e.g., "v2.5.0")
  aggregationMethod: 'mean' | 'median' | 'weighted';
  dataQuality: {
    totalObservations: number;
    observationsWithCompleteData: number;
    averageCompleteness: number;
    coveragePercentage: number;
    oldestObservation: string;    // ISO 8601
    newestObservation: string;    // ISO 8601
  };
  sources: FoodBasketSourceSummary[];
  warnings?: string[];
  limitations: string[];
}

/**
 * Summary of data sources for food basket
 */
export interface FoodBasketSourceSummary {
  source: DataSource;
  observationCount: number;
  storeCount: number;
  percentage: number;
}

/**
 * Filter options for food basket queries
 */
export interface FoodBasketFilter {
  basketType?: FoodBasketType;
  territory?: Territory;
  storeChain?: string;
  minCompleteness?: number;       // Minimum % of items found
  maxPriceAge?: number;           // Max age in days
  includeLocalOnly?: boolean;     // Only local products
  verifiedOnly?: boolean;
}

/**
 * Food basket history point
 */
export interface FoodBasketHistoryPoint {
  date: string;                   // ISO 8601 (week or month level)
  basket: FoodBasket;
  territory: Territory;
  averageCost: number;
  medianCost: number;
  minCost: number;
  maxCost: number;
  observationCount: number;
  averageCompleteness: number;
  sources: SourceReference[];
}

/**
 * Food basket cost variation
 */
export interface FoodBasketVariation {
  basket: FoodBasket;
  territory: Territory;
  period: {
    from: string;                 // ISO 8601
    to: string;                   // ISO 8601
  };
  variation: {
    absoluteChange: number;
    percentageChange: number;
    direction: 'increase' | 'decrease' | 'stable';
  };
  itemVariations: FoodBasketItemVariation[];
  confidence: 'high' | 'medium' | 'low';
  methodology: string;
}

/**
 * Item-level variation
 */
export interface FoodBasketItemVariation {
  item: FoodBasketItem;
  absoluteChange: number;
  percentageChange: number;
  direction: 'increase' | 'decrease' | 'stable';
  significance: 'high' | 'medium' | 'low';
}

/**
 * Multi-territory food basket comparison
 */
export interface MultiTerritoryFoodBasketComparison {
  basket: FoodBasket;
  territories: TerritoryFoodBasketComparison[];
  baseTerritory?: Territory;
  comparisonDate: string;         // ISO 8601
}

/**
 * Food basket comparison for a single territory
 */
export interface TerritoryFoodBasketComparison {
  territory: Territory;
  averageCost: number;
  medianCost: number;
  storeCount: number;
  observationCount: number;
  averageCompleteness: number;
  differenceFromBase?: {
    absolute: number;
    percentage: number;
  };
  localProductAvailability?: number; // % of local products available
}

/**
 * Food basket configuration
 */
export interface FoodBasketConfig {
  enabled: boolean;
  maxPriceAgeDays: number;
  minCompletenessPercent: number;
  defaultBasketType: FoodBasketType;
  cacheTimeout: number;           // Cache timeout in seconds
}

/**
 * Open data export format for food baskets
 */
export interface FoodBasketOpenDataExport {
  version: string;
  exportDate: string;             // ISO 8601
  basket: FoodBasket;
  observations: FoodBasketObservation[];
  aggregations: FoodBasketAggregation[];
  metadata: {
    totalObservations: number;
    territoryCoverage: Territory[];
    dateRange: {
      from: string;
      to: string;
    };
    sources: DataSource[];
    license: string;
    attribution: string;
  };
}
