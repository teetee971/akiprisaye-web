const BUILD_ID_STORAGE_KEY = 'akiprisaye-build-id';

const getBuildId = () => {
  const appBuildId = import.meta.env.VITE_APP_BUILD_ID;
  const buildSha = import.meta.env.VITE_BUILD_SHA;
  return appBuildId || buildSha || 'unknown';
};

const purgeServiceWorkersAndCaches = async () => {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(registrations.map((registration) => registration.unregister()));

  if ('caches' in window) {
    const cacheKeys = await window.caches.keys();
    await Promise.all(cacheKeys.map((cacheKey) => window.caches.delete(cacheKey)));
  }
};

export const applyBuildVersionGuard = async () => {
  if (!import.meta.env.PROD) {
    return;
  }

  const currentBuildId = getBuildId();
  const previousBuildId = localStorage.getItem(BUILD_ID_STORAGE_KEY);

  if (!previousBuildId) {
    localStorage.setItem(BUILD_ID_STORAGE_KEY, currentBuildId);
    return;
  }

  if (previousBuildId === currentBuildId) {
    return;
  }

  localStorage.setItem(BUILD_ID_STORAGE_KEY, currentBuildId);
  await purgeServiceWorkersAndCaches();
  window.location.reload();

  await new Promise(() => {});
};

export const registerServiceWorker = async () => {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register('/service-worker.js');

    if (registration.waiting) {
      registration.waiting.postMessage('SKIP_WAITING');
    }

    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (!newWorker) {
        return;
      }

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          newWorker.postMessage('SKIP_WAITING');
        }
      });
    });
  } catch (error) {
    console.warn('[sw] registration failed', error);
  }
};
