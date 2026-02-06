/**
 * Transport Price Service v2.2.0
 * 
 * Implements citizen transport price comparison with:
 * - Read-only data access (no data modification)
 * - Route-based transport matching (plane, boat, inter-island)
 * - Multi-operator aggregation by territory
 * - Transparent source tracking (mandatory SourceReference)
 * - Ranking from cheapest to most expensive
 * - Percentage difference calculations
 * - No recommendations or advice
 * - Observed data only (not declarative)
 */

import type {
  TransportComparisonResult,
  TransportPricePoint,
  TransportPriceRanking,
  RouteAggregation,
  TransportComparisonMetadata,
  SourceSummary,
  TransportComparisonFilter,
  TransportRouteIdentifier,
  TransportMode,
} from '../types/transportComparison';
import type { Territory, DataSource } from '../types/priceAlerts';

/**
 * Configuration constants for transport comparison service
 */
const TRANSPORT_COMPARISON_CONFIG = {
  AVERAGE_PRICE_TOLERANCE_PERCENT: 5,  // Tolerance for 'average' category (±5%)
  MIN_COVERAGE_WARNING_PERCENT: 50,    // Warn if coverage below 50%
  MAX_PRICE_AGE_WARNING_DAYS: 30,      // Warn if prices older than 30 days
} as const;

/**
 * Compare transport prices for a route across operators
 * Read-only operation - does not modify any data
 */
export function compareTransportPricesByRoute(
  route: TransportRouteIdentifier,
  operatorPrices: TransportPricePoint[]
): TransportComparisonResult | null {
  if (!route || !operatorPrices || operatorPrices.length === 0) {
    return null;
  }

  // Filter prices for the specified route
  const routePrices = filterPricesByRoute(operatorPrices, route);

  if (routePrices.length === 0) {
    return null;
  }

  // Calculate aggregation
  const aggregation = calculateRouteAggregation(routePrices, route);

  // Rank operators by price
  const rankedPrices = rankTransportPrices(routePrices, aggregation.averagePrice);

  // Generate metadata for transparency
  const metadata = generateTransportMetadata(routePrices);

  return {
    route,
    operatorPrices: rankedPrices,
    aggregation,
    comparisonDate: new Date().toISOString(),
    metadata,
  };
}

/**
 * Filter transport prices by route
 */
export function filterPricesByRoute(
  prices: TransportPricePoint[],
  route: TransportRouteIdentifier
): TransportPricePoint[] {
  return prices.filter(
    (price) =>
      price.route.origin === route.origin &&
      price.route.destination === route.destination &&
      price.route.mode === route.mode
  );
}

/**
 * Filter transport prices by territory
 */
export function filterPricesByTerritory(
  prices: TransportPricePoint[],
  originTerritory?: Territory,
  destinationTerritory?: Territory
): TransportPricePoint[] {
  let filtered = prices;

  if (originTerritory) {
    filtered = filtered.filter((p) => p.route.originTerritory === originTerritory);
  }

  if (destinationTerritory) {
    filtered = filtered.filter((p) => p.route.destinationTerritory === destinationTerritory);
  }

  return filtered;
}

/**
 * Filter transport prices by transport mode
 */
export function filterPricesByMode(
  prices: TransportPricePoint[],
  mode: TransportMode
): TransportPricePoint[] {
  return prices.filter((p) => p.route.mode === mode);
}

/**
 * Apply comprehensive filters to transport prices
 */
export function applyTransportFilters(
  prices: TransportPricePoint[],
  filter: TransportComparisonFilter
): TransportPricePoint[] {
  let filtered = prices;

  if (filter.mode) {
    filtered = filterPricesByMode(filtered, filter.mode);
  }

  if (filter.originTerritory || filter.destinationTerritory) {
    filtered = filterPricesByTerritory(
      filtered,
      filter.originTerritory,
      filter.destinationTerritory
    );
  }

  if (filter.operatorName) {
    filtered = filtered.filter((p) =>
      p.operatorName.toLowerCase().includes(filter.operatorName!.toLowerCase())
    );
  }

  if (filter.maxPriceAge) {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() - filter.maxPriceAge);
    filtered = filtered.filter(
      (p) => new Date(p.observationDate) >= maxDate
    );
  }

  if (filter.minConfidence) {
    const confidenceLevels = { low: 1, medium: 2, high: 3 };
    const minLevel = confidenceLevels[filter.minConfidence];
    filtered = filtered.filter(
      (p) => confidenceLevels[p.confidence] >= minLevel
    );
  }

  if (filter.verifiedOnly) {
    filtered = filtered.filter((p) => p.verified);
  }

  return filtered;
}

/**
 * Calculate aggregation for a route
 */
export function calculateRouteAggregation(
  prices: TransportPricePoint[],
  route: TransportRouteIdentifier
): RouteAggregation {
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

  return {
    route,
    operatorCount: new Set(prices.map((p) => p.operatorId)).size,
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
 * Rank transport prices from cheapest to most expensive
 */
export function rankTransportPrices(
  prices: TransportPricePoint[],
  averagePrice: number
): TransportPriceRanking[] {
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
    let priceCategory: TransportPriceRanking['priceCategory'];
    if (index === 0) {
      priceCategory = 'cheapest';
    } else if (index === sortedPrices.length - 1) {
      priceCategory = 'most_expensive';
    } else if (
      Math.abs(percentageDifferenceFromAverage) <=
      TRANSPORT_COMPARISON_CONFIG.AVERAGE_PRICE_TOLERANCE_PERCENT
    ) {
      priceCategory = 'average';
    } else if (price.price < averagePrice) {
      priceCategory = 'below_average';
    } else {
      priceCategory = 'above_average';
    }

    return {
      rank: index + 1,
      transportPrice: price,
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
export function generateTransportMetadata(
  prices: TransportPricePoint[]
): TransportComparisonMetadata {
  const uniqueOperators = new Set(prices.map((p) => p.operatorId));
  const operatorsWithData = uniqueOperators.size;
  const totalOperators = operatorsWithData; // In real scenario, this might be different

  // Get date range
  const dates = prices.map((p) => new Date(p.observationDate).getTime());
  const oldestDate = new Date(Math.min(...dates)).toISOString();
  const newestDate = new Date(Math.max(...dates)).toISOString();

  // Calculate source summary
  const sourceCounts = new Map<DataSource, { count: number; operators: Set<string> }>();
  prices.forEach((price) => {
    const sourceType = price.source.type;
    if (!sourceCounts.has(sourceType)) {
      sourceCounts.set(sourceType, { count: 0, operators: new Set() });
    }
    const sourceData = sourceCounts.get(sourceType)!;
    sourceData.count++;
    sourceData.operators.add(price.operatorId);
  });

  const sources: SourceSummary[] = Array.from(sourceCounts.entries()).map(
    ([source, data]) => ({
      source,
      observationCount: data.count,
      operatorCount: data.operators.size,
      percentage: Math.round((data.count / prices.length) * 100 * 100) / 100,
    })
  );

  // Generate warnings
  const warnings: string[] = [];
  const coveragePercentage = (operatorsWithData / totalOperators) * 100;
  if (coveragePercentage < TRANSPORT_COMPARISON_CONFIG.MIN_COVERAGE_WARNING_PERCENT) {
    warnings.push(`Low coverage: Only ${Math.round(coveragePercentage)}% of operators have data`);
  }

  const now = Date.now();
  const maxAgeMs = TRANSPORT_COMPARISON_CONFIG.MAX_PRICE_AGE_WARNING_DAYS * 24 * 60 * 60 * 1000;
  const hasOldData = prices.some(
    (p) => now - new Date(p.observationDate).getTime() > maxAgeMs
  );
  if (hasOldData) {
    warnings.push(
      `Some prices are older than ${TRANSPORT_COMPARISON_CONFIG.MAX_PRICE_AGE_WARNING_DAYS} days`
    );
  }

  return {
    methodology: 'v2.2.0',
    aggregationMethod: 'mean',
    dataQuality: {
      totalOperators,
      operatorsWithData,
      coveragePercentage: Math.round(coveragePercentage * 100) / 100,
      oldestObservation: oldestDate,
      newestObservation: newestDate,
    },
    sources,
    warnings: warnings.length > 0 ? warnings : undefined,
    limitations: [
      'Data represents observed prices only, not all available prices',
      'Prices may vary based on booking date, time, and conditions',
      'Additional fees (baggage, seat selection) may apply',
      'No prediction or recommendation is provided',
    ],
  };
}

/**
 * Calculate percentage difference between two prices
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
 * Get cheapest operator for a route
 */
export function getCheapestOperator(
  prices: TransportPricePoint[]
): TransportPricePoint | null {
  if (prices.length === 0) {
    return null;
  }
  return prices.reduce((cheapest, current) =>
    current.price < cheapest.price ? current : cheapest
  );
}

/**
 * Get most expensive operator for a route
 */
export function getMostExpensiveOperator(
  prices: TransportPricePoint[]
): TransportPricePoint | null {
  if (prices.length === 0) {
    return null;
  }
  return prices.reduce((expensive, current) =>
    current.price > expensive.price ? current : expensive
  );
}

/**
 * Calculate potential savings by choosing cheapest operator
 */
export function calculatePotentialSavings(
  currentPrice: number,
  cheapestPrice: number
): { absolute: number; percentage: number } {
  const absolute = Math.max(0, currentPrice - cheapestPrice);
  const percentage = cheapestPrice > 0 ? (absolute / cheapestPrice) * 100 : 0;

  return {
    absolute: Math.round(absolute * 100) / 100,
    percentage: Math.round(percentage * 100) / 100,
  };
}

/**
 * Group transport prices by transport mode
 */
export function groupPricesByMode(
  prices: TransportPricePoint[]
): Map<TransportMode, TransportPricePoint[]> {
  const grouped = new Map<TransportMode, TransportPricePoint[]>();

  prices.forEach((price) => {
    const mode = price.route.mode;
    if (!grouped.has(mode)) {
      grouped.set(mode, []);
    }
    grouped.get(mode)!.push(price);
  });

  return grouped;
}

/**
 * Group transport prices by territory
 */
export function groupPricesByTerritory(
  prices: TransportPricePoint[]
): Map<Territory, TransportPricePoint[]> {
  const grouped = new Map<Territory, TransportPricePoint[]>();

  prices.forEach((price) => {
    const origin = price.route.originTerritory;
    const destination = price.route.destinationTerritory;

    // Group by origin
    if (!grouped.has(origin)) {
      grouped.set(origin, []);
    }
    grouped.get(origin)!.push(price);

    // Group by destination if different
    if (origin !== destination) {
      if (!grouped.has(destination)) {
        grouped.set(destination, []);
      }
      grouped.get(destination)!.push(price);
    }
  });

  return grouped;
}

/**
 * Check if transport prices are available for a route
 */
export function hasPricesForRoute(
  prices: TransportPricePoint[],
  route: TransportRouteIdentifier
): boolean {
  return filterPricesByRoute(prices, route).length > 0;
}

/**
 * Get unique routes from transport prices
 */
export function getUniqueRoutes(
  prices: TransportPricePoint[]
): TransportRouteIdentifier[] {
  const routeMap = new Map<string, TransportRouteIdentifier>();

  prices.forEach((price) => {
    const routeKey = `${price.route.origin}-${price.route.destination}-${price.route.mode}`;
    if (!routeMap.has(routeKey)) {
      routeMap.set(routeKey, price.route);
    }
  });

  return Array.from(routeMap.values());
}
