/**
 * ③ MINI "ITINÉRAIRE OPTIMAL"
 * Affiche un aperçu de l'itinéraire le plus économique
 */

import { GlassCard } from "../ui/glass-card";
import { Link } from "react-router-dom";

interface RouteStop {
  store: string;
  product: string;
  price: number;
}

export function OptimalRoutePreview() {
  const routeStops: RouteStop[] = [
    { store: "Leader Price", product: "sucre", price: 1.12 },
    { store: "Super U", product: "jus", price: 2.45 },
    { store: "Carrefour", product: "riz", price: 1.89 }
  ];

  const totalDistance = 4.3;
  const totalTime = 11;
  const co2Saved = 420;

  return (
    <GlassCard className="bg-purple-900/10 border-purple-500/30">
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-xl font-bold mb-2 text-purple-300">
            🧭 Itinéraire le plus économique
          </h3>
        </div>

        {/* Liste des arrêts */}
        <div className="space-y-3">
          {routeStops.map((stop, index) => (
            <div 
              key={stop.store}
              className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800/70 transition-colors"
            >
              <div className="flex-shrink-0 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center font-bold text-sm">
                {index + 1}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-white">{stop.store}</div>
                <div className="text-xs text-gray-400">{stop.product}</div>
              </div>
              <div className="text-green-400 font-bold">
                {stop.price.toFixed(2)} €
              </div>
            </div>
          ))}
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 bg-slate-800/30 rounded-lg">
            <div className="text-xs text-gray-400 mb-1">📏 Distance</div>
            <div className="font-bold text-white">{totalDistance} km</div>
          </div>
          <div className="text-center p-3 bg-slate-800/30 rounded-lg">
            <div className="text-xs text-gray-400 mb-1">⏱️ Temps</div>
            <div className="font-bold text-white">{totalTime} min</div>
          </div>
          <div className="text-center p-3 bg-slate-800/30 rounded-lg">
            <div className="text-xs text-gray-400 mb-1">🌱 CO₂</div>
            <div className="font-bold text-green-400">-{co2Saved}g</div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link 
            to="/carte"
            className="inline-block px-6 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg font-semibold transition-all transform hover:scale-105"
          >
            🗺️ Voir sur la carte
          </Link>
        </div>
      </div>
    </GlassCard>
  );
}
