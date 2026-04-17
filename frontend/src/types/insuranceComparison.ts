/**
 * Insurance Comparison Types v1.0.0
 *
 * Principles:
 * - Observer, not sell: Transparent price observation without affiliate links
 * - Read-only comparison (no data modification)
 * - No advice or recommendations
 * - Territory-based insurance matching
 * - Transparent data sources
 */

import type { Territory, DataSource } from './priceAlerts';
export type { Territory };

/**
 * Insurance types
 */
export type InsuranceType = 'auto' | 'home' | 'health';

/**
 * Coverage levels
 */
export type CoverageLevel = 'basic' | 'intermediate' | 'comprehensive';

/**
 * Source reference for insurance price data
 */
export interface InsuranceSourceReference {
  type: 'user_report' | 'official_website' | 'price_directory';
  url?: string;
  observedAt: string; // ISO 8601
  reliability: 'high' | 'medium' | 'low';
}

/**
 * Insurance price data point
 */
export interface InsurancePricePoint {
  id: string;
  providerName: string;
  offerName: string;
  insuranceType: InsuranceType;
  coverageLevel: CoverageLevel;
  annualPriceTTC: number;
  territory: Territory;
  mainCoverages: string[];
  deductible?: number;
  observationDate: string; // ISO 8601
  source: InsuranceSourceReference;
  additionalInfo?: {
    contractDuration?: string;
    waitingPeriod?: string;
    paymentOptions?: string[];
  };
}

/**
 * Insurance price ranking
 */
export interface InsuranceRanking {
  rank: number;
  insurance: InsurancePricePoint;
  absoluteDifferenceFromCheapest: number;
  percentageDifferenceFromCheapest: number;
  absoluteDifferenceFromAverage: number;
  percentageDifferenceFromAverage: number;
  priceCategory: 'cheapest' | 'below_average' | 'average' | 'above_average' | 'most_expensive';
}

/**
 * Insurance price aggregation statistics
 */
export interface InsuranceAggregation {
  minPrice: number;
  maxPrice: number;
  averagePrice: number;
  medianPrice: number;
  priceRange: number;
  priceRangePercentage: number;
  standardDeviation: number;
  totalOffers: number;
  coverageLevels: CoverageLevel[];
  lastUpdate: string; // ISO 8601
}

/**
 * Insurance comparison result
 */
export interface InsuranceComparisonResult {
  insuranceType: InsuranceType;
  territory: Territory;
  rankedOffers: InsuranceRanking[];
  aggregation: InsuranceAggregation;
  comparisonDate: string; // ISO 8601
  metadata: {
    totalOffers: number;
    providers: string[];
    coverageLevels: CoverageLevel[];
    dataSource: string;
    methodology: string;
    warnings?: string[];
    limitations: string[];
    disclaimer: string;
  };
}

/**
 * Historical insurance price data point
 */
export interface InsuranceHistoricalDataPoint {
  date: string; // ISO 8601
  averagePrice: number;
  minPrice: number;
  maxPrice: number;
  observationCount: number;
}

/**
 * Insurance price history
 */
export interface InsurancePriceHistory {
  insuranceType: InsuranceType;
  territory: Territory;
  coverageLevel?: CoverageLevel;
  timeSeries: InsuranceHistoricalDataPoint[];
  period: {
    startDate: string; // ISO 8601
    endDate: string; // ISO 8601
  };
}

/**
 * Filter options for insurance queries
 */
export interface InsuranceComparisonFilter {
  territory?: Territory;
  insuranceType?: InsuranceType;
  coverageLevel?: CoverageLevel;
  maxAnnualPrice?: number;
  minAnnualPrice?: number;
  provider?: string;
  specificCoverage?: string; // Filter by specific coverage item
}

/**
 * Territory insurance statistics
 */
export interface TerritoryInsuranceStatistics {
  territory: Territory;
  insuranceTypes: {
    insuranceType: InsuranceType;
    averagePrice: number;
    minPrice: number;
    maxPrice: number;
    offerCount: number;
    providers: string[];
  }[];
  totalOffers: number;
  comparisonDate: string; // ISO 8601
}

/**
 * Insurance provider information
 */
export interface InsuranceProvider {
  name: string;
  offers: InsurancePricePoint[];
  territories: Territory[];
  averagePrice: number;
  offerCount: number;
}
