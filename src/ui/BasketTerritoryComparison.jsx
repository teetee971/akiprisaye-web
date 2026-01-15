import { getTerritoryDisplayName } from '../constants/territories';
import { formatCurrency } from '../utils/formatters';

/**
 * BasketTerritoryComparison - Display price comparison across territories
 * 
 * Shows a comparative table when multiple territories are selected.
 * Highlights the cheapest option with a badge.
 * 
 * @param {Object} props
 * @param {Array} props.comparison - Array of comparison results from compareBasketAcrossTerritories
 * @param {Object} props.basket - Original basket object for context
 */
export default function BasketTerritoryComparison({ comparison, basket }) {
  if (!comparison || comparison.length <= 1) {
    // Don't show comparison for single territory
    return null;
  }

  return (
    <div className="mt-4 bg-slate-800/30 border border-slate-700 rounded-lg overflow-hidden">
      <div className="px-4 py-3 bg-slate-800/50 border-b border-slate-700">
        <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <span>📊</span>
          <span>Comparaison territoriale - {basket.name || 'Ce panier'}</span>
        </h4>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-800/30">
            <tr>
              <th className="px-4 py-3 text-left text-slate-400 font-medium">Territoire</th>
              <th className="px-4 py-3 text-right text-slate-400 font-medium">Prix total</th>
              <th className="px-4 py-3 text-right text-slate-400 font-medium">Différence</th>
              <th className="px-4 py-3 text-right text-slate-400 font-medium">%</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {comparison.map((result, _index) => (
              <tr 
                key={result.territoryId}
                className={`
                  ${result.isCheapest ? 'bg-green-900/20' : 'hover:bg-slate-800/30'}
                  transition-colors
                `}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-100 font-medium">
                      {getTerritoryDisplayName(result.territoryId)}
                    </span>
                    {result.isCheapest && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-400 border border-green-500/30">
                        🏆 Meilleur prix
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className={`font-semibold ${result.isCheapest ? 'text-green-400' : 'text-slate-100'}`}>
                    {formatCurrency(result.totalPrice)}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  {result.deltaFromMin > 0 ? (
                    <span className="text-orange-400">
                      +{formatCurrency(result.deltaFromMin)}
                    </span>
                  ) : (
                    <span className="text-slate-500">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  {result.deltaFromMin > 0 ? (
                    <span className="text-orange-400">
                      +{result.deltaPercentage.toFixed(1)}%
                    </span>
                  ) : (
                    <span className="text-slate-500">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="px-4 py-3 bg-slate-800/20 border-t border-slate-700">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>
            💰 Économie potentielle : jusqu'à{' '}
            <strong className="text-green-400">
              {formatCurrency(comparison[comparison.length - 1].deltaFromMin)}
            </strong>
            {' '}en choisissant {getTerritoryDisplayName(comparison[0].territoryId)}
          </span>
        </div>
      </div>
    </div>
  );
}
