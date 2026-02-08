/**
 * Price History Service
 * Manages historical price data and trends
 */

import { PrismaClient, PriceSource } from '@prisma/client';

const prisma = new PrismaClient();

export interface PriceHistoryEntry {
  price: number;
  observedAt: string;
  source: PriceSource;
  change: number;
  changeType: 'increase' | 'decrease' | 'stable';
  confidenceScore: number;
}

export interface PriceHistoryResponse {
  productId: string;
  storeId: string;
  history: PriceHistoryEntry[];
  statistics: {
    minPrice: number;
    maxPrice: number;
    avgPrice: number;
    currentPrice: number;
    priceRange: number;
    volatility: number;
  };
}

/**
 * Calculate price change percentage
 */
function calculateChange(current: number, previous: number): number {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

/**
 * Determine change type
 */
function getChangeType(change: number): 'increase' | 'decrease' | 'stable' {
  if (Math.abs(change) < 0.5) return 'stable'; // Less than 0.5% is considered stable
  return change > 0 ? 'increase' : 'decrease';
}

/**
 * Calculate price volatility (standard deviation)
 */
function calculateVolatility(prices: number[]): number {
  if (prices.length < 2) return 0;
  
  const mean = prices.reduce((sum, p) => sum + p, 0) / prices.length;
  const squaredDiffs = prices.map((p) => Math.pow(p - mean, 2));
  const variance = squaredDiffs.reduce((sum, d) => sum + d, 0) / prices.length;
  const stdDev = Math.sqrt(variance);
  
  return (stdDev / mean) * 100; // Coefficient of variation as percentage
}

/**
 * Get price history for a product at a specific store
 */
export async function getPriceHistory(
  productId: string,
  storeId: string,
  limit: number = 50
): Promise<PriceHistoryResponse> {
  const prices = await prisma.productPrice.findMany({
    where: {
      productId,
      storeId,
      isActive: true,
      verificationStatus: { not: 'DISPUTED' },
    },
    orderBy: {
      observedAt: 'desc',
    },
    take: limit,
    select: {
      price: true,
      observedAt: true,
      source: true,
      confidenceScore: true,
    },
  });
  
  if (prices.length === 0) {
    return {
      productId,
      storeId,
      history: [],
      statistics: {
        minPrice: 0,
        maxPrice: 0,
        avgPrice: 0,
        currentPrice: 0,
        priceRange: 0,
        volatility: 0,
      },
    };
  }
  
  // Build history with changes
  const history: PriceHistoryEntry[] = [];
  for (let i = 0; i < prices.length; i++) {
    const current = prices[i];
    const previous = i < prices.length - 1 ? prices[i + 1] : null;
    
    const change = previous ? calculateChange(current.price, previous.price) : 0;
    
    history.push({
      price: current.price,
      observedAt: current.observedAt.toISOString(),
      source: current.source,
      change,
      changeType: getChangeType(change),
      confidenceScore: current.confidenceScore,
    });
  }
  
  // Calculate statistics
  const priceValues = prices.map((p) => p.price);
  const minPrice = Math.min(...priceValues);
  const maxPrice = Math.max(...priceValues);
  const avgPrice = priceValues.reduce((sum: number, p: number) => sum + p, 0) / priceValues.length;
  const currentPrice = prices[0].price;
  const priceRange = maxPrice - minPrice;
  const volatility = calculateVolatility(priceValues);
  
  return {
    productId,
    storeId,
    history,
    statistics: {
      minPrice,
      maxPrice,
      avgPrice,
      currentPrice,
      priceRange,
      volatility,
    },
  };
}

/**
 * Get aggregated price history across multiple stores
 */
export async function getAggregatedPriceHistory(
  productId: string,
  period: '7d' | '30d' | '90d' | '1y' = '30d'
): Promise<{ date: string; avgPrice: number; minPrice: number; maxPrice: number; count: number }[]> {
  const daysMap = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 };
  const days = daysMap[period];
  
  const since = new Date();
  since.setDate(since.getDate() - days);
  
  const prices = await prisma.productPrice.findMany({
    where: {
      productId,
      observedAt: { gte: since },
      isActive: true,
      verificationStatus: { not: 'DISPUTED' },
    },
    select: {
      price: true,
      observedAt: true,
    },
    orderBy: {
      observedAt: 'asc',
    },
  });
  
  // Group by day
  const grouped = new Map<string, number[]>();
  
  for (const price of prices) {
    const date = price.observedAt.toISOString().split('T')[0];
    if (!grouped.has(date)) {
      grouped.set(date, []);
    }
    grouped.get(date)!.push(price.price);
  }
  
  // Calculate daily statistics
  const result: { date: string; avgPrice: number; minPrice: number; maxPrice: number; count: number }[] = [];
  
  for (const [date, dayPrices] of grouped.entries()) {
    result.push({
      date,
      avgPrice: dayPrices.reduce((sum, p) => sum + p, 0) / dayPrices.length,
      minPrice: Math.min(...dayPrices),
      maxPrice: Math.max(...dayPrices),
      count: dayPrices.length,
    });
  }
  
  return result.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Compare price history between stores
 * @param productId - Product to compare
 * @param storeIds - List of store IDs
 * @param limit - Maximum number of price entries per store (default: 30)
 */
export async function comparePriceHistory(
  productId: string,
  storeIds: string[],
  limit: number = 30
): Promise<Map<string, PriceHistoryResponse>> {
  const results = new Map<string, PriceHistoryResponse>();
  
  for (const storeId of storeIds) {
    const history = await getPriceHistory(productId, storeId, limit);
    results.set(storeId, history);
  }
  
  return results;
}
