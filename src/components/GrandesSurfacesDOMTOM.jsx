import { useState, useEffect, useMemo } from 'react';

const GrandesSurfacesDOMTOM = () => {
  const [storesData, setStoresData] = useState({ brands: [], stores: [], meta: { territories: [] } });
  const [loading, setLoading] = useState(true);
  const [selectedTerritory, setSelectedTerritory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [favorites, setFavorites] = useState(new Set());

  // Load stores data on component mount
  useEffect(() => {
    const loadStoresData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/data/stores_domtom.json', { cache: 'no-store' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        setStoresData(data);
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        // Fallback avec données minimales
        setStoresData({
          brands: [],
          stores: [],
          meta: { territories: ['Guadeloupe', 'Martinique', 'Guyane', 'La Réunion', 'Mayotte'] }
        });
      } finally {
        setLoading(false);
      }
    };

    loadStoresData();
  }, []);

  // Filter stores based on selected territory and search term
  const filteredStores = useMemo(() => {
    if (!storesData.stores) return [];
    
    return storesData.stores.filter(store => {
      const matchesTerritory = !selectedTerritory || store.territory === selectedTerritory;
      const matchesSearch = !searchTerm || 
        store.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        store.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        storesData.brands.find(b => b.key === store.brand)?.name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesTerritory && matchesSearch;
    });
  }, [storesData, selectedTerritory, searchTerm]);

  // Get brand info for a store
  const getBrandInfo = (brandKey) => {
    return storesData.brands.find(b => b.key === brandKey) || 
           { key: brandKey, name: brandKey, logo: '/assets/brands/placeholder.png' };
  };

  // Toggle favorite store
  const toggleFavorite = (storeId) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(storeId)) {
      newFavorites.delete(storeId);
    } else {
      newFavorites.add(storeId);
    }
    setFavorites(newFavorites);
    localStorage.setItem('favorite-stores', JSON.stringify(Array.from(newFavorites)));
  };

  // Load favorites from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('favorite-stores');
      if (saved) {
        setFavorites(new Set(JSON.parse(saved)));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des favoris:', error);
    }
  }, []);

  // Export stores data
  const exportData = (format) => {
    if (filteredStores.length === 0) {
      alert('Aucune donnée à exporter');
      return;
    }

    if (format === 'csv') {
      const csv = [
        'Enseigne,Nom,Ville,Adresse,Territoire,Code postal',
        ...filteredStores.map(store => {
          const brand = getBrandInfo(store.brand);
          return `"${brand.name}","${store.name || brand.name}","${store.city || '—'}","${store.address || '—'}","${store.territory}","${store.postcode || '—'}"`;
        })
      ].join('\n');
      
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `grandes-surfaces-domtom-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
    }
  };

  // User suggestions for UX improvements
  const suggestions = [
    {
      category: "Recherche & Navigation",
      items: [
        { title: "Recherche intelligente", description: "Recherche par magasin, produit et localisation avec auto-complétion" },
        { title: "Filtres avancés", description: "Filtres par prix, marque, disponibilité et services" },
        { title: "Géolocalisation", description: "Trouver les magasins les plus proches automatiquement" },
        { title: "Navigation par carte", description: "Interface cartographique interactive des enseignes" }
      ]
    },
    {
      category: "Personnalisation",
      items: [
        { title: "Favoris/Wishlist", description: "Sauvegarder ses enseignes et produits préférés" },
        { title: "Alertes personnalisées", description: "Notifications pour les promotions et nouveaux produits" },
        { title: "Suggestions personnalisées", description: "Recommandations basées sur l'historique d'achat" },
        { title: "Profil utilisateur", description: "Préférences de territoire et habitudes de consommation" }
      ]
    },
    {
      category: "Social & Communauté",
      items: [
        { title: "Avis et notes utilisateurs", description: "Système de notation et commentaires sur les enseignes" },
        { title: "Partage social", description: "Partager les bonnes affaires sur les réseaux sociaux" },
        { title: "Communauté locale", description: "Forums de discussion par territoire" },
        { title: "Signalement collaboratif", description: "Signaler les ruptures de stock ou erreurs de prix" }
      ]
    },
    {
      category: "Données & Analytics",
      items: [
        { title: "Statistiques et tendances", description: "Analyse des prix et tendances de consommation locale" },
        { title: "Historique de prix", description: "Évolution des prix dans le temps avec graphiques" },
        { title: "Comparateur multi-produits", description: "Comparaison simultanée de plusieurs produits" },
        { title: "Calculateur d'économies", description: "Estimation des économies réalisées" }
      ]
    },
    {
      category: "Export & Productivité",
      items: [
        { title: "Export PDF/Excel", description: "Exporter les listes de courses et comparaisons" },
        { title: "Intégration calendrier", description: "Planifier les courses et rappels" },
        { title: "Liste de courses intelligente", description: "Suggestions basées sur les habitudes" },
        { title: "Budget prévisionnel", description: "Estimation des coûts par panier type" }
      ]
    },
    {
      category: "Accessibilité & Support",
      items: [
        { title: "Mode accessibilité", description: "Interface adaptée aux personnes en situation de handicap" },
        { title: "Tutoriels interactifs", description: "Guide d'utilisation étape par étape" },
        { title: "Chat d'assistance", description: "Support client en temps réel" },
        { title: "Version hors-ligne", description: "Consultation des données sans connexion" }
      ]
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
        <span className="ml-3 text-slate-400">Chargement des enseignes...</span>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-6 bg-slate-900/50 rounded-2xl">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-3">
          🏪 Grandes Surfaces DOM-TOM
        </h2>
        <p className="text-slate-400 text-lg">
          Découvrez toutes les enseignes présentes dans les territoires d'outre-mer français
        </p>
      </div>

      {/* Filters and Search */}
      <div className="mb-8 space-y-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Territory Filter */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Filtrer par territoire
            </label>
            <select
              value={selectedTerritory}
              onChange={(e) => setSelectedTerritory(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            >
              <option value="">Tous les territoires</option>
              {storesData.meta.territories.map(territory => (
                <option key={territory} value={territory}>
                  {territory}
                </option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Rechercher
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Nom d'enseigne, ville, marque..."
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            />
          </div>

          {/* Export */}
          <div className="flex-shrink-0">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Export
            </label>
            <button
              onClick={() => exportData('csv')}
              className="px-6 py-3 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-medium transition-colors"
            >
              📊 Export CSV
            </button>
          </div>
        </div>

        {/* Quick stats */}
        <div className="flex flex-wrap gap-4 text-sm">
          <span className="px-3 py-1 bg-slate-800 rounded-full text-slate-300">
            {filteredStores.length} enseigne{filteredStores.length !== 1 ? 's' : ''} trouvée{filteredStores.length !== 1 ? 's' : ''}
          </span>
          {selectedTerritory && (
            <span className="px-3 py-1 bg-sky-900/50 rounded-full text-sky-300">
              📍 {selectedTerritory}
            </span>
          )}
        </div>
      </div>

      {/* Stores Grid */}
      <div className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStores.map((store, index) => {
            const brand = getBrandInfo(store.brand);
            const storeId = `${store.brand}-${store.name}-${index}`;
            const isFavorite = favorites.has(storeId);

            return (
              <div
                key={storeId}
                className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 hover:border-sky-500/50 transition-all duration-200 hover:shadow-lg"
              >
                {/* Store header with logo and favorite */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center overflow-hidden">
                      <img
                        src={brand.logo}
                        alt={brand.name}
                        className="w-10 h-10 object-contain"
                        onError={(e) => {
                          e.target.src = '/assets/brands/placeholder.png';
                        }}
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white text-lg">
                        {store.name || brand.name}
                      </h3>
                      <p className="text-sky-400 text-sm">{brand.name}</p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => toggleFavorite(storeId)}
                    className={`p-2 rounded-full transition-colors ${
                      isFavorite 
                        ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30' 
                        : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {isFavorite ? '⭐' : '☆'}
                  </button>
                </div>

                {/* Store details */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-slate-300">
                    <span className="w-4 text-slate-500">📍</span>
                    <span className="ml-2">{store.city || '—'}</span>
                  </div>
                  
                  {store.address && store.address !== '—' && (
                    <div className="flex items-center text-slate-400">
                      <span className="w-4 text-slate-500">🏠</span>
                      <span className="ml-2">{store.address}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center text-slate-400">
                    <span className="w-4 text-slate-500">🏝️</span>
                    <span className="ml-2">{store.territory}</span>
                  </div>
                  
                  {store.postcode && (
                    <div className="flex items-center text-slate-400">
                      <span className="w-4 text-slate-500">📮</span>
                      <span className="ml-2">{store.postcode}</span>
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div className="mt-4 pt-4 border-t border-slate-700 flex space-x-2">
                  <button className="flex-1 px-3 py-2 bg-sky-600/20 hover:bg-sky-600/30 text-sky-400 rounded-lg text-sm font-medium transition-colors">
                    📱 Voir les prix
                  </button>
                  <button className="px-3 py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-400 rounded-lg text-sm transition-colors">
                    🗺️ Localiser
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {filteredStores.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-slate-300 mb-2">
              Aucune enseigne trouvée
            </h3>
            <p className="text-slate-500">
              Essayez de modifier vos critères de recherche ou de filtrage.
            </p>
          </div>
        )}
      </div>

      {/* Suggestions Section */}
      <div className="bg-gradient-to-r from-sky-900/20 to-slate-800/50 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-white">
            💡 Suggestions pour améliorer votre expérience
          </h3>
          <button
            onClick={() => setShowSuggestions(!showSuggestions)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              showSuggestions
                ? 'bg-sky-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            {showSuggestions ? 'Masquer' : 'Voir les idées'}
          </button>
        </div>

        {showSuggestions && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {suggestions.map((category, index) => (
              <div key={index} className="space-y-4">
                <h4 className="text-lg font-semibold text-sky-400 border-b border-slate-700 pb-2">
                  {category.category}
                </h4>
                <div className="space-y-3">
                  {category.items.map((item, itemIndex) => (
                    <div key={itemIndex} className="bg-slate-800/30 rounded-lg p-4">
                      <h5 className="font-medium text-white mb-1">
                        {item.title}
                      </h5>
                      <p className="text-sm text-slate-400">
                        {item.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {!showSuggestions && (
          <div className="text-center text-slate-400">
            <p>Cliquez sur "Voir les idées" pour découvrir les fonctionnalités à venir !</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GrandesSurfacesDOMTOM;