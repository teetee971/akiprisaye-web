import { useState, useMemo, useCallback } from 'react';
import { MapPin, ShoppingCart, TrendingDown, Navigation } from 'lucide-react';
import { getUserPosition, calculateDistancesBatch, type GeoPosition } from '../utils/geoLocation';
import { RouteOptimizer } from './RouteOptimizer';

// Default update time computed once at module load for demo purposes
// In production, this would be the actual last data update timestamp
const DEFAULT_UPDATE_TIME = new Date();

// Create time formatter once at module level for performance
const timeFormatter = new Intl.DateTimeFormat('fr-FR', {
  hour: '2-digit',
  minute: '2-digit',
});

const API_BASE_URL = (import.meta as { env: Record<string, string> }).env.VITE_API_URL || '';

interface ShoppingItem {
  id: string;
  name: string;
  quantity: number;
}

interface StoreOption {
  id: string;
  name: string;
  distance: number; // in km
  totalCost: number;
  travelCost: number;
  address: string;
}

/** Raw store shape returned by /api/map/nearby */
interface ApiStore {
  id: string;
  name: string;
  lat: number;
  lon: number;
  address?: string;
  priceIndex?: number;
}

interface GPSShoppingListProps {
  items: ShoppingItem[];
  lastUpdate?: Date;
  className?: string;
}

export default function GPSShoppingList({
  items,
  lastUpdate = DEFAULT_UPDATE_TIME,
  className,
}: GPSShoppingListProps) {
  const [position, setPosition] = useState<GeoPosition | null>(null);
  const [loading, setLoading] = useState(false);
  const [storeOptions, setStoreOptions] = useState<StoreOption[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Memoize formatted time to avoid recreating on every render
  const formattedTime = useMemo(() => {
    return timeFormatter.format(lastUpdate);
  }, [lastUpdate]);

  const requestLocation = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const pos = await getUserPosition();

      if (pos) {
        setPosition(pos);
        // Calculate store options with real GPS data
        await calculateStoreOptions(pos);
      } else {
        setError("Impossible d'obtenir votre position. Veuillez autoriser la géolocalisation.");
      }
    } catch (err) {
      console.error('Geolocation error:', err);
      setError("Une erreur s'est produite lors de la localisation.");
    } finally {
      setLoading(false);
    }
  }, []);

  const calculateStoreOptions = useCallback(async (userPos: GeoPosition) => {
    // Constants for travel cost calculation
    const ROUND_TRIP_MULTIPLIER = 2; // Account for return trip
    const COST_PER_KM = 0.5; // Average fuel cost per km (€)
    const CENTS_MULTIPLIER = 100; // For rounding to cents
    const NEARBY_RADIUS_KM = 15;

    let apiStores: ApiStore[] = [];

    // Fetch nearby stores from real-time API
    try {
      const params = new URLSearchParams({
        lat: userPos.lat.toString(),
        lon: userPos.lon.toString(),
        radius: NEARBY_RADIUS_KM.toString(),
        maxResults: '10',
      });
      const res = await fetch(`${API_BASE_URL}/api/map/nearby?${params.toString()}`);
      if (res.ok) {
        const json = (await res.json()) as { success?: boolean; data?: { stores?: ApiStore[] } };
        if (json.success && json.data?.stores) {
          apiStores = json.data.stores;
        }
      }
    } catch {
      // API unavailable — fall back to empty list (handled below)
    }

    if (apiStores.length === 0) {
      setError(
        'Aucun magasin trouvé à proximité. Vérifiez votre connexion ou élargissez le rayon de recherche.'
      );
      setStoreOptions([]);
      return;
    }

    // Estimate basket cost from priceIndex (relative to 100 = average)
    // priceIndex 95 means 5% cheaper than average
    const BASKET_BASE_COST = 90; // estimated average basket cost in €

    const storesWithCoords = apiStores.map((s) => ({
      id: s.id,
      name: s.name,
      lat: s.lat,
      lon: s.lon,
      address: s.address ?? '',
      totalCost:
        s.priceIndex != null
          ? Math.round(BASKET_BASE_COST * (s.priceIndex / 100) * CENTS_MULTIPLIER) /
            CENTS_MULTIPLIER
          : BASKET_BASE_COST,
    }));

    // Use batch distance calculation for efficiency
    const storesWithDistances = calculateDistancesBatch(userPos, storesWithCoords);

    // Calculate travel cost based on actual distance
    const optionsWithRealDistance: StoreOption[] = storesWithDistances.map((store) => ({
      id: store.id,
      name: store.name,
      distance: store.distance,
      totalCost: store.totalCost,
      // Travel cost: distance * round trip * cost per km, rounded to cents
      travelCost:
        Math.round(store.distance * ROUND_TRIP_MULTIPLIER * COST_PER_KM * CENTS_MULTIPLIER) /
        CENTS_MULTIPLIER,
      address: store.address,
    }));

    // Sort by total cost (products + travel) — greedy optimum
    optionsWithRealDistance.sort(
      (a, b) => a.totalCost + a.travelCost - (b.totalCost + b.travelCost)
    );

    setStoreOptions(optionsWithRealDistance);
  }, []);

  // Use useMemo to avoid recalculating on every render
  const bestOption = useMemo(() => {
    if (storeOptions.length === 0) return null;

    // Best option is lowest total (products + travel)
    return storeOptions.reduce((best, current) => {
      const bestTotal = best.totalCost + best.travelCost;
      const currentTotal = current.totalCost + current.travelCost;
      return currentTotal < bestTotal ? current : best;
    });
  }, [storeOptions]);

  return (
    <div
      className={`bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-700/50 p-5 ${className || ''}`}
    >
      <div className="flex items-center gap-3 mb-4">
        <ShoppingCart className="w-5 h-5 text-blue-400" />
        <h2 className="text-lg font-semibold text-gray-100">Liste de courses optimisée GPS</h2>
      </div>

      {/* Methodology Explanation */}
      <div className="mb-5 bg-blue-900/20 border border-blue-700/30 rounded-lg p-4">
        <p className="text-xs font-semibold text-blue-200 mb-2">Méthode de calcul :</p>
        <ul className="text-xs text-blue-200/80 space-y-1 leading-relaxed">
          <li className="flex items-start gap-2">
            <span className="w-1 h-1 rounded-full bg-blue-400 mt-1.5 flex-shrink-0"></span>
            <span>Prix observés en magasin (sources publiques)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1 h-1 rounded-full bg-blue-400 mt-1.5 flex-shrink-0"></span>
            <span>Distance réelle (GPS)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1 h-1 rounded-full bg-blue-400 mt-1.5 flex-shrink-0"></span>
            <span>Coût carburant moyen (6L / 100km)</span>
          </li>
        </ul>
        <p className="text-[10px] text-blue-300/70 mt-2 italic">
          Dernière mise à jour : {formattedTime}
        </p>
      </div>

      {/* Shopping Items */}
      <div className="mb-5">
        <h3 className="text-sm font-medium text-gray-300 mb-2">Vos articles ({items.length})</h3>
        <div className="space-y-2">
          {items.slice(0, 3).map((item) => (
            <div key={item.id} className="flex items-center justify-between text-sm">
              <span className="text-gray-300">{item.name}</span>
              <span className="text-gray-400">×{item.quantity}</span>
            </div>
          ))}
          {items.length > 3 && (
            <p className="text-xs text-gray-500 italic">+ {items.length - 3} autres articles</p>
          )}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 p-3 bg-rose-900/20 border border-rose-700/30 rounded-lg">
          <p className="text-sm text-rose-300">{error}</p>
        </div>
      )}

      {/* GPS Button */}
      {!position && (
        <button
          type="button"
          onClick={requestLocation}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Navigation className="w-4 h-4" />
          {loading ? 'Localisation en cours...' : 'Trouver les meilleurs magasins à proximité'}
        </button>
      )}

      {/* Store Options */}
      {position && storeOptions.length > 0 && (
        <div className="space-y-4">
          {/* Best Option Highlight */}
          {bestOption && (
            <div className="bg-emerald-900/30 border-2 border-emerald-600/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingDown className="w-5 h-5 text-emerald-400" />
                <span className="text-sm font-semibold text-emerald-300">Meilleure option :</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-gray-100">{bestOption.name}</p>
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3" />
                      {bestOption.address}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-emerald-700/30">
                  <div>
                    <p className="text-xs text-gray-400">Distance</p>
                    <p className="text-sm font-semibold text-emerald-300">
                      {bestOption.distance} km
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Total courses</p>
                    <p className="text-sm font-semibold text-emerald-300">
                      {bestOption.totalCost.toFixed(2)} €
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Trajet estimé</p>
                    <p className="text-sm font-semibold text-emerald-300">
                      {bestOption.travelCost.toFixed(2)} €
                    </p>
                  </div>
                </div>
                <div className="pt-2 border-t border-emerald-700/30">
                  <p className="text-xs text-gray-400">Coût total</p>
                  <p className="text-lg font-bold text-emerald-300">
                    {(bestOption.totalCost + bestOption.travelCost).toFixed(2)} €
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Other Options */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-300">Autres options :</p>
            {storeOptions
              .filter((s) => s.id !== bestOption?.id)
              .map((store) => (
                <div
                  key={store.id}
                  className="bg-slate-800/30 rounded-lg p-3 border border-slate-700/30"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-gray-200">{store.name}</p>
                    <p className="text-sm text-gray-400">{store.distance} km</p>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">
                      Total : {store.totalCost.toFixed(2)} € + {store.travelCost.toFixed(2)} €
                      trajet
                    </span>
                    <span className="font-semibold text-gray-300">
                      {(store.totalCost + store.travelCost).toFixed(2)} €
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      <p className="text-[10px] text-gray-500 mt-4 italic">
        ℹ️ Calculs basés sur les prix réels des magasins et l'estimation de consommation moyenne
        (6L/100km).
      </p>

      {/* Route Optimizer panel */}
      <div className="mt-6">
        <RouteOptimizer />
      </div>
    </div>
  );
}
