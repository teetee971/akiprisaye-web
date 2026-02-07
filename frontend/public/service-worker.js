// 🔹 Cache version - incremented to v4 for complete cache invalidation
const CACHE_NAME = 'akiprisaye-smart-cache-v4';

// 🔹 Only precache essential non-HTML assets
const ASSETS_TO_CACHE = [
  '/manifest.webmanifest',
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

// 🔹 Fetch handler with strict network-first for HTML
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // CRITICAL: Network-first for ALL HTML documents - NEVER serve cached HTML
  if (request.mode === 'navigate' || 
      request.destination === 'document' || 
      url.pathname === '/' || 
      url.pathname.endsWith('.html')) {
    event.respondWith(
      fetch(request, { cache: 'no-store' })
        .then((response) => {
          // NEVER cache HTML responses to prevent stale content
          return response;
        })
        .catch(() => {
          // Only on network failure, return minimal offline message
          return new Response(
            '<!DOCTYPE html><html><body><h1>Hors ligne</h1><p>Veuillez vous reconnecter à Internet.</p></body></html>',
            { 
              status: 503,
              headers: { 
                'Content-Type': 'text/html',
                'Cache-Control': 'no-store'
              } 
            }
          );
        })
    );
    return;
  }
  
  // Cache-first for static assets (JS, CSS, images) with immutable hashes
  event.respondWith(
    caches.match(request).then((response) => {
      if (response) {
        return response;
      }
      return fetch(request)
        .then((liveResponse) => {
          // Only cache successful responses for same-origin requests
          if (liveResponse.ok && liveResponse.type === 'basic') {
            return caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, liveResponse.clone());
              return liveResponse;
            });
          }
          return liveResponse;
        })
        .catch(() => {
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
