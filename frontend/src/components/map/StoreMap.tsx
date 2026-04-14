/**
 * StoreMap Component
 * Main container for the interactive store map with clustering and filters
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.markercluster';
import { Loader2 } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

import MapFilters from './MapFilters';
import PriceHeatmap from './PriceHeatmap';
import NearbyStoresList from './NearbyStoresList';
import { useGeolocation } from '../../hooks/useGeolocation';
import { useNearbyStores } from '../../hooks/useNearbyStores';
import { getStoreHours } from '../../services/storeHoursService';
import { isStoreOpen } from '../../utils/storeHoursUtils';

interface Store {
  id: string;
  name: string;
  chain: string;
  lat: number;
  lon: number;
  address?: string;
  city?: string;
  territory?: string;
  priceIndex?: number;
  priceCategory?: 'cheap' | 'medium' | 'expensive';
}

interface HeatmapPoint {
  lat: number;
  lon: number;
  intensity: number;
}

interface StoreMapProps {
  initialTerritory?: string;
  initialCenter?: [number, number];
  initialZoom?: number;
  enableClustering?: boolean;
  enableHeatmap?: boolean;
  showFilters?: boolean;
  showNearbyList?: boolean;
}

/** Minimal interface for leaflet.markercluster (no @types available) */
interface MarkerClusterGroupInstance extends L.FeatureGroup {
  clearLayers(): this;
  addLayer(layer: L.Layer): this;
}

type LWithCluster = typeof L & {
  markerClusterGroup: (opts?: object) => MarkerClusterGroupInstance;
};

const DEFAULT_CENTER: [number, number] = [16.265, -61.551]; // Guadeloupe
const DEFAULT_ZOOM = 11;

/** Escape HTML special characters to prevent XSS in Leaflet popups. */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * MarkerClusterLayer — renders store markers using leaflet.markercluster.
 * Mounted inside <MapContainer> so it has access to the Leaflet map instance.
 */
function MarkerClusterLayer({
  stores,
  onStoreClick,
}: {
  stores: Store[];
  onStoreClick: (store: Store) => void;
}) {
  const map = useMap();
  const clusterGroupRef = useRef<MarkerClusterGroupInstance | null>(null);

  useEffect(() => {
    // Create or reuse the cluster group
    if (!clusterGroupRef.current) {
      clusterGroupRef.current = (L as unknown as LWithCluster).markerClusterGroup({
        chunkedLoading: true,
        maxClusterRadius: 60,
      });
      map.addLayer(clusterGroupRef.current);
    }

    const group = clusterGroupRef.current;
    group.clearLayers();

    stores.forEach((store) => {
      const marker = L.marker([store.lat, store.lon]);
      const label = store.priceIndex != null
        ? `${store.name} — indice ${store.priceIndex}`
        : store.name;
      marker.bindPopup(
        `<strong>${escapeHtml(store.name)}</strong><br/>${escapeHtml(store.address ?? '')}<br/>${escapeHtml(label)}`,
      );
      marker.on('click', () => onStoreClick(store));
      group.addLayer(marker);
    });

    return () => {
      group.clearLayers();
    };
  }, [map, stores, onStoreClick]);

  // Clean up on unmount
  useEffect(() => {
    const group = clusterGroupRef.current;
    return () => {
      if (group) {
        map.removeLayer(group);
      }
      clusterGroupRef.current = null;
    };
  }, [map]);

  return null;
}

/**
 * MapController - handles map interactions
 */
function MapController({
  center,
  zoom,
}: {
  center: [number, number];
  zoom: number;
}) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center, zoom]);

  return null;
}

/**
 * StoreMap - Main map component
 */
export function StoreMap({
  initialTerritory = 'GP',
  initialCenter = DEFAULT_CENTER,
  initialZoom = DEFAULT_ZOOM,
  enableClustering: _enableClustering = true,
  enableHeatmap = false,
  showFilters = true,
  showNearbyList = true,
}: StoreMapProps) {
  const [territory, setTerritory] = useState(initialTerritory);
  const [selectedChains, setSelectedChains] = useState<string[]>([]);
  const [priceCategory, setPriceCategory] = useState<
    'all' | 'cheap' | 'medium' | 'expensive'
  >('all');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [radius, setRadius] = useState(10);
  const [openOnly, setOpenOnly] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(enableHeatmap);
  const [mapCenter, setMapCenter] = useState<[number, number]>(initialCenter);
  const [mapZoom, setMapZoom] = useState(initialZoom);

  // Geolocation
  const { position, permission, requestPermission } = useGeolocation({
    enableHighAccuracy: true,
    continuous: false,
  });

  // Nearby stores
  const {
    stores: nearbyStores,
    loading: loadingStores,
    error: storesError,
    fetchStores,
  } = useNearbyStores({
    lat: position?.lat,
    lon: position?.lon,
    radius,
    chains: selectedChains.length > 0 ? selectedChains : undefined,
    autoFetch: false,
  });

  // Update map center when position changes
  useEffect(() => {
    if (position) {
      setMapCenter([position.lat, position.lon]);
      setMapZoom(13);
    }
  }, [position]);

  // Fetch stores when position or filters change
  useEffect(() => {
    if (position) {
      fetchStores();
    }
  }, [position, radius, selectedChains, fetchStores]);

  // Mock heatmap data (replace with actual API call)
  const heatmapPoints: HeatmapPoint[] = nearbyStores.map((store) => ({
    lat: store.lat,
    lon: store.lon,
    intensity: store.priceIndex ? store.priceIndex / 100 : 0.5,
  }));

  // Filter stores by open status when openOnly is enabled
  const displayedStores = useMemo(() => {
    if (!openOnly) return nearbyStores;
    return nearbyStores.filter((store) => {
      const hours = getStoreHours(store.id, store.territory);
      if (!hours) return false;
      const status = isStoreOpen(hours);
      return status.status === 'open' || status.status === 'closing_soon';
    });
  }, [nearbyStores, openOnly]);

  const handleStoreClick = useCallback((store: Store) => {
    setMapCenter([store.lat, store.lon]);
    setMapZoom(15);
  }, []);

  const handleNavigate = useCallback((store: Store) => {
    // Open navigation in external app
    const url = `https://www.google.com/maps/dir/?api=1&destination=${store.lat},${store.lon}`;
    window.open(url, '_blank');
  }, []);

  return (
    <div className="flex flex-col h-screen">
      {/* Filters */}
      {showFilters && (
        <div className="p-4 bg-gray-50">
          <MapFilters
            territory={territory}
            onTerritoryChange={setTerritory}
            chains={selectedChains}
            onChainsChange={setSelectedChains}
            priceCategory={priceCategory}
            onPriceCategoryChange={setPriceCategory}
            services={selectedServices}
            onServicesChange={setSelectedServices}
            radius={radius}
            onRadiusChange={setRadius}
            openOnly={openOnly}
            onOpenOnlyChange={setOpenOnly}
          />
        </div>
      )}

      {/* Map and List Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Map */}
        <div className="flex-1 relative">
          <MapContainer
            center={initialCenter}
            zoom={initialZoom}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <MapController center={mapCenter} zoom={mapZoom} />

            {/* Heatmap Layer */}
            {showHeatmap && heatmapPoints.length > 0 && (
              <PriceHeatmap points={heatmapPoints} visible={showHeatmap} />
            )}

            {/* Marker Cluster Layer */}
            {displayedStores.length > 0 && (
              <MarkerClusterLayer
                stores={displayedStores}
                onStoreClick={handleStoreClick}
              />
            )}
          </MapContainer>

          {/* Locate Me Button */}
          {permission !== 'granted' && (
            <div className="absolute bottom-4 left-4 z-[1000]">
              <button
                type="button"
                onClick={requestPermission}
                className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-lg shadow-lg font-medium hover:bg-gray-100 transition-colors"
              >
                📍 Me localiser
              </button>
            </div>
          )}

          {/* Heatmap Toggle */}
          {enableHeatmap && (
            <div className="absolute top-4 right-4 z-[1000]">
              <button
                onClick={() => setShowHeatmap(!showHeatmap)}
                className={`px-4 py-2 rounded-lg shadow-lg font-medium transition-colors ${
                  showHeatmap
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {showHeatmap ? '🗺️ Carte normale' : '🔥 Carte thermique'}
              </button>
            </div>
          )}

          {/* Loading Overlay */}
          {loadingStores && (
            <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-[1000]">
              <div className="flex items-center gap-2 text-blue-600">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span>Chargement des magasins...</span>
              </div>
            </div>
          )}
        </div>

        {/* Nearby Stores List */}
        {showNearbyList && position && (
          <div className="w-96 bg-white border-l overflow-y-auto p-4">
            <h2 className="text-xl font-bold mb-4">
              Magasins à proximité
              {displayedStores.length > 0 && (
                <span className="ml-2 text-sm font-normal text-gray-600">
                  ({displayedStores.length}{openOnly && nearbyStores.length !== displayedStores.length ? ` ouverts sur ${nearbyStores.length}` : ''})
                </span>
              )}
            </h2>

            {storesError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <p className="text-red-800 text-sm">{storesError}</p>
              </div>
            )}

            <NearbyStoresList
              stores={displayedStores}
              sortBy="distance"
              onStoreClick={handleStoreClick}
              onNavigate={handleNavigate}
              showPrices={true}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default StoreMap;
