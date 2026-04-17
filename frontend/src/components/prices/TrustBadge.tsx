/**
 * Trust Badge Component
 * Displays confidence score for verified prices
 */

import React from 'react';

export interface TrustBadgeProps {
  score: number; // 0-100
  verificationCount: number;
  lastUpdate: string;
  compact?: boolean;
}

const getScoreColor = (score: number): string => {
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-blue-500';
  if (score >= 40) return 'bg-yellow-500';
  if (score >= 20) return 'bg-orange-500';
  return 'bg-red-500';
};

const getScoreLabel = (score: number): string => {
  if (score >= 80) return 'Très fiable';
  if (score >= 60) return 'Fiable';
  if (score >= 40) return 'Modéré';
  if (score >= 20) return 'À vérifier';
  return 'Non vérifié';
};

const TrustBadge: React.FC<TrustBadgeProps> = ({
  score,
  verificationCount,
  lastUpdate,
  compact = false,
}) => {
  const colorClass = getScoreColor(score);
  const label = getScoreLabel(score);
  const lastUpdateDate = new Date(lastUpdate);
  const formattedDate = lastUpdateDate.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  if (compact) {
    return (
      <div
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-white ${colorClass}`}
        title={`Score de confiance: ${score}/100 - ${label}`}
      >
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
        <span>{score}%</span>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-700">Confiance</h3>
        <div className={`px-3 py-1 rounded-full text-white text-xs font-medium ${colorClass}`}>
          {score}/100
        </div>
      </div>

      <p className="text-sm text-gray-600 mb-3">{label}</p>

      <div className="space-y-2 text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <svg
            className="w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>
            {verificationCount} vérification{verificationCount > 1 ? 's' : ''}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <svg
            className="w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>Mis à jour le {formattedDate}</span>
        </div>
      </div>
    </div>
  );
};

export default TrustBadge;
