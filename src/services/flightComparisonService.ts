/**
 * Flight Comparison Service v1.0.0
 * 
 * Implements citizen flight price comparison with:
 * - Read-only data access
 * - Route-based flight matching
 * - Multi-airline aggregation
 * - Purchase timing analysis
 * - Seasonal price analysis
 * - Transparent source tracking
 * - "Observer, pas vendre" philosophy
 */

import type {
  FlightComparisonResult,
  FlightPricePoint,
  FlightPriceRanking,
  FlightRouteAggregation,
  FlightComparisonMetadata,
  FlightSourceSummary,
  FlightComparisonFilter,
  FlightRoute,
  PurchaseTimingAnalysis,
  SeasonalPriceAnalysis,
  TerritoryFlightStatistics,
} from '../types/flightComparison';

/**
 * Configuration constants
 */
const FLIGHT_COMPARISON_CONFIG = {
  AVERAGE_PRICE_TOLERANCE_PERCENT: 5,
  MIN_COVERAGE_WARNING_PERCENT: 50,
  MAX_PRICE_AGE_WARNING_DAYS: 30,
  OPTIMAL_PURCHASE_WINDOW_DAYS: { min: 21, max: 90 },
} as const;

/**
 * Compare flight prices for a route across airlines
 */
export function compareFlightPricesByRoute(
  route: FlightRoute,
  flightPrices: FlightPricePoint[]
): FlightComparisonResult | null {
  if (!route || !flightPrices || flightPrices.length === 0) {
    return null;
  }

  // Filter prices for the specified route
  const routePrices = filterPricesByRoute(flightPrices, route);

  if (routePrices.length === 0) {
    return null;
  }

  // Calculate aggregation
  const aggregation = calculateFlightRouteAggregation(routePrices, route);

  // Rank airlines by price
  const rankedPrices = rankFlightPrices(routePrices, aggregation.averagePrice);

  // Analyze purchase timing if data available
  const purchaseTimingAnalysis = analyzePurchaseTiming(routePrices, route);

  // Analyze seasonal patterns if data available
  const seasonalAnalysis = analyzeSeasonalPrices(routePrices, route);

  // Generate metadata
  const metadata = generateFlightMetadata(routePrices);

  return {
    route,
    airlines: rankedPrices,
    aggregation,
    purchaseTimingAnalysis,
    seasonalAnalysis,
    comparisonDate: new Date().toISOString(),
    metadata,
  };
}

/**
 * Filter flight prices by route
 */
export function filterPricesByRoute(
  prices: FlightPricePoint[],
  route: FlightRoute
): FlightPricePoint[] {
  return prices.filter(
    (price) =>
      price.route.origin.code === route.origin.code &&
      price.route.destination.code === route.destination.code
  );
}

/**
 * Calculate route aggregation statistics
 */
export function calculateFlightRouteAggregation(
  prices: FlightPricePoint[],
  route: FlightRoute
): FlightRouteAggregation {
  if (prices.length === 0) {
    throw new Error('Cannot calculate aggregation with no prices');
  }

  const priceValues = prices.map((p) => p.price);
  const airlines = new Set(prices.map((p) => p.airline));

  const minPrice = Math.min(...priceValues);
  const maxPrice = Math.max(...priceValues);
  const averagePrice = priceValues.reduce((sum, p) => sum + p, 0) / priceValues.length;
  
  // Calculate median
  const sortedPrices = [...priceValues].sort((a, b) => a - b);
  const medianPrice =
    sortedPrices.length % 2 === 0
      ? (sortedPrices[sortedPrices.length / 2 - 1] + sortedPrices[sortedPrices.length / 2]) / 2
      : sortedPrices[Math.floor(sortedPrices.length / 2)];

  // Calculate standard deviation
  const variance = priceValues.reduce((sum, p) => sum + Math.pow(p - averagePrice, 2), 0) / priceValues.length;
  const standardDeviation = Math.sqrt(variance);

  const priceRange = maxPrice - minPrice;
  const priceRangePercentage = (priceRange / minPrice) * 100;

  // Get observation dates
  const observationDates = prices.map((p) => new Date(p.timing.purchaseDate).getTime());
  const oldestObservation = new Date(Math.min(...observationDates)).toISOString();
  const newestObservation = new Date(Math.max(...observationDates)).toISOString();

  // Calculate seasonal variation if data available
  const highSeasonPrices = prices.filter((p) => p.timing.season === 'high').map((p) => p.price);
  const lowSeasonPrices = prices.filter((p) => p.timing.season === 'low').map((p) => p.price);

  let seasonalVariation;
  if (highSeasonPrices.length > 0 && lowSeasonPrices.length > 0) {
    const highSeasonAverage = highSeasonPrices.reduce((sum, p) => sum + p, 0) / highSeasonPrices.length;
    const lowSeasonAverage = lowSeasonPrices.reduce((sum, p) => sum + p, 0) / lowSeasonPrices.length;
    const seasonalDifference = highSeasonAverage - lowSeasonAverage;
    const seasonalDifferencePercentage = (seasonalDifference / lowSeasonAverage) * 100;

    seasonalVariation = {
      highSeasonAverage,
      lowSeasonAverage,
      seasonalDifference,
      seasonalDifferencePercentage,
    };
  }

  return {
    route,
    airlineCount: airlines.size,
    averagePrice: Math.round(averagePrice * 100) / 100,
    minPrice: Math.round(minPrice * 100) / 100,
    maxPrice: Math.round(maxPrice * 100) / 100,
    priceRange: Math.round(priceRange * 100) / 100,
    priceRangePercentage: Math.round(priceRangePercentage * 100) / 100,
    medianPrice: Math.round(medianPrice * 100) / 100,
    standardDeviation: Math.round(standardDeviation * 100) / 100,
    observationPeriod: {
      from: oldestObservation,
      to: newestObservation,
    },
    totalObservations: prices.length,
    lastUpdate: new Date().toISOString(),
    seasonalVariation,
  };
}

/**
 * Rank flight prices
 */
export function rankFlightPrices(
  prices: FlightPricePoint[],
  averagePrice: number
): FlightPriceRanking[] {
  if (prices.length === 0) {
    return [];
  }

  // Sort by price ascending
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
    let priceCategory: FlightPriceRanking['priceCategory'];
    if (index === 0) {
      priceCategory = 'cheapest';
    } else if (index === sortedPrices.length - 1) {
      priceCategory = 'most_expensive';
    } else if (
      Math.abs(percentageDifferenceFromAverage) <= FLIGHT_COMPARISON_CONFIG.AVERAGE_PRICE_TOLERANCE_PERCENT
    ) {
      priceCategory = 'average';
    } else if (price.price < averagePrice) {
      priceCategory = 'below_average';
    } else {
      priceCategory = 'above_average';
    }

    return {
      rank: index + 1,
      flightPrice: price,
      absoluteDifferenceFromCheapest: Math.round(absoluteDifferenceFromCheapest * 100) / 100,
      percentageDifferenceFromCheapest: Math.round(percentageDifferenceFromCheapest * 100) / 100,
      absoluteDifferenceFromAverage: Math.round(absoluteDifferenceFromAverage * 100) / 100,
      percentageDifferenceFromAverage: Math.round(percentageDifferenceFromAverage * 100) / 100,
      priceCategory,
    };
  });
}

/**
 * Analyze purchase timing patterns
 */
export function analyzePurchaseTiming(
  prices: FlightPricePoint[],
  route: FlightRoute
): PurchaseTimingAnalysis | undefined {
  if (prices.length < 5) {
    return undefined; // Not enough data
  }

  // Define timing buckets
  const buckets = [
    { label: '0-7 jours', min: 0, max: 7 },
    { label: '8-14 jours', min: 8, max: 14 },
    { label: '15-30 jours', min: 15, max: 30 },
    { label: '31-60 jours', min: 31, max: 60 },
    { label: '61-90 jours', min: 61, max: 90 },
    { label: '90+ jours', min: 91, max: 365 },
  ];

  const timingBuckets = buckets.map((bucket) => {
    const bucketPrices = prices.filter(
      (p) => p.timing.daysBeforeDeparture >= bucket.min && p.timing.daysBeforeDeparture <= bucket.max
    );

    if (bucketPrices.length === 0) {
      return {
        label: bucket.label,
        daysBeforeDeparture: { min: bucket.min, max: bucket.max },
        averagePrice: 0,
        minPrice: 0,
        maxPrice: 0,
        observationCount: 0,
      };
    }

    const priceValues = bucketPrices.map((p) => p.price);
    return {
      label: bucket.label,
      daysBeforeDeparture: { min: bucket.min, max: bucket.max },
      averagePrice: Math.round((priceValues.reduce((sum, p) => sum + p, 0) / priceValues.length) * 100) / 100,
      minPrice: Math.round(Math.min(...priceValues) * 100) / 100,
      maxPrice: Math.round(Math.max(...priceValues) * 100) / 100,
      observationCount: bucketPrices.length,
    };
  });

  // Find optimal purchase window
  const bucketsWithData = timingBuckets.filter((b) => b.observationCount > 0);
  if (bucketsWithData.length > 0) {
    const cheapestBucket = bucketsWithData.reduce((min, bucket) =>
      bucket.averagePrice < min.averagePrice ? bucket : min
    );

    const overallAverage =
      timingBuckets.reduce((sum, b) => sum + b.averagePrice * b.observationCount, 0) /
      timingBuckets.reduce((sum, b) => sum + b.observationCount, 0);

    const savingsVsAverage = overallAverage - cheapestBucket.averagePrice;
    const savingsPercentage = (savingsVsAverage / overallAverage) * 100;

    return {
      route,
      timingBuckets,
      optimalPurchaseWindow: {
        daysBeforeDeparture: cheapestBucket.daysBeforeDeparture,
        averagePrice: cheapestBucket.averagePrice,
        savingsVsAverage: Math.round(savingsVsAverage * 100) / 100,
        savingsPercentage: Math.round(savingsPercentage * 100) / 100,
      },
    };
  }

  return {
    route,
    timingBuckets,
  };
}

/**
 * Analyze seasonal price patterns
 */
export function analyzeSeasonalPrices(
  prices: FlightPricePoint[],
  route: FlightRoute
): SeasonalPriceAnalysis | undefined {
  if (prices.length < 10) {
    return undefined; // Not enough data
  }

  const seasonTypes = ['high', 'low', 'shoulder'] as const;
  const seasons = seasonTypes.map((type) => {
    const seasonPrices = prices.filter((p) => p.timing.season === type);
    
    if (seasonPrices.length === 0) {
      return null;
    }

    const priceValues = seasonPrices.map((p) => p.price);
    // Extract months from travel dates
    const months = Array.from(new Set(seasonPrices.map((p) => new Date(p.timing.travelDate).getMonth() + 1)));

    return {
      type,
      months,
      averagePrice: Math.round((priceValues.reduce((sum, p) => sum + p, 0) / priceValues.length) * 100) / 100,
      minPrice: Math.round(Math.min(...priceValues) * 100) / 100,
      maxPrice: Math.round(Math.max(...priceValues) * 100) / 100,
      observationCount: seasonPrices.length,
    };
  }).filter((s) => s !== null);

  if (seasons.length === 0) {
    return undefined;
  }

  // Calculate high season multiplier
  const highSeason = seasons.find((s) => s!.type === 'high');
  const lowSeason = seasons.find((s) => s!.type === 'low');
  let highestSeasonMultiplier = 1;

  if (highSeason && lowSeason && lowSeason.averagePrice > 0) {
    highestSeasonMultiplier = highSeason.averagePrice / lowSeason.averagePrice;
  }

  return {
    route,
    seasons: seasons.filter((s): s is NonNullable<typeof s> => s !== null),
    highestSeasonMultiplier: Math.round(highestSeasonMultiplier * 100) / 100,
  };
}

/**
 * Generate metadata for transparency
 */
export function generateFlightMetadata(prices: FlightPricePoint[]): FlightComparisonMetadata {
  const airlines = new Set(prices.map((p) => p.airline));
  const sources = prices.reduce((acc, price) => {
    const sourceType = price.source.type;
    if (!acc[sourceType]) {
      acc[sourceType] = { count: 0, airlines: new Set<string>() };
    }
    acc[sourceType].count++;
    acc[sourceType].airlines.add(price.airline);
    return acc;
  }, {} as Record<string, { count: number; airlines: Set<string> }>);

  const sourceSummaries: FlightSourceSummary[] = Object.entries(sources).map(([source, data]) => ({
    source: source as any,
    observationCount: data.count,
    airlineCount: data.airlines.size,
    percentage: Math.round((data.count / prices.length) * 100 * 100) / 100,
  }));

  const observationDates = prices.map((p) => new Date(p.timing.purchaseDate).getTime());
  const oldestObservation = new Date(Math.min(...observationDates)).toISOString();
  const newestObservation = new Date(Math.max(...observationDates)).toISOString();

  const airlinesWithData = airlines.size;
  const coveragePercentage = 100; // Assuming we have data for all airlines we know about

  const warnings: string[] = [];
  const limitations: string[] = [
    'Les prix affichés sont des observations et peuvent varier',
    'Les tarifs ne prennent pas en compte les promotions flash',
    'Comparaison basée sur les données disponibles uniquement',
  ];

  // Add warnings based on data quality
  if (coveragePercentage < FLIGHT_COMPARISON_CONFIG.MIN_COVERAGE_WARNING_PERCENT) {
    warnings.push(`Couverture des compagnies limitée (${coveragePercentage}%)`);
  }

  const now = Date.now();
  const oldestAgeMs = now - Math.min(...observationDates);
  const oldestAgeDays = oldestAgeMs / (1000 * 60 * 60 * 24);
  if (oldestAgeDays > FLIGHT_COMPARISON_CONFIG.MAX_PRICE_AGE_WARNING_DAYS) {
    warnings.push(`Certaines données datent de plus de ${FLIGHT_COMPARISON_CONFIG.MAX_PRICE_AGE_WARNING_DAYS} jours`);
  }

  return {
    methodology: 'v1.0.0',
    aggregationMethod: 'mean',
    dataQuality: {
      totalAirlines: airlines.size,
      airlinesWithData,
      coveragePercentage: Math.round(coveragePercentage * 100) / 100,
      oldestObservation,
      newestObservation,
    },
    sources: sourceSummaries,
    warnings: warnings.length > 0 ? warnings : undefined,
    limitations,
    disclaimer:
      'A KI PRI SA YÉ observe les prix, ne vend pas. Transparence sur les écarts, pas d\'affiliation opaque.',
  };
}

/**
 * Filter flight prices by criteria
 */
export function filterFlightPrices(
  prices: FlightPricePoint[],
  filter: FlightComparisonFilter
): FlightPricePoint[] {
  let filtered = prices;

  if (filter.routeType) {
    filtered = filtered.filter((p) => p.route.routeType === filter.routeType);
  }

  if (filter.originTerritory) {
    filtered = filtered.filter((p) => p.route.origin.territory === filter.originTerritory);
  }

  if (filter.destinationTerritory) {
    filtered = filtered.filter((p) => p.route.destination.territory === filter.destinationTerritory);
  }

  if (filter.airline) {
    filtered = filtered.filter((p) => p.airline.toLowerCase().includes(filter.airline!.toLowerCase()));
  }

  if (filter.priceType) {
    filtered = filtered.filter((p) => p.priceType === filter.priceType);
  }

  if (filter.maxPriceAge) {
    const maxAgeMs = filter.maxPriceAge * 24 * 60 * 60 * 1000;
    const cutoffDate = Date.now() - maxAgeMs;
    filtered = filtered.filter((p) => new Date(p.timing.purchaseDate).getTime() >= cutoffDate);
  }

  if (filter.minConfidence) {
    const confidenceLevels = { low: 0, medium: 1, high: 2 };
    const minLevel = confidenceLevels[filter.minConfidence];
    filtered = filtered.filter((p) => confidenceLevels[p.confidence] >= minLevel);
  }

  if (filter.verifiedOnly) {
    filtered = filtered.filter((p) => p.verified);
  }

  if (filter.directOnly) {
    filtered = filtered.filter((p) => p.stops === 0);
  }

  if (filter.season) {
    filtered = filtered.filter((p) => p.timing.season === filter.season);
  }

  if (filter.daysBeforeDeparture) {
    const { min, max } = filter.daysBeforeDeparture;
    if (min !== undefined) {
      filtered = filtered.filter((p) => p.timing.daysBeforeDeparture >= min);
    }
    if (max !== undefined) {
      filtered = filtered.filter((p) => p.timing.daysBeforeDeparture <= max);
    }
  }

  return filtered;
}

/**
 * Get cheapest flight
 */
export function getCheapestFlight(prices: FlightPricePoint[]): FlightPricePoint | null {
  if (prices.length === 0) return null;
  return prices.reduce((min, price) => (price.price < min.price ? price : min));
}

/**
 * Get most expensive flight
 */
export function getMostExpensiveFlight(prices: FlightPricePoint[]): FlightPricePoint | null {
  if (prices.length === 0) return null;
  return prices.reduce((max, price) => (price.price > max.price ? price : max));
}

/**
 * Calculate potential savings
 */
export function calculatePotentialSavings(
  prices: FlightPricePoint[]
): { absolute: number; percentage: number } | null {
  const cheapest = getCheapestFlight(prices);
  const mostExpensive = getMostExpensiveFlight(prices);

  if (!cheapest || !mostExpensive || mostExpensive.price === 0) {
    return null;
  }

  const absolute = mostExpensive.price - cheapest.price;
  const percentage = (absolute / mostExpensive.price) * 100;

  return {
    absolute: Math.round(absolute * 100) / 100,
    percentage: Math.round(percentage * 100) / 100,
  };
}
