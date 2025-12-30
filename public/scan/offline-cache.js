self.addEventListener('install', e => {
  e.waitUntil(
    caches.open('scan-v1')
      .then(cache => cache.addAll([
        './',
        './index.html',
        './scan.js'
      ]))
  );
});
