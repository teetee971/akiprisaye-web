// Service Worker — A KI PRI SA YÉ
// Objectifs :
// - PAS de precache index.html (conforme au test)
// - API toujours "no-store" (pas de cache)
// - Documents (navigate / document) en network-first avec fallback '/'
// - Assets fingerprintés en cache-first
// - Territoires JSON en cache-first (si présent)
// - Nettoyage des anciens caches + skipWaiting/clients.claim

/* eslint-disable no-restricted-globals */

const CACHE_VERSION = 'v2';

const CORE_CACHE = `akiprisaye-core-${CACHE_VERSION}`;
const ASSET_CACHE = `akiprisaye-assets-${CACHE_VERSION}`;
const TERRITORY_CACHE = `akiprisaye-territories-${CACHE_VERSION}`;

// Important : ne pas inclure index.html ici (sinon le test échoue)
const BASE_PATH = '/akiprisaye-web/';
const CORE_ASSETS = [BASE_PATH, `${BASE_PATH}manifest.webmanifest`];

// Patterns
const TERRITORY_JSON_PATTERN = /\/data\/territories\/.*\.json$/;
const FINGERPRINTED_ASSET_PATTERN =
  /\/assets\/.+\.[a-f0-9]{8,}\.(js|css|png|jpg|jpeg|gif|svg|webp|woff2?)$/i;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CORE_CACHE).then((cache) => cache.addAll(CORE_ASSETS)),
  );
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

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response && response.ok) {
    cache.put(request, response.clone());
  }
  return response;
}

async function networkFirst(request, cacheName, fallbackUrl = '/') {
  const cache = await caches.open(cacheName);
  try {
    // NOTE : on ne force pas cache:'no-store' ici, car on veut pouvoir tirer profit du cache
    const response = await fetch(request);

    // Respect des headers : si no-store/no-cache, on ne persiste pas en cache
    const cacheControl = (response.headers.get('cache-control') || '').toLowerCase();
    const shouldBypassCache =
      cacheControl.includes('no-store') || cacheControl.includes('no-cache');

    if (response && response.ok && !shouldBypassCache) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const cached = await cache.match(request);
    if (cached) return cached;

    // fallback SPA
    const fallback = await cache.match(fallbackUrl);
    if (fallback) return fallback;

    // dernier recours : renvoyer une réponse minimale
    return new Response('Offline', { status: 503, statusText: 'Offline' });
  }
}

self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Ne traite que les GET
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // 1) API : toujours no-store (conforme au test)
  if (url.origin === self.location.origin && url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(request, { cache: 'no-store' }));
    return;
  }

  // 2) Territoires JSON (si présent)
  if (TERRITORY_JSON_PATTERN.test(url.pathname)) {
    event.respondWith(cacheFirst(request, TERRITORY_CACHE));
    return;
  }

  // 3) Assets fingerprintés : cache-first
  if (FINGERPRINTED_ASSET_PATTERN.test(url.pathname)) {
    event.respondWith(cacheFirst(request, ASSET_CACHE));
    return;
  }

  // 4) Documents / navigation : network-first + fallback SPA "/"
  if (request.destination === 'document' || event.request.mode === 'navigate') {
    event.respondWith(networkFirst(request, CORE_CACHE, '/'));
    return;
  }

  // 5) Le reste : network-first léger
  event.respondWith(networkFirst(request, CORE_CACHE, '/'));
});