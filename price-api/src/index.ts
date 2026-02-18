import { Router } from 'itty-router';
import { buildJsonResponse, maybeReturnNotModified, readCache, writeCache } from './cache';
import { withCors } from './cors';
import { getAggregates, getRecentObservations, insertObservation, recomputeAggregate, toAggregateResponse, toObservationResponse } from './db';
import type { Env, Retailer, Territory } from './types';
import { parseIncludeObs, parseRetailers, parseTerritory, validateEan, validateObservationPayload } from './validators';

interface IRequest extends Request {
  params?: Record<string, string>;
}

const router = Router<IRequest>();
const postRate = new Map<string, number[]>();

const jsonError = async (request: Request, env: Env, status: number, message: string): Promise<Response> =>
  withCors(
    new Response(JSON.stringify({ error: message }), {
      status,
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
    }),
    request,
    env
  );

const enforcePostRateLimit = (request: Request): boolean => {
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const now = Date.now();
  const oneMinuteAgo = now - 60_000;
  const hits = (postRate.get(ip) || []).filter((ts) => ts >= oneMinuteAgo);
  if (hits.length >= 30) {
    postRate.set(ip, hits);
    return false;
  }
  hits.push(now);
  postRate.set(ip, hits);
  return true;
};

const normalizeRequest = (request: IRequest): { ean: string; territory: Territory; retailers: Retailer[]; includeObs: boolean } => {
  const url = new URL(request.url);
  const eanParam = request.params?.ean || url.searchParams.get('ean') || '';
  const ean = validateEan(eanParam);
  const territory = parseTerritory(url.searchParams.get('territory'));
  const retailers = parseRetailers(url.searchParams.get('retailers'));
  const includeObs = parseIncludeObs(url.searchParams.get('include'));
  return { ean, territory, retailers, includeObs };
};

const handleGetPrices = async (request: IRequest, env: Env): Promise<Response> => {
  const cached = await readCache(request);
  if (cached) {
    return withCors(cached, request, env);
  }

  const { ean, territory, retailers, includeObs } = normalizeRequest(request);
  const aggregates = await getAggregates(env.PRICE_DB, { ean, territory, retailers });

  const retailPayload = await Promise.all(
    retailers.map(async (retailer) => {
      const aggregate = aggregates.find((row) => row.retailer === retailer);
      const observations = includeObs
        ? await getRecentObservations(env.PRICE_DB, { ean, territory, retailer, limit: 10 })
        : [];

      return {
        retailer,
        aggregate: aggregate ? toAggregateResponse(aggregate) : { last: null, min: null, median: null, max: null, count: 0 },
        observations: includeObs ? observations.map(toObservationResponse) : undefined,
      };
    })
  );

  const payload = {
    ean,
    territory,
    retailers: retailPayload,
    generatedAt: new Date().toISOString(),
  };

  const response = await buildJsonResponse(payload);
  const notModified = maybeReturnNotModified(request, response.headers.get('ETag') || '');
  if (notModified) {
    return withCors(notModified, request, env);
  }

  await writeCache(request, response);
  return withCors(response, request, env);
};

router.get('/v1/health', async (request, env: Env) => {
  const payload = { status: 'ok', service: 'price-api', generatedAt: new Date().toISOString() };
  const response = await buildJsonResponse(payload);
  return withCors(response, request, env);
});

router.get('/v1/prices', (request, env: Env) => handleGetPrices(request, env));
router.get('/v1/prices/:ean', (request, env: Env) => handleGetPrices(request, env));

router.post('/v1/prices', async (request, env: Env) => {
  if (!enforcePostRateLimit(request)) {
    return jsonError(request, env, 429, 'Rate limit exceeded for POST /v1/prices');
  }

  const authHeader = request.headers.get('Authorization') || '';
  const expected = `Bearer ${env.ADMIN_API_KEY}`;
  if (!env.ADMIN_API_KEY || authHeader !== expected) {
    return jsonError(request, env, 401, 'Unauthorized');
  }

  const body = await request.json();
  const input = validateObservationPayload(body);

  const inserted = await insertObservation(env.PRICE_DB, input);
  const windowDays = Number.parseInt(env.AGGREGATE_WINDOW_DAYS || '60', 10) || 60;
  await recomputeAggregate(env.PRICE_DB, {
    ean: input.ean,
    territory: input.territory,
    retailer: input.retailer,
    windowDays,
  });

  console.log(
    JSON.stringify({
      event: 'price_observation_created',
      id: inserted.id,
      ean: input.ean,
      territory: input.territory,
      retailer: input.retailer,
      source: input.source,
    })
  );

  const response = new Response(
    JSON.stringify({ id: inserted.id, status: 'created', ean: input.ean, territory: input.territory, retailer: input.retailer }),
    { status: 201, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } }
  );
  return withCors(response, request, env);
});

router.options('*', (request, env: Env) => withCors(new Response(null, { status: 204 }), request, env));

export default {
  async fetch(request: IRequest, env: Env): Promise<Response> {
    try {
      const response = await router.fetch(request, env);
      if (response) {
        return response;
      }
      return jsonError(request, env, 404, 'Not found');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unexpected error';
      console.log(JSON.stringify({ event: 'price_api_error', message }));
      return jsonError(request, env, 400, message);
    }
  },
};
