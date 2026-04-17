/**
 * Route Map Visualization Component
 *
 * Displays an interactive map with the optimized shopping route
 * Shows user position, store markers, and route polylines
 *
 * Note: Uses Leaflet.js loaded from npm package.
 */

import { useEffect, useRef, useState } from 'react';
import type { OptimalRoute } from '../utils/routeOptimization';
import type { GeoPosition } from '../utils/geoLocation';
import { loadLeaflet } from '../utils/leafletClient';

interface RouteMapVisualizationProps {
  route: OptimalRoute;
  userPosition: GeoPosition;
  className?: string;
}

export default function RouteMapVisualization({
  route,
  userPosition,
  className = '',
}: RouteMapVisualizationProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  // Using any for mapInstanceRef since Leaflet is loaded dynamically
  // and proper TypeScript types are not available at compile time
  const mapInstanceRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadLeafletAndInitMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (mapInstanceRef.current && route && userPosition) {
      updateRouteVisualization();
    }
  }, [route, userPosition]);

  /**
   * Load Leaflet library and initialize map
   */
  async function loadLeafletAndInitMap() {
    try {
      // Use the utility that imports from npm packages
      const L = await loadLeaflet();
      if (L) {
        window.L = L;
        setIsLoading(false);
        initializeMap();
      } else {
        throw new Error('Failed to load Leaflet');
      }
    } catch (err) {
      console.error('Error loading Leaflet:', err);
      setError('Erreur lors du chargement de la carte');
      setIsLoading(false);
    }
  }

  /**
   * Initialize Leaflet map
   */
  function initializeMap() {
    if (!mapRef.current || !window.L || !userPosition) return;

    // Create map centered on user position
    const map = window.L.map(mapRef.current).setView([userPosition.lat, userPosition.lon], 12);

    // Add CartoDB dark tiles for consistency with existing maps
    window.L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20,
    }).addTo(map);

    mapInstanceRef.current = map;

    // Add route visualization
    updateRouteVisualization();
  }

  /**
   * Update route visualization on the map
   */
  function updateRouteVisualization() {
    if (!mapInstanceRef.current || !window.L || !route || !userPosition) return;

    const map = mapInstanceRef.current;

    // Clear existing layers (except tile layer)
    map.eachLayer((layer: any) => {
      if (layer instanceof window.L.Marker || layer instanceof window.L.Polyline) {
        map.removeLayer(layer);
      }
    });

    // Define custom icons
    const homeIcon = window.L.divIcon({
      html: '<div style="background: #3b82f6; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">🏠</div>',
      className: 'custom-div-icon',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    const storeIcon = (index: number) =>
      window.L.divIcon({
        html: `<div style="background: #10b981; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">${index + 1}</div>`,
        className: 'custom-div-icon',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

    // Add user position marker
    const homeMarker = window.L.marker([userPosition.lat, userPosition.lon], { icon: homeIcon });
    homeMarker.bindPopup(`
      <div style="min-width: 150px;">
        <h3 style="margin: 0 0 8px 0; color: #3b82f6; font-size: 16px; font-weight: bold;">
          🏠 Votre position
        </h3>
        <p style="margin: 4px 0; font-size: 14px;">Point de départ et retour</p>
      </div>
    `);
    homeMarker.addTo(map);

    // Collect all coordinates for bounds
    const allCoords: [number, number][] = [[userPosition.lat, userPosition.lon]];

    // Add store markers
    route.stores.forEach((store, index) => {
      const storeMarker = window.L.marker([store.lat, store.lon], { icon: storeIcon(index) });

      const storeName = store.enseigne || store.name || `Magasin ${index + 1}`;
      const storeType = store.type_magasin || 'Magasin';

      storeMarker.bindPopup(`
        <div style="min-width: 200px;">
          <h3 style="margin: 0 0 8px 0; color: #10b981; font-size: 16px; font-weight: bold;">
            ${index + 1}. ${storeName}
          </h3>
          <p style="margin: 4px 0; font-size: 14px;">📍 ${storeType}</p>
          <p style="margin: 4px 0; font-size: 14px;">📏 ${store.distance.toFixed(1)} km du départ</p>
        </div>
      `);

      storeMarker.addTo(map);
      allCoords.push([store.lat, store.lon]);
    });

    // Draw route polyline
    const routeCoords: [number, number][] = [
      [userPosition.lat, userPosition.lon],
      ...route.stores.map((store) => [store.lat, store.lon] as [number, number]),
      [userPosition.lat, userPosition.lon], // Return to start
    ];

    const routeLine = window.L.polyline(routeCoords, {
      color: '#10b981',
      weight: 4,
      opacity: 0.7,
      smoothFactor: 1,
      dashArray: '10, 10',
    });

    routeLine.addTo(map);

    // Add arrow decorations to show direction
    if (window.L.polylineDecorator) {
      const decorator = window.L.polylineDecorator(routeLine, {
        patterns: [
          {
            offset: '50%',
            repeat: 100,
            symbol: window.L.Symbol.arrowHead({
              pixelSize: 12,
              polygon: false,
              pathOptions: { stroke: true, color: '#10b981', weight: 2 },
            }),
          },
        ],
      });
      decorator.addTo(map);
    }

    // Fit map to show all markers
    if (allCoords.length > 1) {
      const bounds = window.L.latLngBounds(allCoords);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }

  if (isLoading) {
    return (
      <div
        className={`flex items-center justify-center p-8 bg-slate-800/50 rounded-lg ${className}`}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Chargement de la carte...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-900/20 border border-red-500/30 rounded-lg p-4 ${className}`}>
        <p className="text-red-300">⚠️ {error}</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <div
        ref={mapRef}
        className="w-full rounded-lg overflow-hidden shadow-lg border border-slate-700"
        style={{ height: '400px', minHeight: '300px' }}
      />

      {/* Legend */}
      <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-400">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-600 rounded-full border-2 border-white"></div>
          <span>Départ/Arrivée</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-emerald-600 rounded-full border-2 border-white"></div>
          <span>Magasins (ordre de visite)</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-1 bg-emerald-500"
            style={{
              backgroundImage:
                'repeating-linear-gradient(90deg, #10b981, #10b981 10px, transparent 10px, transparent 20px)',
            }}
          ></div>
          <span>Itinéraire optimisé</span>
        </div>
      </div>
    </div>
  );
}
