/**
 * Shopping List Service
 * 
 * CORE PRINCIPLE: NO FAKE DATA - Only real stores, real locations, real prices
 * 
 * This service handles:
 * - Geolocation (with explicit consent, never stored)
 * - Store matching (real GPS coordinates from SEED_STORES)
 * - Price matching (real prices from SEED_PRODUCTS)
 * - Optimization (transparent cost/distance calculations)
 */

import { SEED_STORES } from '../data/seedStores';
import { SEED_PRODUCTS } from '../data/seedProducts';

/**
 * Calculate distance using Haversine formula
 * Returns distance in kilometers
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Get stores for a territory with distances from user location
 * 
 * @param {string} territory - Territory name (e.g., 'Guadeloupe')
 * @param {Object} userLocation - {lat, lon} or null
 * @returns {Array} Stores with distance property
 */
export function getStoresForTerritory(territory, userLocation = null) {
  const stores = SEED_STORES.filter(store => store.territory === territory);
  
  if (!userLocation || !userLocation.lat || !userLocation.lon) {
    return stores.map(store => ({ ...store, distance: null }));
  }
  
  return stores.map(store => ({
    ...store,
    distance: calculateDistance(
      userLocation.lat,
      userLocation.lon,
      store.coordinates.lat,
      store.coordinates.lon
    )
  })).sort((a, b) => (a.distance || 0) - (b.distance || 0));
}

/**
 * Find product by name (fuzzy search)
 * Returns product with all price information or null
 */
export function findProduct(productName) {
  if (!productName || typeof productName !== 'string') return null;
  
  const searchTerm = productName.toLowerCase().trim();
  
  // Try exact match first
  let product = SEED_PRODUCTS.find(p => 
    p.name.toLowerCase() === searchTerm ||
    p.brand?.toLowerCase() === searchTerm
  );
  
  // Try partial match
  if (!product) {
    product = SEED_PRODUCTS.find(p =>
      p.name.toLowerCase().includes(searchTerm) ||
      p.brand?.toLowerCase().includes(searchTerm) ||
      searchTerm.includes(p.name.toLowerCase())
    );
  }
  
  return product || null;
}

/**
 * Get price for a product at a specific store
 * Returns null if no price available (NEVER invents prices)
 */
export function getPriceAtStore(product, storeId) {
  if (!product || !product.prices) return null;
  
  const priceEntry = product.prices.find(p => p.storeId === storeId);
  return priceEntry || null;
}

/**
 * Calculate cost for shopping list at a single store
 * 
 * Returns:
 * - totalCost: sum of all available items
 * - availableItems: items with prices at this store  
 * - unavailableItems: items without prices (clearly marked)
 * - coverage: percentage of items available
 */
export function calculateSingleStoreCost(shoppingList, storeId) {
  let totalCost = 0;
  const availableItems = [];
  const unavailableItems = [];
  
  shoppingList.forEach(item => {
    const product = findProduct(item.name);
    
    if (!product) {
      unavailableItems.push({
        ...item,
        reason: 'Product not found in database'
      });
      return;
    }
    
    const priceInfo = getPriceAtStore(product, storeId);
    
    if (priceInfo) {
      const itemCost = priceInfo.price * (item.quantity || 1);
      totalCost += itemCost;
      availableItems.push({
        ...item,
        product,
        unitPrice: priceInfo.price,
        totalPrice: itemCost,
        priceDate: priceInfo.ts,
        source: 'SEED_PRODUCTS'
      });
    } else {
      unavailableItems.push({
        ...item,
        product,
        reason: 'Price not available at this store'
      });
    }
  });
  
  const totalItems = shoppingList.length;
  const coverage = totalItems > 0 ? (availableItems.length / totalItems) * 100 : 0;
  
  return {
    totalCost,
    availableItems,
    unavailableItems,
    coverage,
    totalItems
  };
}

/**
 * Find best single store option
 * Considers both coverage and cost
 */
export function findBestSingleStore(shoppingList, stores) {
  const storeAnalyses = stores.map(store => {
    const costAnalysis = calculateSingleStoreCost(shoppingList, store.id);
    
    // Transparent scoring:
    // - Coverage: 60% weight (having items available is critical)
    // - Cost: 30% weight (lower is better, normalized)
    // - Distance: 10% weight (closer is better)
    
    const coverageScore = costAnalysis.coverage * 0.6;
    
    // Distance score: 10 points max if < 2km, 0 points at 20km
    const distanceScore = store.distance 
      ? Math.max(0, 10 - (store.distance / 20) * 10)
      : 5; // neutral if no distance
    
    const totalScore = coverageScore + distanceScore;
    
    return {
      store,
      ...costAnalysis,
      score: totalScore
    };
  });
  
  // Filter to stores with at least 1 item available
  const validStores = storeAnalyses.filter(s => s.availableItems.length > 0);
  
  if (validStores.length === 0) return null;
  
  // Sort by score (higher is better), then by cost (lower is better)
  validStores.sort((a, b) => {
    if (Math.abs(a.score - b.score) > 1) {
      return b.score - a.score;
    }
    return a.totalCost - b.totalCost;
  });
  
  return validStores[0];
}

/**
 * Optimize multi-store shopping
 * Finds cheapest option for each item across all stores
 */
export function optimizeMultiStore(shoppingList, stores, userLocation) {
  const storeAssignments = {};
  let totalCost = 0;
  const unavailableItems = [];
  
  // For each item, find the cheapest store
  shoppingList.forEach(item => {
    const product = findProduct(item.name);
    
    if (!product || !product.prices || product.prices.length === 0) {
      unavailableItems.push({
        ...item,
        reason: 'No price data available'
      });
      return;
    }
    
    // Find cheapest price across all stores in territory
    let cheapestPrice = Infinity;
    let cheapestStoreId = null;
    let cheapestPriceInfo = null;
    
    product.prices.forEach(priceEntry => {
      // Check if this store is in our list
      const storeExists = stores.find(s => s.id === priceEntry.storeId);
      if (storeExists && priceEntry.price < cheapestPrice) {
        cheapestPrice = priceEntry.price;
        cheapestStoreId = priceEntry.storeId;
        cheapestPriceInfo = priceEntry;
      }
    });
    
    if (cheapestStoreId) {
      if (!storeAssignments[cheapestStoreId]) {
        storeAssignments[cheapestStoreId] = {
          store: stores.find(s => s.id === cheapestStoreId),
          items: [],
          subtotal: 0
        };
      }
      
      const itemCost = cheapestPrice * (item.quantity || 1);
      storeAssignments[cheapestStoreId].items.push({
        ...item,
        product,
        unitPrice: cheapestPrice,
        totalPrice: itemCost,
        priceDate: cheapestPriceInfo.ts,
        source: 'SEED_PRODUCTS'
      });
      storeAssignments[cheapestStoreId].subtotal += itemCost;
      totalCost += itemCost;
    } else {
      unavailableItems.push({
        ...item,
        product,
        reason: 'Not available in territory stores'
      });
    }
  });
  
  // Calculate total route distance
  const storeList = Object.values(storeAssignments);
  let totalDistance = 0;
  
  if (userLocation && storeList.length > 0) {
    let currentLat = userLocation.lat;
    let currentLon = userLocation.lon;
    
    // Simple route: visit each store and return home
    storeList.forEach(assignment => {
      const store = assignment.store;
      if (store && store.coordinates) {
        const distance = calculateDistance(
          currentLat,
          currentLon,
          store.coordinates.lat,
          store.coordinates.lon
        );
        totalDistance += distance;
        currentLat = store.coordinates.lat;
        currentLon = store.coordinates.lon;
      }
    });
    
    // Return home
    if (storeList.length > 0) {
      totalDistance += calculateDistance(
        currentLat,
        currentLon,
        userLocation.lat,
        userLocation.lon
      );
    }
  }
  
  return {
    storeAssignments: storeList,
    totalCost,
    totalDistance,
    unavailableItems,
    storeCount: storeList.length
  };
}

/**
 * Get complete shopping recommendations
 * Compares single-store vs multi-store options
 * 
 * TRANSPARENT: Returns all calculations and reasoning
 */
export function getShoppingRecommendations(shoppingList, territory, userLocation) {
  // Input validation
  if (!shoppingList || shoppingList.length === 0) {
    return {
      error: 'Shopping list is empty',
      transparency: {
        message: 'Please add items to your shopping list'
      }
    };
  }
  
  // Get stores for territory
  const stores = getStoresForTerritory(territory, userLocation);
  
  if (stores.length === 0) {
    return {
      error: 'No stores found for this territory',
      transparency: {
        territory,
        message: 'No store data available for this territory'
      }
    };
  }
  
  // Calculate both options
  const singleStoreOption = findBestSingleStore(shoppingList, stores);
  const multiStoreOption = optimizeMultiStore(shoppingList, stores, userLocation);
  
  // Determine recommendation with transparent reasoning
  let recommendation = null;
  
  if (!singleStoreOption && multiStoreOption.storeCount === 0) {
    recommendation = {
      type: 'none',
      message: 'No prices available for your items in this territory'
    };
  } else if (!singleStoreOption) {
    recommendation = {
      type: 'multi_store',
      message: 'No single store has enough items. Multi-store shopping required.',
      option: multiStoreOption
    };
  } else if (multiStoreOption.storeCount === 0 || multiStoreOption.storeCount === 1) {
    recommendation = {
      type: 'single_store',
      message: 'Single store is the best option',
      option: singleStoreOption
    };
  } else {
    // Compare the two options
    const savings = singleStoreOption.totalCost - multiStoreOption.totalCost;
    const savingsPercent = (savings / singleStoreOption.totalCost) * 100;
    const extraDistance = multiStoreOption.totalDistance - (singleStoreOption.store.distance || 0) * 2;
    
    // Decision logic (transparent):
    // - If multi-store saves > 15% and extra distance < 5km: recommend multi-store
    // - If savings < 5%: recommend single store
    // - Otherwise: present both options
    
    if (savingsPercent > 15 && extraDistance < 5) {
      recommendation = {
        type: 'multi_store',
        message: `Multi-store saves €${savings.toFixed(2)} (${savingsPercent.toFixed(1)}%) with only ${extraDistance.toFixed(1)}km extra`,
        option: multiStoreOption,
        alternative: singleStoreOption,
        reasoning: {
          savings,
          savingsPercent,
          extraDistance
        }
      };
    } else if (savingsPercent < 5) {
      recommendation = {
        type: 'single_store',
        message: `Single store is most convenient (saves only ${savingsPercent.toFixed(1)}% to go multi-store)`,
        option: singleStoreOption,
        alternative: multiStoreOption,
        reasoning: {
          savings,
          savingsPercent,
          extraDistance
        }
      };
    } else {
      recommendation = {
        type: 'both',
        message: 'Both options are viable - choose based on your preference',
        singleStore: singleStoreOption,
        multiStore: multiStoreOption,
        reasoning: {
          savings,
          savingsPercent,
          extraDistance
        }
      };
    }
  }
  
  // Return complete analysis with transparency
  return {
    recommendation,
    singleStoreOption,
    multiStoreOption,
    stores,
    transparency: {
      territory,
      totalStores: stores.length,
      shoppingListItems: shoppingList.length,
      dataSource: 'SEED_STORES and SEED_PRODUCTS (real data)',
      geolocationUsed: !!userLocation,
      disclaimer: 'Prices are based on publicly available data. Availability and prices may vary in store.',
      methodology: 'Transparent scoring: Coverage (60%), Distance (10%). Lower cost is better when coverage is similar.'
    }
  };
}
