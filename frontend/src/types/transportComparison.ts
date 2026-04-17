/**
 * Type definitions for Transport Comparison Feature v2.2.0
 *
 * Principles:
 * - Read-only comparison (no data modification)
 * - Route-based transport matching (plane, boat, inter-island)
 * - Multi-operator aggregation by territory
 * - Transparent data sources (mandatory SourceReference)
 * - Ranking from cheapest to most expensive
 * - Percentage difference calculations
 * - No recommendations or advice
 * - Observed data only (not declarative)
 */

import type { Territory, DataSource } from './priceAlerts';

/**
 * Transport mode types
 */
export type TransportMode = 'plane' | 'boat' | 'inter_island';

/**
 * Route identifier for transport comparison
 */
export interface TransportRouteIdentifier {
  origin: string; // Origin location/airport/port code
  destination: string; // Destination location/airport/port code
  originTerritory: Territory; // Territory of origin
  destinationTerritory: Territory; // Territory of destination
  mode: TransportMode; // Transport mode
  routeName?: string; // Human-readable route name
}

/**
 * Mandatory source reference for transparency
 */
export interface SourceReference {
  type: DataSource; // Source type
  url?: string; // Source URL if available
  observedAt: string; // ISO 8601 observation timestamp
  observedBy?: string; // Observer identifier (optional)
  verificationMethod: 'automated' | 'manual' | 'official';
  reliability: 'high' | 'medium' | 'low';
}

/**
 * Transport price data point for a specific route and operator
 */
export interface TransportPricePoint {
  operatorId: string; // Operator identifier
  operatorName: string; // Operator display name
  route: TransportRouteIdentifier;
  price: number; // Price in euros
  currency: string; // Currency code (default: EUR)
  priceType: 'base' | 'promotional' | 'dynamic'; // Price type
  conditions?: string; // Price conditions (e.g., "non-refundable")
  observationDate: string; // ISO 8601 date of price observation
  source: SourceReference; // Mandatory source reference
  volume: number; // Number of observations used
  confidence: 'high' | 'medium' | 'low'; // Confidence level
  verified: boolean; // Has been verified by multiple sources
  additionalFees?: {
    // Optional breakdown of fees
    baggage?: number;
    seat?: number;
    booking?: number;
    total: number;
  };
}

/**
 * Transport price with ranking and differences
 */
export interface TransportPriceRanking {
  rank: number; // 1 = cheapest
  transportPrice: TransportPricePoint;
  absoluteDifferenceFromCheapest: number; // Difference in euros
  percentageDifferenceFromCheapest: number; // Difference in percentage
  absoluteDifferenceFromAverage: number; // Difference from average
  percentageDifferenceFromAverage: number; // Percentage from average
  priceCategory: 'cheapest' | 'below_average' | 'average' | 'above_average' | 'most_expensive';
}

/**
 * Aggregated transport price data for a route
 */
export interface RouteAggregation {
  route: TransportRouteIdentifier;
  operatorCount: number; // Number of operators on route
  averagePrice: number; // Average price across operators
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
 * Transport price comparison result for a route across operators
 */
export interface TransportComparisonResult {
  route: TransportRouteIdentifier;
  operatorPrices: TransportPriceRanking[];
  aggregation: RouteAggregation;
  comparisonDate: string; // ISO 8601 comparison timestamp
  metadata: TransportComparisonMetadata;
}

/**
 * Metadata for transport comparison transparency
 */
export interface TransportComparisonMetadata {
  methodology: string; // Methodology version (e.g., "v2.2.0")
  aggregationMethod: 'mean' | 'median' | 'weighted';
  dataQuality: {
    totalOperators: number;
    operatorsWithData: number;
    coveragePercentage: number;
    oldestObservation: string; // ISO 8601
    newestObservation: string; // ISO 8601
  };
  sources: SourceSummary[];
  warnings?: string[]; // Any data quality warnings
  limitations: string[]; // Explicit limitations of the data
}

/**
 * Summary of data sources used in comparison
 */
export interface SourceSummary {
  source: DataSource;
  observationCount: number;
  operatorCount: number;
  percentage: number; // Percentage of total data
}

/**
 * Filter options for transport comparison queries
 */
export interface TransportComparisonFilter {
  mode?: TransportMode; // Filter by transport mode
  originTerritory?: Territory; // Filter by origin territory
  destinationTerritory?: Territory; // Filter by destination territory
  operatorName?: string; // Filter by operator
  maxPriceAge?: number; // Max age in days
  minConfidence?: 'low' | 'medium' | 'high';
  verifiedOnly?: boolean; // Only verified prices
  includeAdditionalFees?: boolean; // Include additional fees in price
}

/**
 * Transport comparison configuration
 */
export interface TransportComparisonConfig {
  enabled: boolean; // Feature flag
  maxPriceAgeDays: number; // Maximum age for price data
  minObservationsPerOperator: number; // Minimum observations required
  defaultMode: TransportMode; // Default transport mode
  cacheTimeout: number; // Cache timeout in seconds
}

/**
 * Transport price history point for time series (v2.2.1)
 */
export interface TransportPriceHistoryPoint {
  date: string; // ISO 8601 date
  route: TransportRouteIdentifier;
  operatorId?: string; // Optional: specific operator
  averagePrice: number;
  minPrice: number;
  maxPrice: number;
  observationCount: number;
  sources: SourceReference[];
}

/**
 * Seasonality indicator for transport prices (v2.2.1)
 */
export interface TransportSeasonalityIndicator {
  route: TransportRouteIdentifier;
  period: 'month' | 'quarter' | 'year';
  seasonalityDetected: boolean;
  patterns?: {
    highSeasonMonths: number[]; // Months (1-12) with higher prices
    lowSeasonMonths: number[]; // Months (1-12) with lower prices
    averagePriceVariation: number; // Percentage variation
  };
  observations: {
    periodStart: string; // ISO 8601
    periodEnd: string; // ISO 8601
    dataPoints: number;
  };
  confidence: 'high' | 'medium' | 'low';
  methodology: string; // Methodology used for detection
}

/**
 * Territory aggregation for transport costs (v2.2.2)
 */
export interface TransportTerritoryAggregation {
  territory: Territory;
  mode: TransportMode;
  indicators: TransportCostIndicator[];
  routeCount: number; // Number of routes analyzed
  operatorCount: number; // Number of operators serving territory
  averageRoutePrice: number; // Average price across all routes
  priceDispersion: {
    standardDeviation: number;
    coefficientOfVariation: number;
    interquartileRange: number;
  };
  accessibility: {
    internalRoutes: number; // Routes within territory
    externalRoutes: number; // Routes to other territories
    isolationIndex: number; // Higher = more isolated
  };
  observationPeriod: {
    from: string; // ISO 8601
    to: string; // ISO 8601
  };
  lastUpdate: string; // ISO 8601
}

/**
 * Cost indicator for transport analysis (v2.2.2)
 */
export interface TransportCostIndicator {
  name: string; // Indicator name
  value: number; // Indicator value
  unit: string; // Unit of measurement
  description: string; // Human-readable description
  sources: SourceReference[]; // Data sources
  comparisonToNational?: {
    // Comparison to national average
    nationalValue: number;
    difference: number;
    percentageDifference: number;
  };
}

/**
 * Multi-territory transport comparison (v2.2.2)
 */
export interface MultiTerritoryTransportComparison {
  route: TransportRouteIdentifier;
  territoryComparisons: TerritoryTransportComparison[];
  baseTerritory?: Territory; // Reference territory for comparison
  comparisonDate: string; // ISO 8601
}

/**
 * Transport comparison for a single territory (v2.2.2)
 */
export interface TerritoryTransportComparison {
  territory: Territory;
  mode: TransportMode;
  averagePrice: number;
  cheapestPrice: number;
  mostExpensivePrice: number;
  operatorCount: number;
  routeCount: number;
  differenceFromBase?: {
    absolute: number;
    percentage: number;
  };
  accessibility: {
    isolationIndex: number;
    connectivityScore: number;
  };
}
