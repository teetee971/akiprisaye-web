/**
 * Cloudflare Pages Function — Proxy vers le catalogue Courses U (Super U)
 *
 * Recherche les produits dans le catalogue Super U / Hyper U / Marché U.
 * DOM-TOM : Guadeloupe, Martinique, La Réunion, Guyane.
 *
 * Paramètres GET :
 *   - q         : libellé produit (ex: "lait uht 1l")
 *   - barcode   : code EAN (ex: "3560070123456")
 *   - territory : code territoire optionnel (ex: "gp", "mq", "re")
 *   - pageSize  : nombre de résultats (défaut: 20, max: 40)
 *
 * Le web scraping est autorisé conformément aux CGU et à la politique
 * de partage des données de Super U / Groupe U.
 */

const COURSES_U_BASE_URL = 'https://www.coursesu.com';
const CACHE_MAX_AGE_SECONDS = 1800; // 30 minutes
const FETCH_TIMEOUT_MS = 8000;
const MAX_RETRY_ATTEMPTS = 2;

/** Mappage territoire → code PDV (point de vente) Super U DOM-TOM */
const PDV_CODES_BY_TERRITORY: Partial<Record<string, string[]>> = {
  gp: ['076170', '076180', '076190'],  // Guadeloupe
  mq: ['097200', '097210'],            // Martinique
  re: ['097410', '097420'],            // La Réunion
  gf: ['097300'],                      // Guyane
  yt: ['097600'],                      // Mayotte
};

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'content-type': 'application/json; charset=utf-8',
};

type TerritoryCode =
  | 'fr'
  | 'gp'
  | 'mq'
  | 'gf'
  | 're'
  | 'yt'
  | 'pm'
  | 'bl'
  | 'mf'
  | 'wf'
  | 'pf'
  | 'nc'
  | 'tf';

type PriceObservation = {
  source: 'courses_u';
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

type CoursesUOffer = {
  price?: unknown;
  normalPrice?: unknown;
  crossedPrice?: unknown;
  promotionPrice?: unknown;
  discountedPrice?: unknown;
  pricePerUnit?: unknown;
  unitOfMeasure?: unknown;
  unit?: unknown;
  currency?: unknown;
};

type CoursesUProduct = {
  code?: unknown;
  ean?: unknown;
  gtin?: unknown;
  gtinNumber?: unknown;
  name?: unknown;
  label?: unknown;
  libelle?: unknown;
  productName?: unknown;
  title?: unknown;
  brand?: unknown;
  marque?: unknown;
  brandName?: unknown;
  images?: unknown[];
  imageUrl?: unknown;
  photo?: unknown;
  thumbnail?: unknown;
  offers?: CoursesUOffer[];
  offer?: CoursesUOffer;
  price?: unknown;
  normalPrice?: unknown;
  priceValue?: unknown;
  sellingPrice?: unknown;
  unit?: unknown;
  unitOfMeasure?: unknown;
};

type CoursesUSearchPayload = {
  products?: unknown;
  items?: unknown;
  results?: unknown;
  data?: unknown;
  hits?: unknown;
  response?: unknown;
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

const extractPrice = (product: CoursesUProduct): number | null => {
  const offer = Array.isArray(product.offers) ? product.offers[0] : product.offer;
  if (offer) {
    return (
      safeNumber(offer.promotionPrice) ??
      safeNumber(offer.discountedPrice) ??
      safeNumber(offer.price) ??
      safeNumber(offer.normalPrice) ??
      safeNumber(offer.crossedPrice)
    );
  }
  return (
    safeNumber(product.price) ??
    safeNumber(product.normalPrice) ??
    safeNumber(product.priceValue) ??
    safeNumber(product.sellingPrice)
  );
};

const extractUnit = (product: CoursesUProduct): PriceObservation['unit'] => {
  const offer = Array.isArray(product.offers) ? product.offers[0] : product.offer;
  const raw = safeString(
    offer?.unitOfMeasure ?? offer?.unit ?? product.unitOfMeasure ?? product.unit,
  )?.toLowerCase();
  if (!raw) return 'unit';
  if (raw.includes('kg') || raw.includes('kilo')) return 'kg';
  if (raw.includes('litre') || raw.includes('liter') || raw === 'l') return 'l';
  return 'unit';
};

const toProductsArray = (payload: CoursesUSearchPayload): CoursesUProduct[] => {
  // Handle nested response structure
  const unwrapped =
    (payload.response as CoursesUSearchPayload | undefined) ?? payload;

  for (const key of ['products', 'items', 'results', 'data', 'hits'] as const) {
    const val = (unwrapped as CoursesUSearchPayload)[key];
    if (Array.isArray(val)) return val as CoursesUProduct[];
  }
  if (Array.isArray(unwrapped)) return unwrapped as CoursesUProduct[];
  return [];
};

const mapProduct = (
  product: CoursesUProduct,
  territory: string | undefined,
  today: string,
): PriceObservation | null => {
  const price = extractPrice(product);
  if (price === null) return null;

  const barcode =
    safeString(product.code) ??
    safeString(product.ean) ??
    safeString(product.gtin) ??
    safeString(product.gtinNumber);

  const productName =
    safeString(product.name) ??
    safeString(product.label) ??
    safeString(product.libelle) ??
    safeString(product.productName) ??
    safeString(product.title);

  const brand =
    safeString(product.brand) ??
    safeString(product.marque) ??
    safeString(product.brandName);

  const images = Array.isArray(product.images) ? product.images : [];
  const firstImage = images[0];
  const imageUrl =
    safeString(typeof firstImage === 'string' ? firstImage : (firstImage as Record<string, unknown>)?.url) ??
    safeString(product.imageUrl) ??
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
    source: 'courses_u',
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
  maxAttempts = MAX_RETRY_ATTEMPTS,
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
  const pdvCodes =
    territory && PDV_CODES_BY_TERRITORY[territory]
      ? PDV_CODES_BY_TERRITORY[territory]!
      : [];

  const params = new URLSearchParams({
    query: searchTerm,
    page: '1',
    pageSize: String(pageSize),
  });
  if (pdvCodes.length > 0) {
    params.set('pdvCode', pdvCodes[0]);
  }

  const upstreamUrl = `${COURSES_U_BASE_URL}/api/2.0/catalog/search?${params.toString()}`;

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
          Referer: COURSES_U_BASE_URL,
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
    const payload = (await upstream.json()) as CoursesUSearchPayload;
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
