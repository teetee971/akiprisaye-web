// src/components/DataReliabilityBadge.tsx
// Data Reliability Badge Component - Displays factual data quality indicator
import React, { useState } from 'react';
import {
  computeReliabilityScore,
  getReliabilityLabel,
  getReliabilityColor,
  getReliabilityEmoji,
  type ReliabilityParams,
} from '../utils/dataReliability';

type DataReliabilityBadgeProps = {
  values: number[];
  lastUpdated: string;
  className?: string;
};

export default function DataReliabilityBadge({
  values,
  lastUpdated,
  className = '',
}: DataReliabilityBadgeProps) {
  const [showDetails, setShowDetails] = useState(false);

  // Check feature flag
  const isEnabled = import.meta.env.VITE_FEATURE_DATA_RELIABILITY === 'true';

  if (!isEnabled) {
    return null; // Hide completely when disabled
  }

  const params: ReliabilityParams = { values, lastUpdated };
  const reliability = computeReliabilityScore(params);

  const color = getReliabilityColor(reliability.level);
  const emoji = getReliabilityEmoji(reliability.level);
  const label = getReliabilityLabel(reliability.level);

  return (
    <div className={`inline-block ${className}`}>
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
        style={{
          backgroundColor: `${color}15`,
          color: color,
          border: `1px solid ${color}40`,
        }}
        aria-label={`Score de fiabilité: ${label}`}
        type="button"
      >
        <span>{emoji}</span>
        <span>{label}</span>
        <span className="text-xs opacity-75">({reliability.score}/100)</span>
        <svg
          className={`w-4 h-4 transition-transform ${showDetails ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {showDetails && (
        <div
          className="mt-2 p-4 rounded-lg text-sm"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <h4 className="font-semibold mb-3 text-white">Détail du score de fiabilité</h4>

          <div className="space-y-2 text-gray-300">
            <div className="flex justify-between items-center">
              <span>Points observés:</span>
              <span className="font-medium">{reliability.details.observationScore}/40</span>
            </div>
            <p className="text-xs text-gray-400 ml-4">
              {reliability.details.observations} observations
            </p>

            <div className="flex justify-between items-center">
              <span>Récence:</span>
              <span className="font-medium">{reliability.details.recencyScore}/30</span>
            </div>
            <p className="text-xs text-gray-400 ml-4">{reliability.details.recency}</p>

            <div className="flex justify-between items-center">
              <span>Cohérence:</span>
              <span className="font-medium">{reliability.details.coherenceScore}/30</span>
            </div>
            <p className="text-xs text-gray-400 ml-4">{reliability.details.coherence}</p>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-700">
            <div className="flex justify-between items-center font-semibold">
              <span>Score total:</span>
              <span style={{ color }}>{reliability.score}/100</span>
            </div>
          </div>

          <p className="mt-4 text-xs text-gray-400 italic">
            Ce score reflète uniquement la qualité des observations disponibles (nombre, récence,
            cohérence). Il ne constitue ni un jugement, ni une recommandation.
          </p>
        </div>
      )}
    </div>
  );
}
