/**
 * Metro Comparison Service
 * 
 * Compares DOM-TOM prices with metropolitan France to track price gaps.
 */

import { PrismaClient } from '@prisma/client';
import { INFLATION_CONFIG, getCategoryMetadata } from '../../config/inflationConfig.js';

const prisma = new PrismaClient();

export interface CategoryGap {
  category: string;
  categoryName: string;
  domPrice: number;
  metroPrice: number;
  gap: number;           // Percentage difference
  gapAmount: number;     // Absolute difference in euros
}

export interface MetroComparison {
  territory: string;
  territoryName: string;
  period: string;
  domIndex: number;
  metroIndex: number;
  overallGap: number;              // Percentage difference
  basketPriceGap: number;          // Absolute difference in basket price
  categoryComparison: CategoryGap[];
  lastUpdate: Date;
}

/**
 * Get metro comparison for a territory and period
 */
export async function getMetroComparison(
  territory: string,
  period: string
): Promise<MetroComparison> {
  try {
    // Get DOM-TOM index
    const domIndex = await prisma.priceIndex.findUnique({
      where: {
        territory_period: {
          territory,
          period,
        },
      },
    });

    // Get metropolitan France index
    const metroIndex = await prisma.priceIndex.findUnique({
      where: {
        territory_period: {
          territory: 'METRO',
          period,
        },
      },
    });

    if (!domIndex) {
      throw new Error(`No index found for ${territory} ${period}`);
    }

    // Use mock metro data if not available
    const metroIndexValue = metroIndex?.indexValue || 100;
    const metroBasketPrice = metroIndex?.basketPrice || 250;

    // Calculate overall gap
    const overallGap = ((domIndex.indexValue - metroIndexValue) / metroIndexValue) * 100;
    const basketPriceGap = domIndex.basketPrice - metroBasketPrice;

    // Get category comparisons
    const categoryComparison = await getCategoryComparisons(territory, period);

    return {
      territory,
      territoryName: INFLATION_CONFIG.territoryNames[territory as keyof typeof INFLATION_CONFIG.territoryNames] || territory,
      period,
      domIndex: domIndex.indexValue,
      metroIndex: metroIndexValue,
      overallGap: Math.round(overallGap * 100) / 100,
      basketPriceGap: Math.round(basketPriceGap * 100) / 100,
      categoryComparison,
      lastUpdate: domIndex.updatedAt || new Date(),
    };
  } catch (error) {
    console.error(`Error getting metro comparison for ${territory}:`, error);
    throw error;
  }
}

/**
 * Get category-level price comparisons
 */
async function getCategoryComparisons(
  territory: string,
  period: string
): Promise<CategoryGap[]> {
  try {
    // Get category indices for DOM-TOM
    const domCategories = await prisma.categoryIndex.findMany({
      where: {
        territory,
        period,
      },
    });

    // Get category indices for metro
    const metroCategories = await prisma.categoryIndex.findMany({
      where: {
        territory: 'METRO',
        period,
      },
    });

    // Combine and calculate gaps
    const gaps: CategoryGap[] = [];
    
    for (const domCat of domCategories) {
      const metroCat = metroCategories.find(m => m.category === domCat.category);
      
      // Mock average prices based on index values
      const domAvgPrice = domCat.indexValue * 2.5;
      const metroAvgPrice = metroCat ? metroCat.indexValue * 2.5 : domAvgPrice * 0.7;

      const gap = ((domAvgPrice - metroAvgPrice) / metroAvgPrice) * 100;
      const gapAmount = domAvgPrice - metroAvgPrice;

      // Get category metadata for display name
      const metadata = getCategoryMetadata(domCat.category);

      gaps.push({
        category: domCat.category,
        categoryName: metadata?.name || domCat.category,
        domPrice: Math.round(domAvgPrice * 100) / 100,
        metroPrice: Math.round(metroAvgPrice * 100) / 100,
        gap: Math.round(gap * 100) / 100,
        gapAmount: Math.round(gapAmount * 100) / 100,
      });
    }

    // Sort by gap descending
    return gaps.sort((a, b) => b.gap - a.gap);
  } catch (error) {
    console.error('Error getting category comparisons:', error);
    return [];
  }
}

/**
 * Get metro comparison for all territories in a period
 */
export async function getAllMetroComparisons(
  period: string
): Promise<MetroComparison[]> {
  const comparisons: MetroComparison[] = [];

  for (const territory of INFLATION_CONFIG.territories) {
    try {
      const comparison = await getMetroComparison(territory, period);
      comparisons.push(comparison);
    } catch (error) {
      console.error(`Error getting metro comparison for ${territory}:`, error);
    }
  }

  return comparisons;
}

/**
 * Get historical metro gap trend
 */
export async function getMetroGapTrend(
  territory: string,
  startPeriod: string,
  endPeriod: string
): Promise<{ period: string; gap: number }[]> {
  try {
    const domIndices = await prisma.priceIndex.findMany({
      where: {
        territory,
        period: {
          gte: startPeriod,
          lte: endPeriod,
        },
      },
      orderBy: {
        period: 'asc',
      },
    });

    const metroIndices = await prisma.priceIndex.findMany({
      where: {
        territory: 'METRO',
        period: {
          gte: startPeriod,
          lte: endPeriod,
        },
      },
      orderBy: {
        period: 'asc',
      },
    });

    const trend = domIndices.map(dom => {
      const metro = metroIndices.find(m => m.period === dom.period);
      const metroValue = metro?.indexValue || 100;
      const gap = ((dom.indexValue - metroValue) / metroValue) * 100;

      return {
        period: dom.period,
        gap: Math.round(gap * 100) / 100,
      };
    });

    return trend;
  } catch (error) {
    console.error(`Error getting metro gap trend for ${territory}:`, error);
    return [];
  }
}
