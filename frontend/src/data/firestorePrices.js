/**
 * Firestore Prices Module
 * Helper functions for interacting with price-related collections in Firestore
 */

import { db } from '../../firebase-config.js';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  query,
  where,
  serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import { getStoreById as getSeedStoreById } from './seedStores.js';

/**
 * Get product by EAN
 * @param {string} ean - Product EAN code
 * @returns {Promise<Object|null>} Product data or null if not found
 */
export async function getProductByEan(ean) {
  try {
    const docRef = doc(db, 'products', ean);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { ean, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error('Error getting product:', error);
    throw error;
  }
}

/**
 * Get prices for a product by EAN
 * @param {string} ean - Product EAN code
 * @param {Object} options - Optional filters
 * @param {number} options.maxAgeHours - Maximum age in hours
 * @returns {Promise<Array>} Array of price documents
 */
export async function getPricesByEan(ean, options = {}) {
  try {
    const pricesRef = collection(db, 'prices');
    const q = query(pricesRef, where('ean', '==', ean));
    
    const snapshot = await getDocs(q);
    const now = Date.now();
    
    const prices = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      
      // Filter out expired prices
      if (data.expiresAt && data.expiresAt.toMillis() < now) {
        return;
      }
      
      // Calculate age in hours
      const capturedAt = data.capturedAt?.toMillis() || data.createdAt?.toMillis() || now;
      const ageHours = Math.floor((now - capturedAt) / (1000 * 60 * 60));
      
      // Apply max age filter if specified
      if (options.maxAgeHours && ageHours > options.maxAgeHours) {
        return;
      }
      
      prices.push({
        id: doc.id,
        ...data,
        ageHours,
        capturedAt: capturedAt,
        expiresAt: data.expiresAt?.toMillis(),
      });
    });
    
    return prices;
  } catch (error) {
    console.error('Error getting prices:', error);
    throw error;
  }
}

/**
 * Get store by ID
 * @param {string} storeId - Store ID
 * @returns {Promise<Object|null>} Store data or null if not found
 */
export async function getStoreById(storeId) {
  try {
    // Try to get from Firestore first
    const docRef = doc(db, 'stores', storeId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: storeId, ...docSnap.data() };
    }
    
    // Fallback to seed data
    const seedStore = getSeedStoreById(storeId);
    return seedStore;
  } catch (error) {
    console.error('Error getting store:', error);
    // Fallback to seed data on error
    return getSeedStoreById(storeId);
  }
}

/**
 * Create a new receipt document
 * @param {Object} receiptData - Receipt data
 * @param {string} receiptData.imageUrl - URL to receipt image
 * @param {Array} receiptData.parsedLines - Array of parsed lines
 * @param {string} receiptData.status - Status: 'pending', 'accepted', or 'rejected'
 * @returns {Promise<string>} Document ID
 */
export async function createReceipt(receiptData) {
  try {
    const receiptsRef = collection(db, 'receipts');
    const docRef = await addDoc(receiptsRef, {
      ...receiptData,
      uploadedAt: serverTimestamp(),
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating receipt:', error);
    throw error;
  }
}

/**
 * Add a new price document
 * @param {Object} priceData - Price data
 * @param {string} priceData.ean - Product EAN
 * @param {string} priceData.storeId - Store ID
 * @param {number} priceData.price - Price
 * @param {number} priceData.unit_price - Unit price (optional)
 * @param {string} priceData.unit - Unit (optional)
 * @param {string} priceData.source - Source: 'partner', 'ocr', or 'user'
 * @param {Date} priceData.capturedAt - Capture date
 * @param {Date} priceData.expiresAt - Expiration date
 * @returns {Promise<string>} Document ID
 */
export async function addPrice(priceData) {
  try {
    const pricesRef = collection(db, 'prices');
    const docRef = await addDoc(pricesRef, {
      ...priceData,
      createdAt: serverTimestamp(),
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error adding price:', error);
    throw error;
  }
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * Note: This function is intentionally duplicated in functions/api/prices.js
 * because Cloudflare Workers cannot import from src/ directory.
 * @param {number} lat1 - Latitude 1
 * @param {number} lng1 - Longitude 1
 * @param {number} lat2 - Latitude 2
 * @param {number} lng2 - Longitude 2
 * @returns {number} Distance in kilometers
 */
export function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Radius of Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
