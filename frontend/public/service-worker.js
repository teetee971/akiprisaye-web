const CACHE_NAME = 'akiprisaye-smart-cache-v8';
const PRICE_DATA_CACHE = 'akiprisaye-price-data-v1';
const SCOPE_PATHNAME = new URL(self.registration.scope).pathname;
// Absolute base URL of the SW scope (e.g. "https://teetee971.github.io/akiprisaye-web/")
const SCOPE_BASE = new URL('./', self.registration.scope).href;

// Offline fallback page HTML (embedded for reliability)
const OFFLINE_HTML = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Hors ligne – A KI PRI SA YÉ</title>
  <style>
    body{font-family:system-ui,sans-serif;background:#0f172a;color:#e2e8f0;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:1rem;text-align:center}
    h1{font-size:1.5rem;margin-bottom:.75rem}
    p{color:#94a3b8;font-size:.9rem;max-width:320px}
    a{color:#34d399;text-decoration:underline}
  </style>
</head>
<body>
  <div>
    <h1>📵 Hors ligne</h1>
    <p>Vous êtes actuellement sans connexion Internet. Les données de prix mises en cache restent disponibles.</p>
    <p><a href="${SCOPE_PATHNAME}">Réessayer</a></p>
  </div>
</body>
</html>`;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll([`${SCOPE_BASE}manifest.webmanifest`])),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  const validCaches = new Set([CACHE_NAME, PRICE_DATA_CACHE]);
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => !validCaches.has(key)).map((key) => caches.delete(key))),
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

  if (url.origin === self.location.origin && url.pathname.startsWith(new URL('api/', self.registration.scope).pathname)) {
    event.respondWith(fetch(request, { cache: 'no-store' }));
    return;
  }

  // Price data JSON files: stale-while-revalidate (24h TTL)
  if (
    url.origin === self.location.origin &&
    url.pathname.startsWith(new URL('data/', self.registration.scope).pathname) &&
    url.pathname.endsWith('.json')
  ) {
    event.respondWith(
      (async () => {
        const priceCache = await caches.open(PRICE_DATA_CACHE);
        const cached = await priceCache.match(request);
        const fetchPromise = fetch(request).then((res) => {
          if (res.ok) {
            priceCache.put(request, res.clone());
          }
          return res;
        });
        // Return cached immediately if available, update in background
        return cached || fetchPromise;
      })(),
    );
    return;
  }

  // Locale files: network-first with cache fallback for offline support
  if (url.origin === self.location.origin && url.pathname.startsWith(new URL('locales/', self.registration.scope).pathname)) {
    event.respondWith(
      (async () => {
        try {
          const networkResponse = await fetch(request, { cache: 'no-store' });
          if (networkResponse && networkResponse.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        } catch (_e) {
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }
          return new Response('', { status: 503, statusText: 'Service Unavailable' });
        }
      })(),
    );
    return;
  }

  if (
    event.request.mode === 'navigate' ||
    request.destination === 'document' ||
    url.pathname === SCOPE_PATHNAME ||
    url.pathname.endsWith('.html')
  ) {
    event.respondWith(
      fetch(request, { cache: 'no-store' }).catch(() =>
        new Response(OFFLINE_HTML, {
          status: 503,
          headers: {
            'Content-Type': 'text/html',
            'Cache-Control': 'no-store',
          },
        }),
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

// ---------------------------------------------------------------------------
// Push notifications (E – Alertes & notifications)
// ---------------------------------------------------------------------------
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'A KI PRI SA YÉ', body: event.data.text() };
  }

  const title = payload.title || 'A KI PRI SA YÉ';
  const options = {
    body: payload.body || 'Nouvelle notification',
    icon: `${SCOPE_BASE}icon-192.png`,
    badge: `${SCOPE_BASE}icon-192.png`,
    tag: payload.tag || 'akiprisaye-notification',
    data: { url: payload.url || SCOPE_PATHNAME },
    requireInteraction: false,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || SCOPE_PATHNAME;

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        const existing = clients.find((c) => c.url === targetUrl && 'focus' in c);
        if (existing) return existing.focus();
        return self.clients.openWindow(targetUrl);
      }),
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
