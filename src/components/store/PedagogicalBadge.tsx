/**
 * Pedagogical Badge System
 * 
 * Automatic badges to build user trust through transparency.
 * PROMPT 6: Badge pédagogiques automatiques (effet confiance)
 * 
 * Badges:
 * - "Prix stable" - price hasn't changed much
 * - "Variation récente" - price changed recently
 * - "Données limitées" - not enough observations
 * - "Observation récente" - freshly observed
 */

import React, { useState } from 'react';

export type BadgeType = 'stable' | 'recent_variation' | 'limited_data' | 'recent_observation';

export interface PriceBadge {
  type: BadgeType;
  label: string;
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
  explanation: string;
}

interface PedagogicalBadgeProps {
  badge: PriceBadge;
  onClick?: () => void;
}

/**
 * Calculate which badge to show based on price data
 */
export function calculatePriceBadge(
  currentPrice: number,
  priceHistory: { date: string; price: number }[],
  lastUpdateDate: string
): PriceBadge | null {
  const now = new Date();
  const lastUpdate = new Date(lastUpdateDate);
  const daysSinceUpdate = Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24));

  // Check for recent observation (< 7 days)
  if (daysSinceUpdate <= 7) {
    return {
      type: 'recent_observation',
      label: 'Observation récente',
      icon: '🔄',
      color: 'text-green-400',
      bgColor: 'bg-green-900/30',
      borderColor: 'border-green-700',
      explanation: `Ce prix a été observé il y a ${daysSinceUpdate === 0 ? "aujourd'hui" : daysSinceUpdate === 1 ? "hier" : `${daysSinceUpdate} jours`}. Les données sont très fraîches.`,
    };
  }

  // Check for limited data
  if (priceHistory.length < 3) {
    return {
      type: 'limited_data',
      label: 'Données limitées',
      icon: '📊',
      color: 'text-amber-400',
      bgColor: 'bg-amber-900/30',
      borderColor: 'border-amber-700',
      explanation: `Peu d'observations disponibles (${priceHistory.length} point${priceHistory.length > 1 ? 's' : ''} de données). Les tendances sont moins fiables.`,
    };
  }

  // Check for price stability (last 30 days)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const recentPrices = priceHistory
    .filter(p => new Date(p.date) >= thirtyDaysAgo)
    .map(p => p.price);

  if (recentPrices.length >= 2) {
    const prices = [currentPrice, ...recentPrices];
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice;
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    const variationPercent = (priceRange / avgPrice) * 100;

    // Price is stable if variation < 5%
    if (variationPercent < 5) {
      return {
        type: 'stable',
        label: 'Prix stable',
        icon: '✓',
        color: 'text-blue-400',
        bgColor: 'bg-blue-900/30',
        borderColor: 'border-blue-700',
        explanation: `Le prix a peu varié ces 30 derniers jours (variation de ${variationPercent.toFixed(1)}%). Cela suggère une certaine stabilité.`,
      };
    }

    // Price has varied
    if (variationPercent >= 10) {
      return {
        type: 'recent_variation',
        label: 'Variation récente',
        icon: '📈',
        color: 'text-purple-400',
        bgColor: 'bg-purple-900/30',
        borderColor: 'border-purple-700',
        explanation: `Le prix a varié de ${variationPercent.toFixed(1)}% ces 30 derniers jours. Les prix peuvent fluctuer selon les promotions et la disponibilité.`,
      };
    }
  }

  return null;
}

/**
 * Pedagogical Badge Component with click-to-explain
 */
export default function PedagogicalBadge({ badge, onClick }: PedagogicalBadgeProps) {
  const [showExplanation, setShowExplanation] = useState(false);

  const handleClick = () => {
    setShowExplanation(!showExplanation);
    onClick?.();
  };

  return (
    <div>
      <button
        onClick={handleClick}
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${badge.color} ${badge.bgColor} ${badge.borderColor} hover:opacity-80`}
        title="Cliquez pour plus d'informations"
      >
        <span>{badge.icon}</span>
        <span>{badge.label}</span>
        <span className="text-xs opacity-70">ℹ️</span>
      </button>

      {/* Explanation Tooltip/Panel */}
      {showExplanation && (
        <div className={`mt-2 p-3 rounded-lg text-sm ${badge.bgColor} border ${badge.borderColor}`}>
          <div className="flex items-start gap-2">
            <span className="text-lg">{badge.icon}</span>
            <div>
              <p className="font-medium text-white mb-1">{badge.label}</p>
              <p className={`text-xs ${badge.color} opacity-90`}>
                {badge.explanation}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Badge Container Component - Shows all applicable badges for a product/store
 */
export function BadgeContainer({ badges }: { badges: PriceBadge[] }) {
  if (badges.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {badges.map((badge, index) => (
        <PedagogicalBadge key={`${badge.type}-${index}`} badge={badge} />
      ))}
    </div>
  );
}
