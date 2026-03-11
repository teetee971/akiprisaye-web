/**
 * Cloudflare Pages Function — Proxy vers le catalogue Leader Price
 *
 * Recherche les produits dans le catalogue Leader Price.
 * DOM-TOM : Guadeloupe, Martinique, La Réunion, Guyane.
 * Leader Price est très présent aux Antilles et à La Réunion.
 *
 * Paramètres GET :
 *   - q         : libellé produit (ex: "lait uht 1l")
 *   - barcode   : code EAN (ex: "3560070123456")
 *   - territory : code territoire optionnel (ex: "gp", "mq", "re")
 *   - pageSize  : nombre de résultats (défaut: 20, max: 40)
 */

const LEADER_PRICE_BASE_URL = 'https://www.leaderprice.fr';
const CACHE_MAX_AGE_SECONDS = 1800; // 30 minutes
const FETCH_TIMEOUT_MS = 8000;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'content-type': 'application/json; charset=utf-8',
};

type TerritoryCode =
  | 'fr' | 'gp' | 'mq' | 'gf' | 're' | 'yt'
  | 'pm' | 'bl' | 'mf' | 'wf' | 'pf' | 'nc' | 'tf';

type PriceObservation = {
  source: 'leader_price';
  productName?: string;
  brand?: string;
  barcode?: string;
  price: number;
  currency: 'EUR';
  unit?: 'unit' | 'kg' | 'l';
  observedAt?: string;
  territory?: TerritoryCode;
  metadata?: Record<string, string>;
};

type LeaderPriceOffer = {
  price?: unknown;
  sellingPrice?: unknown;
  promotionPrice?: unknown;
  pricePerUnit?: unknown;
  unit?: unknown;
  unitOfMeasure?: unknown;
};

type LeaderPriceProduct = {
  ean?: unknown;
  code?: unknown;
  gtin?: unknown;
  name?: unknown;
  label?: unknown;
  title?: unknown;
  libelle?: unknown;
  brand?: unknown;
  marque?: unknown;
  imageUrl?: unknown;
  image?: unknown;
  photo?: unknown;
  thumbnail?: unknown;
  price?: unknown;
  sellingPrice?: unknown;
  promotionPrice?: unknown;
  unit?: unknown;
  unitOfMeasure?: unknown;
  offers?: LeaderPriceOffer[];
  offer?: LeaderPriceOffer;
};

type LeaderPriceSearchPayload = {
  products?: unknown;
  items?: unknown;
  results?: unknown;
  data?: unknown;
  hits?: unknown;
};

const safeString = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;

const safeNumber = (value: unknown): number | null => {
  if (typeof value === 'number') return Number.isFinite(value) && value > 0 ? value : null;
  if (typeof value === 'string') {
    const parsed = Number(value.replace(',', '.'));
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }
  return null;
};

const extractPrice = (product: LeaderPriceProduct): number | null => {
  const offer = Array.isArray(product.offers) ? product.offers[0] : product.offer;
  if (offer) {
    return (
      safeNumber(offer.promotionPrice) ??
      safeNumber(offer.price) ??
      safeNumber(offer.sellingPrice)
    );
  }
  return (
    safeNumber(product.promotionPrice) ??
    safeNumber(product.price) ??
    safeNumber(product.sellingPrice)
  );
};

const extractUnit = (product: LeaderPriceProduct): PriceObservation['unit'] => {
  const offer = Array.isArray(product.offers) ? product.offers[0] : product.offer;
  const raw = safeString(
    offer?.unitOfMeasure ?? offer?.unit ?? product.unitOfMeasure ?? product.unit,
  )?.toLowerCase();
  if (!raw) return 'unit';
  if (raw.includes('kg') || raw.includes('kilo')) return 'kg';
  if (raw.includes('litre') || raw.includes('liter') || raw === 'l') return 'l';
  return 'unit';
};

const toProductsArray = (payload: LeaderPriceSearchPayload): LeaderPriceProduct[] => {
  for (const key of ['products', 'items', 'results', 'data', 'hits'] as const) {
    const val = payload[key];
    if (Array.isArray(val)) return val as LeaderPriceProduct[];
  }
  if (Array.isArray(payload)) return payload as LeaderPriceProduct[];
  return [];
};

const mapProduct = (
  product: LeaderPriceProduct,
  territory: string | undefined,
  today: string,
): PriceObservation | null => {
  const price = extractPrice(product);
  if (price === null) return null;

  const barcode =
    safeString(product.ean) ??
    safeString(product.code) ??
    safeString(product.gtin);

  const productName =
    safeString(product.name) ??
    safeString(product.label) ??
    safeString(product.title) ??
    safeString(product.libelle);

  const brand = safeString(product.brand) ?? safeString(product.marque);

  const imageUrl =
    safeString(product.imageUrl) ??
    safeString(product.image) ??
    safeString(product.photo) ??
    safeString(product.thumbnail);

  const metadata: Record<string, string> | undefined = imageUrl ? { imageUrl } : undefined;

  const resolvedTerritory =
    territory &&
    ['fr', 'gp', 'mq', 'gf', 're', 'yt', 'pm', 'bl', 'mf', 'wf', 'pf', 'nc', 'tf'].includes(
      territory,
    )
      ? (territory as TerritoryCode)
      : undefined;

  return {
    source: 'leader_price',
    productName,
    brand,
    barcode,
    price,
    currency: 'EUR',
    unit: extractUnit(product),
    observedAt: today,
    territory: resolvedTerritory,
    metadata,
  };
};

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxAttempts = 2,
): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
      try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        if (response.status === 429 && attempt < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
          continue;
        }
        return response;
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (error) {
      lastError = error;
      const isAbort = error instanceof Error && error.name === 'AbortError';
      if (isAbort || attempt >= maxAttempts) throw error;
      await new Promise((resolve) => setTimeout(resolve, 300 * attempt));
    }
  }
  throw lastError ?? new Error('Fetch failed after retries');
}

export const onRequestOptions: PagesFunction = async () =>
  new Response(null, { status: 204, headers: CORS_HEADERS });

export const onRequestGet: PagesFunction = async ({ request }) => {
  const url = new URL(request.url);

  const query = (url.searchParams.get('q') ?? url.searchParams.get('query') ?? '').trim();
  const barcode = (url.searchParams.get('barcode') ?? '').trim();
  const territory = (url.searchParams.get('territory') ?? '').trim();
  const pageSize = Math.min(40, Math.max(1, Number(url.searchParams.get('pageSize') ?? '20')));

  if (!query && !barcode) {
    return new Response(
      JSON.stringify({ error: 'Paramètre requis: q (libellé) ou barcode (EAN)' }),
      { status: 400, headers: CORS_HEADERS },
    );
  }

  const searchTerm = barcode || query;

  const params = new URLSearchParams({
    q: searchTerm,
    pageSize: String(pageSize),
    page: '1',
  });

  const upstreamUrl = `${LEADER_PRICE_BASE_URL}/api/catalog/search?${params.toString()}`;

  const cache = caches.default;
  const cacheKey = new Request(upstreamUrl, { method: 'GET' });

  let upstream = await cache.match(cacheKey);
  if (!upstream) {
    try {
      upstream = await fetchWithRetry(upstreamUrl, {
        headers: {
          'User-Agent':
            'A-KI-PRI-SA-YE/1.0 (observatoire prix DOM-TOM; contact: support@akiprisaye.fr)',
          Accept: 'application/json',
          'Accept-Language': 'fr-FR,fr;q=0.9',
          Referer: LEADER_PRICE_BASE_URL,
        },
      });
    } catch {
      return new Response(
        JSON.stringify({ status: 'UNAVAILABLE', observations: [], upstream: { url: upstreamUrl } }),
        { status: 200, headers: CORS_HEADERS },
      );
    }

    if (upstream.ok) {
      const toCache = new Response(upstream.body, upstream);
      toCache.headers.set('Cache-Control', `public, max-age=${CACHE_MAX_AGE_SECONDS}`);
      await cache.put(cacheKey, toCache.clone());
      upstream = toCache;
    }
  }

  if (!upstream.ok) {
    return new Response(
      JSON.stringify({
        status: upstream.status >= 500 ? 'UNAVAILABLE' : 'PARTIAL',
        observations: [],
        upstream: { status: upstream.status, url: upstreamUrl },
      }),
      { status: 200, headers: CORS_HEADERS },
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  let observations: PriceObservation[] = [];

  try {
    const payload = (await upstream.json()) as LeaderPriceSearchPayload;
    observations = toProductsArray(payload)
      .map((p) => mapProduct(p, territory, today))
      .filter((o): o is PriceObservation => o !== null);
  } catch {
    return new Response(
      JSON.stringify({
        status: 'UNAVAILABLE',
        observations: [],
        upstream: { url: upstreamUrl },
      }),
      { status: 200, headers: CORS_HEADERS },
    );
  }

  return new Response(
    JSON.stringify({
      status: observations.length > 0 ? 'OK' : 'NO_DATA',
      observations,
      upstream: { url: upstreamUrl },
    }),
    { status: 200, headers: CORS_HEADERS },
  );
};
