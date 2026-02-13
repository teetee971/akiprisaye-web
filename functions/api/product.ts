const OFF_BASE_URL = 'https://world.openfoodfacts.org';
const OFF_USER_AGENT = 'A-KI-PRI-SA-YE (contact: support@yourdomain.tld)';
const REQUEST_TIMEOUT_MS = 8_000;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

interface OffProduct {
  code?: string;
  product_name?: string;
  product_name_fr?: string;
  brands?: string;
  image_front_url?: string;
  quantity?: string;
}

interface OffProductResponse {
  status?: number;
  product?: OffProduct;
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
  const barcode = (url.searchParams.get('barcode') ?? '').trim();

  if (!barcode) {
    return jsonResponse({ error: 'Missing barcode' }, 400);
  }

  const offUrl = `${OFF_BASE_URL}/api/v2/product/${encodeURIComponent(barcode)}.json`;

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

    return jsonResponse({
      status: 'ok',
      product: {
        barcode: product.code ?? barcode,
        name: product.product_name_fr ?? product.product_name ?? null,
        brand: product.brands ?? null,
        imageUrl: product.image_front_url ?? null,
        quantity: product.quantity ?? null,
        source: 'openfoodfacts',
      },
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
