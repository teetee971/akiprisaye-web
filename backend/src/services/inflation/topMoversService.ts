/**
 * Top Movers Service
 * 
 * Tracks products with the biggest price changes.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface TopMover {
  productName: string;
  category: string;
  categoryName: string;
  oldPrice: number;
  newPrice: number;
  change: number;              // Percentage change
  changeAmount: number;        // Absolute change in euros
  lastUpdated: Date;
}

export interface TopMoversResult {
  territory: string;
  period: string;
  topIncreases: TopMover[];
  topDecreases: TopMover[];
  biggestIncrease: TopMover | null;
  biggestDecrease: TopMover | null;
}

/**
 * Get top price movers for a territory and period
 */
export async function getTopMovers(
  territory: string,
  period: string,
  limit: number = 10
): Promise<TopMoversResult> {
  try {
    // In a real implementation, this would query actual product price changes
    // For now, we'll generate mock data based on category trends
    
    const categoryIndices = await prisma.categoryIndex.findMany({
      where: {
        territory,
        period,
      },
      orderBy: {
        monthlyChange: 'desc',
      },
    });

    // Generate mock top movers based on category data
    const allMovers: TopMover[] = generateMockTopMovers(categoryIndices, period);

    // Separate increases and decreases
    const increases = allMovers
      .filter(m => m.change > 0)
      .sort((a, b) => b.change - a.change)
      .slice(0, limit);

    const decreases = allMovers
      .filter(m => m.change < 0)
      .sort((a, b) => a.change - b.change)
      .slice(0, limit);

    return {
      territory,
      period,
      topIncreases: increases,
      topDecreases: decreases,
      biggestIncrease: increases[0] || null,
      biggestDecrease: decreases[0] || null,
    };
  } catch (error) {
    console.error(`Error getting top movers for ${territory}:`, error);
    throw error;
  }
}

/**
 * Generate mock top movers data based on category indices
 */
function generateMockTopMovers(
  categoryIndices: any[],
  period: string
): TopMover[] {
  const mockProducts = [
    { name: 'Beurre doux 250g', category: 'dairy', basePrice: 2.50 },
    { name: 'Lait demi-écrémé 1L', category: 'dairy', basePrice: 1.20 },
    { name: 'Yaourt nature x4', category: 'dairy', basePrice: 1.80 },
    { name: 'Poulet fermier (kg)', category: 'meat', basePrice: 8.50 },
    { name: 'Steak haché 15% (kg)', category: 'meat', basePrice: 12.00 },
    { name: 'Jambon blanc 4 tranches', category: 'meat', basePrice: 2.30 },
    { name: 'Baguette tradition', category: 'bread', basePrice: 1.10 },
    { name: 'Pain de mie 500g', category: 'bread', basePrice: 1.50 },
    { name: 'Riz long grain 1kg', category: 'grocery', basePrice: 2.20 },
    { name: 'Pâtes spaghetti 500g', category: 'grocery', basePrice: 1.30 },
    { name: 'Huile tournesol 1L', category: 'grocery', basePrice: 2.80 },
    { name: 'Tomates (kg)', category: 'fruits_vegetables', basePrice: 3.20 },
    { name: 'Bananes (kg)', category: 'fruits_vegetables', basePrice: 2.10 },
    { name: 'Pommes (kg)', category: 'fruits_vegetables', basePrice: 2.80 },
    { name: 'Eau minérale 1.5L x6', category: 'beverages', basePrice: 3.50 },
    { name: 'Jus d\'orange 1L', category: 'beverages', basePrice: 2.40 },
    { name: 'Savon de Marseille', category: 'hygiene', basePrice: 1.80 },
    { name: 'Shampoing 250ml', category: 'hygiene', basePrice: 3.20 },
  ];

  const movers: TopMover[] = [];

  for (const product of mockProducts) {
    const categoryIndex = categoryIndices.find(c => c.category === product.category);
    
    if (!categoryIndex) continue;

    // Apply category change with some randomness
    const categoryChange = categoryIndex.monthlyChange;
    const randomFactor = 0.5 + Math.random(); // 0.5 to 1.5x category change
    const productChange = categoryChange * randomFactor;
    
    const oldPrice = product.basePrice;
    const newPrice = oldPrice * (1 + productChange / 100);
    const changeAmount = newPrice - oldPrice;

    movers.push({
      productName: product.name,
      category: product.category,
      categoryName: categoryIndex.categoryName,
      oldPrice: Math.round(oldPrice * 100) / 100,
      newPrice: Math.round(newPrice * 100) / 100,
      change: Math.round(productChange * 100) / 100,
      changeAmount: Math.round(changeAmount * 100) / 100,
      lastUpdated: new Date(),
    });
  }

  return movers;
}

/**
 * Get top movers by category
 */
export async function getTopMoversByCategory(
  territory: string,
  period: string,
  category: string,
  limit: number = 5
): Promise<TopMoversResult> {
  try {
    const allMovers = await getTopMovers(territory, period, 100);

    // Filter by category
    const categoryIncreases = allMovers.topIncreases
      .filter(m => m.category === category)
      .slice(0, limit);

    const categoryDecreases = allMovers.topDecreases
      .filter(m => m.category === category)
      .slice(0, limit);

    return {
      territory,
      period,
      topIncreases: categoryIncreases,
      topDecreases: categoryDecreases,
      biggestIncrease: categoryIncreases[0] || null,
      biggestDecrease: categoryDecreases[0] || null,
    };
  } catch (error) {
    console.error(`Error getting top movers for category ${category}:`, error);
    throw error;
  }
}

/**
 * Get alert-worthy price spikes (changes > threshold)
 */
export async function getPriceAlerts(
  territory: string,
  period: string,
  threshold: number = 10
): Promise<TopMover[]> {
  try {
    const movers = await getTopMovers(territory, period, 100);
    
    // Get products with changes exceeding threshold
    const alerts = [
      ...movers.topIncreases.filter(m => m.change >= threshold),
      ...movers.topDecreases.filter(m => Math.abs(m.change) >= threshold),
    ];

    // Sort by absolute change descending
    return alerts.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
  } catch (error) {
    console.error(`Error getting price alerts for ${territory}:`, error);
    return [];
  }
}

/**
 * Compare top movers across territories
 */
export async function compareTopMoversAcrossTerritories(
  period: string,
  limit: number = 5
): Promise<Record<string, TopMoversResult>> {
  const results: Record<string, TopMoversResult> = {};

  // Get top movers for main DOM-TOM territories
  const territories = ['GP', 'MQ', 'GF', 'RE', 'YT'];

  for (const territory of territories) {
    try {
      results[territory] = await getTopMovers(territory, period, limit);
    } catch (error) {
      console.error(`Error getting top movers for ${territory}:`, error);
    }
  }

  return results;
}
