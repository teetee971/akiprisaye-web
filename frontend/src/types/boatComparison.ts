/**
 * Boat/Ferry Comparison Types v1.0.0
 *
 * Principles:
 * - Observer, not sell: Transparent price observation without affiliate links
 * - Read-only comparison (no data modification)
 * - Route-based boat/ferry matching (inter-island, vehicle transport)
 * - Multi-operator aggregation by route
 * - Transparent data sources
 * - Essential for DOM territories (indispensable)
 * - Few neutral comparators available
 */

import type { Territory, DataSource } from './priceAlerts';

/**
 * Port information
 */
export interface Port {
  code: string; // Port code
  name: string; // Full name
  city: string; // City name
  territory: Territory; // Territory
  island?: string; // Island name if applicable
}

/**
 * Boat route identifier
 */
export interface BoatRoute {
  origin: Port;
  destination: Port;
  routeType: 'inter_island' | 'inter_territory' | 'coastal';
  islandGroup?: string; // e.g., 'Antilles', 'Océan Indien'
}

/**
 * Passenger type for pricing
 */
export type PassengerType = 'adult' | 'child' | 'infant';

/**
 * Vehicle type for transport pricing
 */
export type VehicleType = 'car' | 'motorcycle' | 'van' | 'truck' | 'none';

/**
 * Service class for boats
 */
export type ServiceClass = 'standard' | 'comfort' | 'premium';

/**
 * Source reference for transparency
 */
export interface BoatSourceReference {
  type: DataSource;
  url?: string;
  observedAt: string; // ISO 8601
  observedBy?: string;
  verificationMethod: 'automated' | 'manual' | 'official';
  reliability: 'high' | 'medium' | 'low';
}

/**
 * Boat price data point
 */
export interface BoatPricePoint {
  id: string;
  operator: string; // Operator name
  operatorCode: string; // Operator code
  route: BoatRoute;
  pricing: {
    passengerPrice: number; // Base passenger price (adult)
    childPrice?: number; // Child price if different
    vehiclePrice?: {
      // Vehicle transport pricing
      car: number;
      motorcycle?: number;
      van?: number;
      truck?: number;
    };
  };
  currency: string; // Currency code (default: EUR)
  serviceClass: ServiceClass;
  fareConditions: {
    refundable: boolean;
    changeable: boolean;
    mealsIncluded: boolean;
    deckAccess: boolean;
    cabinAvailable: boolean;
  };
  observationDate: string; // ISO 8601
  source: BoatSourceReference;
  volume: number; // Number of observations
  confidence: 'high' | 'medium' | 'low';
  verified: boolean;
  schedule: {
    frequency: string; // e.g., "daily", "3x/week", "weekly"
    departureTimes?: string[]; // Departure times if available
    duration: string; // Journey duration (e.g., "2h30", "45min")
  };
  capacity?: {
    passengers: number;
    vehicles: number;
  };
}

/**
 * Boat price ranking
 */
export interface BoatPriceRanking {
  rank: number;
  boatPrice: BoatPricePoint;
  absoluteDifferenceFromCheapest: number;
  percentageDifferenceFromCheapest: number;
  absoluteDifferenceFromAverage: number;
  percentageDifferenceFromAverage: number;
  priceCategory: 'cheapest' | 'below_average' | 'average' | 'above_average' | 'most_expensive';
}

/**
 * Route aggregation statistics
 */
export interface BoatRouteAggregation {
  route: BoatRoute;
  operatorCount: number;
  passengerPricing: {
    averagePrice: number;
    minPrice: number;
    maxPrice: number;
    priceRange: number;
    priceRangePercentage: number;
    medianPrice: number;
  };
  vehiclePricing?: {
    carAverage: number;
    carMin: number;
    carMax: number;
  };
  observationPeriod: {
    from: string; // ISO 8601
    to: string; // ISO 8601
  };
  totalObservations: number;
  lastUpdate: string; // ISO 8601
  frequencyAnalysis: {
    dailyServices: number;
    weeklyServices: number;
    averageDailyFrequency: number;
  };
}

/**
 * Vehicle transport analysis
 */
export interface VehicleTransportAnalysis {
  route: BoatRoute;
  operators: {
    operator: string;
    vehicleTypes: VehicleType[];
    pricing: {
      vehicleType: VehicleType;
      price: number;
    }[];
    availability: 'high' | 'medium' | 'low';
  }[];
  recommendations: string[];
}

/**
 * Regular passengers analysis (commuters)
 */
export interface RegularPassengerAnalysis {
  route: BoatRoute;
  operators: {
    operator: string;
    hasSubscription: boolean;
    subscriptionTypes?: {
      name: string;
      monthlyPrice: number;
      trips: number;
      savingsVsSingle: number;
      savingsPercentage: number;
    }[];
  }[];
}

/**
 * Boat comparison result
 */
export interface BoatComparisonResult {
  route: BoatRoute;
  operators: BoatPriceRanking[];
  aggregation: BoatRouteAggregation;
  vehicleTransportAnalysis?: VehicleTransportAnalysis;
  regularPassengerAnalysis?: RegularPassengerAnalysis;
  comparisonDate: string; // ISO 8601
  metadata: BoatComparisonMetadata;
}

/**
 * Metadata for transparency
 */
export interface BoatComparisonMetadata {
  methodology: string; // Methodology version
  aggregationMethod: 'mean' | 'median' | 'weighted';
  dataQuality: {
    totalOperators: number;
    operatorsWithData: number;
    coveragePercentage: number;
    oldestObservation: string;
    newestObservation: string;
  };
  sources: BoatSourceSummary[];
  warnings?: string[];
  limitations: string[];
  disclaimer: string; // "Observer, pas vendre" message
}

/**
 * Source summary for transparency
 */
export interface BoatSourceSummary {
  source: DataSource;
  observationCount: number;
  operatorCount: number;
  percentage: number;
}

/**
 * Filter options for boat queries
 */
export interface BoatComparisonFilter {
  routeType?: 'inter_island' | 'inter_territory' | 'coastal';
  originTerritory?: Territory;
  destinationTerritory?: Territory;
  operator?: string;
  serviceClass?: ServiceClass;
  maxPriceAge?: number; // Max age in days
  minConfidence?: 'low' | 'medium' | 'high';
  verifiedOnly?: boolean;
  vehicleTransport?: boolean; // Only operators with vehicle transport
  dailyService?: boolean; // Only daily services
}

/**
 * Territory-specific boat statistics
 */
export interface TerritoryBoatStatistics {
  territory: Territory;
  routeCount: number;
  operatorCount: number;
  averagePassengerPrice: number;
  averageVehiclePrice?: number;
  connectivityIndex: number; // Measure of route availability
  isolationScore: number; // Higher = more isolated
  islandConnectivity: {
    island: string;
    routeCount: number;
    averageFrequency: number;
  }[];
}

/**
 * Inter-island connectivity analysis
 */
export interface InterIslandConnectivity {
  islandGroup: string; // e.g., 'Antilles', 'Océan Indien'
  islands: {
    name: string;
    territory: Territory;
    connectedIslands: number;
    totalRoutes: number;
    averagePrice: number;
    averageFrequency: number;
  }[];
  totalRoutes: number;
  averagePrice: number;
  connectivityScore: number; // Higher = better connected
}
