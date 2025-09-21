// API service for connecting to Data.gouv and internal price API
// Handles fetching, caching, and error management

const API_BASE_URL = '/api'; // Internal API endpoint
const DATA_GOUV_BASE_URL = 'https://www.data.gouv.fr/api/1';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

// Cache management with localStorage
class ApiCache {
  static setItem(key, data, ttl = CACHE_DURATION) {
    const item = {
      data,
      timestamp: Date.now(),
      ttl
    };
    try {
      localStorage.setItem(`akipri_cache_${key}`, JSON.stringify(item));
    } catch (error) {
      console.warn('Cache storage failed:', error);
    }
  }

  static getItem(key) {
    try {
      const cached = localStorage.getItem(`akipri_cache_${key}`);
      if (!cached) return null;
      
      const item = JSON.parse(cached);
      const now = Date.now();
      
      // Check if cache is still valid
      if (now - item.timestamp > item.ttl) {
        localStorage.removeItem(`akipri_cache_${key}`);
        return null;
      }
      
      return item.data;
    } catch (error) {
      console.warn('Cache retrieval failed:', error);
      return null;
    }
  }

  static clearCache() {
    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith('akipri_cache_'));
      keys.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.warn('Cache clearing failed:', error);
    }
  }
}

// Error handling utility
class ApiError extends Error {
  constructor(message, code = 'UNKNOWN_ERROR', details = null) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.details = details;
  }
}

// Internal price API functions
export async function fetchPrices(options = {}) {
  const {
    territory = 'guadeloupe',
    q = '',
    limit = 20,
    offset = 0,
    sort = 'price_asc'
  } = options;

  const cacheKey = `prices_${territory}_${q}_${limit}_${offset}_${sort}`;
  
  // Try cache first
  const cached = ApiCache.getItem(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const params = new URLSearchParams({
      territory,
      q,
      limit: limit.toString(),
      offset: offset.toString(),
      sort
    });

    const response = await fetch(`${API_BASE_URL}/prices?${params}`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new ApiError(
        `Erreur lors de la récupération des prix (${response.status})`,
        'FETCH_ERROR',
        { status: response.status, statusText: response.statusText }
      );
    }

    const data = await response.json();
    
    if (!data.ok) {
      throw new ApiError(
        data.message || 'Erreur dans la réponse API',
        'API_ERROR',
        data
      );
    }

    // Cache successful response
    ApiCache.setItem(cacheKey, data);
    return data;

  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Network or other errors
    throw new ApiError(
      'Impossible de se connecter au service de prix. Vérifiez votre connexion internet.',
      'NETWORK_ERROR',
      error.message
    );
  }
}

// Data.gouv API functions for price indices
export async function fetchPriceIndices(territory = 'guadeloupe') {
  const cacheKey = `indices_${territory}`;
  
  // Try cache first
  const cached = ApiCache.getItem(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    // Search for price indices datasets on Data.gouv
    const searchParams = new URLSearchParams({
      q: `prix indices ${territory}`,
      page_size: '10',
      sort: '-created_at'
    });

    const response = await fetch(`${DATA_GOUV_BASE_URL}/datasets/?${searchParams}`, {
      headers: {
        'Accept': 'application/json',
      }
    });

    if (!response.ok) {
      throw new ApiError(
        `Erreur lors de l'accès à Data.gouv (${response.status})`,
        'DATA_GOUV_ERROR',
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Filter datasets related to price indices
    const priceDatasets = data.data?.filter(dataset => 
      dataset.title?.toLowerCase().includes('prix') ||
      dataset.title?.toLowerCase().includes('indice') ||
      dataset.description?.toLowerCase().includes('prix')
    ) || [];

    const result = {
      ok: true,
      territory,
      datasets: priceDatasets.slice(0, 5), // Limit to 5 most relevant
      count: priceDatasets.length,
      updatedAt: new Date().toISOString()
    };

    // Cache with longer TTL for indices (30 minutes)
    ApiCache.setItem(cacheKey, result, 30 * 60 * 1000);
    return result;

  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    throw new ApiError(
      'Impossible d\'accéder aux données d\'indices de prix. Service temporairement indisponible.',
      'DATA_GOUV_NETWORK_ERROR',
      error.message
    );
  }
}

// Transform internal API data to match expected format for Comparateur
export function transformPricesForComparator(apiData) {
  if (!apiData?.data || !Array.isArray(apiData.data)) {
    return [];
  }

  // Group prices by product title to create comparison structure
  const productMap = new Map();

  apiData.data.forEach(item => {
    const key = item.title?.toLowerCase() || '';
    if (!productMap.has(key)) {
      productMap.set(key, {
        id: item.id || `product-${Date.now()}-${Math.random()}`,
        name: item.title,
        brand: item.brand || 'Marque inconnue',
        category: 'Alimentaire', // Default category
        prices: []
      });
    }

    const product = productMap.get(key);
    product.prices.push({
      store: item.store || 'Magasin inconnu',
      price: item.price || 0,
      storeCity: item.storeCity || '',
      updatedAt: item.updatedAt
    });
  });

  // Convert to array and add best price info
  return Array.from(productMap.values()).map(product => {
    const bestPrice = product.prices.reduce((best, current) => 
      current.price < best.price ? current : best
    );

    return {
      ...product,
      best: bestPrice
    };
  });
}

// Error handling helper for UI
export function getErrorMessage(error) {
  if (error instanceof ApiError) {
    switch (error.code) {
      case 'NETWORK_ERROR':
        return 'Problème de connexion internet. Vérifiez votre connexion et réessayez.';
      case 'DATA_GOUV_ERROR':
      case 'DATA_GOUV_NETWORK_ERROR':
        return 'Service d\'indices de prix temporairement indisponible. Réessayez plus tard.';
      case 'FETCH_ERROR':
        return 'Erreur lors de la récupération des données. Réessayez dans quelques instants.';
      case 'API_ERROR':
        return error.message || 'Erreur dans le traitement des données.';
      default:
        return 'Une erreur inattendue s\'est produite. Réessayez plus tard.';
    }
  }
  
  return 'Erreur de connexion. Vérifiez votre accès internet et réessayez.';
}

// Cache management utilities
export const cache = {
  clear: ApiCache.clearCache,
  get: ApiCache.getItem,
  set: ApiCache.setItem
};

export default {
  fetchPrices,
  fetchPriceIndices,
  transformPricesForComparator,
  getErrorMessage,
  cache,
  ApiError
};