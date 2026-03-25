/**
 * Product Service - v1.1.0
 * 
 * Service for fetching and managing live product prices.
 * 
 * @module productService
 */

import { safeLocalStorage } from '../utils/safeLocalStorage';
import { liveApiFetchJson } from './liveApiClient';
import type { 
  Product, 
  ProductSearchParams, 
  ProductListResponse
} from '../types/product';
import type { TerritoryCode } from '../types/extensions';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

/**
 * Fetch products from live API.
 */
export async function fetchProducts(
  params: ProductSearchParams = {}
): Promise<ProductListResponse> {
  const apiProducts = await fetchFromAPI(params);
  safeLocalStorage.setJSON('products_cache', apiProducts);

  return {
    products: apiProducts,
    total: apiProducts.length,
    hasMore: false,
    filters: params
  };
}

/**
 * Fetch list from live products API.
 */
async function fetchFromAPI(params: ProductSearchParams): Promise<Product[]> {
  const query = new URLSearchParams();
  if (params.territoire) query.set('territoire', params.territoire);
  if (params.categorie) query.set('categorie', params.categorie);
  if (params.query) query.set('q', params.query);
  if (params.limit) query.set('limit', String(params.limit));
  if (params.offset) query.set('offset', String(params.offset));

  const payload = await liveApiFetchJson<any>(`/products?${query.toString()}`, {
    incidentReason: 'products_api_unavailable',
    timeoutMs: 10000,
  });
  const response = await fetch(`${API_BASE_URL}/products?${query.toString()}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch live products (${response.status})`);
  }

  const payload = await response.json();
  if (Array.isArray(payload)) return payload as Product[];
  if (Array.isArray(payload?.products)) return payload.products as Product[];
  return [];
}

/**
 * Get single product by ID
 */
export async function getProduct(id: string): Promise<Product | null> {
  try {
    return await liveApiFetchJson<Product>(`/products/${id}`, {
      incidentReason: 'product_detail_api_unavailable',
      timeoutMs: 10000,
    });
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('Product fetch failed:', error);
    }
    return null;
  }
}

/**
 * Calculate price per kg/L from unit price
 */
export function calculatePricePerUnit(
  prix_unitaire: number,
  contenance: number,
  unite: string
): number {
  // Convert to kg or L
  let factor = 1;
  
  if (unite === 'g') {
    factor = 1000; // convert g to kg
  } else if (unite === 'ml') {
    factor = 1000; // convert ml to L
  }
  
  return (prix_unitaire / contenance) * factor;
}

/**
 * Format price for display
 */
export function formatPrice(price: number): string {
  return price.toFixed(2) + ' €';
}

/**
 * Format date for display
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return 'Hier';
  if (diffDays < 7) return `Il y a ${diffDays} jours`;
  if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaines`;
  if (diffDays < 365) return `Il y a ${Math.floor(diffDays / 30)} mois`;
  return date.toLocaleDateString('fr-FR');
}

/**
 * Get reliability label
 */
export function getReliabilityLabel(score: number): string {
  if (score >= 90) return 'Très fiable';
  if (score >= 70) return 'Fiable';
  if (score >= 50) return 'À vérifier';
  return 'Estimé';
}

/**
 * Get reliability color (CSS background color) based on score (0-100)
 */
export function getReliabilityColor(score: number): string {
  if (score >= 90) return '#10b981'; // green
  if (score >= 70) return '#3b82f6'; // blue
  if (score >= 50) return '#f59e0b'; // amber
  return '#6b7280'; // gray
}

/**
 * Validate price (citizen validation)
 */
export async function validatePrice(productId: string, isValid: boolean): Promise<void> {
  await liveApiFetchJson(`/products/${productId}/validation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ isValid }),
    incidentReason: 'product_validation_api_unavailable',
    timeoutMs: 10000,
  });
}
