
const CACHE_NAME = 'akiprisaye-v2.0.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/assets/',
  '/icon.svg',
  '/manifest.webmanifest',
  // Add other static assets
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Cache opened');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.log('Service Worker: Cache failed', error);
      })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
      .catch(() => {
        // Return offline page if available
        if (event.request.destination === 'document') {
          return caches.match('/offline.html');
        }
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Push event - handle push notifications
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push received', event);
  
  const options = {
    body: event.data ? event.data.text() : 'Nouvelle notification A KI PRI SA YÉ',
    icon: '/icon.svg',
    badge: '/icon.svg',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 'akiprisaye-notification'
    },
    actions: [
      {
        action: 'explore',
        title: 'Explorer',
        icon: '/icon.svg'
      },
      {
        action: 'close',
        title: 'Fermer'
      }
    ]
  };

  // Try to parse JSON data
  if (event.data) {
    try {
      const data = event.data.json();
      if (data.title) options.title = data.title;
      if (data.body) options.body = data.body;
      if (data.icon) options.icon = data.icon;
      if (data.data) options.data = { ...options.data, ...data.data };
    } catch (e) {
      console.log('Service Worker: Failed to parse push data as JSON');
    }
  }

  event.waitUntil(
    self.registration.showNotification('A KI PRI SA YÉ', options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked', event);
  
  event.notification.close();

  if (event.action === 'explore') {
    // Open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  } else if (event.action === 'close') {
    // Just close the notification (already done above)
    return;
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.matchAll().then((clientList) => {
        // If app is already open, focus it
        for (const client of clientList) {
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }
        // Otherwise open new window
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
    );
  }
});

// Background sync event (for offline actions)
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync', event);
  
  if (event.tag === 'price-report-sync') {
    event.waitUntil(syncPriceReports());
  }
});

// Sync price reports when back online
async function syncPriceReports() {
  try {
    // Get pending reports from IndexedDB or localStorage
    const pendingReports = JSON.parse(localStorage.getItem('akp_pending_reports') || '[]');
    
    for (const report of pendingReports) {
      try {
        // Send report to server
        await fetch('/api/reports', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(report)
        });
        
        // Remove from pending list
        const index = pendingReports.findIndex(r => r.id === report.id);
        if (index > -1) {
          pendingReports.splice(index, 1);
        }
      } catch (error) {
        console.log('Service Worker: Failed to sync report', error);
      }
    }
    
    // Update pending reports
    localStorage.setItem('akp_pending_reports', JSON.stringify(pendingReports));
    
    // Notify user if all reports synced
    if (pendingReports.length === 0) {
      self.registration.showNotification('A KI PRI SA YÉ', {
        body: 'Tous vos signalements ont été synchronisés',
        icon: '/icon.svg',
        tag: 'sync-complete'
      });
    }
    
  } catch (error) {
    console.log('Service Worker: Sync failed', error);
  }
}

// Handle message from main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker: Message received', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});

// Periodic background sync for price updates (if supported)
self.addEventListener('periodicsync', (event) => {
  console.log('Service Worker: Periodic sync', event);
  
  if (event.tag === 'price-update') {
    event.waitUntil(updatePriceData());
  }
});

// Update price data in background
async function updatePriceData() {
  try {
    const response = await fetch('/api/prices/latest');
    const data = await response.json();
    
    // Store updated data
    const cache = await caches.open(CACHE_NAME);
    await cache.put('/api/prices/latest', new Response(JSON.stringify(data)));
    
    // Check for significant price changes
    const previousData = JSON.parse(localStorage.getItem('akp_last_prices') || '{}');
    const alerts = [];
    
    data.items?.forEach(item => {
      const previous = previousData[item.id];
      if (previous && item.price > previous * 1.1) { // 10% increase
        alerts.push({
          product: item.name,
          oldPrice: previous,
          newPrice: item.price,
          territory: item.territory
        });
      }
    });
    
    // Send alerts
    for (const alert of alerts) {
      await self.registration.showNotification('🚨 Alerte Prix!', {
        body: `${alert.product}: ${alert.oldPrice}€ → ${alert.newPrice}€ en ${alert.territory}`,
        icon: '/icon.svg',
        tag: `price-alert-${alert.product}`,
        data: alert
      });
    }
    
    // Update stored data
    const priceMap = {};
    data.items?.forEach(item => {
      priceMap[item.id] = item.price;
    });
    localStorage.setItem('akp_last_prices', JSON.stringify(priceMap));
    
  } catch (error) {
    console.log('Service Worker: Price update failed', error);
  }
}

console.log('Service Worker: A KI PRI SA YÉ SW loaded', CACHE_NAME);
