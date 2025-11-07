// Service Worker v3 pour A KI PRI SA YÉ
// Gère le cache statique et permet l'accès hors-ligne

const CACHE_VERSION = 'v3';
const CACHE_NAME = `akipsy-cache-${CACHE_VERSION}`;

// Liste des ressources à mettre en cache lors de l'installation
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.webmanifest'
];

// Événement d'installation : mise en cache des ressources statiques
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.error('Cache addAll failed:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Événement d'activation : nettoyage des anciens caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Événement de récupération : stratégie cache-first avec fallback offline
self.addEventListener('fetch', (event) => {
  // Ne traite que les requêtes GET
  if (event.request.method !== 'GET') {
    return;
  }
  
  const { request } = event;
  const url = new URL(request.url);
  
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      
      return fetch(request).then((networkResponse) => {
        // Clone la réponse pour la mettre en cache
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // En cas d'échec réseau, retourne la page offline pour les requêtes de navigation
        if (request.mode === 'navigate') {
          return caches.match('/offline.html');
        }
        return new Response('Network error', { status: 503 });
      });
    })
  );
});
