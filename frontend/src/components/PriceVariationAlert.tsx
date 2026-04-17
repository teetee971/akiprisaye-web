// src/components/PriceVariationAlert.tsx
// Price Variation Alert Component - visual indicator for significant price changes
import React from 'react';
import { usePriceVariationAlert, type PricePoint } from '../hooks/usePriceVariationAlert';

type PriceVariationAlertProps = {
  prices: PricePoint[];
  className?: string;
};

/**
 * Get alert color based on direction
 */
function getAlertColor(direction: 'up' | 'down' | null): string {
  switch (direction) {
    case 'up':
      return '#dc2626'; // Red-600 (subdued)
    case 'down':
      return '#059669'; // Green-600 (subdued)
    default:
      return '#6b7280'; // Gray-500
  }
}

/**
 * Get alert icon based on direction
 */
function getAlertIcon(direction: 'up' | 'down' | null): string {
  switch (direction) {
    case 'up':
      return '🔺';
    case 'down':
      return '🔻';
    default:
      return 'ℹ️';
  }
}

/**
 * Get alert message based on direction and variation
 */
function getAlertMessage(direction: 'up' | 'down' | null, variation: number): string {
  const absVariation = Math.abs(variation);
  const sign = variation >= 0 ? '+' : '−';

  if (direction === 'up') {
    return `Hausse significative observée (${sign}${absVariation} %)`;
  } else if (direction === 'down') {
    return `Baisse significative observée (${sign}${absVariation} %)`;
  }

  return `Variation observée (${sign}${absVariation} %)`;
}

export default function PriceVariationAlert({ prices, className = '' }: PriceVariationAlertProps) {
  const alert = usePriceVariationAlert(prices);

  // Don't show if alert is not triggered
  if (!alert.showAlert) {
    return null;
  }

  const color = getAlertColor(alert.direction);
  const icon = getAlertIcon(alert.direction);
  const message = getAlertMessage(alert.direction, alert.variation);

  return (
    <div
      className={`p-4 rounded-lg border ${className}`}
      style={{
        backgroundColor: `${color}15`,
        borderColor: `${color}40`,
      }}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <div className="text-2xl mt-0.5" aria-hidden="true">
          {icon}
        </div>

        <div className="flex-1">
          <div className="font-semibold mb-2" style={{ color }}>
            {message}
          </div>

          <p className="text-sm text-white/70 mb-3">
            Variation calculée à partir des prix précédemment observés
          </p>

          {/* Institutional disclaimer (mandatory) */}
          <div className="pt-3 border-t border-white/10">
            <p className="text-xs text-white/60 italic">
              Cette indication est fournie à titre informatif, à partir des données publiques
              observées.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
