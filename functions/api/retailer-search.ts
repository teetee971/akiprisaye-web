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
 *   - retailer  : identifiant de l'enseigne (coursesu|leclerc|carrefour|casino|intermarche|all)
 *                 Utiliser "all" pour interroger toutes les enseignes en parallèle.
 *   - retailers : alias de retailer, accepte une liste séparée par des virgules
 *                 (ex: "coursesu,leclerc,carrefour")
 *   - q         : libellé produit (ex: "lait uht 1l")
 *   - barcode   : code EAN optionnel (ex: "3560070123456")
 *   - pageSize  : nombre de résultats par enseigne (défaut: 6, max: 12)
 *
 * Réponse (retailer unique) :
 *   { status, retailer, results, fetchedAt }
 *
 * Réponse (multi-enseignes ou "all") :
 *   { status, retailers: { [id]: { status, results } }, results, fetchedAt }
 */

const CACHE_MAX_AGE_SECONDS = 900; // 15 minutes
const FETCH_TIMEOUT_MS = 7000;
const DEDUPLICATION_BUFFER = 2; // extra items per retailer to absorb deduplication losses

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

type MultiRetailerSearchResult = {
  status: 'OK' | 'NO_DATA' | 'UNAVAILABLE';
  retailers: Record<string, { status: RetailerSearchResult['status']; results: RetailerProduct[] }>;
  results: RetailerProduct[];
  fetchedAt: string;
};

const SUPPORTED_RETAILERS = ['coursesu', 'leclerc', 'carrefour', 'casino', 'intermarche'] as const;
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

async function fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

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
  try {
    const res = await fetchWithTimeout(url, { headers: { ...COMMON_FETCH_HEADERS, Referer: 'https://www.coursesu.com' } });
    if (!res.ok) return [];
    const payload = (await res.json()) as CoursesUPayload;
    return parseCoursesUProducts(payload);
  } catch { return []; }
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
  try {
    const res = await fetchWithTimeout(url, { headers: { ...COMMON_FETCH_HEADERS, Referer: 'https://www.e.leclerc' } });
    if (!res.ok) return [];
    const payload = (await res.json()) as LeclercPayload;
    return parseLeclercProducts(payload);
  } catch { return []; }
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
  try {
    const res = await fetchWithTimeout(url, {
      headers: {
        ...COMMON_FETCH_HEADERS,
        Referer: 'https://www.carrefour.fr',
        'X-Requested-With': 'XMLHttpRequest',
      },
    });
    if (!res.ok) return [];
    const payload = (await res.json()) as CarrefourPayload;
    return parseCarrefourProducts(payload);
  } catch { return []; }
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
  try {
    const res = await fetchWithTimeout(url, {
      headers: {
        ...COMMON_FETCH_HEADERS,
        Referer: 'https://www.casino.fr',
      },
    });
    if (!res.ok) return [];
    const payload = (await res.json()) as CasinoPayload;
    return parseCasinoProducts(payload);
  } catch { return []; }
}

// ─── Intermarché ──────────────────────────────────────────────────────────────

type IntermarcheItem = {
  label?: unknown; name?: unknown; title?: unknown; ean?: unknown; code?: unknown;
  brand?: unknown; marque?: unknown; brandLabel?: unknown;
  image?: unknown; imageUrl?: unknown; photo?: unknown; thumbnail?: unknown;
  url?: unknown; link?: unknown; canonicalUrl?: unknown;
  price?: unknown; sellingPrice?: unknown; promotionPrice?: unknown;
  offers?: Array<{ price?: unknown; promotionPrice?: unknown }>;
  offer?: { price?: unknown; promotionPrice?: unknown };
  quantity?: unknown; unitLabel?: unknown;
};

type IntermarchePayload = {
  products?: unknown; items?: unknown; results?: unknown; data?: unknown;
  hits?: unknown; content?: unknown;
};

function parseIntermarcheProducts(payload: IntermarchePayload): RetailerProduct[] {
  const unwrapped = (payload.content as IntermarchePayload | undefined) ?? payload;
  let items: IntermarcheItem[] = [];
  for (const key of ['products', 'items', 'results', 'data', 'hits'] as const) {
    const val = (unwrapped as IntermarchePayload)[key];
    if (Array.isArray(val)) { items = val as IntermarcheItem[]; break; }
  }

  return items
    .map((item): RetailerProduct | null => {
      const title =
        safeStr(item.label) ?? safeStr(item.name) ?? safeStr(item.title);
      if (!title) return null;

      const imageUrl =
        safeHttpUrl(item.image) ?? safeHttpUrl(item.imageUrl) ??
        safeHttpUrl(item.photo) ?? safeHttpUrl(item.thumbnail);

      const pageUrl =
        safeHttpUrl(item.url) ?? safeHttpUrl(item.link) ?? safeHttpUrl(item.canonicalUrl);

      const offer = Array.isArray(item.offers) ? item.offers[0] : item.offer;
      const price =
        safeNum(offer?.promotionPrice) ?? safeNum(offer?.price) ??
        safeNum(item.promotionPrice) ?? safeNum(item.price) ?? safeNum(item.sellingPrice);

      return {
        title,
        imageUrl,
        pageUrl,
        brand: safeStr(item.brand) ?? safeStr(item.marque) ?? safeStr(item.brandLabel),
        price,
        currency: 'EUR',
        sizeText: safeStr(item.quantity) ?? safeStr(item.unitLabel),
      };
    })
    .filter((p): p is RetailerProduct => p !== null);
}

async function searchIntermarche(query: string, pageSize: number): Promise<RetailerProduct[]> {
  const params = new URLSearchParams({ q: query, limit: String(pageSize), lang: 'fr' });
  const url = `https://www.intermarche.com/api/v2/products/search?${params.toString()}`;
  try {
    const res = await fetchWithTimeout(url, {
      headers: {
        ...COMMON_FETCH_HEADERS,
        Referer: 'https://www.intermarche.com',
      },
    });
    if (!res.ok) return [];
    const payload = (await res.json()) as IntermarchePayload;
    return parseIntermarcheProducts(payload);
  } catch { return []; }
}

// ─── Dispatch ─────────────────────────────────────────────────────────────────

async function searchRetailer(
  retailer: SupportedRetailer,
  query: string,
  pageSize: number,
): Promise<RetailerProduct[]> {
  switch (retailer) {
    case 'coursesu':    return searchCoursesU(query, pageSize);
    case 'leclerc':     return searchLeclerc(query, pageSize);
    case 'carrefour':   return searchCarrefour(query, pageSize);
    case 'casino':      return searchCasino(query, pageSize);
    case 'intermarche': return searchIntermarche(query, pageSize);
    default:            return [];
  }
}

/**
 * Recherche en parallèle sur plusieurs enseignes.
 * Retourne les résultats agrégés avec les statuts individuels par enseigne.
 */
async function searchAllRetailers(
  retailers: SupportedRetailer[],
  query: string,
  pageSize: number,
): Promise<MultiRetailerSearchResult> {
  const settled = await Promise.allSettled(
    retailers.map((r) => searchRetailer(r, query, Math.ceil(pageSize / retailers.length) + DEDUPLICATION_BUFFER)),
  );

  const retailerMap: MultiRetailerSearchResult['retailers'] = {};
  const allResults: RetailerProduct[] = [];
  const seenTitles = new Set<string>();

  for (let i = 0; i < retailers.length; i++) {
    const key = retailers[i];
    const result = settled[i];
    if (result.status === 'fulfilled') {
      const results = result.value;
      retailerMap[key] = {
        status: results.length > 0 ? 'OK' : 'NO_DATA',
        results,
      };
      for (const r of results) {
        const titleKey = r.title.toLowerCase().trim();
        if (!seenTitles.has(titleKey)) {
          seenTitles.add(titleKey);
          allResults.push(r);
        }
      }
    } else {
      retailerMap[key] = { status: 'UNAVAILABLE', results: [] };
    }
  }

  const overallStatus: RetailerSearchResult['status'] =
    allResults.length > 0 ? 'OK' :
    Object.values(retailerMap).every((r) => r.status === 'UNAVAILABLE') ? 'UNAVAILABLE' :
    'NO_DATA';

  return {
    status: overallStatus,
    retailers: retailerMap,
    results: allResults.slice(0, pageSize),
    fetchedAt: new Date().toISOString(),
  };
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export const onRequestOptions: PagesFunction = async () =>
  new Response(null, { status: 204, headers: CORS_HEADERS });

export const onRequestGet: PagesFunction = async ({ request }) => {
  const url = new URL(request.url);

  // Accept "retailer=all" or "retailers=coursesu,leclerc" or "retailer=coursesu"
  const retailerParam = (
    url.searchParams.get('retailer') ??
    url.searchParams.get('retailers') ??
    ''
  ).trim().toLowerCase();

  const query = (
    url.searchParams.get('q') ??
    url.searchParams.get('query') ??
    url.searchParams.get('barcode') ??
    ''
  ).trim();
  const pageSize = Math.min(12, Math.max(1, Number(url.searchParams.get('pageSize') ?? '6')));

  if (!query) {
    return new Response(
      JSON.stringify({ error: 'Paramètre requis: q (libellé) ou barcode (EAN)' }),
      { status: 400, headers: CORS_HEADERS },
    );
  }

  if (!retailerParam) {
    return new Response(
      JSON.stringify({
        error: `Paramètre requis: retailer (${[...SUPPORTED_RETAILERS, 'all'].join('|')})`,
      }),
      { status: 400, headers: CORS_HEADERS },
    );
  }

  // Resolve retailer list
  const isAll = retailerParam === 'all';
  const requestedRetailers: SupportedRetailer[] = isAll
    ? [...SUPPORTED_RETAILERS]
    : retailerParam
        .split(',')
        .map((s) => s.trim())
        .filter((s): s is SupportedRetailer =>
          (SUPPORTED_RETAILERS as readonly string[]).includes(s),
        );

  const isMulti = requestedRetailers.length > 1;

  if (!isAll && requestedRetailers.length === 0) {
    return new Response(
      JSON.stringify({
        error: `Enseignes non reconnues. Valeurs acceptées: ${SUPPORTED_RETAILERS.join('|')}|all`,
      }),
      { status: 400, headers: CORS_HEADERS },
    );
  }

  if (!isMulti) {
    // Single retailer — use cache
    const retailer = requestedRetailers[0];
    const cacheParams = new URLSearchParams({ retailer, q: query, pageSize: String(pageSize) });
    const cacheKeyUrl = `https://retailer-search.internal/?${cacheParams.toString()}`;
    const cacheKey = new Request(cacheKeyUrl, { method: 'GET' });
    const cache = caches.default;

    const cached = await cache.match(cacheKey);
    if (cached) return cached;

    const results = await searchRetailer(retailer, query, pageSize);
    const status: RetailerSearchResult['status'] = results.length > 0 ? 'OK' : 'NO_DATA';

    const payload: RetailerSearchResult = {
      status,
      retailer,
      results,
      fetchedAt: new Date().toISOString(),
    };

    const response = new Response(JSON.stringify(payload), {
      status: 200,
      headers: { ...CORS_HEADERS, 'Cache-Control': `public, max-age=${CACHE_MAX_AGE_SECONDS}` },
    });
    if (status !== 'UNAVAILABLE') await cache.put(cacheKey, response.clone());
    return response;
  }

  // Multi-retailer parallel search — no caching (too many combinations)
  const multiPayload = await searchAllRetailers(requestedRetailers, query, pageSize);
  return new Response(JSON.stringify(multiPayload), {
    status: 200,
    headers: { ...CORS_HEADERS, 'Cache-Control': `public, max-age=${CACHE_MAX_AGE_SECONDS}` },
  });
};
