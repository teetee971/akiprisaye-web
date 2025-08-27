const CACHE='akp-demo-v1';
const ASSETS=[
  '/', '/index.html', '/style.css',
  '/web/app.js', '/mock_api/prices.json', '/mock_api/series.json',
];
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));
});
self.addEventListener('fetch',e=>{
  e.respondWith(caches.match(e.request).then(r=> r || fetch(e.request)));
});
