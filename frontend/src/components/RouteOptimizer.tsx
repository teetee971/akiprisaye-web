/**
 * RouteOptimizer — Optimisation prix/distance pour tournée de courses
 */

import { useState, useMemo, useCallback } from 'react';
import {
  MapPin,
  Navigation,
  TrendingDown,
  SlidersHorizontal,
  ShoppingCart,
  ExternalLink,
} from 'lucide-react';
import { storesMock } from '../modules/store/stores.mock';

interface StoreScore {
  id: string;
  name: string;
  city: string | undefined;
  lat: number;
  lon: number;
  priceIndex: number;
  distanceKm: number;
  score: number;
}

interface ListItem {
  id: string;
  name: string;
}

const MOCK_PRICE_INDICES: Record<string, number> = {
  'gp-leclerc-bas-du-fort': 0.92,
  'gp-u-baie-mahault': 0.97,
  'gp-super-u-sainte-anne': 1.02,
  'gp-carrefour-destinrelles': 0.95,
};

const USER_LAT = 16.2415;
const USER_LON = -61.5331;

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function RouteOptimizer() {
  const [alpha, setAlpha] = useState(0.6);
  const [items, setItems] = useState<ListItem[]>([
    { id: '1', name: 'Lait 1L' },
    { id: '2', name: 'Pain de mie' },
    { id: '3', name: 'Yaourt nature' },
  ]);
  const [newItem, setNewItem] = useState('');

  const beta = 1 - alpha;

  const scores: StoreScore[] = useMemo(() => {
    return storesMock
      .filter((s) => s.lat !== undefined && s.lon !== undefined)
      .map((s) => {
        const lat = s.lat ?? USER_LAT;
        const lon = s.lon ?? USER_LON;
        const distanceKm = Math.round(haversine(USER_LAT, USER_LON, lat, lon) * 10) / 10;
        const priceIndex = MOCK_PRICE_INDICES[s.id] ?? 1.0;
        const maxDist = 30;
        const normalizedDist = Math.min(distanceKm / maxDist, 1);
        const score = alpha * priceIndex + beta * normalizedDist;
        return { id: s.id, name: s.name, city: s.city, lat, lon, priceIndex, distanceKm, score };
      })
      .sort((a, b) => a.score - b.score);
  }, [alpha, beta]);

  const best = scores[0];
  const worst = scores[scores.length - 1];
  const estimatedSavings =
    best && worst ? ((worst.priceIndex - best.priceIndex) * 50).toFixed(2) : '0.00';

  const totalDistance = useMemo(() => {
    if (scores.length < 2) return 0;
    const top3 = scores.slice(0, 3);
    let dist = 0;
    for (let i = 0; i < top3.length - 1; i++) {
      dist += haversine(top3[i].lat, top3[i].lon, top3[i + 1].lat, top3[i + 1].lon);
    }
    return Math.round(dist * 10) / 10;
  }, [scores]);

  const mapsUrl = best ? `https://maps.google.com/maps?daddr=${best.lat},${best.lon}` : '#';

  const addItem = useCallback(() => {
    const name = newItem.trim();
    if (!name) return;
    setItems((prev) => [...prev, { id: Date.now().toString(), name }]);
    setNewItem('');
  }, [newItem]);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 p-5 space-y-6">
      <div className="flex items-center gap-2">
        <Navigation className="w-5 h-5 text-blue-400" />
        <h3 className="text-lg font-bold text-white">Optimiseur d'itinéraire</h3>
      </div>

      {/* Sliders alpha/beta */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <SlidersHorizontal className="w-4 h-4 text-slate-400" />
          <p className="text-sm font-semibold text-slate-300">Priorité</p>
        </div>
        <div>
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>💰 Prix ({Math.round(alpha * 100)}%)</span>
            <span>📍 Proximité ({Math.round(beta * 100)}%)</span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={alpha}
            onChange={(e) => setAlpha(Number(e.target.value))}
            className="w-full accent-blue-500"
          />
        </div>
      </div>

      {/* Ranked stores */}
      <div>
        <p className="text-xs font-semibold text-slate-400 mb-2">Magasins classés par score</p>
        <div className="space-y-2">
          {scores.map((s, i) => (
            <div
              key={s.id}
              className={`flex items-center justify-between rounded-lg px-3 py-2.5 ${
                i === 0
                  ? 'bg-emerald-900/40 border border-emerald-600/40'
                  : 'bg-slate-900 border border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 w-5">#{i + 1}</span>
                <div>
                  <p
                    className={`text-sm font-medium ${i === 0 ? 'text-emerald-200' : 'text-slate-200'}`}
                  >
                    {s.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {s.distanceKm} km · Indice prix {s.priceIndex.toFixed(2)}
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-slate-400">{s.score.toFixed(3)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Itinéraire suggéré */}
      <div className="bg-slate-900 rounded-xl border border-slate-700 p-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingDown className="w-4 h-4 text-emerald-400" />
          <p className="text-sm font-semibold text-slate-300">Itinéraire suggéré (top 3)</p>
        </div>
        <div className="space-y-1 mb-3">
          {scores.slice(0, 3).map((s, i) => (
            <div key={s.id} className="flex items-center gap-2 text-sm text-slate-300">
              <MapPin className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
              <span>
                {i + 1}. {s.name} — {s.city}
              </span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-400 mb-3">
          <span>
            Distance totale estimée : <strong className="text-white">{totalDistance} km</strong>
          </span>
          <span>
            Économies estimées : <strong className="text-emerald-400">{estimatedSavings} €</strong>
          </span>
        </div>
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          Ouvrir dans Maps
        </a>
      </div>

      {/* Shopping list */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <ShoppingCart className="w-4 h-4 text-yellow-400" />
          <p className="text-sm font-semibold text-slate-300">Liste de courses</p>
        </div>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            placeholder="Ajouter un article…"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addItem()}
            className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={addItem}
            className="bg-yellow-600 hover:bg-yellow-700 text-white font-semibold px-3 py-2 rounded-lg transition-colors text-sm"
          >
            +
          </button>
        </div>
        <div className="space-y-1">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between text-sm bg-slate-900 rounded-lg px-3 py-2"
            >
              <span className="text-slate-300">{item.name}</span>
              <div className="flex items-center gap-3">
                <span className="text-xs text-emerald-400">{best?.name ?? '—'}</span>
                <button
                  onClick={() => removeItem(item.id)}
                  className="text-slate-600 hover:text-rose-400 transition-colors text-xs"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
        {best && (
          <p className="text-xs text-slate-500 italic mt-2">
            Tous les articles assignés au magasin le plus avantageux :{' '}
            <strong className="text-slate-300">{best.name}</strong>
          </p>
        )}
      </div>
    </div>
  );
}
