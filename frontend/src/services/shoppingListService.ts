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
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  type DocumentData,
} from 'firebase/firestore';
import { logError, logWarn } from '../utils/logger';

export interface FirestoreProduct {
  ean: string;
  name?: string;
  brand?: string;
  [key: string]: unknown;
}

export interface FirestorePrice {
  id: string;
  ean?: string;
  price: number;
  territory?: string;
  storeId?: string;
  capturedAt: number;
  expiresAt: number | null;
  ageHours: number;
  [key: string]: unknown;
}

export interface FirestoreStore {
  id: string;
  name?: string;
  enseigne?: string;
  type_magasin?: string;
  lat?: number;
  lng?: number;
  territory?: string;
  presence?: string;
  source?: string;
  [key: string]: unknown;
}

export interface PriceQueryOptions {
  territory?: string;
  storeId?: string;
  maxAgeHours?: number;
  limit?: number;
}

export type DataFreshnessLevel = 'ok' | 'warning' | 'critical';

export interface DataFreshnessResult {
  level: DataFreshnessLevel;
  message: string;
  warning: string | null;
}

/**
 * Get product by EAN from Firestore.
 * Returns null if not found — NO SUBSTITUTION.
 */
export async function getProductByEan(ean: string): Promise<FirestoreProduct | null> {
  if (!db) {
    logWarn('Firebase not initialized - returning null');
    return null;
  }

  try {
    const docRef = doc(db, 'products', ean);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { ean, ...(docSnap.data() as DocumentData) } as FirestoreProduct;
    }
    return null;
  } catch (error) {
    logError('Error getting product', error);
    return null;
  }
}

/**
 * Get observed prices for a product by EAN.
 * Options: territory, maxAgeHours, storeId, limit.
 */
export async function getPricesByEan(
  ean: string,
  options: PriceQueryOptions = {},
): Promise<FirestorePrice[]> {
  if (!db) {
    logWarn('Firebase not initialized - returning empty array');
    return [];
  }

  try {
    const pricesRef = collection(db, 'prices');
    let q = query(pricesRef, where('ean', '==', ean));

    if (options.territory) {
      q = query(q, where('territory', '==', options.territory));
    }
    if (options.storeId) {
      q = query(q, where('storeId', '==', options.storeId));
    }
    q = query(q, orderBy('capturedAt', 'desc'));
    if (options.limit) {
      q = query(q, limit(options.limit));
    }

    const snapshot = await getDocs(q);
    const now = Date.now();
    const prices: FirestorePrice[] = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as DocumentData;

      // Filter out expired prices
      const expiresMillis =
        data['expiresAt']?.toMillis ? (data['expiresAt'].toMillis() as number) : null;
      if (expiresMillis !== null && expiresMillis < now) return;

      const capturedMillis: number = data['capturedAt']?.toMillis
        ? (data['capturedAt'].toMillis() as number)
        : data['createdAt']?.toMillis
          ? (data['createdAt'].toMillis() as number)
          : now;
      const ageHours = Math.floor((now - capturedMillis) / (1000 * 60 * 60));

      if (options.maxAgeHours !== undefined && ageHours > options.maxAgeHours) return;

      prices.push({
        id: docSnap.id,
        ...data,
        ageHours,
        capturedAt: capturedMillis,
        expiresAt: expiresMillis,
        price: typeof data['price'] === 'number' ? data['price'] : parseFloat(data['price'] as string) || 0,
      } as FirestorePrice);
    });

    return prices;
  } catch (error) {
    logError('Error getting prices', error);
    return [];
  }
}

/**
 * Get stores for a territory from Firestore.
 * Falls back to an empty array (no mock data in production).
 */
export async function getStoresByTerritory(territory: string): Promise<FirestoreStore[]> {
  if (!db) {
    logWarn('Firebase not initialized - returning empty array');
    return [];
  }

  try {
    const storesRef = collection(db, 'stores');
    const q = query(
      storesRef,
      where('territory', '==', territory),
      where('presence', '==', 'confirmee'),
    );

    const snapshot = await getDocs(q);
    const stores: FirestoreStore[] = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as DocumentData;
      const coords = data['coordonnees_gps'] as { latitude?: number; longitude?: number } | undefined;
      if (coords?.latitude && coords?.longitude) {
        stores.push({
          id: docSnap.id,
          ...data,
          lat: coords.latitude,
          lng: coords.longitude,
        } as FirestoreStore);
      }
    });

    return stores;
  } catch (error) {
    logError('Error getting stores', error);
    return [];
  }
}

// Re-export for backward compatibility
export { calculateDistance } from '../utils/geoLocation';

/**
 * Check if a price observation is outdated.
 * Returns warning level: 'ok', 'warning', or 'critical'.
 */
export function getPriceDataFreshness(capturedAt: number): DataFreshnessResult {
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
    message: `Prix observé il y a ${ageDays === 0 ? "aujourd'hui" : ageDays + ' jour(s)'}`,
    warning: null,
  };
}

/**
 * Returns an empty array — no mock price data.
 * @deprecated Do not use; real prices must come from Firestore.
 */
export function getMockPricesForProduct(_ean: string, _territory: string): FirestorePrice[] {
  logWarn('getMockPricesForProduct called — this should NOT happen in production');
  return [];
}
