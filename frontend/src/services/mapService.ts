import { getStoresByTerritory as getStoresFromSeed, getAllStores } from '../data/seedStores.js';
import {
  loadReceiptObservations,
  extractStoresFromReceipts,
  matchReceiptStoresWithKnown,
  type ReceiptStore,
} from './storeFromReceiptsService';
import { logWarn } from '../utils/logger';

export interface MapStore {
  id: string;
  name: string;
  lat: number;
  lon: number;
  category?: string;
  city?: string;
  address?: string;
  phone?: string;
  openingHours?: unknown;
  services?: unknown;
  source: 'seed_data' | 'receipt_observation';
  observationCount?: number;
  lastObservation?: string;
  hasReceiptObservations?: boolean;
}

/**
 * Get stores for a territory for display on the map.
 * Merges seed data with stores discovered from receipts.
 */
export const getStoresByTerritory = async (
  territory: string,
  includeReceiptStores = true
): Promise<MapStore[]> => {
  const seedStores = getStoresFromSeed(territory) as Array<Record<string, unknown>>;

  let stores: MapStore[] = seedStores.map((store) => {
    const coords = store['coordinates'] as { lat: number; lon: number } | undefined;
    return {
      id: store['id'] as string,
      name: store['name'] as string,
      lat: coords?.lat ?? 0,
      lon: coords?.lon ?? 0,
      category: store['chain'] as string | undefined,
      city: store['city'] as string | undefined,
      address: store['address'] as string | undefined,
      phone: store['phone'] as string | undefined,
      openingHours: store['openingHours'],
      services: store['services'],
      source: 'seed_data',
    };
  });

  if (includeReceiptStores) {
    try {
      const observations = await loadReceiptObservations();
      const receiptStores = extractStoresFromReceipts(observations);
      const allKnownStores = getAllStores() as Array<Record<string, unknown>>;
      const matchedReceiptStores = matchReceiptStoresWithKnown(receiptStores, allKnownStores);

      const territoryReceiptStores: MapStore[] = matchedReceiptStores
        .filter(
          (store: ReceiptStore) =>
            store.territory === territory && store.coordinates && !store.needsGeocoding
        )
        .map((store: ReceiptStore) => ({
          id: store.id,
          name: store.name,
          lat: store.coordinates!.lat,
          lon: store.coordinates!.lon,
          category: store.chain,
          city: store.city,
          address: store.address,
          phone: store.phone,
          openingHours: store.openingHours,
          services: store.services,
          source: 'receipt_observation' as const,
          observationCount: store.observationCount,
          lastObservation: store.lastObservation,
        }));

      const storeMap = new Map<string, MapStore>();
      for (const store of stores) storeMap.set(store.id, store);
      for (const store of territoryReceiptStores) {
        if (!storeMap.has(store.id)) {
          storeMap.set(store.id, store);
        } else {
          const existing = storeMap.get(store.id)!;
          storeMap.set(store.id, {
            ...existing,
            hasReceiptObservations: true,
            observationCount: store.observationCount,
            lastObservation: store.lastObservation,
          });
        }
      }

      stores = Array.from(storeMap.values());
    } catch (error) {
      logWarn('Could not load stores from receipts', error);
    }
  }

  return stores;
};
