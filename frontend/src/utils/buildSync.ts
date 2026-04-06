// frontend/src/utils/buildSync.ts
export function enforceBuildVersionSync(): void {
  const buildId = import.meta.env.VITE_APP_BUILD_ID as string | undefined;
  if (!buildId) return;

  const key = 'app_build_id';
  const stored = localStorage.getItem(key);
  const resetKeys = [
    'app_build_id',
    'product-count',
    'aki-cached-count',
    'last-sync-date',
    'aki-user-pref-sync',
  ];

  // Si le build change, on purge (cache app) puis reload pour éviter un état incohérent
  if (stored && stored !== buildId) {
    resetKeys.forEach((k) => localStorage.removeItem(k));
    location.reload();
    return;
  }

  localStorage.setItem(key, buildId);
}

export function registerAppServiceWorker(): void {
  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', () => {
    navigator.serviceWorker.register(import.meta.env.BASE_URL + 'sw.js').catch((err) => {
      if (import.meta.env.DEV) console.warn('SW register error:', err);
    });
  });
}
