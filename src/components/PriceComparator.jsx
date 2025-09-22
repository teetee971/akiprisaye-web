import React, { useState, useEffect } from 'react';

export default function PriceComparator() {
  const [searchTerm, setSearchTerm] = useState('');
  const [territory, setTerritory] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const territories = [
    { value: 'guadeloupe', label: '🇬🇵 Guadeloupe' },
    { value: 'martinique', label: '🇲🇶 Martinique' },
    { value: 'guyane', label: '🇬🇫 Guyane' },
    { value: 'reunion', label: '🇷🇪 Réunion' },
    { value: 'mayotte', label: '🇾🇹 Mayotte' },
    { value: 'saint-martin', label: '🇲🇫 Saint-Martin' },
    { value: 'saint-barthelemy', label: '🇧🇱 Saint-Barthélemy' }
  ];

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!searchTerm.trim() || !territory) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);
    setError('');
    setResults([]);

    try {
      // Simulate API call with mock data
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockResults = generateMockResults(searchTerm, territory);
      setResults(mockResults);
    } catch (err) {
      setError('Erreur lors de la recherche');
    } finally {
      setLoading(false);
    }
  };

  const generateMockResults = (product, selectedTerritory) => {
    const stores = [
      'Carrefour', 'Leader Price', 'Ecomax', 'Hyper U', 
      'Super U', 'Géant', 'Intermarché', 'Leclerc'
    ];
    
    return stores.slice(0, 6).map((store, index) => {
      const basePrice = 2.0 + Math.random() * 4;
      const pricePerUnit = basePrice + (Math.random() - 0.5) * 0.8;
      
      return {
        id: index + 1,
        store,
        product,
        price: basePrice.toFixed(2),
        pricePerUnit: pricePerUnit.toFixed(2),
        unit: 'kg',
        territory: selectedTerritory,
        updatedAt: new Date().toISOString(),
        distance: (Math.random() * 10).toFixed(1),
        availability: Math.random() > 0.2 ? 'En stock' : 'Stock limité'
      };
    }).sort((a, b) => parseFloat(a.pricePerUnit) - parseFloat(b.pricePerUnit));
  };

  const exportToCSV = () => {
    if (results.length === 0) return;

    const headers = ['Enseigne', 'Produit', 'Prix', 'Prix/Unité', 'Unité', 'Territoire', 'Disponibilité', 'Distance (km)'];
    const csvContent = [
      headers.join(','),
      ...results.map(item => [
        item.store,
        item.product,
        item.price,
        item.pricePerUnit,
        item.unit,
        item.territory,
        item.availability,
        item.distance
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `comparaison_${searchTerm}_${territory}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
          🛒
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Comparateur de Prix</h2>
          <p className="text-sm text-gray-600">Trouvez les meilleurs prix dans votre territoire</p>
        </div>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="grid md:grid-cols-3 gap-4 mb-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Produit recherché *
            </label>
            <input
              type="text"
              id="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Ex: lait, banane, riz..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label htmlFor="territory" className="block text-sm font-medium text-gray-700 mb-1">
              Territoire *
            </label>
            <select
              id="territory"
              value={territory}
              onChange={(e) => setTerritory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Sélectionnez votre territoire</option>
              {territories.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? '🔄 Recherche...' : '🔍 Comparer'}
            </button>
          </div>
        </div>

        {error && (
          <div className="text-red-600 text-sm mb-4">
            ❌ {error}
          </div>
        )}
      </form>

      {/* Results */}
      {results.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">
              📊 Résultats pour "{searchTerm}" en {territories.find(t => t.value === territory)?.label}
            </h3>
            <button
              onClick={exportToCSV}
              className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
            >
              📗 Exporter CSV
            </button>
          </div>

          <div className="grid gap-3">
            {results.map((result, index) => (
              <div
                key={result.id}
                className={`p-4 border rounded-lg flex justify-between items-center ${
                  index === 0 ? 'border-green-500 bg-green-50' : 'border-gray-200'
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-gray-900">
                      {result.store} {index === 0 && '🏆'}
                    </h4>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      result.availability === 'En stock' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {result.availability}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{result.product}</p>
                  <p className="text-xs text-gray-500">
                    📍 {result.distance} km • Mis à jour: {new Date(result.updatedAt).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900">{result.price} €</div>
                  <div className="text-sm text-gray-600">{result.pricePerUnit} €/{result.unit}</div>
                  {index === 0 && (
                    <div className="text-xs text-green-600 font-medium">Meilleur prix!</div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold mb-2">📈 Résumé de la comparaison</h4>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Prix le plus bas:</span>
                <div className="font-semibold text-green-600">
                  {results[0]?.pricePerUnit} €/{results[0]?.unit} chez {results[0]?.store}
                </div>
              </div>
              <div>
                <span className="text-gray-600">Prix le plus élevé:</span>
                <div className="font-semibold text-red-600">
                  {results[results.length - 1]?.pricePerUnit} €/{results[results.length - 1]?.unit}
                </div>
              </div>
              <div>
                <span className="text-gray-600">Écart maximum:</span>
                <div className="font-semibold text-gray-900">
                  {(parseFloat(results[results.length - 1]?.pricePerUnit) - parseFloat(results[0]?.pricePerUnit)).toFixed(2)} € 
                  ({(((parseFloat(results[results.length - 1]?.pricePerUnit) - parseFloat(results[0]?.pricePerUnit)) / parseFloat(results[0]?.pricePerUnit)) * 100).toFixed(1)}%)
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="text-center py-8">
          <div className="text-gray-600">🔄 Recherche en cours...</div>
        </div>
      )}
    </div>
  );
}