
// Enhanced PWA Service Worker for A KI PRI SA YÉ
// Provides offline support for pages, comparateur, actualites with cache-first for assets

const CACHE_VERSION = 'akipsy-v2.1';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const API_CACHE = `${CACHE_VERSION}-api`;

// Core pages to cache for offline use
const CORE_PAGES = [
  '/',
  '/index.html',
  '/search.html',
  '/actualites.html',
  '/compare.html',
  '/admin-reports.html',
  '/manifest.webmanifest'
];

// Static assets for cache-first strategy
const STATIC_ASSETS = [
  '/styles.css',
  '/css/theme.css',
  '/js/flags.js',
  '/js/footer.js',
  '/js/theme.js',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/favicon.ico',
  '/favicon.svg'
];

// Network timeout for cache fallback
const NETWORK_TIMEOUT = 3000;

// Install event - precache static assets and core pages
self.addEventListener('install', event => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE).then(cache => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      // Cache core pages
      caches.open(DYNAMIC_CACHE).then(cache => {
        console.log('[SW] Caching core pages');
        return cache.addAll(CORE_PAGES);
      })
    ]).then(() => {
      console.log('[SW] Installation complete');
      self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName.startsWith('akipsy-') && !cacheName.startsWith(CACHE_VERSION)) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Activation complete');
      return self.clients.claim();
    })
  );
});

// Fetch event - routing strategy based on request type
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-http requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Skip Chrome extensions
  if (url.protocol === 'chrome-extension:') {
    return;
  }

  event.respondWith(handleRequest(request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  
  try {
    // Strategy 1: Cache-first for static assets (CSS, JS, images, fonts)
    if (isStaticAsset(request)) {
      return await cacheFirst(request, STATIC_CACHE);
    }
    
    // Strategy 2: Network-first with cache fallback for API calls
    if (isApiCall(url)) {
      return await networkFirstWithCache(request, API_CACHE);
    }
    
    // Strategy 3: Network-first with cache fallback for pages
    if (isPageRequest(request)) {
      return await networkFirstWithCache(request, DYNAMIC_CACHE);
    }
    
    // Strategy 4: Network only for other requests
    return await fetch(request);
    
  } catch (error) {
    console.log('[SW] Request failed:', request.url, error);
    
    // Fallback for pages - return cached page or offline page
    if (isPageRequest(request)) {
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
      
      // Return offline fallback for main pages
      if (isMainPage(url.pathname)) {
        return await caches.match('/index.html') || createOfflineResponse();
      }
    }
    
    throw error;
  }
}

// Cache-first strategy for static assets
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    // Update cache in background
    fetch(request).then(response => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
    }).catch(() => {
      // Ignore network errors in background update
    });
    
    return cachedResponse;
  }
  
  // Not in cache, fetch from network and cache
  const response = await fetch(request);
  if (response.ok) {
    cache.put(request, response.clone());
  }
  return response;
}

// Network-first with cache fallback and timeout
async function networkFirstWithCache(request, cacheName) {
  const cache = await caches.open(cacheName);
  
  try {
    // Try network with timeout
    const networkResponse = await Promise.race([
      fetch(request),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Network timeout')), NETWORK_TIMEOUT)
      )
    ]);
    
    // Cache successful responses
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
    
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);
    
    // Fallback to cache
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
  }
}

// Helper functions
function isStaticAsset(request) {
  const url = new URL(request.url);
  const extension = url.pathname.split('.').pop();
  const staticExtensions = ['css', 'js', 'png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'ico', 'woff', 'woff2', 'ttf', 'eot'];
  return staticExtensions.includes(extension) || 
         request.destination === 'style' || 
         request.destination === 'script' || 
         request.destination === 'image' ||
         request.destination === 'font';
}

function isApiCall(url) {
  return url.pathname.startsWith('/api/') || 
         url.pathname.startsWith('/news') ||
         url.hostname.includes('cloudfunctions.net') ||
         url.hostname.includes('firebaseapp.com');
}

function isPageRequest(request) {
  return request.method === 'GET' && 
         (request.headers.get('accept')?.includes('text/html') || 
          request.url.endsWith('.html') ||
          request.url.endsWith('/'));
}

function isMainPage(pathname) {
  const mainPages = ['/', '/index.html', '/search.html', '/actualites.html', '/compare.html'];
  return mainPages.includes(pathname);
}

function createOfflineResponse() {
  const offlineHTML = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="utf-8">
      <title>Hors ligne - A KI PRI SA YÉ</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body { font-family: system-ui; margin: 0; padding: 20px; background: #0b1220; color: #e7eefc; }
        .container { max-width: 600px; margin: 50px auto; text-align: center; }
        h1 { color: #35e1ff; margin-bottom: 20px; }
        p { line-height: 1.6; margin-bottom: 20px; }
        .retry-btn { background: #35e1ff; color: #042029; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-weight: 600; }
        .offline-icon { font-size: 4rem; margin-bottom: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="offline-icon">📱</div>
        <h1>Mode hors ligne</h1>
        <p>Vous êtes actuellement hors ligne. Certaines fonctionnalités peuvent être limitées.</p>
        <p>Vérifiez votre connexion internet et essayez de nouveau.</p>
        <button class="retry-btn" onclick="window.location.reload()">Réessayer</button>
      </div>
    </body>
    </html>
  `;
  
  return new Response(offlineHTML, {
    headers: { 'Content-Type': 'text/html' }
  });
}

// Background sync for failed requests (if supported)
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    console.log('[SW] Background sync triggered');
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // Retry failed API requests when back online
  try {
    const cache = await caches.open(API_CACHE);
    const requests = await cache.keys();
    
    for (const request of requests) {
      try {
        const response = await fetch(request);
        if (response.ok) {
          await cache.put(request, response.clone());
        }
      } catch (error) {
        console.log('[SW] Background sync failed for:', request.url);
      }
    }
  } catch (error) {
    console.log('[SW] Background sync error:', error);
  }
}

// Message handling for cache updates
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_CACHE_STATUS') {
    getCacheStatus().then(status => {
      event.ports[0].postMessage(status);
    });
  }
});

async function getCacheStatus() {
  try {
    const cacheNames = await caches.keys();
    const status = {};
    
    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const keys = await cache.keys();
      status[cacheName] = keys.length;
    }
    
    return status;
  } catch (error) {
    return { error: error.message };
  }
}

console.log('[SW] Service Worker script loaded');
