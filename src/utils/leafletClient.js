let leafletPromise;

const isBrowser = typeof window !== 'undefined';

export async function loadLeaflet() {
  if (!isBrowser) {
    return null;
  }

  if (!leafletPromise) {
    leafletPromise = Promise.all([
      import('leaflet'),
      import('leaflet/dist/leaflet.css'),
    ]).then(([leafletModule]) => leafletModule.default ?? leafletModule);
  }

  return leafletPromise;
}

export async function loadLeafletWithMarkerCluster() {
  if (!isBrowser) {
    return null;
  }

  const leaflet = await loadLeaflet();
  await import('leaflet.markercluster');

  return leaflet;
}
