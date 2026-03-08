/**
 * Service de découverte automatique des catalogues Calameo.
 *
 * Interroge l'endpoint /api/calameo-discovery au démarrage de l'application,
 * met en cache les résultats pendant 6 heures dans localStorage, et détecte
 * automatiquement l'arrivée de nouveaux catalogues.
 *
 * Fonctionnement :
 *  1. Au premier appel, fetche la liste de tous les catalogues disponibles
 *     pour les comptes Calameo configurés (VITE_CALAMEO_ACCOUNTS).
 *  2. Les résultats sont mis en cache dans localStorage (TTL 6 h).
 *  3. À chaque rafraîchissement, compare les nouvelles entrées avec
 *     le cache précédent et expose la liste des nouveautés.
 *  4. La liste complète est disponible via getCatalogs().
 */

const CACHE_KEY = 'calameo_discovery_cache';
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 heures
const REQUEST_TIMEOUT_MS = 8000;

export interface DiscoveredCatalog {
  bkcode: string;
  accountId: string;
  title: string;
  publicUrl: string;
  thumbUrl?: string;
  pages?: number;
  date?: string;
}

interface CachedDiscovery {
  catalogs: DiscoveredCatalog[];
  fetchedAt: string;
  knownBkcodes: string[];
}

interface DiscoveryApiResponse {
  catalogs?: DiscoveredCatalog[];
  fetchedAt?: string;
  accountsQueried?: string[];
}

const readCache = (): (CachedDiscovery & { expiry: number }) | null => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedDiscovery & { expiry: number };
    if (typeof parsed.expiry !== 'number') return null;
    return parsed;
  } catch {
    return null;
  }
};

const writeCache = (data: CachedDiscovery): void => {
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ ...data, expiry: Date.now() + CACHE_TTL_MS }),
    );
  } catch {
    // localStorage peut être indisponible (mode privé, quota, etc.)
  }
};

const isCacheValid = (cache: ReturnType<typeof readCache>): cache is NonNullable<typeof cache> =>
  cache !== null && Date.now() < cache.expiry;

/** Identifie les catalogues apparus depuis le dernier cache. */
const detectNew = (
  fresh: DiscoveredCatalog[],
  previousBkcodes: string[],
): DiscoveredCatalog[] => {
  const prev = new Set(previousBkcodes);
  return fresh.filter((c) => !prev.has(c.bkcode));
};

let _inFlight: Promise<DiscoveredCatalog[]> | null = null;

/**
 * Récupère la liste des catalogues Calameo disponibles.
 *
 * @param forceRefresh  Ignore le cache et force une requête fraîche.
 * @returns             Liste triée par date décroissante.
 */
export async function getCatalogs(forceRefresh = false): Promise<DiscoveredCatalog[]> {
  // Déduplique les appels parallèles
  if (_inFlight) return _inFlight;

  const cached = readCache();
  if (!forceRefresh && isCacheValid(cached)) {
    return cached.catalogs;
  }

  _inFlight = (async () => {
    try {
      const base = (
        typeof import.meta !== 'undefined'
          ? (import.meta.env?.VITE_PRICE_API_BASE ?? '')
          : ''
      ).replace(/\/$/, '');

      const rawAccounts =
        typeof import.meta !== 'undefined'
          ? (import.meta.env?.VITE_CALAMEO_ACCOUNTS ?? '')
          : '';
      const params = new URLSearchParams({ per_page: '20' });
      if (rawAccounts) params.set('accounts', rawAccounts);

      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      const res = await fetch(`${base}/api/calameo-discovery?${params.toString()}`, {
        signal: controller.signal,
      });
      clearTimeout(id);

      if (!res.ok) return cached?.catalogs ?? [];

      const data = (await res.json()) as DiscoveryApiResponse;
      const fresh: DiscoveredCatalog[] = Array.isArray(data.catalogs) ? data.catalogs : [];

      const previousBkcodes = cached?.knownBkcodes ?? [];
      const newCatalogs = detectNew(fresh, previousBkcodes);

      writeCache({
        catalogs: fresh,
        fetchedAt: data.fetchedAt ?? new Date().toISOString(),
        knownBkcodes: fresh.map((c) => c.bkcode),
      });

      if (newCatalogs.length > 0) {
        // Émet un événement personnalisé pour que l'UI puisse réagir
        try {
          window.dispatchEvent(
            new CustomEvent('calameo:new-catalogs', { detail: { catalogs: newCatalogs } }),
          );
        } catch {
          // Environnement non-browser (tests, SSR)
        }
      }

      return fresh;
    } catch {
      return cached?.catalogs ?? [];
    } finally {
      _inFlight = null;
    }
  })();

  return _inFlight;
}

/**
 * Retourne les catalogues connus depuis le cache local (synchrone, sans réseau).
 * Utile pour un affichage immédiat au chargement de la page.
 */
export function getCachedCatalogs(): DiscoveredCatalog[] {
  return readCache()?.catalogs ?? [];
}

/**
 * Efface le cache local et force une redécouverte au prochain appel.
 */
export function clearDiscoveryCache(): void {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {
    // rien
  }
}

/**
 * Retourne la date du dernier rafraîchissement (depuis le cache).
 */
export function getLastFetchedAt(): string | null {
  return readCache()?.fetchedAt ?? null;
}
