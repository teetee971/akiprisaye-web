/**
 * Price Comparison Service v1.4.0
 *
 * Implements citizen price comparison with:
 * - Read-only data access
 * - EAN-based product matching
 * - Multi-store aggregation by territory
 * - Transparent source tracking
 * - Ranking from cheapest to most expensive
 * - Percentage difference calculations
 */

import type {
  PriceComparisonResult,
  StorePricePoint,
  StorePriceRanking,
  TerritoryPriceAggregation,
  PriceComparisonMetadata,
  DataSourceSummary,
  PriceComparisonFilter,
  ProductIdentifier,
} from '../types/priceComparison';
import type { Territory, DataSource } from '../types/priceAlerts';
import { logRuntimeIssueOnce } from '../utils/runtimeDiagnostics';
import { getLocalProduct } from './sync/openFoodFactsService';

/**
 * Configuration constants for price comparison service
 */
const PRICE_COMPARISON_CONFIG = {
  AVERAGE_PRICE_TOLERANCE_PERCENT: 5, // Tolerance for 'average' category (±5%)
  MIN_COVERAGE_WARNING_PERCENT: 50, // Warn if coverage below 50%
  MAX_PRICE_AGE_WARNING_DAYS: 30, // Warn if prices older than 30 days
} as const;

/**
 * Compare prices for a product across stores in a territory
 * Read-only operation - does not modify any data
 */
export function comparePricesByEAN(
  ean: string,
  storePrices: StorePricePoint[],
  territory: Territory
): PriceComparisonResult | null {
  if (!ean || !storePrices || storePrices.length === 0) {
    return null;
  }

  // Filter prices for the specified territory
  const territoryPrices = storePrices.filter((sp) => sp.territory === territory);

  if (territoryPrices.length === 0) {
    return null;
  }

  // Sort prices from cheapest to most expensive
  const sortedPrices = [...territoryPrices].sort((a, b) => a.price - b.price);

  // Calculate aggregation statistics
  const aggregation = calculateTerritoryAggregation(sortedPrices, territory);

  // Rank stores with price differences
  const rankings = rankStorePrices(sortedPrices, aggregation);

  // Extract product information: look up the local OFF cache first
  const localProduct = getLocalProduct(ean);
  const product: ProductIdentifier = {
    ean: ean,
    productName: localProduct?.nom ?? '',
    category: localProduct?.categorie,
    brand: localProduct?.marque,
  };

  // Generate metadata
  const metadata = generateComparisonMetadata(sortedPrices);

  return {
    product,
    territory,
    storePrices: rankings,
    aggregation,
    comparisonDate: new Date().toISOString(),
    metadata,
  };
}

/**
 * Calculate territory-wide price aggregation
 */
export function calculateTerritoryAggregation(
  prices: StorePricePoint[],
  territory: Territory
): TerritoryPriceAggregation {
  if (prices.length === 0) {
    throw new Error('Cannot calculate aggregation with no prices');
  }

  const priceValues = prices.map((p) => p.price);
  const totalObservations = prices.reduce((sum, p) => sum + p.volume, 0);

  const minPrice = Math.min(...priceValues);
  const maxPrice = Math.max(...priceValues);
  const averagePrice = priceValues.reduce((sum, p) => sum + p, 0) / priceValues.length;
  const priceRange = maxPrice - minPrice;
  const priceRangePercentage = minPrice > 0 ? (priceRange / minPrice) * 100 : 0;

  // Find observation period
  const dates = prices.map((p) => new Date(p.observationDate).getTime());
  const oldestDate = new Date(Math.min(...dates)).toISOString();
  const newestDate = new Date(Math.max(...dates)).toISOString();

  return {
    territory,
    storeCount: prices.length,
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
 * Rank store prices from cheapest to most expensive
 * Calculate differences from cheapest and average
 */
export function rankStorePrices(
  sortedPrices: StorePricePoint[],
  aggregation: TerritoryPriceAggregation
): StorePriceRanking[] {
  if (sortedPrices.length === 0) {
    return [];
  }

  const cheapestPrice = sortedPrices[0].price;
  const averagePrice = aggregation.averagePrice;

  return sortedPrices.map((storePrice, index) => {
    const absoluteDiffFromCheapest = storePrice.price - cheapestPrice;
    const percentageDiffFromCheapest =
      cheapestPrice > 0 ? (absoluteDiffFromCheapest / cheapestPrice) * 100 : 0;

    const absoluteDiffFromAverage = storePrice.price - averagePrice;
    const percentageDiffFromAverage =
      averagePrice > 0 ? (absoluteDiffFromAverage / averagePrice) * 100 : 0;

    // Categorize price position
    let priceCategory: StorePriceRanking['priceCategory'];
    if (index === 0) {
      priceCategory = 'cheapest';
    } else if (index === sortedPrices.length - 1) {
      priceCategory = 'most_expensive';
    } else if (storePrice.price < averagePrice) {
      priceCategory = 'below_average';
    } else if (
      Math.abs(percentageDiffFromAverage) < PRICE_COMPARISON_CONFIG.AVERAGE_PRICE_TOLERANCE_PERCENT
    ) {
      priceCategory = 'average';
    } else {
      priceCategory = 'above_average';
    }

    return {
      rank: index + 1,
      storePrice,
      absoluteDifferenceFromCheapest: Math.round(absoluteDiffFromCheapest * 100) / 100,
      percentageDifferenceFromCheapest: Math.round(percentageDiffFromCheapest * 100) / 100,
      absoluteDifferenceFromAverage: Math.round(absoluteDiffFromAverage * 100) / 100,
      percentageDifferenceFromAverage: Math.round(percentageDiffFromAverage * 100) / 100,
      priceCategory,
    };
  });
}

/**
 * Generate comparison metadata for transparency
 */
export function generateComparisonMetadata(prices: StorePricePoint[]): PriceComparisonMetadata {
  const totalStores = prices.length;
  const storesWithData = prices.filter((p) => {
    const hasNumericPrice = typeof p?.price === 'number' && Number.isFinite(p.price);

    const d = new Date(p?.observationDate);
    const hasValidDate = typeof p?.observationDate === 'string' && Number.isFinite(d.getTime());

    return hasNumericPrice && hasValidDate;
  }).length;
  const coveragePercentage = (storesWithData / totalStores) * 100;

  const dates = prices.map((p) => new Date(p.observationDate).getTime());
  const oldestObservation = new Date(Math.min(...dates)).toISOString();
  const newestObservation = new Date(Math.max(...dates)).toISOString();

  // Aggregate sources
  const sourceCounts = new Map<DataSource, { count: number; stores: Set<string> }>();
  prices.forEach((price) => {
    const sourceType = price?.source;
    if (!sourceType) {
      logRuntimeIssueOnce(
        'price-comparison-metadata-missing-source',
        'Missing source while aggregating price-comparison metadata. Entry ignored.'
      );
      return;
    }

    const entry = sourceCounts.get(sourceType) ?? { count: 0, stores: new Set<string>() };
    entry.count += price.volume;
    entry.stores.add(price.storeId);
    sourceCounts.set(sourceType, entry);
  });

  const totalObservations = prices.reduce((sum, p) => sum + p.volume, 0);
  const sources: DataSourceSummary[] = Array.from(sourceCounts.entries()).map(([source, data]) => ({
    source,
    observationCount: data.count,
    storeCount: data.stores.size,
    percentage: Math.round((data.count / totalObservations) * 10000) / 100,
  }));

  // Generate warnings
  const warnings: string[] = [];
  if (coveragePercentage < PRICE_COMPARISON_CONFIG.MIN_COVERAGE_WARNING_PERCENT) {
    warnings.push(
      `Limited data coverage - less than ${PRICE_COMPARISON_CONFIG.MIN_COVERAGE_WARNING_PERCENT}% of stores have data`
    );
  }

  const ageInDays = (Date.now() - Math.min(...dates)) / (1000 * 60 * 60 * 24);
  if (ageInDays > PRICE_COMPARISON_CONFIG.MAX_PRICE_AGE_WARNING_DAYS) {
    warnings.push(
      `Some price data is older than ${PRICE_COMPARISON_CONFIG.MAX_PRICE_AGE_WARNING_DAYS} days`
    );
  }

  return {
    methodology: 'v1.4.0',
    aggregationMethod: 'mean',
    dataQuality: {
      totalStores,
      storesWithData,
      coveragePercentage: Math.round(coveragePercentage * 100) / 100,
      oldestObservation,
      newestObservation,
    },
    sources,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Calculate percentage difference between two prices
 */
export function calculatePercentageDifference(price1: number, price2: number): number {
  if (price2 === 0) {
    return 0;
  }
  const diff = ((price1 - price2) / price2) * 100;
  return Math.round(diff * 100) / 100;
}

/**
 * Filter store prices based on criteria
 */
export function filterStorePrices(
  prices: StorePricePoint[],
  filter: PriceComparisonFilter
): StorePricePoint[] {
  let filtered = [...prices];

  if (filter.territory) {
    filtered = filtered.filter((p) => p.territory === filter.territory);
  }

  if (filter.storeChain) {
    filtered = filtered.filter((p) => p.storeChain === filter.storeChain);
  }

  if (filter.maxPriceAge) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - filter.maxPriceAge);
    filtered = filtered.filter((p) => new Date(p.observationDate) >= cutoffDate);
  }

  if (filter.minConfidence) {
    const confidenceLevels = { low: 0, medium: 1, high: 2 };
    const minLevel = confidenceLevels[filter.minConfidence];
    filtered = filtered.filter((p) => confidenceLevels[p.confidence] >= minLevel);
  }

  if (filter.verifiedOnly) {
    filtered = filtered.filter((p) => p.verified);
  }

  return filtered;
}

/**
 * Get the cheapest store for a product in a territory
 */
export function getCheapestStore(prices: StorePricePoint[]): StorePricePoint | null {
  if (prices.length === 0) {
    return null;
  }

  return prices.reduce((cheapest, current) =>
    current.price < cheapest.price ? current : cheapest
  );
}

/**
 * Get the most expensive store for a product in a territory
 */
export function getMostExpensiveStore(prices: StorePricePoint[]): StorePricePoint | null {
  if (prices.length === 0) {
    return null;
  }

  return prices.reduce((expensive, current) =>
    current.price > expensive.price ? current : expensive
  );
}

/**
 * Calculate savings by choosing cheapest over most expensive
 */
export function calculatePotentialSavings(
  prices: StorePricePoint[]
): { absolute: number; percentage: number } | null {
  const cheapest = getCheapestStore(prices);
  const expensive = getMostExpensiveStore(prices);

  if (!cheapest || !expensive) {
    return null;
  }

  const absolute = expensive.price - cheapest.price;
  const percentage = calculatePercentageDifference(expensive.price, cheapest.price);

  return {
    absolute: Math.round(absolute * 100) / 100,
    percentage,
  };
}
