/**
 * Cloudflare Pages Function — Proxy de recherche produit multi-enseignes
 *
 * Effectue la recherche de produits sur les sites des enseignes de grande
 * distribution, contournant les restrictions CORS côté navigateur.
 *
 * Le web scraping est autorisé conformément aux CGU et à la politique
 * de partage des données de chaque enseigne.
 *
 * Paramètres GET :
 *   - retailer : identifiant de l'enseigne (coursesu|leclerc|carrefour|casino)
 *   - q        : libellé produit (ex: "lait uht 1l")
 *   - barcode  : code EAN optionnel (ex: "3560070123456")
 *   - pageSize : nombre de résultats (défaut: 6, max: 12)
 *
 * Réponse :
 *   {
 *     status: 'OK' | 'NO_DATA' | 'UNAVAILABLE',
 *     retailer: string,
 *     results: RetailerProduct[],
 *     fetchedAt: string,
 *   }
 */

const CACHE_MAX_AGE_SECONDS = 900; // 15 minutes

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'content-type': 'application/json; charset=utf-8',
};

const COMMON_FETCH_HEADERS = {
  'User-Agent':
    'A-KI-PRI-SA-YE/1.0 (observatoire prix DOM-TOM; contact: support@akiprisaye.fr)',
  Accept: 'application/json',
  'Accept-Language': 'fr-FR,fr;q=0.9',
};

type RetailerProduct = {
  title: string;
  imageUrl?: string;
  pageUrl?: string;
  brand?: string;
  price?: number;
  currency?: string;
  sizeText?: string;
};

type RetailerSearchResult = {
  status: 'OK' | 'NO_DATA' | 'UNAVAILABLE';
  retailer: string;
  results: RetailerProduct[];
  fetchedAt: string;
};

const SUPPORTED_RETAILERS = ['coursesu', 'leclerc', 'carrefour', 'casino'] as const;
type SupportedRetailer = (typeof SUPPORTED_RETAILERS)[number];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const safeStr = (v: unknown): string | undefined =>
  typeof v === 'string' && v.trim().length > 0 ? v.trim() : undefined;

const safeNum = (v: unknown): number | undefined => {
  if (typeof v === 'number' && Number.isFinite(v) && v > 0) return v;
  if (typeof v === 'string') {
    const n = Number(v.replace(',', '.'));
    if (Number.isFinite(n) && n > 0) return n;
  }
  return undefined;
};

const safeHttpUrl = (v: unknown): string | undefined => {
  const s = safeStr(v);
  return s && /^https?:\/\//i.test(s) ? s : undefined;
};

// ─── Courses U / Super U ─────────────────────────────────────────────────────

type CoursesUItem = {
  name?: unknown; label?: unknown; libelle?: unknown; title?: unknown;
  brand?: unknown; marque?: unknown; brandName?: unknown;
  images?: unknown[]; imageUrl?: unknown; photo?: unknown; thumbnail?: unknown;
  code?: unknown; ean?: unknown;
  price?: unknown; normalPrice?: unknown; priceValue?: unknown;
  offers?: Array<{ price?: unknown; normalPrice?: unknown }>;
  offer?: { price?: unknown; normalPrice?: unknown };
  quantity?: unknown; unitLabel?: unknown; volume?: unknown;
};

type CoursesUPayload = {
  products?: unknown; items?: unknown; results?: unknown; data?: unknown; hits?: unknown;
  response?: unknown;
};

function parseCoursesUProducts(payload: CoursesUPayload): RetailerProduct[] {
  const unwrapped = (payload.response as CoursesUPayload | undefined) ?? payload;
  let items: CoursesUItem[] = [];
  for (const key of ['products', 'items', 'results', 'data', 'hits'] as const) {
    const val = (unwrapped as CoursesUPayload)[key];
    if (Array.isArray(val)) { items = val as CoursesUItem[]; break; }
  }
  if (items.length === 0 && Array.isArray(unwrapped)) {
    items = unwrapped as CoursesUItem[];
  }

  return items
    .map((item): RetailerProduct | null => {
      const title =
        safeStr(item.name) ?? safeStr(item.label) ?? safeStr(item.libelle) ?? safeStr(item.title);
      if (!title) return null;

      const images = Array.isArray(item.images) ? item.images : [];
      const firstImg = images[0];
      const imageUrl =
        safeHttpUrl(typeof firstImg === 'string' ? firstImg : (firstImg as Record<string, unknown>)?.url) ??
        safeHttpUrl(item.imageUrl) ??
        safeHttpUrl(item.photo) ??
        safeHttpUrl(item.thumbnail);

      const ean = safeStr(item.code) ?? safeStr(item.ean);
      const pageUrl = ean
        ? `https://www.coursesu.com/p/${encodeURIComponent(title.toLowerCase().replace(/\s+/g, '-'))}/${ean}`
        : undefined;

      const offer = Array.isArray(item.offers) ? item.offers[0] : item.offer;
      const price =
        safeNum(offer?.price) ?? safeNum(offer?.normalPrice) ??
        safeNum(item.price) ?? safeNum(item.normalPrice) ?? safeNum(item.priceValue);

      return {
        title,
        imageUrl,
        pageUrl,
        brand: safeStr(item.brand) ?? safeStr(item.marque) ?? safeStr(item.brandName),
        price,
        currency: 'EUR',
        sizeText: safeStr(item.quantity) ?? safeStr(item.unitLabel) ?? safeStr(item.volume),
      };
    })
    .filter((p): p is RetailerProduct => p !== null);
}

async function searchCoursesU(query: string, pageSize: number): Promise<RetailerProduct[]> {
  const params = new URLSearchParams({ query, page: '1', pageSize: String(pageSize) });
  const url = `https://www.coursesu.com/api/2.0/catalog/search?${params.toString()}`;
  const res = await fetch(url, { headers: { ...COMMON_FETCH_HEADERS, Referer: 'https://www.coursesu.com' } });
  if (!res.ok) return [];
  const payload = (await res.json()) as CoursesUPayload;
  return parseCoursesUProducts(payload);
}

// ─── E.Leclerc ────────────────────────────────────────────────────────────────

type LeclercItem = {
  libelle?: unknown; label?: unknown; name?: unknown; productName?: unknown;
  marque?: unknown; brand?: unknown;
  imageUrl?: unknown; photo?: unknown; thumbnail?: unknown;
  code?: unknown; ean?: unknown;
  price?: unknown; priceValue?: unknown; selling_price?: unknown; sellingPrice?: unknown;
  offers?: Array<{ price?: unknown }>;
  offer?: { price?: unknown };
  unit?: unknown;
};

type LeclercPayload = {
  products?: unknown; items?: unknown; results?: unknown; data?: unknown; hits?: unknown;
};

function parseLeclercProducts(payload: LeclercPayload): RetailerProduct[] {
  let items: LeclercItem[] = [];
  for (const key of ['products', 'items', 'results', 'data', 'hits'] as const) {
    const val = payload[key];
    if (Array.isArray(val)) { items = val as LeclercItem[]; break; }
  }

  return items
    .map((item): RetailerProduct | null => {
      const title =
        safeStr(item.libelle) ?? safeStr(item.label) ?? safeStr(item.name) ?? safeStr(item.productName);
      if (!title) return null;

      const imageUrl =
        safeHttpUrl(item.imageUrl) ?? safeHttpUrl(item.photo) ?? safeHttpUrl(item.thumbnail);

      const ean = safeStr(item.code) ?? safeStr(item.ean);
      const pageUrl = ean
        ? `https://www.e.leclerc/p/${encodeURIComponent(title.toLowerCase().replace(/\s+/g, '-'))}/${ean}`
        : undefined;

      const offer = Array.isArray(item.offers) ? item.offers[0] : item.offer;
      const price =
        safeNum(offer?.price) ??
        safeNum(item.price) ?? safeNum(item.priceValue) ??
        safeNum(item.selling_price) ?? safeNum(item.sellingPrice);

      return {
        title,
        imageUrl,
        pageUrl,
        brand: safeStr(item.marque) ?? safeStr(item.brand),
        price,
        currency: 'EUR',
      };
    })
    .filter((p): p is RetailerProduct => p !== null);
}

async function searchLeclerc(query: string, pageSize: number): Promise<RetailerProduct[]> {
  const params = new URLSearchParams({ query, page: '1', pageSize: String(pageSize) });
  const url = `https://www.e.leclerc/api/rest/live-config/product-search-v2?${params.toString()}`;
  const res = await fetch(url, { headers: { ...COMMON_FETCH_HEADERS, Referer: 'https://www.e.leclerc' } });
  if (!res.ok) return [];
  const payload = (await res.json()) as LeclercPayload;
  return parseLeclercProducts(payload);
}

// ─── Carrefour ────────────────────────────────────────────────────────────────

type CarrefourHit = {
  title?: unknown; name?: unknown; label?: unknown;
  brand?: unknown; marque?: unknown;
  image?: unknown; imageUrl?: unknown; thumbnail?: unknown;
  url?: unknown; link?: unknown; pageUrl?: unknown;
  price?: unknown; sellingPrice?: unknown; priceValue?: unknown;
  offers?: Array<{ price?: unknown }>;
  packaging?: unknown; size?: unknown; quantity?: unknown;
};

type CarrefourPayload = {
  hits?: unknown; products?: unknown; items?: unknown; results?: unknown; data?: unknown;
};

function parseCarrefourProducts(payload: CarrefourPayload): RetailerProduct[] {
  let items: CarrefourHit[] = [];
  for (const key of ['hits', 'products', 'items', 'results', 'data'] as const) {
    const val = payload[key];
    if (Array.isArray(val)) { items = val as CarrefourHit[]; break; }
  }

  return items
    .map((item): RetailerProduct | null => {
      const title =
        safeStr(item.title) ?? safeStr(item.name) ?? safeStr(item.label);
      if (!title) return null;

      const imageUrl =
        safeHttpUrl(item.image) ?? safeHttpUrl(item.imageUrl) ?? safeHttpUrl(item.thumbnail);

      const pageUrl = safeHttpUrl(item.url) ?? safeHttpUrl(item.link) ?? safeHttpUrl(item.pageUrl);

      const offer = Array.isArray(item.offers) ? item.offers[0] : undefined;
      const price =
        safeNum(offer?.price) ??
        safeNum(item.price) ?? safeNum(item.sellingPrice) ?? safeNum(item.priceValue);

      return {
        title,
        imageUrl,
        pageUrl,
        brand: safeStr(item.brand) ?? safeStr(item.marque),
        price,
        currency: 'EUR',
        sizeText: safeStr(item.packaging) ?? safeStr(item.size) ?? safeStr(item.quantity),
      };
    })
    .filter((p): p is RetailerProduct => p !== null);
}

async function searchCarrefour(query: string, pageSize: number): Promise<RetailerProduct[]> {
  const params = new URLSearchParams({
    q: query,
    limit: String(pageSize),
    lang: 'fr',
  });
  const url = `https://www.carrefour.fr/api/ibexa/v2/akeno/search?${params.toString()}`;
  const res = await fetch(url, {
    headers: {
      ...COMMON_FETCH_HEADERS,
      Referer: 'https://www.carrefour.fr',
      'X-Requested-With': 'XMLHttpRequest',
    },
  });
  if (!res.ok) return [];
  const payload = (await res.json()) as CarrefourPayload;
  return parseCarrefourProducts(payload);
}

// ─── Casino ───────────────────────────────────────────────────────────────────

type CasinoItem = {
  title?: unknown; name?: unknown; label?: unknown; productName?: unknown;
  brand?: unknown; marque?: unknown; brandName?: unknown;
  image?: unknown; imageUrl?: unknown; photo?: unknown; thumbnail?: unknown;
  url?: unknown; link?: unknown; canonicalUrl?: unknown;
  price?: unknown; sellingPrice?: unknown; promotionPrice?: unknown;
  offers?: Array<{ price?: unknown }>;
  quantity?: unknown; size?: unknown;
};

type CasinoPayload = {
  products?: unknown; items?: unknown; results?: unknown; data?: unknown;
  hits?: unknown; result?: unknown;
};

function parseCasinoProducts(payload: CasinoPayload): RetailerProduct[] {
  const unwrapped = (payload.result as CasinoPayload | undefined) ?? payload;
  let items: CasinoItem[] = [];
  for (const key of ['products', 'items', 'results', 'data', 'hits'] as const) {
    const val = (unwrapped as CasinoPayload)[key];
    if (Array.isArray(val)) { items = val as CasinoItem[]; break; }
  }

  return items
    .map((item): RetailerProduct | null => {
      const title =
        safeStr(item.title) ?? safeStr(item.name) ??
        safeStr(item.label) ?? safeStr(item.productName);
      if (!title) return null;

      const imageUrl =
        safeHttpUrl(item.image) ?? safeHttpUrl(item.imageUrl) ??
        safeHttpUrl(item.photo) ?? safeHttpUrl(item.thumbnail);

      const pageUrl =
        safeHttpUrl(item.url) ?? safeHttpUrl(item.link) ?? safeHttpUrl(item.canonicalUrl);

      const offer = Array.isArray(item.offers) ? item.offers[0] : undefined;
      const price =
        safeNum(offer?.price) ??
        safeNum(item.promotionPrice) ?? safeNum(item.price) ?? safeNum(item.sellingPrice);

      return {
        title,
        imageUrl,
        pageUrl,
        brand: safeStr(item.brand) ?? safeStr(item.marque) ?? safeStr(item.brandName),
        price,
        currency: 'EUR',
        sizeText: safeStr(item.quantity) ?? safeStr(item.size),
      };
    })
    .filter((p): p is RetailerProduct => p !== null);
}

async function searchCasino(query: string, pageSize: number): Promise<RetailerProduct[]> {
  const params = new URLSearchParams({ q: query, limit: String(pageSize) });
  const url = `https://www.casino.fr/api/catalog/search?${params.toString()}`;
  const res = await fetch(url, {
    headers: {
      ...COMMON_FETCH_HEADERS,
      Referer: 'https://www.casino.fr',
    },
  });
  if (!res.ok) return [];
  const payload = (await res.json()) as CasinoPayload;
  return parseCasinoProducts(payload);
}

// ─── Dispatch ─────────────────────────────────────────────────────────────────

async function searchRetailer(
  retailer: SupportedRetailer,
  query: string,
  pageSize: number,
): Promise<RetailerProduct[]> {
  switch (retailer) {
    case 'coursesu':  return searchCoursesU(query, pageSize);
    case 'leclerc':   return searchLeclerc(query, pageSize);
    case 'carrefour': return searchCarrefour(query, pageSize);
    case 'casino':    return searchCasino(query, pageSize);
    default:          return [];
  }
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export const onRequestOptions: PagesFunction = async () =>
  new Response(null, { status: 204, headers: CORS_HEADERS });

export const onRequestGet: PagesFunction = async ({ request }) => {
  const url = new URL(request.url);

  const retailer = (url.searchParams.get('retailer') ?? '').trim().toLowerCase();
  const query = (
    url.searchParams.get('q') ??
    url.searchParams.get('query') ??
    url.searchParams.get('barcode') ??
    ''
  ).trim();
  const pageSize = Math.min(12, Math.max(1, Number(url.searchParams.get('pageSize') ?? '6')));

  if (!retailer || !(SUPPORTED_RETAILERS as readonly string[]).includes(retailer)) {
    return new Response(
      JSON.stringify({
        error: `Paramètre requis: retailer (${SUPPORTED_RETAILERS.join('|')})`,
      }),
      { status: 400, headers: CORS_HEADERS },
    );
  }

  if (!query) {
    return new Response(
      JSON.stringify({ error: 'Paramètre requis: q (libellé) ou barcode (EAN)' }),
      { status: 400, headers: CORS_HEADERS },
    );
  }

  const cacheParams = new URLSearchParams({ retailer, q: query, pageSize: String(pageSize) });
  const cacheKeyUrl = `https://retailer-search.internal/?${cacheParams.toString()}`;
  const cacheKey = new Request(cacheKeyUrl, { method: 'GET' });
  const cache = caches.default;

  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  let results: RetailerProduct[] = [];
  let status: RetailerSearchResult['status'] = 'UNAVAILABLE';

  try {
    results = await searchRetailer(retailer as SupportedRetailer, query, pageSize);
    status = results.length > 0 ? 'OK' : 'NO_DATA';
  } catch {
    status = 'UNAVAILABLE';
  }

  const payload: RetailerSearchResult = {
    status,
    retailer,
    results,
    fetchedAt: new Date().toISOString(),
  };

  const response = new Response(JSON.stringify(payload), {
    status: 200,
    headers: {
      ...CORS_HEADERS,
      'Cache-Control': `public, max-age=${CACHE_MAX_AGE_SECONDS}`,
    },
  });

  if (status !== 'UNAVAILABLE') {
    await cache.put(cacheKey, response.clone());
  }

  return response;
};
