/**
 * MapPage Component
 * Main page for the interactive store map
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import StoreMap from '../components/map/StoreMap';
import { ZoneRanking } from '../components/map/ZoneRanking';
import { NearbyStoresList } from '../components/map/NearbyStoresList';
import { useGeolocation } from '../hooks/useGeolocation';
import { useNearbyStores } from '../hooks/useNearbyStores';
import { useRoute } from '../hooks/useRoute';
import { StoreMarker, MapFilters } from '../types/map';
import { getTerritoryConfig } from '../utils/mapConfig';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function MapPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [allStores, setAllStores] = useState<StoreMarker[]>([]);
  const [filteredStores, setFilteredStores] = useState<StoreMarker[]>([]);
  const [selectedStore, setSelectedStore] = useState<StoreMarker | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Get territory from URL or default
  const initialTerritory = searchParams.get('territory') || 'GP';
  const [filters, setFilters] = useState<MapFilters>({
    territory: initialTerritory,
    chains: [],
    priceCategory: [],
    services: [],
    radius: 10,
    onlyOpen: false,
  });

  // Geolocation
  const {
    position: userPosition,
    requestLocation,
    loading: geoLoading,
    error: geoError,
  } = useGeolocation();

  // Nearby stores
  const nearbyOptions = userPosition
    ? {
        lat: userPosition.lat,
        lon: userPosition.lon,
        radius: filters.radius,
        chains: filters.chains,
        sortBy: 'distance' as const,
      }
    : null;

  const { stores: nearbyStores } = useNearbyStores(nearbyOptions);

  // Route
  const { route, calculateRoute, clearRoute } = useRoute();

  // Load all stores
  useEffect(() => {
    const fetchStores = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (filters.territory) {
          params.append('territory', filters.territory);
        }
        if (filters.chains.length > 0) {
          params.append('chains', filters.chains.join(','));
        }

        const response = await fetch(
          `${API_BASE_URL}/api/map/stores?${params.toString()}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch stores');
        }

        const data = await response.json();

        if (data.success && data.data && data.data.stores) {
          setAllStores(data.data.stores);
        } else {
          throw new Error('Invalid response format');
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to fetch stores';
        setError(errorMessage);
        console.error('Error fetching stores:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStores();
  }, [filters.territory, filters.chains]);

  // Apply filters
  useEffect(() => {
    let filtered = [...allStores];

    // Filter by price category
    if (filters.priceCategory.length > 0) {
      filtered = filtered.filter(store =>
        filters.priceCategory.includes(store.priceCategory)
      );
    }

    // Filter by services
    if (filters.services.length > 0) {
      filtered = filtered.filter(store =>
        filters.services.some(service => store.services.includes(service))
      );
    }

    // Filter by open status
    if (filters.onlyOpen) {
      filtered = filtered.filter(store => store.isOpen === true);
    }

    // Add distances if user position available
    if (userPosition) {
      const calculateDistance = (
        lat1: number,
        lon1: number,
        lat2: number,
        lon2: number
      ) => {
        const R = 6371;
        const dLat = ((lat2 - lat1) * Math.PI) / 180;
        const dLon = ((lon2 - lon1) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
      };

      filtered = filtered.map(store => ({
        ...store,
        distance: calculateDistance(
          userPosition.lat,
          userPosition.lon,
          store.coordinates.lat,
          store.coordinates.lon
        ),
      }));
    }

    setFilteredStores(filtered);
  }, [allStores, filters, userPosition]);

  // Handle filter changes
  const handleFilterChange = (newFilters: Partial<MapFilters>) => {
    const updated = { ...filters, ...newFilters };
    setFilters(updated);

    // Update URL
    if (updated.territory) {
      setSearchParams({ territory: updated.territory });
    }
  };

  // Handle store selection
  const handleStoreClick = (store: StoreMarker) => {
    setSelectedStore(store);
  };

  // Handle get directions
  const handleGetDirections = (store: StoreMarker) => {
    if (userPosition) {
      calculateRoute(
        [userPosition.lat, userPosition.lon],
        [store.coordinates.lat, store.coordinates.lon]
      );
      setSelectedStore(store);
    } else {
      requestLocation();
    }
  };

  // Get map center
  const getMapCenter = (): [number, number] => {
    if (userPosition) {
      return [userPosition.lat, userPosition.lon];
    }
    if (filters.territory) {
      const config = getTerritoryConfig(filters.territory);
      if (config) {
        return config.center;
      }
    }
    return [16.25, -61.55]; // Default to Guadeloupe
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                🗺️ Carte des Magasins
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Trouvez les magasins les moins chers près de chez vous
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Location button */}
              <button
                onClick={requestLocation}
                disabled={geoLoading}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {geoLoading ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    <span>Localisation...</span>
                  </>
                ) : (
                  <>
                    <span>📍</span>
                    <span className="hidden sm:inline">Ma position</span>
                  </>
                )}
              </button>

              {/* Heatmap toggle */}
              <button
                onClick={() => setShowHeatmap(!showHeatmap)}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  showHeatmap
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <span>🔥</span>
                <span className="hidden sm:inline">Heatmap</span>
              </button>

              {/* Sidebar toggle (mobile) */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                {sidebarOpen ? '✕' : '☰'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`bg-white border-r border-gray-200 w-full lg:w-96 overflow-y-auto transition-transform ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          } absolute lg:relative z-20 h-full`}
        >
          <div className="p-4 space-y-4">
            {geoError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                {geoError}
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Zone ranking */}
            {filteredStores.length > 0 && (
              <ZoneRanking
                stores={filteredStores}
                userPosition={
                  userPosition
                    ? [userPosition.lat, userPosition.lon]
                    : undefined
                }
                limit={5}
                onStoreClick={handleStoreClick}
              />
            )}

            {/* Nearby stores */}
            {nearbyStores.length > 0 && (
              <NearbyStoresList
                stores={nearbyStores}
                onStoreClick={handleStoreClick}
                onGetDirections={handleGetDirections}
              />
            )}

            {/* Stats */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                📊 Statistiques
              </h3>
              <div className="space-y-1 text-sm text-gray-600">
                <div>
                  Total magasins:{' '}
                  <strong className="text-gray-900">{allStores.length}</strong>
                </div>
                <div>
                  Affichés:{' '}
                  <strong className="text-gray-900">
                    {filteredStores.length}
                  </strong>
                </div>
                {nearbyStores.length > 0 && (
                  <div>
                    À proximité:{' '}
                    <strong className="text-gray-900">
                      {nearbyStores.length}
                    </strong>
                  </div>
                )}
              </div>
            </div>
          </div>
        </aside>

        {/* Map */}
        <main className="flex-1 relative">
          {loading ? (
            <div className="h-full flex items-center justify-center bg-gray-100">
              <div className="text-center">
                <div className="text-4xl mb-4">🗺️</div>
                <div className="text-lg text-gray-600">
                  Chargement de la carte...
                </div>
              </div>
            </div>
          ) : (
            <StoreMap
              stores={filteredStores}
              center={getMapCenter()}
              showHeatmap={showHeatmap}
              showUserLocation={!!userPosition}
              userPosition={
                userPosition
                  ? [userPosition.lat, userPosition.lon]
                  : undefined
              }
              selectedStore={selectedStore}
              route={route}
              filters={filters}
              onFilterChange={handleFilterChange}
              onStoreClick={handleStoreClick}
              onGetDirections={handleGetDirections}
              onClearRoute={clearRoute}
            />
          )}
        </main>
      </div>
    </div>
  );
}
