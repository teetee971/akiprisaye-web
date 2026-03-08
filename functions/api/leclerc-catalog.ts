/**
 * Cloudflare Pages Function — Proxy vers le catalogue produits E.Leclerc
 *
 * Récupère les prix du catalogue E.Leclerc pour une requête (EAN ou libellé)
 * et les expose dans le format PriceObservation utilisé par l'application.
 *
 * Paramètres GET :
 *   - q         : libellé produit (ex: "lait uht 1l")
 *   - barcode   : code EAN (ex: "3560070123456")
 *   - territory : code territoire optionnel (ex: "gp", "mq", "re")
 *   - pageSize  : nombre de résultats (défaut: 20, max: 40)
 */

type TerritoryCode =
  | 'fr'
  | 'gp'
  | 'mq'
  | 'gf'
  | 're'
  | 'yt'
  | 'pm'
  | 'bl'
  | 'mf';

type PriceObservation = {
  source: 'leclerc_catalog';
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

/** Mappage territoire → code magasin E.Leclerc DOM */
const STORE_CODES_BY_TERRITORY: Partial<Record<TerritoryCode, string[]>> = {
  gp: ['6520', '6521', '6522', '6523'],   // Guadeloupe
  mq: ['9720', '9721', '9722', '9723'],   // Martinique
  re: ['9740', '9741', '9742'],           // La Réunion
  gf: ['9730'],                           // Guyane
  yt: ['9760'],                           // Mayotte
};

type LeclercProductOffer = {
  price?: unknown;
  priceValue?: unknown;
  selling_price?: unknown;
  sellingPrice?: unknown;
  currency?: unknown;
  unit?: unknown;
  priceUnit?: unknown;
};

type LeclercProduct = {
  code?: unknown;
  ean?: unknown;
  barcode?: unknown;
  libelle?: unknown;
  label?: unknown;
  name?: unknown;
  productName?: unknown;
  marque?: unknown;
  brand?: unknown;
  offers?: LeclercProductOffer[];
  offer?: LeclercProductOffer;
  price?: unknown;
  priceValue?: unknown;
  selling_price?: unknown;
  sellingPrice?: unknown;
  currency?: unknown;
  unit?: unknown;
  imageUrl?: unknown;
  photo?: unknown;
};

type LeclercSearchPayload = {
  products?: unknown;
  items?: unknown;
  results?: unknown;
  data?: unknown;
  hits?: unknown;
};

const safeString = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;

const safeNumber = (value: unknown): number | null => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string') {
    const parsed = Number(value.replace(',', '.'));
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }
  return null;
};

const extractPrice = (product: LeclercProduct): number | null => {
  const offer = Array.isArray(product.offers) ? product.offers[0] : product.offer;
  if (offer) {
    return (
      safeNumber(offer.price) ??
      safeNumber(offer.priceValue) ??
      safeNumber(offer.selling_price) ??
      safeNumber(offer.sellingPrice)
    );
  }
  return (
    safeNumber(product.price) ??
    safeNumber(product.priceValue) ??
    safeNumber(product.selling_price) ??
    safeNumber(product.sellingPrice)
  );
};

const extractUnit = (product: LeclercProduct): PriceObservation['unit'] => {
  const offer = Array.isArray(product.offers) ? product.offers[0] : product.offer;
  const rawUnit = safeString(offer?.unit ?? offer?.priceUnit ?? product.unit)?.toLowerCase();
  if (!rawUnit) return 'unit';
  if (rawUnit.includes('kg') || rawUnit.includes('kilo')) return 'kg';
  if (rawUnit.includes('litre') || rawUnit.includes('liter') || rawUnit === 'l') return 'l';
  return 'unit';
};

const toProductsArray = (payload: LeclercSearchPayload): LeclercProduct[] => {
  for (const key of ['products', 'items', 'results', 'data', 'hits'] as const) {
    const val = payload[key];
    if (Array.isArray(val)) return val as LeclercProduct[];
  }
  return [];
};

const mapProduct = (
  product: LeclercProduct,
  territory: TerritoryCode | undefined,
  today: string,
): PriceObservation | null => {
  const price = extractPrice(product);
  if (price === null || price <= 0) return null;

  const barcode =
    safeString(product.code) ??
    safeString(product.ean) ??
    safeString(product.barcode);

  const productName =
    safeString(product.libelle) ??
    safeString(product.label) ??
    safeString(product.name) ??
    safeString(product.productName);

  const brand = safeString(product.marque) ?? safeString(product.brand);

  const imageUrl = safeString(product.imageUrl) ?? safeString(product.photo);
  const metadata: Record<string, string> | undefined = imageUrl ? { imageUrl } : undefined;

  return {
    source: 'leclerc_catalog',
    productName,
    brand,
    barcode,
    price,
    currency: 'EUR',
    unit: extractUnit(product),
    observedAt: today,
    territory,
    metadata,
  };
};

const CACHE_MAX_AGE_SECONDS = 1800; // 30 minutes

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'content-type': 'application/json; charset=utf-8',
};

export const onRequestOptions: PagesFunction = async () =>
  new Response(null, { status: 204, headers: CORS_HEADERS });

export const onRequestGet: PagesFunction = async ({ request }) => {
  const url = new URL(request.url);

  const query = (url.searchParams.get('q') ?? url.searchParams.get('query') ?? '').trim();
  const barcode = (url.searchParams.get('barcode') ?? '').trim();
  const territory = (url.searchParams.get('territory') ?? '').trim() as TerritoryCode | '';
  const pageSize = Math.min(40, Math.max(1, Number(url.searchParams.get('pageSize') ?? '20')));

  if (!query && !barcode) {
    return new Response(
      JSON.stringify({ error: 'Paramètre requis: q (libellé) ou barcode (EAN)' }),
      { status: 400, headers: CORS_HEADERS },
    );
  }

  const searchTerm = barcode || query;
  const storeCodes =
    territory && STORE_CODES_BY_TERRITORY[territory as TerritoryCode]
      ? STORE_CODES_BY_TERRITORY[territory as TerritoryCode]!
      : [];

  const params = new URLSearchParams({
    query: searchTerm,
    page: '1',
    pageSize: String(pageSize),
  });
  for (const code of storeCodes) {
    params.append('storeCodes[]', code);
  }

  const upstreamUrl = `https://www.e.leclerc/api/rest/live-config/product-search-v2?${params.toString()}`;

  const cache = caches.default;
  const cacheKey = new Request(upstreamUrl, { method: 'GET' });

  let upstream = await cache.match(cacheKey);
  if (!upstream) {
    upstream = await fetch(upstreamUrl, {
      headers: {
        'User-Agent':
          'A-KI-PRI-SA-YE/1.0 (observatoire prix DOM-TOM; contact: support@akiprisaye.fr)',
        Accept: 'application/json',
        'Accept-Language': 'fr-FR,fr;q=0.9',
      },
    });

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
  const resolvedTerritory: TerritoryCode | undefined =
    territory && ['fr', 'gp', 'mq', 'gf', 're', 'yt', 'pm', 'bl', 'mf'].includes(territory)
      ? (territory as TerritoryCode)
      : undefined;

  let observations: PriceObservation[] = [];
  try {
    const payload = (await upstream.json()) as LeclercSearchPayload;
    const products = toProductsArray(payload);
    observations = products
      .map((p) => mapProduct(p, resolvedTerritory, today))
      .filter((o): o is PriceObservation => o !== null);
  } catch {
    return new Response(
      JSON.stringify({ status: 'UNAVAILABLE', observations: [], upstream: { url: upstreamUrl } }),
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
