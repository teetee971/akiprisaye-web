/**
 * Store Cheapest Products Service
 * 
 * Finds and ranks the cheapest products observed at a given store,
 * comparing with territory averages for citizen transparency.
 * 
 * PROMPT 2: Produits les moins chers du magasin
 */

import { SEED_PRODUCTS } from '../data/seedProducts';
import { SEED_STORES } from '../data/seedStores';

export interface CheapestProduct {
  id: string;
  name: string;
  brand: string;
  size: string;
  category: string;
  price: number;
  observationDate: string;
  territoryAverage?: number;
  priceComparison?: 'lower' | 'equal' | 'higher'; // ↓ = ↑
  savingsPercent?: number;
  isCheapestInTerritory?: boolean;
}

/**
 * Store information for cheapest products view
 */
export interface StoreInfo {
  id: string;
  name: string;
  chain: string;
  address: string;
  city: string;
  postalCode: string;
  territory: string;
}

/**
 * Cheapest products grouped by store
 */
export interface CheapestByStore {
  store: StoreInfo;
  cheapestProducts: CheapestProduct[];
  lastObservation: string;
}

/**
 * Calculate territory average for a product
 */
function calculateTerritoryAverage(productEan: string, territory: string): number | undefined {
  const product = SEED_PRODUCTS.find(p => p.ean === productEan);
  if (!product) return undefined;

  const territoryPrices = product.prices
    .filter(p => p.territory === territory)
    .map(p => p.price);

  if (territoryPrices.length === 0) return undefined;

  const sum = territoryPrices.reduce((acc, price) => acc + price, 0);
  return sum / territoryPrices.length;
}

/**
 * Get cheapest products observed at a specific store
 * 
 * @param storeId - Store identifier
 * @param limit - Number of products to return (default: 10)
 * @returns Array of cheapest products with territory comparison
 */
export function getCheapestProductsAtStore(
  storeId: string,
  limit: number = 10
): CheapestProduct[] {
  const storeProducts: CheapestProduct[] = [];

  // Find all products available at this store
  for (const product of SEED_PRODUCTS) {
    const storePrice = product.prices.find(p => p.storeId === storeId);
    
    if (!storePrice) continue;

    // Calculate territory average
    const territoryAvg = calculateTerritoryAverage(product.ean, storePrice.territory);
    
    let priceComparison: 'lower' | 'equal' | 'higher' | undefined;
    let savingsPercent: number | undefined;
    let isCheapestInTerritory = false;

    if (territoryAvg !== undefined) {
      const priceDiff = storePrice.price - territoryAvg;
      const percentDiff = Math.abs(priceDiff / territoryAvg);

      // Consider prices within 1% as equal (tolerance for rounding)
      if (percentDiff < 0.01) {
        priceComparison = 'equal';
      } else if (priceDiff < 0) {
        priceComparison = 'lower';
        savingsPercent = Math.round((Math.abs(priceDiff) / territoryAvg) * 100);
      } else {
        priceComparison = 'higher';
      }

      // Check if this is the cheapest price in the territory
      const allTerritoryPrices = product.prices
        .filter(p => p.territory === storePrice.territory)
        .map(p => p.price);
      
      const minPrice = Math.min(...allTerritoryPrices);
      isCheapestInTerritory = storePrice.price === minPrice;
    }

    storeProducts.push({
      id: product.ean,
      name: product.name,
      brand: product.brand,
      size: product.size,
      category: product.category,
      price: storePrice.price,
      observationDate: storePrice.ts,
      territoryAverage: territoryAvg,
      priceComparison,
      savingsPercent,
      isCheapestInTerritory,
    });
  }

  // Sort by price (lowest first) and return top N
  return storeProducts
    .sort((a, b) => a.price - b.price)
    .slice(0, limit);
}

/**
 * Get comparison icon for price relative to territory average
 */
export function getPriceComparisonIcon(comparison?: 'lower' | 'equal' | 'higher'): string {
  switch (comparison) {
    case 'lower':
      return '↓';
    case 'equal':
      return '=';
    case 'higher':
      return '↑';
    default:
      return '';
  }
}

/**
 * Get comparison color class for Tailwind
 */
export function getPriceComparisonColor(comparison?: 'lower' | 'equal' | 'higher'): string {
  switch (comparison) {
    case 'lower':
      return 'text-green-400';
    case 'equal':
      return 'text-blue-400';
    case 'higher':
      return 'text-amber-400';
    default:
      return 'text-gray-400';
  }
}

/**
 * Format observation date for display
 */
export function formatObservationDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Aujourd\'hui';
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaines`;
    
    return date.toLocaleDateString('fr-FR', { 
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined 
    });
  } catch (e) {
    return 'Date inconnue';
  }
}

/**
 * Calculate data reliability score based on observation freshness
 * Returns a score from 0 to 100
 */
export function calculateDataReliability(dateString: string): number {
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
    return 50; // Default to 50% if date parsing fails
  }
}

/**
 * Get store information by ID
 */
export function getStoreInfo(storeId: string): StoreInfo | null {
  const store = SEED_STORES.find(s => s.id === storeId);
  if (!store) return null;

  return {
    id: store.id,
    name: store.name,
    chain: store.chain,
    address: store.address,
    city: store.city,
    postalCode: store.postalCode,
    territory: store.territory,
  };
}

/**
 * Get cheapest products by store with full store information
 * This is the main function for the detail view
 * 
 * @param storeId - Store identifier
 * @returns Store info with cheapest products or null if store not found
 */
export function getCheapestProductsByStore(storeId: string): CheapestByStore | null {
  const storeInfo = getStoreInfo(storeId);
  if (!storeInfo) return null;

  const products = getCheapestProductsAtStore(storeId, 20); // Get more products for detail view
  
  if (products.length === 0) {
    return {
      store: storeInfo,
      cheapestProducts: [],
      lastObservation: new Date().toISOString(),
    };
  }

  // Find the most recent observation date
  const latestDate = products.reduce((latest, product) => {
    const productDate = new Date(product.observationDate);
    return productDate > latest ? productDate : latest;
  }, new Date(products[0].observationDate));

  return {
    store: storeInfo,
    cheapestProducts: products.filter(p => p.isCheapestInTerritory),
    lastObservation: latestDate.toISOString(),
  };
}

/**
 * Get count of cheapest products for a store
 * Used for the ranking display
 */
export function getCheapestProductsCount(storeId: string): number {
  const products = getCheapestProductsAtStore(storeId, 100);
  return products.filter(p => p.isCheapestInTerritory).length;
}
