import { errorResponse, getRequestId, handleOptions, jsonResponse, methodGuard, parseQuery, setCacheHeaders, softRateLimit } from '../_lib/http';
import { logError, logInfo, logWarn } from '../_lib/log';
import { isBarcode } from '../_lib/validate';

const OFF_BASE = 'https://world.openfoodfacts.org';

const withTimeout = async (url: string, timeoutMs = 7000) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'A-KI-PRI-SA-YE/1.0 (+https://akiprisaye-web.pages.dev)',
      },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
};

export const onRequestOptions: PagesFunction = async ({ request }) => handleOptions(request, ['GET']) ?? new Response(null, { status: 204 });

export const onRequestGet: PagesFunction = async ({ request }) => {
  const t0 = Date.now();
  const requestId = getRequestId(request);
  const endpoint = '/api/product';

  const optionsResponse = handleOptions(request, ['GET']);
  if (optionsResponse) return optionsResponse;

  const blocked = methodGuard(request, ['GET']);
  if (blocked) return blocked;

  const rate = softRateLimit(request);
  if (!rate.ok) {
    const response = jsonResponse(
      { ok: false, code: 'RATE_LIMITED', message: 'Too many requests', requestId, retryAfter: rate.retryAfter },
      { status: 429, request, headers: { 'Retry-After': String(rate.retryAfter) } },
    );
    logWarn('product.rate_limited', { requestId, endpoint, status: response.status, durationMs: Date.now() - t0 });
    return response;
  }

  const query = parseQuery(request);
  const barcode = (query.get('barcode') ?? '').trim();

  if (!barcode) {
    const response = errorResponse('MISSING_PARAM', 'Missing barcode query parameter', {
      status: 400,
      request,
      requestId,
      details: { error: 'missing_barcode' },
    });
    logWarn('product.missing_barcode', { requestId, endpoint, status: response.status, durationMs: Date.now() - t0 });
    return response;
  }

  if (!isBarcode(barcode)) {
    const response = errorResponse('INVALID_INPUT', 'Invalid barcode format', {
      status: 400,
      request,
      requestId,
      details: { barcode },
    });
    logWarn('product.invalid_barcode', { requestId, endpoint, status: response.status, durationMs: Date.now() - t0 });
    return response;
  }

  const offEndpoint = `${OFF_BASE}/api/v2/product/${encodeURIComponent(barcode)}.json`;

  try {
    const upstream = await withTimeout(offEndpoint);

    if (!upstream.ok) {
      const response = jsonResponse(
        { ok: false, error: 'off_upstream_error', status: upstream.status, data: null, requestId },
        { status: 200, request, cache: 'no-store' },
      );
      logWarn('product.off_upstream_error', { requestId, endpoint, status: response.status, durationMs: Date.now() - t0 });
      return response;
    }

    const payload = (await upstream.json()) as {
      product?: Record<string, unknown>;
      status?: number;
    };

    const p = payload.product ?? {};

    const normalized = {
      barcode,
      source: 'openfoodfacts',
      found: payload.status === 1,
      name: (p.product_name_fr as string) || (p.product_name as string) || null,
      brand: (p.brands as string) || null,
      quantity: (p.quantity as string) || null,
      imageUrl: (p.image_front_url as string) || (p.image_url as string) || null,
      imageIngredientsUrl: (p.image_ingredients_url as string) || null,
      imageNutritionUrl: (p.image_nutrition_url as string) || null,
      categories: Array.isArray(p.categories_tags) ? p.categories_tags : [],
      nutriscore: (p.nutriscore_grade as string) || null,
      ecoscore: (p.ecoscore_grade as string) || null,
      ingredientsText:
        (p.ingredients_text_fr as string) || (p.ingredients_text as string) || null,
      novaGroup: typeof p.nova_group === 'number' ? (p.nova_group as number) : null,
      nutriments: (() => {
        const n = p.nutriments as Record<string, number> | undefined;
        if (!n) return null;
        const pick = (key: string) => (typeof n[key] === 'number' ? n[key] : null);
        return {
          energy_100g: pick('energy-kcal_100g') ?? pick('energy_100g'),
          fat_100g: pick('fat_100g'),
          saturatedFat_100g: pick('saturated-fat_100g'),
          carbohydrates_100g: pick('carbohydrates_100g'),
          sugars_100g: pick('sugars_100g'),
          fiber_100g: pick('fiber_100g'),
          proteins_100g: pick('proteins_100g'),
          salt_100g: pick('salt_100g'),
        };
      })(),
    };

    const response = jsonResponse({ ok: true, data: normalized }, {
      status: 200,
      request,
      headers: setCacheHeaders('medium'),
    });
    logInfo('product.success', { requestId, endpoint, status: response.status, durationMs: Date.now() - t0 });
    return response;
  } catch (error) {
    const timeout = error instanceof Error && error.name === 'AbortError';
    const response = jsonResponse(
      { ok: false, error: timeout ? 'off_timeout' : 'off_fetch_failed', data: null, requestId },
      { status: 200, request, cache: 'no-store' },
    );
    logError('product.fetch_failed', {
      requestId,
      endpoint,
      status: response.status,
      durationMs: Date.now() - t0,
      error: error instanceof Error ? error.message : String(error),
    });
    return response;
  }
};
