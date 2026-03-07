 
/**
 * AntiCrisisReadingPanel Component
 * 
 * Displays Anti-Crisis reading for a selected territory
 * - Territory name and ILPP score
 * - Comparison to national average
 * - Stable categories (if qualifies)
 * - Descriptive explanation
 * - Legal disclaimer (mandatory)
 * 
 * Legal Compliance:
 * - No purchase recommendations
 * - No specific products or stores
 * - Categories only
 * - Descriptive language only
 * - Mandatory disclaimer displayed
 */

import React from 'react';
import {
  getAntiCrisisReading,
  getNationalAverage,
  explainAntiCrisisReading,
  formatStableCategories,
  ANTI_CRISIS_READING_DISCLAIMER,
  type AntiCrisisReadingResult,
  type TimeRange,
} from '../utils/antiCrisisReading';
import { getPressureLevel, getILPPColorClass } from '../utils/inflationPressureIndex';

interface AntiCrisisReadingPanelProps {
  territoryId: string;
  timeRange?: TimeRange;
  onClose?: () => void;
  className?: string;
}

const AntiCrisisReadingPanel: React.FC<AntiCrisisReadingPanelProps> = ({
  territoryId,
  timeRange = '90d',
  onClose,
  className = '',
}) => {
  const reading = getAntiCrisisReading(territoryId, timeRange);
  const nationalAvg = getNationalAverage(timeRange);

  if (!reading) {
    return (
      <div className={`p-4 bg-gray-50 rounded-lg ${className}`}>
        <p className="text-gray-600">Données non disponibles pour ce territoire.</p>
      </div>
    );
  }

  const pressureLevel = getPressureLevel(reading.ilpp);
  const colorClass = getILPPColorClass(reading.ilpp);
  
  const timeRangeLabel = timeRange === '30d' ? '30 jours' : '90 jours';

  return (
    <div className={`bg-white border border-gray-300 rounded-lg shadow-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            {reading.territoryName}
          </h3>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Fermer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* ILPP Score */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-sm font-medium text-gray-600">Pression des prix</span>
            <p className="text-xs text-gray-500 mt-1">Période observée : {timeRangeLabel}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-gray-900">{reading.ilpp}</span>
            <span className="text-sm text-gray-500">/ 100</span>
          </div>
        </div>
        
        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium`}
             style={{
               backgroundColor: colorClass.includes('green') ? 'rgb(220 252 231)' :
                              colorClass.includes('blue') ? 'rgb(219 234 254)' :
                              colorClass.includes('yellow') ? 'rgb(254 249 195)' :
                              colorClass.includes('orange') ? 'rgb(255 237 213)' :
                              'rgb(254 226 226)',
               color: colorClass.includes('green') ? 'rgb(22 101 52)' :
                     colorClass.includes('blue') ? 'rgb(30 64 175)' :
                     colorClass.includes('yellow') ? 'rgb(133 77 14)' :
                     colorClass.includes('orange') ? 'rgb(154 52 18)' :
                     'rgb(153 27 27)'
             }}>
          Pression {pressureLevel.toLowerCase()}
        </div>

        {/* Comparison to national average */}
        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Moyenne nationale :</span>
            <span className="font-medium text-gray-900">{nationalAvg.toFixed(0)}</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-sm">
            <span className="text-gray-600">Écart :</span>
            <span className={`font-medium ${
              reading.comparisonToNational === 'below' ? 'text-green-600' :
              reading.comparisonToNational === 'above' ? 'text-red-600' :
              'text-gray-600'
            }`}>
              {reading.differenceFromNational > 0 ? '+' : ''}
              {reading.differenceFromNational.toFixed(0)} points
            </span>
          </div>
        </div>
      </div>

      {/* Anti-Crisis Reading */}
      <div className="px-6 py-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">📊</span>
          <h4 className="text-md font-semibold text-gray-900">Lecture "Anti-Crise" (descriptive)</h4>
        </div>

        {reading.qualifiesForReading ? (
          <div className="space-y-3">
            {/* Explanation */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-gray-700 leading-relaxed">
                {explainAntiCrisisReading(reading)}
              </p>
            </div>

            {/* Stable categories */}
            <div>
              <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-2">
                Catégories à stabilité observée
              </p>
              <ul className="space-y-1">
                {reading.stableCategories.map((category, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm text-gray-700">
                    <span className="text-green-500">●</span>
                    <span>{category}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-sm text-gray-600">
              Ce territoire présente une pression de prix supérieure ou égale à la moyenne nationale.
              Aucune catégorie ne présente actuellement de stabilité particulière identifiée.
            </p>
          </div>
        )}
      </div>

      {/* Definition section */}
      <div className="px-6 py-3 bg-blue-50 border-t border-blue-200">
        <div className="flex items-start gap-2">
          <span className="text-blue-600 text-sm mt-0.5">ℹ️</span>
          <div className="flex-1">
            <p className="text-xs font-medium text-blue-900 mb-1">Qu'est-ce que la "Lecture Anti-Crise" ?</p>
            <p className="text-xs text-blue-800 leading-relaxed">
              Identification descriptive des territoires où la pression des prix observée est inférieure 
              à la moyenne nationale, ainsi que des catégories de produits y présentant une stabilité relative.
              <span className="block mt-1">Période analysée : {timeRangeLabel}.</span>
            </p>
          </div>
        </div>
      </div>

      {/* Legal disclaimer (mandatory) */}
      <div className="px-6 py-3 bg-yellow-50 border-t border-yellow-200">
        <div className="flex items-start gap-2">
          <span className="text-yellow-600 text-sm mt-0.5">⚖️</span>
          <p className="text-xs text-yellow-900 leading-relaxed">
            {ANTI_CRISIS_READING_DISCLAIMER}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AntiCrisisReadingPanel;
