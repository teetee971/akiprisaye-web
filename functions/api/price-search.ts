const OFF_BASE_URL = 'https://world.openfoodfacts.org';
const OFF_USER_AGENT = 'A-KI-PRI-SA-YE (contact: support@yourdomain.tld)';
const REQUEST_TIMEOUT_MS = 8_000;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

interface OffSearchProduct {
  code?: string;
  product_name?: string;
  product_name_fr?: string;
  brands?: string;
  image_front_url?: string;
  quantity?: string;
}

interface OffSearchResponse {
  products?: OffSearchProduct[];
  count?: number;
  page?: number;
  page_count?: number;
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

export const onRequestOptions: PagesFunction = async () =>
  new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });

export const onRequestGet: PagesFunction = async ({ request }) => {
  const url = new URL(request.url);
  const query = (url.searchParams.get('q') ?? '').trim();
  const page = Math.max(1, Number(url.searchParams.get('page') ?? '1'));
  const pageSize = Math.min(24, Math.max(1, Number(url.searchParams.get('pageSize') ?? '12')));

  if (!query) {
    return jsonResponse({ error: 'Missing q' }, 400);
  }

  const fields = [
    'code',
    'product_name',
    'product_name_fr',
    'brands',
    'image_front_url',
    'quantity',
  ].join(',');

  const offUrl =
    `${OFF_BASE_URL}/api/v2/search?` +
    new URLSearchParams({
      search_terms: query,
      page: String(page),
      page_size: String(pageSize),
      fields,
    }).toString();

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

    const data = (await response.json()) as OffSearchResponse;
    const products = Array.isArray(data.products) ? data.products : [];

    return jsonResponse({
      status: 'ok',
      query,
      page,
      pageSize,
      count: products.length,
      total: data.count ?? null,
      totalPages: data.page_count ?? null,
      products: products.map((product) => ({
        barcode: product.code ?? null,
        name: product.product_name_fr ?? product.product_name ?? null,
        brand: product.brands ?? null,
        imageUrl: product.image_front_url ?? null,
        quantity: product.quantity ?? null,
        source: 'openfoodfacts',
      })),
    });
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
