import { errorResponse, getRequestId, handleOptions, jsonResponse, methodGuard, parseQuery, setCacheHeaders, softRateLimit } from '../_lib/http';
import { logError, logInfo, logWarn } from '../_lib/log';
import { isBarcode, isEnumValue, isNonEmptyString } from '../_lib/validate';

const TERRITORY_GL: Record<string, string> = {
  gp: 'fr',
  mq: 'fr',
  gf: 'fr',
  re: 'fr',
  yt: 'fr',
  fr: 'fr',
};

const parsePrice = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return null;
  const cleaned = value.replace(/[^\d,.-]/g, '').replace(',', '.');
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
};

export const onRequestOptions: PagesFunction = async ({ request }) => handleOptions(request, ['GET']) ?? new Response(null, { status: 204 });

export const onRequestGet: PagesFunction = async ({ request, env }) => {
  const t0 = Date.now();
  const endpoint = '/api/price-search';
  const requestId = getRequestId(request);

  const optionsResponse = handleOptions(request, ['GET']);
  if (optionsResponse) return optionsResponse;

  const blocked = methodGuard(request, ['GET']);
  if (blocked) return blocked;

  const rate = softRateLimit(request);
  if (!rate.ok) {
    return jsonResponse(
      { ok: false, code: 'RATE_LIMITED', message: 'Too many requests', requestId, retryAfter: rate.retryAfter },
      { status: 429, request, headers: { 'Retry-After': String(rate.retryAfter) } },
    );
  }

  const urlParams = parseQuery(request);
  const q = (urlParams.get('q') ?? '').trim();
  const barcode = (urlParams.get('barcode') ?? '').trim();
  const territory = (urlParams.get('territory') ?? 'fr').trim().toLowerCase();

  const query = q || barcode;
  if (!query) {
    const response = errorResponse('MISSING_PARAM', 'Missing q or barcode query parameter', {
      status: 400,
      request,
      requestId,
      details: { error: 'missing_query', results: [] },
    });
    logWarn('price-search.missing_query', { requestId, endpoint, status: response.status, durationMs: Date.now() - t0 });
    return response;
  }

  if (barcode && !isBarcode(barcode)) {
    const response = errorResponse('INVALID_INPUT', 'Invalid barcode format', { status: 400, request, requestId });
    logWarn('price-search.invalid_barcode', { requestId, endpoint, status: response.status, durationMs: Date.now() - t0 });
    return response;
  }

  if (!isNonEmptyString(query, 120)) {
    const response = errorResponse('INVALID_INPUT', 'Invalid query parameter', { status: 400, request, requestId });
    logWarn('price-search.invalid_query', { requestId, endpoint, status: response.status, durationMs: Date.now() - t0 });
    return response;
  }

  if (!isEnumValue(territory, ['gp', 'mq', 'gf', 're', 'yt', 'fr'])) {
    const response = errorResponse('INVALID_INPUT', 'Invalid territory parameter', { status: 400, request, requestId });
    logWarn('price-search.invalid_territory', { requestId, endpoint, status: response.status, durationMs: Date.now() - t0 });
    return response;
  }

  const apiKey = (env as Record<string, string | undefined>).SERP_API_KEY;
  if (!apiKey) {
    const response = jsonResponse(
      { ok: true, query, results: [], warning: 'serp_api_key_unconfigured' },
      { status: 200, request, cache: 'no-store' },
    );
    logWarn('price-search.api_key_missing', { requestId, endpoint, status: response.status, durationMs: Date.now() - t0 });
    return response;
  }

  const gl = TERRITORY_GL[territory] ?? 'fr';
  const serpEndpoint = `https://serpapi.com/search.json?${new URLSearchParams({
    engine: 'google_shopping',
    q: query,
    api_key: apiKey,
    hl: 'fr',
    gl,
  }).toString()}`;

  try {
    const response = await fetch(serpEndpoint, { headers: { Accept: 'application/json' } });
    if (!response.ok) {
      const apiResponse = jsonResponse(
        { ok: true, query, results: [], warning: `serpapi_error_${response.status}` },
        { status: 200, request, cache: 'no-store' },
      );
      logWarn('price-search.serp_error', { requestId, endpoint, status: apiResponse.status, durationMs: Date.now() - t0 });
      return apiResponse;
    }

    const payload = (await response.json()) as { shopping_results?: Array<Record<string, unknown>> };
    const results = (payload.shopping_results ?? [])
      .map((item) => {
        const price = parsePrice(item.extracted_price ?? item.price);
        if (price === null) return null;

        return {
          title: String(item.title ?? '').trim(),
          merchant: String(item.source ?? item.merchant ?? 'Marchand web').trim(),
          price,
          currency: 'EUR',
          url: String(item.link ?? item.product_link ?? '').trim(),
          source: 'serpapi',
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .slice(0, 12);

    const apiResponse = jsonResponse({ ok: true, query, results }, {
      status: 200,
      request,
      headers: setCacheHeaders('medium'),
    });
    logInfo('price-search.success', { requestId, endpoint, status: apiResponse.status, durationMs: Date.now() - t0 });
    return apiResponse;
  } catch (error) {
    const apiResponse = jsonResponse(
      { ok: true, query, results: [], warning: error instanceof Error ? error.message : String(error) },
      { status: 200, request, cache: 'no-store' },
    );
    logError('price-search.fetch_failed', {
      requestId,
      endpoint,
      status: apiResponse.status,
      durationMs: Date.now() - t0,
      error: error instanceof Error ? error.message : String(error),
    });
    return apiResponse;
  }
};
