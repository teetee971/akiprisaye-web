
// Service Worker PWA optimisé pour A KI PRI SA YÉ
const CACHE_NAME = 'akiprisaye-v2024-09-21';
const STATIC_CACHE = 'akiprisaye-static-v1';
const DYNAMIC_CACHE = 'akiprisaye-dynamic-v1';

// Ressources à mettre en cache immédiatement
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/comparateur.html',
  '/actualites.html',
  '/manifest.webmanifest',
  '/styles.css',
  '/css/theme.css',
  '/css/responsive.css',
  '/js/api.js',
  '/js/flags.js',
  '/js/footer.js',
  '/icon.svg',
  '/favicon.ico',
  '/og-cover.jpg'
];

// URLs qui nécessitent une connexion réseau
const NETWORK_FIRST_URLS = [
  '/api/',
  '/news',
  'https://api.gouv.fr/',
  'https://firestore.googleapis.com/'
];

// URLs à servir depuis le cache en priorité
const CACHE_FIRST_URLS = [
  '/assets/',
  '/css/',
  '/js/',
  '/icons/',
  '/images/',
  '.webp',
  '.jpg',
  '.png',
  '.svg',
  '.ico'
];

// Installation du Service Worker
self.addEventListener('install', event => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Static assets cached successfully');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('[SW] Error caching static assets:', error);
      })
  );
});

// Activation du Service Worker
self.addEventListener('activate', event => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            // Supprimer les anciens caches
            if (cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE && 
                cacheName !== CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Service worker activated');
        return self.clients.claim();
      })
  );
});

// Gestion des requêtes
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Ignorer les requêtes Chrome extensions et autres protocoles
  if (!event.request.url.startsWith('http')) {
    return;
  }
  
  // Stratégie Cache First pour les assets statiques
  if (isCacheFirst(event.request.url)) {
    event.respondWith(cacheFirst(event.request));
    return;
  }
  
  // Stratégie Network First pour les APIs
  if (isNetworkFirst(event.request.url)) {
    event.respondWith(networkFirst(event.request));
    return;
  }
  
  // Stratégie Stale While Revalidate pour les pages
  if (isNavigationRequest(event.request)) {
    event.respondWith(staleWhileRevalidate(event.request));
    return;
  }
  
  // Stratégie par défaut : Cache First avec fallback réseau
  event.respondWith(cacheFirst(event.request));
});

// Vérifier si une URL doit utiliser Cache First
function isCacheFirst(url) {
  return CACHE_FIRST_URLS.some(pattern => url.includes(pattern));
}

// Vérifier si une URL doit utiliser Network First
function isNetworkFirst(url) {
  return NETWORK_FIRST_URLS.some(pattern => url.includes(pattern));
}

// Vérifier si c'est une requête de navigation
function isNavigationRequest(request) {
  return request.mode === 'navigate' || 
         (request.method === 'GET' && 
          request.headers.get('accept') && 
          request.headers.get('accept').includes('text/html'));
}

// Stratégie Cache First
async function cacheFirst(request) {
  try {
    const cache = await caches.open(STATIC_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      console.log('[SW] Serving from cache:', request.url);
      return cachedResponse;
    }
    
    console.log('[SW] Fetching from network:', request.url);
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[SW] Cache first error:', error);
    return getOfflineFallback(request);
  }
}

// Stratégie Network First
async function networkFirst(request) {
  try {
    console.log('[SW] Network first for:', request.url);
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);
    const cache = await caches.open(DYNAMIC_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    return getOfflineFallback(request);
  }
}

// Stratégie Stale While Revalidate
async function staleWhileRevalidate(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cachedResponse = await cache.match(request);
  
  // Réponse en arrière-plan pour mettre à jour le cache
  const fetchPromise = fetch(request)
    .then(networkResponse => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch(error => {
      console.error('[SW] Network error in stale-while-revalidate:', error);
    });
  
  // Retourner immédiatement la version en cache ou attendre le réseau
  if (cachedResponse) {
    console.log('[SW] Serving stale content:', request.url);
    return cachedResponse;
  }
  
  console.log('[SW] Waiting for network:', request.url);
  return fetchPromise || getOfflineFallback(request);
}

// Page de fallback hors ligne
function getOfflineFallback(request) {
  if (isNavigationRequest(request)) {
    return caches.match('/index.html') || 
           new Response('<!DOCTYPE html><html><head><title>Hors ligne</title></head><body><h1>Vous êtes hors ligne</h1><p>Veuillez vérifier votre connexion internet.</p></body></html>', {
             headers: { 'Content-Type': 'text/html' }
           });
  }
  
  if (request.destination === 'image') {
    return new Response('', { status: 200, statusText: 'OK' });
  }
  
  return new Response('Service non disponible hors ligne', { 
    status: 503, 
    statusText: 'Service Unavailable' 
  });
}

// Écouter les messages du client
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_CACHE_SIZE') {
    getCacheSize().then(size => {
      event.ports[0].postMessage({ size });
    });
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    clearOldCaches().then(() => {
      event.ports[0].postMessage({ cleared: true });
    });
  }
});

// Obtenir la taille du cache
async function getCacheSize() {
  const cacheNames = await caches.keys();
  let totalSize = 0;
  
  for (const name of cacheNames) {
    const cache = await caches.open(name);
    const keys = await cache.keys();
    totalSize += keys.length;
  }
  
  return totalSize;
}

// Nettoyer les anciens caches
async function clearOldCaches() {
  const cacheNames = await caches.keys();
  const currentCaches = [STATIC_CACHE, DYNAMIC_CACHE, CACHE_NAME];
  
  return Promise.all(
    cacheNames.map(cacheName => {
      if (!currentCaches.includes(cacheName)) {
        console.log('[SW] Deleting cache:', cacheName);
        return caches.delete(cacheName);
      }
    })
  );
}

// Gestion des notifications push (pour les futures fonctionnalités)
self.addEventListener('push', event => {
  if (!event.data) return;
  
  const options = {
    body: event.data.text(),
    icon: '/icon.svg',
    badge: '/icon.svg',
    vibrate: [200, 100, 200],
    data: {
      url: '/'
    }
  };
  
  event.waitUntil(
    self.registration.showNotification('A KI PRI SA YÉ', options)
  );
});

// Gestion des clics sur les notifications
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  const url = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window' })
      .then(clientList => {
        for (const client of clientList) {
          if (client.url.includes(url) && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

console.log('[SW] Service Worker loaded successfully');
