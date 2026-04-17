/**
 * Food Basket Observatory Service v2.5.0
 *
 * Implements citizen food basket observation with:
 * - Read-only data access (no data modification)
 * - Type basket analysis (basic, family, local)
 * - Observed data only (receipts, field observations, open data)
 * - Multi-store cost tracking
 * - Territorial variation analysis
 * - Transparent source tracking
 * - No nutrition score or dietary advice
 * - No purchase recommendations
 */

import type {
  FoodBasket,
  FoodBasketObservation,
  FoodBasketAggregation,
  FoodBasketComparisonResult,
  FoodBasketStoreRanking,
  FoodBasketMetadata,
  FoodBasketSourceSummary,
  FoodBasketItemBreakdown,
  FoodBasketFilter,
  FoodBasketHistoryPoint,
  FoodBasketVariation,
  FoodBasketItemVariation,
  FoodBasketItemPrice,
} from '../types/foodBasket';
import type { Territory } from '../types/priceAlerts';
import { logRuntimeIssueOnce } from '../utils/runtimeDiagnostics';

/**
 * Configuration constants
 */
const FOOD_BASKET_CONFIG = {
  MEDIAN_TOLERANCE_PERCENT: 10,
  MIN_COMPLETENESS_PERCENT: 70, // Minimum basket completeness
  MAX_PRICE_AGE_WARNING_DAYS: 7,
  STABLE_VARIATION_THRESHOLD: 3, // ±3% considered stable
  SIGNIFICANT_ITEM_VARIATION: 10, // ±10% for item-level significance
} as const;

/**
 * Compare food basket costs across stores in a territory
 */
export function compareFoodBasketCosts(
  basket: FoodBasket,
  observations: FoodBasketObservation[],
  territory: Territory
): FoodBasketComparisonResult | null {
  if (!basket || !observations || observations.length === 0) {
    return null;
  }

  // Filter by territory
  const territoryObservations = observations.filter((o) => o.territory === territory);

  if (territoryObservations.length === 0) {
    return null;
  }

  // Calculate aggregation
  const aggregation = calculateFoodBasketAggregation(basket, territoryObservations, territory);

  // Rank stores
  const ranking = rankFoodBasketStores(territoryObservations, aggregation.statistics.medianCost);

  // Generate metadata
  const metadata = generateFoodBasketMetadata(territoryObservations);

  return {
    basket,
    territory,
    observations: territoryObservations,
    aggregation,
    ranking,
    comparisonDate: new Date().toISOString(),
    metadata,
  };
}

/**
 * Calculate food basket aggregation
 */
export function calculateFoodBasketAggregation(
  basket: FoodBasket,
  observations: FoodBasketObservation[],
  territory: Territory
): FoodBasketAggregation {
  if (observations.length === 0) {
    throw new Error('Cannot calculate aggregation for empty observations');
  }

  const costs = observations.map((o) => o.totalCost);
  const completeness = observations.map((o) => o.completeness);

  // Calculate statistics
  const averageCost = costs.reduce((sum, c) => sum + c, 0) / costs.length;
  const medianCost = calculateMedian(costs);
  const minCost = Math.min(...costs);
  const maxCost = Math.max(...costs);
  const averageCompleteness = completeness.reduce((sum, c) => sum + c, 0) / completeness.length;

  // Calculate dispersion
  const stdDev = calculateStandardDeviation(costs, averageCost);
  const coeffVar = averageCost > 0 ? (stdDev / averageCost) * 100 : 0;
  const percentile25 = calculatePercentile(costs, 25);
  const percentile75 = calculatePercentile(costs, 75);
  const iqr = percentile75 - percentile25;

  // Calculate item breakdown
  const itemBreakdown = calculateItemBreakdown(basket, observations);

  // Date range
  const dates = observations.map((o) => new Date(o.observationDate).getTime());
  const oldestDate = new Date(Math.min(...dates)).toISOString();
  const newestDate = new Date(Math.max(...dates)).toISOString();

  // Count unique stores
  const uniqueStores = new Set(observations.map((o) => o.storeName).filter(Boolean));

  return {
    basket,
    territory,
    statistics: {
      observationCount: observations.length,
      storeCount: uniqueStores.size,
      averageCost: Math.round(averageCost * 100) / 100,
      medianCost: Math.round(medianCost * 100) / 100,
      minCost: Math.round(minCost * 100) / 100,
      maxCost: Math.round(maxCost * 100) / 100,
      averageCompleteness: Math.round(averageCompleteness * 100) / 100,
    },
    dispersion: {
      standardDeviation: Math.round(stdDev * 100) / 100,
      coefficientOfVariation: Math.round(coeffVar * 100) / 100,
      interquartileRange: Math.round(iqr * 100) / 100,
    },
    itemBreakdown,
    observationPeriod: {
      from: oldestDate,
      to: newestDate,
    },
    lastUpdate: new Date().toISOString(),
  };
}

/**
 * Calculate item-level breakdown
 */
function calculateItemBreakdown(
  basket: FoodBasket,
  observations: FoodBasketObservation[]
): FoodBasketItemBreakdown[] {
  return basket.items.map((item) => {
    // Find all prices for this item across observations
    const itemPrices: number[] = [];
    let availableCount = 0;

    observations.forEach((obs) => {
      const itemPrice = obs.itemPrices.find((ip) => ip.item.name === item.name);
      if (itemPrice) {
        itemPrices.push(itemPrice.price);
        availableCount++;
      }
    });

    if (itemPrices.length === 0) {
      return {
        item,
        averagePrice: 0,
        minPrice: 0,
        maxPrice: 0,
        priceRange: 0,
        priceRangePercentage: 0,
        availabilityRate: 0,
        observationCount: 0,
      };
    }

    const avgPrice = itemPrices.reduce((sum, p) => sum + p, 0) / itemPrices.length;
    const minPrice = Math.min(...itemPrices);
    const maxPrice = Math.max(...itemPrices);
    const range = maxPrice - minPrice;
    const rangePercent = minPrice > 0 ? (range / minPrice) * 100 : 0;

    return {
      item,
      averagePrice: Math.round(avgPrice * 100) / 100,
      minPrice: Math.round(minPrice * 100) / 100,
      maxPrice: Math.round(maxPrice * 100) / 100,
      priceRange: Math.round(range * 100) / 100,
      priceRangePercentage: Math.round(rangePercent * 100) / 100,
      availabilityRate: Math.round((availableCount / observations.length) * 100 * 100) / 100,
      observationCount: itemPrices.length,
    };
  });
}

/**
 * Rank food basket stores
 */
export function rankFoodBasketStores(
  observations: FoodBasketObservation[],
  medianCost: number
): FoodBasketStoreRanking[] {
  if (observations.length === 0) {
    return [];
  }

  // Sort by total cost
  const sorted = [...observations].sort((a, b) => a.totalCost - b.totalCost);
  const cheapestCost = sorted[0].totalCost;

  return sorted.map((obs, index) => {
    const absoluteDiffFromCheapest = obs.totalCost - cheapestCost;
    const percentageDiffFromCheapest =
      cheapestCost > 0 ? (absoluteDiffFromCheapest / cheapestCost) * 100 : 0;

    const absoluteDiffFromMedian = obs.totalCost - medianCost;
    const percentageDiffFromMedian =
      medianCost > 0 ? (absoluteDiffFromMedian / medianCost) * 100 : 0;

    // Categorize
    let category: FoodBasketStoreRanking['priceCategory'];
    if (index === 0) {
      category = 'cheapest';
    } else if (index === sorted.length - 1) {
      category = 'most_expensive';
    } else if (Math.abs(percentageDiffFromMedian) <= FOOD_BASKET_CONFIG.MEDIAN_TOLERANCE_PERCENT) {
      category = 'median';
    } else if (obs.totalCost < medianCost) {
      category = 'below_median';
    } else {
      category = 'above_median';
    }

    return {
      rank: index + 1,
      observation: obs,
      absoluteDifferenceFromCheapest: Math.round(absoluteDiffFromCheapest * 100) / 100,
      percentageDifferenceFromCheapest: Math.round(percentageDiffFromCheapest * 100) / 100,
      absoluteDifferenceFromMedian: Math.round(absoluteDiffFromMedian * 100) / 100,
      percentageDifferenceFromMedian: Math.round(percentageDiffFromMedian * 100) / 100,
      priceCategory: category,
      completenessScore: obs.completeness,
    };
  });
}

/**
 * Generate metadata for transparency
 */
export function generateFoodBasketMetadata(
  observations: FoodBasketObservation[]
): FoodBasketMetadata {
  const totalObservations = observations.length;
  const completeObservations = observations.filter(
    (o) => o.completeness >= FOOD_BASKET_CONFIG.MIN_COMPLETENESS_PERCENT
  ).length;
  const avgCompleteness =
    observations.reduce((sum, o) => sum + o.completeness, 0) / totalObservations;

  // Date range
  const dates = observations.map((o) => new Date(o.observationDate).getTime());
  const oldestDate = new Date(Math.min(...dates)).toISOString();
  const newestDate = new Date(Math.max(...dates)).toISOString();

  // Source summary
  const sourceCounts = new Map<string, { count: number; stores: Set<string> }>();
  observations.forEach((obs) => {
    obs.sources.forEach((source) => {
      const sourceType = source?.type;
      if (!sourceType) {
        logRuntimeIssueOnce(
          'food-basket-metadata-missing-source',
          'Missing source type while aggregating food basket metadata. Entry ignored.'
        );
        return;
      }

      const sourceData = sourceCounts.get(sourceType) ?? { count: 0, stores: new Set<string>() };
      sourceData.count++;
      if (obs.storeName) {
        sourceData.stores.add(obs.storeName);
      }
      sourceCounts.set(sourceType, sourceData);
    });
  });

  const sources: FoodBasketSourceSummary[] = Array.from(sourceCounts.entries()).map(
    ([source, data]) => ({
      source: source as any,
      observationCount: data.count,
      storeCount: data.stores.size,
      percentage: Math.round((data.count / totalObservations) * 100 * 100) / 100,
    })
  );

  // Warnings
  const warnings: string[] = [];
  if (avgCompleteness < FOOD_BASKET_CONFIG.MIN_COMPLETENESS_PERCENT) {
    warnings.push(
      `Average basket completeness is ${Math.round(avgCompleteness)}%, below recommended ${FOOD_BASKET_CONFIG.MIN_COMPLETENESS_PERCENT}%`
    );
  }

  const now = Date.now();
  const maxAgeMs = FOOD_BASKET_CONFIG.MAX_PRICE_AGE_WARNING_DAYS * 24 * 60 * 60 * 1000;
  const hasOldData = observations.some(
    (o) => now - new Date(o.observationDate).getTime() > maxAgeMs
  );
  if (hasOldData) {
    warnings.push(
      `Some observations are older than ${FOOD_BASKET_CONFIG.MAX_PRICE_AGE_WARNING_DAYS} days`
    );
  }

  return {
    methodology: 'v2.5.0',
    aggregationMethod: 'median',
    dataQuality: {
      totalObservations,
      observationsWithCompleteData: completeObservations,
      averageCompleteness: Math.round(avgCompleteness * 100) / 100,
      coveragePercentage: Math.round((completeObservations / totalObservations) * 100 * 100) / 100,
      oldestObservation: oldestDate,
      newestObservation: newestDate,
    },
    sources,
    warnings: warnings.length > 0 ? warnings : undefined,
    limitations: [
      'Data represents observed prices only, not all available products',
      'Basket completeness may vary by store and availability',
      'Prices may vary by product quality, brand, and packaging',
      'Seasonal availability affects certain items',
      'No nutrition score or dietary advice is provided',
      'No purchase recommendation is made',
    ],
  };
}

/**
 * Apply filters to observations
 */
export function applyFoodBasketFilters(
  observations: FoodBasketObservation[],
  filter: FoodBasketFilter
): FoodBasketObservation[] {
  let filtered = observations;

  if (filter.basketType) {
    filtered = filtered.filter((o) => o.basket.type === filter.basketType);
  }

  if (filter.territory) {
    filtered = filtered.filter((o) => o.territory === filter.territory);
  }

  if (filter.storeChain) {
    filtered = filtered.filter((o) =>
      o.storeName?.toLowerCase().includes(filter.storeChain!.toLowerCase())
    );
  }

  if (filter.minCompleteness !== undefined) {
    filtered = filtered.filter((o) => o.completeness >= filter.minCompleteness!);
  }

  if (filter.maxPriceAge) {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() - filter.maxPriceAge);
    filtered = filtered.filter((o) => new Date(o.observationDate) >= maxDate);
  }

  if (filter.includeLocalOnly) {
    filtered = filtered.filter((o) => o.itemPrices.some((ip) => ip.item.localProduct));
  }

  if (filter.verifiedOnly) {
    filtered = filtered.filter((o) => o.itemPrices.every((ip) => ip.verified));
  }

  return filtered;
}

/**
 * Build food basket history
 */
export function buildFoodBasketHistory(
  basket: FoodBasket,
  observations: FoodBasketObservation[],
  territory: Territory
): FoodBasketHistoryPoint[] {
  if (observations.length === 0) {
    return [];
  }

  // Filter by territory
  const filtered = observations.filter((o) => o.territory === territory);

  // Group by week
  const weeklyGroups = new Map<string, FoodBasketObservation[]>();
  filtered.forEach((obs) => {
    const date = new Date(obs.observationDate);
    const weekKey = getWeekKey(date);
    if (!weeklyGroups.has(weekKey)) {
      weeklyGroups.set(weekKey, []);
    }
    weeklyGroups.get(weekKey)!.push(obs);
  });

  // Build history points
  const history: FoodBasketHistoryPoint[] = [];
  weeklyGroups.forEach((weekObs, weekKey) => {
    const costs = weekObs.map((o) => o.totalCost);
    const completeness = weekObs.map((o) => o.completeness);
    const allSources = weekObs.flatMap((o) => o.sources);

    history.push({
      date: weekKey,
      basket,
      territory,
      averageCost: Math.round((costs.reduce((sum, c) => sum + c, 0) / costs.length) * 100) / 100,
      medianCost: Math.round(calculateMedian(costs) * 100) / 100,
      minCost: Math.round(Math.min(...costs) * 100) / 100,
      maxCost: Math.round(Math.max(...costs) * 100) / 100,
      observationCount: weekObs.length,
      averageCompleteness:
        Math.round((completeness.reduce((sum, c) => sum + c, 0) / completeness.length) * 100) / 100,
      sources: allSources,
    });
  });

  return history.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Get week key for grouping (ISO week)
 */
function getWeekKey(date: Date): string {
  const year = date.getFullYear();
  const week = getISOWeek(date);
  return `${year}-W${String(week).padStart(2, '0')}`;
}

/**
 * Get ISO week number
 */
function getISOWeek(date: Date): number {
  const target = new Date(date.valueOf());
  const dayNr = (date.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
  }
  return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
}

/**
 * Calculate food basket variation
 */
export function calculateFoodBasketVariation(
  history: FoodBasketHistoryPoint[]
): FoodBasketVariation | null {
  if (history.length < 2) {
    return null;
  }

  const first = history[0];
  const last = history[history.length - 1];

  const absoluteChange = last.medianCost - first.medianCost;
  const percentageChange = first.medianCost > 0 ? (absoluteChange / first.medianCost) * 100 : 0;

  let direction: 'increase' | 'decrease' | 'stable';
  if (Math.abs(percentageChange) < FOOD_BASKET_CONFIG.STABLE_VARIATION_THRESHOLD) {
    direction = 'stable';
  } else {
    direction = percentageChange > 0 ? 'increase' : 'decrease';
  }

  // Calculate item-level variations (simplified - would need full item history)
  const itemVariations: FoodBasketItemVariation[] = [];

  const confidence = history.length >= 8 ? 'high' : history.length >= 4 ? 'medium' : 'low';

  return {
    basket: first.basket,
    territory: first.territory,
    period: {
      from: first.date,
      to: last.date,
    },
    variation: {
      absoluteChange: Math.round(absoluteChange * 100) / 100,
      percentageChange: Math.round(percentageChange * 100) / 100,
      direction,
    },
    itemVariations,
    confidence,
    methodology: 'v2.5.0',
  };
}

/**
 * Helper functions
 */
function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function calculateStandardDeviation(values: number[], mean: number): number {
  if (values.length === 0) return 0;
  const squaredDiffs = values.map((v) => Math.pow(v - mean, 2));
  const variance = squaredDiffs.reduce((sum, d) => sum + d, 0) / values.length;
  return Math.sqrt(variance);
}

function calculatePercentile(values: number[], percentile: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = (percentile / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}
