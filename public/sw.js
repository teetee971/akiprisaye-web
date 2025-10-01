self.addEventListener('install', event => {
  console.log('[ServiceWorker] Install');
});

self.addEventListener('fetch', event => {
  event.respondWith(fetch(event.request));
});