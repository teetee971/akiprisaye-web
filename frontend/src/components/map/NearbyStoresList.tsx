/**
 * NearbyStoresList Component
 * Displays a list of nearby stores sorted by distance or price
 */

import React from 'react';
import { MapPin, Navigation, Clock, DollarSign } from 'lucide-react';
import { StoreOpenStatus } from '../store/StoreOpenStatus';
import { getStoreHours } from '../../services/storeHoursService';

interface Store {
  id: string;
  name: string;
  chain: string;
  lat: number;
  lon: number;
  address?: string;
  city?: string;
  territory?: string;
  distance?: number;
  travelTimeSeconds?: number;
  priceIndex?: number;
  priceCategory?: 'cheap' | 'medium' | 'expensive';
}

interface NearbyStoresListProps {
  stores: Store[];
  sortBy?: 'distance' | 'price';
  onStoreClick?: (store: Store) => void;
  onNavigate?: (store: Store) => void;
  maxItems?: number;
  showPrices?: boolean;
}

const PRICE_COLORS = {
  cheap: '#22c55e', // Green
  medium: '#f59e0b', // Orange
  expensive: '#ef4444', // Red
};

const PRICE_LABELS = {
  cheap: 'Pas cher',
  medium: 'Moyen',
  expensive: 'Cher',
};

/**
 * Format distance for display
 */
function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  }
  return `${distanceKm.toFixed(1)} km`;
}

/**
 * Format travel time for display
 */
function formatTravelTime(seconds: number): string {
  if (seconds < 60) {
    return `${seconds} sec`;
  }
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h${remainingMinutes > 0 ? ` ${remainingMinutes}min` : ''}`;
}

/**
 * NearbyStoresList component
 */
export function NearbyStoresList({
  stores,
  sortBy = 'distance',
  onStoreClick,
  onNavigate,
  maxItems,
  showPrices = true,
}: NearbyStoresListProps) {
  // Sort stores
  const sortedStores = [...stores].sort((a, b) => {
    if (sortBy === 'distance') {
      return (a.distance || 0) - (b.distance || 0);
    } else if (sortBy === 'price' && a.priceIndex !== undefined && b.priceIndex !== undefined) {
      return a.priceIndex - b.priceIndex;
    }
    return 0;
  });

  // Limit items if specified
  const displayStores = maxItems ? sortedStores.slice(0, maxItems) : sortedStores;

  if (displayStores.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <MapPin className="w-12 h-12 mx-auto mb-2 text-gray-400" />
        <p>Aucun magasin trouvé à proximité</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {displayStores.map((store) => (
        <button
          key={store.id}
          type="button"
          className="w-full text-left bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => onStoreClick?.(store)}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              {/* Store Name and Chain */}
              <h3 className="font-semibold text-gray-900">{store.name}</h3>
              <p className="text-sm text-gray-600">{store.chain}</p>

              {/* Open Status Badge */}
              <div className="mt-1">
                <StoreOpenStatus hours={getStoreHours(store.id, store.territory)} compact={true} />
              </div>

              {/* Location */}
              {store.city && (
                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {store.city}
                </p>
              )}

              {/* Distance and Travel Time */}
              <div className="flex items-center gap-3 mt-2 text-sm">
                {store.distance !== undefined && (
                  <span className="text-blue-600 font-medium flex items-center gap-1">
                    <Navigation className="w-4 h-4" />
                    {formatDistance(store.distance)}
                  </span>
                )}
                {store.travelTimeSeconds !== undefined && (
                  <span className="text-gray-600 flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {formatTravelTime(store.travelTimeSeconds)}
                  </span>
                )}
              </div>

              {/* Price Category */}
              {showPrices && store.priceCategory && (
                <div className="mt-2">
                  <span
                    className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-white"
                    style={{
                      backgroundColor: PRICE_COLORS[store.priceCategory],
                    }}
                  >
                    <DollarSign className="w-3 h-3" />
                    {PRICE_LABELS[store.priceCategory]}
                  </span>
                  {store.priceIndex !== undefined && (
                    <span className="ml-2 text-xs text-gray-500">
                      Indice: {store.priceIndex}/100
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Navigate Button */}
            {onNavigate && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigate(store);
                }}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                aria-label={`Naviguer vers ${store.name}`}
              >
                <Navigation className="w-5 h-5" />
              </button>
            )}
          </div>
        </button>
      ))}

      {/* Show count if limited */}
      {maxItems && stores.length > maxItems && (
        <p className="text-center text-sm text-gray-500 pt-2">
          Affichage de {maxItems} magasins sur {stores.length}
        </p>
      )}
    </div>
  );
}

export default NearbyStoresList;
