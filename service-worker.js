// Service Worker pour A KI PRI SA YÉ
// Ce fichier gère le cache avec des stratégies optimisées pour la performance et l'accès hors-ligne.

const CACHE_VERSION = 'v2';
const CACHE_APP_SHELL = `aki-app-shell-${CACHE_VERSION}`;
const CACHE_ASSETS = `aki-assets-${CACHE_VERSION}`;
const CACHE_PAGES = `aki-pages-${CACHE_VERSION}`;

// App Shell - ressources critiques pour l'interface de base
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/public/assets/icon_192.png',
  '/public/assets/icon_256.png',
  '/public/assets/icon_512.png'
];

// Événement d'installation : mise en cache de l'App Shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_APP_SHELL)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

// Événement d'activation : nettoyage des anciens caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key.startsWith('aki-') && !key.includes(CACHE_VERSION))
          .map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Stratégie Network First pour les pages HTML
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_PAGES);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    return cachedResponse || caches.match('/index.html');
  }
}

// Stratégie Cache First pour les assets statiques
async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_ASSETS);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    return new Response('Asset not available', { status: 404 });
  }
}

// Événement de récupération : stratégies différenciées selon le type de ressource
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  const { request } = event;
  const url = new URL(request.url);

  // Ne pas cacher les requêtes vers des APIs externes
  if (!url.origin.includes(self.location.origin)) {
    return;
  }

  // Network-first pour les pages HTML
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  // Cache-first pour les assets statiques (images, fonts, CSS, JS)
  if (
    request.url.includes('/public/assets/') ||
    request.url.includes('.png') ||
    request.url.includes('.jpg') ||
    request.url.includes('.webp') ||
    request.url.includes('.css') ||
    request.url.includes('.js') ||
    request.url.includes('.woff')
  ) {
    event.respondWith(cacheFirstStrategy(request));
    return;
  }

  // Stratégie par défaut: network-first
  event.respondWith(networkFirstStrategy(request));
});