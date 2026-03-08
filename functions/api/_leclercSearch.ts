/**
 * Shared factory for E.Leclerc category-specific Cloudflare Pages Functions.
 *
 * Each catalog section (Jardin, High-Tech, Electroménager …) is a thin wrapper
 * that calls `createLeclercCategoryHandlers({ categorySlug, source })`.
 *
 * Paramètres GET exposés par chaque fonction générée :
 *   - q        : libellé produit (ex: "tondeuse")
 *   - barcode  : code EAN optionnel
 *   - territory: code territoire optionnel (ex: "gp", "mq", "re")
 *   - pageSize : nombre de résultats (défaut: 20, max: 40)
 */

export const CACHE_MAX_AGE_SECONDS = 1800; // 30 minutes

export const LECLERC_BASE_URL = 'https://www.e.leclerc';

/** Mappage territoire → codes magasins E.Leclerc DOM */
export const STORE_CODES_BY_TERRITORY: Partial<Record<string, string[]>> = {
  gp: ['6520', '6521', '6522', '6523'],  // Guadeloupe
  mq: ['9720', '9721', '9722', '9723'],  // Martinique
  re: ['9740', '9741', '9742'],          // La Réunion
  gf: ['9730'],                          // Guyane
  yt: ['9760'],                          // Mayotte
};

export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'content-type': 'application/json; charset=utf-8',
};

export type LeclercSourceId =
  | 'leclerc_catalog'
  | 'leclerc_jardin'
  | 'leclerc_hightech'
  | 'leclerc_electromenager'
  | 'leclerc_parapharmacie'
  | 'leclerc_secondevie';

type PriceObservation = {
  source: LeclercSourceId;
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

type ProductOffer = {
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
  offers?: ProductOffer[];
  offer?: ProductOffer;
  price?: unknown;
  priceValue?: unknown;
  selling_price?: unknown;
  sellingPrice?: unknown;
  unit?: unknown;
  imageUrl?: unknown;
  photo?: unknown;
  thumbnail?: unknown;
};

type SearchPayload = {
  products?: unknown;
  items?: unknown;
  results?: unknown;
  data?: unknown;
  hits?: unknown;
};

export const safeString = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;

export const safeNumber = (value: unknown): number | null => {
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
  const raw = safeString(offer?.unit ?? offer?.priceUnit ?? product.unit)?.toLowerCase();
  if (!raw) return 'unit';
  if (raw.includes('kg') || raw.includes('kilo')) return 'kg';
  if (raw.includes('litre') || raw.includes('liter') || raw === 'l') return 'l';
  return 'unit';
};

const toProductsArray = (payload: SearchPayload): LeclercProduct[] => {
  for (const key of ['products', 'items', 'results', 'data', 'hits'] as const) {
    const val = payload[key];
    if (Array.isArray(val)) return val as LeclercProduct[];
  }
  return [];
};

const mapProduct = (
  product: LeclercProduct,
  source: LeclercSourceId,
  territory: string | undefined,
  today: string,
): PriceObservation | null => {
  const price = extractPrice(product);
  if (price === null || price <= 0) return null;

  const barcode =
    safeString(product.code) ?? safeString(product.ean) ?? safeString(product.barcode);

  const productName =
    safeString(product.libelle) ??
    safeString(product.label) ??
    safeString(product.name) ??
    safeString(product.productName);

  const brand = safeString(product.marque) ?? safeString(product.brand);

  const imageUrl =
    safeString(product.imageUrl) ?? safeString(product.photo) ?? safeString(product.thumbnail);
  const metadata: Record<string, string> | undefined = imageUrl ? { imageUrl } : undefined;

  return {
    source,
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

export interface LeclercCategoryConfig {
  /** Slug de catégorie E.Leclerc (ex: "jardin", "high-tech", "electromenager") */
  categorySlug: string;
  /** Identifiant de source renvoyé dans les observations */
  source: LeclercSourceId;
}

/**
 * Crée les handlers Cloudflare Pages Function pour un catalogue catégorie E.Leclerc.
 * Usage dans le fichier de route :
 *   export const { onRequestOptions, onRequestGet } = createLeclercCategoryHandlers({…});
 */
export function createLeclercCategoryHandlers(config: LeclercCategoryConfig): {
  onRequestOptions: PagesFunction;
  onRequestGet: PagesFunction;
} {
  const onRequestOptions: PagesFunction = async () =>
    new Response(null, { status: 204, headers: CORS_HEADERS });

  const onRequestGet: PagesFunction = async ({ request }) => {
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

    const storeCodes =
      territory && STORE_CODES_BY_TERRITORY[territory]
        ? STORE_CODES_BY_TERRITORY[territory]!
        : [];

    const params = new URLSearchParams({
      query: barcode || query,
      page: '1',
      pageSize: String(pageSize),
      'categories[]': config.categorySlug,
    });
    for (const code of storeCodes) {
      params.append('storeCodes[]', code);
    }

    const upstreamUrl =
      `${LECLERC_BASE_URL}/api/rest/live-config/product-search-v2?${params.toString()}`;

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
    const resolvedTerritory =
      territory &&
      ['fr', 'gp', 'mq', 'gf', 're', 'yt', 'pm', 'bl', 'mf', 'wf', 'pf', 'nc', 'tf'].includes(
        territory,
      )
        ? territory
        : undefined;

    let observations: PriceObservation[] = [];
    try {
      const payload = (await upstream.json()) as SearchPayload;
      observations = toProductsArray(payload)
        .map((p) => mapProduct(p, config.source, resolvedTerritory, today))
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

  return { onRequestOptions, onRequestGet };
}
