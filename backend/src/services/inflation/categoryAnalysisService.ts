/**
 * Category Analysis Service
 * 
 * Analyzes inflation trends by product category.
 */

import { PrismaClient } from '@prisma/client';
import { INFLATION_CONFIG, getCategoryMetadata } from '../../config/inflationConfig.js';

const prisma = new PrismaClient();

export interface CategoryTrend {
  period: string;
  indexValue: number;
  change: number;
}

export interface TopProduct {
  productName: string;
  priceChange: number;
  oldPrice: number;
  newPrice: number;
}

export interface CategoryInflation {
  category: string;
  categoryName: string;
  icon: string;
  territory: string;
  period: string;
  indexValue: number;
  monthlyChange: number;
  yearlyChange: number;
  averagePrice: number;
  productCount: number;
  trend: CategoryTrend[];
  topIncreases: TopProduct[];
  topDecreases: TopProduct[];
}

/**
 * Get inflation data for a specific category
 */
export async function getCategoryInflation(
  territory: string,
  period: string,
  category: string
): Promise<CategoryInflation> {
  try {
    // Get current category index
    const categoryIndex = await prisma.categoryIndex.findFirst({
      where: {
        territory,
        period,
        category,
      },
    });

    if (!categoryIndex) {
      throw new Error(`No category index found for ${category} in ${territory} ${period}`);
    }

    // Get category metadata
    const metadata = getCategoryMetadata(category);

    // Get historical trend (last 12 months)
    const trend = await getCategoryTrend(territory, category, period, 12);

    // Get top movers for this category
    const { topIncreases, topDecreases } = await getCategoryTopMovers(
      territory,
      category,
      period
    );

    return {
      category,
      categoryName: metadata?.name || category,
      icon: metadata?.icon || '📦',
      territory,
      period,
      indexValue: categoryIndex.indexValue,
      monthlyChange: categoryIndex.monthlyChange,
      yearlyChange: categoryIndex.yearlyChange,
      averagePrice: 0, // Mock: to be calculated from actual product prices
      productCount: categoryIndex.productCount,
      trend,
      topIncreases,
      topDecreases,
    };
  } catch (error) {
    console.error(`Error getting category inflation for ${category}:`, error);
    throw error;
  }
}

/**
 * Get inflation data for all categories
 */
export async function getAllCategoriesInflation(
  territory: string,
  period: string
): Promise<CategoryInflation[]> {
  try {
    const categoryIndices = await prisma.categoryIndex.findMany({
      where: {
        territory,
        period,
      },
      orderBy: {
        yearlyChange: 'desc',
      },
    });

    const categories: CategoryInflation[] = [];

    for (const categoryIndex of categoryIndices) {
      try {
        const categoryInflation = await getCategoryInflation(
          territory,
          period,
          categoryIndex.category
        );
        categories.push(categoryInflation);
      } catch (error) {
        console.error(`Error processing category ${categoryIndex.category}:`, error);
      }
    }

    return categories;
  } catch (error) {
    console.error('Error getting all categories inflation:', error);
    return [];
  }
}

/**
 * Get historical trend for a category
 */
async function getCategoryTrend(
  territory: string,
  category: string,
  endPeriod: string,
  months: number
): Promise<CategoryTrend[]> {
  try {
    // Calculate start period
    const endDate = new Date(endPeriod + '-01');
    const startDate = new Date(endDate);
    startDate.setMonth(startDate.getMonth() - months);
    
    const startPeriod = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`;

    const indices = await prisma.categoryIndex.findMany({
      where: {
        territory,
        category,
        period: {
          gte: startPeriod,
          lte: endPeriod,
        },
      },
      orderBy: {
        period: 'asc',
      },
    });

    return indices.map(index => ({
      period: index.period,
      indexValue: index.indexValue,
      change: index.monthlyChange,
    }));
  } catch (error) {
    console.error(`Error getting category trend for ${category}:`, error);
    return [];
  }
}

/**
 * Get top movers for a category (mock data)
 */
async function getCategoryTopMovers(
  territory: string,
  category: string,
  period: string
): Promise<{ topIncreases: TopProduct[]; topDecreases: TopProduct[] }> {
  // Mock data - in real implementation, this would query actual product prices
  const mockIncreases: TopProduct[] = [
    {
      productName: 'Produit A',
      priceChange: 8.5,
      oldPrice: 2.50,
      newPrice: 2.71,
    },
    {
      productName: 'Produit B',
      priceChange: 6.2,
      oldPrice: 4.20,
      newPrice: 4.46,
    },
    {
      productName: 'Produit C',
      priceChange: 5.1,
      oldPrice: 3.10,
      newPrice: 3.26,
    },
  ];

  const mockDecreases: TopProduct[] = [
    {
      productName: 'Produit X',
      priceChange: -4.2,
      oldPrice: 3.80,
      newPrice: 3.64,
    },
    {
      productName: 'Produit Y',
      priceChange: -2.8,
      oldPrice: 5.50,
      newPrice: 5.35,
    },
    {
      productName: 'Produit Z',
      priceChange: -1.5,
      oldPrice: 2.00,
      newPrice: 1.97,
    },
  ];

  return {
    topIncreases: mockIncreases,
    topDecreases: mockDecreases,
  };
}

/**
 * Compare categories across territories
 */
export async function compareCategoriesAcrossTerritories(
  period: string,
  category: string
): Promise<{
  category: string;
  categoryName: string;
  territories: Array<{
    territory: string;
    territoryName: string;
    indexValue: number;
    yearlyChange: number;
  }>;
}> {
  try {
    const indices = await prisma.categoryIndex.findMany({
      where: {
        category,
        period,
      },
      orderBy: {
        yearlyChange: 'desc',
      },
    });

    const metadata = getCategoryMetadata(category);

    return {
      category,
      categoryName: metadata?.name || category,
      territories: indices.map(index => ({
        territory: index.territory,
        territoryName: INFLATION_CONFIG.territoryNames[index.territory as keyof typeof INFLATION_CONFIG.territoryNames] || index.territory,
        indexValue: index.indexValue,
        yearlyChange: index.yearlyChange,
      })),
    };
  } catch (error) {
    console.error(`Error comparing category ${category} across territories:`, error);
    throw error;
  }
}

/**
 * Get category with highest/lowest inflation
 */
export async function getCategoryExtremes(
  territory: string,
  period: string
): Promise<{
  highest: CategoryInflation | null;
  lowest: CategoryInflation | null;
}> {
  try {
    const categories = await getAllCategoriesInflation(territory, period);
    
    if (categories.length === 0) {
      return { highest: null, lowest: null };
    }

    const sorted = [...categories].sort((a, b) => b.yearlyChange - a.yearlyChange);

    return {
      highest: sorted[0] || null,
      lowest: sorted[sorted.length - 1] || null,
    };
  } catch (error) {
    console.error('Error getting category extremes:', error);
    return { highest: null, lowest: null };
  }
}
