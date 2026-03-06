/**
 * Store From Receipts Service
 * 
 * Service pour extraire les informations de magasins depuis les tickets de caisse
 * et les intégrer à la carte interactive des magasins.
 * 
 * Utilise les données d'observations (tickets de caisse) comme source
 * pour découvrir automatiquement de nouveaux magasins.
 */

/**
 * Load all receipt observations from data/observations directory
 * @returns {Promise<Array>} Array of receipt observations
 */
export async function loadReceiptObservations() {
  try {
    // Import the observations index
    const response = await fetch(`${import.meta.env.BASE_URL}data/observations/index.json`);
    if (!response.ok) {
      console.warn(`Could not load observations index (HTTP ${response.status})`);
      return [];
    }
    const observations = await response.json();
    return observations;
  } catch (error) {
    console.error('Error loading receipt observations:', error);
    return [];
  }
}

/**
 * Extract store information from receipt observations
 * @param {Array} observations - Array of receipt observations
 * @returns {Array} Array of stores with their information
 */
export function extractStoresFromReceipts(observations) {
  const storesMap = new Map();
  
  observations.forEach(obs => {
    // Skip if missing essential store information
    if (!obs.enseigne || !obs.territoire) {
      return;
    }
    
    // Create a unique key for this store
    // Use magasin_id if available, otherwise use enseigne + commune (or territoire if commune missing)
    // Note: If commune is missing, stores with same enseigne in same territory will be grouped
    const locationKey = obs.commune || `TERRITORY_${obs.territoire}`;
    const storeKey = obs.magasin_id 
      ? `${obs.enseigne}_${obs.magasin_id}`
      : `${obs.enseigne}_${locationKey}`;
    
    // If we've already seen this store, update the observation count
    if (storesMap.has(storeKey)) {
      const existingStore = storesMap.get(storeKey);
      existingStore.observationCount = (existingStore.observationCount || 1) + 1;
      existingStore.lastObservation = obs.date;
      return;
    }
    
    // Create new store entry from receipt data
    const store = {
      id: storeKey.toLowerCase().replace(/\s+/g, '_'),
      name: obs.enseigne,
      chain: obs.enseigne, // Use enseigne as chain
      territory: obs.territoire,
      city: obs.commune || obs.territoire,
      
      // Receipt-specific metadata
      source: 'receipt_observation',
      magasin_id: obs.magasin_id,
      observationCount: 1,
      firstObservation: obs.date,
      lastObservation: obs.date,
      
      // Note: Coordinates would need to be geocoded or provided separately
      // For now, we mark stores without coordinates
      needsGeocoding: true,
    };
    
    storesMap.set(storeKey, store);
  });
  
  return Array.from(storesMap.values());
}

/**
 * Get stores from receipts with coordinates
 * Filters out stores that need geocoding (no lat/lon)
 * 
 * NOTE: Currently returns empty array since extractStoresFromReceipts
 * marks all stores as needsGeocoding=true. Stores without coordinates
 * are only useful after being matched with known stores (via matchReceiptStoresWithKnown)
 * or after implementing geocoding service.
 * 
 * @returns {Promise<Array>} Array of stores ready for map display
 */
export async function getStoresFromReceipts() {
  const observations = await loadReceiptObservations();
  const stores = extractStoresFromReceipts(observations);
  
  // Filter to only return stores that have coordinates
  // In a real implementation, you would geocode the addresses
  // or match with existing store database (see matchReceiptStoresWithKnown)
  const storesWithCoordinates = stores.filter(store => 
    store.coordinates && store.coordinates.lat && store.coordinates.lon
  );
  
  return storesWithCoordinates;
}

/**
 * Match receipt stores with known stores from seedStores
 * This helps identify which receipt observations correspond to known stores
 * 
 * @param {Array} receiptStores - Stores extracted from receipts
 * @param {Array} knownStores - Stores from seedStores.js
 * @returns {Array} Matched stores with enriched data
 */
export function matchReceiptStoresWithKnown(receiptStores, knownStores) {
  return receiptStores.map(receiptStore => {
    // Try to find a matching known store
    const match = knownStores.find(knownStore => {
      // Match by magasin_id if available
      if (receiptStore.magasin_id && knownStore.storeId === receiptStore.magasin_id) {
        return true;
      }
      
      // Match by chain name and city
      if (knownStore.chain.toLowerCase().includes(receiptStore.chain.toLowerCase()) &&
          knownStore.city.toLowerCase() === receiptStore.city.toLowerCase()) {
        return true;
      }
      
      return false;
    });
    
    // If we found a match, enrich the receipt store with known store data
    if (match) {
      return {
        ...receiptStore,
        id: match.id, // Use the known store ID
        coordinates: match.coordinates,
        address: match.address,
        phone: match.phone,
        openingHours: match.openingHours,
        services: match.services,
        needsGeocoding: false,
        matched: true,
      };
    }
    
    return receiptStore;
  });
}

/**
 * Get statistics about stores discovered from receipts
 * @returns {Promise<Object>} Statistics object
 */
export async function getReceiptStoresStats() {
  const observations = await loadReceiptObservations();
  const stores = extractStoresFromReceipts(observations);
  
  // Count stores by territory
  const byTerritory = {};
  stores.forEach(store => {
    byTerritory[store.territory] = (byTerritory[store.territory] || 0) + 1;
  });
  
  // Count stores by chain
  const byChain = {};
  stores.forEach(store => {
    byChain[store.chain] = (byChain[store.chain] || 0) + 1;
  });
  
  return {
    totalStores: stores.length,
    storesWithCoordinates: stores.filter(s => !s.needsGeocoding).length,
    storesNeedingGeocoding: stores.filter(s => s.needsGeocoding).length,
    byTerritory,
    byChain,
    totalObservations: observations.length,
  };
}
