/**
 * Cloudflare Pages Function — Proxy vers MaCave E.Leclerc
 *
 * Récupère les prix promotions vins & champagnes depuis le catalogue MaCave E.Leclerc
 * (https://www.macave.e.leclerc) et les expose au format PriceObservation.
 *
 * Paramètres GET :
 *   - q          : libellé produit (ex: "champagne brut", "bordeaux rouge")
 *   - barcode    : code EAN optionnel
 *   - promoOnly  : "true" pour ne retourner que les articles en promotion (défaut: false)
 *   - pageSize   : nombre de résultats (défaut: 20, max: 40)
 */

const MACAVE_BASE_URL = 'https://www.macave.e.leclerc';
const CACHE_MAX_AGE_SECONDS = 1800; // 30 minutes

type PriceObservation = {
  source: 'macave_leclerc';
  productName?: string;
  brand?: string;
  barcode?: string;
  price: number;
  currency: 'EUR';
  unit?: 'unit' | 'kg' | 'l';
  observedAt?: string;
  territory?: string;
  metadata?: Record<string, string>;
};

type MacaveOffer = {
  price?: unknown;
  priceValue?: unknown;
  sellingPrice?: unknown;
  originalPrice?: unknown;
  crossedPrice?: unknown;
  promotionPrice?: unknown;
  discountPercent?: unknown;
  discountValue?: unknown;
  isPromo?: unknown;
  isPromotion?: unknown;
  onSale?: unknown;
  currency?: unknown;
  unit?: unknown;
};

type MacaveProduct = {
  /* identifiants */
  code?: unknown;
  ean?: unknown;
  barcode?: unknown;
  id?: unknown;
  /* libellés */
  libelle?: unknown;
  label?: unknown;
  name?: unknown;
  title?: unknown;
  productName?: unknown;
  /* marque / millésime */
  marque?: unknown;
  brand?: unknown;
  vintage?: unknown;
  millesime?: unknown;
  /* offres / prix */
  offers?: MacaveOffer[];
  offer?: MacaveOffer;
  price?: unknown;
  priceValue?: unknown;
  sellingPrice?: unknown;
  crossedPrice?: unknown;
  promotionPrice?: unknown;
  discountPercent?: unknown;
  isPromo?: unknown;
  isPromotion?: unknown;
  onSale?: unknown;
  currency?: unknown;
  unit?: unknown;
  /* médias */
  imageUrl?: unknown;
  photo?: unknown;
  thumbnail?: unknown;
  /* catégorie / appellation */
  category?: unknown;
  appellation?: unknown;
  region?: unknown;
};

type MacaveSearchPayload = {
  products?: unknown;
  items?: unknown;
  results?: unknown;
  data?: unknown;
  hits?: unknown;
};

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'content-type': 'application/json; charset=utf-8',
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

const safeBool = (value: unknown): boolean =>
  value === true || value === 1 || value === 'true' || value === '1';

const extractOffer = (product: MacaveProduct): MacaveOffer | null => {
  if (Array.isArray(product.offers) && product.offers.length > 0) {
    return product.offers[0];
  }
  if (product.offer && typeof product.offer === 'object') {
    return product.offer as MacaveOffer;
  }
  return null;
};

const extractCurrentPrice = (product: MacaveProduct, offer: MacaveOffer | null): number | null => {
  const src = offer ?? product;
  return (
    safeNumber(src.promotionPrice) ??
    safeNumber(src.price) ??
    safeNumber((src as MacaveProduct).priceValue) ??
    safeNumber((src as MacaveProduct).sellingPrice)
  );
};

const extractOriginalPrice = (product: MacaveProduct, offer: MacaveOffer | null): number | null => {
  const src = offer ?? product;
  return safeNumber(src.crossedPrice) ?? safeNumber(src.originalPrice);
};

const isPromoItem = (product: MacaveProduct, offer: MacaveOffer | null): boolean => {
  const src = offer ?? product;
  if (
    safeBool(src.isPromo) ||
    safeBool(src.isPromotion) ||
    safeBool(src.onSale) ||
    safeNumber(src.discountPercent) !== null ||
    safeNumber(src.discountValue) !== null
  ) {
    return true;
  }
  // Déduit la promo si le prix actuel diffère du prix barré
  const current = extractCurrentPrice(product, offer);
  const original = extractOriginalPrice(product, offer);
  return original !== null && current !== null && current < original;
};

const buildProductName = (product: MacaveProduct): string | undefined => {
  const base =
    safeString(product.libelle) ??
    safeString(product.label) ??
    safeString(product.name) ??
    safeString(product.title) ??
    safeString(product.productName);

  const millesime = safeString(product.vintage) ?? safeString(product.millesime);
  if (base && millesime) return `${base} ${millesime}`;
  return base;
};

const toProductsArray = (payload: MacaveSearchPayload): MacaveProduct[] => {
  for (const key of ['products', 'items', 'results', 'data', 'hits'] as const) {
    const val = payload[key];
    if (Array.isArray(val)) return val as MacaveProduct[];
  }
  return [];
};

const mapProduct = (
  product: MacaveProduct,
  promoOnly: boolean,
  today: string,
): PriceObservation | null => {
  const offer = extractOffer(product);
  const price = extractCurrentPrice(product, offer);
  if (price === null || price <= 0) return null;

  if (promoOnly && !isPromoItem(product, offer)) return null;

  const barcode =
    safeString(product.code) ??
    safeString(product.ean) ??
    safeString(product.barcode);

  const productName = buildProductName(product);
  const brand = safeString(product.marque) ?? safeString(product.brand);

  const metadata: Record<string, string> = { catalog: 'macave' };

  const imageUrl =
    safeString(product.imageUrl) ??
    safeString(product.photo) ??
    safeString(product.thumbnail);
  if (imageUrl) metadata.imageUrl = imageUrl;

  const originalPrice = extractOriginalPrice(product, offer);
  if (originalPrice !== null) metadata.originalPrice = String(originalPrice);

  const discountPct = safeNumber(offer?.discountPercent ?? product.discountPercent);
  if (discountPct !== null) metadata.discountPercent = String(discountPct);

  const appellation = safeString(product.appellation);
  if (appellation) metadata.appellation = appellation;

  const region = safeString(product.region);
  if (region) metadata.region = region;

  if (isPromoItem(product, offer)) metadata.isPromo = 'true';

  return {
    source: 'macave_leclerc',
    productName,
    brand,
    barcode,
    price,
    currency: 'EUR',
    unit: 'unit',
    observedAt: today,
    metadata,
  };
};

export const onRequestOptions: PagesFunction = async () =>
  new Response(null, { status: 204, headers: CORS_HEADERS });

export const onRequestGet: PagesFunction = async ({ request }) => {
  const url = new URL(request.url);

  const query = (url.searchParams.get('q') ?? url.searchParams.get('query') ?? '').trim();
  const barcode = (url.searchParams.get('barcode') ?? '').trim();
  const promoOnly = url.searchParams.get('promoOnly') === 'true';
  const pageSize = Math.min(40, Math.max(1, Number(url.searchParams.get('pageSize') ?? '20')));

  if (!query && !barcode) {
    return new Response(
      JSON.stringify({ error: 'Paramètre requis: q (libellé) ou barcode (EAN)' }),
      { status: 400, headers: CORS_HEADERS },
    );
  }

  const searchTerm = barcode || query;
  const params = new URLSearchParams({
    query: searchTerm,
    page: '1',
    pageSize: String(pageSize),
  });
  if (promoOnly) params.set('onSale', 'true');

  const upstreamUrl = `${MACAVE_BASE_URL}/api/rest/live-config/product-search-v2?${params.toString()}`;

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
        Referer: MACAVE_BASE_URL,
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
  let observations: PriceObservation[] = [];

  try {
    const payload = (await upstream.json()) as MacaveSearchPayload;
    const products = toProductsArray(payload);
    observations = products
      .map((p) => mapProduct(p, promoOnly, today))
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
