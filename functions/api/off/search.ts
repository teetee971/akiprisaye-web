const OFF_BASE_URL = 'https://world.openfoodfacts.org';

interface OffSearchProduct {
  code?: string;
  product_name?: string;
  product_name_fr?: string;
  brands?: string;
  image_front_url?: string;
  quantity?: string;
  categories_tags?: string[];
}

interface OffSearchResponse {
  products?: OffSearchProduct[];
  count?: number;
  page_count?: number;
}

export const onRequestGet: PagesFunction = async ({ request }) => {
  const url = new URL(request.url);

  const query = (url.searchParams.get('q') ?? '').trim();
  const page = Math.max(1, Number(url.searchParams.get('page') ?? '1'));
  const pageSize = Math.min(24, Math.max(1, Number(url.searchParams.get('pageSize') ?? '12')));
  const lang = (url.searchParams.get('lang') ?? 'fr').trim();

  if (!query) {
    return new Response(JSON.stringify({ error: 'Missing q' }), {
      status: 400,
      headers: { 'content-type': 'application/json; charset=utf-8' },
    });
  }

  const fields = [
    'code',
    'product_name',
    'product_name_fr',
    'brands',
    'image_front_url',
    'quantity',
    'categories_tags',
  ].join(',');

  const offUrl =
    `${OFF_BASE_URL}/api/v2/search?` +
    new URLSearchParams({
      search_terms: query,
      page: String(page),
      page_size: String(pageSize),
      fields,
    }).toString();

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
      cached.headers.set('Cache-Control', 'public, max-age=600');
      await cache.put(cacheKey, cached.clone());
      response = cached;
    }
  }

  const data = (await response.json()) as OffSearchResponse;
  const products = Array.isArray(data.products) ? data.products : [];

  const normalized = products.map((product) => ({
    source: 'open_food_facts' as const,
    barcode: product.code ?? null,
    productName: product.product_name_fr ?? product.product_name ?? null,
    brand: product.brands ?? null,
    imageUrl: product.image_front_url ?? null,
    quantity: product.quantity ?? null,
    categories: Array.isArray(product.categories_tags) ? product.categories_tags : [],
  }));

  return new Response(
    JSON.stringify({
      q: query,
      lang,
      page,
      pageSize,
      count: normalized.length,
      products: normalized,
      rawMeta: {
        page_count: data.page_count ?? null,
        count: data.count ?? null,
      },
    }),
    {
      status: 200,
      headers: { 'content-type': 'application/json; charset=utf-8' },
    },
  );
};
