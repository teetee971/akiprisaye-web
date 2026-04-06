export function enforceBuildVersionSync(buildId?: string): boolean {
  const id = buildId || import.meta.env.VITE_APP_BUILD_ID;
  if (!id) return false;

  const key = 'app_build_id';
  const stored = localStorage.getItem(key);
  const resetKeys = [
    'app_build_id',
    'product-count',
    'aki-cached-count',
    'last-sync-date',
    'aki-user-pref-sync',
  ];

  if (stored && stored !== id) {
    resetKeys.forEach((k) => localStorage.removeItem(k));
    location.reload();
    return true;
  }

  localStorage.setItem(key, id);
  return false;
}

export async function enforceBuildVersionSyncAsync(currentBuildId?: string): Promise<boolean> {
  const id = currentBuildId || import.meta.env.VITE_APP_BUILD_ID;
  if (!id) return false;

  const key = 'app_build_id';
  const stored = localStorage.getItem(key);
  const resetKeys = [
    'app_build_id',
    'product-count',
    'aki-cached-count',
    'last-sync-date',
    'aki-user-pref-sync',
  ];

  if (stored && stored !== id) {
    if ('caches' in window) {
      try {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      } catch {
        // best-effort
      }
    }
    resetKeys.forEach((k) => localStorage.removeItem(k));
    location.reload();
    return true;
  }

  localStorage.setItem(key, id);
  return false;
}

export function registerAppServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(import.meta.env.BASE_URL + 'sw.js', { scope: import.meta.env.BASE_URL })
      .catch((err) => {
        if (import.meta.env.DEV) console.warn('SW error:', err);
      });
  });
}
