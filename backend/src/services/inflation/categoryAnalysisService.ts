/**
 * Category Analysis Service
 * Analyzes price trends and volatility by product category
 */

import { Territory, ProductCategory, PRODUCT_CATEGORIES } from '../../config/inflationConfig.js';
import { prisma } from '../../app.js';

/**
 * Category trend analysis result
 */
export interface CategoryTrend {
  category: ProductCategory;
  territory: Territory;
  currentIndex: number;
  previousIndex: number;
  change: number;
  changePercent: number;
  volatility: number;
  trend: 'rising' | 'falling' | 'stable';
}

/**
 * Category volatility metrics
 */
export interface CategoryVolatility {
  category: ProductCategory;
  standardDeviation: number;
  variance: number;
  coefficientOfVariation: number;
}

/**
 * Analyze category trends for a territory
 */
export async function analyzeCategoryTrends(
  territory: Territory,
  year: number,
  month: number,
  periodsBack: number = 3
): Promise<CategoryTrend[]> {
  try {
    const trends: CategoryTrend[] = [];

    for (const category of PRODUCT_CATEGORIES) {
      // Get current period index
      const current = await prisma.categoryIndex.findUnique({
        where: {
          territory_category_year_month: {
            territory,
            category,
            year,
            month,
          },
        },
      });

      if (!current) continue;

      // Get previous period index
      const prevDate = new Date(year, month - 2, 1); // month - 1 for previous, -1 for 0-index
      const previous = await prisma.categoryIndex.findUnique({
        where: {
          territory_category_year_month: {
            territory,
            category,
            year: prevDate.getFullYear(),
            month: prevDate.getMonth() + 1,
          },
        },
      });

      const previousIndex = previous?.indexValue || current.indexValue;
      const change = current.indexValue - previousIndex;
      const changePercent = previousIndex !== 0 ? (change / previousIndex) * 100 : 0;

      // Calculate volatility
      const volatility = await calculateCategoryVolatility(territory, category, periodsBack);

      // Determine trend
      let trend: 'rising' | 'falling' | 'stable';
      if (Math.abs(changePercent) < 0.5) {
        trend = 'stable';
      } else if (changePercent > 0) {
        trend = 'rising';
      } else {
        trend = 'falling';
      }

      trends.push({
        category,
        territory,
        currentIndex: current.indexValue,
        previousIndex,
        change,
        changePercent,
        volatility: volatility.standardDeviation,
        trend,
      });
    }

    return trends;
  } catch (error) {
    console.error('[CategoryAnalysis] Error analyzing category trends:', error);
    throw error;
  }
}

/**
 * Calculate volatility for a category
 */
async function calculateCategoryVolatility(
  territory: Territory,
  category: ProductCategory,
  periods: number
): Promise<CategoryVolatility> {
  try {
    const now = new Date();
    const indices: number[] = [];

    for (let i = 0; i < periods; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const categoryIndex = await prisma.categoryIndex.findUnique({
        where: {
          territory_category_year_month: {
            territory,
            category,
            year: date.getFullYear(),
            month: date.getMonth() + 1,
          },
        },
      });

      if (categoryIndex) {
        indices.push(categoryIndex.indexValue);
      }
    }

    if (indices.length === 0) {
      return {
        category,
        standardDeviation: 0,
        variance: 0,
        coefficientOfVariation: 0,
      };
    }

    // Calculate mean
    const mean = indices.reduce((sum, val) => sum + val, 0) / indices.length;

    // Calculate variance
    const variance = indices.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / indices.length;

    // Calculate standard deviation
    const standardDeviation = Math.sqrt(variance);

    // Calculate coefficient of variation
    const coefficientOfVariation = mean !== 0 ? (standardDeviation / mean) * 100 : 0;

    return {
      category,
      standardDeviation,
      variance,
      coefficientOfVariation,
    };
  } catch (error) {
    console.error('[CategoryAnalysis] Error calculating volatility:', error);
    throw error;
  }
}

/**
 * Get most volatile categories
 */
export async function getMostVolatileCategories(
  territory: Territory,
  periods: number = 6,
  limit: number = 5
): Promise<CategoryVolatility[]> {
  try {
    const volatilities: CategoryVolatility[] = [];

    for (const category of PRODUCT_CATEGORIES) {
      const volatility = await calculateCategoryVolatility(territory, category, periods);
      volatilities.push(volatility);
    }

    // Sort by standard deviation (highest first)
    return volatilities
      .sort((a, b) => b.standardDeviation - a.standardDeviation)
      .slice(0, limit);
  } catch (error) {
    console.error('[CategoryAnalysis] Error getting volatile categories:', error);
    throw error;
  }
}

/**
 * Compare category performance across territories
 */
export async function compareCategoriesAcrossTerritories(
  category: ProductCategory,
  year: number,
  month: number,
  territories: Territory[]
): Promise<Map<Territory, number>> {
  try {
    const indices = new Map<Territory, number>();

    for (const territory of territories) {
      const categoryIndex = await prisma.categoryIndex.findUnique({
        where: {
          territory_category_year_month: {
            territory,
            category,
            year,
            month,
          },
        },
      });

      if (categoryIndex) {
        indices.set(territory, categoryIndex.indexValue);
      }
    }

    return indices;
  } catch (error) {
    console.error('[CategoryAnalysis] Error comparing categories:', error);
    throw error;
  }
}
