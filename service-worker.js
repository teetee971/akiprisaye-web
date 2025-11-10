// Service Worker pour A KI PRI SA YÉ
// Ce fichier gère le cache statique afin de permettre l'accès hors-ligne.

const CACHE_NAME = 'aki-pri-sa-ye-cache-v4';

// Liste des ressources à mettre en cache lors de l'installation
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/comparateur.html',
  '/scanner.html',
  '/modules.html',
  '/carte.html',
  '/historique.html',
  '/ia-conseiller.html',
  '/mon-compte.html',
  '/upload-ticket.html',
  '/faq.html',
  '/contact.html',
  '/mentions.html',
  '/partenaires.html',
  '/offline.html',
  '/manifest.json',
  '/shared-nav.css',
  '/shared-nav.js',
  '/app.js',
  '/style.css',
  '/public/assets/icon_64.webp',
  '/public/assets/icon_128.webp',
  '/public/assets/icon_192.png',
  '/public/assets/icon_256.png',
  '/public/assets/icon_512.png',
  '/public/assets/icon_192.webp',
  '/public/assets/icon_256.webp',
  '/public/assets/icon_512.webp',
];

// Événement d'installation : mise en cache des ressources statiques
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Événement d'activation : nettoyage des anciens caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Événement de récupération : stratégie cache-first avec mise à jour
self.addEventListener('fetch', (event) => {
  // Ne traite que les requêtes GET
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Special handling for navigation requests
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        // Not in cache, try network with timeout
        return Promise.race([
          fetch(event.request),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000))
        ])
        .catch(async () => {
          // Try cache again in case it was added after the first check
          const fallbackCached = await caches.match(event.request);
          if (fallbackCached) {
            return fallbackCached;
          }
          // If still not available, return the offline page
          return caches.match('/offline.html');
        });
      })
    );
    return;
  }
  
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Retourne la version du cache
        return cachedResponse;
      }
      // Sinon, effectue la requête réseau et met à jour le cache
      return fetch(event.request).then((networkResponse) => {
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
      }).catch(() => {
        // En cas d'échec réseau pour les ressources, retourne undefined
        return undefined;
      });
    })
  );
});