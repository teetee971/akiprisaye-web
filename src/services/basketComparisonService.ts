/**
 * Basket Store Comparison Service
 * 
 * Compares a user's basket across multiple stores to find the best prices.
 * PROMPT 4: Comparaison automatique du panier entre magasins
 */

import { SEED_PRODUCTS } from '../data/seedProducts';
import { SEED_STORES } from '../data/seedStores';
import type { TiPanierItem } from '../hooks/useTiPanier';
import { calculateDistance } from '../utils/geoLocation';

// Constants for comparison thresholds
const PRICE_TOLERANCE = 0.01; // Price differences < 1 cent are considered equal
const FRESHNESS_TOLERANCE = 5; // Data freshness differences < 5 points are considered equal

export interface BasketStoreComparison {
  storeId: string;
  storeName: string;
  chain: string;
  territory: string;
  city: string;
  address: string;
  coordinates: {
    lat: number;
    lon: number;
  };
  totalPrice: number;
  availableItems: number;
  totalItems: number;
  distance?: number;
  dataFreshness: number; // 0-100 score
  lastUpdate: string;
  items: BasketItemAtStore[];
}

export interface BasketItemAtStore {
  id: string;
  name: string;
  quantity: number;
  price?: number;
  available: boolean;
  observationDate?: string;
}

/**
 * Calculate data freshness score based on observation dates
 * Returns average freshness from 0-100
 */
function calculateDataFreshness(observationDates: string[]): number {
  if (observationDates.length === 0) return 50;

  const scores = observationDates.map(dateString => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      // Fresh data (0-7 days) = 100%
      if (diffDays <= 7) return 100;
      
      // Recent data (8-30 days) = 80-99%
      if (diffDays <= 30) {
        return Math.round(100 - ((diffDays - 7) / 23) * 20);
      }
      
      // Older data (31-90 days) = 50-79%
      if (diffDays <= 90) {
        return Math.round(80 - ((diffDays - 30) / 60) * 30);
      }
      
      // Very old data (90+ days) = 50% minimum
      return 50;
    } catch (e) {
      return 50;
    }
  });

  const sum = scores.reduce((acc, score) => acc + score, 0);
  return Math.round(sum / scores.length);
}

/**
 * Get the most recent observation date from a list
 */
function getMostRecentDate(dates: string[]): string {
  if (dates.length === 0) return new Date().toISOString();
  
  return dates.reduce((latest, current) => {
    return new Date(current) > new Date(latest) ? current : latest;
  });
}

/**
 * Compare basket across all stores
 * 
 * @param basketItems - Items in the user's basket
 * @param userPosition - Optional user position for distance calculation
 * @returns Array of store comparisons sorted by total price
 */
export function compareBasketAcrossStores(
  basketItems: TiPanierItem[],
  userPosition?: { lat: number; lon: number }
): BasketStoreComparison[] {
  const storeComparisons: BasketStoreComparison[] = [];

  // Iterate through all stores
  for (const store of SEED_STORES) {
    const storeItems: BasketItemAtStore[] = [];
    let totalPrice = 0;
    let availableCount = 0;
    const observationDates: string[] = [];

    // Check each basket item at this store
    for (const basketItem of basketItems) {
      const product = SEED_PRODUCTS.find(p => p.ean === basketItem.id);
      
      if (!product) {
        // Product not found in catalog - use metadata if available
        const itemName = basketItem.meta && typeof basketItem.meta === 'object' && 'name' in basketItem.meta
          ? String(basketItem.meta.name)
          : 'Produit inconnu';
        
        storeItems.push({
          id: basketItem.id,
          name: itemName,
          quantity: basketItem.quantity,
          available: false,
        });
        continue;
      }

      // Find price at this store
      const storePrice = product.prices.find(p => p.storeId === store.id);
      
      if (storePrice) {
        storeItems.push({
          id: basketItem.id,
          name: product.name,
          quantity: basketItem.quantity,
          price: storePrice.price,
          available: true,
          observationDate: storePrice.ts,
        });
        
        totalPrice += storePrice.price * basketItem.quantity;
        availableCount++;
        observationDates.push(storePrice.ts);
      } else {
        storeItems.push({
          id: basketItem.id,
          name: product.name,
          quantity: basketItem.quantity,
          available: false,
        });
      }
    }

    // Only include stores that have at least one item
    if (availableCount > 0) {
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
        chain: store.chain,
        territory: store.territory,
        city: store.city,
        address: store.address,
        coordinates: store.coordinates,
        totalPrice,
        availableItems: availableCount,
        totalItems: basketItems.length,
        distance,
        dataFreshness: calculateDataFreshness(observationDates),
        lastUpdate: getMostRecentDate(observationDates),
        items: storeItems,
      });
    }
  }

  // Sort by: 1. Price, 2. Data freshness, 3. Distance
  return storeComparisons.sort((a, b) => {
    // Primary: Total price (lower is better)
    const priceDiff = a.totalPrice - b.totalPrice;
    if (Math.abs(priceDiff) > PRICE_TOLERANCE) return priceDiff;

    // Secondary: Data freshness (higher is better)
    const freshnessDiff = b.dataFreshness - a.dataFreshness;
    if (Math.abs(freshnessDiff) > FRESHNESS_TOLERANCE) return freshnessDiff;

    // Tertiary: Distance (closer is better) - only if both have distance
    if (a.distance !== undefined && b.distance !== undefined) {
      return a.distance - b.distance;
    }

    return 0;
  });
}

/**
 * Get basket comparison summary statistics
 */
export function getBasketComparisonStats(comparisons: BasketStoreComparison[]): {
  cheapestStore: BasketStoreComparison | null;
  mostExpensiveStore: BasketStoreComparison | null;
  priceDifference: number;
  percentageSavings: number;
} {
  if (comparisons.length === 0) {
    return {
      cheapestStore: null,
      mostExpensiveStore: null,
      priceDifference: 0,
      percentageSavings: 0,
    };
  }

  const cheapest = comparisons[0];
  const mostExpensive = comparisons[comparisons.length - 1];
  const priceDiff = mostExpensive.totalPrice - cheapest.totalPrice;
  const percentSavings = mostExpensive.totalPrice > 0 
    ? (priceDiff / mostExpensive.totalPrice) * 100 
    : 0;

  return {
    cheapestStore: cheapest,
    mostExpensiveStore: mostExpensive,
    priceDifference: priceDiff,
    percentageSavings: Math.round(percentSavings),
  };
}

/**
 * Get data freshness label
 */
export function getDataFreshnessLabel(score: number): {
  label: string;
  color: string;
} {
  if (score >= 90) {
    return { label: 'Données très récentes', color: 'text-green-400' };
  } else if (score >= 70) {
    return { label: 'Données récentes', color: 'text-blue-400' };
  } else if (score >= 50) {
    return { label: 'Données moyennes', color: 'text-amber-400' };
  } else {
    return { label: 'Données anciennes', color: 'text-red-400' };
  }
}
