import React from 'react';
import { TrendingDown, Award, Calendar, Info } from 'lucide-react';

interface ComparisonSummaryProps {
  bestPrice: number;
  worstPrice: number;
  averagePrice: number;
  savingsPercentage: number;
  bestProvider: string;
  totalObservations: number;
  bestTiming?: {
    label: string;
    daysRange: string;
  };
  currency?: string;
}

const ComparisonSummary: React.FC<ComparisonSummaryProps> = ({
  bestPrice,
  worstPrice,
  averagePrice,
  savingsPercentage,
  bestProvider,
  totalObservations,
  bestTiming,
  currency = 'EUR',
}) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency,
    }).format(price);
  };

  const savingsAmount = worstPrice - bestPrice;

  return (
    <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-xl p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Award className="w-6 h-6 text-yellow-400" />
        <h2 className="text-xl font-bold text-gray-100">
          📊 Résumé de la comparaison
        </h2>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {/* Best Deal */}
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-4 h-4 text-green-400" />
            <p className="text-sm text-green-300 font-semibold">Meilleure offre</p>
          </div>
          <p className="text-2xl font-bold text-green-400">{formatPrice(bestPrice)}</p>
          <p className="text-xs text-gray-400 mt-1">{bestProvider}</p>
        </div>

        {/* Average Price */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Info className="w-4 h-4 text-blue-400" />
            <p className="text-sm text-blue-300 font-semibold">Prix moyen</p>
          </div>
          <p className="text-2xl font-bold text-blue-400">{formatPrice(averagePrice)}</p>
          <p className="text-xs text-gray-400 mt-1">{totalObservations} observations</p>
        </div>

        {/* Potential Savings */}
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-4 h-4 text-orange-400" />
            <p className="text-sm text-orange-300 font-semibold">Économie possible</p>
          </div>
          <p className="text-2xl font-bold text-orange-400">{formatPrice(savingsAmount)}</p>
          <p className="text-xs text-gray-400 mt-1">soit {savingsPercentage.toFixed(1)}%</p>
        </div>

        {/* Best Timing */}
        {bestTiming && (
          <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-purple-400" />
              <p className="text-sm text-purple-300 font-semibold">Meilleur moment</p>
            </div>
            <p className="text-lg font-bold text-purple-400">{bestTiming.label}</p>
            <p className="text-xs text-gray-400 mt-1">{bestTiming.daysRange}</p>
          </div>
        )}
      </div>

      {/* Key Insight */}
      <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
        <p className="text-sm text-gray-300 leading-relaxed">
          💡 <strong className="text-blue-400">Conseil</strong> : En choisissant <strong className="text-green-400">{bestProvider}</strong> au lieu de l'offre la plus chère, 
          vous pouvez économiser jusqu'à <strong className="text-orange-400">{formatPrice(savingsAmount)}</strong> ({savingsPercentage.toFixed(1)}%).
          {bestTiming && ` Réservez idéalement ${bestTiming.daysRange.toLowerCase()} pour les meilleurs prix.`}
        </p>
      </div>
    </div>
  );
};

export default ComparisonSummary;
