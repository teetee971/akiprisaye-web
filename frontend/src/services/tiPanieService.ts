import { collection, addDoc, getDocs, query, where, type DocumentData } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { logError } from '../utils/logger';
import { activateIncidentMode, clearIncidentMode } from './incidentMode';
import { liveApiFetchJson } from './liveApiClient';

export interface TiPanieBasket {
  id?: string | number;
  name: string;
  store: string;
  territory: string;
  price: number;
  originalPrice?: number;
  savings?: number;
  stock?: boolean;
  timeSlot?: string;
  description?: string;
  image?: string;
  lat?: number;
  lon?: number;
}

export interface BasketFilters {
  territory?: string;
  store?: string;
  stockOnly?: boolean;
  timeSlot?: string;
}

export interface BasketHistoryEntry {
  id?: string;
  userId: string;
  basketId: string | number | undefined;
  basketName: string;
  store: string;
  territory: string;
  viewedAt: string;
}

function applyFilters(baskets: TiPanieBasket[], filters: BasketFilters): TiPanieBasket[] {
  let result = baskets;

  if (filters.territory && filters.territory !== 'all') {
    result = result.filter((b) => b.territory === filters.territory);
  }
  if (filters.store && typeof filters.store === 'string') {
    const term = filters.store.toLowerCase();
    result = result.filter((b) => b.store.toLowerCase().includes(term));
  }
  if (filters.stockOnly) {
    result = result.filter((b) => b.stock === true);
  }
  if (filters.timeSlot && typeof filters.timeSlot === 'string') {
    result = result.filter((b) => b.timeSlot === filters.timeSlot);
  }

  // Validate basket structure
  return result.filter(
    (b) =>
      b !== null &&
      typeof b.name === 'string' &&
      typeof b.store === 'string' &&
      typeof b.price === 'number' &&
      b.price >= 0
  );
}

/**
 * Get all baskets, optionally filtered.
 *
 * Tries live API first, then falls back to Firestore when available.
 */
export const getBaskets = async (filters: BasketFilters = {}): Promise<TiPanieBasket[]> => {
  try {
    const payload = await liveApiFetchJson<{ baskets?: TiPanieBasket[] }>('/ti-panie', {
      incidentReason: 'ti_panie_live_api_unavailable',
      timeoutMs: 10000,
    });

    const apiBaskets = Array.isArray(payload?.baskets) ? payload.baskets : [];
    clearIncidentMode();
    return applyFilters(apiBaskets, filters);
  } catch (liveApiError) {
    logError('Error in getBaskets (live API), fallback to Firestore', liveApiError);
    activateIncidentMode('ti_panie_live_api_unavailable');
    try {
      if (db) {
        const basketsRef = collection(db, 'ti_panie');
        const snapshot = await getDocs(basketsRef);
        const firestoreBaskets: TiPanieBasket[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as DocumentData),
        })) as TiPanieBasket[];

        if (firestoreBaskets.length > 0) {
          return applyFilters(firestoreBaskets, filters);
        }
      }

      return [];
    } catch (error) {
      logError('Error in getBaskets (Firestore fallback)', error);
      throw new Error('Impossible de charger les paniers. Veuillez réessayer plus tard.');
    }
  }
};

/**
 * Returns real Firestore data only.
 */
export const getBasketsFirestoreOnly = async (
  filters: BasketFilters = {}
): Promise<TiPanieBasket[]> => {
  try {
    if (db) {
      const basketsRef = collection(db, 'ti_panie');
      const snapshot = await getDocs(basketsRef);
      const firestoreBaskets: TiPanieBasket[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as DocumentData),
      })) as TiPanieBasket[];

      if (firestoreBaskets.length > 0) {
        return applyFilters(firestoreBaskets, filters);
      }
    }

    return [];
  } catch (error) {
    logError('Error in getBasketsFirestoreOnly', error);
    throw new Error('Impossible de charger les paniers. Veuillez réessayer plus tard.');
  }
};

/**
 * Save basket view to user history (Firestore).
 */
export const saveBasketToHistory = async (userId: string, basket: TiPanieBasket): Promise<void> => {
  if (!userId || !db) return;

  try {
    await addDoc(collection(db, 'basket_history'), {
      userId,
      basketId: basket.id,
      basketName: basket.name,
      store: basket.store,
      territory: basket.territory,
      viewedAt: new Date().toISOString(),
    });
  } catch (error) {
    logError('Error saving basket to history', error);
  }
};

/**
 * Get user's basket viewing history.
 */
export const getUserBasketHistory = async (userId: string): Promise<BasketHistoryEntry[]> => {
  if (!userId || !db) return [];

  try {
    const q = query(collection(db, 'basket_history'), where('userId', '==', userId));
    const docs = await getDocs(q);
    return docs.docs.map((d) => ({
      id: d.id,
      ...(d.data() as DocumentData),
    })) as BasketHistoryEntry[];
  } catch (error) {
    logError('Error fetching basket history', error);
    return [];
  }
};
