/**
 * Store From Receipts Service
 *
 * Extrait les informations de magasins depuis les tickets de caisse
 * et les intègre à la carte interactive des magasins.
 */

import { logError, logWarn } from '../utils/logger';

export interface ReceiptObservation {
  enseigne?: string;
  territoire?: string;
  commune?: string;
  magasin_id?: string;
  date?: string;
  [key: string]: unknown;
}

export interface ReceiptStore {
  id: string;
  name: string;
  chain: string;
  territory: string;
  city: string;
  source: 'receipt_observation';
  magasin_id?: string;
  observationCount: number;
  firstObservation?: string;
  lastObservation?: string;
  needsGeocoding: boolean;
  coordinates?: { lat: number; lon: number };
  address?: string;
  phone?: string;
  openingHours?: unknown;
  services?: unknown;
  matched?: boolean;
}

export interface ReceiptStoreStats {
  totalStores: number;
  storesWithCoordinates: number;
  storesNeedingGeocoding: number;
  byTerritory: Record<string, number>;
  byChain: Record<string, number>;
  totalObservations: number;
}

/**
 * Load all receipt observations from the public data/observations directory.
 */
export async function loadReceiptObservations(): Promise<ReceiptObservation[]> {
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}data/observations/index.json`);
    if (!response.ok) {
      logWarn(`Could not load observations index (HTTP ${response.status})`);
      return [];
    }
    return (await response.json()) as ReceiptObservation[];
  } catch (error) {
    logError('Error loading receipt observations', error);
    return [];
  }
}

/**
 * Extract store information from receipt observations.
 */
export function extractStoresFromReceipts(
  observations: ReceiptObservation[],
): ReceiptStore[] {
  const storesMap = new Map<string, ReceiptStore>();

  for (const obs of observations) {
    if (!obs.enseigne || !obs.territoire) continue;

    const locationKey = obs.commune ?? `TERRITORY_${obs.territoire}`;
    const storeKey = obs.magasin_id
      ? `${obs.enseigne}_${obs.magasin_id}`
      : `${obs.enseigne}_${locationKey}`;

    const existing = storesMap.get(storeKey);
    if (existing) {
      existing.observationCount += 1;
      existing.lastObservation = obs.date;
      continue;
    }

    storesMap.set(storeKey, {
      id: storeKey.toLowerCase().replace(/\s+/g, '_'),
      name: obs.enseigne,
      chain: obs.enseigne,
      territory: obs.territoire,
      city: obs.commune ?? obs.territoire,
      source: 'receipt_observation',
      magasin_id: obs.magasin_id,
      observationCount: 1,
      firstObservation: obs.date,
      lastObservation: obs.date,
      needsGeocoding: true,
    });
  }

  return Array.from(storesMap.values());
}

/**
 * Get stores from receipts that already have GPS coordinates.
 */
export async function getStoresFromReceipts(): Promise<ReceiptStore[]> {
  const observations = await loadReceiptObservations();
  const stores = extractStoresFromReceipts(observations);
  return stores.filter(
    (s) => !s.needsGeocoding && s.coordinates?.lat && s.coordinates?.lon,
  );
}

/**
 * Match receipt stores with known stores to enrich with coordinates and metadata.
 */
export function matchReceiptStoresWithKnown(
  receiptStores: ReceiptStore[],
  knownStores: Array<Record<string, unknown>>,
): ReceiptStore[] {
  return receiptStores.map((receiptStore) => {
    const match = knownStores.find((knownStore) => {
      if (
        receiptStore.magasin_id &&
        (knownStore['storeId'] as string | undefined) === receiptStore.magasin_id
      ) {
        return true;
      }
      const knownChain = (knownStore['chain'] as string | undefined) ?? '';
      const knownCity = (knownStore['city'] as string | undefined) ?? '';
      return (
        knownChain.toLowerCase().includes(receiptStore.chain.toLowerCase()) &&
        knownCity.toLowerCase() === receiptStore.city.toLowerCase()
      );
    });

    if (match) {
      return {
        ...receiptStore,
        id: (match['id'] as string) ?? receiptStore.id,
        coordinates: match['coordinates'] as ReceiptStore['coordinates'],
        address: match['address'] as string | undefined,
        phone: match['phone'] as string | undefined,
        openingHours: match['openingHours'],
        services: match['services'],
        needsGeocoding: false,
        matched: true,
      };
    }

    return receiptStore;
  });
}

/**
 * Get statistics about stores discovered from receipts.
 */
export async function getReceiptStoresStats(): Promise<ReceiptStoreStats> {
  const observations = await loadReceiptObservations();
  const stores = extractStoresFromReceipts(observations);

  const byTerritory: Record<string, number> = {};
  const byChain: Record<string, number> = {};

  for (const store of stores) {
    byTerritory[store.territory] = (byTerritory[store.territory] ?? 0) + 1;
    byChain[store.chain] = (byChain[store.chain] ?? 0) + 1;
  }

  return {
    totalStores: stores.length,
    storesWithCoordinates: stores.filter((s) => !s.needsGeocoding).length,
    storesNeedingGeocoding: stores.filter((s) => s.needsGeocoding).length,
    byTerritory,
    byChain,
    totalObservations: observations.length,
  };
}
