/**
 * Top Movers Service
 * Tracks products with significant price changes
 */

import { Territory, ProductCategory } from '../../config/inflationConfig.js';
import { prisma } from '../../app.js';

/**
 * Price mover data
 */
export interface PriceMover {
  productCode: string;
  productName: string;
  category: ProductCategory;
  currentPrice: number;
  previousPrice: number;
  change: number;
  changePercent: number;
  territory: Territory;
}

/**
 * Top movers result
 */
export interface TopMoversResult {
  territory: Territory;
  year: number;
  month: number;
  topIncreases: PriceMover[];
  topDecreases: PriceMover[];
}

/**
 * Get products with biggest price changes
 */
export async function getTopMovers(
  territory: Territory,
  year: number,
  month: number,
  limit: number = 10
): Promise<TopMoversResult> {
  try {
    // In production, this would query actual product price data
    // For now, returning mock data structure
    
    const topIncreases: PriceMover[] = [];
    const topDecreases: PriceMover[] = [];

    // TODO: Implement actual queries when product price data is available
    console.log(`[TopMovers] Getting top movers for ${territory} ${year}-${month}`);

    return {
      territory,
      year,
      month,
      topIncreases,
      topDecreases,
    };
  } catch (error) {
    console.error('[TopMovers] Error getting top movers:', error);
    throw error;
  }
}

/**
 * Track price movements over time
 */
export async function trackPriceMovements(
  territory: Territory,
  productCode: string,
  months: number = 12
): Promise<Array<{ year: number; month: number; price: number; change: number }>> {
  try {
    const movements: Array<{ year: number; month: number; price: number; change: number }> = [];
    
    // TODO: Implement actual price tracking
    console.log(`[TopMovers] Tracking price movements for ${productCode} in ${territory}`);

    return movements;
  } catch (error) {
    console.error('[TopMovers] Error tracking price movements:', error);
    throw error;
  }
}

/**
 * Identify products at risk of sharp increases
 */
export async function identifyAtRiskProducts(
  territory: Territory,
  threshold: number = 5 // 5% increase threshold
): Promise<PriceMover[]> {
  try {
    const atRiskProducts: PriceMover[] = [];
    
    // TODO: Implement risk detection algorithm
    console.log(`[TopMovers] Identifying at-risk products in ${territory} (threshold: ${threshold}%)`);

    return atRiskProducts;
  } catch (error) {
    console.error('[TopMovers] Error identifying at-risk products:', error);
    throw error;
  }
}

/**
 * Get products with sustained trends
 */
export async function getProductsWithSustainedTrends(
  territory: Territory,
  direction: 'up' | 'down',
  consecutiveMonths: number = 3
): Promise<PriceMover[]> {
  try {
    const trendinProducts: PriceMover[] = [];
    
    // TODO: Implement trend detection
    console.log(`[TopMovers] Finding products with ${direction} trends over ${consecutiveMonths} months`);

    return trendinProducts;
  } catch (error) {
    console.error('[TopMovers] Error getting sustained trends:', error);
    throw error;
  }
}
