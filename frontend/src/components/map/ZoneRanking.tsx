/**
 * ZoneRanking Component
 * Display top stores by price in the area
 */

import React from 'react';
import { StoreMarker } from '../../types/map';
import { formatDistance } from '../../utils/geoUtils';
import { PRICE_COLORS } from '../../utils/priceColors';

interface ZoneRankingProps {
  stores: StoreMarker[];
  userPosition?: [number, number];
  limit?: number;
  onStoreClick?: (store: StoreMarker) => void;
}

export function ZoneRanking({
  stores,
  userPosition,
  limit = 5,
  onStoreClick,
}: ZoneRankingProps) {
  // Sort stores by price index (cheapest first)
  const sortedStores = [...stores]
    .sort((a, b) => a.priceIndex - b.priceIndex)
    .slice(0, limit);

  if (sortedStores.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">
          🏆 Magasins les moins chers
        </h3>
        <p className="text-gray-600">Aucun magasin trouvé dans la zone</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">
        🏆 TOP {limit} magasins les moins chers
      </h3>
      <div className="space-y-3">
        {sortedStores.map((store, index) => (
          <div
            key={store.id}
            className={`p-4 rounded-lg border-2 transition-colors cursor-pointer ${
              index === 0
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => onStoreClick?.(store)}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                onStoreClick?.(store);
              }
            }}
            role="button"
            tabIndex={0}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg font-bold text-gray-700">
                    {index + 1}.
                  </span>
                  <span
                    className="text-lg"
                    aria-label={PRICE_COLORS[store.priceCategory].label}
                  >
                    {PRICE_COLORS[store.priceCategory].icon}
                  </span>
                  <span className="font-semibold text-gray-900">
                    {store.name}
                  </span>
                </div>
                
                {store.distance !== undefined && (
                  <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
                    <span className="flex items-center gap-1">
                      <span aria-label="Distance">📏</span>
                      {formatDistance(store.distance)}
                    </span>
                    {store.isOpen !== undefined && (
                      <span className="flex items-center gap-1">
                        <span aria-label={store.isOpen ? 'Ouvert' : 'Fermé'}>
                          🕐
                        </span>
                        {store.isOpen ? (
                          <span className="text-green-600 font-medium">
                            Ouvert
                          </span>
                        ) : (
                          <span className="text-red-600">Fermé</span>
                        )}
                      </span>
                    )}
                  </div>
                )}
              </div>
              
              <div className="text-right">
                <div className="text-xl font-bold text-gray-900">
                  {store.averageBasketPrice.toFixed(2)}€
                </div>
                <div className="text-xs text-gray-500">Panier moyen</div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {stores.length > limit && (
        <p className="text-sm text-gray-500 text-center mt-4">
          Et {stores.length - limit} autres magasins...
        </p>
      )}
    </div>
  );
}
