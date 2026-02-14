const PRICE_CACHE_TTL_SECONDS = 3_600;
const REQUEST_TIMEOUT_MS = 10_000;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...CORS_HEADERS,
    },
  });
}

function withTimeout(timeoutMs: number): AbortController {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeoutMs);
  return controller;
}

export const onRequestOptions: PagesFunction = async () =>
  new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });

export const onRequestGet: PagesFunction = async ({ request }) => {
  const requestUrl = new URL(request.url);
  const barcode = (requestUrl.searchParams.get('barcode') ?? '').trim();
  const territory = (requestUrl.searchParams.get('territory') ?? 'fr').trim();
  const maxAgeDays = (requestUrl.searchParams.get('maxAgeDays') ?? '90').trim();

  if (!barcode) {
    return jsonResponse({ error: 'Missing barcode' }, 400);
  }

  const downstreamParams = new URLSearchParams({
    barcode,
    territory,
    maxAgeDays,
  });
  const downstreamUrl = `${requestUrl.origin}/api/prices/by-barcode?${downstreamParams.toString()}`;

  const cacheKey = new Request(`${requestUrl.origin}/api/prices?${downstreamParams.toString()}`, {
    method: 'GET',
  });

  const cache = caches.default;
  const cached = await cache.match(cacheKey);
  if (cached) {
    return new Response(cached.body, cached);
  }

  try {
    const controller = withTimeout(REQUEST_TIMEOUT_MS);
    const response = await fetch(downstreamUrl, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      return jsonResponse({ error: `Price upstream error (${response.status})` }, 502);
    }

    const payload = await response.json();
    const cacheable = new Response(JSON.stringify(payload), {
      status: 200,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'Cache-Control': `public, max-age=${PRICE_CACHE_TTL_SECONDS}`,
        ...CORS_HEADERS,
      },
    });

    await cache.put(cacheKey, cacheable.clone());
    return cacheable;
  } catch (error) {
    const timedOut = error instanceof Error && error.name === 'AbortError';
    return jsonResponse(
      {
        error: timedOut ? 'Price request timed out after 10 seconds' : 'Unable to resolve prices',
      },
      504,
    );
  }
};
