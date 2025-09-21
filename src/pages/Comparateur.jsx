import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchPriceComparison, fetchTerritories } from '../lib/api';
import TerritorySelect from '../components/TerritorySelect';

export default function Comparateur() {
  const [selectedTerritory, setSelectedTerritory] = useState('guadeloupe');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeQuery, setActiveQuery] = useState('');

  // Fetch price comparison data
  const { data: comparisonData, isLoading, error, refetch } = useQuery({
    queryKey: ['price-comparison', selectedTerritory, activeQuery],
    queryFn: () => fetchPriceComparison(activeQuery, selectedTerritory),
    enabled: true
  });

  const handleSearch = () => {
    setActiveQuery(searchQuery);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const items = comparisonData?.items || [];
  const territory = comparisonData?.territory || selectedTerritory;

  return (
    <div className="container mx-auto py-6 px-4 space-y-6">
      <header className="text-center">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          Comparateur de prix DOM ↔ Métropole
        </h1>
        <p className="text-slate-600">
          Comparez les prix entre les territoires d'outre-mer et la métropole
        </p>
      </header>

      {/* Search and Territory Selection */}
      <div className="bg-white rounded-lg shadow-sm border p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label htmlFor="search" className="block text-sm font-medium text-slate-700 mb-2">
              Rechercher un produit
            </label>
            <div className="flex gap-2">
              <input
                id="search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ex: lait, pain, riz..."
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleSearch}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Rechercher
              </button>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Territoire
            </label>
            <TerritorySelect
              value={selectedTerritory}
              onChange={setSelectedTerritory}
            />
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold text-slate-900">
            Résultats de comparaison
            {activeQuery && <span className="text-slate-600"> pour "{activeQuery}"</span>}
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Territoire sélectionné: {territory}
          </p>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="text-red-600 mb-4">
                ⚠️ Erreur lors du chargement: {error.message}
              </div>
              <button
                onClick={() => refetch()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Réessayer
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              {activeQuery ? 
                `Aucun résultat trouvé pour "${activeQuery}"` : 
                'Effectuez une recherche pour voir les comparaisons de prix'
              }
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-lg text-slate-900">{item.name}</h3>
                      <p className="text-sm text-slate-600">
                        {item.brand} • {item.store}, {item.storeCity}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <div className="text-sm font-medium text-orange-800 mb-1">Prix DOM</div>
                      <div className="text-2xl font-bold text-orange-900">
                        {item.price_dom.toFixed(2)} €
                      </div>
                    </div>
                    
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="text-sm font-medium text-blue-800 mb-1">Prix Métropole (estimation)</div>
                      <div className="text-2xl font-bold text-blue-900">
                        {item.price_hex.toFixed(2)} €
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex justify-between items-center text-sm text-slate-500">
                    <span>Différence: {((item.price_dom - item.price_hex) / item.price_hex * 100).toFixed(1)}% plus cher en DOM</span>
                    <span>Mis à jour: {new Date(item.updatedAt).toLocaleDateString('fr-FR')}</span>
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