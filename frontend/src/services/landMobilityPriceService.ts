/**
 * Land Mobility Price Service v2.3.0
 * 
 * Implements citizen land mobility price comparison with:
 * - Read-only data access (no data modification)
 * - Category-based matching (bus, taxi/VTC, fuel)
 * - Multi-provider aggregation by territory
 * - Transparent source tracking (mandatory SourceReference)
 * - Ranking from cheapest to most expensive
 * - Percentage difference calculations
 * - No recommendations or purchase advice
 * - Observed data only (not declarative)
 */

import type {
  LandMobilityComparisonResult,
  LandMobilityPricePoint,
  BusPricePoint,
  TaxiPricePoint,
  FuelPricePoint,
  LandMobilityRanking,
  LandMobilityAggregation,
  LandMobilityMetadata,
  SourceSummary,
  LandMobilityFilter,
  LandMobilityCategory,
} from '../types/landMobilityComparison';
import type { Territory, DataSource } from '../types/priceAlerts';

/**
 * Configuration constants for land mobility comparison
 */
const LAND_MOBILITY_CONFIG = {
  AVERAGE_PRICE_TOLERANCE_PERCENT: 5,
  MIN_COVERAGE_WARNING_PERCENT: 50,
  MAX_PRICE_AGE_WARNING_DAYS: 7,  // Shorter for more volatile prices
} as const;

/**
 * Compare land mobility prices by category and territory
 * Read-only operation - does not modify any data
 */
export function compareLandMobilityPrices(
  category: LandMobilityCategory,
  prices: (BusPricePoint | TaxiPricePoint | FuelPricePoint)[],
  territory: Territory
): LandMobilityComparisonResult | null {
  if (!category || !prices || prices.length === 0) {
    return null;
  }

  // Filter prices by category and territory
  const filteredPrices = prices.filter(
    (p) => p.category === category && 
    getCategoryTerritory(p) === territory
  );

  if (filteredPrices.length === 0) {
    return null;
  }

  // Calculate aggregation
  const aggregation = calculateLandMobilityAggregation(filteredPrices, category, territory);

  // Rank by price
  const rankings = rankLandMobilityPrices(filteredPrices, aggregation.averagePrice);

  // Generate metadata
  const metadata = generateLandMobilityMetadata(filteredPrices);

  return {
    category,
    territory,
    rankings,
    aggregation,
    comparisonDate: new Date().toISOString(),
    metadata,
  };
}

/**
 * Get territory from different price point types
 */
function getCategoryTerritory(
  price: BusPricePoint | TaxiPricePoint | FuelPricePoint
): Territory {
  if (price.category === 'BUS') {
    return (price as BusPricePoint).line.territory;
  } else if (price.category === 'TAXI') {
    return (price as TaxiPricePoint).zone.territory;
  } else {
    return (price as FuelPricePoint).station.territory;
  }
}

/**
 * Filter land mobility prices
 */
export function applyLandMobilityFilters(
  prices: (BusPricePoint | TaxiPricePoint | FuelPricePoint)[],
  filter: LandMobilityFilter
): (BusPricePoint | TaxiPricePoint | FuelPricePoint)[] {
  let filtered = prices;

  if (filter.category) {
    filtered = filtered.filter((p) => p.category === filter.category);
  }

  if (filter.territory) {
    filtered = filtered.filter((p) => getCategoryTerritory(p) === filter.territory);
  }

  if (filter.operator) {
    filtered = filtered.filter((p) => {
      if (p.category === 'BUS') {
        return (p as BusPricePoint).line.operator.toLowerCase().includes(filter.operator!.toLowerCase());
      } else if (p.category === 'TAXI') {
        return (p as TaxiPricePoint).operator.toLowerCase().includes(filter.operator!.toLowerCase());
      }
      return true;
    });
  }

  if (filter.fuelType) {
    filtered = filtered.filter((p) =>
      p.category === 'FUEL' ? (p as FuelPricePoint).fuelType === filter.fuelType : true
    );
  }

  if (filter.maxPriceAge) {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() - filter.maxPriceAge);
    filtered = filtered.filter((p) => new Date(p.observationDate) >= maxDate);
  }

  if (filter.minConfidence) {
    const confidenceLevels = { low: 1, medium: 2, high: 3 };
    const minLevel = confidenceLevels[filter.minConfidence];
    filtered = filtered.filter((p) => confidenceLevels[p.confidence] >= minLevel);
  }

  if (filter.verifiedOnly) {
    filtered = filtered.filter((p) => p.verified);
  }

  return filtered;
}

/**
 * Calculate aggregation for land mobility prices
 */
export function calculateLandMobilityAggregation(
  prices: LandMobilityPricePoint[],
  category: LandMobilityCategory,
  territory: Territory
): LandMobilityAggregation {
  if (prices.length === 0) {
    throw new Error('Cannot calculate aggregation for empty price list');
  }

  const priceValues = prices.map((p) => p.price);
  const minPrice = Math.min(...priceValues);
  const maxPrice = Math.max(...priceValues);
  const averagePrice = priceValues.reduce((sum, p) => sum + p, 0) / priceValues.length;
  const priceRange = maxPrice - minPrice;
  const priceRangePercentage = minPrice > 0 ? (priceRange / minPrice) * 100 : 0;

  // Get date range
  const dates = prices.map((p) => new Date(p.observationDate).getTime());
  const oldestDate = new Date(Math.min(...dates)).toISOString();
  const newestDate = new Date(Math.max(...dates)).toISOString();

  // Calculate total observations
  const totalObservations = prices.reduce((sum, p) => sum + p.volume, 0);

  // Count unique providers
  const uniqueProviders = new Set<string>();
  prices.forEach((p) => {
    if (p.category === 'BUS') {
      uniqueProviders.add((p as BusPricePoint).line.operator);
    } else if (p.category === 'TAXI') {
      uniqueProviders.add((p as TaxiPricePoint).operator);
    } else if (p.category === 'FUEL') {
      const station = (p as FuelPricePoint).station;
      uniqueProviders.add(station.stationId || station.stationName || station.brand || 'unknown');
    }
  });

  return {
    category,
    territory,
    providerCount: uniqueProviders.size,
    averagePrice: Math.round(averagePrice * 100) / 100,
    minPrice: Math.round(minPrice * 100) / 100,
    maxPrice: Math.round(maxPrice * 100) / 100,
    priceRange: Math.round(priceRange * 100) / 100,
    priceRangePercentage: Math.round(priceRangePercentage * 100) / 100,
    observationPeriod: {
      from: oldestDate,
      to: newestDate,
    },
    totalObservations,
    lastUpdate: new Date().toISOString(),
  };
}

/**
 * Rank land mobility prices from cheapest to most expensive
 */
export function rankLandMobilityPrices(
  prices: LandMobilityPricePoint[],
  averagePrice: number
): LandMobilityRanking[] {
  if (prices.length === 0) {
    return [];
  }

  // Sort by price (ascending)
  const sortedPrices = [...prices].sort((a, b) => a.price - b.price);
  const cheapestPrice = sortedPrices[0].price;

  return sortedPrices.map((price, index) => {
    const absoluteDifferenceFromCheapest = price.price - cheapestPrice;
    const percentageDifferenceFromCheapest =
      cheapestPrice > 0 ? (absoluteDifferenceFromCheapest / cheapestPrice) * 100 : 0;

    const absoluteDifferenceFromAverage = price.price - averagePrice;
    const percentageDifferenceFromAverage =
      averagePrice > 0 ? (absoluteDifferenceFromAverage / averagePrice) * 100 : 0;

    // Categorize price
    let priceCategory: LandMobilityRanking['priceCategory'];
    if (index === 0) {
      priceCategory = 'cheapest';
    } else if (index === sortedPrices.length - 1) {
      priceCategory = 'most_expensive';
    } else if (
      Math.abs(percentageDifferenceFromAverage) <=
      LAND_MOBILITY_CONFIG.AVERAGE_PRICE_TOLERANCE_PERCENT
    ) {
      priceCategory = 'average';
    } else if (price.price < averagePrice) {
      priceCategory = 'below_average';
    } else {
      priceCategory = 'above_average';
    }

    return {
      rank: index + 1,
      mobilityPrice: price as any, // Type assertion for union types
      absoluteDifferenceFromCheapest: Math.round(absoluteDifferenceFromCheapest * 100) / 100,
      percentageDifferenceFromCheapest: Math.round(percentageDifferenceFromCheapest * 100) / 100,
      absoluteDifferenceFromAverage: Math.round(absoluteDifferenceFromAverage * 100) / 100,
      percentageDifferenceFromAverage: Math.round(percentageDifferenceFromAverage * 100) / 100,
      priceCategory,
    };
  });
}

/**
 * Generate metadata for transparency
 */
export function generateLandMobilityMetadata(
  prices: LandMobilityPricePoint[]
): LandMobilityMetadata {
  // Count unique providers
  const uniqueProviders = new Set<string>();
  prices.forEach((p) => {
    if (p.category === 'BUS') {
      uniqueProviders.add((p as BusPricePoint).line.operator);
    } else if (p.category === 'TAXI') {
      uniqueProviders.add((p as TaxiPricePoint).operator);
    } else if (p.category === 'FUEL') {
      const station = (p as FuelPricePoint).station;
      uniqueProviders.add(station.stationId || station.stationName || station.brand || 'unknown');
    }
  });

  const providersWithData = uniqueProviders.size;
  const totalProviders = providersWithData;

  // Get date range
  const dates = prices.map((p) => new Date(p.observationDate).getTime());
  const oldestDate = new Date(Math.min(...dates)).toISOString();
  const newestDate = new Date(Math.max(...dates)).toISOString();

  // Calculate source summary
  const sourceCounts = new Map<DataSource, { count: number; providers: Set<string> }>();
  prices.forEach((price) => {
    const sourceType = price.source.type;
    if (!sourceCounts.has(sourceType)) {
      sourceCounts.set(sourceType, { count: 0, providers: new Set() });
    }
    const sourceData = sourceCounts.get(sourceType)!;
    sourceData.count++;
    
    // Add provider identifier
    if (price.category === 'BUS') {
      sourceData.providers.add((price as BusPricePoint).line.operator);
    } else if (price.category === 'TAXI') {
      sourceData.providers.add((price as TaxiPricePoint).operator);
    } else if (price.category === 'FUEL') {
      const station = (price as FuelPricePoint).station;
      sourceData.providers.add(station.stationId || station.stationName || station.brand || 'unknown');
    }
  });

  const sources: SourceSummary[] = Array.from(sourceCounts.entries()).map(
    ([source, data]) => ({
      source,
      observationCount: data.count,
      providerCount: data.providers.size,
      percentage: Math.round((data.count / prices.length) * 100 * 100) / 100,
    })
  );

  // Generate warnings
  const warnings: string[] = [];
  const coveragePercentage = (providersWithData / totalProviders) * 100;
  if (coveragePercentage < LAND_MOBILITY_CONFIG.MIN_COVERAGE_WARNING_PERCENT) {
    warnings.push(`Low coverage: Only ${Math.round(coveragePercentage)}% of providers have data`);
  }

  const now = Date.now();
  const maxAgeMs = LAND_MOBILITY_CONFIG.MAX_PRICE_AGE_WARNING_DAYS * 24 * 60 * 60 * 1000;
  const hasOldData = prices.some(
    (p) => now - new Date(p.observationDate).getTime() > maxAgeMs
  );
  if (hasOldData) {
    warnings.push(
      `Some prices are older than ${LAND_MOBILITY_CONFIG.MAX_PRICE_AGE_WARNING_DAYS} days`
    );
  }

  return {
    methodology: 'v2.3.0',
    aggregationMethod: 'mean',
    dataQuality: {
      totalProviders,
      providersWithData,
      coveragePercentage: Math.round(coveragePercentage * 100) / 100,
      oldestObservation: oldestDate,
      newestObservation: newestDate,
    },
    sources,
    warnings: warnings.length > 0 ? warnings : undefined,
    limitations: [
      'Data represents observed prices only, not all available prices',
      'Prices may vary based on time of day, day of week, and special conditions',
      'Taxi prices may include additional charges not reflected in base fare',
      'Fuel prices are highly volatile and may change daily',
      'No prediction, recommendation, or purchase advice is provided',
    ],
  };
}

/**
 * Get cheapest option
 */
export function getCheapestOption(
  prices: LandMobilityPricePoint[]
): LandMobilityPricePoint | null {
  if (prices.length === 0) {
    return null;
  }
  return prices.reduce((cheapest, current) =>
    current.price < cheapest.price ? current : cheapest
  );
}

/**
 * Get most expensive option
 */
export function getMostExpensiveOption(
  prices: LandMobilityPricePoint[]
): LandMobilityPricePoint | null {
  if (prices.length === 0) {
    return null;
  }
  return prices.reduce((expensive, current) =>
    current.price > expensive.price ? current : expensive
  );
}

/**
 * Calculate percentage difference
 */
export function calculatePercentageDifference(
  price1: number,
  price2: number
): number {
  if (price2 === 0) {
    return 0;
  }
  return Math.round(((price1 - price2) / price2) * 100 * 100) / 100;
}

/**
 * Group prices by category
 */
export function groupPricesByCategory(
  prices: LandMobilityPricePoint[]
): Map<LandMobilityCategory, LandMobilityPricePoint[]> {
  const grouped = new Map<LandMobilityCategory, LandMobilityPricePoint[]>();

  prices.forEach((price) => {
    if (!grouped.has(price.category)) {
      grouped.set(price.category, []);
    }
    grouped.get(price.category)!.push(price);
  });

  return grouped;
}

/**
 * Group prices by territory
 */
export function groupPricesByTerritory(
  prices: LandMobilityPricePoint[]
): Map<Territory, LandMobilityPricePoint[]> {
  const grouped = new Map<Territory, LandMobilityPricePoint[]>();

  prices.forEach((price) => {
    const territory = getCategoryTerritory(price as any);
    if (!grouped.has(territory)) {
      grouped.set(territory, []);
    }
    grouped.get(territory)!.push(price);
  });

  return grouped;
}

/**
 * Filter bus prices by operator
 */
export function filterBusByOperator(
  prices: BusPricePoint[],
  operator: string
): BusPricePoint[] {
  return prices.filter((p) =>
    p.line.operator.toLowerCase().includes(operator.toLowerCase())
  );
}

/**
 * Filter fuel prices by type
 */
export function filterFuelByType(
  prices: FuelPricePoint[],
  fuelType: string
): FuelPricePoint[] {
  return prices.filter((p) => p.fuelType === fuelType);
}

/**
 * Filter taxi prices by service type
 */
export function filterTaxiByServiceType(
  prices: TaxiPricePoint[],
  serviceType: 'taxi' | 'vtc' | 'shared'
): TaxiPricePoint[] {
  return prices.filter((p) => p.serviceType === serviceType);
}
