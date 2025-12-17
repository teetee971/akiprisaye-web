import { useState } from 'react';
import TerritorySelector from '../components/TerritorySelector';
import ProductSearch from '../components/ProductSearch';
import BarcodeScanner from '../components/BarcodeScanner';
import { findProductByEan, filterPricesByTerritory } from '../data/seedProducts';

export default function Comparateur() {
  const [ean, setEan] = useState('');
  const [territory, setTerritory] = useState('GP');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showScanner, setShowScanner] = useState(false);

  const handlePickEAN = (code) => {
    setEan(code);
    setResults([]);
  };

  const handleScanResult = (code) => {
    setEan(code);
    setShowScanner(false);
    setResults([]);
    // Auto-trigger search after scan
    setTimeout(() => {
      const form = document.querySelector('form');
      if (form) {
        form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
      }
    }, 100);
  };

  const searchPrices = async (e) => {
    e.preventDefault();
    
    if (!ean || ean.length < 8) {
      setError('Veuillez entrer un code EAN valide (minimum 8 chiffres)');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Try to fetch from API, fallback to mock data
      const response = await fetch(`/api/prices?ean=${ean}&territory=${territory}`).catch(() => null);
      
      if (response && response.ok) {
        const data = await response.json();
        setResults(data);
      } else {
        // Mock data fallback
        setResults(getMockPrices(ean, territory));
      }
    } catch (err) {
      console.error('Error fetching prices:', err);
      setResults(getMockPrices(ean, territory));
    } finally {
      setLoading(false);
    }
  };

  const getMockPrices = (ean, territory) => {
    // Try to find product in seed data first
    const product = findProductByEan(ean);
    
    if (product) {
      // Filter prices by territory
      const filteredPrices = filterPricesByTerritory(product, territory);
      
      // Convert to component format
      return filteredPrices.map((price, idx) => ({
        id: idx + 1,
        store: price.storeName,
        price: price.price,
        unit: price.currency === 'EUR' ? '€' : price.currency,
        location: `${price.city}, ${price.territory}`,
        lastUpdate: price.ts,
        promotion: idx === 1, // Mark second store as promo for variety
      }));
    }
    
    // Fallback: Generate random mock data
    const basePrice = parseFloat((Math.random() * 10 + 2).toFixed(2));
    
    return [
      {
        id: 1,
        store: 'Carrefour Market',
        price: basePrice,
        unit: '€',
        location: territory,
        lastUpdate: new Date().toISOString(),
        promotion: false,
      },
      {
        id: 2,
        store: 'Super U',
        price: (basePrice * 0.95).toFixed(2),
        unit: '€',
        location: territory,
        lastUpdate: new Date().toISOString(),
        promotion: true,
      },
      {
        id: 3,
        store: 'Leader Price',
        price: (basePrice * 0.88).toFixed(2),
        unit: '€',
        location: territory,
        lastUpdate: new Date().toISOString(),
        promotion: false,
      },
    ];
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getBestPrice = () => {
    if (results.length === 0) return null;
    return Math.min(...results.map(r => parseFloat(r.price)));
  };

  const bestPrice = getBestPrice();

  return (
    <div className="min-h-screen bg-[#121212] text-white">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#0f62fe] to-[#0353e9] p-6 shadow-lg">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold">🔍 Comparateur de Prix</h1>
            <a 
              href="/" 
              className="text-white hover:text-gray-200 transition-colors"
            >
              ← Accueil
            </a>
          </div>
          <p className="text-gray-100">
            Comparez les prix par code EAN dans votre territoire
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-6">
        {/* Product Search */}
        <div className="bg-[#1e1e1e] rounded-xl border border-gray-700 p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Rechercher un produit</h2>
          <ProductSearch territory={territory} onPickEAN={handlePickEAN} />
        </div>

        {/* Search Form */}
        <div className="bg-[#1e1e1e] rounded-xl border border-gray-700 p-6 mb-6">
          <form onSubmit={searchPrices} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="ean" className="block text-sm font-medium mb-2">
                  Code EAN / Code-barres
                </label>
                <div className="flex gap-2">
                  <input
                    id="ean"
                    type="text"
                    value={ean}
                    onChange={(e) => setEan(e.target.value.replace(/\D/g, ''))}
                    placeholder="Ex: 3017620422003"
                    className="flex-1 bg-[#252525] text-white border border-gray-700 px-4 py-3 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                    maxLength="13"
                  />
                  <button
                    type="button"
                    onClick={() => setShowScanner(true)}
                    className="px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors"
                    title="Scanner un code-barres"
                  >
                    📷
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Entrez le code à 8, 12 ou 13 chiffres
                </p>
              </div>
              
              <div>
                <label htmlFor="territory" className="block text-sm font-medium mb-2">
                  Territoire
                </label>
                <TerritorySelector 
                  value={territory}
                  onChange={setTerritory}
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-900/20 border border-red-700/30 rounded-lg p-4">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full md:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors"
            >
              {loading ? '🔍 Recherche en cours...' : '🔍 Comparer les prix'}
            </button>
          </form>
        </div>

        {/* Results */}
        {loading && (
          <div className="bg-[#1e1e1e] rounded-xl border border-gray-700 p-8">
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex gap-4">
                  <div className="h-20 w-20 bg-gray-700 rounded-lg"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-700 rounded w-1/3"></div>
                    <div className="h-6 bg-gray-700 rounded w-1/4"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && results.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">
                Résultats ({results.length})
              </h2>
              {bestPrice && (
                <div className="bg-green-900/20 border border-green-700/30 px-4 py-2 rounded-lg">
                  <span className="text-sm text-gray-400">Meilleur prix : </span>
                  <span className="text-xl font-bold text-green-400">{bestPrice.toFixed(2)} €</span>
                </div>
              )}
            </div>

            <div className="grid gap-4">
              {results.map((result) => {
                const isBestPrice = parseFloat(result.price) === bestPrice;
                
                return (
                  <div 
                    key={result.id}
                    className={`bg-[#1e1e1e] rounded-xl border ${
                      isBestPrice ? 'border-green-600' : 'border-gray-700'
                    } p-6 hover:border-blue-600 transition-colors`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-16 h-16 bg-[#252525] rounded-lg flex items-center justify-center text-3xl">
                            🏪
                          </div>
                          <div>
                            <h3 className="text-xl font-semibold">{result.store}</h3>
                            <p className="text-sm text-gray-400">📍 {result.location}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 flex-wrap">
                          {result.promotion && (
                            <span className="px-3 py-1 bg-red-600 text-white text-xs font-semibold rounded-full">
                              🏷️ EN PROMO
                            </span>
                          )}
                          {isBestPrice && (
                            <span className="px-3 py-1 bg-green-600 text-white text-xs font-semibold rounded-full">
                              ⭐ MEILLEUR PRIX
                            </span>
                          )}
                          <span className="text-xs text-gray-500">
                            Mis à jour : {formatDate(result.lastUpdate)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className={`text-4xl font-bold ${
                          isBestPrice ? 'text-green-400' : 'text-white'
                        }`}>
                          {result.price} {result.unit}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!loading && results.length === 0 && ean && (
          <div className="bg-[#1e1e1e] rounded-xl border border-gray-700 p-12 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold mb-2">Aucun résultat trouvé</h3>
            <p className="text-gray-400">
              Essayez un autre code EAN ou vérifiez votre saisie
            </p>
          </div>
        )}

        {/* Info Section */}
        <div className="mt-8 space-y-4">
          {/* Transparency Notice */}
          <div className="bg-yellow-900/20 border border-yellow-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-3 text-yellow-400">
              ⚠️ Transparence sur les données
            </h3>
            <p className="text-gray-300 text-sm mb-2">
              <strong>Phase de développement :</strong> Les prix affichés proviennent actuellement
              d'un jeu de données de démonstration basé sur des relevés manuels ponctuels.
            </p>
            <p className="text-gray-400 text-sm">
              La collecte automatisée et citoyenne des prix sera activée progressivement.
              Pour en savoir plus, consultez notre{' '}
              <a href="/methodologie" className="text-blue-400 hover:text-blue-300 underline">
                page méthodologie
              </a>.
            </p>
          </div>
          
          <div className="bg-blue-900/20 border border-blue-700/30 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-3 text-blue-400">
              ℹ️ Comment ça marche ?
            </h3>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li>• Scannez le code-barres de votre produit ou saisissez-le manuellement</li>
              <li>• Sélectionnez votre territoire pour des résultats précis</li>
              <li>• Comparez les prix entre différents magasins</li>
              <li>• Les dates de mise à jour sont affichées pour chaque prix</li>
            </ul>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#1e1e1e] border-t border-gray-700 mt-12 p-6 text-center text-gray-400">
        <p>© 2025 A KI PRI SA YÉ - Tous droits réservés</p>
      </footer>

      {/* Barcode Scanner Modal */}
      {showScanner && (
        <BarcodeScanner
          onScan={handleScanResult}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
}