
const CACHE_NAME = 'offline-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.webmanifest',
  '/styles.css',
  '/icon.svg',
  '/favicon.ico',
  '/favicon.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  // Force le nouveau service worker à devenir actif immédiatement
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Supprimer les anciens caches
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Prendre le contrôle immédiatement
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  // Ignorer les requêtes non-GET et les requêtes vers des domaines externes
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(response => {
      // Si trouvé dans le cache, le retourner
      if (response) {
        return response;
      }

      // Sinon, essayer de récupérer depuis le réseau
      return fetch(event.request).then(fetchResponse => {
        // Vérifier si la réponse est valide
        if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type !== 'basic') {
          return fetchResponse;
        }

        // Cloner la réponse car elle ne peut être utilisée qu'une fois
        const responseToCache = fetchResponse.clone();

        // Ajouter au cache pour les prochaines fois
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });

        return fetchResponse;
      });
    }).catch(() => {
      // En cas d'erreur (pas de réseau), servir la page offline pour les requêtes de navigation
      if (event.request.destination === 'document' || 
          (event.request.headers.get('accept') && event.request.headers.get('accept').includes('text/html'))) {
        return caches.match('/offline.html');
      }
    })
  );
});
