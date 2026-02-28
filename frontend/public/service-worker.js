const CACHE_NAME = 'akiprisaye-smart-cache-v5';

const ASSETS_TO_CACHE = [
  '/manifest.webmanifest',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE)),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
    ),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') {
    return;
  }

  if (url.origin === self.location.origin && url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(request, { cache: 'no-store' }));
    return;
  }

  if (
    event.request.mode === 'navigate' ||
    request.destination === 'document' ||
    url.pathname === '/' ||
    url.pathname.endsWith('.html')
  ) {
    event.respondWith(
      fetch(request, { cache: 'no-store' }).catch(() =>
        new Response(
          '<!DOCTYPE html><html><body><h1>Hors ligne</h1><p>Veuillez vous reconnecter à Internet.</p></body></html>',
          {
            status: 503,
            headers: {
              'Content-Type': 'text/html',
              'Cache-Control': 'no-store',
            },
          },
        ),
      ),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((response) => {
      if (response) {
        return response;
      }

      return fetch(request)
        .then((liveResponse) => {
          const cacheControl = (liveResponse.headers.get('cache-control') || '').toLowerCase();
          const shouldBypassCache = cacheControl.includes('no-store') || cacheControl.includes('no-cache');

          if (liveResponse.ok && liveResponse.type === 'basic' && !shouldBypassCache) {
            return caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, liveResponse.clone());
              return liveResponse;
            });
          }

          return liveResponse;
        })
        .catch(() => new Response('', { status: 503, statusText: 'Service Unavailable' }));
    }),
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
