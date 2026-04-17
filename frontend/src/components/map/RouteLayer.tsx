/**
 * RouteLayer Component
 * Display route on the map
 */

import React from 'react';
import { Polyline, Marker, Popup } from 'react-leaflet';
import { RouteResult } from '../../types/map';
import L from 'leaflet';

interface RouteLayerProps {
  route: RouteResult;
  onClear?: () => void;
}

export function RouteLayer({ route, onClear }: RouteLayerProps) {
  // Convert GeoJSON LineString to Leaflet LatLng array
  const positions: [number, number][] = route.geometry.coordinates.map(
    (coord) => [coord[1], coord[0]] // GeoJSON is [lon, lat], Leaflet is [lat, lon]
  );

  // Start and end markers
  const startIcon = L.divIcon({
    html: `<div style="background-color: #22c55e; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>`,
    className: 'custom-div-icon',
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  });

  const endIcon = L.divIcon({
    html: `<div style="background-color: #ef4444; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>`,
    className: 'custom-div-icon',
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  });

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}min`;
  };

  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    }
    return `${(meters / 1000).toFixed(1)} km`;
  };

  return (
    <>
      {/* Route line */}
      <Polyline
        positions={positions}
        pathOptions={{
          color: '#3b82f6',
          weight: 4,
          opacity: 0.7,
        }}
      />

      {/* Start marker */}
      {positions.length > 0 && (
        <Marker position={positions[0]} icon={startIcon}>
          <Popup>
            <div className="text-sm">
              <strong>Départ</strong>
            </div>
          </Popup>
        </Marker>
      )}

      {/* End marker */}
      {positions.length > 1 && (
        <Marker position={positions[positions.length - 1]} icon={endIcon}>
          <Popup>
            <div className="space-y-2">
              <div className="text-sm font-semibold">Arrivée</div>
              <div className="text-sm">
                <div>
                  Distance: <strong>{formatDistance(route.distance)}</strong>
                </div>
                <div>
                  Durée: <strong>{formatDuration(route.duration)}</strong>
                </div>
              </div>
              {onClear && (
                <button
                  onClick={onClear}
                  className="w-full mt-2 px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                >
                  Effacer l'itinéraire
                </button>
              )}
            </div>
          </Popup>
        </Marker>
      )}
    </>
  );
}
