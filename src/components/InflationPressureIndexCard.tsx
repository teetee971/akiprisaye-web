/**
 * InflationPressureIndexCard Component
 * 
 * Displays Local Inflation Pressure Index (ILPP) in a clear, institutional manner
 * - Score visualization (0-100)
 * - Graduated bar
 * - Explanatory text
 * - Legal disclaimer (mandatory)
 * - Component breakdown (optional)
 * 
 * Legal Compliance:
 * - Always displays disclaimer
 * - Descriptive language only
 * - No predictions or advice
 */

import React from 'react';
import type { ILPPResult } from '../utils/inflationPressureIndex';
import {
  getILPPColorClass,
  getILPPTextColorClass,
  ILPP_LEGAL_DISCLAIMER,
} from '../utils/inflationPressureIndex';

interface InflationPressureIndexCardProps {
  ilpp: ILPPResult;
  territoryName?: string;
  showComponents?: boolean;
  compact?: boolean;
  className?: string;
}

const InflationPressureIndexCard: React.FC<InflationPressureIndexCardProps> = ({
  ilpp,
  territoryName,
  showComponents = false,
  compact = false,
  className = '',
}) => {
  // Don't display if not reliable
  if (!ilpp.isReliable) {
    return (
      <div className={`p-4 bg-gray-50 border border-gray-200 rounded-lg ${className}`}>
        <div className="flex items-center gap-2 text-gray-600">
          <span className="text-2xl">📊</span>
          <div>
            <p className="font-medium">Indice Local de Pression des Prix</p>
            <p className="text-sm text-gray-500 mt-1">{ilpp.explanation}</p>
          </div>
        </div>
      </div>
    );
  }

  const barColorClass = getILPPColorClass(ilpp.score);
  const textColorClass = getILPPTextColorClass(ilpp.score);

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-3 ${className}`}>
        <div className="text-center">
          <div className={`text-2xl font-bold ${textColorClass}`}>
            {ilpp.score}
          </div>
          <div className="text-xs text-gray-500">ILPP</div>
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium text-gray-700">
            Pression {ilpp.level.toLowerCase()}
          </div>
          <div className="text-xs text-gray-500 mt-0.5">
            {territoryName || 'Ce territoire'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <span className="text-2xl">📊</span>
              Indice Local de Pression des Prix
            </h3>
            {territoryName && (
              <p className="text-sm text-gray-600 mt-1">{territoryName}</p>
            )}
          </div>
          <div className="text-right">
            <div className={`text-4xl font-bold ${textColorClass}`}>
              {ilpp.score}
            </div>
            <div className="text-sm text-gray-500">/ 100</div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="px-6 py-4 space-y-4">
        {/* Pressure level badge */}
        <div className="flex items-center gap-3">
          <span className={`px-4 py-2 rounded-full text-sm font-medium ${textColorClass}`}
                style={{ 
                  backgroundColor: barColorClass.includes('green') ? 'rgb(220 252 231)' :
                                  barColorClass.includes('blue') ? 'rgb(219 234 254)' :
                                  barColorClass.includes('yellow') ? 'rgb(254 249 195)' :
                                  barColorClass.includes('orange') ? 'rgb(255 237 213)' :
                                  'rgb(254 226 226)'
                }}>
            Pression {ilpp.level.toLowerCase()}
          </span>
          <span className="text-xs text-gray-500">
            {ilpp.dataPoints} observations
          </span>
        </div>

        {/* Graduated bar */}
        <div className="space-y-2">
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full ${barColorClass} transition-all duration-500 ease-out rounded-full`}
              style={{ width: `${ilpp.score}%` }}
              role="progressbar"
              aria-valuenow={ilpp.score}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
          
          {/* Scale markers */}
          <div className="flex justify-between text-xs text-gray-400">
            <span>0</span>
            <span>20</span>
            <span>40</span>
            <span>60</span>
            <span>80</span>
            <span>100</span>
          </div>
        </div>

        {/* Explanation */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-gray-700 leading-relaxed">
            {ilpp.explanation}
          </p>
        </div>

        {/* Component breakdown (optional) */}
        {showComponents && (
          <div className="space-y-2 pt-2 border-t border-gray-200">
            <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">
              Composantes de l'indice
            </p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Variation moyenne:</span>
                <span className="font-medium text-gray-900">
                  {ilpp.components.avgChange >= 0 ? '+' : ''}
                  {ilpp.components.avgChange.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Volatilité:</span>
                <span className="font-medium text-gray-900">
                  {ilpp.components.volatility.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Fréquence hausses:</span>
                <span className="font-medium text-gray-900">
                  {ilpp.components.increaseFrequency.toFixed(0)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Dispersion:</span>
                <span className="font-medium text-gray-900">
                  {ilpp.components.dispersion.toFixed(1)}%
                </span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2 italic">
              Pondération: variation (40%), volatilité (30%), fréquence (20%), dispersion (10%)
            </p>
          </div>
        )}
      </div>

      {/* Legal disclaimer (mandatory) */}
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
        <div className="flex items-start gap-2">
          <span className="text-blue-600 text-sm mt-0.5">ℹ️</span>
          <p className="text-xs text-gray-600 leading-relaxed">
            {ILPP_LEGAL_DISCLAIMER}
          </p>
        </div>
      </div>
    </div>
  );
};

export default InflationPressureIndexCard;
