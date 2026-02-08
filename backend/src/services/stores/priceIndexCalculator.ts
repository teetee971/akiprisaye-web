/**
 * Price Index Calculator Service
 * Calculates price indices using a reference basket of 10 products
 * Normalizes prices to a 0-100 scale for comparison
 */

// Reference basket of 10 products (standardized names)
const REFERENCE_BASKET = [
  'riz_1kg',
  'lait_1l', // x2
  'lait_1l', // second unit
  'pain_500g',
  'oeufs_x6',
  'huile_1l',
  'sucre_1kg',
  'eau_1.5l', // x2
  'eau_1.5l', // second unit
  'pates_500g',
  'beurre_250g',
  'cafe_250g',
];

interface PriceData {
  productKey: string;
  price: number;
  storeName: string;
  storeId?: string;
}

interface PriceIndexResult {
  storeId: string;
  storeName: string;
  basketTotal: number;
  territoryAverage: number;
  priceIndex: number; // 0-100 scale
  category: 'cheap' | 'medium' | 'expensive'; // green/orange/red
  missingProducts: string[];
  productsFound: number;
  productsTotal: number;
}

interface TerritoryStats {
  territory: string;
  averageBasketPrice: number;
  storeCount: number;
  minPrice: number;
  maxPrice: number;
}

/**
 * Calculate the total price of the reference basket for a store
 * @param prices Array of price data for products
 * @returns Object with total price and list of missing products
 */
function calculateBasketTotal(prices: PriceData[]): {
  total: number;
  missingProducts: string[];
  foundCount: number;
} {
  const priceMap = new Map<string, number>();
  
  // Build price map from available prices
  prices.forEach((p) => {
    priceMap.set(p.productKey.toLowerCase(), p.price);
  });

  let total = 0;
  const missingProducts: string[] = [];
  let foundCount = 0;

  // Calculate total for reference basket
  REFERENCE_BASKET.forEach((productKey) => {
    const price = priceMap.get(productKey.toLowerCase());
    if (price !== undefined && price > 0) {
      total += price;
      foundCount++;
    } else {
      if (!missingProducts.includes(productKey)) {
        missingProducts.push(productKey);
      }
    }
  });

  return { total, missingProducts, foundCount };
}

/**
 * Calculate price index for a store relative to territory average
 * Formula: ((store_total - territory_avg) / territory_avg) * 100
 * Normalized to [0, 100] scale
 * @param storeTotal Total basket price for the store
 * @param territoryAverage Average basket price for the territory
 * @returns Price index from 0 (cheapest) to 100 (most expensive)
 */
function calculatePriceIndex(
  storeTotal: number,
  territoryAverage: number
): number {
  if (territoryAverage === 0) {
    return 50; // Neutral if no reference
  }

  // Calculate relative difference
  const relativeDiff = (storeTotal - territoryAverage) / territoryAverage;
  
  // Normalize to 0-100 scale
  // -50% diff -> 0, 0% diff -> 50, +100% diff -> 100
  // Using a scaling factor to map reasonable price ranges
  const scaledIndex = 50 + (relativeDiff * 50);
  
  // Clamp to [0, 100]
  return Math.max(0, Math.min(100, Math.round(scaledIndex)));
}

/**
 * Categorize price index into cheap/medium/expensive
 * @param priceIndex Price index value (0-100)
 * @returns Category string
 */
function categorizePriceIndex(
  priceIndex: number
): 'cheap' | 'medium' | 'expensive' {
  if (priceIndex <= 33) {
    return 'cheap'; // Green (0-33)
  } else if (priceIndex <= 66) {
    return 'medium'; // Orange (34-66)
  } else {
    return 'expensive'; // Red (67-100)
  }
}

/**
 * Calculate price indices for multiple stores in a territory
 * @param storesPrices Map of store prices: storeId -> array of price data
 * @param territory Territory code (e.g., 'GP', 'MQ')
 * @returns Array of price index results
 */
export function calculateTerritoryPriceIndices(
  storesPrices: Map<string, PriceData[]>,
  territory: string
): PriceIndexResult[] {
  const results: PriceIndexResult[] = [];
  const basketTotals: number[] = [];

  // First pass: calculate basket totals for all stores
  storesPrices.forEach((prices, storeId) => {
    const { total, missingProducts, foundCount } = calculateBasketTotal(prices);
    
    // Skip stores with insufficient data (less than 50% of basket)
    if (foundCount < REFERENCE_BASKET.length * 0.5) {
      console.warn(
        `Store ${storeId} has only ${foundCount}/${REFERENCE_BASKET.length} products. Skipping.`
      );
      return;
    }

    if (total > 0) {
      basketTotals.push(total);
    }

    const storeName = prices[0]?.storeName || storeId;

    results.push({
      storeId,
      storeName,
      basketTotal: total,
      territoryAverage: 0, // Will be filled in second pass
      priceIndex: 0, // Will be calculated in second pass
      category: 'medium',
      missingProducts,
      productsFound: foundCount,
      productsTotal: REFERENCE_BASKET.length,
    });
  });

  // Calculate territory average (excluding zeros)
  const validTotals = basketTotals.filter((t) => t > 0);
  const territoryAverage =
    validTotals.length > 0
      ? validTotals.reduce((sum, t) => sum + t, 0) / validTotals.length
      : 0;

  // Second pass: calculate price indices
  results.forEach((result) => {
    if (result.basketTotal > 0) {
      result.territoryAverage = territoryAverage;
      result.priceIndex = calculatePriceIndex(
        result.basketTotal,
        territoryAverage
      );
      result.category = categorizePriceIndex(result.priceIndex);
    }
  });

  // Log warnings for missing products
  results.forEach((result) => {
    if (result.missingProducts.length > 0) {
      console.warn(
        `Store ${result.storeName} (${result.storeId}) missing products: ${result.missingProducts.join(', ')}`
      );
    }
  });

  return results.sort((a, b) => a.priceIndex - b.priceIndex);
}

/**
 * Calculate statistics for a territory
 * @param priceIndices Array of price index results
 * @param territory Territory code
 * @returns Territory statistics
 */
export function calculateTerritoryStats(
  priceIndices: PriceIndexResult[],
  territory: string
): TerritoryStats {
  const validPrices = priceIndices
    .filter((p) => p.basketTotal > 0)
    .map((p) => p.basketTotal);

  if (validPrices.length === 0) {
    return {
      territory,
      averageBasketPrice: 0,
      storeCount: 0,
      minPrice: 0,
      maxPrice: 0,
    };
  }

  return {
    territory,
    averageBasketPrice:
      validPrices.reduce((sum, p) => sum + p, 0) / validPrices.length,
    storeCount: validPrices.length,
    minPrice: Math.min(...validPrices),
    maxPrice: Math.max(...validPrices),
  };
}

/**
 * Get color code for price category
 * @param category Price category
 * @returns Hex color code
 */
export function getPriceCategoryColor(
  category: 'cheap' | 'medium' | 'expensive'
): string {
  const colors = {
    cheap: '#22c55e', // Green
    medium: '#f59e0b', // Orange
    expensive: '#ef4444', // Red
  };
  return colors[category];
}

/**
 * Get reference basket products list
 * @returns Array of product keys in the reference basket
 */
export function getReferenceBasket(): string[] {
  return [...new Set(REFERENCE_BASKET)]; // Return unique products
}
