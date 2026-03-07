 
/**
 * BasketTerritoryComparison Component
 * 
 * Displays multi-territory basket price comparison with Anti-Crisis indicators
 * - Compares basket prices across territories
 * - Shows Anti-Crisis score for each territory
 * - Sortable by price or resilience score
 * - Educational and transparent
 */

import React, { useMemo, useState } from 'react';
import { compareBasketAcrossTerritories, type TerritoryBasketComparison } from '../utils/priceAnalysis';
import { computeAntiCrisisScore, type AntiCrisisResult } from '../utils/antiCrisisScore';
import { getAntiCrisisEmoji } from '../config/antiCrisisRules';
import AntiCrisisBadge from './AntiCrisisBadge';

interface TerritoryWithAntiCrisis extends TerritoryBasketComparison {
  antiCrisisResult: AntiCrisisResult;
}

interface BasketTerritoryComparisonProps {
  basket: Record<string, number> | any;
  territoryIds: string[];
  territoryNames?: Record<string, string>;
  basketId?: string;
  getPriceForTerritory?: (basket: any, territoryId: string) => number;
  showAntiCrisis?: boolean;
  className?: string;
}

type SortMode = 'price' | 'resilience';

const BasketTerritoryComparison: React.FC<BasketTerritoryComparisonProps> = ({ 
  basket,
  territoryIds,
  territoryNames = {},
  basketId,
  getPriceForTerritory,
  showAntiCrisis = true,
  className = '',
}) => {
  const [sortMode, setSortMode] = useState<SortMode>('price');
  const [expandedTerritory, setExpandedTerritory] = useState<string | null>(null);

  // Compute comparison with Anti-Crisis data
  const territoriesWithAntiCrisis = useMemo((): TerritoryWithAntiCrisis[] => {
    const comparisons = compareBasketAcrossTerritories(basket, territoryIds, getPriceForTerritory);
    
    return comparisons.map(comp => {
      const antiCrisisResult = showAntiCrisis 
        ? computeAntiCrisisScore(comp.territoryId, basketId)
        : {
            score: 0 as const,
            label: 'Données insuffisantes' as const,
            reasons: [],
            medianPrice: null,
            currentPrice: null,
            trendPercent: null,
            volatilityPercent: null,
            dataPoints: 0,
            hasEnoughData: false,
          };

      return {
        ...comp,
        antiCrisisResult,
      };
    });
  }, [basket, territoryIds, basketId, getPriceForTerritory, showAntiCrisis]);

  // Sort territories based on selected mode
  const sortedTerritories = useMemo(() => {
    const sorted = [...territoriesWithAntiCrisis];
    
    if (sortMode === 'resilience') {
      // Sort by Anti-Crisis score (descending), then by price (ascending)
      sorted.sort((a, b) => {
        const scoreDiff = b.antiCrisisResult.score - a.antiCrisisResult.score;
        if (scoreDiff !== 0) return scoreDiff;
        return a.totalPrice - b.totalPrice;
      });
    } else {
      // Already sorted by price (default from compareBasketAcrossTerritories)
    }
    
    return sorted;
  }, [territoriesWithAntiCrisis, sortMode]);

  const getTerritoryName = (territoryId: string): string => {
    return territoryNames[territoryId] || territoryId;
  };

  const toggleExpanded = (territoryId: string) => {
    setExpandedTerritory(prev => prev === territoryId ? null : territoryId);
  };

  if (sortedTerritories.length === 0) {
    return (
      <div className={`p-4 bg-gray-50 rounded-lg text-center text-gray-500 ${className}`}>
        Aucune donnée de comparaison disponible
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Sort controls */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">
          Comparaison territoriale
        </h3>
        
        {showAntiCrisis && (
          <div className="flex gap-2">
            <button
              onClick={() => setSortMode('price')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                sortMode === 'price'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Trier par prix
            </button>
            <button
              onClick={() => setSortMode('resilience')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                sortMode === 'resilience'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Trier par résilience
            </button>
          </div>
        )}
      </div>

      {/* Comparison table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse bg-white rounded-lg shadow-sm">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-200">
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                Territoire
              </th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                Prix total
              </th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                Écart vs. min
              </th>
              {showAntiCrisis && (
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                  Résilience
                </th>
              )}
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                Détails
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedTerritories.map((territory) => (
              <React.Fragment key={territory.territoryId}>
                <tr 
                  className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                    territory.isCheapest ? 'bg-green-50' : ''
                  }`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">
                        {getTerritoryName(territory.territoryId)}
                      </span>
                      {territory.isCheapest && (
                        <span className="text-xs px-2 py-0.5 bg-green-100 text-green-800 rounded-full">
                          Prix le plus bas
                        </span>
                      )}
                    </div>
                  </td>
                  
                  <td className="px-4 py-3 text-right">
                    <span className="font-semibold text-gray-900">
                      {territory.totalPrice.toFixed(2)} €
                    </span>
                  </td>
                  
                  <td className="px-4 py-3 text-right">
                    {territory.deltaFromMin > 0 ? (
                      <span className="text-red-600">
                        +{territory.deltaFromMin.toFixed(2)} € 
                        <span className="text-xs ml-1">
                          (+{territory.deltaPercentage.toFixed(1)}%)
                        </span>
                      </span>
                    ) : (
                      <span className="text-green-600 font-medium">—</span>
                    )}
                  </td>
                  
                  {showAntiCrisis && (
                    <td className="px-4 py-3 text-center">
                      {territory.antiCrisisResult.hasEnoughData ? (
                        <div className="flex items-center justify-center gap-1">
                          <span className="text-lg" aria-hidden="true">
                            {getAntiCrisisEmoji(territory.antiCrisisResult.score)}
                          </span>
                          <span className="text-sm font-medium text-gray-700">
                            {territory.antiCrisisResult.score}/3
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                  )}
                  
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => toggleExpanded(territory.territoryId)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      aria-expanded={expandedTerritory === territory.territoryId}
                    >
                      {expandedTerritory === territory.territoryId ? '▲ Masquer' : '▼ Voir'}
                    </button>
                  </td>
                </tr>
                
                {/* Expanded details row */}
                {expandedTerritory === territory.territoryId && (
                  <tr className="bg-blue-50">
                    <td colSpan={showAntiCrisis ? 5 : 4} className="px-4 py-4">
                      {showAntiCrisis && territory.antiCrisisResult.hasEnoughData ? (
                        <AntiCrisisBadge 
                          result={territory.antiCrisisResult}
                          showDetails={true}
                        />
                      ) : (
                        <div className="text-sm text-gray-600">
                          <p className="mb-2">
                            <strong>Prix:</strong> {territory.totalPrice.toFixed(2)} €
                          </p>
                          {showAntiCrisis && (
                            <p className="text-xs text-gray-500 italic">
                              Historique insuffisant pour analyse Anti-Crise 
                              (minimum 5 observations requises)
                            </p>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      {showAntiCrisis && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-600">
          <p className="font-medium mb-2">Indicateur de résilience:</p>
          <div className="space-y-1">
            <p>🟢 <strong>3/3:</strong> Anti-Crise Fort (tous les critères validés)</p>
            <p>🟡 <strong>2/3:</strong> Anti-Crise (protection solide)</p>
            <p>⚪ <strong>1/3:</strong> Neutre (protection limitée)</p>
            <p>🔴 <strong>0/3:</strong> À risque (aucun critère validé)</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default BasketTerritoryComparison;
