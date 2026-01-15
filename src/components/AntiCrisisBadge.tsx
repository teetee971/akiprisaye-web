/**
 * AntiCrisisBadge Component
 * 
 * Displays Anti-Crisis indicator for prices based on historical analysis
 * - Shows only when sufficient historical data exists
 * - Color-coded badges (🟢 green, 🟡 yellow, 🔴 red, ⚪ neutral)
 * - Tooltip with detailed explanation
 * - Non-intrusive, informational only
 * 
 * Legal Compliance:
 * - No commercial promises
 * - No financial advice
 * - Descriptive analysis based on observed data
 */

import React from 'react';
import type { AntiCrisisResult } from '../utils/antiCrisisScore';
import { getAntiCrisisEmoji, getAntiCrisisBadgeClasses } from '../config/antiCrisisRules';

interface AntiCrisisBadgeProps {
  result: AntiCrisisResult;
  compact?: boolean;
  showDetails?: boolean;
  className?: string;
}

const AntiCrisisBadge: React.FC<AntiCrisisBadgeProps> = ({ 
  result, 
  compact = false,
  showDetails = false,
  className = '',
}) => {
  // Don't display badge if insufficient data
  if (!result.hasEnoughData) {
    return null;
  }

  // Get visual styling
  const emoji = getAntiCrisisEmoji(result.score);
  const badgeClasses = getAntiCrisisBadgeClasses(result.score);

  // Build tooltip content
  const tooltipContent = result.reasons
    .map(r => {
      const icon = r.met ? '✓' : '✗';
      return `${icon} ${r.explanation}`;
    })
    .join('\n');

  if (compact) {
    return (
      <span 
        className={`${badgeClasses} ${className}`}
        title={tooltipContent}
        role="status"
        aria-label={`Indicateur Anti-Crise: ${result.label}`}
      >
        {emoji} {result.label}
      </span>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-2">
        <span 
          className={badgeClasses}
          title={tooltipContent}
          role="status"
          aria-label={`Indicateur Anti-Crise: ${result.label}`}
        >
          <span className="mr-1 text-base" aria-hidden="true">{emoji}</span>
          <span>{result.label}</span>
        </span>
        
        <span className="text-xs text-gray-500">
          {result.score}/3 critères
        </span>
      </div>

      {showDetails && (
        <div className="text-xs text-gray-600 space-y-1 mt-2">
          <p className="font-medium text-gray-700 mb-1">
            Analyse de résilience du prix:
          </p>
          
          {result.reasons.map((reason, index) => (
            <div key={index} className="flex items-start gap-2">
              <span className={reason.met ? 'text-green-600' : 'text-gray-400'}>
                {reason.met ? '✓' : '✗'}
              </span>
              <span className="flex-1">
                <strong>{reason.criterion}:</strong> {reason.explanation}
              </span>
            </div>
          ))}

          <div className="mt-3 pt-2 border-t border-gray-200 text-[11px] text-gray-500">
            <p>
              <strong>Données analysées:</strong> {result.dataPoints} observations
            </p>
            {result.currentPrice !== null && (
              <p>
                <strong>Prix actuel:</strong> {result.currentPrice.toFixed(2)}€
              </p>
            )}
            {result.medianPrice !== null && (
              <p>
                <strong>Prix médian territorial:</strong> {result.medianPrice.toFixed(2)}€
              </p>
            )}
          </div>

          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-[10px] text-blue-800">
            <p className="font-medium">ℹ️ Indicateur informatif</p>
            <p className="mt-1">
              Analyse descriptive basée sur l'historique local des prix observés. 
              Ne constitue pas un conseil financier ou une garantie.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AntiCrisisBadge;
