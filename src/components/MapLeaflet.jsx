/**
 * MapLeaflet Component
 * 
 * Interactive map showing stores across DOM-COM territories
 * Uses Leaflet.js for map rendering
 */

import { useEffect, useRef, useState } from 'react';

// Territory coordinates (center points)
const TERRITORY_COORDINATES = {
  GP: { lat: 16.2650, lng: -61.5510, zoom: 10, name: 'Guadeloupe' },
  MQ: { lat: 14.6415, lng: -61.0242, zoom: 10, name: 'Martinique' },
  GF: { lat: 3.9339, lng: -53.1258, zoom: 8, name: 'Guyane' },
  RE: { lat: -21.1151, lng: 55.5364, zoom: 9, name: 'La Réunion' },
  YT: { lat: -12.8275, lng: 45.1662, zoom: 10, name: 'Mayotte' },
  PM: { lat: 46.9419, lng: -56.2711, zoom: 11, name: 'Saint-Pierre-et-Miquelon' },
  BL: { lat: 17.9000, lng: -62.8333, zoom: 13, name: 'Saint-Barthélemy' },
  MF: { lat: 18.0708, lng: -63.0501, zoom: 12, name: 'Saint-Martin' },
  WF: { lat: -13.7687, lng: -177.1561, zoom: 10, name: 'Wallis-et-Futuna' },
  PF: { lat: -17.6797, lng: -149.4068, zoom: 9, name: 'Polynésie française' },
  NC: { lat: -20.9043, lng: 165.6180, zoom: 8, name: 'Nouvelle-Calédonie' },
  TF: { lat: -49.2803, lng: 69.3486, zoom: 5, name: 'TAAF' },
};

export function MapLeaflet({ territory = 'GP', stores = [], onStoreClick = null }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Load Leaflet CSS and JS dynamically
    loadLeaflet();
  }, []);

  useEffect(() => {
    // Update map when territory or stores change
    if (mapInstanceRef.current) {
      updateMap();
    }
  }, [territory, stores]);

  /**
   * Load Leaflet library dynamically
   */
  async function loadLeaflet() {
    try {
      // Check if Leaflet is already loaded
      if (window.L) {
        initializeMap();
        return;
      }

      // Load Leaflet CSS
      const cssLink = document.createElement('link');
      cssLink.rel = 'stylesheet';
      cssLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      cssLink.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
      cssLink.crossOrigin = '';
      document.head.appendChild(cssLink);

      // Load Leaflet JS
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
      script.crossOrigin = '';
      
      script.onload = () => {
        setIsLoading(false);
        initializeMap();
      };

      script.onerror = () => {
        setError('Erreur lors du chargement de la carte');
        setIsLoading(false);
      };

      document.head.appendChild(script);
    } catch (err) {
      console.error('Error loading Leaflet:', err);
      setError(err.message);
      setIsLoading(false);
    }
  }

  /**
   * Initialize Leaflet map
   */
  function initializeMap() {
    if (!mapRef.current || !window.L) return;

    const coords = TERRITORY_COORDINATES[territory] || TERRITORY_COORDINATES.GP;

    // Create map
    const map = window.L.map(mapRef.current).setView(
      [coords.lat, coords.lng],
      coords.zoom,
    );

    // Add dark CartoDB tiles
    window.L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20,
    }).addTo(map);

    mapInstanceRef.current = map;

    // Add store markers
    updateMarkers(map);
  }

  /**
   * Update map view when territory changes
   */
  function updateMap() {
    if (!mapInstanceRef.current) return;

    const coords = TERRITORY_COORDINATES[territory] || TERRITORY_COORDINATES.GP;
    mapInstanceRef.current.setView([coords.lat, coords.lng], coords.zoom);

    // Clear existing markers and add new ones
    updateMarkers(mapInstanceRef.current);
  }

  /**
   * Update markers on the map
   */
  function updateMarkers(map) {
    if (!window.L) return;

    // Clear existing markers (except tile layer)
    map.eachLayer((layer) => {
      if (layer instanceof window.L.Marker) {
        map.removeLayer(layer);
      }
    });

    // Add markers for each store
    stores.forEach((store) => {
      if (!store.lat || !store.lng) return;

      const marker = window.L.marker([store.lat, store.lng]);

      // Create popup content
      const popupContent = `
        <div style="min-width: 200px;">
          <h3 style="margin: 0 0 8px 0; color: #0f62fe; font-size: 16px;">
            ${store.name}
          </h3>
          ${store.address ? `<p style="margin: 4px 0; font-size: 14px;">📍 ${store.address}</p>` : ''}
          ${store.phone ? `<p style="margin: 4px 0; font-size: 14px;">📞 ${store.phone}</p>` : ''}
          ${store.productCount ? `<p style="margin: 4px 0; font-size: 14px;">🛒 ${store.productCount} produits</p>` : ''}
          ${store.avgPrice ? `<p style="margin: 4px 0; font-size: 14px;">💰 Prix moyen: ${store.avgPrice.toFixed(2)}€</p>` : ''}
          ${onStoreClick ? `<button onclick="window.handleStoreClick('${store.id}')" style="margin-top: 8px; padding: 6px 12px; background: #0f62fe; color: white; border: none; border-radius: 4px; cursor: pointer; width: 100%;">Voir les prix</button>` : ''}
        </div>
      `;

      marker.bindPopup(popupContent);

      // Add click event
      if (onStoreClick) {
        marker.on('click', () => {
          onStoreClick(store);
        });
      }

      marker.addTo(map);
    });
  }

  // Expose store click handler globally for popup buttons
  useEffect(() => {
    if (onStoreClick) {
      window.handleStoreClick = (storeId) => {
        const store = stores.find(s => s.id === storeId);
        if (store) {
          onStoreClick(store);
        }
      };
    }

    return () => {
      delete window.handleStoreClick;
    };
  }, [stores, onStoreClick]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Chargement de la carte...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-800 dark:text-red-200">
          ⚠️ {error}
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        ref={mapRef}
        className="w-full rounded-lg overflow-hidden shadow-lg"
        style={{ height: '500px', minHeight: '400px' }}
      />
      
      {stores.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg text-center max-w-sm">
            <p className="text-gray-700 dark:text-gray-300 mb-2">
              📍 Aucun magasin à afficher
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Sélectionnez un territoire pour voir les magasins disponibles
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
