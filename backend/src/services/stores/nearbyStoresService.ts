/**
 * Nearby Stores Service
 * Searches for stores within a given radius using Haversine distance formula
 * Supports filtering by chain/brand
 */

import { calculateDistance, isWithinRadius } from '../../utils/geoUtils.js';

export interface Store {
  id: string;
  name: string;
  chain: string;
  lat: number;
  lon: number;
  address?: string;
  city?: string;
  territory: string;
  services?: string[];
  openingHours?: string;
}

export interface NearbyStore extends Store {
  distance: number; // in km
  travelTimeSeconds: number;
}

export interface NearbyStoresOptions {
  chains?: string[]; // Filter by specific chains
  maxResults?: number; // Limit number of results
  sortBy?: 'distance' | 'name'; // Sort order
  includeServices?: string[]; // Filter by required services
}

/**
 * Find stores near a given location
 * @param stores Array of all stores
 * @param lat Latitude of center point
 * @param lon Longitude of center point
 * @param radiusKm Search radius in kilometers (1-50)
 * @param options Additional filter options
 * @returns Array of nearby stores with distance information
 */
export function findNearbyStores(
  stores: Store[],
  lat: number,
  lon: number,
  radiusKm: number,
  options: NearbyStoresOptions = {}
): NearbyStore[] {
  const {
    chains,
    maxResults,
    sortBy = 'distance',
    includeServices,
  } = options;

  // Validate radius
  const validRadius = Math.max(1, Math.min(50, radiusKm));

  // Filter and calculate distances
  let nearbyStores: NearbyStore[] = stores
    .filter((store) => {
      // Check if within radius
      if (!isWithinRadius(lat, lon, store.lat, store.lon, validRadius)) {
        return false;
      }

      // Filter by chains if specified
      if (chains && chains.length > 0) {
        const chainLower = store.chain.toLowerCase();
        const matchesChain = chains.some(
          (c) => chainLower.includes(c.toLowerCase()) || c.toLowerCase().includes(chainLower)
        );
        if (!matchesChain) {
          return false;
        }
      }

      // Filter by services if specified
      if (includeServices && includeServices.length > 0) {
        if (!store.services || store.services.length === 0) {
          return false;
        }
        const hasAllServices = includeServices.every((requiredService) =>
          store.services!.some((s) =>
            s.toLowerCase().includes(requiredService.toLowerCase())
          )
        );
        if (!hasAllServices) {
          return false;
        }
      }

      return true;
    })
    .map((store) => {
      const distance = calculateDistance(lat, lon, store.lat, store.lon);
      const travelTimeSeconds = Math.round(distance * 180); // 180 seconds per km (urban)
      
      return {
        ...store,
        distance,
        travelTimeSeconds,
      };
    });

  // Sort results
  if (sortBy === 'distance') {
    nearbyStores.sort((a, b) => a.distance - b.distance);
  } else if (sortBy === 'name') {
    nearbyStores.sort((a, b) => a.name.localeCompare(b.name));
  }

  // Limit results if specified
  if (maxResults && maxResults > 0) {
    nearbyStores = nearbyStores.slice(0, maxResults);
  }

  return nearbyStores;
}

/**
 * Get stores grouped by chain
 * @param nearbyStores Array of nearby stores
 * @returns Map of chain name to stores
 */
export function groupStoresByChain(
  nearbyStores: NearbyStore[]
): Map<string, NearbyStore[]> {
  const grouped = new Map<string, NearbyStore[]>();

  nearbyStores.forEach((store) => {
    const chain = store.chain || 'Other';
    if (!grouped.has(chain)) {
      grouped.set(chain, []);
    }
    grouped.get(chain)!.push(store);
  });

  return grouped;
}

/**
 * Calculate average distance to stores
 * @param nearbyStores Array of nearby stores
 * @returns Average distance in km
 */
export function calculateAverageDistance(
  nearbyStores: NearbyStore[]
): number {
  if (nearbyStores.length === 0) {
    return 0;
  }

  const totalDistance = nearbyStores.reduce(
    (sum, store) => sum + store.distance,
    0
  );
  return totalDistance / nearbyStores.length;
}

/**
 * Find closest store
 * @param nearbyStores Array of nearby stores
 * @returns Closest store or null if array is empty
 */
export function findClosestStore(
  nearbyStores: NearbyStore[]
): NearbyStore | null {
  if (nearbyStores.length === 0) {
    return null;
  }

  return nearbyStores.reduce((closest, store) =>
    store.distance < closest.distance ? store : closest
  );
}

/**
 * Filter stores by chain names
 * @param stores Array of stores
 * @param chains Array of chain names to filter by
 * @returns Filtered stores
 */
export function filterStoresByChains(
  stores: Store[],
  chains: string[]
): Store[] {
  if (!chains || chains.length === 0) {
    return stores;
  }

  return stores.filter((store) => {
    const chainLower = store.chain.toLowerCase();
    return chains.some(
      (c) => chainLower.includes(c.toLowerCase()) || c.toLowerCase().includes(chainLower)
    );
  });
}
