/**
 * PriceTrendBadge Component
 *
 * Displays price trend prediction with visual indicators
 * - Color-coded badges (green/yellow/red)
 * - Trend arrows (↗/→/↘)
 * - Confidence levels
 * - Detailed explanations on hover
 */

import React from 'react';
import type { PredictionResult } from '../../services/predictionService';

interface PriceTrendBadgeProps {
  prediction: PredictionResult;
  compact?: boolean;
  showDetails?: boolean;
}

const PriceTrendBadge: React.FC<PriceTrendBadgeProps> = ({
  prediction,
  compact = false,
  showDetails = false,
}) => {
  // Color mapping for trend types
  const getBadgeClasses = (label: PredictionResult['label']): string => {
    const baseClasses = 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium';

    switch (label) {
      case 'Baisse probable':
        return `${baseClasses} bg-green-100 text-green-800 border border-green-300`;
      case 'Hausse probable':
        return `${baseClasses} bg-red-100 text-red-800 border border-red-300`;
      case 'Prix stable':
        return `${baseClasses} bg-yellow-100 text-yellow-800 border border-yellow-300`;
      case 'Données insuffisantes':
        return `${baseClasses} bg-gray-100 text-gray-600 border border-gray-300`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-600`;
    }
  };

  // Arrow icon for trend direction
  const getTrendArrow = (label: PredictionResult['label']): string => {
    switch (label) {
      case 'Baisse probable':
        return '↘';
      case 'Hausse probable':
        return '↗';
      case 'Prix stable':
        return '→';
      default:
        return '';
    }
  };

  // Confidence emoji
  const getConfidenceIndicator = (volatility: number | null): string => {
    if (volatility === null) return '';
    if (volatility < 0.05) return '●●●'; // High confidence
    if (volatility < 0.15) return '●●○'; // Medium confidence
    return '●○○'; // Low confidence
  };

  if (compact) {
    return (
      <span className={getBadgeClasses(prediction.label)} title={prediction.explanation}>
        {getTrendArrow(prediction.label)} {prediction.label}
      </span>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className={getBadgeClasses(prediction.label)}>
          <span className="mr-1 text-base">{getTrendArrow(prediction.label)}</span>
          <span>{prediction.label}</span>
        </span>

        {prediction.volatility !== null && (
          <span
            className="text-xs text-gray-500"
            title={`Volatilité: ${(prediction.volatility * 100).toFixed(1)}%`}
          >
            {getConfidenceIndicator(prediction.volatility)}
          </span>
        )}
      </div>

      {showDetails && (
        <div className="text-xs text-gray-600 space-y-1">
          <p className="italic">{prediction.explanation}</p>

          {prediction.slopePerDay !== null && (
            <div className="flex items-center gap-4 mt-2 text-[11px]">
              <div>
                <span className="font-medium">Tendance:</span>{' '}
                {prediction.slopePerDay > 0 ? '+' : ''}
                {prediction.slopePerDay.toFixed(4)} €/jour
              </div>

              {prediction.volatility !== null && (
                <div>
                  <span className="font-medium">Volatilité:</span>{' '}
                  {(prediction.volatility * 100).toFixed(1)}%
                </div>
              )}

              <div>
                <span className="font-medium">Échantillon:</span> {prediction.usedCount} obs.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PriceTrendBadge;
