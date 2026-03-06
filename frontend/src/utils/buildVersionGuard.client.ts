export function enforceBuildVersionSync(buildId?: string): boolean {
  const id = buildId || import.meta.env.VITE_APP_BUILD_ID;
  if (!id) return false;

  const key = 'app_build_id';
  const stored = localStorage.getItem(key);

  if (stored && stored !== id) {
    localStorage.clear();
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
      .register(import.meta.env.BASE_URL + 'service-worker.js', { scope: import.meta.env.BASE_URL })
      .catch((err) => {
        if (import.meta.env.DEV) console.warn('SW error:', err);
      });
  });
}
