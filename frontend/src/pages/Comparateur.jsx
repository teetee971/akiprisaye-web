/* eslint-disable no-undef */
import ProductSearch from '../components/ProductSearch';
import TerritorySelector from '../components/TerritorySelector';
import EmptyState from '../components/EmptyState';
import BarcodeScanner from '../components/BarcodeScanner';
import { useEffect, useRef, useState } from 'react';
import { findProductByEan, filterPricesByTerritory, searchProductsByName } from '../data/seedProducts';
import { DEFAULT_TERRITORY, getTerritoryByCode } from '../constants/territories';

const MIN_QUERY_LENGTH = 3;

const EMPTY_RESULTS_STATE = {
  stores: [],
  productLabel: null,
  error: null,
  infoMessage: '',
};

const getSearchDescriptor = ({ ean = '', query = '' }) => {
  const barcode = ean.trim();
  const trimmedQuery = query.trim().toLowerCase();

  if (/^\d{8,13}$/.test(barcode)) {
    return { mode: 'EAN', key: barcode };
  }

  if (trimmedQuery.length >= MIN_QUERY_LENGTH) {
    return { mode: 'QUERY', key: trimmedQuery };
  }

  return { mode: 'NONE', key: '' };
};

export default function Comparateur() {
  const [ean, setEan] = useState('');
  const [territory, setTerritory] = useState(DEFAULT_TERRITORY);
  const [results, setResults] = useState(EMPTY_RESULTS_STATE);
  const [loading, setLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [query, setQuery] = useState('');
  const [currentSearch, setCurrentSearch] = useState({ mode: 'NONE', key: '', territory, requestId: 0 });
  const requestIdRef = useRef(0);
  const abortRef = useRef(null);

  const resetDisplayedResults = () => {
    setResults(EMPTY_RESULTS_STATE);
  };

  useEffect(() => {
    const searchDescriptor = getSearchDescriptor({ ean, query });
    const shouldReset = searchDescriptor.mode !== currentSearch.mode || searchDescriptor.key !== currentSearch.key;

    if (shouldReset) {
      resetDisplayedResults();
    }
  }, [ean, query, currentSearch.key, currentSearch.mode]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const handlePickEAN = (code) => {
    setEan(code);
    setQuery('');
    resetDisplayedResults();
  };

  const handleScanResult = (code) => {
    setEan(code);
    setQuery('');
    setShowScanner(false);
    resetDisplayedResults();
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

    const barcode = ean.trim();
    const trimmedQuery = query.trim();

    if (!barcode && !trimmedQuery) {
      setResults((prev) => ({ ...prev, error: 'Saisissez un EAN ou un nom de produit' }));
      return;
    }

    if (barcode && !/^\d{8,13}$/.test(barcode)) {
      setResults((prev) => ({ ...prev, error: 'Veuillez entrer un code EAN valide (8 à 13 chiffres)' }));
      return;
    }

    if (!barcode && trimmedQuery.length < MIN_QUERY_LENGTH) {
      setResults((prev) => ({ ...prev, error: `Saisissez au moins ${MIN_QUERY_LENGTH} caractères pour la recherche` }));
      return;
    }

    const descriptor = getSearchDescriptor({ ean: barcode, query: trimmedQuery });
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setCurrentSearch({ ...descriptor, territory, requestId });

    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    resetDisplayedResults();

    try {
      // Try to fetch from API, fallback to mock data
      const searchParams = new URLSearchParams({ territory });
      if (descriptor.mode === 'EAN') {
        searchParams.set('ean', barcode);
      } else {
        searchParams.set('query', descriptor.key);
      }

      const response = await fetch(`/api/prices?${searchParams.toString()}`, { signal: controller.signal }).catch(() => null);

      if (requestId !== requestIdRef.current) {
        return;
      }
      
      if (response && response.ok) {
        const data = await response.json();
        if (requestId !== requestIdRef.current) {
          return;
        }

        if (Array.isArray(data)) {
          setResults({
            stores: data,
            productLabel: data[0]?.product || null,
            error: null,
            infoMessage: data.length === 0
              ? "Aucun résultat trouvé pour cette recherche."
              : '',
          });
          return;
        }
      }
      const seededProduct = descriptor.mode === 'EAN'
        ? findProductByEan(barcode)
        : searchProductsByName(descriptor.key)[0] || null;

      if (requestId !== requestIdRef.current) {
        return;
      }

      if (seededProduct?.name) {
        const territoryName = territory === 'all'
          ? 'all'
          : getTerritoryByCode(territory)?.name;
        const seededPrices = filterPricesByTerritory(seededProduct, territoryName ?? 'all');
        if (seededPrices.length > 0) {
          setResults({
            stores: seededPrices.map((price) => ({
              id: `${seededProduct.ean}-${price.storeId}`,
              store: price.storeName,
              location: price.city,
              price: price.price,
              unit: price.currency === 'EUR' ? '€' : price.currency,
              lastUpdate: price.ts,
              promotion: false,
            })),
            productLabel: seededProduct.name,
            error: null,
            infoMessage: '',
          });
          return;
        }
      }
      setResults({
        stores: [],
        productLabel: null,
        error: null,
        infoMessage: "Données en cours d'intégration. Les comparaisons réelles seront publiées dès que l'API prix sera connectée.",
      });
    } catch (err) {
      if (err.name === 'AbortError') {
        return;
      }
      console.error('Error fetching prices:', err);
      if (requestId === requestIdRef.current) {
        setResults((prev) => ({
          ...prev,
          infoMessage: "Données en cours d'intégration. Les comparaisons réelles seront publiées dès que l'API prix sera connectée.",
        }));
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
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
    if (results.stores.length === 0) return null;
    return Math.min(...results.stores.map(r => parseFloat(r.price)));
  };

  const bestPrice = getBestPrice();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header - Style institutionnel moderne */}
      <header className="bg-white dark:bg-slate-900 shadow-md border-b border-blue-100 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-2xl">🔍</span>
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                  Comparateur de Prix
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  Service public de transparence des prix en Outre-mer
                </p>
              </div>
            </div>
            <a 
              href="/" 
              className="hidden sm:flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors"
            >
              <span>←</span>
              <span>Accueil</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Product Search Section */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6 mb-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-xl">🔎</span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Rechercher un produit
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Trouvez un produit par nom ou catégorie
              </p>
            </div>
          </div>
          <ProductSearch
            territory={territory}
            onPickEAN={handlePickEAN}
            onQueryChange={(nextQuery) => {
              setQuery(nextQuery);
              setEan('');
            }}
          />
        </div>

        {/* Search Form - Design moderne */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6 mb-6">
          <form onSubmit={searchPrices} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* EAN Input */}
              <div>
                <label htmlFor="ean" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                  Code EAN / Code-barres
                </label>
                <div className="flex gap-2">
                  <input
                    id="ean"
                    type="text"
                    value={ean}
                    onChange={(e) => setEan(e.target.value.replace(/\D/g, ''))}
                    placeholder="Ex: 3017620422003"
                    className="flex-1 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-600 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    maxLength="13"
                  />
                  <button
                    type="button"
                    onClick={() => setShowScanner(true)}
                    className="px-4 py-3 bg-gradient-to-br from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-xl font-semibold transition-all shadow-md hover:shadow-lg"
                    title="Scanner un code-barres"
                  >
                    📷
                  </button>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1">
                  <span>ℹ️</span>
                  <span>Entrez le code à 8, 12 ou 13 chiffres</span>
                </p>
              </div>
              
              {/* Territory Selector */}
              <div>
                <label htmlFor="territory" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                  Territoire
                </label>
                <TerritorySelector 
                  value={territory}
                  onChange={setTerritory}
                />
              </div>
            </div>

            {/* Error Message */}
            {results.error && (
              <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">⚠️</span>
                  <p className="text-red-700 dark:text-red-400 text-sm font-medium">{results.error}</p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full md:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-slate-400 disabled:to-slate-500 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl disabled:shadow-none flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Recherche en cours...</span>
                </>
              ) : (
                <>
                  <span>🔍</span>
                  <span>Comparer les prix</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Results - Loading State */}
        {loading && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-blue-200 dark:border-blue-700 p-8">
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-3 text-blue-600 dark:text-blue-400">
                <svg className="animate-spin h-8 w-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-lg font-semibold">Recherche en cours...</span>
              </div>
            </div>
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex gap-4">
                  <div className="h-20 w-20 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
                  <div className="flex-1 space-y-3">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
                    <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {results.infoMessage && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 rounded-xl p-4 mb-6">
            <p className="text-amber-800 dark:text-amber-200 text-sm font-semibold">
              {results.infoMessage}
            </p>
            <p className="text-amber-700 dark:text-amber-300 text-xs mt-2">
              Transparence : nous n'affichons pas de prix simulés. Les tarifs seront visibles dès que les relevés publics seront connectés.
            </p>
            <div className="mt-3">
              <a
                href="/observatoire/methodologie"
                className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-semibold transition-colors"
              >
                Comprendre le périmètre
              </a>
            </div>
          </div>
        )}

        {/* Results - Display */}
        {!loading && results.stores.length > 0 && (
          <div className="space-y-6">
            {/* Results Header */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                    {results.stores.length} {results.stores.length > 1 ? 'magasins trouvés' : 'magasin trouvé'}
                  </h2>
                  {results.productLabel && (
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Pour le produit : <span className="font-semibold">{results.productLabel}</span>
                    </p>
                  )}
                </div>
                {bestPrice && (
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-500 dark:border-green-600 px-6 py-3 rounded-xl">
                    <div className="text-xs font-semibold text-green-700 dark:text-green-400 mb-1">
                      💰 Meilleur prix
                    </div>
                    <div className="text-2xl font-bold text-green-700 dark:text-green-400">
                      {bestPrice.toFixed(2)} €
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Results Grid - Style moderne avec cartes aérées */}
            <div className="grid gap-4">
              {results.stores.map((result) => {
                const isBestPrice = parseFloat(result.price) === bestPrice;
                const priceDiff = bestPrice ? ((parseFloat(result.price) - bestPrice) / bestPrice * 100).toFixed(1) : 0;
                
                return (
                  <div 
                    key={result.id}
                    className={`bg-white dark:bg-slate-900 rounded-2xl border-2 ${
                      isBestPrice 
                        ? 'border-green-500 shadow-green-200 dark:shadow-green-900/30' 
                        : 'border-slate-200 dark:border-slate-700'
                    } p-6 hover:shadow-xl transition-all duration-200 ${
                      isBestPrice ? 'shadow-lg' : 'shadow-md'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                      {/* Store Info */}
                      <div className="flex-1 flex items-start gap-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 rounded-xl flex items-center justify-center text-3xl flex-shrink-0 shadow-md">
                          🏪
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                            {result.store}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2 mb-3">
                            <span className="inline-flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400">
                              <span>📍</span>
                              <span>{result.location}</span>
                            </span>
                            <span className="text-slate-300 dark:text-slate-600">•</span>
                            <span className="text-xs text-slate-500 dark:text-slate-500">
                              Màj : {formatDate(result.lastUpdate)}
                            </span>
                          </div>
                          
                          {/* Badges */}
                          <div className="flex items-center gap-2 flex-wrap">
                            {result.promotion && (
                              <span className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold rounded-full shadow-md">
                                <span>🏷️</span>
                                <span>EN PROMO</span>
                              </span>
                            )}
                            {isBestPrice && (
                              <span className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs font-bold rounded-full shadow-md">
                                <span>⭐</span>
                                <span>MEILLEUR PRIX</span>
                              </span>
                            )}
                            {!isBestPrice && priceDiff > 0 && (
                              <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs font-semibold rounded-full border border-orange-300 dark:border-orange-700">
                                <span>+{priceDiff}%</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Price Display */}
                      <div className="text-right sm:text-center bg-slate-50 dark:bg-slate-800 rounded-xl px-6 py-4 min-w-[140px] shadow-inner">
                        <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                          Prix
                        </div>
                        <div className={`text-4xl font-bold ${
                          isBestPrice 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-slate-900 dark:text-white'
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

        {/* No Results */}
        {!loading && results.stores.length === 0 && currentSearch.mode === 'EAN' && currentSearch.key && (
          <div className="space-y-4">
            <EmptyState 
              title="Données en cours d'intégration"
              message={`Ce produit (code EAN ${currentSearch.key}) n'affiche pas encore de prix publics pour ce territoire. Les données seront publiées dès leur validation.`}
            />
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => {
                  setEan('');
                  resetDisplayedResults();
                }}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all"
              >
                Nouvelle recherche
              </button>
              <button
                onClick={() => setShowScanner(true)}
                className="px-6 py-3 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-xl font-semibold transition-all"
              >
                📷 Scanner un code-barres
              </button>
            </div>
          </div>
        )}

        {/* Info Section - Style institutionnel */}
        <div className="mt-8 space-y-4">
          {/* Transparency Notice */}
          <div className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/10 dark:to-amber-900/10 border-l-4 border-yellow-500 rounded-xl p-6 shadow-md">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                ⚠️
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-yellow-800 dark:text-yellow-400 mb-2">
                  Transparence sur les données
                </h3>
                <p className="text-sm text-yellow-900 dark:text-yellow-300 mb-2">
                  <strong>Phase de développement :</strong> Les prix affichés proviennent actuellement
                  d'un jeu de données de démonstration basé sur des relevés manuels ponctuels.
                </p>
                <p className="text-sm text-yellow-800 dark:text-yellow-400">
                  La collecte automatisée et citoyenne des prix sera activée progressivement.
                  Pour en savoir plus, consultez notre{' '}
                  <a href="/methodologie" className="font-semibold underline hover:text-yellow-600 dark:hover:text-yellow-300">
                    page méthodologie
                  </a>.
                </p>
              </div>
            </div>
          </div>
          
          {/* How it works */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 border-l-4 border-blue-500 rounded-xl p-6 shadow-md">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                ℹ️
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-blue-900 dark:text-blue-400 mb-3">
                  Comment ça marche ?
                </h3>
                <ul className="space-y-2">
                  <li className="flex items-start gap-3 text-sm text-blue-800 dark:text-blue-300">
                    <span className="text-blue-500 font-bold flex-shrink-0">1.</span>
                    <span>Scannez le code-barres de votre produit ou saisissez-le manuellement</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm text-blue-800 dark:text-blue-300">
                    <span className="text-blue-500 font-bold flex-shrink-0">2.</span>
                    <span>Sélectionnez votre territoire pour des résultats précis</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm text-blue-800 dark:text-blue-300">
                    <span className="text-blue-500 font-bold flex-shrink-0">3.</span>
                    <span>Comparez les prix entre différents magasins</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm text-blue-800 dark:text-blue-300">
                    <span className="text-blue-500 font-bold flex-shrink-0">4.</span>
                    <span>Les dates de mise à jour sont affichées pour chaque prix</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer - Style institutionnel */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 mt-12 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            © 2025 A KI PRI SA YÉ - Service public de transparence des prix
          </p>
          <p className="text-slate-500 dark:text-slate-500 text-xs mt-2">
            Tous droits réservés • <a href="/mentions-legales" className="hover:text-blue-600 dark:hover:text-blue-400">Mentions légales</a>
          </p>
        </div>
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
