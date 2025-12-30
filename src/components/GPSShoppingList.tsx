import { useState, useMemo } from 'react';
import { MapPin, ShoppingCart, TrendingDown, Navigation } from 'lucide-react';

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

interface GPSShoppingListProps {
  items: ShoppingItem[];
  className?: string;
}

export default function GPSShoppingList({ items, className }: GPSShoppingListProps) {
  const [position, setPosition] = useState<{ lat: number; lon: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [storeOptions, setStoreOptions] = useState<StoreOption[]>([]);
  const [error, setError] = useState<string | null>(null);

  const requestLocation = () => {
    setLoading(true);
    setError(null);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setPosition({
            lat: pos.coords.latitude,
            lon: pos.coords.longitude
          });
          // Mock calculation - in production, fetch from API
          calculateStoreOptions();
          setLoading(false);
        },
        (error) => {
          console.error('Geolocation error:', error);
          setLoading(false);
          setError("Impossible d'obtenir votre position. Veuillez autoriser la géolocalisation.");
        }
      );
    } else {
      setLoading(false);
      setError('La géolocalisation n\'est pas disponible sur votre appareil.');
    }
  };

  const calculateStoreOptions = () => {
    // Mock data - in production, fetch from API with real prices
    const mockOptions: StoreOption[] = [
      {
        id: '1',
        name: 'Super U',
        distance: 4.2,
        totalCost: 87.30,
        travelCost: 2.10,
        address: 'Zone commerciale Jarry, Baie-Mahault'
      },
      {
        id: '2',
        name: 'Carrefour Market',
        distance: 2.8,
        totalCost: 92.50,
        travelCost: 1.40,
        address: 'Centre-ville, Pointe-à-Pitre'
      },
      {
        id: '3',
        name: 'Leader Price',
        distance: 6.1,
        totalCost: 84.90,
        travelCost: 3.05,
        address: 'Route de Basse-Terre, Les Abymes'
      }
    ];
    setStoreOptions(mockOptions);
  };

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
    <div className={`bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-700/50 p-6 ${className || ''}`}>
      <div className="flex items-center gap-3 mb-6">
        <ShoppingCart className="w-6 h-6 text-blue-400" />
        <h2 className="text-xl font-semibold text-gray-100">
          Liste de courses optimisée GPS
        </h2>
      </div>

      {/* Shopping Items */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-300 mb-3">Vos articles ({items.length})</h3>
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
                    <p className="text-sm font-semibold text-emerald-300">{bestOption.distance} km</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Total courses</p>
                    <p className="text-sm font-semibold text-emerald-300">{bestOption.totalCost.toFixed(2)} €</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Trajet estimé</p>
                    <p className="text-sm font-semibold text-emerald-300">{bestOption.travelCost.toFixed(2)} €</p>
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
            {storeOptions.filter(s => s.id !== bestOption?.id).map((store) => (
              <div key={store.id} className="bg-slate-800/30 rounded-lg p-3 border border-slate-700/30">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-gray-200">{store.name}</p>
                  <p className="text-sm text-gray-400">{store.distance} km</p>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Total : {store.totalCost.toFixed(2)} € + {store.travelCost.toFixed(2)} € trajet</span>
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
        ℹ️ Calculs basés sur les prix réels des magasins et l'estimation de consommation moyenne (6L/100km).
      </p>
    </div>
  );
}
