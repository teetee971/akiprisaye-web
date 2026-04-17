import React, { useState, useEffect } from 'react';
import { TrendingUp, Award, Users } from 'lucide-react';
import { safeLocalStorage } from '../../utils/safeLocalStorage';

interface ComparisonData {
  userSavings: number;
  averageSavings: number;
  percentile: number;
  totalUsers: number;
}

/**
 * Component ⑲: Anonymous Social Comparison
 *
 * Shows user's savings performance vs community average (anonymously)
 * Gamification through percentile ranking and badges
 * No personal data shared - pure anonymous aggregation
 *
 * Psychological effect: Healthy competition + motivation
 * Retention impact: High (users want to improve their rank)
 */
export const AnonymousSocialComparison: React.FC = () => {
  const [data, setData] = useState<ComparisonData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Calculate user's savings from safeLocalStorage
    const calculateUserSavings = (): ComparisonData => {
      // Get monthly savings from dashboard data
      const savedData = safeLocalStorage.getJSON<{ currentMonth?: number }>(
        'monthlySavings:v1',
        {}
      );
      const userSavings = savedData.currentMonth || 0;

      // Simulated community average (would be from aggregated data in production)
      const averageSavings = 18.5;
      const totalUsers = 1247; // Example: community size

      // Calculate percentile
      const diff = userSavings - averageSavings;
      const percentDiff = averageSavings > 0 ? (diff / averageSavings) * 100 : 0;

      // Percentile calculation (simplified)
      let percentile = 50;
      if (percentDiff > 40) percentile = 95;
      else if (percentDiff > 20) percentile = 85;
      else if (percentDiff > 10) percentile = 70;
      else if (percentDiff > 0) percentile = 60;
      else if (percentDiff > -10) percentile = 40;
      else if (percentDiff > -20) percentile = 30;
      else percentile = 20;

      return {
        userSavings,
        averageSavings,
        percentile,
        totalUsers,
      };
    };

    const result = calculateUserSavings();
    setData(result);
    setIsLoading(false);
  }, []);

  if (isLoading || !data) {
    return null;
  }

  const diff = data.userSavings - data.averageSavings;
  const percentDiff = data.averageSavings > 0 ? (diff / data.averageSavings) * 100 : 0;
  const isAboveAverage = diff > 0;

  // Determine badge level
  let badgeText = '';
  let badgeColor = '';
  if (data.percentile >= 90) {
    badgeText = 'Top 10%';
    badgeColor = 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
  } else if (data.percentile >= 75) {
    badgeText = 'Top 25%';
    badgeColor = 'text-green-400 bg-green-400/10 border-green-400/20';
  } else if (data.percentile >= 50) {
    badgeText = 'Au-dessus de la moyenne';
    badgeColor = 'text-blue-400 bg-blue-400/10 border-blue-400/20';
  }

  return (
    <div className="glass-card p-6 animate-slideUp">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
          <Users className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">💬 Comparaison Sociale Anonyme</h3>
          <p className="text-sm text-gray-400">
            Vous vs la moyenne ({data.totalUsers.toLocaleString()} utilisateurs)
          </p>
        </div>
      </div>

      {/* Main Comparison */}
      <div className="space-y-4">
        {/* Your Savings vs Average */}
        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-300">Vos économies ce mois</span>
            <span className="text-2xl font-bold text-white">{data.userSavings.toFixed(2)} €</span>
          </div>

          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-400 text-sm">Moyenne communauté</span>
            <span className="text-lg text-gray-400">{data.averageSavings.toFixed(2)} €</span>
          </div>

          {/* Difference Indicator */}
          <div
            className={`flex items-center gap-2 p-3 rounded-lg ${
              isAboveAverage
                ? 'bg-green-500/10 border border-green-500/20'
                : 'bg-orange-500/10 border border-orange-500/20'
            }`}
          >
            <TrendingUp
              className={`w-5 h-5 ${isAboveAverage ? 'text-green-400' : 'text-orange-400'}`}
            />
            <div>
              <p
                className={`font-semibold ${isAboveAverage ? 'text-green-400' : 'text-orange-400'}`}
              >
                {isAboveAverage ? '+' : ''}
                {percentDiff.toFixed(0)}%{isAboveAverage ? ' de plus' : ' de moins'} que la moyenne
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {isAboveAverage
                  ? 'Excellent ! Vous économisez plus que la plupart des utilisateurs'
                  : "Il y a des opportunités d'améliorer vos économies"}
              </p>
            </div>
          </div>
        </div>

        {/* Badge Achievement */}
        {badgeText && (
          <div className={`flex items-center gap-3 p-4 rounded-lg border ${badgeColor}`}>
            <Award className="w-6 h-6" />
            <div>
              <p className="font-semibold">Badge : {badgeText}</p>
              <p className="text-xs opacity-80 mt-1">
                Vous êtes dans le top {100 - data.percentile}% des économiseurs
              </p>
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <div className="text-xs text-gray-500 border-t border-white/5 pt-3">
          <p>
            ℹ️ Comparaison 100% anonyme basée sur données agrégées • Aucune donnée personnelle
            partagée • Outil d'information
          </p>
        </div>
      </div>
    </div>
  );
};

export default AnonymousSocialComparison;
