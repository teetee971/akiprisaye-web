// Service Worker v1.2 pour A KI PRI SA YÉ - Glass Pro Edition
// Gère le cache statique et permet l'accès hors-ligne avec stratégie améliorée

const CACHE_NAME = 'akiprisaye-v1.2';
const DYNAMIC_CACHE = 'akipsy-dynamic-v1.2';
const OFFLINE_URL = '/offline.html';

// Lista des ressources à mettre en cache lors de l'installation
const _STATIC_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.webmanifest',
  '/comparateur',
  '/scanner',
  '/carte',
  '/actualites',
  '/mentions-legales',
  '/civic-modules',
  '/public/responsive.css',
  '/public/assets/icon_192.png',
  '/public/assets/icon_512.png',
];

// URLs à ne jamais mettre en cache
const CACHE_BLACKLIST = [
  '/api/',
  'chrome-extension://',
  'https://www.google-analytics.com',
  'https://www.googletagmanager.com',
];

// Événement d'installation : mise en cache des ressources statiques
self.addEventListener('install', (e) => {
  console.warn('[SW] Installing Service Worker v1.2...');
  
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.warn('[SW] Caching static assets');
        return cache.addAll([OFFLINE_URL]);
      })
      .catch((err) => {
        console.error('[SW] Cache addAll failed:', err);
      })
      .then(() => {
        console.warn('[SW] Service Worker installed successfully');
        return self.skipWaiting();
      }),
  );
});

// Événement d'activation : nettoyage des anciens caches
self.addEventListener('activate', (event) => {
  console.warn('[SW] Activating Service Worker v1.2...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              return cacheName !== CACHE_NAME && cacheName !== DYNAMIC_CACHE;
            })
            .map((cacheName) => {
              console.warn('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }),
        );
      })
      .then(() => {
        console.warn('[SW] Service Worker activated');
        return self.clients.claim();
      }),
  );
});

// Helper: Vérifie si une URL doit être mise en cache
function shouldCache(url) {
  return !CACHE_BLACKLIST.some(blacklisted => url.includes(blacklisted));
}

// Helper: Stratégie Network First pour les API
async function _networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    
    // Clone et cache la réponse si elle est valide
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch {
    // En cas d'échec réseau, essaie de récupérer depuis le cache
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      console.warn('[SW] Serving from cache (network failed):', request.url);
      return cachedResponse;
    }
    
    // Retourne une erreur si rien n'est disponible
    return new Response(
      JSON.stringify({ error: 'Network unavailable and no cache available' }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
}

// Helper: Stratégie Cache First pour les ressources statiques
async function _cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    console.warn('[SW] Serving from cache:', request.url);
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    // Clone et cache la réponse si elle est valide
    if (networkResponse && networkResponse.status === 200 && shouldCache(request.url)) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch {
    // En cas d'échec, retourne la page offline pour les requêtes de navigation
    if (request.mode === 'navigate') {
      const offlineResponse = await caches.match('/offline.html');
      if (offlineResponse) {
        return offlineResponse;
      }
    }
    
    return new Response('Network error', {
      status: 503,
      statusText: 'Service Unavailable',
    });
  }
}

// Événement de récupération : stratégie adaptative selon le type de requête
self.addEventListener('fetch', (e) => {
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request).then((r) => r || caches.match(OFFLINE_URL))),
  );
});

// Événement de message : permet la communication avec l'app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName)),
        );
      }),
    );
  }
});

// Événement de synchronisation en arrière-plan (future feature)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-prices') {
    event.waitUntil(syncPrices());
  }
});

async function syncPrices() {
  try {
    // Future: Synchroniser les données de prix en arrière-plan
    console.warn('[SW] Background sync: prices');
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

console.warn('[SW] Service Worker v1.2 Glass Pro Edition loaded');
