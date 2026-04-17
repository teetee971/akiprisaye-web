/**
 * ZoneRanking Component
 * Displays store rankings by zone
 */

import React from 'react';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';

interface StoreRanking {
  id: string;
  name: string;
  chain: string;
  city?: string;
  priceIndex: number;
  category: 'cheap' | 'medium' | 'expensive';
  rank: number;
}

interface ZoneRankingProps {
  stores: StoreRanking[];
  zoneName?: string;
  maxItems?: number;
  showTrends?: boolean;
}

const CATEGORY_COLORS = {
  cheap: 'bg-green-100 text-green-800',
  medium: 'bg-orange-100 text-orange-800',
  expensive: 'bg-red-100 text-red-800',
};

const CATEGORY_LABELS = {
  cheap: 'Économique',
  medium: 'Moyen',
  expensive: 'Cher',
};

/**
 * ZoneRanking component
 */
export function ZoneRanking({
  stores,
  zoneName = 'Zone',
  maxItems = 10,
  showTrends = false,
}: ZoneRankingProps) {
  // Sort by rank
  const sortedStores = [...stores].sort((a, b) => a.rank - b.rank);
  const displayStores = sortedStores.slice(0, maxItems);

  if (displayStores.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500">
        <p>Aucun classement disponible pour {zoneName}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-4">
      <h3 className="font-semibold text-lg mb-4">Classement - {zoneName}</h3>

      <div className="space-y-2">
        {displayStores.map((store) => (
          <div
            key={store.id}
            className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
          >
            {/* Rank */}
            <div className="flex-shrink-0">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                  store.rank === 1
                    ? 'bg-yellow-400 text-yellow-900'
                    : store.rank === 2
                      ? 'bg-gray-300 text-gray-800'
                      : store.rank === 3
                        ? 'bg-orange-300 text-orange-900'
                        : 'bg-gray-100 text-gray-700'
                }`}
              >
                {store.rank}
              </div>
            </div>

            {/* Store Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium text-gray-900 truncate">{store.name}</p>
                {showTrends && (
                  <span className="flex-shrink-0">
                    {store.priceIndex < 40 ? (
                      <TrendingDown className="w-4 h-4 text-green-600" />
                    ) : store.priceIndex > 60 ? (
                      <TrendingUp className="w-4 h-4 text-red-600" />
                    ) : (
                      <Minus className="w-4 h-4 text-gray-400" />
                    )}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600">{store.chain}</p>
              {store.city && <p className="text-xs text-gray-500">{store.city}</p>}
            </div>

            {/* Price Category */}
            <div className="flex-shrink-0 text-right">
              <span
                className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                  CATEGORY_COLORS[store.category]
                }`}
              >
                {CATEGORY_LABELS[store.category]}
              </span>
              <p className="text-xs text-gray-500 mt-1">{store.priceIndex}/100</p>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      {stores.length > maxItems && (
        <p className="text-center text-sm text-gray-500 mt-4 pt-3 border-t">
          Top {maxItems} sur {stores.length} magasins
        </p>
      )}
    </div>
  );
}

export default ZoneRanking;
