/**
 * Service API pour l'intégration Data.gouv et comparaison de prix
 * Inclut cache localStorage et gestion d'erreurs
 */

class ApiService {
  constructor() {
    this.baseUrl = 'https://akiprisaye.pages.dev/api';
    this.cachePrefix = 'akp_cache_';
    this.cacheDuration = 30 * 60 * 1000; // 30 minutes en ms
  }

  /**
   * Récupère les prix avec cache localStorage
   * @param {Object} params - Paramètres de requête (territory, limit, offset, q, sort)
   * @returns {Promise<Object>} Données des prix
   */
  async getPrices(params = {}) {
    const cacheKey = this.getCacheKey('prices', params);
    
    try {
      // Vérifier le cache d'abord
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        console.log('📦 Données récupérées depuis le cache:', cacheKey);
        return cached;
      }

      // Construire l'URL avec les paramètres
      const url = new URL(`${this.baseUrl}/prices`);
      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          url.searchParams.append(key, value);
        }
      });

      console.log('🌐 Récupération des prix depuis:', url.toString());
      
      const response = await this.fetchWithRetry(url.toString());
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Mettre en cache pour les prochaines requêtes
      this.setCache(cacheKey, data);
      
      return data;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des prix:', error);
      
      // Essayer de retourner des données en cache même expirées en cas d'erreur
      const expiredCache = this.getFromCache(cacheKey, true);
      if (expiredCache) {
        console.warn('⚠️ Utilisation des données en cache expirées suite à l\'erreur');
        return expiredCache;
      }
      
      throw error;
    }
  }

  /**
   * Récupère les actualités liées aux prix
   * @returns {Promise<Object>} Données des actualités
   */
  async getNews() {
    const cacheKey = this.getCacheKey('news');
    
    try {
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }

      const response = await this.fetchWithRetry(`${this.baseUrl}/news`);
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      this.setCache(cacheKey, data);
      
      return data;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des actualités:', error);
      
      // Retourner des données par défaut en cas d'erreur
      return {
        ok: false,
        error: error.message,
        items: []
      };
    }
  }

  /**
   * Récupère les territoires disponibles
   * @returns {Promise<Object>} Liste des territoires
   */
  async getTerritories() {
    const cacheKey = this.getCacheKey('territories');
    
    try {
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }

      // Essayer d'abord l'API, puis fallback sur les données statiques
      let response;
      try {
        response = await this.fetchWithRetry(`${this.baseUrl}/territories`);
      } catch (apiError) {
        console.warn('API territories indisponible, utilisation des données statiques');
        response = await fetch('/api/territories.json');
      }
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      this.setCache(cacheKey, data);
      
      return data;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des territoires:', error);
      
      // Données de fallback
      return {
        ok: true,
        data: [
          {code: "GP", slug: "guadeloupe", name: "Guadeloupe"},
          {code: "MQ", slug: "martinique", name: "Martinique"},
          {code: "GF", slug: "guyane", name: "Guyane"},
          {code: "RE", slug: "reunion", name: "Réunion"}
        ],
        count: 4
      };
    }
  }

  /**
   * Compare les prix entre DOM et Hexagone
   * @param {string} territory - Code du territoire
   * @returns {Promise<Object>} Résultats de comparaison
   */
  async comparePrice(territory = 'guadeloupe') {
    try {
      const data = await this.getPrices({ territory, limit: 50 });
      
      if (!data.ok || !data.data || data.data.length === 0) {
        return {
          ok: false,
          message: 'Aucune donnée disponible pour la comparaison',
          items: []
        };
      }

      // Calcul des écarts de prix (simulé pour démonstration)
      const comparisons = data.data.map(item => {
        // Simulation d'un prix métropole (généralement inférieur)
        const priceHex = item.price * 0.8; // 20% moins cher en moyenne
        const priceDom = item.price;
        const delta = priceDom - priceHex;
        const deltaPct = Math.round((delta / priceHex) * 100);

        return {
          ...item,
          price_dom: priceDom,
          price_hex: priceHex,
          delta,
          delta_pct: deltaPct
        };
      });

      // Trier par écart décroissant
      comparisons.sort((a, b) => b.delta_pct - a.delta_pct);

      return {
        ok: true,
        territory,
        count: comparisons.length,
        items: comparisons
      };
    } catch (error) {
      console.error('❌ Erreur lors de la comparaison des prix:', error);
      return {
        ok: false,
        error: error.message,
        items: []
      };
    }
  }

  /**
   * Fetch avec retry automatique
   * @param {string} url - URL à récupérer
   * @param {Object} options - Options fetch
   * @param {number} retries - Nombre de tentatives
   * @returns {Promise<Response>} Réponse fetch
   */
  async fetchWithRetry(url, options = {}, retries = 2) {
    for (let i = 0; i <= retries; i++) {
      try {
        const response = await fetch(url, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            ...options.headers
          }
        });
        
        return response;
      } catch (error) {
        console.warn(`Tentative ${i + 1}/${retries + 1} échouée pour ${url}:`, error.message);
        
        if (i === retries) {
          throw error;
        }
        
        // Attendre avant de réessayer (backoff exponentiel)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
      }
    }
  }

  /**
   * Génère une clé de cache basée sur l'endpoint et les paramètres
   * @param {string} endpoint - Nom de l'endpoint
   * @param {Object} params - Paramètres optionnels
   * @returns {string} Clé de cache
   */
  getCacheKey(endpoint, params = {}) {
    const paramString = Object.keys(params).length > 0 
      ? '_' + Object.entries(params)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([k, v]) => `${k}=${v}`)
          .join('&')
      : '';
    
    return `${this.cachePrefix}${endpoint}${paramString}`;
  }

  /**
   * Récupère des données depuis le cache localStorage
   * @param {string} key - Clé de cache
   * @param {boolean} ignoreExpiry - Ignorer l'expiration
   * @returns {Object|null} Données cachées ou null
   */
  getFromCache(key, ignoreExpiry = false) {
    try {
      const cached = localStorage.getItem(key);
      if (!cached) return null;

      const { data, timestamp } = JSON.parse(cached);
      
      if (!ignoreExpiry && Date.now() - timestamp > this.cacheDuration) {
        localStorage.removeItem(key);
        return null;
      }

      return data;
    } catch (error) {
      console.warn('Erreur lors de la lecture du cache:', error);
      return null;
    }
  }

  /**
   * Stocke des données dans le cache localStorage
   * @param {string} key - Clé de cache
   * @param {Object} data - Données à cacher
   */
  setCache(key, data) {
    try {
      const cacheObject = {
        data,
        timestamp: Date.now()
      };
      
      localStorage.setItem(key, JSON.stringify(cacheObject));
    } catch (error) {
      console.warn('Erreur lors de l\'écriture du cache:', error);
    }
  }

  /**
   * Vide le cache localStorage
   * @param {string} pattern - Motif optionnel pour filtrer les clés
   */
  clearCache(pattern = null) {
    const keys = Object.keys(localStorage);
    
    keys.forEach(key => {
      if (key.startsWith(this.cachePrefix)) {
        if (!pattern || key.includes(pattern)) {
          localStorage.removeItem(key);
        }
      }
    });
    
    console.log('🗑️ Cache vidé', pattern ? `(pattern: ${pattern})` : '');
  }

  /**
   * Retourne les statistiques du cache
   * @returns {Object} Statistiques du cache
   */
  getCacheStats() {
    const keys = Object.keys(localStorage);
    const cacheKeys = keys.filter(key => key.startsWith(this.cachePrefix));
    
    let totalSize = 0;
    let validEntries = 0;
    let expiredEntries = 0;
    
    cacheKeys.forEach(key => {
      const value = localStorage.getItem(key);
      totalSize += value.length;
      
      try {
        const { timestamp } = JSON.parse(value);
        if (Date.now() - timestamp > this.cacheDuration) {
          expiredEntries++;
        } else {
          validEntries++;
        }
      } catch (e) {
        expiredEntries++;
      }
    });
    
    return {
      totalEntries: cacheKeys.length,
      validEntries,
      expiredEntries,
      totalSize,
      cachePrefix: this.cachePrefix
    };
  }
}

// Création de l'instance globale
window.apiService = new ApiService();

// Export pour utilisation en modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ApiService;
}