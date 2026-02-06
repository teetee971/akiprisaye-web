const CACHE_VERSION = 'v2';
const CORE_CACHE = `akiprisaye-core-${CACHE_VERSION}`;
const ASSET_CACHE = `akiprisaye-assets-${CACHE_VERSION}`;
const TERRITORY_CACHE = `akiprisaye-territories-${CACHE_VERSION}`;

const CORE_ASSETS = ['/', '/manifest.json'];
const TERRITORY_JSON_PATTERN = /\/data\/territories\/.*\.json$/;
const FINGERPRINTED_ASSET_PATTERN = /\/assets\/.+\.[a-f0-9]{8,}\.(js|css|png|jpg|jpeg|gif|svg|webp|woff2?)$/i;

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CORE_CACHE).then((cache) => cache.addAll(CORE_ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => ![CORE_CACHE, ASSET_CACHE, TERRITORY_CACHE].includes(key))
          .map((key) => caches.delete(key)),
      ),
    ),
  );
  self.clients.claim();
});

const cacheFirst = async (request, cacheName) => {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) {
    return cached;
  }
  const response = await fetch(request);
  if (response.ok) {
    cache.put(request, response.clone());
  }
  return response;
};

const networkFirst = async (request, cacheName, fallbackUrl = '/') => {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
    return cache.match(fallbackUrl);
  }
};

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  const url = new URL(event.request.url);

  if (TERRITORY_JSON_PATTERN.test(url.pathname)) {
    event.respondWith(cacheFirst(event.request, TERRITORY_CACHE));
    return;
  }

  if (FINGERPRINTED_ASSET_PATTERN.test(url.pathname)) {
    event.respondWith(cacheFirst(event.request, ASSET_CACHE));
    return;
  }

  if (event.request.mode === 'navigate') {
    event.respondWith(networkFirst(event.request, CORE_CACHE));
    return;
  }

  event.respondWith(networkFirst(event.request, CORE_CACHE));
});
