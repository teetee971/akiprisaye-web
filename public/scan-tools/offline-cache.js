/**
 * offline-cache.js (Service Worker)
 * Offline-first cache for scan-tools + optional CDN scripts.
 * Scope recommended: /scan-tools/
 */
const CACHE_NAME = "scan-tools-v1.3.2";
const CORE_ASSETS = [
  "/scan-tools/scan-tools.js",
  "/scan-tools/symbol-detect.js",
  "/scan-tools/price-compare.js",
  "/scan-tools/scan-tools.css",
  "/scan-tools/test.html"
];

// CDN assets (best-effort; depends on CORS/cacheability)
const CDN_ASSETS = [
  "https://unpkg.com/@ericblade/quagga2/dist/quagga.min.js",
  "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(CORE_ASSETS);
    // best-effort CDN caching
    await Promise.allSettled(CDN_ASSETS.map(async (u) => {
      try { await cache.add(u); } catch (_) {}
    }));
    self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => (k !== CACHE_NAME ? caches.delete(k) : Promise.resolve())));
    self.clients.claim();
  })());
});

// Cache-first for same-origin, network fallback. CDN: stale-while-revalidate best-effort.
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);

    // Same origin: cache-first
    if (url.origin === self.location.origin) {
      const cached = await cache.match(req);
      if (cached) return cached;
      try {
        const net = await fetch(req);
        if (net && net.ok) cache.put(req, net.clone());
        return net;
      } catch (e) {
        return cached || new Response("Offline", { status: 503 });
      }
    }

    // Cross-origin (CDN): stale-while-revalidate
    const cached = await cache.match(req);
    const fetchPromise = fetch(req).then((net) => {
      if (net && net.ok) cache.put(req, net.clone());
      return net;
    }).catch(() => cached);

    return cached || fetchPromise;
  })());
});
