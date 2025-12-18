/**
 * Smart Shopping List Service
 * Handles shopping list logic, geolocation, store matching, and optimization
 * 
 * TRANSPARENCY PRINCIPLE: All prices come from real sources, no fake data
 */

import { SEED_STORES } from '../data/seedStores';
import { SEED_PRODUCTS } from '../data/seedProducts';

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude 1
 * @param {number} lon1 - Longitude 1
 * @param {number} lat2 - Latitude 2
 * @param {number} lon2 - Longitude 2
 * @returns {number} Distance in kilometers
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of Earth in kilometers
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
 * Get stores filtered by territory with distances
 * @param {string} territory - Territory code (e.g., 'Guadeloupe', 'Martinique')
 * @param {Object} userLocation - User's location {lat, lon}
 * @returns {Array} Stores with calculated distances
 */
export function getStoresWithDistances(territory, userLocation) {
  const stores = SEED_STORES.filter(store => store.territory === territory);
  
  if (!userLocation) {
    return stores.map(store => ({
      ...store,
      distance: null
    }));
  }
  
  return stores.map(store => ({
    ...store,
    distance: calculateDistance(
      userLocation.lat,
      userLocation.lon,
      store.coordinates.lat,
      store.coordinates.lon
    )
  })).sort((a, b) => a.distance - b.distance);
}

/**
 * Find prices for a product (by name or EAN)
 * @param {string} productIdentifier - Product name or EAN
 * @returns {Object|null} Product with prices or null if not found
 */
export function findProductPrices(productIdentifier) {
  // Try to find by EAN first
  let product = SEED_PRODUCTS.find(p => p.ean === productIdentifier);
  
  // If not found, try by name (case insensitive, partial match)
  if (!product) {
    const searchTerm = productIdentifier.toLowerCase();
    product = SEED_PRODUCTS.find(p => 
      p.name.toLowerCase().includes(searchTerm) ||
      p.brand?.toLowerCase().includes(searchTerm)
    );
  }
  
  return product || null;
}

/**
 * Match shopping list items to available products
 * @param {Array} shoppingList - Array of {name, quantity, category}
 * @returns {Array} Matched products with availability info
 */
export function matchShoppingListToProducts(shoppingList) {
  return shoppingList.map(item => {
    const product = findProductPrices(item.name);
    
    return {
      ...item,
      matched: !!product,
      product: product,
      prices: product?.prices || [],
      hasRealPrices: product && product.prices && product.prices.length > 0
    };
  });
}

/**
 * Calculate total cost if buying all items at a specific store
 * @param {Array} matchedItems - Items with matched products
 * @param {string} storeId - Store ID
 * @returns {Object} {totalCost, availableItems, unavailableItems, itemDetails}
 */
export function calculateStoreTotalCost(matchedItems, storeId) {
  let totalCost = 0;
  const availableItems = [];
  const unavailableItems = [];
  const itemDetails = [];
  
  matchedItems.forEach(item => {
    const priceAtStore = item.prices.find(p => p.storeId === storeId);
    
    if (priceAtStore) {
      const itemCost = priceAtStore.price * (item.quantity || 1);
      totalCost += itemCost;
      availableItems.push(item);
      itemDetails.push({
        name: item.name,
        quantity: item.quantity || 1,
        unitPrice: priceAtStore.price,
        totalPrice: itemCost,
        source: 'real_price',
        timestamp: priceAtStore.ts
      });
    } else {
      unavailableItems.push(item);
      itemDetails.push({
        name: item.name,
        quantity: item.quantity || 1,
        unitPrice: null,
        totalPrice: null,
        source: 'unavailable',
        timestamp: null
      });
    }
  });
  
  return {
    totalCost,
    availableItems,
    unavailableItems,
    itemDetails,
    coverage: matchedItems.length > 0 
      ? (availableItems.length / matchedItems.length) * 100 
      : 0
  };
}

/**
 * Find the best single store option (minimize cost)
 * @param {Array} matchedItems - Items with matched products
 * @param {Array} stores - Available stores
 * @returns {Object} Best single store recommendation
 */
export function findBestSingleStore(matchedItems, stores) {
  const storeAnalysis = stores.map(store => {
    const costAnalysis = calculateStoreTotalCost(matchedItems, store.id);
    
    return {
      store,
      ...costAnalysis,
      distanceScore: store.distance ? Math.max(0, 10 - store.distance) : 5,
      overallScore: calculateOverallScore(costAnalysis, store.distance)
    };
  });
  
  // Sort by coverage first (prioritize stores with most items), then by total cost
  const validStores = storeAnalysis
    .filter(s => s.availableItems.length > 0)
    .sort((a, b) => {
      if (Math.abs(a.coverage - b.coverage) > 10) {
        return b.coverage - a.coverage; // Higher coverage is better
      }
      return a.totalCost - b.totalCost; // Lower cost is better
    });
  
  return validStores[0] || null;
}

/**
 * Find the optimal multi-store shopping route
 * @param {Array} matchedItems - Items with matched products
 * @param {Array} stores - Available stores
 * @param {Object} userLocation - User's location
 * @returns {Object} Multi-store optimization result
 */
export function optimizeMultiStoreRoute(matchedItems, stores, userLocation) {
  const itemsByStore = {};
  let totalCost = 0;
  
  // For each item, find the cheapest available store
  matchedItems.forEach(item => {
    if (!item.hasRealPrices) return;
    
    let cheapestPrice = Infinity;
    let cheapestStore = null;
    let priceInfo = null;
    
    item.prices.forEach(price => {
      if (price.price < cheapestPrice) {
        cheapestPrice = price.price;
        cheapestStore = price.storeId;
        priceInfo = price;
      }
    });
    
    if (cheapestStore) {
      if (!itemsByStore[cheapestStore]) {
        const storeData = stores.find(s => s.id === cheapestStore);
        itemsByStore[cheapestStore] = {
          store: storeData,
          items: [],
          totalCost: 0
        };
      }
      
      const itemCost = cheapestPrice * (item.quantity || 1);
      itemsByStore[cheapestStore].items.push({
        ...item,
        unitPrice: cheapestPrice,
        totalPrice: itemCost,
        source: priceInfo
      });
      itemsByStore[cheapestStore].totalCost += itemCost;
      totalCost += itemCost;
    }
  });
  
  // Calculate total distance for multi-store route
  const storeList = Object.values(itemsByStore);
  let totalDistance = 0;
  
  if (userLocation && storeList.length > 0) {
    // Calculate route: user -> store1 -> store2 -> ... -> user
    let currentLat = userLocation.lat;
    let currentLon = userLocation.lon;
    
    storeList.forEach(storeInfo => {
      const store = storeInfo.store;
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
    
    // Return to user location
    if (storeList.length > 0 && userLocation) {
      totalDistance += calculateDistance(
        currentLat,
        currentLon,
        userLocation.lat,
        userLocation.lon
      );
    }
  }
  
  return {
    stores: storeList,
    totalCost,
    totalDistance,
    totalStores: storeList.length
  };
}

/**
 * Calculate overall score for a store (transparent formula)
 * @param {Object} costAnalysis - Cost analysis result
 * @param {number} distance - Distance in km
 * @returns {number} Overall score (higher is better)
 */
function calculateOverallScore(costAnalysis, distance) {
  // Score components (transparent):
  // 1. Coverage: 0-40 points (more items available = better)
  // 2. Cost efficiency: 0-40 points (lower cost = better, normalized)
  // 3. Distance: 0-20 points (closer = better)
  
  const coverageScore = (costAnalysis.coverage / 100) * 40;
  
  // Distance score: max 20 points if < 2km, decreasing to 0 at 20km
  const distanceScore = distance 
    ? Math.max(0, 20 - (distance / 20) * 20) 
    : 10; // Default if no distance
  
  // Cost efficiency: hard to normalize without all costs, so weight coverage more
  const totalScore = coverageScore + distanceScore;
  
  return totalScore;
}

/**
 * Get shopping list recommendations
 * @param {Array} shoppingList - Shopping list items
 * @param {string} territory - Territory code
 * @param {Object} userLocation - User location {lat, lon}
 * @returns {Object} Complete recommendations with transparency
 */
export function getShoppingRecommendations(shoppingList, territory, userLocation) {
  // Step 1: Match items to products
  const matchedItems = matchShoppingListToProducts(shoppingList);
  
  // Step 2: Get stores with distances
  const stores = getStoresWithDistances(territory, userLocation);
  
  // Step 3: Find best single store
  const bestSingleStore = findBestSingleStore(matchedItems, stores);
  
  // Step 4: Find optimal multi-store route
  const multiStoreOption = optimizeMultiStoreRoute(matchedItems, stores, userLocation);
  
  // Step 5: Determine recommendation
  const recommendation = determineRecommendation(bestSingleStore, multiStoreOption);
  
  return {
    matchedItems,
    stores,
    bestSingleStore,
    multiStoreOption,
    recommendation,
    transparency: {
      totalItemsRequested: shoppingList.length,
      totalItemsMatched: matchedItems.filter(i => i.matched).length,
      totalItemsWithPrices: matchedItems.filter(i => i.hasRealPrices).length,
      dataSource: 'SEED_PRODUCTS (Real price data)',
      calculationMethod: 'Transparent scoring: Coverage (40%) + Distance (20%)',
      disclaimer: 'Prices are based on publicly available data and store information. Availability may vary.'
    }
  };
}

/**
 * Determine the best recommendation (single store vs multi-store)
 * @param {Object} singleStore - Single store analysis
 * @param {Object} multiStore - Multi-store analysis
 * @returns {Object} Recommendation with reasoning
 */
function determineRecommendation(singleStore, multiStore) {
  if (!singleStore && (!multiStore || multiStore.totalStores === 0)) {
    return {
      type: 'none',
      reasoning: 'No price data available for your shopping list items.'
    };
  }
  
  if (!singleStore) {
    return {
      type: 'multi_store',
      reasoning: 'No single store has all items. Multi-store shopping recommended.',
      option: multiStore
    };
  }
  
  if (!multiStore || multiStore.totalStores === 0) {
    return {
      type: 'single_store',
      reasoning: 'Single store option is the only available choice.',
      option: singleStore
    };
  }
  
  // Compare savings vs convenience
  const savingsAmount = singleStore.totalCost - multiStore.totalCost;
  const savingsPercent = (savingsAmount / singleStore.totalCost) * 100;
  const extraDistance = multiStore.totalDistance - (singleStore.store.distance * 2);
  
  // Decision logic:
  // If savings > 15% and extra distance < 5km: recommend multi-store
  // If savings < 5%: recommend single store (convenience)
  // Otherwise: show both options
  
  if (savingsPercent > 15 && extraDistance < 5) {
    return {
      type: 'multi_store',
      reasoning: `Multi-store shopping saves ${savingsPercent.toFixed(1)}% (€${savingsAmount.toFixed(2)}) with only ${extraDistance.toFixed(1)}km extra distance.`,
      option: multiStore,
      alternative: singleStore
    };
  } else if (savingsPercent < 5) {
    return {
      type: 'single_store',
      reasoning: `Single store is most convenient with minimal price difference (${savingsPercent.toFixed(1)}%).`,
      option: singleStore,
      alternative: multiStore
    };
  } else {
    return {
      type: 'both',
      reasoning: 'Both options are viable. Choose based on your preference for savings vs convenience.',
      singleStore,
      multiStore,
      comparison: {
        savings: savingsAmount,
        savingsPercent,
        extraDistance
      }
    };
  }
}
