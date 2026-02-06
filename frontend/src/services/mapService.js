import { getStoresByTerritory as getStoresFromSeed, getAllStores } from '../data/seedStores.js';
import { 
  loadReceiptObservations, 
  extractStoresFromReceipts, 
  matchReceiptStoresWithKnown 
} from './storeFromReceiptsService.js';

/**
 * Get stores by territory for display on the map
 * Converts seedStores format to map format and augments with receipt data
 * @param {string} territory - Territory name (e.g., 'Guadeloupe', 'Martinique')
 * @param {boolean} includeReceiptStores - Whether to include stores discovered from receipts (default: true)
 * @returns {Promise<Array>} Array of stores with lat, lon, name, category, and id
 */
export const getStoresByTerritory = async (territory, includeReceiptStores = true) => {
  // Get stores from seed data
  const seedStores = getStoresFromSeed(territory);
  
  // Convert seedStores format to map format
  let stores = seedStores.map(store => ({
    id: store.id,
    name: store.name,
    lat: store.coordinates.lat,
    lon: store.coordinates.lon,
    category: store.chain, // Use chain as category
    city: store.city,
    address: store.address,
    phone: store.phone,
    openingHours: store.openingHours,
    services: store.services,
    source: 'seed_data',
  }));
  
  // If requested, augment with stores from receipts
  if (includeReceiptStores) {
    try {
      const observations = await loadReceiptObservations();
      const receiptStores = extractStoresFromReceipts(observations);
      const allKnownStores = getAllStores();
      const matchedReceiptStores = matchReceiptStoresWithKnown(receiptStores, allKnownStores);
      
      // Filter to only this territory and stores with coordinates
      const territoryReceiptStores = matchedReceiptStores
        .filter(store => 
          store.territory === territory && 
          store.coordinates && 
          !store.needsGeocoding
        )
        .map(store => ({
          id: store.id,
          name: store.name,
          lat: store.coordinates.lat,
          lon: store.coordinates.lon,
          category: store.chain,
          city: store.city,
          address: store.address,
          phone: store.phone,
          openingHours: store.openingHours,
          services: store.services,
          source: 'receipt_observation',
          observationCount: store.observationCount,
          lastObservation: store.lastObservation,
        }));
      
      // Merge stores, avoiding duplicates (use ID as key)
      const storeMap = new Map();
      stores.forEach(store => storeMap.set(store.id, store));
      territoryReceiptStores.forEach(store => {
        if (!storeMap.has(store.id)) {
          storeMap.set(store.id, store);
        } else {
          // Create new object instead of mutating to avoid React state issues
          const existing = storeMap.get(store.id);
          storeMap.set(store.id, {
            ...existing,
            hasReceiptObservations: true,
            observationCount: store.observationCount,
            lastObservation: store.lastObservation,
          });
        }
      });
      
      stores = Array.from(storeMap.values());
    } catch (error) {
      console.warn('Could not load stores from receipts:', error);
      // Continue with seed stores only if receipt loading fails
    }
  }
  
  return stores;
};
