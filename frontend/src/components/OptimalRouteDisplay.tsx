 
/**
 * Optimal Route Display Component
 * Shows the optimized multi-store shopping route with map visualization
 * and before/after comparison
 */

import React, { useState } from 'react';
import { MapPin, TrendingDown, Clock, Leaf, Fuel, Map as MapIcon } from 'lucide-react';
import type { OptimalRoute } from '../utils/routeOptimization';
import type { GeoPosition } from '../utils/geoLocation';
import RouteMapVisualization from './RouteMapVisualization';
import RouteBeforeAfterComparison from './RouteBeforeAfterComparison';

interface OptimalRouteDisplayProps {
  route: OptimalRoute;
  userPosition?: GeoPosition;
  onClose?: () => void;
}

export default function OptimalRouteDisplay({ route, userPosition, onClose }: OptimalRouteDisplayProps) {
  const [showMap, setShowMap] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

  if (!route || route.stores.length === 0) {
    return null;
  }

  return (
    <div 
      className="bg-gradient-to-br from-emerald-900/30 to-blue-900/30 border-2 border-emerald-600/50 rounded-lg p-4 mb-4"
      role="region"
      aria-labelledby="route-title"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <TrendingDown className="w-5 h-5 text-emerald-400" aria-hidden="true" />
          <h3 id="route-title" className="text-lg font-semibold text-emerald-300">🗺️ Itinéraire Optimisé</h3>
        </div>
        <div className="flex items-center gap-2">
          {userPosition && (
            <button
              onClick={() => setShowMap(!showMap)}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors flex items-center gap-1"
              aria-label={showMap ? "Masquer la carte" : "Voir sur la carte"}
            >
              <MapIcon className="w-4 h-4" />
              {showMap ? 'Masquer' : 'Carte'}
            </button>
          )}
          <button
            onClick={() => setShowComparison(!showComparison)}
            className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors flex items-center gap-1"
            aria-label={showComparison ? "Masquer la comparaison" : "Voir avant/après"}
          >
            <TrendingDown className="w-4 h-4" />
            {showComparison ? 'Masquer' : 'Comparer'}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-300 text-sm px-2"
              aria-label="Fermer l'itinéraire optimisé"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-2 mb-4 p-3 bg-slate-800/50 rounded-lg" role="group" aria-label="Résumé de l'itinéraire">
        <div className="text-center">
          <div className="text-2xl font-bold text-emerald-300">
            {route.stores.length}
          </div>
          <div className="text-xs text-gray-400">magasins</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-300">
            {route.totalDistance.toFixed(1)}
          </div>
          <div className="text-xs text-gray-400">km total</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-300">
            ~{route.totalTime}
          </div>
          <div className="text-xs text-gray-400">minutes</div>
        </div>
      </div>

      {/* Savings */}
      {route.savings.distance > 0 && (
        <div className="mb-4 p-3 bg-emerald-900/20 rounded-lg border border-emerald-700/30" role="region" aria-label="Économies réalisées">
          <div className="text-sm font-semibold text-emerald-300 mb-2">
            💰 Économies réalisées :
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-blue-400" aria-hidden="true" />
              <span className="text-gray-300">
                {route.savings.distance.toFixed(1)} km
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Fuel className="w-3 h-3 text-orange-400" aria-hidden="true" />
              <span className="text-gray-300">
                {route.savings.fuel.toFixed(1)} L
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Leaf className="w-3 h-3 text-green-400" aria-hidden="true" />
              <span className="text-gray-300">
                {route.savings.co2.toFixed(1)} kg CO₂
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Route Steps */}
      <div className="space-y-2" role="list" aria-label="Étapes de l'itinéraire">
        <div className="text-sm font-medium text-gray-300 mb-2">Ordre de visite :</div>
        
        {/* Starting point */}
        <div className="flex items-center gap-3 text-sm" role="listitem">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold" aria-hidden="true">
            🏠
          </div>
          <div className="flex-1">
            <div className="text-gray-300 font-medium">Départ</div>
            <div className="text-xs text-gray-500">Votre position actuelle</div>
          </div>
        </div>

        {/* Store steps */}
        {route.stores.map((store, index) => (
          <div key={store.id} className="flex items-center gap-3 text-sm" role="listitem">
            <div 
              className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold"
              aria-label={`Étape ${index + 1}`}
            >
              {index + 1}
            </div>
            <div className="flex-1">
              <div className="text-gray-200 font-medium">
                {store.enseigne || store.name || `Magasin ${index + 1}`}
              </div>
              <div className="text-xs text-gray-400">
                {store.type_magasin} • {store.distance.toFixed(1)} km
              </div>
            </div>
          </div>
        ))}

        {/* Return home */}
        <div className="flex items-center gap-3 text-sm" role="listitem">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold" aria-hidden="true">
            🏠
          </div>
          <div className="flex-1">
            <div className="text-gray-300 font-medium">Retour</div>
            <div className="text-xs text-gray-500">À votre position</div>
          </div>
        </div>
      </div>

      {/* Map Visualization */}
      {showMap && userPosition && (
        <div className="mt-4">
          <RouteMapVisualization 
            route={route} 
            userPosition={userPosition}
          />
        </div>
      )}

      {/* Before/After Comparison */}
      {showComparison && (
        <div className="mt-4">
          <RouteBeforeAfterComparison route={route} />
        </div>
      )}

      {/* Tips */}
      <div className="mt-4 p-3 bg-blue-900/20 rounded-lg border border-blue-700/30" role="note">
        <div className="text-xs text-blue-200">
          💡 <strong>Conseil :</strong> Cet itinéraire minimise votre distance totale et vos émissions de CO₂.
          {userPosition && !showMap && ' Cliquez sur "Carte" pour visualiser le parcours.'}
          {!showComparison && ' Cliquez sur "Comparer" pour voir les économies réalisées.'}
        </div>
      </div>
    </div>
  );
}
