const CACHE_NAME = 'akiprisaye-v1';
const ASSETS = ['/', '/index.html', '/manifest.json'];

// Installation du cache
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
});

// Interception des requêtes (Lecture)
self.addEventListener('fetch', (event) => {
  if (event.request.method === 'GET') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
  }
});

// --- REVENUE SYNC ENGINE ---
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-revenue') {
    event.waitUntil(sendQueuedRevenue());
  }
});

async function sendQueuedRevenue() {
  // Cette fonction sera appelée automatiquement par le navigateur 
  // dès que la connexion revient (même si l'onglet est fermé !)
  console.log("Tentative de synchronisation des revenus en attente...");
  // Logique simplifiée : les requêtes échouées seront rejouées ici.
}
