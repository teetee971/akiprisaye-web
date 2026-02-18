import type { Territory } from './territory';

export type GroupId = string;
export type StoreId = string;

export interface Store {
  id: StoreId;
  name: string;
  brand?: string;
  groupId?: GroupId;
  territory?: Territory;
  address?: string;
  city?: string;
  postalCode?: string;
  location?: { lat: number; lng: number };
  phone?: string;
  website?: string;
  openingHours?: string;
  tags?: string[];
  updatedAt?: string;
}

export interface ProductOffer {
  barcode: string;
  price: number;
  observedAt?: string;
  currency: string;
  reliability: 'high' | 'medium' | 'low';
  storeId?: StoreId;
  storeName?: string;
  territory?: Territory;
  city?: string;
}

export interface ProductPriceStats {
  min: number;
  max: number;
  median: number;
  observations: number;
}
