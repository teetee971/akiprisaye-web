import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  type DocumentData,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { logError } from '../utils/logger';

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

/**
 * Demo baskets — only used in development mode (import.meta.env.DEV).
 * In production, only real Firestore data is served to avoid presenting
 * fictitious information on a platform dedicated to price transparency.
 */
const DEV_DEMO_BASKETS: TiPanieBasket[] = [
  {
    id: 1,
    name: 'Panier Fruits & Légumes',
    store: 'Carrefour Destrellan',
    territory: 'Guadeloupe',
    price: 5.0,
    originalPrice: 12.0,
    savings: 58,
    stock: true,
    timeSlot: '17h-19h',
    description: 'Fruits et légumes de saison légèrement abîmés',
    image: '/img/panie-fruits.jpg',
    lat: 16.262,
    lon: -61.583,
  },
  {
    id: 2,
    name: 'Panier Boulangerie',
    store: 'Super U Baie-Mahault',
    territory: 'Guadeloupe',
    price: 3.5,
    originalPrice: 8.0,
    savings: 56,
    stock: true,
    timeSlot: '18h-20h',
    description: 'Pains et viennoiseries de la veille',
    image: '/img/panie-boul.jpg',
    lat: 16.271,
    lon: -61.588,
  },
  {
    id: 3,
    name: 'Panier Mixte',
    store: 'Leader Price Gosier',
    territory: 'Guadeloupe',
    price: 6.0,
    originalPrice: 15.0,
    savings: 60,
    stock: false,
    timeSlot: '17h30-19h30',
    description: 'Assortiment de produits proches de la date limite',
    image: '/img/panie-mix.jpg',
    lat: 16.224,
    lon: -61.493,
  },
  {
    id: 4,
    name: 'Panier Fruits Tropicaux',
    store: 'Hyper U Le Lamentin',
    territory: 'Martinique',
    price: 4.5,
    originalPrice: 11.0,
    savings: 59,
    stock: true,
    timeSlot: '16h-18h',
    description: 'Fruits locaux de saison',
    image: '/img/panie-fruits.jpg',
    lat: 14.613,
    lon: -60.996,
  },
  {
    id: 5,
    name: 'Panier Anti-Gaspi',
    store: 'Carrefour Matoury',
    territory: 'Guyane',
    price: 5.5,
    originalPrice: 13.0,
    savings: 58,
    stock: true,
    timeSlot: '17h-19h',
    description: 'Produits variés proches de la date limite',
    image: '/img/panie-mix.jpg',
    lat: 4.853,
    lon: -52.328,
  },
];

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
      b.price >= 0,
  );
}

/**
 * Get all baskets, optionally filtered.
 *
 * In development mode, returns demo data when Firestore has no results.
 * In production, only real Firestore data is returned.
 */
export const getBaskets = async (filters: BasketFilters = {}): Promise<TiPanieBasket[]> => {
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

    // In development only, fall back to demo data when Firestore is empty
    if (import.meta.env.DEV) {
      return applyFilters(DEV_DEMO_BASKETS, filters);
    }

    return [];
  } catch (error) {
    logError('Error in getBaskets', error);
    throw new Error('Impossible de charger les paniers. Veuillez réessayer plus tard.');
  }
};

/**
 * Save basket view to user history (Firestore).
 */
export const saveBasketToHistory = async (
  userId: string,
  basket: TiPanieBasket,
): Promise<void> => {
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
    return docs.docs.map((d) => ({ id: d.id, ...(d.data() as DocumentData) })) as BasketHistoryEntry[];
  } catch (error) {
    logError('Error fetching basket history', error);
    return [];
  }
};
