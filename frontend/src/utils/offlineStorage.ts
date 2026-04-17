/**
 * Offline Storage with IndexedDB
 * Enables app to work without internet connection
 * RGPD compliant - all data stored locally
 */

const DB_NAME = 'ShoppingListDB';
const DB_VERSION = 1;
const STORES_STORE = 'stores';
const DISTANCES_STORE = 'distances';
const LISTS_STORE = 'shopping_lists';

export interface OfflineStore {
  id: string;
  name: string;
  enseigne?: string;
  type_magasin?: string;
  lat: number;
  lon: number;
  territory: string;
  presence: string;
  lastUpdated: number;
}

export interface OfflineList {
  id: string;
  items: string[];
  createdAt: number;
  lastModified: number;
}

/**
 * Initialize IndexedDB
 */
export async function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create stores object store
      if (!db.objectStoreNames.contains(STORES_STORE)) {
        const storesStore = db.createObjectStore(STORES_STORE, { keyPath: 'id' });
        storesStore.createIndex('territory', 'territory', { unique: false });
      }

      // Create distances cache
      if (!db.objectStoreNames.contains(DISTANCES_STORE)) {
        db.createObjectStore(DISTANCES_STORE, { keyPath: 'key' });
      }

      // Create shopping lists store
      if (!db.objectStoreNames.contains(LISTS_STORE)) {
        const listsStore = db.createObjectStore(LISTS_STORE, { keyPath: 'id' });
        listsStore.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };
  });
}

/**
 * Cache stores for offline use
 */
export async function cacheStores(stores: OfflineStore[]): Promise<void> {
  const db = await initDB();
  const tx = db.transaction(STORES_STORE, 'readwrite');
  const store = tx.objectStore(STORES_STORE);

  for (const storeData of stores) {
    store.put({ ...storeData, lastUpdated: Date.now() });
  }

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

/**
 * Get cached stores
 */
export async function getCachedStores(territory?: string): Promise<OfflineStore[]> {
  const db = await initDB();
  const tx = db.transaction(STORES_STORE, 'readonly');
  const store = tx.objectStore(STORES_STORE);

  let request: IDBRequest;
  if (territory) {
    const index = store.index('territory');
    request = index.getAll(territory);
  } else {
    request = store.getAll();
  }

  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      db.close();
      resolve(request.result);
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

/**
 * Save shopping list offline
 */
export async function saveListOffline(list: OfflineList): Promise<void> {
  const db = await initDB();
  const tx = db.transaction(LISTS_STORE, 'readwrite');
  const store = tx.objectStore(LISTS_STORE);

  store.put(list);

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

/**
 * Get saved shopping lists
 */
export async function getSavedLists(): Promise<OfflineList[]> {
  const db = await initDB();
  const tx = db.transaction(LISTS_STORE, 'readonly');
  const store = tx.objectStore(LISTS_STORE);
  const request = store.getAll();

  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      db.close();
      resolve(request.result);
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

/**
 * Delete a saved list
 */
export async function deleteList(id: string): Promise<void> {
  const db = await initDB();
  const tx = db.transaction(LISTS_STORE, 'readwrite');
  const store = tx.objectStore(LISTS_STORE);

  store.delete(id);

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

/**
 * Clear all offline data (for privacy)
 */
export async function clearOfflineData(): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DB_NAME);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Check if IndexedDB is available
 */
export function isIndexedDBAvailable(): boolean {
  return 'indexedDB' in window;
}

/**
 * Get storage usage
 */
export async function getStorageUsage(): Promise<{ used: number; quota: number } | null> {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    try {
      const estimate = await navigator.storage.estimate();
      return {
        used: estimate.usage || 0,
        quota: estimate.quota || 0,
      };
    } catch (error) {
      console.error('Error getting storage estimate:', error);
    }
  }
  return null;
}
