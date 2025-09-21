/**
 * Module de suggestions locales pour A KI PRI SA YÉ
 * Fournit des suggestions d'achats basées sur la géolocalisation et les habitudes
 */

class LocalSuggestions {
  constructor() {
    this.userLocation = null;
    this.userPreferences = this.loadUserPreferences();
    this.localStores = [];
    this.suggestions = [];
    this.init();
  }

  async init() {
    await this.getUserLocation();
    this.loadLocalStores();
    this.generateSuggestions();
    this.createSuggestionsWidget();
  }

  /**
   * Obtenir la géolocalisation de l'utilisateur
   */
  async getUserLocation() {
    return new Promise((resolve) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            this.userLocation = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };
            this.detectTerritory();
            resolve(this.userLocation);
          },
          (error) => {
            console.warn('Géolocalisation non disponible:', error.message);
            this.userLocation = this.getDefaultLocation();
            resolve(this.userLocation);
          }
        );
      } else {
        this.userLocation = this.getDefaultLocation();
        resolve(this.userLocation);
      }
    });
  }

  /**
   * Détecter le territoire selon les coordonnées
   */
  detectTerritory() {
    if (!this.userLocation) return 'guadeloupe';

    const { lat, lng } = this.userLocation;
    
    // Coordonnées approximatives des territoires DROM-COM
    const territories = {
      'guadeloupe': { lat: 16.25, lng: -61.58, range: 1 },
      'martinique': { lat: 14.64, lng: -61.02, range: 1 },
      'guyane': { lat: 3.93, lng: -53.12, range: 2 },
      'reunion': { lat: -21.12, lng: 55.54, range: 1 },
      'mayotte': { lat: -12.78, lng: 45.28, range: 0.5 },
      'nouvelle-caledonie': { lat: -20.90, lng: 165.61, range: 2 },
      'polynesie-francaise': { lat: -17.53, lng: -149.41, range: 3 }
    };

    for (const [territory, coords] of Object.entries(territories)) {
      const distance = this.calculateDistance(lat, lng, coords.lat, coords.lng);
      if (distance < coords.range) {
        this.userPreferences.territory = territory;
        this.saveUserPreferences();
        return territory;
      }
    }

    return this.userPreferences.territory || 'guadeloupe';
  }

  /**
   * Calculer la distance entre deux points (formule de Haversine)
   */
  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Rayon de la Terre en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  /**
   * Obtenir une position par défaut selon l'IP ou le localStorage
   */
  getDefaultLocation() {
    const saved = localStorage.getItem('akiprisaye_location');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.warn('Location sauvegardée invalide');
      }
    }
    
    // Position par défaut (Guadeloupe)
    return { lat: 16.25, lng: -61.58 };
  }

  /**
   * Charger les préférences utilisateur
   */
  loadUserPreferences() {
    const saved = localStorage.getItem('akiprisaye_preferences');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.warn('Préférences sauvegardées invalides');
      }
    }

    return {
      territory: 'guadeloupe',
      favoriteStores: [],
      searchHistory: [],
      categories: ['alimentaire', 'hygiene', 'electromenager'],
      budget: { weekly: 150, monthly: 600 },
      notifications: true
    };
  }

  /**
   * Sauvegarder les préférences utilisateur
   */
  saveUserPreferences() {
    localStorage.setItem('akiprisaye_preferences', JSON.stringify(this.userPreferences));
  }

  /**
   * Charger les magasins locaux
   */
  loadLocalStores() {
    const territory = this.userPreferences.territory;
    
    // Données simulées des magasins par territoire
    const storesByTerritory = {
      'guadeloupe': [
        { name: 'Carrefour Baie-Mahault', type: 'hypermarché', distance: 2.5, rating: 4.2 },
        { name: 'Super U Gosier', type: 'supermarché', distance: 5.1, rating: 4.0 },
        { name: 'Leader Price Pointe-à-Pitre', type: 'discount', distance: 3.8, rating: 3.8 },
        { name: 'Intermarché Sainte-Anne', type: 'supermarché', distance: 8.2, rating: 4.1 }
      ],
      'martinique': [
        { name: 'Carrefour Lamentin', type: 'hypermarché', distance: 3.2, rating: 4.3 },
        { name: 'Super U Fort-de-France', type: 'supermarché', distance: 4.5, rating: 4.1 },
        { name: 'Leader Price Schoelcher', type: 'discount', distance: 6.1, rating: 3.9 }
      ],
      'reunion': [
        { name: 'Carrefour Saint-Denis', type: 'hypermarché', distance: 2.8, rating: 4.4 },
        { name: 'Super U Saint-Pierre', type: 'supermarché', distance: 12.3, rating: 4.2 },
        { name: 'Score Saint-Paul', type: 'supermarché', distance: 15.7, rating: 4.0 }
      ]
    };

    this.localStores = storesByTerritory[territory] || storesByTerritory['guadeloupe'];
  }

  /**
   * Générer des suggestions personnalisées
   */
  generateSuggestions() {
    const suggestions = [];
    const territory = this.userPreferences.territory;
    const searchHistory = this.userPreferences.searchHistory;
    
    // Suggestions basées sur l'historique
    if (searchHistory.length > 0) {
      const recentSearches = searchHistory.slice(-5);
      suggestions.push({
        type: 'history',
        title: '🔄 Basé sur vos recherches récentes',
        items: recentSearches.map(search => ({
          name: search,
          suggestion: `Vérifier les nouveaux prix pour "${search}"`,
          action: 'search',
          query: search
        }))
      });
    }

    // Suggestions saisonnières
    const currentMonth = new Date().getMonth();
    const seasonalSuggestions = this.getSeasonalSuggestions(currentMonth, territory);
    if (seasonalSuggestions.length > 0) {
      suggestions.push({
        type: 'seasonal',
        title: '🌴 Produits de saison',
        items: seasonalSuggestions
      });
    }

    // Suggestions de proximité
    const nearbyStores = this.localStores.filter(store => store.distance < 10);
    if (nearbyStores.length > 0) {
      suggestions.push({
        type: 'proximity',
        title: '📍 Magasins à proximité',
        items: nearbyStores.map(store => ({
          name: store.name,
          suggestion: `${store.type} à ${store.distance}km - Note: ${store.rating}/5`,
          action: 'navigate',
          store: store.name
        }))
      });
    }

    // Suggestions d'économies
    suggestions.push({
      type: 'savings',
      title: '💰 Bonnes affaires du moment',
      items: this.getSavingsSuggestions(territory)
    });

    this.suggestions = suggestions;
  }

  /**
   * Obtenir les suggestions saisonnières
   */
  getSeasonalSuggestions(month, territory) {
    const seasonalData = {
      // Produits tropicaux selon la saison
      tropical: {
        0: ['mangues', 'ananas victoria', 'christophines'], // Janvier
        1: ['papayes', 'fruits de la passion', 'goyaves'],
        2: ['mangues julie', 'corossols', 'bananes plantain'],
        3: ['avocats', 'citrons verts', 'épices locales'],
        4: ['ignames', 'patates douces', 'dasheen'],
        5: ['mangues amélie', 'barbadines', 'ti-nains'],
        6: ['prunes de cythère', 'giraumons', 'concombres'],
        7: ['malangas', 'choux caraïbes', 'piments'],
        8: ['sapotilles', 'pommes d\'eau', 'bringelles'],
        9: ['quenettes', 'mombin', 'combava'],
        10: ['cocos', 'bananes jaunes', 'caloupilé'],
        11: ['oranges', 'mandarines', 'cannelle']
      }
    };

    const seasonal = seasonalData.tropical[month] || [];
    return seasonal.map(product => ({
      name: product,
      suggestion: `Produit de saison - Comparer les prix`,
      action: 'search',
      query: product,
      seasonal: true
    }));
  }

  /**
   * Obtenir les suggestions d'économies
   */
  getSavingsSuggestions(territory) {
    // Simule des promotions et bonnes affaires
    const savings = [
      {
        name: 'Riz 10kg en promo',
        suggestion: 'Économisez jusqu\'à 15% cette semaine',
        action: 'search',
        query: 'riz 10kg',
        savings: '15%'
      },
      {
        name: 'Produits surgelés -20%',
        suggestion: 'Offre spéciale jusqu\'au dimanche',
        action: 'category',
        query: 'surgelés',
        savings: '20%'
      },
      {
        name: 'Pack eau + jus -30%',
        suggestion: 'Lot économique disponible',
        action: 'search',
        query: 'pack boissons',
        savings: '30%'
      }
    ];

    return savings;
  }

  /**
   * Créer le widget de suggestions
   */
  createSuggestionsWidget() {
    // Vérifier si le widget existe déjà
    if (document.querySelector('.local-suggestions-widget')) {
      return;
    }

    const widget = document.createElement('div');
    widget.className = 'local-suggestions-widget';
    widget.style.cssText = `
      position: fixed;
      bottom: 80px;
      left: 20px;
      width: 300px;
      max-height: 400px;
      background: rgba(15, 23, 42, 0.95);
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 16px;
      color: #e7eefc;
      font-family: system-ui, sans-serif;
      font-size: 14px;
      z-index: 999;
      backdrop-filter: blur(10px);
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
      transform: translateX(-100%);
      transition: transform 0.3s ease;
      overflow-y: auto;
    `;

    // Header du widget
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid #334155;
    `;

    const title = document.createElement('h4');
    title.textContent = '💡 Suggestions locales';
    title.style.cssText = `
      margin: 0;
      color: #00e5ff;
      font-size: 16px;
    `;

    const toggleBtn = document.createElement('button');
    toggleBtn.textContent = '×';
    toggleBtn.style.cssText = `
      background: none;
      border: none;
      color: #64748b;
      font-size: 20px;
      cursor: pointer;
      padding: 0;
      width: 24px;
      height: 24px;
    `;
    toggleBtn.onclick = () => this.toggleWidget();

    header.appendChild(title);
    header.appendChild(toggleBtn);
    widget.appendChild(header);

    // Contenu des suggestions
    this.suggestions.forEach(section => {
      const sectionEl = document.createElement('div');
      sectionEl.style.marginBottom = '12px';

      const sectionTitle = document.createElement('h5');
      sectionTitle.textContent = section.title;
      sectionTitle.style.cssText = `
        margin: 0 0 8px 0;
        color: #00ff95;
        font-size: 12px;
        font-weight: 600;
      `;
      sectionEl.appendChild(sectionTitle);

      section.items.slice(0, 3).forEach(item => {
        const itemEl = document.createElement('div');
        itemEl.style.cssText = `
          background: #1e293b;
          border-radius: 6px;
          padding: 8px;
          margin-bottom: 4px;
          cursor: pointer;
          transition: background 0.2s;
        `;
        itemEl.onmouseover = () => itemEl.style.background = '#334155';
        itemEl.onmouseout = () => itemEl.style.background = '#1e293b';
        itemEl.onclick = () => this.handleSuggestionClick(item);

        const itemName = document.createElement('div');
        itemName.textContent = item.name;
        itemName.style.cssText = `
          font-weight: 500;
          margin-bottom: 2px;
          color: #e7eefc;
        `;

        const itemDesc = document.createElement('div');
        itemDesc.textContent = item.suggestion;
        itemDesc.style.cssText = `
          font-size: 12px;
          color: #94a3b8;
        `;

        itemEl.appendChild(itemName);
        itemEl.appendChild(itemDesc);
        sectionEl.appendChild(itemEl);
      });

      widget.appendChild(sectionEl);
    });

    // Ajouter le bouton de toggle
    const toggleButton = document.createElement('button');
    toggleButton.textContent = '💡';
    toggleButton.className = 'suggestions-toggle';
    toggleButton.style.cssText = `
      position: fixed;
      bottom: 80px;
      left: 20px;
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background: linear-gradient(135deg, #00e5ff, #00ff95);
      border: none;
      color: #081224;
      font-size: 20px;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0, 229, 255, 0.3);
      z-index: 1000;
      transition: transform 0.2s;
    `;
    toggleButton.onclick = () => this.toggleWidget();

    document.body.appendChild(widget);
    document.body.appendChild(toggleButton);

    this.widget = widget;
    this.toggleButton = toggleButton;

    // Afficher automatiquement après 3 secondes
    setTimeout(() => this.showWidget(), 3000);
  }

  /**
   * Afficher/masquer le widget
   */
  toggleWidget() {
    if (!this.widget) return;

    const isVisible = this.widget.style.transform === 'translateX(0px)';
    if (isVisible) {
      this.hideWidget();
    } else {
      this.showWidget();
    }
  }

  showWidget() {
    if (this.widget) {
      this.widget.style.transform = 'translateX(0)';
    }
  }

  hideWidget() {
    if (this.widget) {
      this.widget.style.transform = 'translateX(-100%)';
    }
  }

  /**
   * Gérer le clic sur une suggestion
   */
  handleSuggestionClick(item) {
    // Ajouter à l'historique
    if (!this.userPreferences.searchHistory.includes(item.query || item.name)) {
      this.userPreferences.searchHistory.push(item.query || item.name);
      this.userPreferences.searchHistory = this.userPreferences.searchHistory.slice(-10);
      this.saveUserPreferences();
    }

    switch (item.action) {
      case 'search':
        this.performSearch(item.query);
        break;
      case 'navigate':
        this.navigateToStore(item.store);
        break;
      case 'category':
        this.browseCategory(item.query);
        break;
      default:
        console.log('Action de suggestion non définie:', item.action);
    }

    this.hideWidget();
  }

  /**
   * Effectuer une recherche
   */
  performSearch(query) {
    // Rediriger vers la page de recherche avec la requête
    const searchUrl = `/recherche.html?q=${encodeURIComponent(query)}`;
    window.location.href = searchUrl;
  }

  /**
   * Naviguer vers un magasin
   */
  navigateToStore(storeName) {
    // Rediriger vers la page des enseignes avec le magasin sélectionné
    const storeUrl = `/enseignes.html?store=${encodeURIComponent(storeName)}`;
    window.location.href = storeUrl;
  }

  /**
   * Parcourir une catégorie
   */
  browseCategory(category) {
    // Rediriger vers la page de recherche avec la catégorie
    const categoryUrl = `/recherche.html?category=${encodeURIComponent(category)}`;
    window.location.href = categoryUrl;
  }
}

// Initialisation automatique
if (typeof window !== 'undefined') {
  window.LocalSuggestions = LocalSuggestions;
  
  document.addEventListener('DOMContentLoaded', function() {
    // Initialiser seulement sur certaines pages
    const currentPage = window.location.pathname;
    if (currentPage === '/' || 
        currentPage.includes('recherche') || 
        currentPage.includes('palmares') ||
        currentPage.includes('index.html')) {
      
      setTimeout(() => {
        new LocalSuggestions();
      }, 2000);
    }
  });
}

// Export pour Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LocalSuggestions;
}