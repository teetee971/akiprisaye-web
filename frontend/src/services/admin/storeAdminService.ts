/**
 * Admin Store Service
 * CRUD operations for store management
 */

import type { TerritoryCode } from '../../types/extensions';

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

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

/**
 * Get authentication token from Firebase
 */
async function getAuthToken(): Promise<string> {
  // TODO: Integrate with actual Firebase auth
  return localStorage.getItem('authToken') || '';
}

/**
 * Fetch all stores with filters and pagination
 */
export async function getStores(
  filters: StoreSearchFilters = {},
  page = 1,
  limit = 20
): Promise<{ stores: Store[]; total: number; page: number; totalPages: number }> {
  const token = await getAuthToken();
  
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  if (filters.brandId) params.append('brandId', filters.brandId);
  if (filters.territory) params.append('territory', filters.territory);
  if (filters.city) params.append('city', filters.city);
  if (filters.isActive !== undefined) params.append('isActive', filters.isActive.toString());
  if (filters.search) params.append('search', filters.search);

  const response = await fetch(`${API_BASE_URL}/admin/stores?${params}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch stores');
  }

  return response.json();
}

/**
 * Get a single store by ID
 */
export async function getStore(id: string): Promise<Store> {
  const token = await getAuthToken();

  const response = await fetch(`${API_BASE_URL}/admin/stores/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch store');
  }

  return response.json();
}

/**
 * Create a new store
 */
export async function createStore(data: CreateStoreInput): Promise<Store> {
  const token = await getAuthToken();

  const response = await fetch(`${API_BASE_URL}/admin/stores`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create store');
  }

  return response.json();
}

/**
 * Update an existing store
 */
export async function updateStore(id: string, data: UpdateStoreInput): Promise<Store> {
  const token = await getAuthToken();

  const response = await fetch(`${API_BASE_URL}/admin/stores/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update store');
  }

  return response.json();
}

/**
 * Delete a store (soft delete)
 */
export async function deleteStore(id: string): Promise<void> {
  const token = await getAuthToken();

  const response = await fetch(`${API_BASE_URL}/admin/stores/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete store');
  }
}
