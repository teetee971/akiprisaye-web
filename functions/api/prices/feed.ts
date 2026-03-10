/**
 * Cloudflare Pages Function — Territory price feed
 *
 * Returns the most recent price observations for a DOM-TOM territory,
 * sourced from OpenPrices (prices.openfoodfacts.org).
 *
 * Useful for:
 *  - Price monitoring dashboards
 *  - SyncScheduler territory batch jobs
 *  - Historical price analysis
 *
 * GET /api/prices/feed?territory={code}&since={YYYY-MM-DD}&limit={n}&page={p}
 *
 * Returns:
 *   { status, territory, observations: PriceFeedObs[], count, page, nextPage, fetchedAt }
 *
 * Cached for 10 minutes at the Cloudflare edge.
 */

const OPEN_PRICES_BASE = 'https://prices.openfoodfacts.org/api/v1';
const CACHE_TTL_SECONDS = 600; // 10 minutes
const REQUEST_TIMEOUT_MS = 12_000;
const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 200;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const VALID_TERRITORY_CODES = new Set([
  'fr', 'gp', 'mq', 'gf', 're', 'yt', 'pm', 'bl', 'mf',
]);

const TERRITORY_LABELS: Record<string, string> = {
  fr: 'France métropolitaine',
  gp: 'Guadeloupe',
  mq: 'Martinique',
  gf: 'Guyane',
  re: 'La Réunion',
  yt: 'Mayotte',
  pm: 'Saint-Pierre-et-Miquelon',
  bl: 'Saint-Barthélemy',
  mf: 'Saint-Martin',
};

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
  price_is_discounted?: boolean;
  country_code?: string;
  proof_id?: number | string;
}

interface OpenPricesResponse {
  count?: number;
  items?: OpenPricesItem[];
  results?: OpenPricesItem[];
  page?: number;
  page_size?: number;
}

interface PriceFeedObs {
  id: string;
  ean: string;
  productLabel: string;
  price: number;
  currency: 'EUR';
  isDiscounted: boolean;
  pricePerUnit: string | null;
  observedAt: string | null;
  locationId: string | null;
  proofId: string | null;
}

function withTimeout(ms: number): AbortController {
  const ctrl = new AbortController();
  setTimeout(() => ctrl.abort(), ms);
  return ctrl;
}

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...CORS_HEADERS,
    },
  });
}

function toISO(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function defaultSinceDate(): string {
  const d = new Date();
  d.setDate(d.getDate() - 7); // last 7 days
  return d.toISOString().split('T')[0];
}

function normalizeLimit(raw: string | null): number {
  const n = Number(raw ?? DEFAULT_LIMIT);
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_LIMIT;
  return Math.min(Math.floor(n), MAX_LIMIT);
}

function normalizePage(raw: string | null): number {
  const n = Number(raw ?? '1');
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.floor(n);
}

function mapObs(item: OpenPricesItem): PriceFeedObs | null {
  const price = Number(item.price);
  if (!Number.isFinite(price) || price <= 0) return null;
  const currency = String(item.currency ?? '').toUpperCase();
  if (currency !== 'EUR') return null;
  const ean = item.product_code ?? '';
  if (!ean) return null;

  return {
    id: String(item.id ?? `${ean}-${price}`),
    ean,
    productLabel: item.product_name ?? `Produit ${ean}`,
    price,
    currency: 'EUR',
    isDiscounted: item.price_is_discounted === true,
    pricePerUnit: item.price_per ?? null,
    observedAt: toISO(item.date ?? item.created ?? item.updated),
    locationId: item.location_id != null ? String(item.location_id) : (
      item.location_osm_id != null ? String(item.location_osm_id) : null
    ),
    proofId: item.proof_id != null ? String(item.proof_id) : null,
  };
}

export const onRequestOptions: PagesFunction = async () =>
  new Response(null, { status: 204, headers: CORS_HEADERS });

export const onRequestGet: PagesFunction = async ({ request }) => {
  const url = new URL(request.url);

  const rawTerritory = (url.searchParams.get('territory') ?? '').trim().toLowerCase();
  const territory = VALID_TERRITORY_CODES.has(rawTerritory) ? rawTerritory : '';
  if (!territory) {
    return jsonResponse(
      {
        error: 'Missing or invalid territory. Use one of: ' + [...VALID_TERRITORY_CODES].join(', '),
        validTerritories: [...VALID_TERRITORY_CODES],
      },
      400,
    );
  }

  const since = url.searchParams.get('since') ?? defaultSinceDate();
  const limit = normalizeLimit(url.searchParams.get('limit'));
  const page = normalizePage(url.searchParams.get('page'));

  // Build OpenPrices upstream URL
  const params = new URLSearchParams({
    country_code: territory,
    date__gte: since,
    page_size: String(limit),
    page: String(page),
    ordering: '-date',
  });

  const upstreamUrl = `${OPEN_PRICES_BASE}/prices?${params.toString()}`;

  // Cloudflare edge cache
  const cache = caches.default;
  const cacheKey = new Request(upstreamUrl, { method: 'GET' });
  const cachedResp = await cache.match(cacheKey);

  let data: OpenPricesResponse;

  if (cachedResp) {
    data = await cachedResp.json() as OpenPricesResponse;
  } else {
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
          status: 'UNAVAILABLE',
          territory,
          observations: [],
          count: 0,
          page,
          fetchedAt: new Date().toISOString(),
          error: timedOut ? 'OpenPrices request timed out' : 'OpenPrices unreachable',
        },
        200,
      );
    }

    if (!upstreamResp.ok) {
      return jsonResponse(
        {
          status: 'UNAVAILABLE',
          territory,
          observations: [],
          count: 0,
          page,
          fetchedAt: new Date().toISOString(),
          error: `OpenPrices returned HTTP ${upstreamResp.status}`,
        },
        200,
      );
    }

    // Cache raw response
    const toCache = new Response(upstreamResp.clone().body, upstreamResp);
    toCache.headers.set('Cache-Control', `public, max-age=${CACHE_TTL_SECONDS}`);
    await cache.put(cacheKey, toCache);

    data = (await upstreamResp.json()) as OpenPricesResponse;
  }

  const rows = Array.isArray(data.items)
    ? data.items
    : Array.isArray(data.results) ? data.results : [];

  const observations = rows
    .map(mapObs)
    .filter((v): v is PriceFeedObs => v !== null);

  const totalCount = data.count ?? rows.length;
  const hasMore = page * limit < totalCount;

  return jsonResponse({
    status: observations.length > 0 ? 'OK' : 'NO_DATA',
    territory,
    territoryLabel: TERRITORY_LABELS[territory] ?? territory,
    observations,
    count: observations.length,
    totalCount,
    page,
    pageSize: limit,
    since,
    nextPage: hasMore ? page + 1 : null,
    fetchedAt: new Date().toISOString(),
  });
};
