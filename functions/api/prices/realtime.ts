import { buildRealtimeFallback } from '../../../shared/realtimeFallback';

type NormalizedPrice = {
  productId: string;
  productLabel: string;
  territory: string;
  price: number;
  currency: string;
  source: string;
  observedAt: string;
};

type WorkerState = 'live' | 'cached' | 'offline';

type ApiPayload = {
  state: WorkerState;
  cache: 'hit' | 'miss' | 'none';
  source: { name: string; url: string };
  updated_at: string;
  items: NormalizedPrice[];
  meta: {
    territory?: string | null;
    product?: string | null;
    count: number;
  };
  message?: string;
};

type Env = {
  REALTIME_SOURCE_URL?: string;
};

const DEFAULT_SOURCE_URL =
  'https://raw.githubusercontent.com/teetee971/akiprisaye-web/main/public/data/prices.json';
const CACHE_TTL = 3600;
const REQUEST_TIMEOUT_MS = 4500;

async function fetchWithTimeout(url: string, timeoutMs: number, externalSignal?: AbortSignal) {
  if (externalSignal?.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }

  const controller = new AbortController();
  const onExternalAbort = () => controller.abort();
  if (externalSignal) {
    externalSignal.addEventListener('abort', onExternalAbort, { once: true });
  }
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      cf: { cacheTtl: CACHE_TTL, cacheEverything: true },
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
    if (externalSignal) {
      externalSignal.removeEventListener('abort', onExternalAbort);
    }
  }
}

function normalizeSource(
  json: any,
  territoryFilter?: string | null,
  productFilter?: string | null
): NormalizedPrice[] {
  const rows = Array.isArray(json?.donnees) ? json.donnees : [];
  if (!rows.length) return [];

  const territoryName =
    typeof json?.territoire === 'string' && json.territoire.trim()
      ? json.territoire.trim()
      : 'Territoire non renseigné';
  const updatedAt =
    typeof json?.date_snapshot === 'string'
      ? new Date(json.date_snapshot).toISOString()
      : new Date().toISOString();

  const products = new Map<
    string,
    { label: string; total: number; count: number; source: string; territory: string }
  >();

  for (const row of rows) {
    if (typeof row?.prix !== 'number' || Number.isNaN(row.prix)) continue;

    const productLabel =
      typeof row?.produit === 'string' && row.produit.trim()
        ? row.produit.trim()
        : 'Produit';
    if (productFilter && !productLabel.toLowerCase().includes(productFilter.toLowerCase())) {
      continue;
    }

    const territoryMatch =
      !territoryFilter ||
      territoryName.toLowerCase().includes(territoryFilter.toLowerCase()) ||
      (typeof row?.commune === 'string' &&
        row.commune.toLowerCase().includes(territoryFilter.toLowerCase()));
    if (!territoryMatch) continue;

    const key =
      typeof row?.ean === 'string' && row.ean.trim()
        ? row.ean.trim()
        : productLabel.toLowerCase().replace(/\s+/g, '-');
    const current = products.get(key) ?? {
      label: productLabel,
      total: 0,
      count: 0,
      source:
        (typeof row?.enseigne === 'string' && row.enseigne) ||
        (typeof json?.source === 'string' ? json.source : 'open-data'),
      territory: territoryName,
    };
    current.total += row.prix;
    current.count += 1;
    products.set(key, current);
  }

  return Array.from(products.entries()).map(([productId, value]) => ({
    productId,
    productLabel: value.label,
    territory: value.territory,
    price: Number((value.total / value.count).toFixed(2)),
    currency: 'EUR',
    source: value.source,
    observedAt: updatedAt,
  }));
}

function buildResponse(body: ApiPayload, status = 200, cacheControl = 'public, max-age=60') {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': cacheControl,
    },
  });
}

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const url = new URL(request.url);
  const territory = url.searchParams.get('territory');
  const product = url.searchParams.get('product');
  const cache = caches.default;
  const cacheKey = new Request(
    `${url.origin}/cache/prices/realtime?territory=${encodeURIComponent(
      territory ?? 'all'
    )}&product=${encodeURIComponent(product ?? 'all')}`
  );

  try {
    const cached = await cache.match(cacheKey);
    if (cached) {
      const cachedBody = await cached.json();
      const cachedResponse: ApiPayload = {
        ...cachedBody,
        state: 'cached',
        cache: 'hit',
        message: 'Réponse servie depuis le cache edge Cloudflare',
      };
      return buildResponse(cachedResponse, 200);
    }
  } catch (error) {
    console.error('Erreur lecture cache Cloudflare', error);
  }

  try {
    const sourceUrl = env?.REALTIME_SOURCE_URL || DEFAULT_SOURCE_URL;
    const upstream = await fetchWithTimeout(sourceUrl, REQUEST_TIMEOUT_MS, request.signal);
    if (!upstream.ok) {
      throw new Error(`Statut source: ${upstream.status}`);
    }

    const json = await upstream.json();
    const items = normalizeSource(json, territory, product);
    if (!items.length) {
      throw new Error('Donnée source vide ou invalide');
    }

    const payload: ApiPayload = {
      state: 'live',
      cache: 'miss',
      source: { name: 'Open data observatoire (GitHub)', url: sourceUrl },
      updated_at:
        typeof json?.date_snapshot === 'string'
          ? new Date(json.date_snapshot).toISOString()
          : new Date().toISOString(),
      items,
      meta: {
        territory: territory ?? json?.territoire ?? null,
        product: product ?? null,
        count: items.length,
      },
    };

    const response = buildResponse(payload, 200, 'public, max-age=3600, s-maxage=3600');

    try {
      await cache.put(cacheKey, response.clone());
    } catch (error) {
      console.warn('Impossible de stocker en cache Cloudflare', error);
    }

    return response;
  } catch (error) {
    console.error('Erreur source temps réel', error);
    const fallbackData = buildRealtimeFallback();
    const filteredFallback =
      territory || product
        ? fallbackData.filter((item) => {
            const territoryOk = territory
              ? item.territory.toLowerCase().includes(territory.toLowerCase())
              : true;
            const productOk = product
              ? item.productLabel.toLowerCase().includes(product.toLowerCase())
              : true;
            return territoryOk && productOk;
          })
        : fallbackData;

    const payload: ApiPayload = {
      state: 'offline',
      cache: 'none',
      source: { name: 'Fallback local', url: '/data/prices.json' },
      updated_at: filteredFallback[0]?.observedAt ?? new Date().toISOString(),
      items: filteredFallback,
      meta: {
        territory: territory ?? 'local',
        product: product ?? null,
        count: filteredFallback.length,
      },
      message: 'Flux externe indisponible, données locales servies en secours.',
    };

    return buildResponse(payload, 200);
  }
}
