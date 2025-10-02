self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open('akipri-cache').then((cache) => cache.add('/'))
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => response || fetch(e.request))
  );
});
