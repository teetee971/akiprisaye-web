/**
 * Basket Comparison Page
 * 
 * Compares user's basket across multiple stores to find the best prices.
 * Enhanced with detailed comparison table, savings summary, filters, and optimized basket
 * PROMPT 4: Comparaison automatique du panier entre magasins
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Share2, Download, Eye } from 'lucide-react';
import { useTiPanier } from '../hooks/useTiPanier';
import { 
  compareBasketAcrossStores, 
  getBasketComparisonStats,
  getDataFreshnessLabel,
  type BasketStoreComparison 
} from '../services/basketComparisonService';
import { requestGeolocation } from '../utils/geolocationEnhanced';
import { BasketComparisonTable } from '../components/comparison/basket-comparison-table';
import { SavingsSummary } from '../components/comparison/savings-summary';
import { StoreSelector, type StoreFilterOptions } from '../components/comparison/store-selector';
import { OptimizedBasketSuggestion } from '../components/comparison/optimized-basket-suggestion';

export default function BasketComparisonPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { items: basketItems, count } = useTiPanier('comparison');
  const [allComparisons, setAllComparisons] = useState<BasketStoreComparison[]>([]);
  const [loading, setLoading] = useState(true);
  const [userPosition, setUserPosition] = useState<{ lat: number; lon: number } | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'table'>('table');
  const highlightStoreId = searchParams.get('storeId');

  // Get all unique territories from comparisons
  const availableTerritories = useMemo(() => {
    const territories = new Set(allComparisons.map(c => c.territory));
    return Array.from(territories).sort();
  }, [allComparisons]);

  // Filter state
  const [filters, setFilters] = useState<StoreFilterOptions>({
    territories: [],
    maxDistance: undefined,
    includePromos: true
  });

  // Initialize filters with all territories once available
  useEffect(() => {
    if (availableTerritories.length > 0 && filters.territories.length === 0) {
      setFilters(prev => ({ ...prev, territories: availableTerritories }));
    }
  }, [availableTerritories]);

  // Apply filters to get filtered comparisons
  const comparisons = useMemo(() => {
    let filtered = allComparisons;

    // Filter by territories
    if (filters.territories.length > 0) {
      filtered = filtered.filter(c => filters.territories.includes(c.territory));
    }

    // Filter by distance
    if (filters.maxDistance !== undefined && userPosition) {
      filtered = filtered.filter(c => 
        c.distance !== undefined && c.distance <= filters.maxDistance!
      );
    }

    return filtered;
  }, [allComparisons, filters, userPosition]);

  useEffect(() => {
    async function loadComparisons() {
      setLoading(true);

      // Try to get user location
      const geoResult = await requestGeolocation();
      let position: { lat: number; lon: number } | undefined;
      
      if (geoResult.success && geoResult.position) {
        position = {
          lat: geoResult.position.latitude,
          lon: geoResult.position.longitude,
        };
        setUserPosition(position);
      }

      // Compare basket across stores
      const results = compareBasketAcrossStores(basketItems, position);
      setAllComparisons(results);
      setLoading(false);
    }

    loadComparisons();
  }, [basketItems]);

  if (count === 0) {
    return (
      <div className="min-h-screen bg-slate-950 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-slate-900 rounded-xl p-8 text-center border border-slate-800">
            <div className="text-6xl mb-4">🛒</div>
            <h2 className="text-2xl font-bold text-white mb-3">Panier vide</h2>
            <p className="text-gray-300 mb-6">
              Ajoutez des produits à votre panier pour comparer les prix entre magasins.
            </p>
            <button
              onClick={() => navigate('/carte')}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Explorer les magasins
            </button>
          </div>
        </div>
      </div>
    );
  }

  const stats = getBasketComparisonStats(comparisons);

  // Export to CSV
  const exportToCSV = () => {
    if (comparisons.length === 0) return;

    // Gather all unique products
    const allProducts = new Map<string, string>();
    comparisons.forEach(comp => {
      comp.items.forEach(item => {
        if (!allProducts.has(item.id)) {
          allProducts.set(item.id, item.name);
        }
      });
    });

    // Build CSV
    let csv = 'Produit,' + comparisons.map(c => c.storeName).join(',') + '\n';
    
    allProducts.forEach((name, id) => {
      let row = `"${name}"`;
      comparisons.forEach(comp => {
        const item = comp.items.find(i => i.id === id);
        row += ',' + (item?.price ? item.price.toFixed(2) : 'N/A');
      });
      csv += row + '\n';
    });

    // Add totals row
    csv += 'TOTAL,' + comparisons.map(c => c.totalPrice.toFixed(2)).join(',') + '\n';

    // Download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `comparaison-panier-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // Share functionality
  const shareComparison = async () => {
    const url = window.location.href;
    const text = stats.cheapestStore 
      ? `J'ai comparé mon panier sur Akiprisayé ! Meilleur prix: ${stats.cheapestStore.storeName} à ${stats.cheapestStore.totalPrice.toFixed(2)}€. Économie possible: ${stats.priceDifference.toFixed(2)}€ 💰`
      : 'J\'ai comparé mon panier sur Akiprisayé !';

    if (navigator.share) {
      try {
        await navigator.share({ title: 'Comparaison Panier - Akiprisayé', text, url });
      } catch (err) {
        // User cancelled or error - fallback to clipboard
        await navigator.clipboard.writeText(`${text}\n${url}`);
        alert('Lien copié dans le presse-papiers !');
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(`${text}\n${url}`);
      alert('Lien copié dans le presse-papiers !');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* PROMPT 8: Citizen Message */}
        <div className="bg-blue-900/20 border border-blue-700/50 rounded-xl p-5 mb-6">
          <div className="flex items-start gap-4">
            <span className="text-3xl">🏛️</span>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-blue-200 mb-2">
                Cet outil est gratuit pour les citoyens
              </h2>
              <p className="text-blue-100 text-sm">
                Il vise à mieux comprendre les prix, pas à inciter à l'achat.
              </p>
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="text-blue-400 hover:text-blue-300 flex items-center gap-2 mb-4 transition-colors"
          >
            ← Retour
          </button>
          
          <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-2xl font-bold text-white mb-2">
                  🛒 Comparer mon panier
                </h1>
                <p className="text-gray-400">
                  {count} article{count > 1 ? 's' : ''} • {comparisons.length} magasin{comparisons.length > 1 ? 's' : ''} trouvé{comparisons.length > 1 ? 's' : ''}
                </p>
              </div>
              
              {stats.cheapestStore && stats.priceDifference > 0 && (
                <div className="bg-green-900/20 border border-green-700 rounded-lg p-4">
                  <div className="text-sm text-green-300 mb-1">Économie possible</div>
                  <div className="text-2xl font-bold text-green-400">
                    {stats.priceDifference.toFixed(2)} €
                  </div>
                  <div className="text-xs text-green-300 mt-1">
                    soit {stats.percentageSavings}% d'économie
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-slate-900 rounded-xl p-12 text-center border border-slate-800">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-white">Comparaison en cours...</p>
          </div>
        )}

        {/* Main Content */}
        {!loading && comparisons.length > 0 && (
          <div className="space-y-6">
            {/* Action Bar */}
            <div className="bg-slate-900 rounded-lg p-4 border border-slate-800">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setViewMode('table')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      viewMode === 'table'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-800 text-gray-300 hover:bg-slate-700'
                    }`}
                  >
                    <Eye className="inline mr-1" size={16} />
                    Vue Tableau
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      viewMode === 'list'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-800 text-gray-300 hover:bg-slate-700'
                    }`}
                  >
                    <Eye className="inline mr-1" size={16} />
                    Vue Liste
                  </button>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={shareComparison}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                  >
                    <Share2 size={16} />
                    Partager
                  </button>
                  <button
                    onClick={exportToCSV}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                  >
                    <Download size={16} />
                    CSV
                  </button>
                </div>
              </div>
            </div>

            {/* Savings Summary */}
            <SavingsSummary
              cheapestStore={stats.cheapestStore}
              mostExpensiveStore={stats.mostExpensiveStore}
              priceDifference={stats.priceDifference}
              percentageSavings={stats.percentageSavings}
            />

            {/* Optimized Basket Suggestion */}
            <OptimizedBasketSuggestion comparisons={comparisons} />

            {/* Store Filters */}
            <StoreSelector
              availableTerritories={availableTerritories}
              filters={filters}
              onFiltersChange={setFilters}
              hasUserLocation={userPosition !== null}
            />

            {/* Comparison Table or List View */}
            {viewMode === 'table' ? (
              <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
                <h2 className="text-xl font-semibold text-white mb-4">
                  📊 Comparaison détaillée
                </h2>
                <BasketComparisonTable comparisons={comparisons} />
              </div>
            ) : (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-white">
                  📋 Liste des magasins
                </h2>
                {comparisons.map((comparison, index) => {
                  const freshnessInfo = getDataFreshnessLabel(comparison.dataFreshness);
                  const isHighlighted = comparison.storeId === highlightStoreId;
                  const isCheapest = index === 0;

                  return (
                    <div
                      key={comparison.storeId}
                      className={`bg-slate-900 rounded-xl p-6 border transition-all ${
                        isHighlighted 
                          ? 'border-blue-500 ring-2 ring-blue-500/50' 
                          : isCheapest
                          ? 'border-green-700'
                          : 'border-slate-800'
                      }`}
                    >
                      {/* Store Header */}
                      <div className="flex items-start justify-between flex-wrap gap-4 mb-4">
                        <div className="flex-1 min-w-[200px]">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-2xl">#{index + 1}</span>
                            <h3 className="text-xl font-bold text-white">
                              {comparison.storeName}
                            </h3>
                            {isCheapest && (
                              <span className="px-2 py-1 bg-green-900/30 text-green-300 text-xs rounded border border-green-700">
                                🏆 Meilleur prix
                              </span>
                            )}
                          </div>
                          
                          <div className="space-y-1 text-sm text-gray-400">
                            <div className="flex items-center gap-2">
                              <span>🏢</span>
                              <span>{comparison.chain}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span>📍</span>
                              <span>{comparison.address}, {comparison.city} ({comparison.territory})</span>
                            </div>
                            {comparison.distance !== undefined && (
                              <div className="flex items-center gap-2">
                                <span>📏</span>
                                <span>
                                  {comparison.distance < 1 
                                    ? `${Math.round(comparison.distance * 1000)} m` 
                                    : `${comparison.distance.toFixed(1)} km`}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Price Display */}
                        <div className="text-right">
                          <div className="text-3xl font-bold text-white mb-1">
                            {comparison.totalPrice.toFixed(2)} €
                          </div>
                          <div className="text-sm text-gray-400 mb-2">
                            {comparison.availableItems}/{comparison.totalItems} articles
                          </div>
                          <div className={`text-xs ${freshnessInfo.color}`}>
                            {freshnessInfo.label}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-800">
                        <Link
                          to={`/enseigne/${comparison.storeId}`}
                          className="flex-1 min-w-[150px] px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-center transition-colors"
                        >
                          Voir la fiche
                        </Link>
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${comparison.coordinates.lat},${comparison.coordinates.lon}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 min-w-[150px] px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-center transition-colors"
                        >
                          🧭 Y aller
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* No Results */}
        {!loading && comparisons.length === 0 && (
          <div className="bg-slate-900 rounded-xl p-8 text-center border border-slate-800">
            <div className="text-5xl mb-4">🔍</div>
            <h2 className="text-xl font-semibold text-white mb-2">
              Aucun magasin trouvé
            </h2>
            <p className="text-gray-400 mb-6">
              Les produits de votre panier ne sont pas disponibles dans notre base de données.
            </p>
          </div>
        )}

        {/* PROMPT 4: Pedagogical Message */}
        <div className="mt-6 bg-amber-900/20 border border-amber-700/50 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="text-amber-200 text-sm font-medium mb-1">
                Les prix peuvent varier
              </p>
              <p className="text-amber-100/80 text-xs">
                Les prix affichés sont basés sur des observations déclarées et peuvent varier 
                selon la date et la disponibilité réelle en magasin. Cette comparaison est 
                indicative et ne constitue pas un engagement de prix.
              </p>
            </div>
          </div>
        </div>

        {/* PROMPT 3: Local Privacy Message */}
        <div className="mt-6 bg-slate-900 border border-slate-700 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🔒</span>
            <div>
              <p className="text-slate-200 text-sm font-medium mb-1">
                Panier personnel – non partagé
              </p>
              <p className="text-slate-300 text-xs">
                Votre panier est stocké localement sur votre appareil. 
                Aucune donnée n'est envoyée à nos serveurs. Vos données restent privées.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
