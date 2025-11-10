import { useState, useEffect } from 'react';
import TerritorySelector from '../components/TerritorySelector';

export default function Carte() {
  const [selectedTerritory, setSelectedTerritory] = useState('GP');
  const [stores, setStores] = useState([]);
  const [mapReady, setMapReady] = useState(false);

  // Mock stores data
  const getMockStores = () => [
    { id: 1, name: 'Carrefour Market Pointe-à-Pitre', lat: 16.2410, lng: -61.5330, territory: 'GP', type: 'supermarche' },
    { id: 2, name: 'Super U Les Abymes', lat: 16.2650, lng: -61.5100, territory: 'GP', type: 'supermarche' },
    { id: 3, name: 'Leader Price Gosier', lat: 16.2280, lng: -61.4850, territory: 'GP', type: 'discount' },
    { id: 4, name: 'Carrefour Fort-de-France', lat: 14.6037, lng: -61.0594, territory: 'MQ', type: 'hypermarche' },
    { id: 5, name: 'Super U Lamentin', lat: 14.6097, lng: -60.9972, territory: 'MQ', type: 'supermarche' },
    { id: 6, name: 'Géant Casino Saint-Denis', lat: -20.8823, lng: 55.4504, territory: 'RE', type: 'hypermarche' },
    { id: 7, name: 'Leader Price Cayenne', lat: 4.9226, lng: -52.3136, territory: 'GF', type: 'discount' },
  ];

  useEffect(() => {
    setStores(getMockStores());
    // Simulate map loading
    setTimeout(() => setMapReady(true), 500);
  }, []);

  const filteredStores = stores.filter(store => 
    selectedTerritory === 'all' || store.territory === selectedTerritory,
  );

  const getStoreTypeIcon = (type) => {
    const icons = {
      'hypermarche': '🏬',
      'supermarche': '🛒',
      'discount': '💰',
      'proximite': '🏪',
    };
    return icons[type] || '🏪';
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#0f62fe] to-[#0353e9] p-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold">🗺️ Carte Interactive des Prix</h1>
            <a 
              href="/" 
              className="text-white hover:text-gray-200 transition-colors"
            >
              ← Accueil
            </a>
          </div>
          <p className="text-gray-100">
            Localisez les magasins et comparez les prix près de chez vous
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6">
        {/* Territory Selector */}
        <div className="mb-6">
          <div className="max-w-md">
            <label className="block text-sm font-medium mb-2">
              Filtrer par territoire
            </label>
            <TerritorySelector 
              value={selectedTerritory}
              onChange={setSelectedTerritory}
            />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Map Placeholder */}
          <div className="lg:col-span-2">
            <div className="bg-[#1e1e1e] rounded-xl border border-gray-700 p-6">
              <div className="bg-[#252525] rounded-lg overflow-hidden">
                {/* Map will be integrated here - using placeholder for now */}
                <div className="aspect-video flex items-center justify-center text-gray-400 border border-gray-700 rounded-lg">
                  {mapReady ? (
                    <div className="text-center p-8">
                      <div className="text-6xl mb-4">🗺️</div>
                      <p className="text-xl font-semibold mb-2">Carte Interactive</p>
                      <p className="text-sm">
                        Module Leaflet en cours d'intégration
                      </p>
                      <div className="mt-4 text-xs text-gray-500">
                        {filteredStores.length} magasin{filteredStores.length > 1 ? 's' : ''} trouvé{filteredStores.length > 1 ? 's' : ''}
                      </div>
                    </div>
                  ) : (
                    <div className="animate-pulse">
                      <p>Chargement de la carte...</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Map Instructions */}
              <div className="mt-4 p-4 bg-blue-900/20 border border-blue-700/30 rounded-lg">
                <h3 className="text-sm font-semibold mb-2 text-blue-400">
                  ℹ️ Comment utiliser la carte
                </h3>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li>• Cliquez sur un marqueur pour voir les détails du magasin</li>
                  <li>• Utilisez le filtre territoire pour affiner la recherche</li>
                  <li>• Les prix affichés sont mis à jour quotidiennement</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Stores List */}
          <div className="lg:col-span-1">
            <div className="bg-[#1e1e1e] rounded-xl border border-gray-700 p-6">
              <h2 className="text-xl font-bold mb-4">
                📍 Magasins ({filteredStores.length})
              </h2>
              
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {filteredStores.map((store) => (
                  <div 
                    key={store.id}
                    className="bg-[#252525] rounded-lg p-4 border border-gray-700 hover:border-blue-600 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{getStoreTypeIcon(store.type)}</span>
                      <div className="flex-1">
                        <h3 className="font-semibold text-white mb-1">
                          {store.name}
                        </h3>
                        <p className="text-xs text-gray-400 mb-2">
                          📍 {store.lat.toFixed(4)}°, {store.lng.toFixed(4)}°
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2 py-1 bg-blue-600 rounded-full">
                            {store.type}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {filteredStores.length === 0 && (
                  <div className="text-center text-gray-400 py-8">
                    <p>Aucun magasin trouvé pour ce territoire</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Information Section */}
        <div className="mt-8 bg-[#1e1e1e] rounded-xl border border-gray-700 p-6">
          <h3 className="text-xl font-semibold mb-4">
            💡 Fonctionnalités à venir
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="bg-[#252525] rounded-lg p-4 border border-gray-700">
              <div className="text-2xl mb-2">🎯</div>
              <h4 className="font-semibold mb-1">Géolocalisation</h4>
              <p className="text-sm text-gray-400">
                Trouvez automatiquement les magasins les plus proches
              </p>
            </div>
            <div className="bg-[#252525] rounded-lg p-4 border border-gray-700">
              <div className="text-2xl mb-2">📊</div>
              <h4 className="font-semibold mb-1">Comparaison de prix</h4>
              <p className="text-sm text-gray-400">
                Comparez les prix entre différents magasins
              </p>
            </div>
            <div className="bg-[#252525] rounded-lg p-4 border border-gray-700">
              <div className="text-2xl mb-2">🔔</div>
              <h4 className="font-semibold mb-1">Alertes prix</h4>
              <p className="text-sm text-gray-400">
                Recevez des notifications sur les promotions
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#1e1e1e] border-t border-gray-700 mt-12 p-6 text-center text-gray-400">
        <p>© 2025 A KI PRI SA YÉ - Tous droits réservés</p>
      </footer>
    </div>
  );
}