/**
 * Price History Service
 * 
 * Provides statistical analysis and volatility tracking for price history
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface PriceHistoryStats {
  productId: string;
  storeId: string;
  currentPrice?: number;
  averagePrice: number;
  minPrice: number;
  maxPrice: number;
  priceRange: number;
  volatility: number; // Standard deviation
  trendDirection: 'UP' | 'DOWN' | 'STABLE';
  trendPercentage: number;
  dataPoints: number;
  firstRecordedDate: Date;
  lastRecordedDate: Date;
}

export interface PriceDataPoint {
  date: Date;
  price: number;
  confidenceScore: number;
  source: string;
}

/**
 * Calculate standard deviation for volatility
 */
function calculateStandardDeviation(values: number[]): number {
  if (values.length === 0) return 0;
  
  const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squaredDiffs = values.map(val => Math.pow(val - avg, 2));
  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  
  return Math.sqrt(variance);
}

/**
 * Determine price trend
 */
function analyzeTrend(prices: number[]): {
  direction: 'UP' | 'DOWN' | 'STABLE';
  percentage: number;
} {
  if (prices.length < 2) {
    return { direction: 'STABLE', percentage: 0 };
  }

  // Simple linear regression
  const n = prices.length;
  const xSum = (n * (n - 1)) / 2; // Sum of 0,1,2,...,n-1
  const ySum = prices.reduce((sum, p) => sum + p, 0);
  const xySum = prices.reduce((sum, p, i) => sum + i * p, 0);
  const xxSum = (n * (n - 1) * (2 * n - 1)) / 6;

  const slope = (n * xySum - xSum * ySum) / (n * xxSum - xSum * xSum);
  const firstPrice = prices[0];
  const lastPrice = prices[prices.length - 1];
  
  const changePercentage = ((lastPrice - firstPrice) / firstPrice) * 100;

  let direction: 'UP' | 'DOWN' | 'STABLE';
  if (Math.abs(changePercentage) < 3) {
    direction = 'STABLE';
  } else if (slope > 0) {
    direction = 'UP';
  } else {
    direction = 'DOWN';
  }

  return {
    direction,
    percentage: changePercentage,
  };
}

/**
 * Get price history statistics for a product at a store
 * @param productId - Product ID
 * @param storeId - Store ID
 * @param days - Number of days to analyze (default: 90)
 * @returns Statistical analysis of price history
 */
export async function getPriceHistoryStats(
  productId: string,
  storeId: string,
  days: number = 90
): Promise<PriceHistoryStats | null> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const prices = await prisma.productPrice.findMany({
    where: {
      productId,
      storeId,
      isActive: true,
      createdAt: {
        gte: cutoffDate,
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  if (prices.length === 0) {
    return null;
  }

  const priceValues = prices.map(p => p.price);
  const minPrice = Math.min(...priceValues);
  const maxPrice = Math.max(...priceValues);
  const averagePrice = priceValues.reduce((sum, p) => sum + p, 0) / priceValues.length;
  const volatility = calculateStandardDeviation(priceValues);
  const trend = analyzeTrend(priceValues);

  return {
    productId,
    storeId,
    currentPrice: prices[prices.length - 1].price,
    averagePrice,
    minPrice,
    maxPrice,
    priceRange: maxPrice - minPrice,
    volatility,
    trendDirection: trend.direction,
    trendPercentage: trend.percentage,
    dataPoints: prices.length,
    firstRecordedDate: prices[0].createdAt,
    lastRecordedDate: prices[prices.length - 1].createdAt,
  };
}

/**
 * Get detailed price history data points
 * @param productId - Product ID
 * @param storeId - Store ID
 * @param days - Number of days to retrieve
 * @param minConfidence - Minimum confidence score filter
 * @returns Array of price data points
 */
export async function getPriceHistory(
  productId: string,
  storeId: string,
  days: number = 90,
  minConfidence: number = 0
): Promise<PriceDataPoint[]> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const prices = await prisma.productPrice.findMany({
    where: {
      productId,
      storeId,
      isActive: true,
      confidenceScore: {
        gte: minConfidence,
      },
      createdAt: {
        gte: cutoffDate,
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  return prices.map(p => ({
    date: p.createdAt,
    price: p.price,
    confidenceScore: p.confidenceScore,
    source: p.source,
  }));
}

/**
 * Get aggregated price history across all stores for a product
 * @param productId - Product ID
 * @param days - Number of days to analyze
 * @returns Statistics grouped by store
 */
export async function getAggregatedPriceHistory(
  productId: string,
  days: number = 90
) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const prices = await prisma.productPrice.findMany({
    where: {
      productId,
      isActive: true,
      createdAt: {
        gte: cutoffDate,
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  // Group by store
  const byStore = prices.reduce((acc, price) => {
    if (!acc[price.storeId]) {
      acc[price.storeId] = [];
    }
    acc[price.storeId].push(price);
    return acc;
  }, {} as Record<string, typeof prices>);

  // Calculate stats for each store
  const storeStats = await Promise.all(
    Object.entries(byStore).map(async ([storeId, storePrices]) => {
      const priceValues = storePrices.map(p => p.price);
      const currentPrice = storePrices[storePrices.length - 1].price;
      const avgPrice = priceValues.reduce((sum, p) => sum + p, 0) / priceValues.length;

      return {
        storeId,
        currentPrice,
        averagePrice: avgPrice,
        minPrice: Math.min(...priceValues),
        maxPrice: Math.max(...priceValues),
        dataPoints: storePrices.length,
      };
    })
  );

  // Overall stats
  const allPrices = prices.map(p => p.price);
  const overallAvg = allPrices.reduce((sum, p) => sum + p, 0) / allPrices.length;

  return {
    productId,
    overallAverage: overallAvg,
    overallMin: Math.min(...allPrices),
    overallMax: Math.max(...allPrices),
    storeCount: Object.keys(byStore).length,
    totalDataPoints: prices.length,
    stores: storeStats,
  };
}

/**
 * Get price comparison across stores for a product
 * @param productId - Product ID
 * @returns Current prices at each store, sorted by price
 */
export async function getPriceComparison(productId: string) {
  // Get most recent price for each store
  const prices = await prisma.productPrice.findMany({
    where: {
      productId,
      isActive: true,
      isFresh: true, // Only fresh prices
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Get unique stores with their latest price
  const storeLatestPrices = new Map<string, typeof prices[0]>();
  
  for (const price of prices) {
    if (!storeLatestPrices.has(price.storeId)) {
      storeLatestPrices.set(price.storeId, price);
    }
  }

  // Convert to array and sort by price
  const comparison = Array.from(storeLatestPrices.values())
    .map(p => ({
      storeId: p.storeId,
      price: p.price,
      confidenceScore: p.confidenceScore,
      updatedAt: p.createdAt,
      source: p.source,
    }))
    .sort((a, b) => a.price - b.price);

  const lowestPrice = comparison[0]?.price || 0;
  const highestPrice = comparison[comparison.length - 1]?.price || 0;
  const avgPrice = comparison.reduce((sum, p) => sum + p.price, 0) / comparison.length;

  return {
    productId,
    lowestPrice,
    highestPrice,
    averagePrice: avgPrice,
    priceRange: highestPrice - lowestPrice,
    storeCount: comparison.length,
    stores: comparison,
  };
}

/**
 * Track price volatility over time
 * @param productId - Product ID
 * @param storeId - Store ID
 * @param days - Analysis period
 * @returns Volatility metrics
 */
export async function trackVolatility(
  productId: string,
  storeId: string,
  days: number = 90
) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const prices = await prisma.productPrice.findMany({
    where: {
      productId,
      storeId,
      isActive: true,
      createdAt: {
        gte: cutoffDate,
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  if (prices.length < 2) {
    return {
      volatilityScore: 0,
      isStable: true,
      riskLevel: 'LOW' as const,
    };
  }

  const priceValues = prices.map(p => p.price);
  const volatility = calculateStandardDeviation(priceValues);
  const avgPrice = priceValues.reduce((sum, p) => sum + p, 0) / priceValues.length;
  const volatilityPercentage = (volatility / avgPrice) * 100;

  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  if (volatilityPercentage < 5) riskLevel = 'LOW';
  else if (volatilityPercentage < 15) riskLevel = 'MEDIUM';
  else riskLevel = 'HIGH';

  return {
    volatilityScore: volatility,
    volatilityPercentage,
    isStable: volatilityPercentage < 10,
    riskLevel,
    priceSwings: Math.max(...priceValues) - Math.min(...priceValues),
  };
}
