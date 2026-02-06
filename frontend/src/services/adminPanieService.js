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
} from 'firebase/firestore';

const COLLECTION_NAME = 'ti_panie';
const basketsRef = collection(db, COLLECTION_NAME);

/**
 * Get all baskets from Firestore
 */
export const getAllBaskets = async () => {
  if (!db) return [];
  try {
    const snapshot = await getDocs(basketsRef);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error('Error fetching baskets:', error);
    throw error;
  }
};

/**
 * Add a new basket to Firestore
 */
export const addBasket = async (data) => {
  if (!db) throw new Error('Database not available');
  try {
    const docRef = await addDoc(basketsRef, {
      ...data,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    });
    return { id: docRef.id, ...data };
  } catch (error) {
    console.error('Error adding basket:', error);
    throw error;
  }
};

/**
 * Update an existing basket
 */
export const updateBasket = async (id, data) => {
  if (!db) throw new Error('Database not available');
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
    return { id, ...data };
  } catch (error) {
    console.error('Error updating basket:', error);
    throw error;
  }
};

/**
 * Delete a basket
 */
export const deleteBasket = async (id) => {
  if (!db) throw new Error('Database not available');
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
    return id;
  } catch (error) {
    console.error('Error deleting basket:', error);
    throw error;
  }
};

/**
 * Check if user is admin
 */
export const checkIsAdmin = async (user) => {
  if (!user || !db) return false;

  try {
    // Check custom claims first (if available)
    const tokenResult = await user.getIdTokenResult();
    if (tokenResult.claims.admin) {
      return true;
    }

    // Fallback: check Firestore user document (ensure Firestore rules prevent users from setting isAdmin)
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    const userData = userDoc.data();
    
    return userData?.isAdmin === true;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};
