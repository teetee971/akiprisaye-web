/**
 * MarkerClusterLayer — wraps leaflet.markercluster for react-leaflet v5
 *
 * Renders store markers inside a Leaflet MarkerClusterGroup to avoid
 * cluttered pins when many stores are visible at once.
 */

import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.markercluster';
import { getMarkerColor } from '../../utils/priceColors';

// leaflet.markercluster augments the L namespace at runtime but has no @types.
// We access it through a typed cast.
interface MarkerClusterGroup extends L.LayerGroup {
  clearLayers(): this;
  addLayer(layer: L.Layer): this;
}

type LWithCluster = typeof L & {
  markerClusterGroup(options?: Record<string, unknown>): MarkerClusterGroup;
};

interface StorePoint {
  id: string;
  name: string;
  chain: string;
  lat: number;
  lon: number;
  priceIndex?: number;
  address?: string;
}

interface MarkerClusterLayerProps {
  stores: StorePoint[];
  onMarkerClick?: (store: StorePoint) => void;
}

export default function MarkerClusterLayer({ stores, onMarkerClick }: MarkerClusterLayerProps) {
  const map = useMap();
  const clusterGroupRef = useRef<MarkerClusterGroup | null>(null);

  useEffect(() => {
    const clusterGroup = (L as LWithCluster).markerClusterGroup({
      maxClusterRadius: 60,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
    });
    clusterGroupRef.current = clusterGroup;
    map.addLayer(clusterGroup);

    return () => {
      map.removeLayer(clusterGroup);
    };
  }, [map]);

  useEffect(() => {
    const clusterGroup = clusterGroupRef.current;
    if (!clusterGroup) return;

    clusterGroup.clearLayers();

    stores.forEach((store) => {
      const color = getMarkerColor(store.priceIndex ?? 50);
      const icon = L.divIcon({
        html: `
          <svg width="28" height="36" viewBox="0 0 32 40" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 0C7.163 0 0 7.163 0 16c0 8.837 16 24 16 24s16-15.163 16-24C32 7.163 24.837 0 16 0z"
              fill="${color}" stroke="#fff" stroke-width="2"/>
            <circle cx="16" cy="16" r="6" fill="#fff"/>
          </svg>`,
        className: 'custom-marker',
        iconSize: [28, 36],
        iconAnchor: [14, 36],
        popupAnchor: [0, -36],
      });

      const marker = L.marker([store.lat, store.lon], { icon });

      const popupContent = `
        <div style="font-size:13px;min-width:120px">
          <strong>${store.name}</strong><br/>
          <span style="color:#6b7280">${store.chain}</span>
          ${store.address ? `<br/><small>${store.address}</small>` : ''}
        </div>`;
      marker.bindPopup(popupContent);

      if (onMarkerClick) {
        marker.on('click', () => onMarkerClick(store));
      }

      clusterGroup.addLayer(marker);
    });
  }, [stores, onMarkerClick]);

  return null;
}
