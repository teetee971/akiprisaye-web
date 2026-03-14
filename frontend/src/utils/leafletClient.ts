import type { Map as LeafletMap } from 'leaflet';

const isBrowser = typeof window !== 'undefined';

let leafletPromise: Promise<LeafletMap['constructor'] | null> | null = null;

/**
 * Lazily load Leaflet and its CSS.
 * Returns the Leaflet default export, or null when running server-side.
 */
export async function loadLeaflet(): Promise<typeof import('leaflet') | null> {
  if (!isBrowser) return null;

  if (!leafletPromise) {
    leafletPromise = Promise.all([
      import('leaflet'),
      // @ts-expect-error — CSS import resolved by Vite
      import('leaflet/dist/leaflet.css'),
    ]).then(([leafletModule]) => (leafletModule.default ?? leafletModule) as typeof import('leaflet'));
  }

  return leafletPromise as Promise<typeof import('leaflet') | null>;
}

/**
 * Lazily load Leaflet together with the MarkerCluster plugin.
 * Returns the Leaflet default export, or null when running server-side.
 */
export async function loadLeafletWithMarkerCluster(): Promise<typeof import('leaflet') | null> {
  if (!isBrowser) return null;

  const leaflet = await loadLeaflet();
  await import('leaflet.markercluster');

  return leaflet;
}
