/**
 * Enhanced Price Comparator Page
 * 
 * Implements all requirements from the problem statement:
 * 1. Real, continuous, traceable price data
 * 2. Product normalization with canonical IDs
 * 3. Reliability scoring system
 * 4. Intelligent search with synonyms
 * 5. Clear user feedback at each step
 * 6. Results hierarchy with sorting
 * 7. Direct action links
 * 
 * Updated to support unified scan flow:
 * - Accepts URL parameters from scan flow
 * - Displays scanned product context (reference price, source, confidence)
 * - Shows reliability badge based on scan source
 */

import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Navigation, MapPin, Camera, Image as ImageIcon, Receipt } from 'lucide-react';
import EnhancedSearch from '../components/search/EnhancedSearch';
import EnhancedComparisonDisplay from '../components/comparison/EnhancedComparisonDisplay';
import TerritorySelector from '../components/TerritorySelector';
import { comparePrices } from '../services/enhancedPriceService';
import type { EnhancedPriceComparison } from '../types/enhancedPrice';
import { getUserPosition, calculateDistance, formatDistance, type GeoPosition } from '../utils/geoLocation';
import type { ScanSource } from '../types/scanFlow';

export default function EnhancedComparator() {
  const [searchParams] = useSearchParams()
  
  // Scan context from URL (if coming from unified flow)
  const scanEAN = searchParams.get('ean')
  const scanSource = searchParams.get('source') as ScanSource | null
  const scanConfidence = searchParams.get('confidence')
  const referencePrice = searchParams.get('referencePrice')
  const referenceStore = searchParams.get('referenceStore')
  
  const [territory, setTerritory] = useState('GP');
  const [selectedEAN, setSelectedEAN] = useState(scanEAN || '');
  const [selectedProductName, setSelectedProductName] = useState('');
  const [comparison, setComparison] = useState<EnhancedPriceComparison | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userPosition, setUserPosition] = useState<GeoPosition | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [sortByDistance, setSortByDistance] = useState(false);
  
  // Auto-load comparison if coming from scan flow
  useEffect(() => {
    if (scanEAN && !comparison && !loading) {
      handleSelectProduct(scanEAN, 'Produit scanné')
    }
  }, [scanEAN])
  
  const handleSelectProduct = async (ean: string, productName: string) => {
    setSelectedEAN(ean);
    setSelectedProductName(productName);
    setError(null);
    setLoading(true);
    
    try {
      const result = await comparePrices(ean, territory);
      
      if (result) {
        setComparison(result);
      } else {
        setError(`Aucune donnée de prix disponible pour ce produit dans le territoire ${territory}.`);
        setComparison(null);
      }
    } catch (err) {
      console.error('Error comparing prices:', err);
      setError('Une erreur est survenue lors de la comparaison des prix.');
      setComparison(null);
    } finally {
      setLoading(false);
    }
  };
  
  const handleTerritoryChange = async (newTerritory: string) => {
    setTerritory(newTerritory);
    
    // If a product is already selected, reload comparison for new territory
    if (selectedEAN) {
      setLoading(true);
      try {
        const result = await comparePrices(selectedEAN, newTerritory);
        
        if (result) {
          setComparison(result);
          setError(null);
        } else {
          setError(`Aucune donnée de prix disponible pour ce produit dans le territoire ${newTerritory}.`);
          setComparison(null);
        }
      } catch (err) {
        console.error('Error comparing prices:', err);
        setError('Une erreur est survenue lors de la comparaison des prix.');
        setComparison(null);
      } finally {
        setLoading(false);
      }
    }
  };
  
  const handleViewHistory = (ean: string) => {
    // Navigate to price history page
    window.location.href = `/historique?ean=${ean}&territory=${territory}`;
  };
  
  const handleCreateAlert = (ean: string) => {
    // Navigate to alert creation page
    window.location.href = `/alertes?ean=${ean}&territory=${territory}`;
  };
  
  const handleReportAnomaly = (ean: string, storeId: string) => {
    // Navigate to anomaly report page
    window.location.href = `/signalement?ean=${ean}&store=${encodeURIComponent(storeId)}&territory=${territory}`;
  };
  
  const handleCompareStores = () => {
    // Navigate to store comparison page
    window.location.href = `/comparaison-enseignes?territory=${territory}`;
  };

  const handleGetLocation = async () => {
    setGpsLoading(true);
    try {
      const position = await getUserPosition();
      if (position) {
        setUserPosition(position);
        setSortByDistance(true);
        
        // If comparison exists, update it with distances
        if (comparison) {
          const updatedComparison = { ...comparison };
          updatedComparison.pricesByStore = updatedComparison.pricesByStore.map((priceData) => {
            if (priceData.store.lat && priceData.store.lon) {
              const distance = calculateDistance(
                position.lat,
                position.lon,
                priceData.store.lat,
                priceData.store.lon
              );
              return { ...priceData, distance };
            }
            return priceData;
          });
          
          // Sort by distance
          updatedComparison.pricesByStore.sort((a, b) => {
            if (a.distance === undefined) return 1;
            if (b.distance === undefined) return -1;
            return a.distance - b.distance;
          });
          
          setComparison(updatedComparison);
        }
      } else {
        setError('Impossible d\'obtenir votre position. Veuillez autoriser la géolocalisation.');
      }
    } catch (err) {
      console.error('GPS error:', err);
      setError('Erreur lors de l\'accès à la géolocalisation');
    } finally {
      setGpsLoading(false);
    }
  };
  
  const handleToggleSort = () => {
    if (!comparison) return;
    
    const newSortByDistance = !sortByDistance;
    setSortByDistance(newSortByDistance);
    
    const updatedComparison = { ...comparison };
    
    if (newSortByDistance && userPosition) {
      // Sort by distance
      updatedComparison.pricesByStore.sort((a, b) => {
        if (a.distance === undefined) return 1;
        if (b.distance === undefined) return -1;
        return a.distance - b.distance;
      });
    } else {
      // Sort by price (default)
      updatedComparison.pricesByStore.sort((a, b) => a.price - b.price);
    }
    
    setComparison(updatedComparison);
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* Header */}
      <header className="bg-white shadow-md border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Comparateur de Prix Intelligent
              </h1>
              <p className="mt-2 text-gray-600">
                Données réelles, continues et traçables avec scoring de fiabilité
              </p>
            </div>
            <button
              onClick={() => window.location.href = '/'}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              ← Retour
            </button>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Territory Selector */}
        <div className="mb-6">
          <TerritorySelector
            value={territory}
            onChange={handleTerritoryChange}
          />
        </div>
        
        {/* GPS Button */}
        {comparison && (
          <div className="mb-6 flex gap-4">
            <button
              onClick={handleGetLocation}
              disabled={gpsLoading}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all
                ${userPosition && !gpsLoading
                  ? 'bg-green-500 text-white hover:bg-green-600'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
                }
                ${gpsLoading ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              {gpsLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Localisation...</span>
                </>
              ) : userPosition ? (
                <>
                  <MapPin className="w-5 h-5" />
                  <span>📍 Position activée</span>
                </>
              ) : (
                <>
                  <Navigation className="w-5 h-5" />
                  <span>Magasins près de moi</span>
                </>
              )}
            </button>
            
            {userPosition && (
              <button
                onClick={handleToggleSort}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all
                  ${sortByDistance
                    ? 'bg-purple-500 text-white hover:bg-purple-600'
                    : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                  }
                `}
              >
                {sortByDistance ? (
                  <>
                    <Navigation className="w-5 h-5" />
                    <span>Tri par distance</span>
                  </>
                ) : (
                  <>
                    <span className="text-lg">💰</span>
                    <span>Tri par prix</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}
        
        {/* Scan Context Display (if coming from unified flow) */}
        {scanSource && scanEAN && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-300 rounded-xl p-6 mb-8">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                {scanSource === 'ean' && <Camera className="w-12 h-12 text-blue-600" />}
                {scanSource === 'photo' && <ImageIcon className="w-12 h-12 text-purple-600" />}
                {scanSource === 'ticket' && <Receipt className="w-12 h-12 text-orange-600" />}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  📱 Produit scanné
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Source:</span>{' '}
                    <span className="font-medium text-gray-900">
                      {scanSource === 'ean' && 'Code-barres caméra'}
                      {scanSource === 'photo' && 'Photo produit (OCR)'}
                      {scanSource === 'ticket' && 'Ticket de caisse (OCR)'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">EAN:</span>{' '}
                    <span className="font-mono font-medium text-gray-900">{scanEAN}</span>
                  </div>
                  {scanConfidence && (
                    <div>
                      <span className="text-gray-600">Confiance:</span>{' '}
                      <span className={`font-semibold ${
                        parseInt(scanConfidence) >= 90 ? 'text-green-600' :
                        parseInt(scanConfidence) >= 70 ? 'text-yellow-600' :
                        'text-orange-600'
                      }`}>
                        {scanConfidence}%
                      </span>
                    </div>
                  )}
                  {referencePrice && (
                    <div>
                      <span className="text-gray-600">Prix scanné:</span>{' '}
                      <span className="font-semibold text-blue-600">
                        {parseFloat(referencePrice).toFixed(2)} €
                      </span>
                    </div>
                  )}
                  {referenceStore && (
                    <div className="col-span-2">
                      <span className="text-gray-600">Enseigne:</span>{' '}
                      <span className="font-medium text-gray-900">{referenceStore}</span>
                    </div>
                  )}
                </div>
                {referencePrice && (
                  <div className="mt-3 p-3 bg-blue-100 rounded-lg text-sm text-blue-900">
                    💡 <strong>Prix de référence détecté:</strong> Comparez ce prix avec ceux des autres enseignes ci-dessous
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Search Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            🔍 Rechercher un produit
          </h2>
          <EnhancedSearch
            territory={territory}
            onSelectProduct={handleSelectProduct}
            placeholder="Recherchez par nom, marque, synonyme ou code EAN..."
          />
          
          {/* Info message */}
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <span className="text-2xl">ℹ️</span>
              <div className="flex-1 text-sm">
                <p className="font-medium text-blue-900 mb-1">
                  Recherche intelligente activée
                </p>
                <ul className="text-blue-800 space-y-1 list-disc list-inside">
                  <li>Recherche par synonymes (ex: "lait" trouvera "lait UHT")</li>
                  <li>Tolérance aux fautes de frappe</li>
                  <li>Recherche par catégorie implicite</li>
                  <li>Correspondance par code EAN</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        
        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-lg text-gray-600">Recherche des meilleurs prix en cours...</p>
            <p className="text-sm text-gray-500 mt-2">
              Analyse des prix en temps réel pour {territory}
            </p>
          </div>
        )}
        
        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <span className="text-3xl">⚠️</span>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-red-900 mb-2">
                  Données non disponibles
                </h3>
                <p className="text-red-800 mb-4">{error}</p>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-red-900">
                    Que pouvez-vous faire ?
                  </p>
                  <ul className="text-sm text-red-800 space-y-1 list-disc list-inside">
                    <li>Essayer un autre produit</li>
                    <li>Changer de territoire</li>
                    <li>
                      <a
                        href="/contribuer"
                        className="text-blue-600 hover:text-blue-700 underline font-medium"
                      >
                        Contribuer en ajoutant ce prix
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Comparison Results */}
        {comparison && !loading && (
          <EnhancedComparisonDisplay
            comparison={comparison}
            onCompareStores={handleCompareStores}
            onViewHistory={handleViewHistory}
            onCreateAlert={handleCreateAlert}
            onReportAnomaly={handleReportAnomaly}
          />
        )}
        
        {/* Welcome State (no search performed yet) */}
        {!comparison && !loading && !error && !selectedEAN && (
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-8 border-2 border-blue-200">
            <div className="text-center max-w-2xl mx-auto">
              <div className="text-6xl mb-4">🎯</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Bienvenue sur le Comparateur Intelligent
              </h2>
              <p className="text-gray-700 mb-6">
                Trouvez les meilleurs prix avec des données réelles, vérifiées et traçables.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                <div className="bg-white p-4 rounded-lg shadow">
                  <div className="text-2xl mb-2">✓</div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Données réelles et continues
                  </h3>
                  <p className="text-sm text-gray-600">
                    Prix mis à jour régulièrement depuis des sources vérifiées
                  </p>
                </div>
                
                <div className="bg-white p-4 rounded-lg shadow">
                  <div className="text-2xl mb-2">🏆</div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Score de fiabilité
                  </h3>
                  <p className="text-sm text-gray-600">
                    Chaque prix est noté selon sa source et son nombre de confirmations
                  </p>
                </div>
                
                <div className="bg-white p-4 rounded-lg shadow">
                  <div className="text-2xl mb-2">🔍</div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Recherche intelligente
                  </h3>
                  <p className="text-sm text-gray-600">
                    Synonymes, tolérance aux fautes, recherche par catégorie
                  </p>
                </div>
                
                <div className="bg-white p-4 rounded-lg shadow">
                  <div className="text-2xl mb-2">📊</div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Actions directes
                  </h3>
                  <p className="text-sm text-gray-600">
                    Voir l'historique, créer des alertes, signaler des anomalies
                  </p>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-blue-300">
                <p className="text-sm text-gray-600 italic">
                  💡 Commencez par rechercher un produit dans la barre de recherche ci-dessus
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
      
      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-600">
            <p className="mb-2">
              <strong>A KI PRI SA YÉ</strong> - Comparateur de prix transparent et citoyen
            </p>
            <p>
              Données sourcées • Fiabilité vérifiée • Mises à jour continues
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
