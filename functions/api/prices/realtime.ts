/**
 * Cloudflare Pages Function — Real-time price feed
 *
 * Serves the real-time price stream consumed by allPriceAggregatorService.ts (Source 4).
 * Fetches recent price observations from OpenPrices (prices.openfoodfacts.org)
 * filtered by EAN barcode and territory (ISO 3166-1 country code).
 *
 * GET /api/prices/realtime?ean={ean}&territory={code}&limit={n}
 *
 * Returns:
 *   { items: PriceFeedItem[], fetchedAt: string, count: number }
 *
 * Cached for 5 minutes in Cloudflare edge.
 */

const OPEN_PRICES_BASE = 'https://prices.openfoodfacts.org/api/v1';
const CACHE_TTL_SECONDS = 300; // 5 minutes
const REQUEST_TIMEOUT_MS = 10_000;
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

/**
 * Maps our territory codes (lowercase ISO 3166-1) to the country codes used by
 * the OpenPrices API. They are identical for DOM-TOM territories.
 */
const VALID_TERRITORY_CODES = new Set([
  'fr', 'gp', 'mq', 'gf', 're', 'yt', 'pm', 'bl', 'mf',
]);

interface OpenPricesItem {
  id?: number | string;
  product_code?: string;
  product_name?: string;
  price?: number | string;
  currency?: string;
  date?: string;
  created?: string;
  updated?: string;
  price_per?: string;
  location_id?: number | string;
  location_osm_id?: number | string;
  location_osm_type?: string;
  proof_id?: number | string;
  price_is_discounted?: boolean;
  country_code?: string;
}

interface OpenPricesResponse {
  count?: number;
  items?: OpenPricesItem[];
  results?: OpenPricesItem[];
}

interface PriceFeedItem {
  productId: string;
  productLabel: string;
  territory: string | null;
  price: number;
  currency: 'EUR';
  source: string;
  observedAt: string | null;
  isDiscounted: boolean;
  proofId?: string;
  locationId?: string;
}

function withTimeout(ms: number): AbortController {
  const ctrl = new AbortController();
  setTimeout(() => ctrl.abort(), ms);
  return ctrl;
}

function jsonResponse(
  payload: unknown,
  status = 200,
  extra?: Record<string, string>,
): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...CORS_HEADERS,
      ...extra,
    },
  });
}

function normalizeLimit(raw: string | null): number {
  const n = Number(raw ?? DEFAULT_LIMIT);
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_LIMIT;
  return Math.min(Math.floor(n), MAX_LIMIT);
}

function toISO(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function mapItem(item: OpenPricesItem, ean: string, territory: string): PriceFeedItem | null {
  const price = Number(item.price);
  if (!Number.isFinite(price) || price <= 0) return null;
  const currency = String(item.currency ?? '').toUpperCase();
  if (currency !== 'EUR') return null;

  return {
    productId: item.product_code ?? ean,
    productLabel: item.product_name ?? `Produit ${ean}`,
    territory: item.country_code ?? territory ?? null,
    price,
    currency: 'EUR',
    source: 'open_prices',
    observedAt: toISO(item.date ?? item.created ?? item.updated),
    isDiscounted: item.price_is_discounted === true,
    proofId: item.proof_id != null ? String(item.proof_id) : undefined,
    locationId: item.location_id != null ? String(item.location_id) : (
      item.location_osm_id != null ? String(item.location_osm_id) : undefined
    ),
  };
}

export const onRequestOptions: PagesFunction = async () =>
  new Response(null, { status: 204, headers: CORS_HEADERS });

export const onRequestGet: PagesFunction = async ({ request }) => {
  const url = new URL(request.url);

  const ean = (url.searchParams.get('ean') ?? '').trim();
  const rawTerritory = (url.searchParams.get('territory') ?? '').trim().toLowerCase();
  const territory = VALID_TERRITORY_CODES.has(rawTerritory) ? rawTerritory : '';
  const limit = normalizeLimit(url.searchParams.get('limit'));

  if (!ean || !/^\d{8,14}$/.test(ean)) {
    return jsonResponse({ error: 'Missing or invalid ean (8–14 digits required)' }, 400);
  }

  // Build OpenPrices API URL
  const params = new URLSearchParams({
    product_code: ean,
    page_size: String(limit),
    ordering: '-date',
  });
  if (territory) {
    params.set('country_code', territory);
  }

  const upstreamUrl = `${OPEN_PRICES_BASE}/prices?${params.toString()}`;

  // Check Cloudflare edge cache
  const cache = caches.default;
  const cacheKey = new Request(upstreamUrl, { method: 'GET' });
  const cached = await cache.match(cacheKey);
  if (cached) {
    const cachedData = await cached.json() as OpenPricesResponse;
    const rows = Array.isArray(cachedData.items)
      ? cachedData.items
      : Array.isArray(cachedData.results) ? cachedData.results : [];
    const items = rows.map((r) => mapItem(r, ean, territory)).filter((v): v is PriceFeedItem => v !== null);
    return jsonResponse({
      items,
      count: items.length,
      fetchedAt: new Date().toISOString(),
      cached: true,
    });
  }

  // Fetch from OpenPrices
  const ctrl = withTimeout(REQUEST_TIMEOUT_MS);
  let upstreamResp: Response;
  try {
    upstreamResp = await fetch(upstreamUrl, {
      signal: ctrl.signal,
      headers: {
        'User-Agent': 'AkiPriSaYe/1.0 (contact: contact@akiprisaye.fr)',
        Accept: 'application/json',
      },
    });
  } catch (err) {
    const timedOut = err instanceof Error && err.name === 'AbortError';
    return jsonResponse(
      {
        items: [],
        count: 0,
        fetchedAt: new Date().toISOString(),
        error: timedOut ? 'OpenPrices request timed out' : 'OpenPrices unreachable',
      },
      200, // Graceful degradation — aggregator handles empty items
    );
  }

  if (!upstreamResp.ok) {
    return jsonResponse(
      {
        items: [],
        count: 0,
        fetchedAt: new Date().toISOString(),
        error: `OpenPrices returned HTTP ${upstreamResp.status}`,
      },
      200,
    );
  }

  // Cache the raw upstream response
  const cloneForCache = upstreamResp.clone();
  const cacheableRaw = new Response(cloneForCache.body, cloneForCache);
  cacheableRaw.headers.set('Cache-Control', `public, max-age=${CACHE_TTL_SECONDS}`);
  await cache.put(cacheKey, cacheableRaw);

  const data = (await upstreamResp.json()) as OpenPricesResponse;
  const rows = Array.isArray(data.items)
    ? data.items
    : Array.isArray(data.results) ? data.results : [];

  const items = rows
    .map((r) => mapItem(r, ean, territory))
    .filter((v): v is PriceFeedItem => v !== null);

  return jsonResponse({
    items,
    count: items.length,
    fetchedAt: new Date().toISOString(),
    upstream: { url: upstreamUrl, totalCount: data.count ?? rows.length },
    cached: false,
  });
};
