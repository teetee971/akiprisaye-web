/* Compatibility SW: keeps legacy registration path working without delegating
 * to `sw.js`, because the canonical worker's caching strategy differs from
 * the legacy behavior expected at this path.
 */
/* eslint-disable no-restricted-globals */

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (url.origin !== self.location.origin) {
    return;
  }

  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(new Request(request, { cache: 'no-store' }))
    );
  }
});
