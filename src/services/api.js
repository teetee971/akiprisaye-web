// Service pour l'intégration avec Data.gouv API
// Gestion des datasets prix et indices de consommation

const DATA_GOUV_BASE_URL = 'https://www.data.gouv.fr/api/1';
const CACHE_DURATION = 1000 * 60 * 30; // 30 minutes

/**
 * Utilitaire pour gérer le cache localStorage
 */
class CacheManager {
  static get(key) {
    try {
      const cached = localStorage.getItem(key);
      if (!cached) return null;
      
      const { data, timestamp } = JSON.parse(cached);
      const now = Date.now();
      
      // Vérifier si le cache est encore valide
      if (now - timestamp > CACHE_DURATION) {
        localStorage.removeItem(key);
        return null;
      }
      
      return data;
    } catch (error) {
      console.warn('Erreur de lecture du cache:', error);
      return null;
    }
  }
  
  static set(key, data) {
    try {
      const cacheData = {
        data,
        timestamp: Date.now()
      };
      localStorage.setItem(key, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Erreur de sauvegarde du cache:', error);
    }
  }
  
  static clear() {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('akiprisaye_api_')) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Erreur de nettoyage du cache:', error);
    }
  }
}

/**
 * Fonction générique pour les appels API avec gestion d'erreurs
 */
async function fetchWithErrorHandling(url, cacheKey = null) {
  // Vérifier le cache d'abord
  if (cacheKey) {
    const cached = CacheManager.get(cacheKey);
    if (cached) {
      return cached;
    }
  }
  
  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'AkiPrisaYe/1.0'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Sauvegarder en cache si une clé est fournie
    if (cacheKey) {
      CacheManager.set(cacheKey, data);
    }
    
    return data;
  } catch (error) {
    console.error('Erreur API:', error);
    
    // Essayer de récupérer des données en cache même expirées en cas d'erreur
    if (cacheKey) {
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const { data } = JSON.parse(cached);
          console.warn('Utilisation des données en cache expirées en raison de l\'erreur API');
          return data;
        }
      } catch (cacheError) {
        console.warn('Impossible de récupérer les données en cache:', cacheError);
      }
    }
    
    throw error;
  }
}

/**
 * Rechercher des datasets de prix sur Data.gouv
 */
export async function searchPriceDatasets(query = 'prix consommation', territory = '') {
  const searchParams = new URLSearchParams({
    q: `${query} ${territory}`.trim(),
    page_size: 20,
    sort: '-last_modified'
  });
  
  const url = `${DATA_GOUV_BASE_URL}/datasets/?${searchParams}`;
  const cacheKey = `akiprisaye_api_datasets_${query}_${territory}`;
  
  try {
    const response = await fetchWithErrorHandling(url, cacheKey);
    return {
      ok: true,
      data: response.data || [],
      total: response.total || 0
    };
  } catch (error) {
    return {
      ok: false,
      error: `Impossible de récupérer les datasets: ${error.message}`,
      data: []
    };
  }
}

/**
 * Récupérer les données d'un dataset spécifique
 */
export async function fetchDatasetResources(datasetId) {
  const url = `${DATA_GOUV_BASE_URL}/datasets/${datasetId}`;
  const cacheKey = `akiprisaye_api_dataset_${datasetId}`;
  
  try {
    const response = await fetchWithErrorHandling(url, cacheKey);
    return {
      ok: true,
      data: response
    };
  } catch (error) {
    return {
      ok: false,
      error: `Impossible de récupérer le dataset: ${error.message}`,
      data: null
    };
  }
}

/**
 * Récupérer les indices de prix pour un territoire donné
 */
export async function fetchPriceIndices(territory = 'guadeloupe') {
  // Rechercher des datasets d'indices de prix spécifiques au territoire
  const searchResult = await searchPriceDatasets(`indices prix ${territory}`, territory);
  
  if (!searchResult.ok || searchResult.data.length === 0) {
    // Fallback vers l'API locale si pas de données sur Data.gouv
    return await fetchLocalPrices(territory);
  }
  
  return searchResult;
}

/**
 * Fallback vers l'API locale existante
 */
export async function fetchLocalPrices(territory = 'guadeloupe') {
  try {
    // En mode développement, utiliser les données JSON existantes
    const response = await fetch('/data/products.json');
    if (!response.ok) {
      throw new Error(`Erreur de chargement des données: ${response.status}`);
    }
    
    const products = await response.json();
    
    // Convertir le format existant vers notre format unifié
    const formattedData = products.map((product, index) => ({
      id: product.id || `local-${index}`,
      title: product.name || 'Produit inconnu',
      price: product.price || 0,
      store: 'Données de démo',
      storeCity: territory === 'guadeloupe' ? 'Pointe-à-Pitre' : 'Paris',
      brand: product.brand || 'Marque locale',
      updatedAt: new Date().toISOString().split('T')[0],
      category: product.category || '',
      priceMetropole: product.price ? (product.price * 0.8).toFixed(2) : null, // Simulation prix métropole
      priceDom: product.price,
      ecart: product.price ? '25.0' : null // Simulation écart typique DOM/Métropole
    }));
    
    return {
      ok: true,
      data: formattedData,
      source: 'local'
    };
  } catch (error) {
    // Fallback vers l'API Cloudflare si elle existe
    try {
      const params = new URLSearchParams({
        territory,
        limit: 50
      });
      
      const response = await fetch(`/api/prices?${params}`);
      if (!response.ok) {
        throw new Error(`Erreur API Cloudflare: ${response.status}`);
      }
      
      const data = await response.json();
      return {
        ok: true,
        data: data.data || [],
        source: 'cloudflare'
      };
    } catch (cfError) {
      return {
        ok: false,
        error: `Erreur de chargement des données: ${error.message}`,
        data: []
      };
    }
  }
}

/**
 * Fonction principale pour récupérer les prix avec fallback
 */
export async function fetchPrices(territory = 'guadeloupe', options = {}) {
  const { useDataGouv = true, limit = 20 } = options;
  
  if (useDataGouv) {
    // Essayer d'abord Data.gouv
    const dataGouvResult = await fetchPriceIndices(territory);
    if (dataGouvResult.ok && dataGouvResult.data.length > 0) {
      return dataGouvResult;
    }
  }
  
  // Fallback vers l'API locale
  console.log('Fallback vers l\'API locale');
  return await fetchLocalPrices(territory);
}

/**
 * Normaliser les données de prix de différentes sources
 */
export function normalizePriceData(data, source = 'unknown') {
  if (!Array.isArray(data)) return [];
  
  return data.map(item => {
    // Format unifié pour les données de prix
    return {
      id: item.id || `${source}-${Math.random()}`,
      title: item.title || item.name || item.product || 'Produit inconnu',
      price: parseFloat(item.price || item.prix || 0),
      store: item.store || item.magasin || item.enseigne || 'Non spécifié',
      storeCity: item.storeCity || item.ville || item.city || '',
      brand: item.brand || item.marque || '',
      updatedAt: item.updatedAt || item.date || new Date().toISOString().split('T')[0],
      source
    };
  });
}

/**
 * Nettoyer le cache en cas de problème
 */
export function clearCache() {
  CacheManager.clear();
}

/**
 * Obtenir des statistiques sur le cache
 */
export function getCacheStats() {
  try {
    const keys = Object.keys(localStorage);
    const cacheKeys = keys.filter(key => key.startsWith('akiprisaye_api_'));
    
    return {
      totalKeys: cacheKeys.length,
      keys: cacheKeys,
      totalSize: cacheKeys.reduce((size, key) => {
        return size + (localStorage.getItem(key)?.length || 0);
      }, 0)
    };
  } catch (error) {
    return {
      totalKeys: 0,
      keys: [],
      totalSize: 0,
      error: error.message
    };
  }
}