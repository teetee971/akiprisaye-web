/**
 * Admin Store Service
 * CRUD operations for store management
 */

import type { TerritoryCode } from '../../types/extensions';
import { adminFetchJson } from './adminApiClient';

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
