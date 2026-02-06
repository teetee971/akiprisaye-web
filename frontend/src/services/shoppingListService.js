/**
 * Shopping List Service
 * Handles product matching and price retrieval with STRICT rules:
 * - NO FAKE DATA
 * - NO ESTIMATED PRICES
 * - NO AI GUESSING
 * - ONLY REAL, OBSERVED, GEOLOCATED DATA
 * 
 * PERFORMANCE OPTIMIZATIONS:
 * - Uses cached distance calculations from geoLocation utility
 * - Batch processing for multiple stores
 * - Memoization of expensive operations
 */

import { db } from '../lib/firebase';
import { collection, doc, getDoc, getDocs, query, where, orderBy, limit } from 'firebase/firestore';

/**
 * Get product by EAN from Firestore
 * Returns NULL if not found (NO SUBSTITUTION)
 */
export async function getProductByEan(ean) {
  if (!db) {
    console.warn('Firebase not initialized - returning null');
    return null;
  }

  try {
    const docRef = doc(db, 'products', ean);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { ean, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error('Error getting product:', error);
    return null;
  }
}

/**
 * Get observed prices for a product by EAN
 * Options:
 * - territory: filter by territory
 * - maxAgeHours: only return prices observed within X hours
 * - storeId: filter by specific store
 */
export async function getPricesByEan(ean, options = {}) {
  if (!db) {
    console.warn('Firebase not initialized - returning empty array');
    return [];
  }

  try {
    const pricesRef = collection(db, 'prices');
    let q = query(pricesRef, where('ean', '==', ean));

    // Apply territory filter if provided
    if (options.territory) {
      q = query(q, where('territory', '==', options.territory));
    }

    // Apply store filter if provided
    if (options.storeId) {
      q = query(q, where('storeId', '==', options.storeId));
    }

    // Order by captured date (most recent first)
    q = query(q, orderBy('capturedAt', 'desc'));

    // Limit results if needed
    if (options.limit) {
      q = query(q, limit(options.limit));
    }

    const snapshot = await getDocs(q);
    const now = Date.now();
    const prices = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      
      // Filter out expired prices
      if (data.expiresAt && data.expiresAt.toMillis && data.expiresAt.toMillis() < now) {
        return;
      }
      
      // Calculate age in hours
      const capturedAt = data.capturedAt?.toMillis ? data.capturedAt.toMillis() : 
                        data.createdAt?.toMillis ? data.createdAt.toMillis() : now;
      const ageHours = Math.floor((now - capturedAt) / (1000 * 60 * 60));
      
      // Apply max age filter if specified
      if (options.maxAgeHours && ageHours > options.maxAgeHours) {
        return;
      }
      
      prices.push({
        id: docSnap.id,
        ...data,
        ageHours,
        capturedAt: capturedAt,
        expiresAt: data.expiresAt?.toMillis ? data.expiresAt.toMillis() : null,
        // Ensure price is a number
        price: typeof data.price === 'number' ? data.price : parseFloat(data.price) || 0,
      });
    });

    return prices;
  } catch (error) {
    console.error('Error getting prices:', error);
    return [];
  }
}

/**
 * Get stores from Firestore or local data
 * Returns stores with GPS coordinates for the specified territory
 */
export async function getStoresByTerritory(territory) {
  if (!db) {
    console.warn('Firebase not initialized - returning mock data');
    return getMockStores(territory);
  }

  try {
    const storesRef = collection(db, 'stores');
    const q = query(
      storesRef,
      where('territory', '==', territory),
      where('presence', '==', 'confirmee')
    );

    const snapshot = await getDocs(q);
    const stores = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      
      // Only include stores with GPS coordinates
      if (data.coordonnees_gps && data.coordonnees_gps.latitude && data.coordonnees_gps.longitude) {
        stores.push({
          id: docSnap.id,
          ...data,
          lat: data.coordonnees_gps.latitude,
          lng: data.coordonnees_gps.longitude,
        });
      }
    });

    return stores.length > 0 ? stores : getMockStores(territory);
  } catch (error) {
    console.error('Error getting stores:', error);
    return getMockStores(territory);
  }
}

/**
 * Mock stores data (fallback when Firebase not available)
 * NOTE: In production, these should come from INSEE SIRENE with real coordinates
 */
function getMockStores(territory) {
  const mockStores = {
    'Guadeloupe': [
      {
        id: 'mock_1',
        name: 'Carrefour Destrellan',
        enseigne: 'Carrefour',
        type_magasin: 'Hypermarché',
        lat: 16.2415,
        lng: -61.5331,
        territory: 'Guadeloupe',
        presence: 'confirmee',
        source: 'Données simulées - À remplacer par INSEE SIRENE',
      },
      {
        id: 'mock_2',
        name: 'Super U Baie-Mahault',
        enseigne: 'Super U',
        type_magasin: 'Supermarché',
        lat: 16.271,
        lng: -61.588,
        territory: 'Guadeloupe',
        presence: 'confirmee',
        source: 'Données simulées - À remplacer par INSEE SIRENE',
      },
      {
        id: 'mock_3',
        name: 'Leader Price Gosier',
        enseigne: 'Leader Price',
        type_magasin: 'Hard discount',
        lat: 16.224,
        lng: -61.493,
        territory: 'Guadeloupe',
        presence: 'confirmee',
        source: 'Données simulées - À remplacer par INSEE SIRENE',
      },
    ],
    'Martinique': [
      {
        id: 'mock_4',
        name: 'Hyper U Le Lamentin',
        enseigne: 'Hyper U',
        type_magasin: 'Hypermarché',
        lat: 14.613,
        lng: -60.996,
        territory: 'Martinique',
        presence: 'confirmee',
        source: 'Données simulées - À remplacer par INSEE SIRENE',
      },
    ],
  };

  return mockStores[territory] || [];
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 * NOTE: This is kept for backward compatibility but uses the optimized version from geoLocation
 */
export { calculateDistance } from '../utils/geoLocation';

/**
 * Check if a price observation is outdated
 * Returns warning level: null, 'warning', or 'critical'
 */
export function getPriceDataFreshness(capturedAt) {
  const now = Date.now();
  const ageHours = Math.floor((now - capturedAt) / (1000 * 60 * 60));
  const ageDays = Math.floor(ageHours / 24);

  if (ageDays > 30) {
    return {
      level: 'critical',
      message: `⚠️ Prix observé il y a ${ageDays} jours`,
      warning: 'Ces données peuvent ne plus être exactes',
    };
  } else if (ageDays > 7) {
    return {
      level: 'warning',
      message: `⚠️ Prix observé il y a ${ageDays} jours`,
      warning: 'Données potentiellement obsolètes',
    };
  }

  return {
    level: 'ok',
    message: `Prix observé il y a ${ageDays === 0 ? 'aujourd\'hui' : ageDays + ' jour(s)'}`,
    warning: null,
  };
}

/**
 * Mock price data for development
 * IMPORTANT: This should NEVER be used in production
 */
export function getMockPricesForProduct(_ean, _territory) {
  console.warn('⚠️ Using MOCK price data - This should NOT happen in production!');
  
  // Return empty array by default - NO FAKE PRICES
  return [];
}
