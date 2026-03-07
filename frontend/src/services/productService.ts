 
/**
 * Product Service - v1.1.0
 * 
 * Service for fetching and managing product prices
 * with automatic fallback to last known prices
 * 
 * @module productService
 */

import { safeLocalStorage } from '../utils/safeLocalStorage';
import type { 
  Product, 
  ProductSearchParams, 
  ProductListResponse,
  PriceSource 
} from '../types/product';
import type { TerritoryCode } from '../types/extensions';

/**
 * Mock data for development
 * In production, this would come from API/database
 */
const MOCK_PRODUCTS: Product[] = [
  {
    id: 'prod-001',
    nom: 'Lait demi-écrémé',
    marque: 'Lactel',
    categorie: 'boissons',
    contenance: 1,
    unite: 'L',
    prix_unitaire: 1.85,
    prix_au_kilo_ou_litre: 1.85,
    enseigne: 'Carrefour',
    territoire: 'GP',
    date_releve: new Date().toISOString(),
    source_prix: 'api',
    fiabilite_score: 95,
    photos: [],
    metadata: {
      verified: true,
      lastUpdated: new Date().toISOString(),
      updateCount: 15
    }
  }
];

/**
 * Fetch products with automatic fallback
 * Always returns best available data, never empty
 */
export async function fetchProducts(
  params: ProductSearchParams = {}
): Promise<ProductListResponse> {
  try {
    // Try API fetch first
    const apiProducts = await fetchFromAPI(params);
    
    if (apiProducts && apiProducts.length > 0) {
      return {
        products: apiProducts,
        total: apiProducts.length,
        hasMore: false,
        filters: params
      };
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('API fetch failed, using fallback data:', error);
    }
  }
  
  // Fallback to cached/historical data
  const fallbackProducts = await fetchFromCache(params);
  
  if (fallbackProducts && fallbackProducts.length > 0) {
    return {
      products: fallbackProducts.map(p => ({
        ...p,
        source_prix: 'historical' as PriceSource,
        fiabilite_score: Math.max(p.fiabilite_score - 20, 50) // Lower score for old data
      })),
      total: fallbackProducts.length,
      hasMore: false,
      filters: params
    };
  }
  
  // Last resort: return mock data
  return {
    products: MOCK_PRODUCTS,
    total: MOCK_PRODUCTS.length,
    hasMore: false,
    filters: params
  };
}

/**
 * Fetch from API (placeholder for real implementation)
 */
async function fetchFromAPI(params: ProductSearchParams): Promise<Product[]> {
  // Simulate API call
  return new Promise((resolve) => {
    setTimeout(() => {
      // Filter mock data based on params
      let results = [...MOCK_PRODUCTS];
      
      if (params.territoire) {
        results = results.filter(p => p.territoire === params.territoire);
      }
      
      if (params.categorie) {
        results = results.filter(p => p.categorie === params.categorie);
      }
      
      if (params.query) {
        const query = params.query.toLowerCase();
        results = results.filter(p => 
          p.nom.toLowerCase().includes(query) ||
          p.marque?.toLowerCase().includes(query)
        );
      }
      
      resolve(results);
    }, 100);
  });
}

/**
 * Fetch from local cache/storage
 */
async function fetchFromCache(params: ProductSearchParams): Promise<Product[]> {
  try {
    const cached = safeLocalStorage.getItem('products_cache');
    if (cached) {
      const products: Product[] = JSON.parse(cached);
      return products.filter(p => {
        if (params.territoire && p.territoire !== params.territoire) return false;
        if (params.categorie && p.categorie !== params.categorie) return false;
        return true;
      });
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('Cache fetch failed:', error);
    }
  }
  return [];
}

/**
 * Get single product by ID with fallback
 */
export async function getProduct(id: string): Promise<Product | null> {
  try {
    // Try API first
    const response = await fetchProducts({});
    const product = response.products.find(p => p.id === id);
    return product || null;
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
  // In production, this would send to backend
  // For now, store locally
  try {
    const validations = JSON.parse(safeLocalStorage.getItem('price_validations') || '{}');
    if (!validations[productId]) {
      validations[productId] = { positive: 0, negative: 0 };
    }
    
    if (isValid) {
      validations[productId].positive++;
    } else {
      validations[productId].negative++;
    }
    
    safeLocalStorage.setItem('price_validations', JSON.stringify(validations));
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Failed to save validation:', error);
    }
  }
}

