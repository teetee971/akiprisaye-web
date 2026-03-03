const BUILD_ID_KEY = 'app_build_id'
const GH_HEAL_FLAG = 'akiprisaye:gh-pages-self-healed'
export function enforceBuildVersionSync(buildId?: string): boolean {
  const id = buildId || import.meta.env.VITE_APP_BUILD_ID;
  if (!id) return false;

const isGithubPagesHost = () => {
  const hostname = window.location.hostname
  const parts = hostname.split('.')
  // Require at least one subdomain and a final "github.io" suffix
  if (parts.length < 3) return false
  const [secondLast, last] = parts.slice(-2)
  return secondLast === 'github' && last === 'io'
}

const isAssetLoadError = (message: string) =>
  /Loading chunk|Failed to fetch dynamically imported module|Importing a module script failed|ERR_ABORTED/i.test(message)

export async function enforceBuildVersionSync(currentBuildId?: string): Promise<boolean> {
  const buildId =
    currentBuildId ||
    (import.meta.env.VITE_APP_BUILD_ID as string | undefined) ||
    (import.meta.env.VITE_BUILD_SHA as string | undefined)

  if (!buildId) return false

  const stored = localStorage.getItem(BUILD_ID_KEY)

  if (stored && stored !== buildId) {
    localStorage.clear()
    location.reload()
    return true
  }

  localStorage.setItem(BUILD_ID_KEY, buildId)
  return false
}

async function clearServiceWorkersAndCaches() {
  if ('serviceWorker' in navigator) {
    const regs = await navigator.serviceWorker.getRegistrations()
    await Promise.all(regs.map((reg) => reg.unregister()))
  }

  if ('caches' in window) {
    const keys = await caches.keys()
    await Promise.all(keys.map((key) => caches.delete(key)))
  }
  if (stored && stored !== id) {
    localStorage.clear();
    location.reload();
    return true;
  }

  localStorage.setItem(key, id);
  return false;
}

export async function selfHealGithubPagesIfNeeded(reason?: unknown): Promise<boolean> {
  if (!import.meta.env.PROD || !isGithubPagesHost()) return false
  if (sessionStorage.getItem(GH_HEAL_FLAG) === '1') return false

  const baseUrl = import.meta.env.BASE_URL || '/'
  const message = String((reason as Error | undefined)?.message || reason || '')
  const shouldHealFromError = isAssetLoadError(message)

  let probeFailed = false
  try {
    const probe = await fetch(`${baseUrl}manifest.webmanifest`, { cache: 'no-store' })
    probeFailed = !probe.ok
  } catch {
    probeFailed = true
  }

  if (!shouldHealFromError && !probeFailed) return false

  await clearServiceWorkersAndCaches()
  sessionStorage.setItem(GH_HEAL_FLAG, '1')
  location.reload()
  return true
}

export function registerAppServiceWorker(buildId?: string) {
  if (!('serviceWorker' in navigator)) return

  const baseUrl = import.meta.env.BASE_URL || '/'
  const swVersion = buildId || (import.meta.env.VITE_APP_BUILD_ID as string | undefined) || (import.meta.env.VITE_BUILD_SHA as string | undefined) || 'v1'
  const swUrl = `${baseUrl}service-worker.js?v=${encodeURIComponent(swVersion)}`

  window.addEventListener('load', () => {
    navigator.serviceWorker.register(swUrl).catch((err) => {
      if (import.meta.env.DEV) console.warn('SW error:', err)
    })
  })
}
    navigator.serviceWorker
      .register(import.meta.env.BASE_URL + 'service-worker.js')
      .catch((err) => {
        if (import.meta.env.DEV) console.warn('SW error:', err);
      });
  });
}
