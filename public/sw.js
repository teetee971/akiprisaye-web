/* A KI PRI SA YÉ  Service Worker */
const CACHE_VERSION = 'v3';
const CACHE_NAME = `akiprisaye-${CACHE_VERSION}`;
const STATIC_CACHE = `${CACHE_NAME}-static`;
const DYNAMIC_CACHE = `${CACHE_NAME}-dynamic`;
const API_CACHE = `${CACHE_NAME}-api`;

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/offline.html',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(STATIC_ASSETS.map(url => new Request(url, { cache: 'reload' }))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(
      names
        .filter((n) => n.startsWith('akiprisaye-') && n !== STATIC_CACHE && n !== DYNAMIC_CACHE && n !== API_CACHE)
        .map((n) => caches.delete(n)),
    );
    if ('navigationPreload' in self.registration) {
      try { await self.registration.navigationPreload.enable(); } catch {
        // Navigation preload not supported, continue without it
      }
    }
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;
  if (url.protocol === 'chrome-extension:') return;

  const sameOrigin = url.origin === self.location.origin;

  if (sameOrigin && url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request, API_CACHE));
    return;
  }

  if (sameOrigin && (url.pathname.startsWith('/assets/') ||
      /\.(js|css|png|jpg|jpeg|svg|gif|webp|woff|woff2|ttf|eot)$/.test(url.pathname))) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  const isHtml = request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html');
  if (sameOrigin && isHtml) {
    event.respondWith(handleHtmlNavigation(event, request, DYNAMIC_CACHE));
    return;
  }

  if (sameOrigin) {
    event.respondWith(networkFirst(request, DYNAMIC_CACHE));
  }
});

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response && response.ok) {
    const cache = await caches.open(cacheName);
    cache.put(request, response.clone());
  }
  return response;
}

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    throw new Error('Network failed and no cache available');
  }
}

async function handleHtmlNavigation(event, request, cacheName) {
  try {
    const preload = await event.preloadResponse;
    if (preload && preload.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, preload.clone());
      return preload;
    }
    const response = await fetch(request);
    if (response && response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
      return response;
    }
    const cached = await caches.match(request);
    if (cached) return cached;
    return await offlineFallback();
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return await offlineFallback();
  }
}

async function offlineFallback() {
  const offline = await caches.match('/offline.html');
  if (offline) return offline;
  return new Response(
    `<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hors ligne - A KI PRI SA YÉ</title>
    <style>
      body { font-family: system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,sans-serif;
             background:#0f172a;color:#fff;display:flex;align-items:center;justify-content:center;
             min-height:100vh;margin:0;padding:1rem;text-align:center; }
      .container { max-width:520px }
      h1 { color:#60a5fa;margin:0 0 .5rem }
      .icon { font-size:4rem;margin-bottom:1rem }
      button { background:#2563eb;color:#fff;border:0;padding:1rem 2rem;border-radius:.5rem;
               font-size:1rem;cursor:pointer;margin-top:1rem }
      button:hover { background:#1d4ed8 }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="icon"></div>
      <h1>Mode hors ligne</h1>
      <p>Vous n''êtes pas connectée à Internet. Certaines fonctionnalités sont limitées, mais vous pouvez consulter les données en cache.</p>
      <button onclick="window.location.reload()">Réessayer</button>
    </div>
  </body>
</html>`,
    { headers: { 'Content-Type': 'text/html; charset=utf-8' } },
  );
}

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data?.type === 'CLEAR_CACHE') {
    event.waitUntil((async () => {
      const names = await caches.keys();
      await Promise.all(names.map((n) => caches.delete(n)));
      const clients = await self.clients.matchAll();
      clients.forEach((c) => c.postMessage({ type: 'CACHE_CLEARED' }));
    })());
  }
});
