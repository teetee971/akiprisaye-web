/**
 * BestPriceHighlight Component
 * Highlight the best price deal across territories
 */

import type { TerritoryPrice } from '../types';
import { getTerritoryLabel } from '../../../utils/territoryMapper';

interface BestPriceHighlightProps {
  territoryPrices: TerritoryPrice[];
}

export function BestPriceHighlight({ territoryPrices }: BestPriceHighlightProps) {
  if (territoryPrices.length === 0) {
    return null;
  }

  const bestDeal = territoryPrices.reduce((best, current) => 
    current.price < best.price ? current : best
  );

  const savings = Math.max(...territoryPrices.map(tp => tp.price)) - bestDeal.price;
  const savingsPercent = savings > 0 ? ((savings / bestDeal.price) * 100).toFixed(1) : '0.0';

  return (
    <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-700/50 rounded-2xl p-6">
      <div className="flex items-start gap-4">
        <div className="text-5xl">🏆</div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-white mb-2">Meilleur prix trouvé</h3>
          <p className="text-2xl font-bold text-green-400 mb-1">
            {getTerritoryLabel(bestDeal.territory)}
          </p>
          <p className="text-3xl font-bold text-white mb-3">
            {bestDeal.price.toFixed(2)}€
          </p>
          {savings > 0 && (
            <p className="text-lg text-slate-300">
              💰 Économisez jusqu'à <span className="font-semibold text-green-400">{savings.toFixed(2)}€</span> ({savingsPercent}%)
            </p>
          )}
          <p className="text-sm text-slate-400 mt-2">
            Disponible dans {bestDeal.storeCount} magasin{bestDeal.storeCount > 1 ? 's' : ''}
          </p>
        </div>
      </div>
    </div>
  );
}
