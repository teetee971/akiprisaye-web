import React, { useState, useEffect } from 'react';
import { fetchPrices, normalizePriceData, clearCache, getCacheStats } from '../services/api';

export default function Comparateur() {
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [territory, setTerritory] = useState('guadeloupe');
  const [searchQuery, setSearchQuery] = useState('');
  const [useDataGouv, setUseDataGouv] = useState(true);
  const [cacheStats, setCacheStats] = useState(null);

  const territories = [
    { code: 'guadeloupe', name: 'Guadeloupe' },
    { code: 'martinique', name: 'Martinique' },
    { code: 'guyane', name: 'Guyane' },
    { code: 'reunion', name: 'La Réunion' },
    { code: 'mayotte', name: 'Mayotte' }
  ];

  const loadPrices = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await fetchPrices(territory, { useDataGouv });
      
      if (result.ok) {
        const normalizedData = normalizePriceData(result.data, result.source || 'api');
        setPrices(normalizedData);
      } else {
        setError(result.error || 'Erreur inconnue lors du chargement des prix');
        setPrices([]);
      }
    } catch (err) {
      setError(`Erreur de connexion: ${err.message}`);
      setPrices([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearCache = () => {
    clearCache();
    setCacheStats(getCacheStats());
    // Recharger les données
    loadPrices();
  };

  useEffect(() => {
    loadPrices();
    setCacheStats(getCacheStats());
  }, [territory, useDataGouv]);

  const filteredPrices = prices.filter(price => 
    searchQuery === '' || 
    price.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    price.store.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">🛒 Comparateur de prix</h2>
        
        {/* Contrôles */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div>
            <label htmlFor="territory" className="block text-sm font-medium text-gray-700 mb-2">
              Territoire
            </label>
            <select
              id="territory"
              value={territory}
              onChange={(e) => setTerritory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {territories.map(t => (
                <option key={t.code} value={t.code}>{t.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
              Rechercher
            </label>
            <input
              id="search"
              type="text"
              placeholder="Produit ou magasin..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              id="useDataGouv"
              type="checkbox"
              checked={useDataGouv}
              onChange={(e) => setUseDataGouv(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="useDataGouv" className="text-sm text-gray-700">
              Utiliser Data.gouv
            </label>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={loadPrices}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Chargement...' : 'Actualiser'}
            </button>
            <button
              onClick={handleClearCache}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Vider cache
            </button>
          </div>
        </div>

        {/* Messages d'erreur */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="flex">
              <div className="text-red-800">
                <strong>Erreur:</strong> {error}
              </div>
            </div>
            <div className="mt-2 text-sm text-red-600">
              Les données en cache sont utilisées si disponibles. Vérifiez votre connexion internet.
            </div>
          </div>
        )}

        {/* Statistiques du cache */}
        {cacheStats && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-6">
            <div className="text-sm text-blue-800">
              Cache: {cacheStats.totalKeys} entrées, {Math.round(cacheStats.totalSize / 1024)} Ko
            </div>
          </div>
        )}

        {/* Résultats */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">
              Résultats ({filteredPrices.length} produits)
            </h3>
            {filteredPrices.length > 0 && (
              <div className="text-sm text-gray-500">
                Source: {prices[0]?.source === 'local' ? 'API locale' : 'Data.gouv'}
              </div>
            )}
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Chargement des prix...</p>
            </div>
          ) : filteredPrices.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {error ? 'Aucune donnée disponible' : 'Aucun produit trouvé'}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPrices.map(price => (
                <div key={price.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-gray-900 text-sm">{price.title}</h4>
                    <div className="text-right">
                      <span className="text-lg font-bold text-green-600">
                        {price.price.toFixed(2)} €
                      </span>
                      {price.priceMetropole && (
                        <div className="text-xs text-gray-500">
                          Métropole: {price.priceMetropole.toFixed(2)} €
                        </div>
                      )}
                      {price.ecart && (
                        <div className={`text-xs font-medium ${parseFloat(price.ecart) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {parseFloat(price.ecart) > 0 ? '+' : ''}{price.ecart}%
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-1 text-xs text-gray-600">
                    <div className="flex justify-between">
                      <span>Magasin:</span>
                      <span className="font-medium">{price.store}</span>
                    </div>
                    {price.storeCity && (
                      <div className="flex justify-between">
                        <span>Ville:</span>
                        <span>{price.storeCity}</span>
                      </div>
                    )}
                    {price.brand && (
                      <div className="flex justify-between">
                        <span>Marque:</span>
                        <span>{price.brand}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Mis à jour:</span>
                      <span>{price.updatedAt}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}