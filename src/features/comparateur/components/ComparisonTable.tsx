/**
 * ComparisonTable Component
 * Display price comparison across territories in a table
 */

import type { Product, TerritoryPrice } from '../types';
import { getTerritoryLabel } from '../../../utils/territoryMapper';
import { StatCard } from './StatCard';
import { average } from '../utils/statsUtils';
import { SIGNIFICANT_PRICE_DIFF_THRESHOLD } from '../constants';

interface ComparisonTableProps {
  product: Product;
  territoryPrices: TerritoryPrice[];
}

export function ComparisonTable({ product, territoryPrices }: ComparisonTableProps) {
  if (territoryPrices.length === 0) {
    return (
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
        <p className="text-center text-slate-400">Aucune donnée de prix disponible pour ce produit</p>
      </div>
    );
  }

  const minPrice = Math.min(...territoryPrices.map(tp => tp.price));
  const maxPrice = Math.max(...territoryPrices.map(tp => tp.price));
  const avgPrice = average(territoryPrices.map(tp => tp.price));
  const maxDiffPercent = ((maxPrice - minPrice) / minPrice * 100).toFixed(1);

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
        <h3 className="text-2xl font-bold text-white mb-4">Comparaison: {product.name}</h3>
        {product.brand && (
          <p className="text-slate-400 mb-4">{product.brand} - {product.category}</p>
        )}
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">Territoire</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-300">Prix</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-300">Écart vs min</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-300">Écart %</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-300">Disponibilité</th>
              </tr>
            </thead>
            <tbody>
              {territoryPrices
                .sort((a, b) => a.price - b.price) // Sort by price, cheapest first
                .map(tp => {
                  const diff = tp.price - minPrice;
                  const diffPercent = ((diff / minPrice) * 100).toFixed(1);
                  const isBest = tp.price === minPrice;
                  const isHighDiff = parseFloat(diffPercent) > SIGNIFICANT_PRICE_DIFF_THRESHOLD;
                  
                  return (
                    <tr 
                      key={tp.territory} 
                      className={`border-b border-slate-800 hover:bg-slate-800/50 transition-colors ${
                        isBest ? 'bg-green-500/10' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <span className="text-white font-medium">{getTerritoryLabel(tp.territory)}</span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-white font-semibold text-lg">
                            {tp.price.toFixed(2)}€
                          </span>
                          {isBest && (
                            <span className="px-2 py-1 text-xs bg-green-600 text-white rounded-full font-semibold">
                              Meilleur prix
                            </span>
                          )}
                        </div>
                      </td>
                      <td className={`py-3 px-4 text-right ${isHighDiff ? 'text-red-400 font-semibold' : 'text-slate-300'}`}>
                        {diff === 0 ? '—' : `+${diff.toFixed(2)}€`}
                      </td>
                      <td className={`py-3 px-4 text-right ${isHighDiff ? 'text-red-400 font-semibold' : 'text-slate-300'}`}>
                        <div className="flex items-center justify-end gap-2">
                          {diff === 0 ? '—' : `+${diffPercent}%`}
                          {isHighDiff && (
                            <span title="Écart important (>20%)">⚠️</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right text-slate-300">
                        {tp.storeCount} magasin{tp.storeCount > 1 ? 's' : ''}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          label="Prix minimum" 
          value={`${minPrice.toFixed(2)}€`} 
          icon="⬇️" 
        />
        <StatCard 
          label="Prix maximum" 
          value={`${maxPrice.toFixed(2)}€`} 
          icon="⬆️" 
        />
        <StatCard 
          label="Prix moyen" 
          value={`${avgPrice.toFixed(2)}€`} 
          icon="📊" 
        />
        <StatCard 
          label="Écart max" 
          value={`${maxDiffPercent}%`} 
          icon="📏" 
        />
      </div>
    </div>
  );
}
