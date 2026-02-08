/**
 * NearbyStoresList Component
 * List of nearby stores with sorting options
 */

import React, { useState } from 'react';
import { StoreMarker } from '../../types/map';
import { formatDistance } from '../../utils/geoUtils';
import { PRICE_COLORS } from '../../utils/priceColors';

interface NearbyStoresListProps {
  stores: StoreMarker[];
  onStoreClick?: (store: StoreMarker) => void;
  onGetDirections?: (store: StoreMarker) => void;
}

type SortOption = 'distance' | 'price' | 'name';

export function NearbyStoresList({
  stores,
  onStoreClick,
  onGetDirections,
}: NearbyStoresListProps) {
  const [sortBy, setSortBy] = useState<SortOption>('distance');

  const sortedStores = [...stores].sort((a, b) => {
    switch (sortBy) {
      case 'distance':
        return (a.distance || 0) - (b.distance || 0);
      case 'price':
        return a.priceIndex - b.priceIndex;
      case 'name':
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });

  return (
    <div className="bg-white rounded-lg shadow-md">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">
          📍 Magasins à proximité ({stores.length})
        </h3>
        
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSortBy('distance')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              sortBy === 'distance'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Plus proche
          </button>
          <button
            onClick={() => setSortBy('price')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              sortBy === 'price'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Moins cher
          </button>
          <button
            onClick={() => setSortBy('name')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              sortBy === 'name'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Nom A-Z
          </button>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {sortedStores.length === 0 ? (
          <div className="p-6 text-center text-gray-600">
            Aucun magasin trouvé à proximité
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {sortedStores.map(store => (
              <div
                key={store.id}
                className="p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <button
                      onClick={() => onStoreClick?.(store)}
                      className="text-left w-full group"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="text-xl"
                          aria-label={PRICE_COLORS[store.priceCategory].label}
                        >
                          {PRICE_COLORS[store.priceCategory].icon}
                        </span>
                        <h4 className="font-semibold text-gray-900 group-hover:text-blue-600">
                          {store.name}
                        </h4>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">
                        {store.chain}
                      </p>
                      
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        {store.distance !== undefined && (
                          <span className="flex items-center gap-1">
                            <span aria-label="Distance">📏</span>
                            {formatDistance(store.distance)}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <span aria-label="Prix">💰</span>
                          {store.averageBasketPrice.toFixed(2)}€
                        </span>
                        {store.isOpen !== undefined && (
                          <span
                            className={`font-medium ${
                              store.isOpen ? 'text-green-600' : 'text-red-600'
                            }`}
                          >
                            {store.isOpen ? '● Ouvert' : '○ Fermé'}
                          </span>
                        )}
                      </div>
                    </button>
                  </div>

                  <button
                    onClick={() => onGetDirections?.(store)}
                    className="px-3 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-1"
                    aria-label={`Itinéraire vers ${store.name}`}
                  >
                    <span aria-hidden="true">🗺️</span>
                    <span className="hidden sm:inline">Itinéraire</span>
                  </button>
                </div>

                {store.services && store.services.length > 0 && (
                  <div className="flex gap-2 mt-2">
                    {store.services.slice(0, 5).map(service => (
                      <span
                        key={service}
                        className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                      >
                        {service}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
