/**
 * Nearby Stores Service
 * Find stores within a given radius
 */

import { SEED_STORES } from '../../../../src/data/seedStores.js';
import { calculateDistance } from '../../utils/geoUtils.js';

export interface NearbyStoresOptions {
  lat: number;
  lon: number;
  radius: number; // in km
  chains?: string[];
  limit?: number;
  sortBy?: 'distance' | 'price' | 'name';
}

export interface NearbyStore {
  id: string;
  name: string;
  chain: string;
  coordinates: {
    lat: number;
    lon: number;
  };
  distance: number; // in km
  address: string;
  city?: string;
  territory: string;
  services: string[];
  phone?: string;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Find stores near a given location
 */
export async function findNearbyStores(
  options: NearbyStoresOptions
): Promise<NearbyStore[]> {
  const { lat, lon, radius, chains, limit, sortBy = 'distance' } = options;

  // Filter stores within radius
  let nearbyStores: NearbyStore[] = SEED_STORES.filter(store => {
    if (!store.coordinates) return false;

    const distance = calculateDistance(
      lat,
      lon,
      store.coordinates.lat,
      store.coordinates.lon
    );

    return distance <= radius;
  }).map(store => ({
    id: store.id,
    name: store.name,
    chain: store.chain,
    coordinates: store.coordinates,
    distance: calculateDistance(
      lat,
      lon,
      store.coordinates.lat,
      store.coordinates.lon
    ),
    address: store.address,
    city: store.city,
    territory: store.territory,
    services: store.services || [],
    phone: store.phone,
  }));

  // Filter by chains if specified
  if (chains && chains.length > 0) {
    nearbyStores = nearbyStores.filter(store =>
      chains.some(chain => store.chain.toLowerCase().includes(chain.toLowerCase()))
    );
  }

  // Sort
  switch (sortBy) {
    case 'distance':
      nearbyStores.sort((a, b) => a.distance - b.distance);
      break;
    case 'name':
      nearbyStores.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'price':
      // Would sort by price index if available
      break;
  }

  // Apply limit
  if (limit && limit > 0) {
    nearbyStores = nearbyStores.slice(0, limit);
  }

  return nearbyStores;
}

/**
 * Get the closest store to a location
 */
export async function findClosestStore(
  lat: number,
  lon: number,
  chains?: string[]
): Promise<NearbyStore | null> {
  const stores = await findNearbyStores({
    lat,
    lon,
    radius: 100, // Search within 100km
    chains,
    limit: 1,
    sortBy: 'distance',
  });

  return stores.length > 0 ? stores[0] : null;
}
