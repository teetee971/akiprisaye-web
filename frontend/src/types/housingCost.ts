/**
 * Type definitions for Housing Cost Observatory Feature v2.4.0
 *
 * Principles:
 * - Read-only observation (no data modification)
 * - Rent and housing cost analysis by territory
 * - Observed data only (listings, public records)
 * - Transparent data sources (mandatory SourceReference)
 * - No recommendations or legal/financial advice
 * - No proprietary scoring
 */

import type { Territory, DataSource } from './priceAlerts';
import type { SourceReference } from './transportComparison';

/**
 * Housing type classification
 */
export type HousingType =
  | 'STUDIO'
  | 'T1'
  | 'T2'
  | 'T3'
  | 'T4'
  | 'T5_PLUS'
  | 'HOUSE'
  | 'SHARED'
  | 'OTHER';

/**
 * Housing price point with observed data
 */
export interface HousingPricePoint {
  housingId?: string; // Optional listing/record ID
  type: HousingType;
  surface: number; // Surface in m²
  rent: number; // Monthly rent in euros
  charges?: number; // Monthly charges in euros
  additionalCosts?: {
    // Optional additional observed costs
    agency?: number; // Agency fees
    deposit?: number; // Security deposit
    insurance?: number; // Monthly insurance
    utilities?: number; // Monthly utilities estimate
  };
  territory: Territory;
  location?: {
    city?: string;
    postalCode?: string;
    district?: string;
    urbanRuralClassification?: 'urban' | 'suburban' | 'rural';
  };
  furnished?: boolean;
  observationDate: string; // ISO 8601 date
  source: SourceReference; // Mandatory source
  volume: number; // Number of observations
  confidence: 'high' | 'medium' | 'low';
  verified: boolean;
}

/**
 * Housing cost per square meter
 */
export interface HousingCostPerM2 {
  pricePoint: HousingPricePoint;
  rentPerM2: number;
  totalCostPerM2?: number; // Including charges
}

/**
 * Territory aggregation for housing costs
 */
export interface HousingTerritoryAggregation {
  territory: Territory;
  housingType?: HousingType; // Optional: filter by type
  statistics: {
    listingCount: number;
    averageRent: number;
    medianRent: number;
    minRent: number;
    maxRent: number;
    averageSurface: number;
    medianSurface: number;
    averageRentPerM2: number;
    medianRentPerM2: number;
  };
  dispersion: {
    standardDeviation: number;
    coefficientOfVariation: number;
    interquartileRange: number;
    percentile25: number;
    percentile75: number;
  };
  urbanRuralBreakdown?: {
    urban: number; // Count of urban listings
    suburban: number;
    rural: number;
  };
  observationPeriod: {
    from: string; // ISO 8601
    to: string; // ISO 8601
  };
  lastUpdate: string; // ISO 8601
}

/**
 * Housing cost comparison result
 */
export interface HousingCostComparisonResult {
  territory: Territory;
  housingType?: HousingType;
  pricePoints: HousingCostPerM2[];
  aggregation: HousingTerritoryAggregation;
  comparisonDate: string; // ISO 8601
  metadata: HousingCostMetadata;
}

/**
 * Metadata for housing cost transparency
 */
export interface HousingCostMetadata {
  methodology: string; // Methodology version (e.g., "v2.4.0")
  aggregationMethod: 'mean' | 'median' | 'weighted';
  dataQuality: {
    totalListings: number;
    listingsWithData: number;
    coveragePercentage: number;
    oldestObservation: string; // ISO 8601
    newestObservation: string; // ISO 8601
  };
  sources: HousingSourceSummary[];
  warnings?: string[];
  limitations: string[];
}

/**
 * Summary of data sources for housing
 */
export interface HousingSourceSummary {
  source: DataSource;
  observationCount: number;
  percentage: number;
}

/**
 * Filter options for housing queries
 */
export interface HousingCostFilter {
  territory?: Territory;
  housingType?: HousingType;
  minSurface?: number;
  maxSurface?: number;
  minRent?: number;
  maxRent?: number;
  furnished?: boolean;
  urbanRuralClassification?: 'urban' | 'suburban' | 'rural';
  maxPriceAge?: number; // Max age in days
  minConfidence?: 'low' | 'medium' | 'high';
  verifiedOnly?: boolean;
}

/**
 * Housing cost history point
 */
export interface HousingCostHistory {
  date: string; // ISO 8601 (month-level)
  territory: Territory;
  housingType?: HousingType;
  averageRent: number;
  medianRent: number;
  averageRentPerM2: number;
  medianRentPerM2: number;
  listingCount: number;
  sources: SourceReference[];
}

/**
 * Housing cost variation indicator
 */
export interface HousingCostVariation {
  territory: Territory;
  housingType?: HousingType;
  period: {
    from: string; // ISO 8601
    to: string; // ISO 8601
  };
  variation: {
    absoluteChange: number; // Change in euros
    percentageChange: number; // Change in percentage
    direction: 'increase' | 'decrease' | 'stable';
  };
  confidence: 'high' | 'medium' | 'low';
  methodology: string;
}

/**
 * Multi-territory housing comparison
 */
export interface MultiTerritoryHousingComparison {
  housingType?: HousingType;
  territories: TerritoryHousingComparison[];
  baseTerritory?: Territory;
  comparisonDate: string; // ISO 8601
}

/**
 * Housing comparison for a single territory
 */
export interface TerritoryHousingComparison {
  territory: Territory;
  averageRent: number;
  medianRent: number;
  averageRentPerM2: number;
  listingCount: number;
  differenceFromBase?: {
    absolute: number;
    percentage: number;
  };
  affordabilityIndex?: number; // Descriptive index (0-100)
}

/**
 * Housing cost configuration
 */
export interface HousingCostConfig {
  enabled: boolean;
  maxPriceAgeDays: number;
  minObservationsPerTerritory: number;
  defaultTerritory: Territory;
  cacheTimeout: number; // Cache timeout in seconds
}

/**
 * Housing cost ranking
 */
export interface HousingCostRanking {
  rank: number;
  pricePoint: HousingPricePoint;
  rentPerM2: number;
  absoluteDifferenceFromMedian: number;
  percentageDifferenceFromMedian: number;
  priceCategory: 'very_low' | 'low' | 'median' | 'high' | 'very_high';
}
