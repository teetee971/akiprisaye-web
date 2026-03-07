 
/**
 * Service OpenPrices - Synchronisation des prix crowdsourcés
 */

import type {
  OPPrice,
  PriceOptions,
  Territory,
  SyncResult,
  BulkSyncResult,
} from './types';

const OP_API_BASE = 'https://prices.openfoodfacts.org';
const OP_API_V1_BASE = `${OP_API_BASE}/api/v1`;

// Rate limiting
const RATE_LIMIT_DELAY = 500; // ms between requests
let lastRequestTime = 0;

/**
 * Applique un rate limiting simple
 */
async function rateLimit(): Promise<void> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
    await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY - timeSinceLastRequest));
  }
  
  lastRequestTime = Date.now();
}

/**
 * Vérifie si une localisation est dans un territoire DOM-TOM
 */
export function isInTerritory(lat: number, lon: number, territory: Territory): boolean {
  const latInRange = lat >= territory.bounds.lat[0] && lat <= territory.bounds.lat[1];
  const lonInRange = lon >= territory.bounds.lon[0] && lon <= territory.bounds.lon[1];
  
  return latInRange && lonInRange;
}

/**
 * Récupère les prix pour un produit par EAN
 */
export async function getPricesByProduct(ean: string): Promise<OPPrice[]> {
  try {
    await rateLimit();

    const params = new URLSearchParams({
      product_code: ean,
    });

    const response = await fetch(`${OP_API_V1_BASE}/prices?${params}`);
    
    if (!response.ok) {
      console.warn(`OpenPrices: Failed to get prices for product ${ean}`);
      return [];
    }

    const data = await response.json();
    
    return data.items || [];
  } catch (error) {
    console.error('Error fetching prices from OpenPrices:', error);
    return [];
  }
}

/**
 * Récupère les prix par localisation
 */
export async function getPricesByLocation(locationId: string): Promise<OPPrice[]> {
  try {
    await rateLimit();

    const params = new URLSearchParams({
      location_osm_id: locationId,
    });

    const response = await fetch(`${OP_API_V1_BASE}/prices?${params}`);
    
    if (!response.ok) {
      console.warn(`OpenPrices: Failed to get prices for location ${locationId}`);
      return [];
    }

    const data = await response.json();
    
    return data.items || [];
  } catch (error) {
    console.error('Error fetching prices by location from OpenPrices:', error);
    return [];
  }
}

/**
 * Récupère les prix récents (depuis une date)
 */
export async function getRecentPrices(
  since: Date,
  options: PriceOptions = {}
): Promise<OPPrice[]> {
  try {
    await rateLimit();

    const params = new URLSearchParams({
      date__gte: since.toISOString().split('T')[0], // Format YYYY-MM-DD
    });

    if (options.limit) {
      params.append('page_size', String(options.limit));
    }

    if (options.offset) {
      params.append('page', String(Math.floor(options.offset / (options.limit || 100)) + 1));
    }

    const response = await fetch(`${OP_API_V1_BASE}/prices?${params}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch recent prices');
    }

    const data = await response.json();
    
    return data.items || [];
  } catch (error) {
    console.error('Error fetching recent prices from OpenPrices:', error);
    return [];
  }
}

/**
 * Filtre les prix pour un territoire DOM-TOM spécifique
 * Note: OpenPrices ne fournit pas directement lat/lon dans l'API
 * Cette fonction est un placeholder pour une implémentation future avec geocoding
 */
export async function filterPricesByTerritory(
  prices: OPPrice[],
  _territoryName: keyof typeof import('./types').DOM_TOM_TERRITORIES
): Promise<OPPrice[]> {
  // TODO: Implémenter le geocoding des location_osm_id pour obtenir lat/lon
  // Pour l'instant, on retourne tous les prix
  console.warn('filterPricesByTerritory needs geocoding implementation');
  return prices;
}

/**
 * Synchronise les prix pour un territoire
 */
export async function syncPricesForTerritory(
  territory: Territory
): Promise<SyncResult> {
  const startTime = new Date();
  const result: SyncResult = {
    success: false,
    itemsProcessed: 0,
    itemsAdded: 0,
    itemsUpdated: 0,
    itemsSkipped: 0,
    errors: [],
    startTime,
    endTime: new Date(),
    duration: 0,
  };

  try {
    // Récupérer les prix récents (derniers 7 jours)
    const since = new Date();
    since.setDate(since.getDate() - 7);
    
    const recentPrices = await getRecentPrices(since, { limit: 1000 });
    
    result.itemsProcessed = recentPrices.length;

    // TODO: Implémenter le filtrage par territoire et la sauvegarde en base
    // Pour l'instant, on log juste
    console.log(`Synced ${recentPrices.length} prices for territory ${territory.name}`);

    result.success = true;
    result.itemsAdded = recentPrices.length;
  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : 'Unknown error');
  }

  result.endTime = new Date();
  result.duration = result.endTime.getTime() - result.startTime.getTime();

  return result;
}

/**
 * Synchronisation complète de tous les territoires DOM-TOM
 */
export async function fullSync(): Promise<BulkSyncResult> {
  const startTime = new Date();
  const result: BulkSyncResult = {
    success: true,
    itemsProcessed: 0,
    itemsAdded: 0,
    itemsUpdated: 0,
    itemsSkipped: 0,
    errors: [],
    startTime,
    endTime: new Date(),
    duration: 0,
    totalItems: 0,
    batches: 0,
    batchResults: [],
  };

  // Import dynamique pour éviter les problèmes circulaires
  const { DOM_TOM_TERRITORIES } = await import('./types');
  const territories = Object.values(DOM_TOM_TERRITORIES);
  
  result.totalItems = territories.length;
  result.batches = territories.length;

  for (const territory of territories) {
    console.log(`Syncing prices for ${territory.name}...`);
    
    const syncResult = await syncPricesForTerritory(territory);
    
    result.itemsProcessed += syncResult.itemsProcessed;
    result.itemsAdded += syncResult.itemsAdded;
    result.itemsUpdated += syncResult.itemsUpdated;
    result.itemsSkipped += syncResult.itemsSkipped;
    result.errors.push(...syncResult.errors);
    result.batchResults.push(syncResult);

    if (!syncResult.success) {
      result.success = false;
    }

    // Pause entre les territoires
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  result.endTime = new Date();
  result.duration = result.endTime.getTime() - result.startTime.getTime();

  return result;
}

/**
 * Récupère les lieux/magasins disponibles
 */
export async function getLocations(): Promise<any[]> {
  try {
    await rateLimit();

    const response = await fetch(`${OP_API_V1_BASE}/locations`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch locations');
    }

    const data = await response.json();
    
    return data.items || [];
  } catch (error) {
    console.error('Error fetching locations from OpenPrices:', error);
    return [];
  }
}

/**
 * Synchronise un produit spécifique avec ses prix récents
 */
export async function syncProductPrices(ean: string): Promise<SyncResult> {
  const startTime = new Date();
  const result: SyncResult = {
    success: false,
    itemsProcessed: 0,
    itemsAdded: 0,
    itemsUpdated: 0,
    itemsSkipped: 0,
    errors: [],
    startTime,
    endTime: new Date(),
    duration: 0,
  };

  try {
    const prices = await getPricesByProduct(ean);
    
    result.itemsProcessed = prices.length;

    // TODO: Implémenter la sauvegarde des prix en base
    console.log(`Found ${prices.length} prices for product ${ean}`);

    result.success = true;
    result.itemsAdded = prices.length;
  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : 'Unknown error');
  }

  result.endTime = new Date();
  result.duration = result.endTime.getTime() - result.startTime.getTime();

  return result;
}

/**
 * Export du service
 */
export const openPricesService = {
  getPricesByProduct,
  getPricesByLocation,
  getRecentPrices,
  syncPricesForTerritory,
  fullSync,
  getLocations,
  syncProductPrices,
  isInTerritory,
};

export default openPricesService;
