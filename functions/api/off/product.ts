const OFF_BASE_URL = 'https://world.openfoodfacts.org';

interface OffProduct {
  product_name?: string;
  product_name_fr?: string;
  brands?: string;
  image_front_url?: string;
  categories_tags?: string[];
  [key: string]: unknown;
}

interface OffProductResponse {
  product?: OffProduct;
}

export const onRequestGet: PagesFunction = async ({ request }) => {
  const url = new URL(request.url);
  const barcode = (url.searchParams.get('barcode') ?? '').trim();

  if (!barcode) {
    return new Response(JSON.stringify({ error: 'Missing barcode' }), {
      status: 400,
      headers: { 'content-type': 'application/json; charset=utf-8' },
    });
  }

  const offUrl = `${OFF_BASE_URL}/api/v2/product/${encodeURIComponent(barcode)}.json`;

  const cache = caches.default;
  const cacheKey = new Request(offUrl, { method: 'GET' });

  let response = await cache.match(cacheKey);
  if (!response) {
    response = await fetch(offUrl, {
      headers: {
        'User-Agent': 'A-KI-PRI-SA-YE (contact: support@yourdomain.tld)',
        Accept: 'application/json',
      },
    });

    if (response.ok) {
      const cached = new Response(response.body, response);
      cached.headers.set('Cache-Control', 'public, max-age=3600');
      await cache.put(cacheKey, cached.clone());
      response = cached;
    }
  }

  const data = (await response.json()) as OffProductResponse;
  const product = data.product;

  const normalized = product
    ? {
        source: 'open_food_facts' as const,
        barcode,
        productName: product.product_name ?? product.product_name_fr ?? null,
        brand: product.brands ?? null,
        imageUrl: product.image_front_url ?? null,
        categories: Array.isArray(product.categories_tags) ? product.categories_tags : [],
        raw: product,
      }
    : null;

  return new Response(JSON.stringify({ status: response.status, data: normalized }), {
    status: 200,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
};
