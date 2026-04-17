/**
 * Type definitions for Land Mobility Comparison Feature v2.3.0
 *
 * Principles:
 * - Read-only comparison (no data modification)
 * - Category-based mobility matching (bus, taxi/VTC, fuel)
 * - Multi-provider/station aggregation by territory
 * - Transparent data sources (mandatory SourceReference)
 * - Ranking from cheapest to most expensive
 * - Percentage difference calculations
 * - No recommendations or purchase advice
 * - Observed data only (not declarative)
 */

import type { Territory, DataSource } from './priceAlerts';
import type { SourceReference } from './transportComparison';

/**
 * Land mobility category types
 */
export type LandMobilityCategory = 'BUS' | 'TAXI' | 'FUEL';

/**
 * Bus line identifier
 */
export interface BusLineIdentifier {
  lineNumber?: string; // Bus line number (e.g., "12", "A")
  lineName?: string; // Bus line name
  zone?: string; // Zone or area covered
  territory: Territory;
  operator: string; // Bus operator name
}

/**
 * Taxi zone identifier
 */
export interface TaxiZoneIdentifier {
  origin?: string; // Origin point/zone
  destination?: string; // Destination point/zone
  distance?: number; // Distance in km
  territory: Territory;
}

/**
 * Fuel station identifier
 */
export interface FuelStationIdentifier {
  stationId?: string; // Station identifier
  stationName?: string; // Station name
  brand?: string; // Fuel brand
  territory: Territory;
  location?: {
    address?: string;
    city?: string;
    postalCode?: string;
  };
}

/**
 * Fuel type
 */
export type FuelType = 'SP95' | 'SP98' | 'E10' | 'E85' | 'DIESEL' | 'GPL';

/**
 * Base price point for land mobility
 */
export interface LandMobilityPricePoint {
  category: LandMobilityCategory;
  price: number; // Price in euros
  currency: string; // Currency code (default: EUR)
  priceUnit: string; // Unit (e.g., "ticket", "km", "liter")
  observationDate: string; // ISO 8601 date of price observation
  source: SourceReference; // Mandatory source reference
  volume: number; // Number of observations used
  confidence: 'high' | 'medium' | 'low';
  verified: boolean; // Has been verified by multiple sources
}

/**
 * Bus price point
 */
export interface BusPricePoint extends LandMobilityPricePoint {
  category: 'BUS';
  line: BusLineIdentifier;
  ticketType: 'single' | 'return' | 'day_pass' | 'weekly' | 'monthly';
  conditions?: string; // Special conditions
}

/**
 * Taxi price point
 */
export interface TaxiPricePoint extends LandMobilityPricePoint {
  category: 'TAXI';
  zone: TaxiZoneIdentifier;
  serviceType: 'taxi' | 'vtc' | 'shared';
  operator: string; // Taxi/VTC operator
  baseFare?: number; // Base fare
  perKmRate?: number; // Rate per km
  estimatedDuration?: number; // Estimated duration in minutes
  conditions?: string;
}

/**
 * Fuel price point
 */
export interface FuelPricePoint extends LandMobilityPricePoint {
  category: 'FUEL';
  station: FuelStationIdentifier;
  fuelType: FuelType;
  pricePerLiter: number; // Price per liter
}

/**
 * Land mobility price with ranking
 */
export interface LandMobilityRanking {
  rank: number; // 1 = cheapest
  mobilityPrice: BusPricePoint | TaxiPricePoint | FuelPricePoint;
  absoluteDifferenceFromCheapest: number;
  percentageDifferenceFromCheapest: number;
  absoluteDifferenceFromAverage: number;
  percentageDifferenceFromAverage: number;
  priceCategory: 'cheapest' | 'below_average' | 'average' | 'above_average' | 'most_expensive';
}

/**
 * Aggregated land mobility price data
 */
export interface LandMobilityAggregation {
  category: LandMobilityCategory;
  territory: Territory;
  providerCount: number; // Number of providers/stations
  averagePrice: number;
  minPrice: number;
  maxPrice: number;
  priceRange: number;
  priceRangePercentage: number;
  observationPeriod: {
    from: string; // ISO 8601
    to: string; // ISO 8601
  };
  totalObservations: number;
  lastUpdate: string; // ISO 8601
}

/**
 * Land mobility comparison result
 */
export interface LandMobilityComparisonResult {
  category: LandMobilityCategory;
  territory: Territory;
  rankings: LandMobilityRanking[];
  aggregation: LandMobilityAggregation;
  comparisonDate: string; // ISO 8601
  metadata: LandMobilityMetadata;
}

/**
 * Metadata for land mobility comparison transparency
 */
export interface LandMobilityMetadata {
  methodology: string; // Methodology version (e.g., "v2.3.0")
  aggregationMethod: 'mean' | 'median' | 'weighted';
  dataQuality: {
    totalProviders: number;
    providersWithData: number;
    coveragePercentage: number;
    oldestObservation: string; // ISO 8601
    newestObservation: string; // ISO 8601
  };
  sources: SourceSummary[];
  warnings?: string[];
  limitations: string[];
}

/**
 * Summary of data sources
 */
export interface SourceSummary {
  source: DataSource;
  observationCount: number;
  providerCount: number;
  percentage: number;
}

/**
 * Filter options for land mobility queries
 */
export interface LandMobilityFilter {
  category?: LandMobilityCategory;
  territory?: Territory;
  operator?: string; // Bus operator or taxi service
  fuelType?: FuelType;
  maxPriceAge?: number; // Max age in days
  minConfidence?: 'low' | 'medium' | 'high';
  verifiedOnly?: boolean;
}

/**
 * Land mobility configuration
 */
export interface LandMobilityConfig {
  enabled: boolean;
  maxPriceAgeDays: number;
  minObservationsPerProvider: number;
  defaultCategory: LandMobilityCategory;
  cacheTimeout: number; // Cache timeout in seconds
}

/**
 * Land mobility price history point (v2.3.1)
 */
export interface LandMobilityHistoryPoint {
  date: string; // ISO 8601
  category: LandMobilityCategory;
  territory: Territory;
  providerId?: string; // Optional: specific provider
  averagePrice: number;
  minPrice: number;
  maxPrice: number;
  observationCount: number;
  sources: SourceReference[];
}

/**
 * Variation indicator for land mobility (v2.3.1)
 */
export interface LandMobilityVariationIndicator {
  category: LandMobilityCategory;
  territory: Territory;
  period: 'day' | 'week' | 'month' | 'year';
  significantVariationDetected: boolean;
  variations?: {
    increases: number; // Count of significant increases
    decreases: number; // Count of significant decreases
    averageVariation: number; // Average variation percentage
    maxVariation: number; // Maximum variation percentage
  };
  observations: {
    periodStart: string; // ISO 8601
    periodEnd: string; // ISO 8601
    dataPoints: number;
  };
  confidence: 'high' | 'medium' | 'low';
  methodology: string;
}

/**
 * Territory aggregation for land mobility costs (v2.3.2)
 */
export interface LandMobilityTerritoryAggregation {
  territory: Territory;
  categories: LandMobilityCategoryAggregation[];
  overallAccessibility: {
    busLineCount: number;
    taxiProviderCount: number;
    fuelStationCount: number;
    mobilityIndex: number; // Combined mobility accessibility index
  };
  priceDispersion: {
    standardDeviation: number;
    coefficientOfVariation: number;
    interquartileRange: number;
  };
  observationPeriod: {
    from: string; // ISO 8601
    to: string; // ISO 8601
  };
  lastUpdate: string; // ISO 8601
}

/**
 * Category-specific aggregation
 */
export interface LandMobilityCategoryAggregation {
  category: LandMobilityCategory;
  providerCount: number;
  averagePrice: number;
  priceRange: number;
  accessibility: number; // Accessibility score (0-100)
}

/**
 * Cost indicator for land mobility analysis (v2.3.2)
 */
export interface LandMobilityCostIndicator {
  category: LandMobilityCategory;
  name: string;
  value: number;
  unit: string;
  description: string;
  sources: SourceReference[];
  comparisonToNational?: {
    nationalValue: number;
    difference: number;
    percentageDifference: number;
  };
  comparisonToUrbanAverage?: {
    urbanValue: number;
    difference: number;
    percentageDifference: number;
  };
}

/**
 * Multi-territory land mobility comparison (v2.3.2)
 */
export interface MultiTerritoryLandMobilityComparison {
  category: LandMobilityCategory;
  territoryComparisons: TerritoryLandMobilityComparison[];
  baseTerritory?: Territory;
  comparisonDate: string; // ISO 8601
}

/**
 * Land mobility comparison for a single territory (v2.3.2)
 */
export interface TerritoryLandMobilityComparison {
  territory: Territory;
  category: LandMobilityCategory;
  averagePrice: number;
  cheapestPrice: number;
  mostExpensivePrice: number;
  providerCount: number;
  accessibility: number; // Accessibility score
  differenceFromBase?: {
    absolute: number;
    percentage: number;
  };
  urbanRuralClassification?: 'urban' | 'suburban' | 'rural';
}
