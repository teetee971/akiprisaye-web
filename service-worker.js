// Service Worker pour A KI PRI SA YÉ
// Ce fichier gère le cache statique afin de permettre l'accès hors-ligne.

const CACHE_NAME = 'aki-pri-sa-ye-cache-v4';
const RUNTIME_CACHE = 'aki-runtime-cache-v1';

// Liste des ressources à mettre en cache lors de l'installation
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/comparateur.html',
  '/scanner.html',
  '/modules.html',
  '/carte.html',
  '/historique.html',
  '/ia-conseiller.html',
  '/mon-compte.html',
  '/upload-ticket.html',
  '/faq.html',
  '/contact.html',
  '/mentions.html',
  '/partenaires.html',
  '/manifest.json',
  '/shared-nav.css',
  '/shared-nav.js',
  '/app.js',
  '/style.css',
  '/public/assets/icon_64.webp',
  '/public/assets/icon_128.webp',
  '/public/assets/icon_192.png',
  '/public/assets/icon_256.png',
  '/public/assets/icon_512.png',
  '/public/assets/icon_192.webp',
  '/public/assets/icon_256.webp',
  '/public/assets/icon_512.webp',
];

// Événement d'installation : mise en cache des ressources statiques
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting()),
  );
});

// Événement d'activation : nettoyage des anciens caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME && key !== RUNTIME_CACHE)
          .map((key) => caches.delete(key)),
      );
    }).then(() => self.clients.claim()),
  );
});

/**
 * Stale-while-revalidate strategy
 * Returns cached response immediately while fetching fresh data in background
 * @param {Request} request - The request to handle
 * @returns {Promise<Response>} Response from cache or network
 */
async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cachedResponse = await cache.match(request);
  
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse && networkResponse.status === 200) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => cachedResponse || new Response('Offline', { status: 503 }));
  
  // Return cached response immediately if available, otherwise wait for network
  return cachedResponse || fetchPromise;
}

/**
 * Network-first strategy for API calls
 * Tries network first, falls back to cache if offline
 * @param {Request} request - The request to handle
 * @returns {Promise<Response>} Response from network or cache
 */
async function networkFirst(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await cache.match(request);
    return cachedResponse || new Response(JSON.stringify({ error: 'Offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// Événement de récupération : stratégie optimisée basée sur le type de ressource
self.addEventListener('fetch', (event) => {
  // Ne traite que les requêtes GET
  if (event.request.method !== 'GET') {
    return;
  }
  
  const { request } = event;
  const url = new URL(request.url);
  
  // API calls: Network-first strategy
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/functions/')) {
    event.respondWith(networkFirst(request));
    return;
  }
  
  // External CDN resources: Stale-while-revalidate
  if (url.origin !== location.origin) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }
  
  // Static assets: Cache-first with network fallback
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      
      return fetch(request).then((networkResponse) => {
        // Only cache successful responses
        if (networkResponse && networkResponse.status === 200) {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, networkResponse.clone());
            return networkResponse;
          });
        }
        return networkResponse;
      }).catch(() => {
        // Fallback to offline page for navigation requests
        if (request.mode === 'navigate') {
          return caches.match('/');
        }
        return new Response('Offline', { status: 503 });
      });
    }),
  );
});