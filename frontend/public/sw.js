const CACHE_NAME = 'akiprisaye-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Installation : on met en cache les fichiers de base
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

// Stratégie : Network First, fallback to Cache
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});
