const CACHE='akp-dist-v1';
const ASSETS=['/','/index.html','/style.css','/app.js','/data/products.json'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)))});
self.addEventListener('fetch',e=>{e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)))})