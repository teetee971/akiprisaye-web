// 🔹 Nom du cache - version incrémentée pour forcer le rafraîchissement
const CACHE_NAME = 'akiprisaye-smart-cache-v3';

// 🔹 Ressources à précharger (sans index.html pour éviter le cache stale)
const ASSETS_TO_CACHE = [
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

// 🔹 Interception des requêtes avec stratégie network-first pour HTML
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Pour les documents HTML, toujours essayer le réseau en premier
  if (request.mode === 'navigate' || request.destination === 'document' || 
      url.pathname === '/' || url.pathname.endsWith('.html')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Ne pas cacher les documents HTML pour éviter le stale content
          return response;
        })
        .catch(() => {
          // En cas d'erreur réseau, chercher dans le cache
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Fallback offline basique si aucun cache
            return new Response(
              '<html><body><h1>Hors ligne</h1><p>Veuillez vous reconnecter à Internet.</p></body></html>',
              { headers: { 'Content-Type': 'text/html' } }
            );
          });
        })
    );
    return;
  }
  
  // Pour les autres ressources (JS, CSS, images), utiliser cache-first
  event.respondWith(
    caches.match(request).then((response) => {
      if (response) {
        console.log('✅ Cache hit :', request.url);
        return response;
      }
      return fetch(request)
        .then((liveResponse) => {
          // Mettre en cache uniquement les ressources statiques
          if (liveResponse.ok && liveResponse.type === 'basic') {
            return caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, liveResponse.clone());
              return liveResponse;
            });
          }
          return liveResponse;
        })
        .catch(() => {
          // Pas de fallback pour les ressources non-HTML
          return new Response('', { status: 503, statusText: 'Service Unavailable' });
        });
    })
  );
});

// 🔹 Message pour forcer la mise à jour
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
