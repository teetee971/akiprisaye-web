import React, { useState, useEffect } from 'react';

const DATE_FORMATTER = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

/** Lit la date de dernière mise à jour depuis le cache SW (en-tête x-sw-fetched-at). */
async function fetchCachedDataDate(): Promise<string | null> {
  if (!('caches' in window)) return null;
  try {
    const cacheNames = await caches.keys();
    const dataCache = cacheNames.find((n) => n.startsWith('akiprisaye-data-'));
    if (!dataCache) return null;
    const cache = await caches.open(dataCache);
    const keys = await cache.keys();
    if (keys.length === 0) return null;
    const response = await cache.match(keys[0]);
    if (!response) return null;
    const fetched = response.headers.get('x-sw-fetched-at');
    return fetched;
  } catch {
    return null;
  }
}

export const OfflineBanner = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [cacheDate, setCacheDate] = useState<string | null>(null);

  useEffect(() => {
    const handleStatus = () => setIsOffline(!navigator.onLine);
    window.addEventListener('online', handleStatus);
    window.addEventListener('offline', handleStatus);
    return () => {
      window.removeEventListener('online', handleStatus);
      window.removeEventListener('offline', handleStatus);
    };
  }, []);

  useEffect(() => {
    if (isOffline) {
      fetchCachedDataDate().then((date) => {
        if (date) {
          try {
            setCacheDate(DATE_FORMATTER.format(new Date(date)));
          } catch {
            setCacheDate(date);
          }
        }
      });
    }
  }, [isOffline]);

  const message = cacheDate
    ? `Mode Hors-ligne — données du ${cacheDate} (cache local)`
    : 'Mode Hors-ligne : Données en cache (Cloudflare indisponible)';

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        backgroundColor: '#b45309',
        color: 'white',
        textAlign: 'center',
        padding: '8px 10px',
        fontSize: '13px',
        fontWeight: 'bold',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10000,
        boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
        transform: isOffline ? 'translateY(0)' : 'translateY(-110%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
      }}
    >
      <span>📡</span> {message}
    </div>
  );
};
