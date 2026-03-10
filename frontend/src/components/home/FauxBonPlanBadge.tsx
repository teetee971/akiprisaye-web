/**
 * ⑮ COMPOSANT - Badge Faux Bon Plan
 * Signale les promotions trompeuses
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { detectFakeDeal, type PriceHistory, type FakeDealResult } from '../../services/detectFakeDeal';

interface FauxBonPlanBadgeProps {
  currentPrice: number;
  priceHistory: PriceHistory[];
  isPromotion?: boolean;
  className?: string;
}

export function FauxBonPlanBadge({
  currentPrice,
  priceHistory,
  isPromotion = false,
  className = ''
}: FauxBonPlanBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  
  const result = detectFakeDeal(currentPrice, priceHistory, isPromotion);

  // Ne rien afficher si pas de faux bon plan détecté
  if (!result.isFakeDeal) return null;

  const confidenceColors = {
    high: 'bg-red-900/30 border-red-500/50 text-red-300',
    medium: 'bg-orange-900/30 border-orange-500/50 text-orange-300',
    low: 'bg-yellow-900/30 border-yellow-500/50 text-yellow-300'
  };

  const confidenceIcons = {
    high: '⚠️',
    medium: '🤔',
    low: 'ℹ️'
  };

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        onClick={() => setShowTooltip(!showTooltip)}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border font-medium text-sm transition-all hover:scale-105 ${confidenceColors[result.confidence]}`}
        aria-label="Voir les détails de l'alerte prix"
      >
        <span className="text-base">{confidenceIcons[result.confidence]}</span>
        <span className="hidden sm:inline">Faux bon plan probable</span>
        <span className="sm:hidden">Suspect</span>
      </button>

      {/* Tooltip pédagogique */}
      {showTooltip && (
        <div className="absolute z-tooltip top-full left-0 mt-2 w-80 max-w-[calc(100vw-2rem)] p-4 bg-slate-900 border border-slate-700 rounded-lg shadow-xl animate-fade-in">
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-start gap-2">
              <span className="text-2xl">{confidenceIcons[result.confidence]}</span>
              <div className="flex-1">
                <h4 className="font-bold text-white mb-1">
                  {result.confidence === 'high' ? 'Alerte : Faux bon plan' : 
                   result.confidence === 'medium' ? 'Prix suspect' : 
                   'À vérifier'}
                </h4>
                <p className="text-sm text-gray-300">
                  {result.reason}
                </p>
              </div>
            </div>

            {/* Comparaison */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Prix actuel :</span>
                <span className="font-bold text-red-400">{result.currentPrice.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Moyenne 30j :</span>
                <span className="font-semibold text-white">{result.avg30Days.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Prix le + bas :</span>
                <span className="font-semibold text-green-400">{result.lowestPrice.toFixed(2)} €</span>
              </div>
            </div>

            {/* Barre de comparaison */}
            <div className="space-y-1">
              <div className="text-xs text-gray-400">Écart vs moyenne :</div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${
                    result.percentAboveAverage > 15 ? 'bg-red-500' :
                    result.percentAboveAverage > 10 ? 'bg-orange-500' :
                    'bg-yellow-500'
                  }`}
                  style={{ width: `${Math.min(100, result.percentAboveAverage * 2)}%` }}
                />
              </div>
              <div className="text-xs text-right text-gray-400">
                +{result.percentAboveAverage.toFixed(1)}%
              </div>
            </div>

            {/* Explication méthodologie */}
            <div className="pt-2 border-t border-slate-700">
              <p className="text-xs text-gray-500">
                <strong className="text-gray-400">🔍 Méthodologie :</strong><br />
                Comparaison automatique avec l'historique des 30 derniers jours.
                Basé uniquement sur les données observées localement.
              </p>
            </div>

            {/* CTA */}
            <Link 
              to="/historique-prix"
              className="block w-full text-center px-3 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors"
            >
              Voir l'historique complet
            </Link>
          </div>

          {/* Arrow pointer */}
          <div className="absolute bottom-full left-4 w-0 h-0 border-l-8 border-r-8 border-b-8 border-transparent border-b-slate-700" />
        </div>
      )}
    </div>
  );
}

/**
 * Version simple sans tooltip (pour les listes)
 */
export function FauxBonPlanBadgeSimple({
  result,
  className = ''
}: {
  result: FakeDealResult;
  className?: string;
}) {
  if (!result.isFakeDeal) return null;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 bg-red-900/30 border border-red-500/50 rounded text-xs text-red-300 ${className}`}>
      <span>⚠️</span>
      <span>Faux bon plan</span>
    </span>
  );
}
