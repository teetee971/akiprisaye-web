/**
 * Service OpenPrices - Synchronisation des prix crowdsourcés
 *
 * Uses the OpenPrices API (prices.openfoodfacts.org) with server-side
 * territory filtering via the `country_code` ISO 3166-1 parameter.
 * This replaces the previous placeholder geocoding approach.
 */

import type { OPPrice, PriceOptions, Territory, SyncResult, BulkSyncResult } from './types';

const OP_API_BASE = 'https://prices.openfoodfacts.org';
const OP_API_V1_BASE = `${OP_API_BASE}/api/v1`;

// Rate limiting
const RATE_LIMIT_DELAY = 500; // ms between requests
let lastRequestTime = 0;

/**
 * Maps DOM_TOM_TERRITORIES keys to ISO 3166-1 country codes used by OpenPrices API.
 */
const TERRITORY_KEY_TO_COUNTRY_CODE: Record<string, string> = {
  guadeloupe: 'gp',
  martinique: 'mq',
  guyane: 'gf',
  reunion: 're',
  mayotte: 'yt',
  saint_pierre_miquelon: 'pm',
  saint_barthelemy: 'bl',
  saint_martin: 'mf',
  france: 'fr',
};

/**
 * Applique un rate limiting simple
 */
async function rateLimit(): Promise<void> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;

  if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
    await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_DELAY - timeSinceLastRequest));
  }

  lastRequestTime = Date.now();
}

/**
 * Vérifie si une localisation est dans un territoire DOM-TOM (bounding box).
 * Utilisé comme filtre secondaire si les données lat/lon sont disponibles.
 */
export function isInTerritory(lat: number, lon: number, territory: Territory): boolean {
  const latInRange = lat >= territory.bounds.lat[0] && lat <= territory.bounds.lat[1];
  const lonInRange = lon >= territory.bounds.lon[0] && lon <= territory.bounds.lon[1];

  return latInRange && lonInRange;
}

/**
 * Récupère les prix pour un produit par EAN.
 * Optionnellement filtré par territoire (country_code ISO 3166-1).
 */
export async function getPricesByProduct(ean: string, countryCode?: string): Promise<OPPrice[]> {
  try {
    await rateLimit();

    const params = new URLSearchParams({
      product_code: ean,
      ordering: '-date',
      page_size: '100',
    });
    if (countryCode) {
      params.set('country_code', countryCode);
    }

    const response = await fetch(`${OP_API_V1_BASE}/prices?${params}`);

    if (!response.ok) {
      console.warn(`OpenPrices: Failed to get prices for product ${ean} (HTTP ${response.status})`);
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
 * Récupère les prix par localisation OSM
 */
export async function getPricesByLocation(locationId: string): Promise<OPPrice[]> {
  try {
    await rateLimit();

    const params = new URLSearchParams({
      location_osm_id: locationId,
      ordering: '-date',
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
 * Récupère les prix récents (depuis une date donnée).
 * Optionnellement filtré par territoire (country_code).
 */
export async function getRecentPrices(
  since: Date,
  options: PriceOptions = {},
  countryCode?: string
): Promise<OPPrice[]> {
  try {
    await rateLimit();

    const params = new URLSearchParams({
      date__gte: since.toISOString().split('T')[0], // Format YYYY-MM-DD
      ordering: '-date',
    });

    if (options.limit) {
      params.append('page_size', String(options.limit));
    }

    if (options.offset) {
      params.append('page', String(Math.floor(options.offset / (options.limit || 100)) + 1));
    }

    if (countryCode) {
      params.append('country_code', countryCode);
    }

    const response = await fetch(`${OP_API_V1_BASE}/prices?${params}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch recent prices (HTTP ${response.status})`);
    }

    const data = await response.json();

    return data.items || [];
  } catch (error) {
    console.error('Error fetching recent prices from OpenPrices:', error);
    return [];
  }
}

/**
 * Filtre les prix pour un territoire DOM-TOM spécifique.
 * Utilise le country_code si disponible dans les données OpenPrices,
 * sinon tombe en arrière sur le filtre bounding-box lat/lon.
 */
export function filterPricesByTerritory(
  prices: OPPrice[],
  territory: Territory,
  countryCode?: string
): OPPrice[] {
  if (countryCode) {
    // If country_code was used server-side, all returned prices already belong
    // to the territory — no additional filtering needed.
    return prices;
  }

  // Fallback: bounding box filter (requires lat/lon on OPPrice items)
  return prices.filter((price) => {
    const lat = (price as OPPrice & { lat?: number }).lat;
    const lon = (price as OPPrice & { lon?: number }).lon;
    if (lat === undefined || lon === undefined) return true; // cannot filter, keep all
    return isInTerritory(lat, lon, territory);
  });
}

/**
 * Synchronise les prix pour un territoire DOM-TOM spécifique.
 * Utilise le country_code ISO 3166-1 pour filtrer à la source.
 */
export async function syncPricesForTerritory(territory: Territory): Promise<SyncResult> {
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
    // Resolve country code for this territory
    const normalizedKey = territory.name
      .toLowerCase()
      .replace('é', 'e')
      .replace('è', 'e')
      .replace('î', 'i')
      .replace(/[\s-]/g, '_');
    const countryCode =
      TERRITORY_KEY_TO_COUNTRY_CODE[normalizedKey] ??
      TERRITORY_KEY_TO_COUNTRY_CODE[territory.name.toLowerCase()] ??
      undefined;

    // Récupérer les prix récents (derniers 7 jours) filtrés par territory
    const since = new Date();
    since.setDate(since.getDate() - 7);

    const recentPrices = await getRecentPrices(since, { limit: 1000 }, countryCode);

    result.itemsProcessed = recentPrices.length;

    if (recentPrices.length > 0) {
      // Apply bounding-box secondary filter for accuracy
      const filtered = filterPricesByTerritory(recentPrices, territory, countryCode);
      result.itemsAdded = filtered.length;
      result.itemsSkipped = recentPrices.length - filtered.length;

      // Emit a custom event so any price listener / IndexedDB writer can pick up
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('akiprisaye:price-feed', {
            detail: {
              territory: territory.name,
              countryCode,
              prices: filtered,
              syncedAt: new Date().toISOString(),
            },
          })
        );
      }
    }

    result.success = true;
    console.info(
      `[OpenPrices] Synced territory "${territory.name}" (${countryCode ?? 'no country code'}): ` +
        `${result.itemsAdded} prices added, ${result.itemsSkipped} skipped out of ${result.itemsProcessed} fetched`
    );
  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    console.error(`[OpenPrices] Sync failed for territory "${territory.name}":`, error);
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
    if (import.meta.env.DEV) console.log(`Syncing prices for ${territory.name}...`);

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
    await new Promise((resolve) => setTimeout(resolve, 1000));
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
 * Synchronise un produit spécifique avec ses prix récents.
 * Optionnellement filtré par territoire (country_code ISO 3166-1).
 */
export async function syncProductPrices(ean: string, countryCode?: string): Promise<SyncResult> {
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
    const prices = await getPricesByProduct(ean, countryCode);

    result.itemsProcessed = prices.length;
    result.itemsAdded = prices.length;
    result.success = true;

    // Emit feed event so price listeners / IndexedDB writers can react
    if (typeof window !== 'undefined' && prices.length > 0) {
      window.dispatchEvent(
        new CustomEvent('akiprisaye:price-feed', {
          detail: {
            ean,
            countryCode,
            prices,
            syncedAt: new Date().toISOString(),
          },
        })
      );
    }

    console.info(
      `[OpenPrices] Product "${ean}" sync: ${prices.length} prices ` +
        `(territory: ${countryCode ?? 'all'})`
    );
  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    console.error(`[OpenPrices] syncProductPrices failed for "${ean}":`, error);
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
  filterPricesByTerritory,
  fullSync,
  getLocations,
  syncProductPrices,
  isInTerritory,
};

export default openPricesService;
