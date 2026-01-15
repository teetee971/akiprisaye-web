/**
 * Shared utilities for API endpoints
 * Provides common functionality used across multiple endpoints
 */

/**
 * Configuration for data sources
 */
export const API_CONFIG = {
  // Data source URL - can be overridden via environment variable
  DATA_SOURCE_URL: 'https://akiprisaye.pages.dev/data/observations/index.json',
  
  // Cache configuration
  CACHE_MAX_AGE: 300, // 5 minutes
  
  // API metadata
  SOURCE_NAME: 'A KI PRI SA YÉ',
};

/**
 * Interface for observations
 */
export interface Product {
  nom: string;
  quantite: number;
  prix_unitaire: number;
  tva_pct?: number;
  categorie?: string;
  ean?: string;
}

export interface Observation {
  id: string;
  territoire: string;
  commune?: string;
  enseigne: string;
  magasin_id?: string;
  date: string;
  heure?: string;
  produits: Product[];
  total_ttc: number;
  source: string;
  fiabilite: string;
  verifie: boolean;
  notes?: string;
  created_at: string;
}

/**
 * Load observations from JSON file
 * Centralized data loading function used by all endpoints
 */
export async function loadObservations(): Promise<Observation[]> {
  try {
    const response = await fetch(API_CONFIG.DATA_SOURCE_URL);
    if (!response.ok) {
      throw new Error('Failed to fetch observations');
    }
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error loading observations:', error);
    return [];
  }
}

/**
 * Normalize product name for matching
 * Centralized normalization to ensure consistent behavior
 */
export function normalizeProductName(name: string): string {
  return name.toLowerCase().trim();
}

/**
 * Check if a product matches a query
 * Uses bidirectional partial matching for flexibility
 * 
 * @param productName - The product name to check
 * @param query - The search query
 * @returns true if the product matches the query
 */
export function matchesProductQuery(productName: string, query: string): boolean {
  const productNorm = normalizeProductName(productName);
  const queryNorm = normalizeProductName(query);
  return productNorm.includes(queryNorm) || queryNorm.includes(productNorm);
}

/**
 * Create standardized CORS headers
 */
export function getCorsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

/**
 * Create standard API response headers
 */
export function getApiHeaders(includeCache = true): Record<string, string> {
  return {
    'Content-Type': 'application/json; charset=utf-8',
    ...(includeCache && { 'Cache-Control': `public, max-age=${API_CONFIG.CACHE_MAX_AGE}` }),
    ...getCorsHeaders(),
  };
}

/**
 * Create OPTIONS response for CORS preflight
 */
export function createOptionsResponse(): Response {
  return new Response(null, {
    status: 204,
    headers: {
      ...getCorsHeaders(),
      'Access-Control-Max-Age': '86400',
    },
  });
}
