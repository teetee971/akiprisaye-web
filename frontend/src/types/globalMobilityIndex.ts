/**
 * Type definitions for Global Mobility Cost Index v3.0.0
 *
 * Principles:
 * - Descriptive index ONLY (not prescriptive)
 * - Aggregates v2.2 (transport) + v2.3 (land mobility)
 * - Explicit, transparent methodology
 * - NO recommendations or normative scoring
 * - NO individual rating
 * - Territory-based analysis
 * - Temporal comparisons
 */

import type { Territory, DataSource } from './priceAlerts';
import type { SourceReference, TransportMode } from './transportComparison';
import type { LandMobilityCategory } from './landMobilityComparison';

/**
 * Mobility cost component (transport or land)
 */
export interface MobilityCostComponent {
  type: 'TRANSPORT' | 'LAND_MOBILITY';
  mode?: TransportMode | LandMobilityCategory;
  averageCost: number;
  observationCount: number;
  weight: number; // Explicit weight in index (0-1)
  weightRationale: string; // Why this weight was chosen
  sources: SourceReference[];
}

/**
 * Territory mobility profile
 */
export interface TerritoryMobilityProfile {
  territory: Territory;
  classification: 'ISLAND' | 'CONTINENTAL' | 'ARCHIPELAGO';
  characteristics: {
    hasAirTransport: boolean;
    hasMaritimeTransport: boolean;
    hasPublicTransit: boolean;
    hasTaxiVTC: boolean;
    isIsolated: boolean; // Geographically isolated
  };
  components: MobilityCostComponent[];
  observationPeriod: {
    from: string; // ISO 8601
    to: string; // ISO 8601
  };
  lastUpdate: string; // ISO 8601
}

/**
 * Global Mobility Cost Index
 */
export interface GlobalMobilityIndex {
  territory: Territory;
  indexValue: number; // Composite index value
  indexScale: {
    min: number;
    max: number;
    unit: string; // Description of scale
  };
  profile: TerritoryMobilityProfile;
  breakdown: {
    transportCost: number; // Average transport cost
    transportWeight: number; // Weight in index
    landMobilityCost: number; // Average land mobility cost
    landMobilityWeight: number; // Weight in index
  };
  calculationDate: string; // ISO 8601
  metadata: GlobalMobilityIndexMetadata;
}

/**
 * Metadata for global mobility index transparency
 */
export interface GlobalMobilityIndexMetadata {
  version: string; // Index version (e.g., "v3.0.0")
  methodology: GlobalMobilityIndexMethodology;
  dataQuality: {
    transportDataPoints: number;
    landMobilityDataPoints: number;
    totalDataPoints: number;
    coveragePercentage: number;
    oldestObservation: string; // ISO 8601
    newestObservation: string; // ISO 8601
  };
  sources: MobilitySourceSummary[];
  warnings?: string[];
  limitations: string[];
}

/**
 * Explicit methodology for the index
 */
export interface GlobalMobilityIndexMethodology {
  name: string;
  version: string;
  description: string;
  weightingApproach: 'EQUAL' | 'USAGE_BASED' | 'TERRITORY_SPECIFIC';
  weightingRationale: string;
  components: {
    name: string;
    weight: number;
    rationale: string;
  }[];
  calculationFormula: string; // Mathematical formula used
  normalizationMethod?: string; // How values are normalized
  assumptions: string[]; // Explicit assumptions made
  references?: string[]; // Academic or official references
}

/**
 * Source summary for mobility index
 */
export interface MobilitySourceSummary {
  source: DataSource;
  componentType: 'TRANSPORT' | 'LAND_MOBILITY';
  observationCount: number;
  percentage: number;
}

/**
 * Temporal comparison of mobility index
 */
export interface MobilityIndexComparison {
  territory: Territory;
  periods: MobilityIndexPeriod[];
  variation: {
    absoluteChange: number;
    percentageChange: number;
    direction: 'increase' | 'decrease' | 'stable';
  };
  componentVariations: MobilityComponentVariation[];
}

/**
 * Mobility index for a specific period
 */
export interface MobilityIndexPeriod {
  period: string; // ISO 8601 date or period identifier
  indexValue: number;
  transportCost: number;
  landMobilityCost: number;
}

/**
 * Component-level variation
 */
export interface MobilityComponentVariation {
  component: string; // Component name
  absoluteChange: number;
  percentageChange: number;
  direction: 'increase' | 'decrease' | 'stable';
  significance: 'high' | 'medium' | 'low';
}

/**
 * Multi-territory mobility index comparison
 */
export interface MultiTerritoryMobilityComparison {
  territories: TerritoryMobilityIndexComparison[];
  baseTerritory?: Territory;
  comparisonDate: string; // ISO 8601
  methodology: GlobalMobilityIndexMethodology;
}

/**
 * Mobility index comparison for a single territory
 */
export interface TerritoryMobilityIndexComparison {
  territory: Territory;
  indexValue: number;
  classification: 'ISLAND' | 'CONTINENTAL' | 'ARCHIPELAGO';
  transportCost: number;
  landMobilityCost: number;
  differenceFromBase?: {
    absoluteIndex: number;
    percentageIndex: number;
    absoluteTransport: number;
    absoluteLandMobility: number;
  };
  dataQuality: {
    coveragePercentage: number;
    observationCount: number;
  };
}

/**
 * Filter options for mobility index queries
 */
export interface MobilityIndexFilter {
  territory?: Territory;
  classification?: 'ISLAND' | 'CONTINENTAL' | 'ARCHIPELAGO';
  minCoveragePercent?: number;
  maxPriceAge?: number; // Max age in days
  includePartialData?: boolean; // Include territories with incomplete data
}

/**
 * Mobility index configuration
 */
export interface MobilityIndexConfig {
  enabled: boolean;
  defaultWeightingApproach: 'EQUAL' | 'USAGE_BASED' | 'TERRITORY_SPECIFIC';
  minCoveragePercent: number;
  maxPriceAgeDays: number;
  cacheTimeout: number; // Cache timeout in seconds
}

/**
 * Mobility affordability indicator (descriptive only)
 */
export interface MobilityAffordabilityIndicator {
  territory: Territory;
  indicator: {
    name: string;
    value: number;
    unit: string;
    description: string;
  };
  components: {
    transportAffordability: number;
    landMobilityAffordability: number;
  };
  referenceValues?: {
    national?: number;
    regional?: number;
  };
  methodology: string;
  limitations: string[];
}

/**
 * Mobility index history
 */
export interface MobilityIndexHistory {
  territory: Territory;
  history: MobilityIndexHistoryPoint[];
  trend: {
    direction: 'increasing' | 'decreasing' | 'stable' | 'volatile';
    averageChange: number; // Average change per period
    volatility: number; // Standard deviation
  };
}

/**
 * Mobility index history point
 */
export interface MobilityIndexHistoryPoint {
  date: string; // ISO 8601
  indexValue: number;
  transportCost: number;
  landMobilityCost: number;
  observationCount: number;
  dataQuality: number; // Coverage percentage
}
