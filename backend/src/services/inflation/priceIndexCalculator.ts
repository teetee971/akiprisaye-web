/**
 * Price Index Calculator Service
 * 
 * Calculates price indices based on a reference basket of products
 * for DOM-TOM territories.
 */

import { PrismaClient } from '@prisma/client';
import { 
  REFERENCE_BASKET, 
  INFLATION_CONFIG, 
  formatPeriod, 
  parsePeriod,
  BASKET_PRODUCT_MAPPING 
} from '../../config/inflationConfig.js';

const prisma = new PrismaClient();

export interface PriceIndex {
  territory: string;
  period: string;              // Format: "2026-02"
  indexValue: number;          // Base 100
  monthlyChange: number;       // % vs mois précédent
  yearlyChange: number;        // % vs même mois année précédente
  basketPrice: number;         // Prix du panier type en €
  productCount: number;        // Nombre de produits dans le calcul
  confidence: number;          // Score de confiance (0-100)
}

/**
 * Calculate average price for a product in a territory during a period
 */
async function getProductAveragePrice(
  productPattern: string,
  territory: string,
  period: string
): Promise<number | null> {
  try {
    // In a real implementation, this would query actual price data
    // For now, we'll use mock data from seed files
    // TODO: Integrate with actual price observation data
    
    // Placeholder: Return null to indicate no data
    return null;
  } catch (error) {
    console.error(`Error getting price for ${productPattern} in ${territory}:`, error);
    return null;
  }
}

/**
 * Calculate the weighted basket price for a territory
 */
async function calculateBasketPrice(
  territory: string,
  period: string
): Promise<{ price: number; productCount: number; confidence: number }> {
  let totalWeightedPrice = 0;
  let totalWeight = 0;
  let productsFound = 0;
  let totalProducts = 0;

  for (const category of REFERENCE_BASKET) {
    for (const productId of category.products) {
      totalProducts++;
      const pattern = BASKET_PRODUCT_MAPPING[productId];
      
      if (!pattern) {
        console.warn(`No mapping found for product: ${productId}`);
        continue;
      }

      const price = await getProductAveragePrice(pattern, territory, period);
      
      if (price !== null) {
        // Weight is distributed equally among products in the category
        const productWeight = category.weight / category.products.length;
        totalWeightedPrice += price * productWeight;
        totalWeight += productWeight;
        productsFound++;
      }
    }
  }

  // Calculate confidence score based on data availability
  const confidence = (productsFound / totalProducts) * 100;
  
  // Normalize the price if we don't have all products
  const basketPrice = totalWeight > 0 ? (totalWeightedPrice / totalWeight) * 100 : 0;

  return {
    price: basketPrice,
    productCount: productsFound,
    confidence: Math.round(confidence),
  };
}

/**
 * Calculate price index for a territory and period
 */
export async function calculatePriceIndex(
  territory: string,
  period: string
): Promise<PriceIndex> {
  try {
    // Get current basket price
    const current = await calculateBasketPrice(territory, period);
    
    // Get base period price (January 2024)
    const basePeriod = `${INFLATION_CONFIG.baseYear}-${String(INFLATION_CONFIG.baseMonth).padStart(2, '0')}`;
    const base = await calculateBasketPrice(territory, basePeriod);
    
    // Calculate index value (base 100)
    const indexValue = base.price > 0 
      ? (current.price / base.price) * INFLATION_CONFIG.baseValue 
      : INFLATION_CONFIG.baseValue;
    
    // Calculate monthly change
    const previousDate = new Date(parsePeriod(period));
    previousDate.setMonth(previousDate.getMonth() - 1);
    const previousPeriod = formatPeriod(previousDate);
    
    const previousIndex = await prisma.priceIndex.findUnique({
      where: {
        territory_period: {
          territory,
          period: previousPeriod,
        },
      },
    });
    
    const monthlyChange = previousIndex 
      ? ((indexValue - previousIndex.indexValue) / previousIndex.indexValue) * 100 
      : 0;
    
    // Calculate yearly change
    const yearAgoDate = new Date(parsePeriod(period));
    yearAgoDate.setFullYear(yearAgoDate.getFullYear() - 1);
    const yearAgoPeriod = formatPeriod(yearAgoDate);
    
    const yearAgoIndex = await prisma.priceIndex.findUnique({
      where: {
        territory_period: {
          territory,
          period: yearAgoPeriod,
        },
      },
    });
    
    const yearlyChange = yearAgoIndex 
      ? ((indexValue - yearAgoIndex.indexValue) / yearAgoIndex.indexValue) * 100 
      : 0;

    return {
      territory,
      period,
      indexValue: Math.round(indexValue * 100) / 100,
      monthlyChange: Math.round(monthlyChange * 100) / 100,
      yearlyChange: Math.round(yearlyChange * 100) / 100,
      basketPrice: Math.round(current.price * 100) / 100,
      productCount: current.productCount,
      confidence: current.confidence,
    };
  } catch (error) {
    console.error(`Error calculating price index for ${territory} ${period}:`, error);
    throw error;
  }
}

/**
 * Calculate yearly inflation rate for a territory
 */
export async function calculateYearlyInflation(
  territory: string,
  endPeriod: string
): Promise<number> {
  try {
    const currentIndex = await prisma.priceIndex.findUnique({
      where: {
        territory_period: {
          territory,
          period: endPeriod,
        },
      },
    });

    if (!currentIndex) {
      throw new Error(`No index found for ${territory} ${endPeriod}`);
    }

    return currentIndex.yearlyChange;
  } catch (error) {
    console.error(`Error calculating yearly inflation for ${territory}:`, error);
    throw error;
  }
}

/**
 * Save price index to database
 */
export async function savePriceIndex(priceIndex: PriceIndex): Promise<void> {
  try {
    await prisma.priceIndex.upsert({
      where: {
        territory_period: {
          territory: priceIndex.territory,
          period: priceIndex.period,
        },
      },
      update: {
        indexValue: priceIndex.indexValue,
        basketPrice: priceIndex.basketPrice,
        monthlyChange: priceIndex.monthlyChange,
        yearlyChange: priceIndex.yearlyChange,
        productCount: priceIndex.productCount,
        confidence: priceIndex.confidence,
        updatedAt: new Date(),
      },
      create: {
        territory: priceIndex.territory,
        period: priceIndex.period,
        indexValue: priceIndex.indexValue,
        basketPrice: priceIndex.basketPrice,
        monthlyChange: priceIndex.monthlyChange,
        yearlyChange: priceIndex.yearlyChange,
        productCount: priceIndex.productCount,
        confidence: priceIndex.confidence,
      },
    });
  } catch (error) {
    console.error('Error saving price index:', error);
    throw error;
  }
}

/**
 * Calculate and save indices for all territories for a given period
 */
export async function calculateAllIndices(period: string): Promise<PriceIndex[]> {
  const indices: PriceIndex[] = [];

  for (const territory of INFLATION_CONFIG.territories) {
    try {
      const index = await calculatePriceIndex(territory, period);
      await savePriceIndex(index);
      indices.push(index);
      console.log(`✓ Calculated index for ${territory}: ${index.indexValue}`);
    } catch (error) {
      console.error(`✗ Failed to calculate index for ${territory}:`, error);
    }
  }

  return indices;
}
