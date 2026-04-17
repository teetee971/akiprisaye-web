/**
 * Flight Comparison Types v1.0.0
 *
 * Principles:
 * - Observer, not sell: Transparent price observation without affiliate links
 * - Read-only comparison (no data modification)
 * - Route-based flight matching (DOM ↔ Métropole ↔ Regional)
 * - Multi-airline aggregation by route
 * - Transparent data sources
 * - Price variability tracking (date of purchase vs date of travel)
 * - Seasonal analysis (vacation vs off-season)
 */

import type { Territory, DataSource } from './priceAlerts';

/**
 * Airport information
 */
export interface Airport {
  code: string; // IATA code (e.g., 'PTP', 'ORY', 'CDG')
  name: string; // Full name
  city: string; // City name
  territory: Territory; // Territory
  region?: string; // Region (e.g., 'Métropole', 'DOM', 'Regional')
}

/**
 * Flight route identifier
 */
export interface FlightRoute {
  origin: Airport;
  destination: Airport;
  routeType: 'dom_metropole' | 'inter_dom' | 'regional' | 'international';
}

/**
 * Season type for price analysis
 */
export type SeasonType = 'high' | 'low' | 'shoulder';

/**
 * Price observation timing metadata
 */
export interface PriceTimingMetadata {
  purchaseDate: string; // ISO 8601 - when price was observed
  travelDate: string; // ISO 8601 - scheduled travel date
  daysBeforeDeparture: number; // Number of days between purchase and travel
  season: SeasonType; // Season classification
  isHoliday: boolean; // During holiday period
  holidayName?: string; // Name of holiday if applicable
}

/**
 * Source reference for transparency
 */
export interface FlightSourceReference {
  type: DataSource;
  url?: string;
  observedAt: string; // ISO 8601
  observedBy?: string;
  verificationMethod: 'automated' | 'manual' | 'official';
  reliability: 'high' | 'medium' | 'low';
}

/**
 * Flight price data point
 */
export interface FlightPricePoint {
  id: string;
  airline: string; // Airline name
  airlineCode: string; // IATA airline code
  bookingUrl?: string; // Direct link to airline booking page
  route: FlightRoute;
  price: number; // Price in euros
  currency: string; // Currency code (default: EUR)
  priceType: 'economy' | 'premium_economy' | 'business' | 'first';
  fareConditions: {
    refundable: boolean;
    changeable: boolean;
    baggageIncluded: boolean;
    seatSelection: boolean;
  };
  timing: PriceTimingMetadata;
  source: FlightSourceReference;
  volume: number; // Number of observations
  confidence: 'high' | 'medium' | 'low';
  verified: boolean;
  additionalFees?: {
    baggage?: number;
    seat?: number;
    booking?: number;
    total: number;
  };
  stops: number; // Number of stops (0 = direct)
  duration?: string; // Flight duration (e.g., "8h30")
}

/**
 * Flight price ranking
 */
export interface FlightPriceRanking {
  rank: number;
  flightPrice: FlightPricePoint;
  absoluteDifferenceFromCheapest: number;
  percentageDifferenceFromCheapest: number;
  absoluteDifferenceFromAverage: number;
  percentageDifferenceFromAverage: number;
  priceCategory: 'cheapest' | 'below_average' | 'average' | 'above_average' | 'most_expensive';
}

/**
 * Route aggregation statistics
 */
export interface FlightRouteAggregation {
  route: FlightRoute;
  airlineCount: number;
  averagePrice: number;
  minPrice: number;
  maxPrice: number;
  priceRange: number;
  priceRangePercentage: number;
  medianPrice: number;
  standardDeviation: number;
  observationPeriod: {
    from: string; // ISO 8601
    to: string; // ISO 8601
  };
  totalObservations: number;
  lastUpdate: string; // ISO 8601
  seasonalVariation?: {
    highSeasonAverage: number;
    lowSeasonAverage: number;
    seasonalDifference: number;
    seasonalDifferencePercentage: number;
  };
}

/**
 * Purchase timing analysis
 */
export interface PurchaseTimingAnalysis {
  route: FlightRoute;
  timingBuckets: {
    label: string; // e.g., "0-7 jours", "8-14 jours", etc.
    daysBeforeDeparture: { min: number; max: number };
    averagePrice: number;
    minPrice: number;
    maxPrice: number;
    observationCount: number;
  }[];
  optimalPurchaseWindow?: {
    daysBeforeDeparture: { min: number; max: number };
    averagePrice: number;
    savingsVsAverage: number;
    savingsPercentage: number;
  };
}

/**
 * Seasonal price analysis
 */
export interface SeasonalPriceAnalysis {
  route: FlightRoute;
  seasons: {
    type: SeasonType;
    months: number[]; // Month numbers (1-12)
    averagePrice: number;
    minPrice: number;
    maxPrice: number;
    observationCount: number;
  }[];
  highestSeasonMultiplier: number; // How much higher is high season vs low
}

/**
 * Flight comparison result
 */
export interface FlightComparisonResult {
  route: FlightRoute;
  airlines: FlightPriceRanking[];
  aggregation: FlightRouteAggregation;
  purchaseTimingAnalysis?: PurchaseTimingAnalysis;
  seasonalAnalysis?: SeasonalPriceAnalysis;
  comparisonDate: string; // ISO 8601
  metadata: FlightComparisonMetadata;
}

/**
 * Metadata for transparency
 */
export interface FlightComparisonMetadata {
  methodology: string; // Methodology version
  aggregationMethod: 'mean' | 'median' | 'weighted';
  dataQuality: {
    totalAirlines: number;
    airlinesWithData: number;
    coveragePercentage: number;
    oldestObservation: string;
    newestObservation: string;
  };
  sources: FlightSourceSummary[];
  warnings?: string[];
  limitations: string[];
  disclaimer: string; // "Observer, pas vendre" message
}

/**
 * Source summary for transparency
 */
export interface FlightSourceSummary {
  source: DataSource;
  observationCount: number;
  airlineCount: number;
  percentage: number;
}

/**
 * Filter options for flight queries
 */
export interface FlightComparisonFilter {
  routeType?: 'dom_metropole' | 'inter_dom' | 'regional' | 'international';
  originTerritory?: Territory;
  destinationTerritory?: Territory;
  airline?: string;
  priceType?: 'economy' | 'premium_economy' | 'business' | 'first';
  maxPriceAge?: number; // Max age in days
  minConfidence?: 'low' | 'medium' | 'high';
  verifiedOnly?: boolean;
  directOnly?: boolean; // Only direct flights
  season?: SeasonType;
  daysBeforeDeparture?: { min?: number; max?: number };
}

/**
 * Territory-specific flight statistics
 */
export interface TerritoryFlightStatistics {
  territory: Territory;
  routeCount: number;
  airlineCount: number;
  averagePrice: number;
  cheapestRoute: {
    route: FlightRoute;
    price: number;
  };
  mostExpensiveRoute: {
    route: FlightRoute;
    price: number;
  };
  connectivityIndex: number; // Measure of route availability
  isolationScore: number; // Higher = more isolated
  priceComparison: {
    vsMetropoleAverage: number;
    vsMetropolePercentage: number;
    vsDomAverage?: number;
    vsDomPercentage?: number;
  };
}
