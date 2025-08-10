import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate, NetworkFirst } from 'workbox-strategies';
import { CacheFirst } from 'workbox-strategies';

// Pré-cache les fichiers générés automatiquement par vite-plugin-pwa
precacheAndRoute(self.__WB_MANIFEST || []);

// Cache les fichiers statiques (JS/CSS) avec Stale-While-Revalidate
registerRoute(
  ({ request }) => request.destination === 'script' || request.destination === 'style',
  new StaleWhileRevalidate()
);

// Cache les requêtes API avec Network First
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'api-cache',
    networkTimeoutSeconds: 10,
  })
);

// Cache les images avec Cache First
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'image-cache'
  })
);