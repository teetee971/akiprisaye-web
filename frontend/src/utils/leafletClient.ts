const isBrowser = typeof window !== 'undefined';

let leafletPromise: Promise<typeof import('leaflet') | null> | null = null;

/**
 * Lazily load Leaflet and its CSS.
 * Returns the Leaflet default export, or null when running server-side.
 */
export async function loadLeaflet(): Promise<typeof import('leaflet') | null> {
  if (!isBrowser) return null;

  if (!leafletPromise) {
    leafletPromise = Promise.all([
      import('leaflet'),
      // CSS import resolved by Vite bundler at build time
      import('leaflet/dist/leaflet.css') as Promise<unknown>,
    ]).then(
      ([leafletModule]) => (leafletModule.default ?? leafletModule) as typeof import('leaflet')
    );
  }

  return leafletPromise;
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
