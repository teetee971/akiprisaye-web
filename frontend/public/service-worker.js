// 🔹 Nom du cache
const CACHE_NAME = 'akiprisaye-smart-cache-v2';

// 🔹 Ressources à précharger
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/scanner',
  '/comparateur',
  '/historique-prix',
  '/ia-conseiller',
  '/contact',
  '/carte',
  '/manifest.webmanifest',
  '/assets/icon_512-3-9kYoTe.png',
];

// 🔹 Installation du service worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('📦 Mise en cache initiale des ressources...');
      return cache.addAll(ASSETS_TO_CACHE);
    }),
  );
  self.skipWaiting();
});

// 🔹 Activation (nettoyage ancien cache)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => {
            console.log('🧹 Suppression ancien cache :', key);
            return caches.delete(key);
          }),
      ),
    ),
  );
  self.clients.claim();
});

// 🔹 Interception des requêtes (offline fallback)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        console.log('✅ Cache hit :', event.request.url);
        return response;
      }
      return fetch(event.request)
        .then((liveResponse) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, liveResponse.clone());
            return liveResponse;
          });
        })
        .catch(() => caches.match('/index.html'));
    }),
  );
});

// 🔹 Message pour forcer la mise à jour
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
