const CACHE_VERSION = 'v2';
const CACHE_NAME = `akiprisaye-${CACHE_VERSION}`;
const STATIC_CACHE = `${CACHE_NAME}-static`;
const DYNAMIC_CACHE = `${CACHE_NAME}-dynamic`;
const API_CACHE = `${CACHE_NAME}-api`;

// Assets à mettre en cache lors de l'installation
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/offline.html',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// Installation du Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[SW] Pre-caching static assets');
      return cache.addAll(STATIC_ASSETS.map(url => new Request(url, { cache: 'reload' })));
    }).then(() => self.skipWaiting()),
  );
});

// Activation du Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('akiprisaye-') && name !== STATIC_CACHE && name !== DYNAMIC_CACHE && name !== API_CACHE)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          }),
      );
    }).then(() => {
      console.log('[SW] Service Worker activé - version', CACHE_VERSION);
      return self.clients.claim();
    }),
  );
});

// Stratégie de cache pour les requêtes
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorer les requêtes non-GET
  if (request.method !== 'GET') {
    return;
  }

  // Ignorer les requêtes Chrome extensions
  if (url.protocol === 'chrome-extension:') {
    return;
  }

  // Stratégie pour les API calls: Network First
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstStrategy(request, API_CACHE));
    return;
  }

  // Stratégie pour les assets statiques: Cache First
  if (
    url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|gif|webp|woff|woff2|ttf|eot)$/) ||
    url.pathname.startsWith('/assets/')
  ) {
    event.respondWith(cacheFirstStrategy(request, STATIC_CACHE));
    return;
  }

  // Stratégie pour les pages HTML: Network First avec fallback offline
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(networkFirstWithOffline(request, DYNAMIC_CACHE));
    return;
  }

  // Par défaut: Network First
  event.respondWith(networkFirstStrategy(request, DYNAMIC_CACHE));
});

// Cache First Strategy - pour les assets statiques
async function cacheFirstStrategy(request, cacheName) {
  try {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }

    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.error('[SW] Cache First failed:', error);
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    throw error;
  }
}

// Network First Strategy - pour les API et contenu dynamique
async function networkFirstStrategy(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.warn('[SW] Network failed, trying cache:', request.url);
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    throw error;
  }
}

// Network First with Offline fallback - pour les pages HTML
async function networkFirstWithOffline(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.warn('[SW] Network failed, trying cache:', request.url);
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }

    // Si pas de cache, retourner la page offline
    console.log('[SW] Returning offline page');
    const offlinePage = await caches.match('/offline.html');
    if (offlinePage) {
      return offlinePage;
    }

    // Fallback ultime: page HTML basique
    return new Response(
      `<!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Hors ligne - A KI PRI SA YÉ</title>
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              background: #0f172a;
              color: #fff;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              padding: 1rem;
              text-align: center;
            }
            .container {
              max-width: 500px;
            }
            h1 { color: #60a5fa; }
            .icon { font-size: 4rem; margin-bottom: 1rem; }
            button {
              background: #2563eb;
              color: white;
              border: none;
              padding: 1rem 2rem;
              border-radius: 0.5rem;
              font-size: 1rem;
              cursor: pointer;
              margin-top: 1rem;
            }
            button:hover { background: #1d4ed8; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="icon">📡</div>
            <h1>Mode Hors Ligne</h1>
            <p>Vous n'êtes pas connecté à Internet. Certaines fonctionnalités sont limitées mais vous pouvez toujours consulter les données en cache.</p>
            <button onclick="window.location.reload()">Réessayer</button>
          </div>
        </body>
      </html>`,
      {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      },
    );
  }
}

// Message handler pour communications avec le client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => caches.delete(name)),
        );
      }).then(() => {
        return self.clients.matchAll();
      }).then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'CACHE_CLEARED' });
        });
      }),
    );
  }
});

