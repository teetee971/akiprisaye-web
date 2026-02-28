// frontend/src/pwa/serviceWorker.ts
export function registerAppServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .catch(() => {
        // no-op
      });
  });
}