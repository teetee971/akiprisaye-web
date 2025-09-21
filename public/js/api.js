/**
 * Service API pour A KI PRI SA YÉ
 * Intégration avec Data.gouv et gestion du cache localStorage
 */

class ApiService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 30 * 60 * 1000; // 30 minutes
    this.localStorageKey = 'akiprisaye_cache';
    this.dataGouvBaseUrl = 'https://api.gouv.fr';
    
    // Charger le cache depuis localStorage
    this.loadCache();
  }

  /**
   * Charger le cache depuis localStorage
   */
  loadCache() {
    try {
      const cached = localStorage.getItem(this.localStorageKey);
      if (cached) {
        const data = JSON.parse(cached);
        if (data.timestamp && Date.now() - data.timestamp < this.cacheTimeout) {
          this.cache = new Map(data.entries);
        }
      }
    } catch (error) {
      console.warn('Erreur lors du chargement du cache:', error);
    }
  }

  /**
   * Sauvegarder le cache dans localStorage
   */
  saveCache() {
    try {
      const cacheData = {
        timestamp: Date.now(),
        entries: Array.from(this.cache.entries())
      };
      localStorage.setItem(this.localStorageKey, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Erreur lors de la sauvegarde du cache:', error);
    }
  }

  /**
   * Récupérer des données avec cache
   */
  async fetchWithCache(url, options = {}) {
    const cacheKey = url + JSON.stringify(options);
    
    // Vérifier le cache
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          ...options.headers
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Mettre en cache
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });
      this.saveCache();

      return data;
    } catch (error) {
      console.error('Erreur API:', error);
      throw error;
    }
  }

  /**
   * Récupérer les prix des produits depuis Data.gouv
   */
  async getPrices(territory = 'guadeloupe', category = null) {
    try {
      // URL simulée - à adapter selon l'API réelle de Data.gouv
      let url = `/api/prices?territory=${encodeURIComponent(territory)}`;
      if (category) {
        url += `&category=${encodeURIComponent(category)}`;
      }

      const data = await this.fetchWithCache(url);
      return this.formatPricesData(data);
    } catch (error) {
      console.error('Erreur lors de la récupération des prix:', error);
      
      // Fallback sur les données mockées
      return this.getMockPrices();
    }
  }

  /**
   * Formater les données de prix
   */
  formatPricesData(data) {
    if (!data || !data.items) return { items: [] };

    return {
      items: data.items.map(item => ({
        id: item.id || Math.random().toString(36),
        name: item.name || item.libelle || 'Produit inconnu',
        price_dom: parseFloat(item.price_dom || item.prix_dom || 0),
        price_hex: parseFloat(item.price_hex || item.prix_metropole || 0),
        category: item.category || item.categorie || 'Autres',
        store: item.store || item.enseigne || 'Non spécifié',
        territory: item.territory || item.territoire || 'Non spécifié',
        lastUpdate: item.lastUpdate || item.derniere_maj || new Date().toISOString()
      }))
    };
  }

  /**
   * Données mockées en cas d'erreur API
   */
  getMockPrices() {
    return {
      items: [
        {
          id: 'mock_1',
          name: 'Baguette de pain',
          price_dom: 1.20,
          price_hex: 0.95,
          category: 'Boulangerie',
          store: 'Carrefour',
          territory: 'Guadeloupe',
          lastUpdate: new Date().toISOString()
        },
        {
          id: 'mock_2',
          name: 'Lait 1L',
          price_dom: 1.85,
          price_hex: 1.15,
          category: 'Produits laitiers',
          store: 'Super U',
          territory: 'Guadeloupe',
          lastUpdate: new Date().toISOString()
        },
        {
          id: 'mock_3',
          name: 'Essence SP95 (litre)',
          price_dom: 1.65,
          price_hex: 1.45,
          category: 'Carburant',
          store: 'Total',
          territory: 'Guadeloupe',
          lastUpdate: new Date().toISOString()
        }
      ]
    };
  }

  /**
   * Rechercher des produits
   */
  async searchProducts(query, territory = null) {
    try {
      let url = `/api/search?q=${encodeURIComponent(query)}`;
      if (territory) {
        url += `&territory=${encodeURIComponent(territory)}`;
      }

      return await this.fetchWithCache(url);
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
      // Fallback sur une recherche locale dans le cache
      return this.searchInCache(query);
    }
  }

  /**
   * Recherche dans le cache local
   */
  searchInCache(query) {
    const results = [];
    const lowerQuery = query.toLowerCase();

    for (const [key, cached] of this.cache.entries()) {
      if (cached.data && cached.data.items) {
        const matches = cached.data.items.filter(item => 
          item.name && item.name.toLowerCase().includes(lowerQuery)
        );
        results.push(...matches);
      }
    }

    return { items: results };
  }

  /**
   * Obtenir les territoires disponibles
   */
  async getTerritories() {
    try {
      return await this.fetchWithCache('/api/territories.json');
    } catch (error) {
      console.error('Erreur lors du chargement des territoires:', error);
      return {
        ok: true,
        data: [
          { code: "GP", slug: "guadeloupe", name: "Guadeloupe" },
          { code: "MQ", slug: "martinique", name: "Martinique" },
          { code: "GF", slug: "guyane", name: "Guyane" },
          { code: "RE", slug: "reunion", name: "Réunion" },
          { code: "YT", slug: "mayotte", name: "Mayotte" }
        ]
      };
    }
  }

  /**
   * Signaler un problème sur un produit
   */
  async reportProduct(productId, reason, comment) {
    try {
      const report = {
        productId,
        reason,
        comment,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
      };

      // Pour l'instant, stocker en localStorage
      // TODO: Envoyer vers Firestore quand l'authentification sera implémentée
      const reports = JSON.parse(localStorage.getItem('product_reports') || '[]');
      reports.push(report);
      localStorage.setItem('product_reports', JSON.stringify(reports));

      return { success: true, reportId: Date.now().toString() };
    } catch (error) {
      console.error('Erreur lors du signalement:', error);
      throw error;
    }
  }

  /**
   * Nettoyer le cache
   */
  clearCache() {
    this.cache.clear();
    localStorage.removeItem(this.localStorageKey);
  }

  /**
   * Obtenir les statistiques du cache
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys()),
      lastUpdate: localStorage.getItem(this.localStorageKey) ? 
        JSON.parse(localStorage.getItem(this.localStorageKey)).timestamp : null
    };
  }
}

// Instance globale
window.apiService = new ApiService();

// Export pour les modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ApiService;
}