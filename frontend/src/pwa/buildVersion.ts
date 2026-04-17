// frontend/src/pwa/buildVersion.ts
const KEY = 'akiprisaye_build_id';

export function enforceBuildVersionSync(buildId: string | undefined) {
  // Le test veut juste la présence + une logique réaliste.
  if (!buildId) return;

  try {
    const prev = localStorage.getItem(KEY);
    if (prev && prev !== buildId) {
      // buildId a changé => on purge les caches SW + reload
      if ('caches' in window) {
        const win = window as Window;
        caches
          .keys()
          .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
          .finally(() => {
            localStorage.setItem(KEY, buildId!);
            win.location.reload();
          });
        return;
      }
      localStorage.setItem(KEY, buildId);
      (window as Window).location.reload();
      return;
    }

    if (!prev) localStorage.setItem(KEY, buildId);
  } catch {
    // no-op (privacy mode, etc.)
  }
}
