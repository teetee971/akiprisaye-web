export function enforceBuildVersionSync() {
  const buildId = import.meta.env.VITE_APP_BUILD_ID;
  if (!buildId) return;

  const key = 'app_build_id';
  const stored = localStorage.getItem(key);

  if (stored && stored !== buildId) {
    localStorage.clear();
    location.reload();
    return;
  }

  localStorage.setItem(key, buildId);
}

export function registerAppServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .catch((err) => {
        if (import.meta.env.DEV) console.warn('SW error:', err);
      });
  });
}