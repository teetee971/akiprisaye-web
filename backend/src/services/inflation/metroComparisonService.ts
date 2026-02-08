/**
 * Metro Comparison Service
 * Analyzes price differences between DOM-TOM and Metropolitan France
 */

import { Territory } from '../../config/inflationConfig.js';
import { prisma } from '../../app.js';

/**
 * Price gap analysis result
 */
export interface PriceGapAnalysis {
  territory: Territory;
  year: number;
  month: number;
  domtomIndex: number;
  metroIndex: number;
  priceGapPercent: number;
  absoluteGap: number;
  categoryGaps: CategoryGap[];
}

/**
 * Category-level price gap
 */
export interface CategoryGap {
  category: string;
  domtomIndex: number;
  metroIndex: number;
  gapPercent: number;
}

/**
 * Metro reference price data
 */
export interface MetroReferenceData {
  productCode: string;
  averagePrice: number;
  year: number;
  month: number;
}

/**
 * Calculate price gap between DOM-TOM territory and Metropolitan France
 */
export async function calculateMetroComparison(
  territory: Territory,
  year: number,
  month: number
): Promise<PriceGapAnalysis | null> {
  try {
    // Fetch DOM-TOM price index
    const domtomIndex = await prisma.priceIndex.findUnique({
      where: {
        territory_year_month: {
          territory,
          year,
          month,
        },
      },
    });

    if (!domtomIndex) {
      console.warn(`[MetroComparison] No price index found for ${territory} ${year}-${month}`);
      return null;
    }

    // Fetch category indices for DOM-TOM
    const domtomCategoryIndices = await prisma.categoryIndex.findMany({
      where: {
        territory,
        year,
        month,
      },
    });

    // Calculate metro reference index (base 100)
    // In production, this would be fetched from official statistics
    const metroIndex = 100; // Placeholder

    // Calculate overall price gap
    const priceGapPercent = ((domtomIndex.indexValue - metroIndex) / metroIndex) * 100;
    const absoluteGap = domtomIndex.indexValue - metroIndex;

    // Calculate category-level gaps
    const categoryGaps: CategoryGap[] = domtomCategoryIndices.map(cat => {
      const metroCategoryIndex = 100; // Placeholder
      const gapPercent = ((cat.indexValue - metroCategoryIndex) / metroCategoryIndex) * 100;
      
      return {
        category: cat.category,
        domtomIndex: cat.indexValue,
        metroIndex: metroCategoryIndex,
        gapPercent,
      };
    });

    return {
      territory,
      year,
      month,
      domtomIndex: domtomIndex.indexValue,
      metroIndex,
      priceGapPercent,
      absoluteGap,
      categoryGaps,
    };
  } catch (error) {
    console.error('[MetroComparison] Error calculating metro comparison:', error);
    throw error;
  }
}

/**
 * Get metro reference prices for a period
 */
export async function getMetroReferencePrices(
  year: number,
  month: number
): Promise<MetroReferenceData[]> {
  try {
    const metroPrices = await prisma.metroReferencePrice.findMany({
      where: {
        year,
        month,
      },
    });

    return metroPrices.map(price => ({
      productCode: price.productCode,
      averagePrice: price.averagePrice,
      year: price.year,
      month: price.month,
    }));
  } catch (error) {
    console.error('[MetroComparison] Error fetching metro reference prices:', error);
    throw error;
  }
}

/**
 * Store metro reference prices
 */
export async function storeMetroReferencePrices(
  prices: MetroReferenceData[]
): Promise<void> {
  try {
    for (const price of prices) {
      await prisma.metroReferencePrice.upsert({
        where: {
          productCode_year_month: {
            productCode: price.productCode,
            year: price.year,
            month: price.month,
          },
        },
        update: {
          averagePrice: price.averagePrice,
        },
        create: {
          productCode: price.productCode,
          year: price.year,
          month: price.month,
          averagePrice: price.averagePrice,
        },
      });
    }
    console.log(`[MetroComparison] Stored ${prices.length} metro reference prices`);
  } catch (error) {
    console.error('[MetroComparison] Error storing metro reference prices:', error);
    throw error;
  }
}

/**
 * Calculate historical price gap trend
 */
export async function getMetroComparisonTrend(
  territory: Territory,
  months: number = 12
): Promise<PriceGapAnalysis[]> {
  try {
    const now = new Date();
    const results: PriceGapAnalysis[] = [];

    for (let i = 0; i < months; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;

      const comparison = await calculateMetroComparison(territory, year, month);
      if (comparison) {
        results.push(comparison);
      }
    }

    return results.reverse(); // Chronological order
  } catch (error) {
    console.error('[MetroComparison] Error calculating trend:', error);
    throw error;
  }
}

/**
 * Identify products with highest price gaps
 */
export async function getTopPriceGapProducts(
  territory: Territory,
  year: number,
  month: number,
  limit: number = 10
): Promise<Array<{ productCode: string; gapPercent: number }>> {
  try {
    // In production, this would query actual product prices
    // For now, returning empty array
    return [];
  } catch (error) {
    console.error('[MetroComparison] Error getting top price gap products:', error);
    throw error;
  }
}
