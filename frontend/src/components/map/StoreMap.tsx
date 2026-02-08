import { useEffect, useState, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import './map.css';
import { StoreMapProps, StoreMarker as StoreMarkerType, MapFilters as MapFiltersType, RouteResult } from '../../types/map';
import { MAP_CONFIG, getTerritoryConfig } from '../../utils/mapConfig';
import { calculateDistance } from '../../utils/geoUtils';
import { getPriceCategory } from '../../utils/priceColors';
import StoreMarker from './StoreMarker';
import StorePopup from './StorePopup';
import MapLegend from './MapLegend';
import MapFilters from './MapFilters';
import { PriceHeatmap } from './PriceHeatmap';
import { RouteLayer } from './RouteLayer';

interface MarkerClusterGroupProps {
  stores: StoreMarkerType[];
  onStoreClick: (store: StoreMarkerType) => void;
  selectedStore: StoreMarkerType | null;
  onGetDirections?: (store: StoreMarkerType) => void;
  onViewDetails?: (store: StoreMarkerType) => void;
}

function MarkerClusterGroup({
  stores,
  onStoreClick,
  selectedStore,
  onGetDirections,
  onViewDetails,
}: MarkerClusterGroupProps) {
  const map = useMap();

  useEffect(() => {
    if (typeof window === 'undefined' || !window.L || !window.L.markerClusterGroup) {
      return;
    }

    const markerClusterGroup = window.L.markerClusterGroup({
      chunkedLoading: true,
      spiderfyOnMaxZoom: MAP_CONFIG.cluster.spiderfyOnMaxZoom,
      showCoverageOnHover: MAP_CONFIG.cluster.showCoverageOnHover,
      zoomToBoundsOnClick: true,
      maxClusterRadius: MAP_CONFIG.cluster.maxClusterRadius,
      disableClusteringAtZoom: MAP_CONFIG.cluster.disableClusteringAtZoom,
      iconCreateFunction: function (cluster: any) {
        const count = cluster.getChildCount();
        let className = 'marker-cluster-';
        if (count < 10) {
          className += 'small';
        } else if (count < 20) {
          className += 'medium';
        } else {
          className += 'large';
        }

        return L.divIcon({
          html: `<div><span>${count}</span></div>`,
          className: `marker-cluster ${className}`,
          iconSize: L.point(40, 40),
        });
      },
    });

    stores.forEach((store) => {
      const marker = L.marker([store.coordinates.lat, store.coordinates.lon], {
        icon: L.divIcon({
          html: `
            <svg width="32" height="40" viewBox="0 0 32 40" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M16 0C7.163 0 0 7.163 0 16c0 8.837 16 24 16 24s16-15.163 16-24C32 7.163 24.837 0 16 0z"
                fill="${getPriceCategory(store.priceIndex) === 'cheap' ? '#22c55e' : getPriceCategory(store.priceIndex) === 'medium' ? '#f59e0b' : '#ef4444'}"
                stroke="#fff"
                stroke-width="2"
              />
              <circle cx="16" cy="16" r="6" fill="#fff" />
            </svg>
          `,
          className: 'custom-marker',
          iconSize: [32, 40],
          iconAnchor: [16, 40],
          popupAnchor: [0, -40],
        }),
      });

      marker.on('click', () => onStoreClick(store));

      const popupContent = document.createElement('div');
      popupContent.className = 'store-popup-container';

      const renderPopup = () => {
        const priceCategory = getPriceCategory(store.priceIndex);
        const priceConfig = {
          cheap: { icon: '🟢', label: 'Pas cher', color: '#22c55e' },
          medium: { icon: '🟡', label: 'Moyen', color: '#f59e0b' },
          expensive: { icon: '🔴', label: 'Cher', color: '#ef4444' },
        }[priceCategory];

        popupContent.innerHTML = `
          <div class="p-2">
            <div class="mb-3">
              ${store.chainLogo ? `<img src="${store.chainLogo}" alt="${store.chain}" class="h-8 mb-2 object-contain" />` : ''}
              <h3 class="font-semibold text-lg text-slate-900">${store.name}</h3>
              <p class="text-sm text-slate-600">${store.chain}</p>
            </div>
            <div class="mb-3 text-sm text-slate-700">
              <p>${store.address}</p>
              ${store.city && store.postalCode ? `<p>${store.postalCode} ${store.city}</p>` : ''}
            </div>
            <div class="mb-3 p-2 bg-slate-50 rounded">
              <div class="flex items-center justify-between mb-1">
                <span class="text-sm font-medium text-slate-700">Indice de prix</span>
                <span class="text-lg">${priceConfig.icon}</span>
              </div>
              <div class="flex items-baseline gap-2">
                <span class="text-2xl font-bold" style="color: ${priceConfig.color}">${store.priceIndex}</span>
                <span class="text-sm text-slate-600">/100</span>
                <span class="text-xs text-slate-500 ml-auto">${priceConfig.label}</span>
              </div>
              <div class="mt-1 text-sm text-slate-600">
                Panier moyen: <strong>${store.averageBasketPrice.toFixed(2)} €</strong>
              </div>
            </div>
            ${store.distance !== undefined ? `
              <div class="mb-3 text-sm">
                <span class="text-blue-600 font-medium">📍 ${store.distance < 1 ? Math.round(store.distance * 1000) + ' m' : store.distance.toFixed(1) + ' km'}</span>
              </div>
            ` : ''}
            ${store.services && store.services.length > 0 ? `
              <div class="mb-3">
                <p class="text-xs text-slate-600 mb-1">Services:</p>
                <div class="flex flex-wrap gap-1">
                  ${store.services.map(s => `<span class="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">${s}</span>`).join('')}
                </div>
              </div>
            ` : ''}
            <div class="flex gap-2 mt-3">
              <button onclick="window.storeMapGetDirections('${store.id}')" class="flex-1 px-3 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors">
                🧭 Itinéraire
              </button>
              <button onclick="window.storeMapViewDetails('${store.id}')" class="flex-1 px-3 py-2 bg-slate-200 text-slate-800 text-sm rounded hover:bg-slate-300 transition-colors">
                ℹ️ Détails
              </button>
            </div>
          </div>
        `;
      };

      renderPopup();
      marker.bindPopup(popupContent, { maxWidth: 300 });
      markerClusterGroup.addLayer(marker);
    });

    map.addLayer(markerClusterGroup);

    return () => {
      map.removeLayer(markerClusterGroup);
    };
  }, [map, stores, onStoreClick]);

  return null;
}

function UserLocationMarker({ position }: { position: [number, number] }) {
  const map = useMap();

  useEffect(() => {
    const circle = L.circleMarker(position, {
      color: MAP_CONFIG.userLocation.color,
      fillColor: MAP_CONFIG.userLocation.color,
      fillOpacity: MAP_CONFIG.userLocation.fillOpacity,
      radius: MAP_CONFIG.userLocation.radius,
    }).addTo(map);

    return () => {
      map.removeLayer(circle);
    };
  }, [map, position]);

  return null;
}

interface ExtendedStoreMapProps extends StoreMapProps {
  stores?: StoreMarkerType[];
  userPosition?: [number, number];
  selectedStore?: StoreMarkerType | null;
  route?: RouteResult | null;
  filters?: MapFiltersType;
  onFilterChange?: (filters: MapFiltersType) => void;
  onStoreClick?: (store: StoreMarkerType) => void;
  onGetDirections?: (store: StoreMarkerType) => void;
  onClearRoute?: () => void;
}

export default function StoreMap({
  territory,
  chains,
  center,
  zoom,
  showUserLocation = false,
  showHeatmap = false,
  radius = MAP_CONFIG.defaultRadius,
  stores: storesProp = [],
  userPosition: userPositionProp,
  selectedStore: selectedStoreProp = null,
  route = null,
  filters: filtersProp,
  onFilterChange,
  onStoreClick: onStoreClickProp,
  onGetDirections: onGetDirectionsProp,
  onClearRoute,
}: ExtendedStoreMapProps) {
  const [stores, setStores] = useState<StoreMarkerType[]>(storesProp);
  const [selectedStore, setSelectedStore] = useState<StoreMarkerType | null>(selectedStoreProp);
  const [userPosition, setUserPosition] = useState<[number, number] | null>(userPositionProp || null);
  const [filters, setFilters] = useState<MapFiltersType>(filtersProp || {
    territory: territory || null,
    chains: chains || [],
    priceCategory: [],
    services: [],
    radius: radius,
    onlyOpen: false,
  });

  // Update state when props change
  useEffect(() => {
    if (storesProp) setStores(storesProp);
  }, [storesProp]);

  useEffect(() => {
    if (selectedStoreProp !== undefined) setSelectedStore(selectedStoreProp);
  }, [selectedStoreProp]);

  useEffect(() => {
    if (userPositionProp) setUserPosition(userPositionProp);
  }, [userPositionProp]);

  useEffect(() => {
    if (filtersProp) setFilters(filtersProp);
  }, [filtersProp]);

  // Load leaflet markercluster dynamically
  useEffect(() => {
    const loadMarkerCluster = async () => {
      if (typeof window !== 'undefined' && !window.L?.markerClusterGroup) {
        try {
          await import('leaflet.markercluster');
        } catch (error) {
          console.error('Failed to load markercluster:', error);
        }
      }
    };

    loadMarkerCluster();
  }, []);

  // Get user location
  useEffect(() => {
    if (showUserLocation && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserPosition([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.error('Geolocation error:', error);
        }
      );
    }
  }, [showUserLocation]);

  // Determine map center
  const mapCenter = useMemo(() => {
    if (center) return center;
    if (userPosition) return userPosition;
    if (territory) {
      const config = getTerritoryConfig(territory);
      if (config) return [config.center[0], config.center[1]] as [number, number];
    }
    return MAP_CONFIG.defaultCenter;
  }, [center, userPosition, territory]);

  // Determine map zoom
  const mapZoom = useMemo(() => {
    if (zoom) return zoom;
    if (territory) {
      const config = getTerritoryConfig(territory);
      if (config) return config.zoom;
    }
    return MAP_CONFIG.defaultZoom;
  }, [zoom, territory]);

  // Filter stores
  const filteredStores = useMemo(() => {
    let result = stores;

    // Filter by territory
    if (filters.territory) {
      result = result.filter((s) => s.territory === filters.territory);
    }

    // Filter by chains
    if (filters.chains.length > 0) {
      result = result.filter((s) => filters.chains.includes(s.chain));
    }

    // Filter by price category
    if (filters.priceCategory.length > 0) {
      result = result.filter((s) =>
        filters.priceCategory.includes(s.priceCategory)
      );
    }

    // Filter by services
    if (filters.services.length > 0) {
      result = result.filter((s) =>
        filters.services.every((service) => s.services.includes(service))
      );
    }

    // Filter by radius
    if (userPosition && filters.radius) {
      result = result.filter((s) => {
        const distance = calculateDistance(
          userPosition[0],
          userPosition[1],
          s.coordinates.lat,
          s.coordinates.lon
        );
        return distance <= filters.radius;
      });
    }

    // Filter by open status
    if (filters.onlyOpen) {
      result = result.filter((s) => s.isOpen === true);
    }

    return result;
  }, [stores, filters, userPosition]);

  // Extract available options for filters
  const availableChains = useMemo(() => {
    return Array.from(new Set(stores.map((s) => s.chain))).sort();
  }, [stores]);

  const availableServices = useMemo(() => {
    return Array.from(new Set(stores.flatMap((s) => s.services))).sort();
  }, [stores]);

  // Handle store click
  const handleStoreClick = useCallback((store: StoreMarkerType) => {
    setSelectedStore(store);
    onStoreClickProp?.(store);
  }, [onStoreClickProp]);

  // Handle get directions
  const handleGetDirections = useCallback((store: StoreMarkerType) => {
    if (onGetDirectionsProp) {
      onGetDirectionsProp(store);
    } else {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${store.coordinates.lat},${store.coordinates.lon}`;
      window.open(url, '_blank');
    }
  }, [onGetDirectionsProp]);

  // Handle view details
  const handleViewDetails = useCallback((store: StoreMarkerType) => {
    console.log('View details for store:', store);
  }, []);

  // Setup global callbacks for popup buttons
  useEffect(() => {
    (window as any).storeMapGetDirections = (storeId: string) => {
      const store = stores.find((s) => s.id === storeId);
      if (store) handleGetDirections(store);
    };

    (window as any).storeMapViewDetails = (storeId: string) => {
      const store = stores.find((s) => s.id === storeId);
      if (store) handleViewDetails(store);
    };

    return () => {
      delete (window as any).storeMapGetDirections;
      delete (window as any).storeMapViewDetails;
    };
  }, [stores, handleGetDirections, handleViewDetails]);

  // Handle filter changes
  const handleFilterChange = useCallback((newFilters: MapFiltersType) => {
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  }, [onFilterChange]);

  // Prepare heatmap data
  const heatmapData = useMemo(() => {
    if (!showHeatmap) return [];
    return filteredStores.map(store => ({
      lat: store.coordinates.lat,
      lon: store.coordinates.lon,
      intensity: store.priceIndex / 100, // Normalize 0-100 to 0-1
    }));
  }, [showHeatmap, filteredStores]);

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        className="w-full h-full"
        scrollWheelZoom={true}
        zoomControl={true}
      >
        <TileLayer
          url={MAP_CONFIG.tileLayer.url}
          attribution={MAP_CONFIG.tileLayer.attribution}
          maxZoom={MAP_CONFIG.tileLayer.maxZoom}
        />

        {showUserLocation && userPosition && (
          <UserLocationMarker position={userPosition} />
        )}

        <MarkerClusterGroup
          stores={filteredStores}
          onStoreClick={handleStoreClick}
          selectedStore={selectedStore}
          onGetDirections={handleGetDirections}
          onViewDetails={handleViewDetails}
        />

        {showHeatmap && heatmapData.length > 0 && (
          <PriceHeatmap points={heatmapData} />
        )}

        {route && (
          <RouteLayer route={route} onClear={onClearRoute} />
        )}
      </MapContainer>

      {!filtersProp && (
        <MapFilters
          filters={filters}
          availableChains={availableChains}
          availableServices={availableServices}
          onFiltersChange={handleFilterChange}
        />
      )}

      <MapLegend />
    </div>
  );
}
