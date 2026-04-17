import type { SanitaryAlert } from '../types/alerts';

const IMAGE_CACHE_KEY = 'akps_alert_img_cache_v1';
const IMAGE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const API_TIMEOUT_MS = 6000;

type ImageSource = NonNullable<SanitaryAlert['imageSource']>;

interface CachedImageEntry {
  url: string;
  source: ImageSource;
  cachedAt: number;
}

type CachedImageMap = Record<string, CachedImageEntry>;

type OffSelectedImages = {
  front?: {
    display?: {
      fr?: unknown;
      en?: unknown;
    };
  };
};

type OffProductPayload = {
  image_url?: unknown;
  selected_images?: OffSelectedImages;
};

type OffResponsePayload = {
  status?: unknown;
  product?: OffProductPayload;
};

const PLACEHOLDER_BY_CATEGORY: Record<string, string> = {
  bebe: '/assets/placeholders/placeholder-bebe.svg',
  epicerie: '/assets/placeholders/placeholder-epicerie.svg',
  'viande/poisson': '/assets/placeholders/placeholder-viande-poisson.svg',
  hygiene: '/assets/placeholders/placeholder-hygiene.svg',
};

const pendingRequests = new Map<string, Promise<{ url?: string; source: ImageSource }>>();

function normalizeCategory(category?: string): string {
  return (category ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

function getPlaceholderUrl(category?: string): string {
  return (
    PLACEHOLDER_BY_CATEGORY[normalizeCategory(category)] ??
    '/assets/placeholders/placeholder-default.svg'
  );
}

function getCacheKey(ean?: string, category?: string): string {
  const normalizedEan = (ean ?? '').trim();
  return normalizedEan.length > 0
    ? `ean:${normalizedEan}`
    : `cat:${normalizeCategory(category) || 'default'}`;
}

function readLocalCache(): CachedImageMap {
  if (typeof window === 'undefined') return {};

  try {
    const raw = window.localStorage.getItem(IMAGE_CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as CachedImageMap;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeLocalCache(cache: CachedImageMap): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(IMAGE_CACHE_KEY, JSON.stringify(cache));
}

function pruneExpired(cache: CachedImageMap): CachedImageMap {
  const now = Date.now();
  const entries = Object.entries(cache).filter(([, value]) => now - value.cachedAt <= IMAGE_TTL_MS);
  return Object.fromEntries(entries);
}

function isEntryFresh(entry: CachedImageEntry, now: number): boolean {
  if (entry.source === 'off') {
    return now - entry.cachedAt <= IMAGE_TTL_MS;
  }

  return now - entry.cachedAt <= 5 * 60 * 1000;
}

function getFreshCachedEntry(key: string): CachedImageEntry | null {
  const cache = pruneExpired(readLocalCache());
  const now = Date.now();

  for (const [cacheKey, entry] of Object.entries(cache)) {
    if (!isEntryFresh(entry, now)) {
      delete cache[cacheKey];
    }
  }

  const entry = cache[key];
  writeLocalCache(cache);
  return entry ?? null;
}

function setCachedEntry(key: string, entry: Omit<CachedImageEntry, 'cachedAt'>): CachedImageEntry {
  const cache = pruneExpired(readLocalCache());
  const nextEntry: CachedImageEntry = {
    ...entry,
    cachedAt: Date.now(),
  };
  cache[key] = nextEntry;
  writeLocalCache(cache);
  return nextEntry;
}

function asNonEmptyString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

export function extractOffImageUrl(payload: OffResponsePayload): string | undefined {
  const product = payload.product;
  if (!product || payload.status === 0) return undefined;

  return (
    asNonEmptyString(product.selected_images?.front?.display?.fr) ??
    asNonEmptyString(product.selected_images?.front?.display?.en) ??
    asNonEmptyString(product.image_url)
  );
}

async function fetchFromApi(
  ean: string,
  category?: string
): Promise<{ url?: string; source: ImageSource }> {
  const fetchAttempt = async (): Promise<{ url?: string; source: ImageSource }> => {
    const controller = new window.AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), API_TIMEOUT_MS);

    try {
      const params = new URLSearchParams({ ean });
      if (category) {
        params.set('category', category);
      }
      params.set('format', 'json');
      params.set('v', '3');
      params.set('nocache', '1');
      params.set('t', String(Date.now()));

      const response = await fetch(`/api/product-image?${params.toString()}`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        return { source: 'none' };
      }

      const payload = (await response.json()) as {
        url?: unknown;
        source?: unknown;
        image_url?: unknown;
        redirect_to?: unknown;
      };
      const source =
        payload.source === 'off' ||
        payload.source === 'openfoodfacts' ||
        payload.source === 'placeholder' ||
        payload.source === 'none'
          ? payload.source
          : 'none';
      const url =
        asNonEmptyString(payload.url) ??
        asNonEmptyString(payload.redirect_to) ??
        asNonEmptyString(payload.image_url);

      if (!url || source === 'none') {
        return { source: 'none' };
      }

      return { url, source: source === 'openfoodfacts' ? 'off' : source };
    } catch {
      return { source: 'none' };
    } finally {
      window.clearTimeout(timeoutId);
    }
  };

  const firstAttempt = await fetchAttempt();
  if (firstAttempt.source === 'off') {
    return firstAttempt;
  }

  await new Promise((resolve) => window.setTimeout(resolve, 250));
  return fetchAttempt();
}

export async function getProductImageUrl(
  ean: string,
  category?: string
): Promise<{ url?: string; source: ImageSource }> {
  const cacheKey = getCacheKey(ean, category);
  const cached = getFreshCachedEntry(cacheKey);

  if (cached) {
    return { url: cached.url || undefined, source: cached.source };
  }

  const normalizedEan = ean.trim();
  if (!normalizedEan) {
    const entry = setCachedEntry(cacheKey, {
      url: getPlaceholderUrl(category),
      source: category ? 'placeholder' : 'none',
    });
    return { url: entry.url || undefined, source: entry.source };
  }

  if (pendingRequests.has(cacheKey)) {
    const shared = await pendingRequests.get(cacheKey);
    if (shared) return { url: shared.url || undefined, source: shared.source };
  }

  const request = (async (): Promise<{ url?: string; source: ImageSource }> => {
    const apiResult = await fetchFromApi(normalizedEan, category);

    if (apiResult.url && apiResult.source === 'off') {
      const entry = setCachedEntry(cacheKey, {
        url: apiResult.url,
        source: apiResult.source,
      });
      return { url: entry.url || undefined, source: entry.source };
    }

    return {
      url: getPlaceholderUrl(category),
      source: 'placeholder',
    };
  })();

  pendingRequests.set(cacheKey, request);

  try {
    return await request;
  } finally {
    pendingRequests.delete(cacheKey);
  }
}

export const __alertImageInternals = {
  getPlaceholderUrl,
  getCacheKey,
  IMAGE_CACHE_KEY,
  IMAGE_TTL_MS,
};
