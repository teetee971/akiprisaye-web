import { applyRateLimit, getAggregateFingerprint, getAggregates, getObservations, insertObservation } from './db';
import { assertOriginAllowed, corsHeaders, getCorsOrigin, preflight } from './cors';
import { buildEtag, readFromCache, withCommonHeaders, writeToCache } from './cache';
import { assertValidQuery, parseIncludeObs, parsePostBody, parseRetailersParam } from './validators';
import type { Env } from './types';

function json(data: unknown, init: ResponseInit = {}, env?: Env): Response {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json; charset=utf-8');

  if (env) {
    const ttl = Number(env.CACHE_TTL_SECONDS ?? '21600');
    headers.set('Cache-Control', `public, max-age=${ttl}`);
  }

  return new Response(JSON.stringify(data), { ...init, headers });
}

export async function route(req: Request, env: Env): Promise<Response> {
  const url = new URL(req.url);

  if (req.method === 'OPTIONS') {
    return preflight(req, env);
  }

  if (req.method === 'GET' && url.pathname === '/v1/health') {
    const origin = getCorsOrigin(req, env);
    return json(
      { ok: true, service: 'price-api', ts: new Date().toISOString() },
      { headers: corsHeaders(origin) }
    );
  }

  if (req.method === 'GET' && url.pathname === '/v1/prices') {
    const origin = getCorsOrigin(req, env);
    const query = assertValidQuery(url.searchParams.get('ean'), url.searchParams.get('territory'));
    const retailers = parseRetailersParam(url.searchParams.get('retailers'));
    const includeObs = parseIncludeObs(url.searchParams.get('include'));
    const windowDays = Number(env.AGG_WINDOW_DAYS ?? '60');

    const fingerprint = await getAggregateFingerprint(env, query.ean, query.territory, retailers);
    const etag = buildEtag(`${fingerprint}:${url.searchParams.toString()}`);

    if (req.headers.get('If-None-Match') === etag) {
      return new Response(null, {
        status: 304,
        headers: {
          ...corsHeaders(origin),
          ETag: etag
        }
      });
    }

    const cached = await readFromCache(req);
    if (cached) {
      const cachedHeaders = new Headers(cached.headers);
      cachedHeaders.set('ETag', etag);
      Object.entries(corsHeaders(origin)).forEach(([k, v]) => cachedHeaders.set(k, v));
      return new Response(cached.body, { status: cached.status, headers: cachedHeaders });
    }

    const aggregates = await getAggregates(env, query.ean, query.territory, retailers, windowDays);
    const observations = includeObs
      ? await getObservations(env, query.ean, query.territory, retailers)
      : undefined;

    const response = withCommonHeaders(
      JSON.stringify({
        ean: query.ean,
        territory: query.territory,
        retailers,
        aggregates,
        observations
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders(origin),
          ETag: etag
        }
      },
      env
    );

    await writeToCache(req, response);
    return response;
  }

  if (req.method === 'POST' && url.pathname === '/v1/prices') {
    const origin = getCorsOrigin(req, env);
    assertOriginAllowed(req, env);

    const auth = req.headers.get('Authorization');
    if (!auth || auth !== `Bearer ${env.ADMIN_API_KEY}`) {
      return json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders(origin) });
    }

    const maxPerMinute = Number(env.POST_RATE_LIMIT_PER_MIN ?? '30');
    const ip = req.headers.get('CF-Connecting-IP') ?? 'unknown';
    const allowed = await applyRateLimit(env, `post:${ip}`, maxPerMinute);

    if (!allowed) {
      return json({ error: 'Rate limit exceeded' }, { status: 429, headers: corsHeaders(origin) });
    }

    const payload = await parsePostBody(req);
    const id = await insertObservation(env, payload);

    return json(
      {
        ok: true,
        id
      },
      { status: 201, headers: corsHeaders(origin) }
    );
  }

  return json({ error: 'Not found' }, { status: 404 });
}
