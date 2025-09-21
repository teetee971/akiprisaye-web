// Service pour gérer les appels à l'API Data.gouv
// Gère les appels avec fetch, formatage des données et cache localStorage

import { searchMockProducts } from './mockData.js';

const CACHE_PREFIX = 'akipri_cache_';
const CACHE_DURATION = 1000 * 60 * 30; // 30 minutes

// URLs des datasets Data.gouv (à adapter selon les vrais datasets disponibles)
const DATA_GOUV_URLS = {
  // URL d'exemple - à remplacer par les vrais datasets
  prices: 'https://www.data.gouv.fr/api/1/datasets/prix-alimentaires-outre-mer/resources/',
  indices: 'https://www.data.gouv.fr/api/1/datasets/indices-prix-outre-mer/resources/',
  // Fallback vers notre API interne
  fallback: '/api/prices'
};

/**
 * Gère le cache localStorage
 */
class CacheManager {
  static get(key) {
    try {
      const cached = localStorage.getItem(CACHE_PREFIX + key);
      if (!cached) return null;
      
      const data = JSON.parse(cached);
      if (Date.now() - data.timestamp > CACHE_DURATION) {
        localStorage.removeItem(CACHE_PREFIX + key);
        return null;
      }
      
      return data.value;
    } catch (error) {
      console.warn('Erreur lecture cache:', error);
      return null;
    }
  }

  static set(key, value) {
    try {
      const data = {
        value,
        timestamp: Date.now()
      };
      localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(data));
    } catch (error) {
      console.warn('Erreur écriture cache:', error);
    }
  }

  static clear() {
    try {
      Object.keys(localStorage)
        .filter(key => key.startsWith(CACHE_PREFIX))
        .forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.warn('Erreur nettoyage cache:', error);
    }
  }
}

/**
 * Formate les données de prix selon le format attendu par l'application
 */
function formatPriceData(rawData, source = 'data.gouv') {
  try {
    // Si les données viennent de notre API interne
    if (source === 'internal' && rawData.ok && rawData.data) {
      return rawData.data.map(item => ({
        id: item.id,
        name: item.title,
        prices: [{
          store: item.store,
          price: item.price,
          storeCity: item.storeCity,
          brand: item.brand,
          updatedAt: item.updatedAt
        }],
        category: 'Alimentaire',
        brand: item.brand
      }));
    }

    // Formatage pour les données Data.gouv (structure à adapter)
    if (Array.isArray(rawData)) {
      return rawData.map((item, index) => ({
        id: item.id || `datagouv-${index}`,
        name: item.libelle || item.produit || item.nom || 'Produit inconnu',
        prices: [{
          store: item.enseigne || item.magasin || 'Magasin inconnu',
          price: parseFloat(item.prix || item.montant || 0),
          storeCity: item.ville || item.commune || '',
          brand: item.marque || item.enseigne || '',
          updatedAt: item.date_maj || item.date || new Date().toISOString().split('T')[0]
        }],
        category: item.categorie || 'Alimentaire',
        brand: item.marque || item.enseigne || ''
      }));
    }

    return [];
  } catch (error) {
    console.warn('Erreur formatage données:', error);
    return [];
  }
}

/**
 * Effectue un appel à l'API avec gestion d'erreurs
 */
async function fetchWithErrorHandling(url, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      throw new Error('Timeout: L\'API met trop de temps à répondre');
    }
    
    throw error;
  }
}

/**
 * Recherche de produits via l'API Data.gouv ou fallback
 */
export async function searchProducts(query = '', territory = 'guadeloupe') {
  const cacheKey = `products_${territory}_${query}`;
  
  // Vérifier le cache d'abord
  const cached = CacheManager.get(cacheKey);
  if (cached) {
    console.log('Données récupérées du cache');
    return cached;
  }

  try {
    // Tentative avec Data.gouv (à adapter selon les vrais endpoints)
    let data = null;
    let source = 'data.gouv';

    try {
      // URL d'exemple - à remplacer par le vrai endpoint Data.gouv
      const dataGouvUrl = `https://www.data.gouv.fr/api/1/datasets/search/?q=prix ${territory}&page_size=20`;
      data = await fetchWithErrorHandling(dataGouvUrl);
      
      // Si les données Data.gouv ne sont pas utilisables, utiliser le fallback
      if (!data || !Array.isArray(data.data)) {
        throw new Error('Format de données Data.gouv non supporté');
      }
    } catch (dataGouvError) {
      console.warn('Erreur API Data.gouv:', dataGouvError.message);
      console.log('Utilisation de l\'API de fallback...');
      
      // Fallback vers notre API interne
      const fallbackUrl = new URL(DATA_GOUV_URLS.fallback, window.location.origin);
      fallbackUrl.searchParams.set('territory', territory);
      fallbackUrl.searchParams.set('q', query);
      fallbackUrl.searchParams.set('limit', '50');
      
      data = await fetchWithErrorHandling(fallbackUrl.toString());
      source = 'internal';
    }

    // Formater les données
    const formattedData = formatPriceData(data, source);
    
    // Filtrer si nécessaire (pour les données internes, le filtrage est déjà fait côté serveur)
    let results = formattedData;
    if (source === 'data.gouv' && query) {
      const needle = query.toLowerCase();
      results = formattedData.filter(product => 
        product.name.toLowerCase().includes(needle) ||
        product.brand.toLowerCase().includes(needle) ||
        product.category.toLowerCase().includes(needle)
      );
    }

    // Ajouter le meilleur prix pour chaque produit
    const enrichedResults = results.map(product => ({
      ...product,
      best: product.prices.reduce((best, current) => 
        current.price < best.price ? current : best
      )
    }));

    // Mettre en cache
    CacheManager.set(cacheKey, enrichedResults);
    
    return enrichedResults;

  } catch (error) {
    console.error('Erreur lors de la recherche de produits:', error);
    
    // En cas d'erreur totale, utiliser les données mock pour le développement
    console.log('Utilisation des données mock pour le développement...');
    try {
      const mockResults = searchMockProducts(query, territory);
      const enrichedMockResults = mockResults.map(product => ({
        ...product,
        best: product.prices.reduce((best, current) => 
          current.price < best.price ? current : best
        )
      }));
      
      // Mettre en cache les données mock aussi
      CacheManager.set(cacheKey, enrichedMockResults);
      
      return enrichedMockResults;
    } catch (mockError) {
      console.error('Erreur avec les données mock:', mockError);
      
      // En dernier recours, retourner un message d'erreur utilisateur
      throw new Error(
        error.message.includes('Timeout') 
          ? 'Les serveurs sont temporairement indisponibles. Veuillez réessayer dans quelques minutes.'
          : 'Une erreur est survenue lors de la récupération des prix. Veuillez réessayer.'
      );
    }
  }
}

/**
 * Récupère les indices de prix
 */
export async function getPriceIndices(territory = 'guadeloupe') {
  const cacheKey = `indices_${territory}`;
  
  const cached = CacheManager.get(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    // Tentative avec Data.gouv pour les indices
    const indicesUrl = `https://www.data.gouv.fr/api/1/datasets/search/?q=indices prix ${territory}`;
    const data = await fetchWithErrorHandling(indicesUrl);
    
    // Formater les données d'indices (structure à adapter)
    const indices = {
      territory,
      lastUpdate: new Date().toISOString().split('T')[0],
      indices: {
        general: data?.indices_general || 100,
        alimentaire: data?.indices_alimentaire || 100,
        energie: data?.indices_energie || 100
      }
    };
    
    CacheManager.set(cacheKey, indices);
    return indices;
    
  } catch (error) {
    console.warn('Erreur récupération indices:', error);
    
    // Valeurs par défaut en cas d'erreur
    return {
      territory,
      lastUpdate: new Date().toISOString().split('T')[0],
      indices: {
        general: 100,
        alimentaire: 100,
        energie: 100
      },
      error: 'Données d\'indices temporairement indisponibles'
    };
  }
}

/**
 * Nettoie le cache (utile pour le développement ou en cas de problème)
 */
export function clearCache() {
  CacheManager.clear();
  console.log('Cache nettoyé');
}

/**
 * Vérifie la disponibilité des APIs
 */
export async function checkApiHealth() {
  const results = {
    dataGouv: false,
    internal: false,
    lastCheck: new Date().toISOString()
  };

  // Test Data.gouv
  try {
    await fetchWithErrorHandling('https://www.data.gouv.fr/api/1/datasets/?page_size=1');
    results.dataGouv = true;
  } catch (error) {
    console.warn('API Data.gouv indisponible:', error.message);
  }

  // Test API interne
  try {
    await fetchWithErrorHandling('/api/prices?territory=test&limit=1');
    results.internal = true;
  } catch (error) {
    console.warn('API interne indisponible:', error.message);
  }

  return results;
}

export default {
  searchProducts,
  getPriceIndices,
  clearCache,
  checkApiHealth
};