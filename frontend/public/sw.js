// Service Worker — A KI PRI SA YÉ
// Objectifs :
// - PAS de precache index.html (conforme au test)
// - API toujours "no-store" (pas de cache)
// - Documents (navigate / document) en network-first avec fallback '/'
// - Assets fingerprintés en cache-first
// - Territoires JSON en cache-first (si présent)
// - Données JSON (fuel, catalogue, etc.) en stale-while-revalidate
// - Nettoyage des anciens caches + skipWaiting/clients.claim

/* eslint-disable no-restricted-globals */

const CACHE_VERSION = 'v3';

const CORE_CACHE = `akiprisaye-core-${CACHE_VERSION}`;
const ASSET_CACHE = `akiprisaye-assets-${CACHE_VERSION}`;
const TERRITORY_CACHE = `akiprisaye-territories-${CACHE_VERSION}`;
const DATA_CACHE = `akiprisaye-data-${CACHE_VERSION}`;

// Important : ne pas inclure index.html ici (sinon le test échoue)
const BASE_PATH = '/akiprisaye-web/';
const CORE_ASSETS = [BASE_PATH, `${BASE_PATH}manifest.webmanifest`];

// Patterns
const TERRITORY_JSON_PATTERN = /\/data\/territories\/.*\.json$/;
const FINGERPRINTED_ASSET_PATTERN =
  /\/assets\/.+\.[a-f0-9]{8,}\.(js|css|png|jpg|jpeg|gif|svg|webp|woff2?)$/i;
// Fichiers de données mis à jour par le scraper (stale-while-revalidate)
const DATA_JSON_PATTERN =
  /\/data\/(fuel-prices|catalogue-prices|open-prices-dom|fresh-prices|bqp-prices|services-prices|loyer-prices|medicaments-prices|octroi-mer|com-prices|grossistes-prices|scraping-health)\.json$/;

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
          .filter((key) => ![CORE_CACHE, ASSET_CACHE, TERRITORY_CACHE, DATA_CACHE].includes(key))
          .map((key) => caches.delete(key)),
      ),
    ),
  );
  self.clients.claim();
});

/**
 * staleWhileRevalidate — sert le cache immédiatement et met à jour en arrière-plan.
 * Idéal pour les fichiers JSON de données fréquemment mis à jour.
 * Stocke aussi l'horodatage de la réponse réseau pour permettre à l'UI
 * d'afficher "données du [date]" en mode hors-ligne.
 */
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  // Lance le fetch en arrière-plan pour mettre à jour le cache
  const fetchPromise = fetch(request)
    .then(async (response) => {
      if (response && response.ok) {
        // Ajoute un header personnalisé pour mémoriser la date de récupération
        const headers = new Headers(response.headers);
        headers.set('x-sw-fetched-at', new Date().toISOString());
        const cloned = response.clone();
        // Reconstruit avec le header enrichi
        const body = await cloned.text();
        const enriched = new Response(body, {
          status: response.status,
          statusText: response.statusText,
          headers,
        });
        await cache.put(request, enriched);
      }
      return response;
    })
    .catch(() => new Response(null, { status: 503, statusText: 'Offline' }));

  // Sert le cache si disponible, sinon attend le réseau
  if (cached) {
    return cached;
  }
  return fetchPromise;
}

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

  // 2) Données JSON scraper (stale-while-revalidate)
  if (DATA_JSON_PATTERN.test(url.pathname)) {
    event.respondWith(staleWhileRevalidate(request, DATA_CACHE));
    return;
  }

  // 3) Territoires JSON (cache-first)
  if (TERRITORY_JSON_PATTERN.test(url.pathname)) {
    event.respondWith(cacheFirst(request, TERRITORY_CACHE));
    return;
  }

  // 4) Assets fingerprintés : cache-first
  if (FINGERPRINTED_ASSET_PATTERN.test(url.pathname)) {
    event.respondWith(cacheFirst(request, ASSET_CACHE));
    return;
  }

  // 5) Documents / navigation : network-first + fallback SPA "/"
  if (request.destination === 'document' || event.request.mode === 'navigate') {
    event.respondWith(networkFirst(request, CORE_CACHE, '/'));
    return;
  }

  // 6) Le reste : network-first léger
  event.respondWith(networkFirst(request, CORE_CACHE, '/'));
});

// Deferred sync — flush offline price-report queue when connectivity is restored
self.addEventListener('sync', (event) => {
  if (event.tag === 'akiprisaye-sync-queue') {
    event.waitUntil(flushSyncQueue());
  }
});

async function flushSyncQueue() {
  const clients = await self.clients.matchAll();
  clients.forEach((client) => {
    client.postMessage({ type: 'SW_SYNC_START' });
  });
  // The actual flush is handled in pwaService.ts via syncOfflineQueue()
  clients.forEach((client) => {
    client.postMessage({ type: 'SW_SYNC_DONE' });
  });
}

// Push notifications
self.addEventListener('push', (event) => {
  let data = { title: 'A KI PRI SA YÉ', body: 'Nouveau prix détecté !' };
  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data.body = event.data.text();
    }
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'akiprisaye-price-alert',
      data: { url: '/' },
    }),
  );
});

// Notification click — focus or open the app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }
      return self.clients.openWindow(targetUrl);
    }),
  );
});