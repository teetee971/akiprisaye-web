/**
 * Type definitions for seedStores.js
 */

export interface StoreCoordinates {
  lat: number;
  lon: number;
}

export interface Store {
  id: string;
  name: string;
  chain: string;
  companyId: string;
  territory: string;
  city: string;
  address: string;
  postalCode: string;
  coordinates: StoreCoordinates;
  phone: string;
  openingHours: string;
  services: string[];
}

export const SEED_STORES: Store[];
