 
/**
 * Global Mobility Cost Index Service v3.0.0
 * 
 * Implements global mobility cost index with:
 * - Descriptive index ONLY (not prescriptive)
 * - Aggregates v2.2 (transport) + v2.3 (land mobility)
 * - Explicit, transparent methodology
 * - NO recommendations or normative scoring
 * - NO individual rating
 * - Territory-based analysis
 * - Temporal comparisons
 * - Support for partial data (island territories)
 */

import type {
  GlobalMobilityIndex,
  TerritoryMobilityProfile,
  MobilityCostComponent,
  GlobalMobilityIndexMetadata,
  GlobalMobilityIndexMethodology,
  MobilitySourceSummary,
  MobilityIndexFilter,
  MobilityIndexComparison,
  MobilityIndexPeriod,
  MobilityComponentVariation,
  MultiTerritoryMobilityComparison,
  TerritoryMobilityIndexComparison,
} from '../types/globalMobilityIndex';
import type { Territory } from '../types/priceAlerts';

/**
 * Configuration constants
 */
const MOBILITY_INDEX_CONFIG = {
  MIN_COVERAGE_PERCENT: 30,        // Lower threshold for island territories
  STABLE_VARIATION_THRESHOLD: 5,   // ±5% considered stable
  DEFAULT_TRANSPORT_WEIGHT: 0.6,   // 60% weight for transport
  DEFAULT_LAND_MOBILITY_WEIGHT: 0.4, // 40% weight for land mobility
} as const;

/**
 * Calculate global mobility index for a territory
 */
export function calculateGlobalMobilityIndex(
  territory: Territory,
  transportComponents: MobilityCostComponent[],
  landMobilityComponents: MobilityCostComponent[]
): GlobalMobilityIndex | null {
  if (transportComponents.length === 0 && landMobilityComponents.length === 0) {
    return null;
  }

  // Build territory profile
  const profile = buildTerritoryProfile(territory, transportComponents, landMobilityComponents);

  // Calculate weighted costs
  const transportCost = calculateWeightedAverage(transportComponents);
  const landMobilityCost = calculateWeightedAverage(landMobilityComponents);

  // Determine weights (explicit methodology)
  const transportWeight = MOBILITY_INDEX_CONFIG.DEFAULT_TRANSPORT_WEIGHT;
  const landMobilityWeight = MOBILITY_INDEX_CONFIG.DEFAULT_LAND_MOBILITY_WEIGHT;

  // Calculate index value
  const indexValue = (transportCost * transportWeight) + (landMobilityCost * landMobilityWeight);

  // Generate metadata
  const metadata = generateMobilityIndexMetadata(
    transportComponents,
    landMobilityComponents,
    transportWeight,
    landMobilityWeight
  );

  return {
    territory,
    indexValue: Math.round(indexValue * 100) / 100,
    indexScale: {
      min: 0,
      max: 1000,
      unit: 'Composite mobility cost index (0-1000, descriptive only)',
    },
    profile,
    breakdown: {
      transportCost: Math.round(transportCost * 100) / 100,
      transportWeight,
      landMobilityCost: Math.round(landMobilityCost * 100) / 100,
      landMobilityWeight,
    },
    calculationDate: new Date().toISOString(),
    metadata,
  };
}

/**
 * Build territory mobility profile
 */
function buildTerritoryProfile(
  territory: Territory,
  transportComponents: MobilityCostComponent[],
  landMobilityComponents: MobilityCostComponent[]
): TerritoryMobilityProfile {
  // Determine territory classification
  const islandTerritories: Territory[] = ['MQ', 'GP', 'GF', 'RE', 'YT', 'PF', 'NC', 'WF', 'PM', 'BL', 'MF', 'TF'];
  const continentalTerritories: string[] = ['FR'];
  
  let classification: 'ISLAND' | 'CONTINENTAL' | 'ARCHIPELAGO';
  if (islandTerritories.includes(territory)) {
    classification = territory === 'PF' || territory === 'NC' ? 'ARCHIPELAGO' : 'ISLAND';
  } else {
    classification = 'CONTINENTAL';
  }

  // Analyze available components
  const hasAirTransport = transportComponents.some(c => c.mode === 'plane');
  const hasMaritimeTransport = transportComponents.some(c => c.mode === 'boat' || c.mode === 'inter_island');
  const hasPublicTransit = landMobilityComponents.some(c => c.mode === 'BUS');
  const hasTaxiVTC = landMobilityComponents.some(c => c.mode === 'TAXI');
  const isIsolated = classification !== 'CONTINENTAL' && !hasMaritimeTransport;

  // Get date range
  const allComponents = [...transportComponents, ...landMobilityComponents];
  const allDates = allComponents.flatMap(c => 
    c.sources.map(s => new Date(s.observedAt).getTime())
  );
  
  const oldestDate = allDates.length > 0 ? new Date(Math.min(...allDates)).toISOString() : new Date().toISOString();
  const newestDate = allDates.length > 0 ? new Date(Math.max(...allDates)).toISOString() : new Date().toISOString();

  return {
    territory,
    classification,
    characteristics: {
      hasAirTransport,
      hasMaritimeTransport,
      hasPublicTransit,
      hasTaxiVTC,
      isIsolated,
    },
    components: [...transportComponents, ...landMobilityComponents],
    observationPeriod: {
      from: oldestDate,
      to: newestDate,
    },
    lastUpdate: new Date().toISOString(),
  };
}

/**
 * Calculate weighted average of components
 */
function calculateWeightedAverage(components: MobilityCostComponent[]): number {
  if (components.length === 0) {
    return 0;
  }

  const totalWeight = components.reduce((sum, c) => sum + c.weight, 0);
  if (totalWeight === 0) {
    return 0;
  }

  const weightedSum = components.reduce((sum, c) => sum + (c.averageCost * c.weight), 0);
  return weightedSum / totalWeight;
}

/**
 * Generate metadata with explicit methodology
 */
function generateMobilityIndexMetadata(
  transportComponents: MobilityCostComponent[],
  landMobilityComponents: MobilityCostComponent[],
  transportWeight: number,
  landMobilityWeight: number
): GlobalMobilityIndexMetadata {
  const allComponents = [...transportComponents, ...landMobilityComponents];
  
  // Calculate data quality
  const transportDataPoints = transportComponents.reduce((sum, c) => sum + c.observationCount, 0);
  const landMobilityDataPoints = landMobilityComponents.reduce((sum, c) => sum + c.observationCount, 0);
  const totalDataPoints = transportDataPoints + landMobilityDataPoints;

  // Expected data points (simplified - would be more sophisticated in production)
  const expectedDataPoints = 100;
  const coveragePercentage = Math.min(100, (totalDataPoints / expectedDataPoints) * 100);

  // Get date range
  const allDates = allComponents.flatMap(c => 
    c.sources.map(s => new Date(s.observedAt).getTime())
  );
  const oldestDate = allDates.length > 0 ? new Date(Math.min(...allDates)).toISOString() : new Date().toISOString();
  const newestDate = allDates.length > 0 ? new Date(Math.max(...allDates)).toISOString() : new Date().toISOString();

  // Source summary
  const sourceCounts = new Map<string, { count: number; type: 'TRANSPORT' | 'LAND_MOBILITY' }>();
  allComponents.forEach(component => {
    component.sources.forEach(source => {
      const sourceType = source.type;
      if (!sourceCounts.has(sourceType)) {
        sourceCounts.set(sourceType, { 
          count: 0, 
          type: component.type 
        });
      }
      sourceCounts.get(sourceType)!.count++;
    });
  });

  const sources: MobilitySourceSummary[] = Array.from(sourceCounts.entries()).map(
    ([source, data]) => ({
      source: source as any,
      componentType: data.type,
      observationCount: data.count,
      percentage: Math.round((data.count / allComponents.length) * 100 * 100) / 100,
    })
  );

  // Warnings
  const warnings: string[] = [];
  if (coveragePercentage < MOBILITY_INDEX_CONFIG.MIN_COVERAGE_PERCENT) {
    warnings.push(`Low data coverage: ${Math.round(coveragePercentage)}%`);
  }
  if (transportComponents.length === 0) {
    warnings.push('No transport data available');
  }
  if (landMobilityComponents.length === 0) {
    warnings.push('No land mobility data available');
  }

  // Build methodology
  const methodology: GlobalMobilityIndexMethodology = {
    name: 'Global Mobility Cost Index',
    version: 'v3.0.0',
    description: 'Descriptive index aggregating transport and land mobility costs',
    weightingApproach: 'USAGE_BASED',
    weightingRationale: 'Weights reflect typical usage patterns across territories',
    components: [
      {
        name: 'Transport (plane, boat, inter-island)',
        weight: transportWeight,
        rationale: 'Primary mobility for island territories and long-distance travel',
      },
      {
        name: 'Land Mobility (bus, taxi, fuel)',
        weight: landMobilityWeight,
        rationale: 'Daily mobility for local and intra-territory movement',
      },
    ],
    calculationFormula: 'Index = (TransportCost × TransportWeight) + (LandMobilityCost × LandMobilityWeight)',
    normalizationMethod: 'Weighted average of component costs',
    assumptions: [
      'Weights reflect average usage patterns, not individual circumstances',
      'Costs represent observed market prices, not affordability',
      'Index is descriptive, not prescriptive or normative',
      'Partial data accepted for island territories',
    ],
    references: [
      'Based on v2.2 Transport Price Service',
      'Based on v2.3 Land Mobility Price Service',
    ],
  };

  return {
    version: 'v3.0.0',
    methodology,
    dataQuality: {
      transportDataPoints,
      landMobilityDataPoints,
      totalDataPoints,
      coveragePercentage: Math.round(coveragePercentage * 100) / 100,
      oldestObservation: oldestDate,
      newestObservation: newestDate,
    },
    sources,
    warnings: warnings.length > 0 ? warnings : undefined,
    limitations: [
      'Index is DESCRIPTIVE ONLY - not a recommendation or rating',
      'Does not reflect individual mobility needs or patterns',
      'Does not account for income levels or affordability',
      'Partial data may affect comparability across territories',
      'Methodology subject to refinement based on data availability',
      'No individual scoring or normative judgment is implied',
    ],
  };
}

/**
 * Compare mobility index across periods
 */
export function compareMobilityIndexPeriods(
  territory: Territory,
  periods: MobilityIndexPeriod[]
): MobilityIndexComparison | null {
  if (periods.length < 2) {
    return null;
  }

  const first = periods[0];
  const last = periods[periods.length - 1];

  const absoluteChange = last.indexValue - first.indexValue;
  const percentageChange = first.indexValue > 0
    ? (absoluteChange / first.indexValue) * 100
    : 0;

  let direction: 'increase' | 'decrease' | 'stable';
  if (Math.abs(percentageChange) < MOBILITY_INDEX_CONFIG.STABLE_VARIATION_THRESHOLD) {
    direction = 'stable';
  } else {
    direction = percentageChange > 0 ? 'increase' : 'decrease';
  }

  // Calculate component variations
  const transportChange = last.transportCost - first.transportCost;
  const landMobilityChange = last.landMobilityCost - first.landMobilityCost;

  const componentVariations: MobilityComponentVariation[] = [
    {
      component: 'Transport',
      absoluteChange: Math.round(transportChange * 100) / 100,
      percentageChange: first.transportCost > 0 
        ? Math.round((transportChange / first.transportCost) * 100 * 100) / 100
        : 0,
      direction: Math.abs(transportChange) < 5 ? 'stable' : transportChange > 0 ? 'increase' : 'decrease',
      significance: Math.abs(transportChange) > 50 ? 'high' : Math.abs(transportChange) > 20 ? 'medium' : 'low',
    },
    {
      component: 'Land Mobility',
      absoluteChange: Math.round(landMobilityChange * 100) / 100,
      percentageChange: first.landMobilityCost > 0
        ? Math.round((landMobilityChange / first.landMobilityCost) * 100 * 100) / 100
        : 0,
      direction: Math.abs(landMobilityChange) < 1 ? 'stable' : landMobilityChange > 0 ? 'increase' : 'decrease',
      significance: Math.abs(landMobilityChange) > 10 ? 'high' : Math.abs(landMobilityChange) > 5 ? 'medium' : 'low',
    },
  ];

  return {
    territory,
    periods,
    variation: {
      absoluteChange: Math.round(absoluteChange * 100) / 100,
      percentageChange: Math.round(percentageChange * 100) / 100,
      direction,
    },
    componentVariations,
  };
}

/**
 * Compare mobility index across territories
 */
export function compareTerritoriesMobilityIndex(
  territories: GlobalMobilityIndex[],
  baseTerritory?: Territory
): MultiTerritoryMobilityComparison {
  const baseIndex = baseTerritory 
    ? territories.find(t => t.territory === baseTerritory)
    : undefined;

  const comparisons: TerritoryMobilityIndexComparison[] = territories.map(t => {
    const comparison: TerritoryMobilityIndexComparison = {
      territory: t.territory,
      indexValue: t.indexValue,
      classification: t.profile.classification,
      transportCost: t.breakdown.transportCost,
      landMobilityCost: t.breakdown.landMobilityCost,
      dataQuality: {
        coveragePercentage: t.metadata.dataQuality.coveragePercentage,
        observationCount: t.metadata.dataQuality.totalDataPoints,
      },
    };

    if (baseIndex && t.territory !== baseTerritory) {
      comparison.differenceFromBase = {
        absoluteIndex: Math.round((t.indexValue - baseIndex.indexValue) * 100) / 100,
        percentageIndex: baseIndex.indexValue > 0
          ? Math.round(((t.indexValue - baseIndex.indexValue) / baseIndex.indexValue) * 100 * 100) / 100
          : 0,
        absoluteTransport: Math.round((t.breakdown.transportCost - baseIndex.breakdown.transportCost) * 100) / 100,
        absoluteLandMobility: Math.round((t.breakdown.landMobilityCost - baseIndex.breakdown.landMobilityCost) * 100) / 100,
      };
    }

    return comparison;
  });

  return {
    territories: comparisons,
    baseTerritory,
    comparisonDate: new Date().toISOString(),
    methodology: territories[0]?.metadata.methodology || {} as GlobalMobilityIndexMethodology,
  };
}

/**
 * Apply filters to mobility indices
 */
export function applyMobilityIndexFilters(
  indices: GlobalMobilityIndex[],
  filter: MobilityIndexFilter
): GlobalMobilityIndex[] {
  let filtered = indices;

  if (filter.territory) {
    filtered = filtered.filter(i => i.territory === filter.territory);
  }

  if (filter.classification) {
    filtered = filtered.filter(i => i.profile.classification === filter.classification);
  }

  if (filter.minCoveragePercent !== undefined) {
    filtered = filtered.filter(i => 
      i.metadata.dataQuality.coveragePercentage >= filter.minCoveragePercent!
    );
  }

  if (!filter.includePartialData) {
    filtered = filtered.filter(i =>
      i.metadata.dataQuality.coveragePercentage >= MOBILITY_INDEX_CONFIG.MIN_COVERAGE_PERCENT
    );
  }

  return filtered;
}
