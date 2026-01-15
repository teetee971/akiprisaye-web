/**
 * OCRCard Component
 * 
 * Reusable card UI for OCR Hub navigation
 * NO business logic - pure presentation component
 * 
 * Props:
 * - icon: Emoji or icon character
 * - title: Card title
 * - description: Short description
 * - onClick: Navigation handler
 * - color: Theme color variant
 * - available: Whether the feature is available
 */

import React from 'react';

interface OCRCardProps {
  icon: string;
  title: string;
  description: string;
  onClick: () => void;
  color?: 'blue' | 'green' | 'purple' | 'orange';
  available?: boolean;
}

export default function OCRCard({
  icon,
  title,
  description,
  onClick,
  color = 'blue',
  available = true,
}: OCRCardProps) {
  const colorClasses = {
    blue: 'from-blue-900/40 to-blue-950/40 hover:from-blue-800/50 hover:to-blue-900/50 border-blue-500/20',
    green: 'from-green-900/40 to-green-950/40 hover:from-green-800/50 hover:to-green-900/50 border-green-500/20',
    purple: 'from-purple-900/40 to-purple-950/40 hover:from-purple-800/50 hover:to-purple-900/50 border-purple-500/20',
    orange: 'from-orange-900/40 to-orange-950/40 hover:from-orange-800/50 hover:to-orange-900/50 border-orange-500/20',
  };

  return (
    <button
      onClick={available ? onClick : undefined}
      disabled={!available}
      className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${
        colorClasses[color]
      } border backdrop-blur-sm transition-all duration-300 p-6 text-left w-full ${
        !available ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-[0.98]'
      }`}
      aria-label={title}
    >
      <div className="flex items-start gap-4">
        <div className="text-5xl" aria-hidden="true">
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold mb-2 flex items-center gap-2 text-white">
            {title}
            {available && (
              <svg
                className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )}
          </h3>
          <p className="text-sm text-gray-300 leading-relaxed">{description}</p>
        </div>
      </div>

      {!available && (
        <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-gray-700/50 text-gray-300 text-xs font-semibold">
          Bientôt disponible
        </div>
      )}
    </button>
  );
}
