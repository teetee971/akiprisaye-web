const OFF_BASE_URL = 'https://world.openfoodfacts.org';
const OFF_USER_AGENT = 'A-KI-PRI-SA-YE (contact: support@yourdomain.tld)';
const REQUEST_TIMEOUT_MS = 8_000;
const PRODUCT_CACHE_TTL_SECONDS = 86_400;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

type ProductImageType = 'front' | 'ingredients' | 'nutrition' | 'other';

interface OffProduct {
  code?: string;
  product_name?: string;
  product_name_fr?: string;
  brands?: string;
  quantity?: string;
  categories_tags?: string[];
  image_front_url?: string;
  image_ingredients_url?: string;
  image_nutrition_url?: string;
  [key: string]: unknown;
}

interface OffProductResponse {
  status?: number;
  product?: OffProduct;
}

interface ProductCard {
  barcode: string;
  title: string;
  brand?: string;
  quantity?: string;
  categories?: string[];
  images: Array<{ type: ProductImageType; url: string }>;
  source: 'open_food_facts';
  updatedAt: string;
}

function withTimeout(timeoutMs: number): AbortController {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeoutMs);
  return controller;
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

function toImage(type: ProductImageType, url: unknown): { type: ProductImageType; url: string } | null {
  if (typeof url !== 'string') {
    return null;
  }

  const trimmed = url.trim();
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return null;
  }

  return { type, url: trimmed };
}

function normalizeProduct(product: OffProduct, barcode: string): ProductCard {
  const images = [
    toImage('front', product.image_front_url),
    toImage('ingredients', product.image_ingredients_url),
    toImage('nutrition', product.image_nutrition_url),
  ].filter((value): value is { type: ProductImageType; url: string } => value !== null);

  const categories = Array.isArray(product.categories_tags)
    ? product.categories_tags.filter((category): category is string => typeof category === 'string' && category.length > 0)
    : [];

  return {
    barcode: product.code ?? barcode,
    title: product.product_name_fr ?? product.product_name ?? barcode,
    brand: product.brands?.trim() || undefined,
    quantity: product.quantity?.trim() || undefined,
    categories,
    images,
    source: 'open_food_facts',
    updatedAt: new Date().toISOString(),
  };
}

export const onRequestOptions: PagesFunction = async () =>
  new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });

export const onRequestGet: PagesFunction = async ({ request }) => {
  const requestUrl = new URL(request.url);
  const barcode = (requestUrl.searchParams.get('barcode') ?? '').trim();

  if (!barcode) {
    return jsonResponse({ error: 'Missing barcode' }, 400);
  }

  const offUrl = `${OFF_BASE_URL}/api/v2/product/${encodeURIComponent(barcode)}.json`;
  const cacheKey = new Request(`${requestUrl.origin}/api/product?barcode=${encodeURIComponent(barcode)}`, {
    method: 'GET',
  });

  const cache = caches.default;
  const cached = await cache.match(cacheKey);
  if (cached) {
    return new Response(cached.body, cached);
  }

  try {
    const controller = withTimeout(REQUEST_TIMEOUT_MS);
    const response = await fetch(offUrl, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'User-Agent': OFF_USER_AGENT,
      },
    });

    if (!response.ok) {
      return jsonResponse({ error: `OpenFoodFacts upstream error (${response.status})` }, 502);
    }

    const data = (await response.json()) as OffProductResponse;
    const product = data.product;

    if (!product) {
      return jsonResponse({ status: 'not_found', product: null }, 404);
    }

    const normalizedProduct = normalizeProduct(product, barcode);
    const payload = { status: 'ok', product: normalizedProduct };
    const json = JSON.stringify(payload);

    const cacheable = new Response(json, {
      status: 200,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'Cache-Control': `public, max-age=${PRODUCT_CACHE_TTL_SECONDS}`,
        ...CORS_HEADERS,
      },
    });

    await cache.put(cacheKey, cacheable.clone());
    return cacheable;
  } catch (error) {
    const timedOut = error instanceof Error && error.name === 'AbortError';
    return jsonResponse(
      {
        error: timedOut
          ? 'OpenFoodFacts request timed out after 8 seconds'
          : 'Unable to reach OpenFoodFacts',
      },
      504,
    );
  }
};
