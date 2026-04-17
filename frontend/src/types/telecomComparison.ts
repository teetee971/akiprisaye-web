/**
 * Mobile & Internet Comparison Types v1.0.0
 *
 * Principles:
 * - Observer, not sell: Transparent comparison without affiliate links
 * - Read-only comparison (no data modification)
 * - Real price paid vs advertised price
 * - Actual speed vs advertised speed
 * - Real coverage by territory
 * - Commitment terms transparency
 * - Essential monthly expense tracking
 */

import type { Territory, DataSource } from './priceAlerts';

/**
 * Service type
 */
export type TelecomServiceType = 'internet' | 'mobile' | 'bundle';

/**
 * Source reference for transparency
 */
export interface TelecomSourceReference {
  type: DataSource;
  url?: string;
  observedAt: string; // ISO 8601
  observedBy?: string;
  verificationMethod: 'automated' | 'manual' | 'official' | 'speed_test';
  reliability: 'high' | 'medium' | 'low';
}

/**
 * Speed measurement (for internet)
 */
export interface SpeedMeasurement {
  advertised: {
    download: number; // Mbps
    upload: number; // Mbps
  };
  actual: {
    download: number; // Mbps measured
    upload: number; // Mbps measured
    latency?: number; // ms
    jitter?: number; // ms
  };
  achievementRate: {
    download: number; // Percentage of advertised speed achieved
    upload: number; // Percentage of advertised speed achieved
  };
  measurementDate: string; // ISO 8601
  measurementLocation: string; // City/area where measured
}

/**
 * Coverage information
 */
export interface CoverageInfo {
  territory: Territory;
  coverageType: '4G' | '5G' | 'fiber' | 'adsl' | 'satellite';
  populationCoverage: number; // Percentage of population covered
  geographicCoverage: number; // Percentage of territory covered
  qualityScore: number; // 0-100 based on user reports
  lastUpdate: string; // ISO 8601
}

/**
 * Price comparison (advertised vs actual)
 */
export interface PriceComparison {
  advertised: {
    monthly: number; // Price shown in ads
    installation?: number; // Installation fee
    router?: number; // Router/modem cost
  };
  actual: {
    monthly: number; // Real price paid (including hidden fees)
    installation?: number; // Actual installation cost
    router?: number; // Actual router cost
    otherFees?: {
      // Other fees not advertised
      name: string;
      amount: number;
    }[];
    totalFirstYear: number; // Total cost for first year
    totalFirstMonth: number; // Total first month (including setup)
  };
  hiddenCosts: {
    total: number;
    percentage: number; // % difference from advertised price
    breakdown: string[]; // List of hidden costs
  };
}

/**
 * Internet subscription data point
 */
export interface InternetSubscriptionPoint {
  id: string;
  provider: string;
  providerCode: string;
  territory: Territory;
  offerName: string;
  technology: 'fiber' | 'adsl' | 'vdsl' | '4g_box' | '5g_box' | 'satellite';
  speed: SpeedMeasurement;
  pricing: PriceComparison;
  commitment: {
    duration: number; // Months (0 = no commitment)
    earlyTerminationFee: number;
    promotionalPeriod?: {
      // If promotional pricing
      months: number;
      monthlyPrice: number;
      priceAfterPromo: number;
    };
  };
  features: {
    tvIncluded: boolean;
    phoneIncluded: boolean;
    mobileData?: number; // GB if included
    staticIP: boolean;
    publicIP: boolean;
  };
  coverage: CoverageInfo;
  source: TelecomSourceReference;
  observationDate: string; // ISO 8601
  volume: number; // Number of user reports
  confidence: 'high' | 'medium' | 'low';
  verified: boolean;
}

/**
 * Mobile subscription data point
 */
export interface MobileSubscriptionPoint {
  id: string;
  provider: string;
  providerCode: string;
  territory: Territory;
  offerName: string;
  network: '4G' | '5G' | '3G';
  data: {
    advertised: number; // GB per month advertised
    actual: number; // GB actually usable
    throttled: boolean; // Speed throttled after limit
    throttledSpeed?: number; // Mbps after throttling
  };
  pricing: PriceComparison;
  commitment: {
    duration: number; // Months (0 = no commitment)
    earlyTerminationFee: number;
    promotionalPeriod?: {
      months: number;
      monthlyPrice: number;
      priceAfterPromo: number;
    };
  };
  features: {
    unlimitedCalls: boolean;
    unlimitedSMS: boolean;
    internationalCalls?: string[]; // List of included countries
    roaming: {
      europe: boolean;
      dom: boolean;
      international: boolean;
    };
  };
  coverage: CoverageInfo;
  source: TelecomSourceReference;
  observationDate: string; // ISO 8601
  volume: number;
  confidence: 'high' | 'medium' | 'low';
  verified: boolean;
}

/**
 * Ranking for internet/mobile offers
 */
export interface TelecomOfferRanking {
  rank: number;
  offer: InternetSubscriptionPoint | MobileSubscriptionPoint;
  realMonthlyPrice: number; // Actual monthly price
  absoluteDifferenceFromCheapest: number;
  percentageDifferenceFromCheapest: number;
  absoluteDifferenceFromAverage: number;
  percentageDifferenceFromAverage: number;
  priceCategory: 'cheapest' | 'below_average' | 'average' | 'above_average' | 'most_expensive';
  valueScore: number; // 0-100 value for money score
}

/**
 * Aggregation statistics
 */
export interface TelecomAggregation {
  territory: Territory;
  serviceType: TelecomServiceType;
  providerCount: number;
  averageAdvertisedPrice: number;
  averageActualPrice: number;
  hiddenCostsAverage: number;
  hiddenCostsPercentage: number;
  priceRange: {
    min: number;
    max: number;
    spread: number;
    spreadPercentage: number;
  };
  speedAchievementAverage?: number; // For internet only
  coverageAverage: number;
  observationPeriod: {
    from: string;
    to: string;
  };
  totalObservations: number;
  lastUpdate: string;
}

/**
 * Comparison result
 */
export interface TelecomComparisonResult {
  territory: Territory;
  serviceType: TelecomServiceType;
  offers: TelecomOfferRanking[];
  aggregation: TelecomAggregation;
  priceTransparencyAnalysis: {
    averageHiddenCosts: number;
    averageHiddenCostsPercentage: number;
    providersWithHiddenCosts: number;
    commonHiddenCosts: {
      cost: string;
      frequency: number; // How many providers charge this
      averageAmount: number;
    }[];
  };
  speedAnalysis?: {
    // For internet only
    averageAchievementRate: number;
    providersWithGoodSpeed: number; // Speed achievement > 80%
    technologiesComparison: {
      technology: string;
      averageSpeedAchievement: number;
      providerCount: number;
    }[];
  };
  coverageAnalysis: {
    territoryCoverage: {
      technology: string;
      averageCoverage: number;
      providerCount: number;
    }[];
  };
  comparisonDate: string;
  metadata: TelecomComparisonMetadata;
}

/**
 * Metadata for transparency
 */
export interface TelecomComparisonMetadata {
  methodology: string;
  aggregationMethod: 'mean' | 'median' | 'weighted';
  dataQuality: {
    totalProviders: number;
    providersWithData: number;
    coveragePercentage: number;
    userReports: number;
    speedTests: number;
    oldestObservation: string;
    newestObservation: string;
  };
  sources: TelecomSourceSummary[];
  warnings?: string[];
  limitations: string[];
  disclaimer: string;
}

/**
 * Source summary
 */
export interface TelecomSourceSummary {
  source: DataSource;
  observationCount: number;
  providerCount: number;
  percentage: number;
}

/**
 * Filter options
 */
export interface TelecomComparisonFilter {
  serviceType?: TelecomServiceType;
  territory?: Territory;
  provider?: string;
  minSpeed?: number; // Mbps for internet
  minData?: number; // GB for mobile
  maxPrice?: number;
  noCommitmentOnly?: boolean;
  fiberOnly?: boolean; // For internet
  fiveGOnly?: boolean; // For mobile
  verifiedOnly?: boolean;
  goodCoverageOnly?: boolean; // Coverage > 80%
}

/**
 * Territory-specific statistics
 */
export interface TerritoryTelecomStatistics {
  territory: Territory;
  serviceType: TelecomServiceType;
  providerCount: number;
  averagePrice: number;
  cheapestOffer: {
    provider: string;
    price: number;
    features: string;
  };
  coverageQuality: {
    fiber: number; // % coverage
    fourG: number;
    fiveG: number;
  };
  priceComparison: {
    vsMetropoleAverage: number;
    vsMetropolePercentage: number;
    vsDomAverage?: number;
    vsDomPercentage?: number;
  };
  hiddenCostsIssue: {
    averageHiddenCosts: number;
    percentageWithHiddenCosts: number;
  };
}

/**
 * Speed test result
 */
export interface SpeedTestResult {
  id: string;
  provider: string;
  territory: Territory;
  technology: string;
  download: number; // Mbps
  upload: number; // Mbps
  latency: number; // ms
  jitter: number; // ms
  testDate: string; // ISO 8601
  location: string;
  testServer: string;
  source: TelecomSourceReference;
}
