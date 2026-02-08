/**
 * Price Index Calculator Service
 * Calculates price indices for stores based on a reference basket
 */

export interface ReferenceBasketItem {
  productId: string;
  quantity: number;
}

export interface PriceIndexResult {
  storeId: string;
  priceIndex: number; // 0-100
  averageBasketPrice: number;
  comparisonToTerritory: number;
  comparisonToChain: number;
  lastCalculatedAt: string;
  basketComposition: Array<{
    productId: string;
    productName: string;
    price: number;
    territoryAverage: number;
    chainAverage?: number;
  }>;
}

// Reference basket for price comparison (10 essential products)
export const REFERENCE_BASKET: ReferenceBasketItem[] = [
  { productId: 'riz_1kg', quantity: 1 },
  { productId: 'lait_1l', quantity: 2 },
  { productId: 'pain_500g', quantity: 1 },
  { productId: 'oeufs_x6', quantity: 1 },
  { productId: 'huile_1l', quantity: 1 },
  { productId: 'sucre_1kg', quantity: 1 },
  { productId: 'eau_1.5l', quantity: 2 },
  { productId: 'pates_500g', quantity: 1 },
  { productId: 'beurre_250g', quantity: 1 },
  { productId: 'cafe_250g', quantity: 1 },
];

/**
 * Mock prices for demonstration
 * In production, this would query the database
 */
const MOCK_PRICES: Record<string, Record<string, number>> = {
  superu_petit_canal: {
    riz_1kg: 2.99,
    lait_1l: 1.29,
    pain_500g: 1.49,
    oeufs_x6: 2.79,
    huile_1l: 4.99,
    sucre_1kg: 1.89,
    'eau_1.5l': 0.59,
    pates_500g: 1.19,
    beurre_250g: 2.49,
    cafe_250g: 5.99,
  },
  carrefour_baie_mahault: {
    riz_1kg: 3.29,
    lait_1l: 1.39,
    pain_500g: 1.59,
    oeufs_x6: 2.99,
    huile_1l: 5.49,
    sucre_1kg: 1.99,
    'eau_1.5l': 0.69,
    pates_500g: 1.29,
    beurre_250g: 2.69,
    cafe_250g: 6.49,
  },
  leclerc_abymes: {
    riz_1kg: 2.79,
    lait_1l: 1.19,
    pain_500g: 1.39,
    oeufs_x6: 2.59,
    huile_1l: 4.79,
    sucre_1kg: 1.79,
    'eau_1.5l': 0.49,
    pates_500g: 1.09,
    beurre_250g: 2.29,
    cafe_250g: 5.79,
  },
};

// Territory averages
const TERRITORY_AVERAGES: Record<string, number> = {
  riz_1kg: 3.0,
  lait_1l: 1.3,
  pain_500g: 1.5,
  oeufs_x6: 2.8,
  huile_1l: 5.0,
  sucre_1kg: 1.9,
  'eau_1.5l': 0.6,
  pates_500g: 1.2,
  beurre_250g: 2.5,
  cafe_250g: 6.0,
};

/**
 * Calculate price index for a store
 */
export async function calculatePriceIndex(
  storeId: string
): Promise<PriceIndexResult> {
  // Get store prices (mock data for now)
  const storePrices = MOCK_PRICES[storeId] || MOCK_PRICES.superu_petit_canal;

  // Calculate basket total
  let basketTotal = 0;
  let territoryTotal = 0;
  const basketComposition = [];

  for (const item of REFERENCE_BASKET) {
    const price = storePrices[item.productId];
    const territoryAvg = TERRITORY_AVERAGES[item.productId];

    // Skip items with missing prices to avoid incorrect calculations
    if (!price || !territoryAvg) {
      console.warn(`Missing price data for ${item.productId} in store ${storeId}`);
      continue;
    }

    basketTotal += price * item.quantity;
    territoryTotal += territoryAvg * item.quantity;

    basketComposition.push({
      productId: item.productId,
      productName: item.productId.replace(/_/g, ' '),
      price: price * item.quantity,
      territoryAverage: territoryAvg * item.quantity,
    });
  }

  // Calculate comparison percentage
  const comparisonToTerritory =
    territoryTotal > 0
      ? ((basketTotal - territoryTotal) / territoryTotal) * 100
      : 0;

  // Normalize to 0-100 scale (cheaper = lower index)
  // If 20% more expensive, index = 60
  // If same price, index = 50
  // If 20% cheaper, index = 40
  let priceIndex = 50 + comparisonToTerritory;
  priceIndex = Math.max(0, Math.min(100, priceIndex));

  return {
    storeId,
    priceIndex: Math.round(priceIndex),
    averageBasketPrice: parseFloat(basketTotal.toFixed(2)),
    comparisonToTerritory: parseFloat(comparisonToTerritory.toFixed(2)),
    comparisonToChain: 0, // Would be calculated if we had chain data
    lastCalculatedAt: new Date().toISOString(),
    basketComposition,
  };
}

/**
 * Calculate price index for multiple stores
 */
export async function calculatePriceIndices(
  storeIds: string[]
): Promise<Map<string, PriceIndexResult>> {
  const results = new Map<string, PriceIndexResult>();

  for (const storeId of storeIds) {
    try {
      const result = await calculatePriceIndex(storeId);
      results.set(storeId, result);
    } catch (error) {
      console.error(`Error calculating price index for ${storeId}:`, error);
    }
  }

  return results;
}

/**
 * Get territory average basket price
 */
export function getTerritoryAverageBasketPrice(): number {
  let total = 0;
  for (const item of REFERENCE_BASKET) {
    total += (TERRITORY_AVERAGES[item.productId] || 0) * item.quantity;
  }
  return parseFloat(total.toFixed(2));
}
