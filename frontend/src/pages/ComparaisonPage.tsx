/**
 * ComparaisonPage - Multi-territory price comparison page
 * Route: /comparateur
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

/* ---------------------------------- */
/* Configuration                      */
/* ---------------------------------- */

const DEFAULT_TERRITORIES: Territory[] = ['GP', 'MQ', 'GF', 'RE'];

const ALL_TERRITORIES: Territory[] = [
  'GP', 'MQ', 'GF', 'RE',
  'YT', 'MF', 'BL', 'PM',
  'WF', 'PF', 'NC',
];

/* ---------------------------------- */
/* Component                           */
/* ---------------------------------- */

export default function ComparaisonPage() {
  const [searchParams] = useSearchParams();
  const productId = searchParams.get('productId') ?? 'demo-product';

  const [selectedTerritories, setSelectedTerritories] =
    useState<Territory[]>(DEFAULT_TERRITORIES);

  const [product, setProduct] = useState<Product | null>(null);

  const {
    comparisonData = [],
    stats,
    loading,
  } = usePriceComparison(productId, selectedTerritories);

  /* ---------------------------------- */
  /* Mock product (safe fallback)       */
  /* ---------------------------------- */

  useEffect(() => {
    setProduct({
      id: productId,
      name: 'Produit de démonstration',
      brand: 'Sources multiples',
      category: 'Consommation courante',
    });
  }, [productId]);

  /* ---------------------------------- */
  /* Global safety guard                */
  /* ---------------------------------- */

  const isStatsValid =
    stats !== null &&
    Number.isFinite(stats.min) &&
    Number.isFinite(stats.max) &&
    Number.isFinite(stats.average) &&
    Number.isFinite(stats.range);

  const isDataValid =
    Array.isArray(comparisonData) &&
    comparisonData.length > 0 &&
    product !== null &&
    isStatsValid;

  if (!loading && !isDataValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-200">
        <div className="max-w-md text-center space-y-4">
          <h2 className="text-xl font-semibold">
            Comparateur temporairement indisponible
          </h2>
          <p className="text-slate-400 text-sm">
            Les données nécessaires à la comparaison ne sont pas encore disponibles
            pour ce produit ou ces territoires.
          </p>
          <a
            href="/"
            className="inline-block px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm"
          >
            Retour à l’accueil
          </a>
        </div>
      </div>
    );
  }

  /* ---------------------------------- */
  /* Render                             */
  /* ---------------------------------- */

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8 space-y-8">

        {/* Header */}
        <header className="space-y-3">
          <p className="text-xs uppercase tracking-[0.2em] text-blue-400">
            Comparateur
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold text-white">
            Comparaison de prix multi-territoires
          </h1>
          <p className="text-lg text-slate-300 max-w-3xl">
            Analysez les écarts de prix d’un même produit
            entre les territoires ultramarins français,
            à partir de données publiques et citoyennes.
          </p>
        </header>

        {/* Product */}
        {product && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">
                  {product.name}
                </h2>
                <p className="text-slate-400 text-sm">
                  {product.brand} • {product.category}
                </p>
              </div>
              <span className="px-3 py-1 bg-blue-600/90 rounded-md text-xs font-semibold">
                {product.id}
              </span>
            </div>
          </div>
        )}

        {/* Territories */}
        <TerritorySelector
          territories={ALL_TERRITORIES}
          selected={selectedTerritories}
          onSelectionChange={setSelectedTerritories}
        />

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-20">
            <div className="text-center space-y-3">
              <div className="h-10 w-10 mx-auto animate-spin rounded-full border-b-2 border-blue-500" />
              <p className="text-slate-300">
                Chargement des comparaisons…
              </p>
            </div>
          </div>
        )}

        {/* Data */}
        {!loading && isDataValid && (
          <>
            <BestPriceHighlight territoryPrices={comparisonData} />

            <ComparisonTable
              product={product}
              territoryPrices={comparisonData}
            />

            <PriceChart
              data={comparisonData}
              type="bar"
            />

            {/* Stats */}
            <section className="space-y-4">
              <h3 className="text-2xl font-bold text-white">
                Statistiques
              </h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Min" value={`${stats.min.toFixed(2)} €`} icon="⬇️" />
                <StatCard label="Max" value={`${stats.max.toFixed(2)} €`} icon="⬆️" />
                <StatCard label="Moyenne" value={`${stats.average.toFixed(2)} €`} icon="📊" />
                <StatCard label="Écart" value={`${stats.range.toFixed(2)} €`} icon="📏" />
              </div>
            </section>

            {/* Methodology */}
            <div className="bg-blue-900/20 border border-blue-800/40 rounded-xl p-4 text-sm text-slate-300">
              <strong className="text-blue-300">Méthodologie :</strong><br />
              Les prix sont issus des données les plus récentes disponibles.
              Les écarts supérieurs à {SIGNIFICANT_PRICE_DIFF_THRESHOLD}% sont signalés.
              Données publiques et contributions citoyennes vérifiées.
            </div>
          </>
        )}

      </div>
    </div>
  );
}