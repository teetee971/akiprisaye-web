/**
 * Inflation Dashboard Overview Component
 * Key metrics and visualization for local inflation
 */

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, Info, HelpCircle, MapPin } from 'lucide-react';
import { inflationService } from '../services/inflationService';
import type { InflationMetrics } from '../types/inflation';

export function InflationDashboard() {
  const [metrics, setMetrics] = useState<InflationMetrics | null>(null);
  const [timeframe, setTimeframe] = useState<'1m' | '3m' | '6m' | '1y'>('3m');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showExplainer, setShowExplainer] = useState(false);

  useEffect(() => {
    loadMetrics();
  }, [timeframe]);

  const loadMetrics = async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await inflationService.calculateInflation(timeframe);
      setMetrics(data);
    } catch (err) {
      console.error('Failed to load inflation metrics:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  // Loading state with skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8">
        <div className="container mx-auto px-4">
          {/* Header skeleton */}
          <div className="mb-8 animate-pulse">
            <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded w-2/3 mb-3"></div>
            <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
          </div>
          
          {/* Cards skeleton */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg animate-pulse">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-3"></div>
                <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !metrics) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center py-16">
            <AlertTriangle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              Données temporairement indisponibles
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Nous ne pouvons pas afficher les données d'inflation pour le moment. 
              Veuillez réessayer dans quelques instants.
            </p>
            <button
              onClick={loadMetrics}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              Réessayer
            </button>
          </div>
        </div>
      </div>
    );
  }

  const avgInflation = metrics.territories.reduce((sum, t) => sum + t.overallInflationRate, 0) / metrics.territories.length;
  const avgMetropoleGap = metrics.territories.reduce((sum, t) => sum + (t.comparedToMetropole || 0), 0) / metrics.territories.length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8">
      <div className="container mx-auto px-4">
        {/* NIVEAU 1: En-tête pédagogique */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                Inflation locale – impact réel sur le pouvoir d'achat
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mb-3">
                Comparaison des prix observés dans le territoire sélectionné par rapport à la référence métropole
              </p>
            </div>
            <button
              onClick={() => setShowExplainer(!showExplainer)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors text-sm font-medium"
              title="En savoir plus sur ces indicateurs"
            >
              <HelpCircle className="w-4 h-4" />
              Pourquoi ce chiffre ?
            </button>
          </div>

          {/* Badge territoire actif */}
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full font-medium">
              Tous les territoires d'Outre-mer
            </span>
          </div>

          {/* Encart explicatif inline (conditionnel) */}
          {showExplainer && (
            <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
                <Info className="w-5 h-5" />
                Comprendre les indicateurs d'inflation
              </h3>
              <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                <p>
                  <strong>Inflation globale :</strong> Représente l'évolution moyenne des prix observés sur la période sélectionnée. 
                  Un taux de 3% signifie que les prix ont augmenté de 3% en moyenne.
                </p>
                <p>
                  <strong>Écart métropole :</strong> Indique la différence de prix entre les territoires d'Outre-mer et la métropole 
                  pour un panier de produits identiques.
                </p>
                <p>
                  <strong>Alertes actives :</strong> Nombre de territoires où l'inflation dépasse 5%, seuil considéré comme élevé 
                  nécessitant une vigilance particulière.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Timeframe Selector */}
        <div className="mb-6 flex gap-2">
          {(['1m', '3m', '6m', '1y'] as const).map(tf => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`
                px-4 py-2 rounded-lg font-semibold transition-colors
                ${timeframe === tf 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }
              `}
            >
              {tf === '1m' && '1 mois'}
              {tf === '3m' && '3 mois'}
              {tf === '6m' && '6 mois'}
              {tf === '1y' && '1 an'}
            </button>
          ))}
        </div>

        {/* NIVEAU 1: Indicateurs clés (mise en avant visuelle) */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Inflation globale */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border-2 border-blue-500/20 hover:border-blue-500/40 transition-colors group">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                Inflation Globale
              </div>
              <div className="relative group/tooltip">
                {avgInflation > 3 ? (
                  <TrendingUp className="w-5 h-5 text-red-500" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-green-500" />
                )}
                <div className="absolute right-0 top-8 hidden group-hover/tooltip:block w-64 bg-slate-900 dark:bg-slate-700 text-white text-xs rounded-lg p-3 shadow-xl z-10">
                  Ce pourcentage représente l'évolution moyenne des prix observés sur la période sélectionnée
                </div>
              </div>
            </div>
            <div className={`text-4xl font-bold mb-1 ${
              avgInflation > 5 ? 'text-red-600 dark:text-red-400' :
              avgInflation > 3 ? 'text-orange-600 dark:text-orange-400' :
              'text-green-600 dark:text-green-400'
            }`}>
              {avgInflation > 0 ? '+' : ''}{avgInflation.toFixed(1)}%
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Tous territoires confondus
            </div>
          </div>

          {/* Variation mensuelle */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border-2 border-orange-500/20 hover:border-orange-500/40 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                Écart Métropole
              </div>
              <div className="relative group/tooltip">
                <Info className="w-5 h-5 text-blue-500" />
                <div className="absolute right-0 top-8 hidden group-hover/tooltip:block w-64 bg-slate-900 dark:bg-slate-700 text-white text-xs rounded-lg p-3 shadow-xl z-10">
                  Différence de prix moyenne entre les DOM et la métropole pour des produits identiques
                </div>
              </div>
            </div>
            <div className="text-4xl font-bold text-orange-600 dark:text-orange-400 mb-1">
              +{avgMetropoleGap.toFixed(1)}%
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Prix moyens comparés
            </div>
          </div>

          {/* Variation annuelle */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border-2 border-red-500/20 hover:border-red-500/40 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                Alertes Actives
              </div>
              <div className="relative group/tooltip">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                <div className="absolute right-0 top-8 hidden group-hover/tooltip:block w-64 bg-slate-900 dark:bg-slate-700 text-white text-xs rounded-lg p-3 shadow-xl z-10">
                  Nombre de territoires où l'inflation dépasse 5%, seuil nécessitant une vigilance accrue
                </div>
              </div>
            </div>
            <div className="text-4xl font-bold text-red-600 dark:text-red-400 mb-1">
              {metrics.territories.filter(t => t.overallInflationRate > 5).length}
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Territoires à haute inflation (&gt;5%)
            </div>
          </div>
        </div>

        {/* NIVEAU 2: Comparaison DOM vs Métropole et Catégories */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Comparaison par Territoire
            </h2>
            <span className="text-sm text-slate-500 dark:text-slate-400">
              Période: {timeframe === '1m' && '1 mois'}{timeframe === '3m' && '3 mois'}{timeframe === '6m' && '6 mois'}{timeframe === '1y' && '1 an'}
            </span>
          </div>
          <div className="space-y-4">
            {metrics.territories.map(territory => (
              <div key={territory.territory} className="border-b border-slate-200 dark:border-slate-700 last:border-0 pb-4 last:pb-0">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    {territory.territoryName}
                  </h3>
                  <div className="flex items-center gap-3">
                    <div className={`
                      px-3 py-1 rounded-full text-sm font-semibold
                      ${territory.overallInflationRate > 5 ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200' :
                        territory.overallInflationRate > 3 ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200' :
                        'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                      }
                    `}>
                      {territory.overallInflationRate.toFixed(1)}%
                    </div>
                    {territory.comparedToMetropole && (
                      <div className="text-sm text-slate-600 dark:text-slate-400">
                        +{territory.comparedToMetropole.toFixed(1)}% vs Métropole
                      </div>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      territory.overallInflationRate > 5 ? 'bg-red-500' :
                      territory.overallInflationRate > 3 ? 'bg-orange-500' :
                      'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(territory.overallInflationRate * 10, 100)}%` }}
                  />
                </div>

                {/* Top Categories */}
                <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2">
                  {territory.categories.slice(0, 4).map(cat => (
                    <div key={cat.category} className="text-xs">
                      <span className="text-slate-600 dark:text-slate-400">{cat.category}:</span>
                      <span className={`ml-1 font-semibold ${
                        cat.inflationRate > 5 ? 'text-red-600 dark:text-red-400' :
                        cat.inflationRate > 3 ? 'text-orange-600 dark:text-orange-400' :
                        'text-green-600 dark:text-green-400'
                      }`}>
                        {cat.inflationRate > 0 ? '+' : ''}{cat.inflationRate.toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA utile en bas de page */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 rounded-xl p-6 mb-8 text-white">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold mb-1">
                Voir les produits qui influencent le plus l'inflation
              </h3>
              <p className="text-blue-100 text-sm">
                Identifiez quels produits contribuent le plus à la hausse des prix dans votre territoire
              </p>
            </div>
            <a
              href="/historique-prix"
              className="px-6 py-3 bg-white text-blue-700 rounded-lg hover:bg-blue-50 transition-colors font-semibold whitespace-nowrap shadow-lg"
            >
              Consulter l'historique
            </a>
          </div>
        </div>

        {/* NIVEAU 3: Info contextuelle */}
        <div className="bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <Info className="w-6 h-6 text-slate-600 dark:text-slate-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                À propos de ces données
              </h3>
              <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
                Les taux d'inflation sont calculés à partir des observations de prix collectées 
                par les citoyens et les sources officielles. Les données sont mises à jour quotidiennement 
                et reflètent les variations réelles constatées sur le terrain.
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                <strong>Méthodologie :</strong> Les prix sont comparés sur une base identique (même produit, même conditionnement) 
                entre périodes et entre territoires pour garantir la fiabilité des indicateurs.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
