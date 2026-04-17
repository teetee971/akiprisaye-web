/**
 * International Comparison Types - v4.1.0
 *
 * Types for international cost of living comparisons
 * Supports DOM vs Metropolitan France, France vs EU, EU vs International
 *
 * @module internationalComparisonTypes
 */

import type { TerritoryCode } from './extensions';

/**
 * ISO 3166-1 alpha-3 country codes
 */
export type CountryCode = string; // e.g., 'FRA', 'DEU', 'ESP', 'USA', 'JPN'

/**
 * Currency code (ISO 4217)
 */
export type CurrencyCode = 'EUR' | 'USD' | 'GBP' | 'JPY' | 'CHF' | 'CAD' | 'AUD' | string;

/**
 * Country cost profile
 */
export interface CountryCostProfile {
  country: CountryCode;
  countryName: string;
  currency: CurrencyCode;
  data: {
    // Cost indices (base 100 = reference)
    overallCostIndex: number;
    foodCostIndex: number;
    housingCostIndex: number;
    transportCostIndex: number;
    healthcareCostIndex: number;
    educationCostIndex: number;

    // Additional metrics
    averageMonthlyIncome?: number; // In local currency
    averageRent?: number; // In local currency
    basicGroceriesCost?: number; // In local currency
  };

  // Metadata
  lastUpdate: string; // ISO 8601
  dataQuality: 'high' | 'medium' | 'low';
  sourcesCount: number;
  methodology: string; // URL to methodology
}

/**
 * Purchasing Power Parity adjustment
 */
export interface PPPAdjustment {
  fromCurrency: CurrencyCode;
  toCurrency: CurrencyCode;
  pppRate: number; // Conversion rate adjusted for purchasing power
  exchangeRate: number; // Standard exchange rate
  adjustmentFactor: number; // pppRate / exchangeRate
  referenceYear: number;
  source: 'OECD' | 'WorldBank' | 'IMF' | 'Eurostat' | 'calculated';
}

/**
 * International comparison result
 */
export interface InternationalComparisonResult {
  comparisonId: string;
  comparisonType: 'dom-vs-metropole' | 'france-vs-eu' | 'eu-vs-international' | 'custom';
  referenceCountry: CountryCode;
  referenceCountryName: string;
  comparedCountries: ComparedCountryResult[];
  indicator: string; // e.g., 'overall-cost', 'food-cost', 'housing-cost'
  date: string; // ISO 8601
  methodology: string; // URL to methodology
  disclaimers: string[]; // Important notes about the comparison
}

/**
 * Single country comparison result
 */
export interface ComparedCountryResult {
  country: CountryCode;
  countryName: string;

  // Raw values
  rawValue: number;
  rawCurrency: CurrencyCode;

  // Normalized to EUR
  normalizedValue: number;
  normalizedCurrency: 'EUR';

  // Adjusted for PPP
  pppAdjustedValue: number;
  pppAdjustment: PPPAdjustment;

  // Comparison to reference
  differenceFromReference: number; // Absolute difference
  percentageDifference: number; // Percentage difference

  // Ranking
  ranking?: number;

  // Context
  confidence: 'high' | 'medium' | 'low';
  notes?: string[];
}

/**
 * DOM vs Metropolitan France comparison
 */
export interface DOMMetropoleComparison {
  dom: TerritoryCode;
  domName: string;
  metropole: 'FRA';
  metropoleName: 'France Métropolitaine';

  comparison: {
    // Food basket
    foodBasket: {
      dom: number;
      metropole: number;
      difference: number;
      percentageDifference: number;
    };

    // Housing
    housing: {
      dom: number;
      metropole: number;
      difference: number;
      percentageDifference: number;
    };

    // Transport
    transport: {
      dom: number;
      metropole: number;
      difference: number;
      percentageDifference: number;
    };

    // Energy
    energy: {
      dom: number;
      metropole: number;
      difference: number;
      percentageDifference: number;
    };

    // Overall IEVR
    overall: {
      dom: number;
      metropole: number;
      difference: number;
      percentageDifference: number;
    };
  };

  // Context
  octroisDeMerEffect?: number; // Impact of octroi de mer on prices
  shippingCostsEffect?: number; // Impact of shipping on prices
  localProductionRate?: number; // Percentage of locally produced goods

  date: string; // ISO 8601
  methodology: string;
}

/**
 * France vs EU comparison
 */
export interface FranceEUComparison {
  france: CountryCode;
  euCountries: CountryCode[];

  indicator: string;

  results: {
    france: ComparedCountryResult;
    euAverage: ComparedCountryResult;
    euMedian: ComparedCountryResult;
    euCountries: ComparedCountryResult[];
  };

  // Rankings
  franceRankInEU: number; // 1 = cheapest, 27 = most expensive
  totalEUCountries: number;

  date: string; // ISO 8601
  methodology: string;
}

/**
 * EU vs International comparison
 */
export interface EUInternationalComparison {
  eu: 'EU' | 'EU27';
  internationalCountries: CountryCode[];

  indicator: string;

  results: {
    euAverage: ComparedCountryResult;
    internationalCountries: ComparedCountryResult[];
  };

  date: string; // ISO 8601
  methodology: string;
}

/**
 * Monetary normalization result
 */
export interface MonetaryNormalization {
  originalValue: number;
  originalCurrency: CurrencyCode;
  normalizedValue: number;
  normalizedCurrency: 'EUR';
  exchangeRate: number;
  date: string; // ISO 8601
  source: 'ECB' | 'cached' | 'fixed';
}

/**
 * Comparison filter options
 */
export interface ComparisonFilters {
  countries?: CountryCode[];
  indicators?: string[];
  startDate?: string; // ISO 8601
  endDate?: string; // ISO 8601
  minQuality?: 'low' | 'medium' | 'high';
}

/**
 * Comparison history entry
 */
export interface ComparisonHistoryEntry {
  date: string; // ISO 8601
  indicator: string;
  referenceCountry: CountryCode;
  comparedCountry: CountryCode;
  value: number;
  percentageDifference: number;
}

/**
 * Time series comparison
 */
export interface TimeSeriesComparison {
  indicator: string;
  referenceCountry: CountryCode;
  comparedCountry: CountryCode;
  history: ComparisonHistoryEntry[];
  trend: 'converging' | 'diverging' | 'stable';
  trendStrength: number; // 0-1, where 1 is strong trend
}

/**
 * Comparison validation result
 */
export interface ComparisonValidation {
  isValid: boolean;
  warnings: string[];
  errors: string[];
  dataQualityScore: number; // 0-100
}

/**
 * Region grouping for comparisons
 */
export type RegionCode =
  | 'DOM' // Départements d'Outre-Mer
  | 'ROM' // Régions d'Outre-Mer
  | 'EU' // European Union
  | 'EU27' // EU 27 countries
  | 'NAFTA' // North America
  | 'ASIA' // Asia
  | 'OCEANIA' // Oceania
  | 'AFRICA' // Africa
  | 'SOUTH_AMERICA'; // South America

/**
 * Regional comparison
 */
export interface RegionalComparison {
  region: RegionCode;
  regionName: string;
  countries: CountryCode[];
  indicator: string;

  regionalAverage: number;
  regionalMedian: number;
  regionalMin: number;
  regionalMax: number;

  countryResults: ComparedCountryResult[];

  date: string; // ISO 8601
  methodology: string;
}
