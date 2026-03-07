 
/**
 * MapLeaflet Component - Performance Optimized
 * 
 * Interactive map showing stores across DOM-COM territories
 * Uses Leaflet.js for map rendering with lazy loading and mobile optimizations
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { loadLeaflet } from '../utils/leafletClient';
import { getOptimizedMapConfig } from '../utils/deviceDetection';

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
  const observerRef = useRef(null);
  const markersRef = useRef([]);
  
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Get device-optimized config
  const mapConfig = useRef(getOptimizedMapConfig());

  /**
   * Intersection Observer for lazy loading
   * Only load Leaflet when map becomes visible
   */
  useEffect(() => {
    if (!mapRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isVisible) {
            setIsVisible(true);
            setIsLoading(true);
          }
        });
      },
      {
        rootMargin: '50px', // Start loading 50px before visible
        threshold: 0.1,
      }
    );

    observerRef.current.observe(mapRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [isVisible]);

  /**
   * Load Leaflet library when visible
   */
  useEffect(() => {
    if (!isVisible) return;

    loadLeafletLibrary();
  }, [isVisible]);

  /**
   * Update map when territory or stores change
   */
  useEffect(() => {
    if (mapInstanceRef.current && window.L) {
      updateMap();
    }
  }, [territory, stores]);

  /**
   * Load Leaflet library from npm package
   */
  async function loadLeafletLibrary() {
    try {
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
   * Initialize Leaflet map with performance optimizations
   */
  function initializeMap() {
    if (!mapRef.current || !window.L) return;

    const coords = TERRITORY_COORDINATES[territory] || TERRITORY_COORDINATES.GP;
    const config = mapConfig.current;

    // Create map with optimized settings
    const map = window.L.map(mapRef.current, {
      zoomAnimation: config.animate,
      fadeAnimation: config.animate,
      markerZoomAnimation: config.animate,
      zoomAnimationThreshold: config.isMobile ? 2 : 4,
      tap: config.isMobile, // Enable tap for mobile
      tapTolerance: config.isMobile ? 30 : 15,
    }).setView([coords.lat, coords.lng], coords.zoom);

    // Add dark CartoDB tiles
    window.L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20,
      updateWhenIdle: config.performanceTier === 'low', // Reduce tile loading on low-end
      keepBuffer: config.isMobile ? 1 : 2, // Reduce buffer on mobile
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
    const config = mapConfig.current;
    
    mapInstanceRef.current.setView(
      [coords.lat, coords.lng], 
      coords.zoom,
      { animate: config.animate, duration: config.zoomAnimationDuration / 1000 }
    );

    // Clear existing markers and add new ones
    updateMarkers(mapInstanceRef.current);
  }

  /**
   * Update markers on the map with viewport-based rendering
   */
  function updateMarkers(map) {
    if (!window.L) return;

    const config = mapConfig.current;

    // Clear existing markers
    markersRef.current.forEach(marker => map.removeLayer(marker));
    markersRef.current = [];

    // Limit markers on mobile for performance
    const visibleStores = config.isMobile 
      ? stores.slice(0, config.maxVisibleMarkers)
      : stores;

    // Add markers for each store
    visibleStores.forEach((store) => {
      if (!store.lat || !store.lng) return;

      const marker = window.L.marker([store.lat, store.lng], {
        // Disable marker animation on low-end devices
        riseOnHover: config.performanceTier !== 'low',
      });

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

      marker.bindPopup(popupContent, {
        // Optimize popup on mobile
        maxWidth: config.isMobile ? 250 : 300,
        autoPan: !config.isMobile, // Disable auto-pan on mobile
      });

      // Add click event
      if (onStoreClick) {
        marker.on('click', () => {
          onStoreClick(store);
        });
      }

      marker.addTo(map);
      markersRef.current.push(marker);
    });

    // Show warning if markers were limited
    if (config.isMobile && stores.length > config.maxVisibleMarkers) {
      console.info(`Showing ${config.maxVisibleMarkers} of ${stores.length} markers for performance`);
    }
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
      // Clear markers
      if (mapInstanceRef.current && markersRef.current.length > 0) {
        markersRef.current.forEach(marker => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.removeLayer(marker);
          }
        });
        markersRef.current = [];
      }
      
      // Remove map
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Show placeholder before map is visible
  if (!isVisible) {
    return (
      <div 
        ref={mapRef}
        className="flex items-center justify-center p-8 bg-gray-100 dark:bg-gray-800 rounded-lg"
        style={{ height: '500px', minHeight: '400px' }}
      >
        <div className="text-center">
          <div className="mb-4 text-4xl">🗺️</div>
          <p className="text-gray-600 dark:text-gray-400">Carte interactive</p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            Se charge au scroll
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div 
        ref={mapRef}
        className="flex items-center justify-center p-8 bg-gray-100 dark:bg-gray-800 rounded-lg"
        style={{ height: '500px', minHeight: '400px' }}
      >
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
      
      {mapConfig.current.isMobile && stores.length > mapConfig.current.maxVisibleMarkers && (
        <div className="absolute bottom-4 left-4 right-4 bg-blue-500/90 text-white px-3 py-2 rounded-lg text-sm shadow-lg">
          ℹ️ {mapConfig.current.maxVisibleMarkers} magasins affichés sur {stores.length} (optimisation mobile)
        </div>
      )}
    </div>
  );
}