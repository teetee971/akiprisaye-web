// frontend/src/utils/buildSync.ts
export function enforceBuildVersionSync(): void {
  const buildId = import.meta.env.VITE_APP_BUILD_ID as string | undefined;
  if (!buildId) return;

  const key = 'app_build_id';
  const stored = localStorage.getItem(key);

  // Si le build change, on purge (cache app) puis reload pour éviter un état incohérent
  if (stored && stored !== buildId) {
    localStorage.clear();
    location.reload();
    return;
  }

  localStorage.setItem(key, buildId);
}

export function registerAppServiceWorker(): void {
  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').catch((err) => {
      if (import.meta.env.DEV) console.warn('SW register error:', err);
    });
  });
}