 
/**
 * Admin Product Service
 * CRUD operations for product management
 */

import type { ProductCategory, Unit } from '../../types/product';

export interface Product {
  id: string;
  name: string;
  brand?: string;
  category: ProductCategory;
  ean?: string;
  description?: string;
  unit: Unit;
  quantity: number;
  imageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateProductInput {
  name: string;
  brand?: string;
  category: ProductCategory;
  ean?: string;
  description?: string;
  unit: Unit;
  quantity: number;
  imageUrl?: string;
}

export interface UpdateProductInput {
  name?: string;
  brand?: string;
  category?: ProductCategory;
  ean?: string;
  description?: string;
  unit?: Unit;
  quantity?: number;
  imageUrl?: string;
}

export interface ProductSearchFilters {
  category?: ProductCategory;
  brand?: string;
  search?: string;
  hasEan?: boolean;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

/**
 * Get authentication token
 */
async function getAuthToken(): Promise<string> {
  return localStorage.getItem('authToken') || '';
}

/**
 * Fetch all products with filters and pagination
 */
export async function getProducts(
  filters: ProductSearchFilters = {},
  page = 1,
  limit = 20
): Promise<{ products: Product[]; total: number; page: number; totalPages: number }> {
  const token = await getAuthToken();

  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  if (filters.category) params.append('category', filters.category);
  if (filters.brand) params.append('brand', filters.brand);
  if (filters.search) params.append('search', filters.search);
  if (filters.hasEan !== undefined) params.append('hasEan', filters.hasEan.toString());

  const response = await fetch(`${API_BASE_URL}/admin/products?${params}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch products');
  }

  return response.json();
}

/**
 * Get a single product by ID
 */
export async function getProduct(id: string): Promise<Product> {
  const token = await getAuthToken();

  const response = await fetch(`${API_BASE_URL}/admin/products/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch product');
  }

  return response.json();
}

/**
 * Create a new product
 */
export async function createProduct(data: CreateProductInput): Promise<Product> {
  const token = await getAuthToken();

  const response = await fetch(`${API_BASE_URL}/admin/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    try {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create product');
    } catch (parseError) {
      if (parseError instanceof Error && parseError.message !== 'Failed to create product') {
        throw new Error('Failed to create product');
      }
      throw parseError;
    }
  }

  return response.json();
}

/**
 * Update an existing product
 */
export async function updateProduct(id: string, data: UpdateProductInput): Promise<Product> {
  const token = await getAuthToken();

  const response = await fetch(`${API_BASE_URL}/admin/products/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    try {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update product');
    } catch (parseError) {
      if (parseError instanceof Error && parseError.message !== 'Failed to update product') {
        throw new Error('Failed to update product');
      }
      throw parseError;
    }
  }

  return response.json();
}

/**
 * Delete a product
 */
export async function deleteProduct(id: string): Promise<void> {
  const token = await getAuthToken();

  const response = await fetch(`${API_BASE_URL}/admin/products/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    try {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete product');
    } catch (parseError) {
      if (parseError instanceof Error && parseError.message !== 'Failed to delete product') {
        throw new Error('Failed to delete product');
      }
      throw parseError;
    }
  }
}

/**
 * Search OpenFoodFacts by EAN
 */
export async function searchOpenFoodFacts(ean: string): Promise<any> {
  const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${ean}.json`);

  if (!response.ok) {
    throw new Error('Product not found on OpenFoodFacts');
  }

  const data = await response.json();

  if (data.status === 0) {
    throw new Error('Product not found on OpenFoodFacts');
  }

  if (!data.product) {
    throw new Error('Invalid product data from OpenFoodFacts');
  }

  return {
    name: data.product.product_name || '',
    brand: data.product.brands || '',
    category: data.product.categories || '',
    imageUrl: data.product.image_url || '',
    quantity: data.product.quantity || '',
  };
}
