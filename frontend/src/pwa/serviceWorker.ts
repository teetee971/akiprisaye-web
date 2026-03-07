// frontend/src/pwa/serviceWorker.ts
export function registerAppServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(import.meta.env.BASE_URL + 'service-worker.js', { scope: import.meta.env.BASE_URL })
      .catch(() => {
        // no-op
      });
  });
}
