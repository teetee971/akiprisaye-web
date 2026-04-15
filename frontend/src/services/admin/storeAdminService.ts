/**
 * Admin Store Service
 * CRUD operations for store management
 */

import type { TerritoryCode } from '../../types/extensions';
import { adminFetchJson } from './adminApiClient';

// ── Static preview fallback ───────────────────────────────────────────────────

interface RawStaticStore {
  id: string;
  name: string;
  type?: string;
  territory: string;
  commune?: string;
  city?: string;
  address?: string;
  lat?: number;
  lon?: number;
  phone?: string;
}

function mapStaticStore(raw: RawStaticStore): Store {
  return {
    id: raw.id,
    name: raw.name,
    brandId: raw.type ?? '',
    brandName: raw.type ?? '',
    address: raw.address ?? '',
    postalCode: '',
    city: raw.commune ?? raw.city ?? '',
    territory: raw.territory.toUpperCase() as TerritoryCode,
    latitude: raw.lat,
    longitude: raw.lon,
    phone: raw.phone,
    isActive: true,
  };
}

let _staticStoresCache: Store[] | null = null;

export async function getStoresStatic(): Promise<Store[]> {
  if (_staticStoresCache) return _staticStoresCache;
  try {
    const res = await fetch('/data/stores-database.json');
    if (!res.ok) throw new Error('stores-database.json not found');
    const json = await res.json() as { stores?: RawStaticStore[] } | RawStaticStore[];
    const raw: RawStaticStore[] = Array.isArray(json)
      ? json
      : (json as { stores?: RawStaticStore[] }).stores ?? [];
    _staticStoresCache = raw.map(mapStaticStore);
    return _staticStoresCache;
  } catch {
    return [];
  }
}

export async function getStoreStatic(id: string): Promise<Store | null> {
  const all = await getStoresStatic();
  return all.find((s) => s.id === id) ?? null;
}

export interface Store {
  id: string;
  name: string;
  brandId: string;
  brandName?: string;
  address: string;
  postalCode: string;
  city: string;
  territory: TerritoryCode;
  latitude?: number;
  longitude?: number;
  phone?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateStoreInput {
  name: string;
  brandId: string;
  address: string;
  postalCode: string;
  city: string;
  territory: TerritoryCode;
  latitude?: number;
  longitude?: number;
  phone?: string;
}

export interface UpdateStoreInput {
  name?: string;
  address?: string;
  postalCode?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  isActive?: boolean;
}

export interface StoreSearchFilters {
  brandId?: string;
  territory?: TerritoryCode;
  city?: string;
  isActive?: boolean;
  search?: string;
}

/**
 * Fetch all stores with filters and pagination
 */
export async function getStores(
  filters: StoreSearchFilters = {},
  page = 1,
  limit = 20
): Promise<{ stores: Store[]; total: number; page: number; totalPages: number }> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  if (filters.brandId) params.append('brandId', filters.brandId);
  if (filters.territory) params.append('territory', filters.territory);
  if (filters.city) params.append('city', filters.city);
  if (filters.isActive !== undefined) params.append('isActive', filters.isActive.toString());
  if (filters.search) params.append('search', filters.search);

  return adminFetchJson(`/admin/stores?${params}`);
}

/**
 * Get a single store by ID
 */
export async function getStore(id: string): Promise<Store> {
  return adminFetchJson(`/admin/stores/${id}`);
}

/**
 * Create a new store
 */
export async function createStore(data: CreateStoreInput): Promise<Store> {
  return adminFetchJson('/admin/stores', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Update an existing store
 */
export async function updateStore(id: string, data: UpdateStoreInput): Promise<Store> {
  return adminFetchJson(`/admin/stores/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Delete a store (soft delete)
 */
export async function deleteStore(id: string): Promise<void> {
  await adminFetchJson(`/admin/stores/${id}`, {
    method: 'DELETE',
  });
}
