/**
 * Enhanced Basket Pricing Service
 * 
 * Phase 8: Advanced basket comparison with price optimization and analytics
 * Provides multi-criteria comparison, savings calculation, and smart suggestions
 */

import type { TiPanierItem } from '../hooks/useTiPanier';
import { SEED_PRODUCTS } from '../data/seedProducts';
import { SEED_STORES } from '../data/seedStores';
import { calculateDistance } from '../utils/geoLocation';

export interface BasketPriceAnalysis {
  basket: {
    items: number;
    totalQuantity: number;
  };
  bestOption: {
    storeId: string;
    storeName: string;
    totalPrice: number;
    availableItems: number;
    dataFreshness: number;
    distance?: number;
  };
  comparison: {
    lowestPrice: number;
    highestPrice: number;
    averagePrice: number;
    priceRange: number;
    potentialSavings: number;
  };
  recommendations: OptimizationRecommendation[];
  multiStoreOption?: MultiStoreStrategy;
}

export interface OptimizationRecommendation {
  type: 'price' | 'distance' | 'availability' | 'freshness' | 'mixed';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  savings?: number;
  extraDistance?: number;
  stores?: string[];
}

export interface MultiStoreStrategy {
  stores: Array<{
    storeId: string;
    storeName: string;
    items: string[];
    totalPrice: number;
    distance?: number;
  }>;
  totalPrice: number;
  savings: number;
  extraDistance?: number;
  worthwhile: boolean;
  reason: string;
}

export interface PriceTrendAnalysis {
  product: string;
  currentPrice: number;
  historicalAverage?: number;
  trend: 'rising' | 'falling' | 'stable' | 'unknown';
  percentChange?: number;
  recommendation: string;
}

/**
 * Analyze basket pricing across all stores
 * 
 * @param basketItems - Items in the basket
 * @param userPosition - Optional user position for distance calculation
 * @returns Comprehensive basket price analysis
 */
export function analyzeBasketPricing(
  basketItems: TiPanierItem[],
  userPosition?: { lat: number; lon: number }
): BasketPriceAnalysis {
  // Calculate prices at each store
  const storeComparisons = [];
  let lowestPrice = Infinity;
  let highestPrice = 0;
  let totalPrice = 0;
  let storeCount = 0;

  for (const store of SEED_STORES) {
    let storeTotal = 0;
    let availableItems = 0;
    const observationDates: string[] = [];

    for (const basketItem of basketItems) {
      const product = SEED_PRODUCTS.find(p => p.ean === basketItem.id);
      if (!product) continue;

      const storePrice = product.prices.find(p => p.storeId === store.id);
      if (storePrice) {
        storeTotal += storePrice.price * basketItem.quantity;
        availableItems++;
        observationDates.push(storePrice.ts);
      }
    }

    if (availableItems > 0) {
      let distance: number | undefined;
      if (userPosition && store.coordinates) {
        distance = calculateDistance(
          userPosition.lat,
          userPosition.lon,
          store.coordinates.lat,
          store.coordinates.lon
        );
      }

      storeComparisons.push({
        storeId: store.id,
        storeName: store.name,
        totalPrice: storeTotal,
        availableItems,
        dataFreshness: calculateDataFreshness(observationDates),
        distance,
      });

      lowestPrice = Math.min(lowestPrice, storeTotal);
      highestPrice = Math.max(highestPrice, storeTotal);
      totalPrice += storeTotal;
      storeCount++;
    }
  }

  // Sort by price
  storeComparisons.sort((a, b) => a.totalPrice - b.totalPrice);

  const averagePrice = storeCount > 0 ? totalPrice / storeCount : 0;
  const bestOption = storeComparisons[0] || {
    storeId: 'unknown',
    storeName: 'Aucun magasin disponible',
    totalPrice: 0,
    availableItems: 0,
    dataFreshness: 0,
  };

  // Generate recommendations
  const recommendations = generateRecommendations(
    basketItems,
    storeComparisons,
    userPosition
  );

  // Calculate multi-store strategy
  const multiStoreOption = calculateMultiStoreStrategy(
    basketItems,
    storeComparisons,
    userPosition
  );

  return {
    basket: {
      items: basketItems.length,
      totalQuantity: basketItems.reduce((sum, item) => sum + item.quantity, 0),
    },
    bestOption,
    comparison: {
      lowestPrice,
      highestPrice,
      averagePrice,
      priceRange: highestPrice - lowestPrice,
      potentialSavings: highestPrice - lowestPrice,
    },
    recommendations,
    multiStoreOption,
  };
}

/**
 * Generate optimization recommendations
 */
function generateRecommendations(
  basketItems: TiPanierItem[],
  storeComparisons: any[],
  userPosition?: { lat: number; lon: number }
): OptimizationRecommendation[] {
  const recommendations: OptimizationRecommendation[] = [];

  if (storeComparisons.length === 0) return recommendations;

  const best = storeComparisons[0];
  const worst = storeComparisons[storeComparisons.length - 1];

  // Price recommendation
  if (worst.totalPrice - best.totalPrice > 5) {
    recommendations.push({
      type: 'price',
      priority: 'high',
      title: 'Économisez en changeant de magasin',
      description: `Faites vos courses chez ${best.storeName} au lieu de ${worst.storeName}`,
      savings: worst.totalPrice - best.totalPrice,
    });
  }

  // Distance vs price tradeoff
  if (userPosition && storeComparisons.length > 1) {
    const nearest = storeComparisons.reduce((min, store) => 
      (store.distance || Infinity) < (min.distance || Infinity) ? store : min
    );

    if (nearest.storeId !== best.storeId) {
      const priceDiff = nearest.totalPrice - best.totalPrice;
      const distanceDiff = (best.distance || 0) - (nearest.distance || 0);

      if (priceDiff < 3 && distanceDiff > 2) {
        recommendations.push({
          type: 'distance',
          priority: 'medium',
          title: 'Magasin proche avec prix similaire',
          description: `${nearest.storeName} est plus proche (${distanceDiff.toFixed(1)}km) avec seulement ${priceDiff.toFixed(2)}€ de différence`,
          extraDistance: -distanceDiff,
        });
      }
    }
  }

  // Data freshness recommendation
  const freshStore = storeComparisons.find(s => s.dataFreshness >= 90);
  if (freshStore && freshStore.storeId !== best.storeId) {
    const priceDiff = freshStore.totalPrice - best.totalPrice;
    if (priceDiff < 2) {
      recommendations.push({
        type: 'freshness',
        priority: 'low',
        title: 'Données plus récentes disponibles',
        description: `${freshStore.storeName} a des données très récentes avec seulement ${priceDiff.toFixed(2)}€ de différence`,
      });
    }
  }

  // Availability recommendation
  const allItems = basketItems.length;
  if (best.availableItems < allItems) {
    const fullAvailability = storeComparisons.find(s => s.availableItems === allItems);
    if (fullAvailability) {
      const priceDiff = fullAvailability.totalPrice - best.totalPrice;
      recommendations.push({
        type: 'availability',
        priority: 'medium',
        title: 'Tous les produits disponibles ailleurs',
        description: `${fullAvailability.storeName} a tous vos produits (${priceDiff > 0 ? `+${priceDiff.toFixed(2)}€` : 'même prix'})`,
        stores: [fullAvailability.storeName],
      });
    }
  }

  return recommendations.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

/**
 * Calculate multi-store shopping strategy
 */
function calculateMultiStoreStrategy(
  basketItems: TiPanierItem[],
  storeComparisons: any[],
  userPosition?: { lat: number; lon: number }
): MultiStoreStrategy | undefined {
  if (storeComparisons.length < 2) return undefined;

  // Find best price for each item across all stores
  const itemAssignments = new Map<string, { storeId: string; price: number; quantity: number }>();
  
  for (const basketItem of basketItems) {
    const product = SEED_PRODUCTS.find(p => p.ean === basketItem.id);
    if (!product) continue;

    let bestPrice = Infinity;
    let bestStoreId = '';

    for (const store of SEED_STORES) {
      const storePrice = product.prices.find(p => p.storeId === store.id);
      if (storePrice && storePrice.price < bestPrice) {
        bestPrice = storePrice.price;
        bestStoreId = store.id;
      }
    }

    if (bestStoreId) {
      itemAssignments.set(basketItem.id, {
        storeId: bestStoreId,
        price: bestPrice,
        quantity: basketItem.quantity,
      });
    }
  }

  // Group by store
  const storeGroups = new Map<string, { items: string[]; totalPrice: number }>();
  
  for (const [itemId, assignment] of itemAssignments.entries()) {
    const existing = storeGroups.get(assignment.storeId) || { items: [], totalPrice: 0 };
    existing.items.push(itemId);
    existing.totalPrice += assignment.price * assignment.quantity;
    storeGroups.set(assignment.storeId, existing);
  }

  // Calculate total cost and distance
  let totalPrice = 0;
  let totalDistance = 0;
  const stores = [];

  for (const [storeId, group] of storeGroups.entries()) {
    const store = SEED_STORES.find(s => s.id === storeId);
    if (!store) continue;

    let distance: number | undefined;
    if (userPosition && store.coordinates) {
      distance = calculateDistance(
        userPosition.lat,
        userPosition.lon,
        store.coordinates.lat,
        store.coordinates.lon
      );
      totalDistance += distance;
    }

    stores.push({
      storeId,
      storeName: store.name,
      items: group.items,
      totalPrice: group.totalPrice,
      distance,
    });

    totalPrice += group.totalPrice;
  }

  const singleStoreBest = storeComparisons[0];
  const savings = singleStoreBest.totalPrice - totalPrice;
  const extraDistance = totalDistance - (singleStoreBest.distance || 0);

  // Determine if strategy is worthwhile
  let worthwhile = false;
  let reason = '';

  if (stores.length === 1) {
    worthwhile = false;
    reason = 'Un seul magasin recommandé';
  } else if (savings < 2) {
    worthwhile = false;
    reason = 'Économies trop faibles pour justifier plusieurs magasins';
  } else if (userPosition && extraDistance > 10) {
    worthwhile = false;
    reason = 'Distance supplémentaire trop importante';
  } else if (savings >= 5) {
    worthwhile = true;
    reason = `Économies significatives (${savings.toFixed(2)}€)`;
  } else if (savings >= 2 && extraDistance < 3) {
    worthwhile = true;
    reason = 'Bon compromis économies/distance';
  }

  return {
    stores,
    totalPrice,
    savings,
    extraDistance: userPosition ? extraDistance : undefined,
    worthwhile,
    reason,
  };
}

/**
 * Analyze price trends for basket items
 */
export function analyzeBasketPriceTrends(
  basketItems: TiPanierItem[]
): PriceTrendAnalysis[] {
  const trends: PriceTrendAnalysis[] = [];

  for (const basketItem of basketItems) {
    const product = SEED_PRODUCTS.find(p => p.ean === basketItem.id);
    if (!product || !product.prices || product.prices.length === 0) continue;

    // Get current average price
    const currentPrice =
      product.prices.reduce((sum, p) => sum + p.price, 0) / product.prices.length;

    // Simple trend analysis (in real implementation, use historical data)
    const analysis: PriceTrendAnalysis = {
      product: product.name,
      currentPrice,
      trend: 'stable',
      recommendation: 'Prix dans la moyenne',
    };

    trends.push(analysis);
  }

  return trends;
}

/**
 * Calculate data freshness score
 */
function calculateDataFreshness(observationDates: string[]): number {
  if (observationDates.length === 0) return 50;

  const scores = observationDates.map(dateString => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays <= 7) return 100;
      if (diffDays <= 30) return Math.round(100 - ((diffDays - 7) / 23) * 20);
      if (diffDays <= 90) return Math.round(80 - ((diffDays - 30) / 60) * 30);
      return 50;
    } catch (e) {
      return 50;
    }
  });

  return Math.round(scores.reduce((acc, score) => acc + score, 0) / scores.length);
}
