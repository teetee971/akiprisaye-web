import { db } from '../lib/firebase';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  type DocumentData,
} from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { logError } from '../utils/logger';

const COLLECTION_NAME = 'ti_panie';

export interface PanieBasket {
  id?: string;
  name?: string;
  store?: string;
  territory?: string;
  price?: number;
  originalPrice?: number;
  stock?: number;
  [key: string]: unknown;
}

/**
 * Get all baskets from Firestore.
 * basketsRef is created inside the function to avoid module-level crash
 * when db is null (e.g. Firebase not yet initialized or offline).
 */
export const getAllBaskets = async (): Promise<PanieBasket[]> => {
  if (!db) return [];
  try {
    const basketsRef = collection(db, COLLECTION_NAME);
    const snapshot = await getDocs(basketsRef);
    return snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as DocumentData) }));
  } catch (error) {
    logError('Error fetching baskets', error);
    throw error;
  }
};

/**
 * Add a new basket to Firestore.
 */
export const addBasket = async (data: Omit<PanieBasket, 'id'>): Promise<PanieBasket> => {
  if (!db) throw new Error('Database not available');
  try {
    const basketsRef = collection(db, COLLECTION_NAME);
    const docRef = await addDoc(basketsRef, {
      ...data,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    });
    return { id: docRef.id, ...data };
  } catch (error) {
    logError('Error adding basket', error);
    throw error;
  }
};

/**
 * Update an existing basket.
 */
export const updateBasket = async (
  id: string,
  data: Partial<PanieBasket>,
): Promise<PanieBasket> => {
  if (!db) throw new Error('Database not available');
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
    return { id, ...data };
  } catch (error) {
    logError('Error updating basket', error);
    throw error;
  }
};

/**
 * Delete a basket.
 */
export const deleteBasket = async (id: string): Promise<string> => {
  if (!db) throw new Error('Database not available');
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
    return id;
  } catch (error) {
    logError('Error deleting basket', error);
    throw error;
  }
};

/**
 * Check if user is admin.
 * NOTE: This is a client-side check only and relies on Firestore rules to
 * prevent users from self-granting admin rights. For sensitive operations,
 * always enforce admin verification server-side (Express middleware).
 */
export const checkIsAdmin = async (user: User | null): Promise<boolean> => {
  if (!user || !db) return false;

  try {
    // Check custom claims first (set via Firebase Admin SDK)
    const tokenResult = await user.getIdTokenResult();
    if (tokenResult.claims['admin']) {
      return true;
    }

    // Fallback: check Firestore user document
    // Security depends on Firestore rules preventing users from writing isAdmin
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    const userData = userDoc.data();

    return userData?.['isAdmin'] === true;
  } catch (error) {
    logError('Error checking admin status', error);
    return false;
  }
};
