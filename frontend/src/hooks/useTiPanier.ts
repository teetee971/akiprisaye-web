 
 
import { useCallback, useEffect, useState } from 'react';
import { auth, db } from '../lib/firebase';
import { doc, setDoc, getDoc, collection, onSnapshot } from 'firebase/firestore';
import { safeLocalStorage } from '../utils/safeLocalStorage';

// Local storage key for ti-panier v1
const STORAGE_KEY = 'ti-panier:v1';

// Price comparison tolerance for determining min/max
const PRICE_COMPARISON_TOLERANCE = 0.01;

// Item stored in the panier
export type TiPanierItem = {
  id: string; // unique identifier for the item
  quantity: number; // quantity for this item (integer >= 0)
  // optional metadata for consumer needs (name, price, etc.)
  meta?: Record<string, unknown>;
};

// Types for cart (comparison) vs wishlist (favorites)
export type PanierType = 'comparison' | 'wishlist';

// Helper to extract price from item metadata
function extractPrice(item: TiPanierItem): number {
  const price = item.meta && (item.meta as any).price;
  return typeof price === 'number' ? price : parseFloat(String(price || '0'));
}

function safeParse(raw: string | null): TiPanierItem[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // basic validation/coercion
    return parsed
      .map((p) => ({
        id: String(p.id),
        quantity: typeof p.quantity === 'number' && Number.isFinite(p.quantity) ? Math.max(0, Math.floor(p.quantity)) : 0,
        meta: p.meta,
      }))
      .filter((p) => p.id);
  } catch {
    return [];
  }
}

function readFromStorage(type: PanierType = 'comparison'): TiPanierItem[] {
  if (typeof window === 'undefined' || !safeLocalStorage) return [];
  const key = type === 'wishlist' ? `${STORAGE_KEY}:wishlist` : STORAGE_KEY;
  return safeParse(safeLocalStorage.getItem(key));
}

function writeToStorage(items: TiPanierItem[], type: PanierType = 'comparison') {
  if (typeof window === 'undefined' || !safeLocalStorage) return;
  try {
    const key = type === 'wishlist' ? `${STORAGE_KEY}:wishlist` : STORAGE_KEY;
    safeLocalStorage.setItem(key, JSON.stringify(items));
  } catch {
    // ignore quota/write errors
  }
}

// Write to Firestore for authenticated users
async function writeToFirestore(items: TiPanierItem[], type: PanierType = 'comparison') {
  if (!auth || !auth.currentUser || !db) return;
  try {
    const userDocRef = doc(db, 'users', auth.currentUser.uid);
    const field = type === 'wishlist' ? 'wishlist' : 'cart';
    await setDoc(userDocRef, {
      [field]: items,
      [`${field}UpdatedAt`]: new Date(),
    }, { merge: true });
  } catch (error) {
    console.error('Error writing to Firestore:', error);
  }
}

// Read from Firestore for authenticated users
async function readFromFirestore(type: PanierType = 'comparison'): Promise<TiPanierItem[]> {
  if (!auth || !auth.currentUser || !db) return [];
  try {
    const userDocRef = doc(db, 'users', auth.currentUser.uid);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
      const data = userDoc.data();
      const field = type === 'wishlist' ? 'wishlist' : 'cart';
      const items = data[field];
      if (Array.isArray(items)) {
        return items.map((p: any) => ({
          id: String(p.id),
          quantity: typeof p.quantity === 'number' ? Math.max(0, Math.floor(p.quantity)) : 0,
          meta: p.meta,
        }));
      }
    }
  } catch (error) {
    console.error('Error reading from Firestore:', error);
  }
  return [];
}

// Hook exposing panier operations
export function useTiPanier(type: PanierType = 'comparison') {
  const [items, setItems] = useState<TiPanierItem[]>(() => readFromStorage(type));
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Track authentication state
  useEffect(() => {
    if (!auth) return;
    
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setIsAuthenticated(!!user);
      
      // Load from Firestore if authenticated
      if (user && db) {
        const firestoreItems = await readFromFirestore(type);
        if (firestoreItems.length > 0) {
          setItems(firestoreItems);
        }
      }
    });

    return () => unsubscribe();
  }, [type]);

  // persist whenever items change
  useEffect(() => {
    writeToStorage(items, type);
    
    // Also persist to Firestore if authenticated
    if (isAuthenticated) {
      writeToFirestore(items, type);
    }
  }, [items, type, isAuthenticated]);

  // listen for storage changes from other tabs/windows
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      const key = type === 'wishlist' ? `${STORAGE_KEY}:wishlist` : STORAGE_KEY;
      if (e.key === key) {
        setItems(readFromStorage(type));
      }
    }

    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [type]);

  const addItem = useCallback((item: TiPanierItem) => {
    setItems((prev) => {
      const idx = prev.findIndex((p) => p.id === item.id);
      const qty = typeof item.quantity === 'number' && Number.isFinite(item.quantity) ? Math.max(0, Math.floor(item.quantity)) : 1;
      if (idx === -1) {
        return [...prev, { ...item, quantity: qty }];
      }
      const updated = [...prev];
      updated[idx] = { ...updated[idx], quantity: Math.max(0, updated[idx].quantity + qty), meta: item.meta ?? updated[idx].meta };
      return updated;
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const clear = useCallback(() => {
    setItems([]);
  }, []);

  const count = items.reduce((acc, it) => acc + (typeof it.quantity === 'number' ? it.quantity : 0), 0);

  // Calculate min/max prices
  const priceStats = items.reduce((acc, item) => {
    const price = extractPrice(item);
    
    if (price > 0) {
      if (acc.min === null || price < acc.min) acc.min = price;
      if (acc.max === null || price > acc.max) acc.max = price;
      acc.total += price * item.quantity;
    }
    
    return acc;
  }, { min: null as number | null, max: null as number | null, total: 0 });

  return {
    items,
    addItem,
    removeItem,
    clear,
    count,
    priceStats,
    type,
    isAuthenticated,
  } as const;
}
