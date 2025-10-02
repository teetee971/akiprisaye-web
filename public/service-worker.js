self.addEventListener('install', e => {
  console.log('Service Worker installé');
  e.waitUntil(caches.open('akiprisaye-cache').then(cache => {
    return cache.addAll(['/']);
  }));
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(response => response || fetch(e.request))
  );
});
