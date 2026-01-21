/**
 * ComparaisonPage - Multi-territory price comparison page (Mission M-B)
 * Route: /comparateur/comparer
 */

import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Territory } from '../types/comparatorCommon';
import type { Product } from '../features/comparateur/types';
import { usePriceComparison } from '../features/comparateur/hooks/usePriceComparison';
import { TerritorySelector } from '../features/comparateur/components/TerritorySelector';
import { BestPriceHighlight } from '../features/comparateur/components/BestPriceHighlight';
import { ComparisonTable } from '../features/comparateur/components/ComparisonTable';
import { PriceChart } from '../features/comparateur/components/PriceChartComparison';
import { StatCard } from '../features/comparateur/components/StatCard';
import { SIGNIFICANT_PRICE_DIFF_THRESHOLD } from '../features/comparateur/constants';

// Default territories for comparison
const DEFAULT_TERRITORIES: Territory[] = ['GP', 'MQ', 'GF', 'RE'];
const ALL_TERRITORIES: Territory[] = ['GP', 'MQ', 'GF', 'RE', 'YT', 'MF', 'BL', 'PM', 'WF', 'PF', 'NC'];

export default function ComparaisonPage() {
  const [searchParams] = useSearchParams();
  const productId = searchParams.get('productId') || 'example-product-1';
  
  const [selectedTerritories, setSelectedTerritories] = useState<Territory[]>(DEFAULT_TERRITORIES);
  const [product, setProduct] = useState<Product | null>(null);
  
  const { comparisonData, stats, loading } = usePriceComparison(productId, selectedTerritories);

  // Load product information (mock data for now)
  useEffect(() => {
    // In production, this would fetch from an API or data file
    setProduct({
      id: productId,
      name: 'Lait UHT 1L',
      brand: 'Marque générique',
      category: 'Produits laitiers'
    });
  }, [productId]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <header className="space-y-3">
          <p className="text-xs uppercase tracking-[0.2em] text-blue-400">Comparateur</p>
          <h1 className="text-4xl sm:text-5xl font-bold text-white">
            Comparaison de prix multi-territoires
          </h1>
          <p className="text-lg text-slate-300 max-w-3xl">
            Comparez les prix du même produit à travers différents territoires ultramarins. 
            Identifiez les meilleures opportunités et analysez les écarts de prix.
          </p>
        </header>

        {/* Product Header */}
        {product && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">{product.name}</h2>
                <p className="text-slate-400">
                  {product.brand && `${product.brand} • `}
                  {product.category}
                </p>
              </div>
              <span className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold">
                ID: {product.id}
              </span>
            </div>
          </div>
        )}

        {/* Territory Selector */}
        <TerritorySelector
          territories={ALL_TERRITORIES}
          selected={selectedTerritories}
          onSelectionChange={setSelectedTerritories}
        />

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-slate-300">Chargement de la comparaison...</p>
            </div>
          </div>
        ) : comparisonData.length === 0 ? (
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-8 text-center">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-xl font-semibold text-white mb-2">Aucune donnée disponible</h3>
            <p className="text-slate-400">
              Aucun prix trouvé pour ce produit dans les territoires sélectionnés.
              Essayez de sélectionner d'autres territoires ou un autre produit.
            </p>
          </div>
        ) : (
          <>
            {/* Best Price Highlight */}
            <BestPriceHighlight territoryPrices={comparisonData} />
            
            {/* Comparison View */}
            <div className="space-y-8">
              <ComparisonTable 
                product={product!}
                territoryPrices={comparisonData}
              />
              
              <PriceChart 
                data={comparisonData}
                type="bar"
              />
            </div>

            {/* Statistics Section */}
            <section className="space-y-4">
              <h3 className="text-2xl font-bold text-white">Statistiques détaillées</h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard 
                  label="Prix minimum" 
                  value={`${stats.min.toFixed(2)}€`} 
                  icon="⬇️" 
                />
                <StatCard 
                  label="Prix maximum" 
                  value={`${stats.max.toFixed(2)}€`} 
                  icon="⬆️" 
                />
                <StatCard 
                  label="Prix moyen" 
                  value={`${stats.average.toFixed(2)}€`} 
                  icon="📊" 
                />
                <StatCard 
                  label="Écart" 
                  value={`${stats.range.toFixed(2)}€`} 
                  icon="📏" 
                />
              </div>
            </section>

            {/* Methodology Note */}
            <div className="bg-blue-900/20 border border-blue-800/50 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-blue-300 mb-2">ℹ️ Méthodologie</h4>
              <p className="text-sm text-slate-300">
                Les prix affichés sont basés sur les données les plus récentes disponibles pour chaque territoire.
                Les écarts significants (&gt;{SIGNIFICANT_PRICE_DIFF_THRESHOLD}%) sont mis en évidence. Les données proviennent de sources officielles
                et de contributions citoyennes vérifiées.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
