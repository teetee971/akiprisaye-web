/**
 * ⑭ COMPOSANT - Résumé des hausses du jour
 * Affiche les hausses récentes les plus impactantes
 */

import { GlassCard } from "../ui/glass-card";
import { useDailyPriceShock, type PriceShock } from "../../hooks/useDailyPriceShock";

interface DailyShockCardProps {
  territory?: string;
  className?: string;
}

export function DailyShockCard({ territory = 'GP', className = '' }: DailyShockCardProps) {
  const { data, loading, error } = useDailyPriceShock(territory);

  if (loading) {
    return (
      <GlassCard className={`bg-red-900/10 border-red-500/30 ${className}`}>
        <div className="text-center py-8">
          <div className="animate-spin text-4xl mb-2">⏳</div>
          <p className="text-gray-400">Analyse des hausses en cours...</p>
        </div>
      </GlassCard>
    );
  }

  if (error) {
    return (
      <GlassCard className={`bg-slate-800/30 border-slate-700 ${className}`}>
        <div className="text-center py-6">
          <div className="text-3xl mb-2">⚠️</div>
          <p className="text-gray-400 text-sm">Données insuffisantes pour analyser les hausses</p>
        </div>
      </GlassCard>
    );
  }

  if (!data || data.shocks.length === 0) {
    return (
      <GlassCard className={`bg-green-900/10 border-green-500/30 ${className}`}>
        <div className="text-center py-6">
          <div className="text-4xl mb-2">✅</div>
          <h3 className="text-lg font-bold text-green-300 mb-1">Aucune hausse significative</h3>
          <p className="text-sm text-gray-400">Les prix sont stables cette semaine</p>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className={`bg-red-900/10 border-red-500/30 ${className}`}>
      <div className="space-y-4">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-3xl">🔥</span>
            <h3 className="text-xl font-bold text-red-300">
              Hausses de la semaine
            </h3>
          </div>
          <p className="text-sm text-gray-400">
            Ce qui a vraiment augmenté ces 7 derniers jours
          </p>
        </div>

        {/* Liste des hausses */}
        <div className="space-y-3">
          {data.shocks.map((shock, index) => (
            <ShockItem key={`${shock.productName}-${shock.territory}`} shock={shock} rank={index + 1} />
          ))}
        </div>

        {/* Footer info */}
        <div className="pt-3 border-t border-red-500/20">
          <p className="text-xs text-gray-500 text-center">
            Analyse basée sur les observations des 7 derniers jours • {data.territoryAnalyzed}
          </p>
        </div>
      </div>
    </GlassCard>
  );
}

/**
 * Item individuel de hausse
 */
function ShockItem({ shock, rank }: { shock: PriceShock; rank: number }) {
  const getRankEmoji = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `${rank}️⃣`;
  };

  return (
    <div className="p-4 bg-slate-800/50 rounded-lg hover:bg-slate-800/70 transition-all">
      <div className="flex items-start gap-3">
        {/* Rank */}
        <div className="flex-shrink-0 text-2xl">
          {getRankEmoji(rank)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className="font-semibold text-white truncate">
              {shock.productName}
            </h4>
            {shock.isConfirmed && (
              <span 
                className="flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 bg-blue-900/30 border border-blue-500/40 rounded text-xs text-blue-300"
                title="Fiabilité >= 80% (3+ observations, 2+ magasins)"
              >
                <span>✓</span>
                <span className="hidden sm:inline">Confirmé</span>
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            {/* Hausse en € */}
            <span className="font-bold text-red-400">
              +{shock.priceIncrease.toFixed(2)} €
            </span>

            {/* Hausse en % */}
            <span className="font-semibold text-red-300">
              +{shock.percentageIncrease.toFixed(1)} %
            </span>

            {/* Prix */}
            <span className="text-gray-400 text-xs">
              {shock.previousPrice.toFixed(2)} € → {shock.currentPrice.toFixed(2)} €
            </span>
          </div>

          {/* Catégorie */}
          {shock.category && (
            <div className="mt-1">
              <span className="text-xs text-gray-500">
                {shock.category}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
