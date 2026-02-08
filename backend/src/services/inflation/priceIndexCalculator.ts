/**
 * Price Index Calculator Service
 * Calculates weighted price indices for DOM-TOM territories
 */

import { 
  REFERENCE_BASKET, 
  CATEGORY_WEIGHTS, 
  BASE_INDEX,
  Territory,
  ProductCategory 
} from '../../config/inflationConfig.js';

/**
 * Product price data structure
 */
export interface ProductPrice {
  productCode: string;
  price: number;
  territory: string;
  date: Date;
}

/**
 * Category price index result
 */
export interface CategoryPriceIndex {
  category: ProductCategory;
  indexValue: number;
  weight: number;
  contribution: number; // Contribution to overall inflation
}

/**
 * Overall price index result
 */
export interface PriceIndexResult {
  territory: Territory;
  year: number;
  month: number;
  indexValue: number;
  inflationRate: number; // Year-over-year
  monthlyChange: number; // Month-over-month
  categoryIndices: CategoryPriceIndex[];
}

/**
 * Calculate weighted price index for a territory
 */
export async function calculatePriceIndex(
  territory: Territory,
  year: number,
  month: number,
  prices: ProductPrice[]
): Promise<PriceIndexResult> {
  // Group prices by category
  const pricesByCategory = new Map<ProductCategory, ProductPrice[]>();
  
  for (const categoryDef of REFERENCE_BASKET) {
    const categoryPrices = prices.filter(p => 
      categoryDef.products.includes(p.productCode)
    );
    pricesByCategory.set(categoryDef.category, categoryPrices);
  }

  // Calculate index for each category
  const categoryIndices: CategoryPriceIndex[] = [];
  let weightedSum = 0;
  let totalWeight = 0;

  for (const categoryDef of REFERENCE_BASKET) {
    const categoryPrices = pricesByCategory.get(categoryDef.category) || [];
    
    if (categoryPrices.length === 0) {
      console.warn(`[PriceIndex] No prices found for category ${categoryDef.category} in ${territory}`);
      continue;
    }

    // Calculate average price for this category
    const avgPrice = categoryPrices.reduce((sum, p) => sum + p.price, 0) / categoryPrices.length;
    
    // Calculate category index (relative to base)
    // In production, this would compare to base period prices
    const categoryIndex = avgPrice; // Simplified for now
    
    const weight = categoryDef.weight;
    const contribution = (categoryIndex * weight) / 100;
    
    categoryIndices.push({
      category: categoryDef.category,
      indexValue: categoryIndex,
      weight,
      contribution,
    });

    weightedSum += contribution;
    totalWeight += weight;
  }

  // Calculate overall index
  const indexValue = totalWeight > 0 ? (weightedSum / totalWeight) * 100 : BASE_INDEX.value;

  // In production, calculate actual inflation rates from historical data
  // For now, using placeholder values
  const inflationRate = 0; // Year-over-year
  const monthlyChange = 0; // Month-over-month

  return {
    territory,
    year,
    month,
    indexValue,
    inflationRate,
    monthlyChange,
    categoryIndices,
  };
}

/**
 * Calculate category-level index
 */
export async function calculateCategoryIndex(
  territory: Territory,
  category: ProductCategory,
  year: number,
  month: number,
  prices: ProductPrice[]
): Promise<CategoryPriceIndex> {
  const categoryDef = REFERENCE_BASKET.find(c => c.category === category);
  
  if (!categoryDef) {
    throw new Error(`Invalid category: ${category}`);
  }

  const categoryPrices = prices.filter(p => 
    categoryDef.products.includes(p.productCode)
  );

  if (categoryPrices.length === 0) {
    throw new Error(`No prices found for category ${category} in ${territory}`);
  }

  const avgPrice = categoryPrices.reduce((sum, p) => sum + p.price, 0) / categoryPrices.length;
  const indexValue = avgPrice; // Simplified
  const weight = categoryDef.weight;
  const contribution = (indexValue * weight) / 100;

  return {
    category,
    indexValue,
    weight,
    contribution,
  };
}

/**
 * Calculate inflation rate between two periods
 */
export function calculateInflationRate(
  currentIndex: number,
  previousIndex: number
): number {
  if (previousIndex === 0) return 0;
  return ((currentIndex - previousIndex) / previousIndex) * 100;
}

/**
 * Calculate contribution of a category to overall inflation
 */
export function calculateCategoryContribution(
  categoryIndex: number,
  weight: number,
  overallIndex: number
): number {
  return ((categoryIndex * weight) / 100 / overallIndex) * 100;
}

/**
 * Validate price data completeness
 */
export function validatePriceData(
  prices: ProductPrice[],
  territory: Territory
): { isValid: boolean; missingProducts: string[] } {
  const allProducts = REFERENCE_BASKET.flatMap(c => c.products);
  const availableProducts = new Set(prices.map(p => p.productCode));
  
  const missingProducts = allProducts.filter(p => !availableProducts.has(p));
  
  return {
    isValid: missingProducts.length === 0,
    missingProducts,
  };
}
