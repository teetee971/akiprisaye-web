import { buildEtag, shouldReturnNotModified, storeInCache } from './cache';
import {
  applySimpleRateLimit,
  getAggregateFingerprint,
  getPriceAggregates,
  getProduct,
  getRecentObservations,
  insertObservationAndRefreshAggregate,
  upsertProduct,
} from './db';
import { withCors } from './cors';
import type { Env, PriceAggregateRecord, PriceObservationRecord, PriceStatus, PricesResponse, ProductResponse } from './types';
import {
  adminObservationSchema,
  adminProductSchema,
  assertAdminToken,
  getPricesQuerySchema,
  getProductParamsSchema,
  validateRetailer,
} from './validators';

function json(data: unknown, status = 200, headers?: HeadersInit): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...headers,
    },
  });
}

function toAggregateView(aggregate: PriceAggregateRecord) {
  return {
    territory: aggregate.territory,
    retailer: aggregate.retailer,
    currency: aggregate.currency,
    unit: aggregate.unit,
    stats: {
      lastPrice: aggregate.last_price_cents !== null ? aggregate.last_price_cents / 100 : null,
      minPrice: aggregate.min_price_cents !== null ? aggregate.min_price_cents / 100 : null,
      maxPrice: aggregate.max_price_cents !== null ? aggregate.max_price_cents / 100 : null,
      medianPrice: aggregate.median_price_cents !== null ? aggregate.median_price_cents / 100 : null,
      count: aggregate.count_observations,
      lastObservedAt: aggregate.last_observed_at,
    },
    updatedAt: aggregate.updated_at,
  };
}

function toObservationView(observation: PriceObservationRecord) {
  return {
    id: observation.id,
    territory: observation.territory,
    retailer: observation.retailer,
    storeId: observation.store_id,
    storeName: observation.store_name,
    price: observation.price_cents / 100,
    currency: observation.currency,
    unit: observation.unit,
    observedAt: observation.observed_at,
    source: observation.source,
    confidence: observation.confidence,
    metadata: observation.metadata_json ? (JSON.parse(observation.metadata_json) as Record<string, unknown>) : null,
  };
}

function computeStatus(hasAggregates: boolean, hasProduct = false): PriceStatus {
  if (hasAggregates) {
    return 'OK';
  }
  if (hasProduct) {
    return 'PARTIAL';
  }
  return 'NO_DATA';
}

export async function handleRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const origin = request.headers.get('Origin');

  if (request.method === 'OPTIONS') {
    return withCors(new Response(null, { status: 204 }), origin, env);
  }

  try {
    if (request.method === 'GET' && url.pathname === '/v1/prices') {
      const parsed = getPricesQuerySchema.parse(Object.fromEntries(url.searchParams.entries()));
      const retailer = parsed.retailer ? validateRetailer(parsed.retailer) : undefined;
      const fingerprint = await getAggregateFingerprint(env.PRICE_DB, parsed.ean, parsed.territory, retailer);
      const etag = buildEtag(`${parsed.ean}:${parsed.territory ?? 'all'}:${retailer ?? 'all'}:${fingerprint.maxUpdatedAt ?? 'none'}:${fingerprint.rowCount}`);

      if (shouldReturnNotModified(request, etag)) {
        return withCors(
          new Response(null, {
            status: 304,
            headers: {
              ETag: etag,
              'Cache-Control': 'public, max-age=120, s-maxage=300',
            },
          }),
          origin,
          env,
        );
      }

      const [aggregates, observations] = await Promise.all([
        getPriceAggregates(env.PRICE_DB, parsed.ean, parsed.territory, retailer),
        getRecentObservations(env.PRICE_DB, parsed.ean, parsed.territory, retailer, 25),
      ]);

      const payload: PricesResponse = {
        status: computeStatus(aggregates.length > 0),
        timestamp: new Date().toISOString(),
        ean: parsed.ean,
        territory: parsed.territory,
        retailers: Array.from(new Set(aggregates.map((item) => item.retailer))),
        aggregates: aggregates.map(toAggregateView),
        recentObservations: observations.map(toObservationView),
        meta: {
          etag,
          updatedAt: fingerprint.maxUpdatedAt,
        },
      };

      const response = json(payload, 200, {
        ETag: etag,
        'Cache-Control': 'public, max-age=120, s-maxage=300',
      });
      await storeInCache(request, response);
      return withCors(response, origin, env);
    }

    if (request.method === 'GET' && url.pathname.startsWith('/v1/products/')) {
      const ean = decodeURIComponent(url.pathname.replace('/v1/products/', ''));
      const parsed = getProductParamsSchema.parse({ ean });
      const [product, aggregates] = await Promise.all([
        getProduct(env.PRICE_DB, parsed.ean),
        getPriceAggregates(env.PRICE_DB, parsed.ean),
      ]);

      const response: ProductResponse = {
        status: computeStatus(aggregates.length > 0, Boolean(product)),
        timestamp: new Date().toISOString(),
        product: product
          ? {
              ean: product.ean,
              productName: product.product_name,
              brand: product.brand,
              quantity: product.quantity,
              ingredientsText: product.ingredients_text,
              createdAt: product.created_at,
              updatedAt: product.updated_at,
            }
          : null,
        aggregates: aggregates.map(toAggregateView),
      };

      return withCors(
        json(response, 200, {
          'Cache-Control': 'public, max-age=120, s-maxage=300',
        }),
        origin,
        env,
      );
    }

    if (request.method === 'POST' && url.pathname.startsWith('/v1/admin/')) {
      if (!assertAdminToken(request, env.PRICE_ADMIN_TOKEN)) {
        return withCors(json({ error: 'unauthorized' }, 401), origin, env);
      }

      const ipKey = request.headers.get('CF-Connecting-IP') ?? 'unknown';
      const allowed = await applySimpleRateLimit(env.PRICE_DB, `admin:${ipKey}`, 120, 60);
      if (!allowed) {
        return withCors(json({ error: 'rate_limited' }, 429), origin, env);
      }

      if (url.pathname === '/v1/admin/products') {
        const body = adminProductSchema.parse(await request.json());
        await upsertProduct(env.PRICE_DB, body);
        return withCors(json({ status: 'OK', ean: body.ean }, 200), origin, env);
      }

      if (url.pathname === '/v1/admin/observations') {
        const body = adminObservationSchema.parse(await request.json());
        await insertObservationAndRefreshAggregate(env.PRICE_DB, {
          ean: body.ean,
          territory: body.territory,
          retailer: validateRetailer(body.retailer),
          price: body.price,
          currency: body.currency,
          unit: body.unit,
          observedAt: body.observedAt,
          storeId: body.storeId,
          storeName: body.storeName,
          source: body.source,
          confidence: body.confidence,
          metadata: body.metadata,
        });

        return withCors(json({ status: 'OK', ean: body.ean }, 201), origin, env);
      }

      if (url.pathname === '/v1/admin/seed') {
        const ean = '3560070894222';
        await upsertProduct(env.PRICE_DB, {
          ean,
          productName: "Carrefour Classic’ Sirop de cerise / Cerise-Kers 75 cl",
          brand: 'Carrefour Classic’',
          quantity: '75 cl',
          ingredientsText: 'Placeholder seed data. Renseigner les ingrédients exacts via back-office.',
        });

        const seedPayloads = [
          { territory: 'gp', retailer: 'carrefour', price: 3.49 },
          { territory: 'gp', retailer: 'leclerc', price: 3.75 },
          { territory: 'mq', retailer: 'carrefour', price: 3.89 },
          { territory: 'mq', retailer: 'superu', price: 4.1 },
          { territory: 'fr', retailer: 'carrefour', price: 2.99 },
          { territory: 'fr', retailer: 'intermarché', price: 3.19 },
        ] as const;

        for (const item of seedPayloads) {
          await insertObservationAndRefreshAggregate(env.PRICE_DB, {
            ean,
            territory: item.territory,
            retailer: item.retailer,
            price: item.price,
            currency: 'EUR',
            unit: 'l',
            source: 'admin_seed',
            confidence: 0.5,
            metadata: {
              placeholder: true,
              note: 'Prix de démonstration à remplacer via back-office',
            },
          });
        }

        return withCors(json({ status: 'OK', ean, inserted: seedPayloads.length }, 201), origin, env);
      }
    }

    return withCors(json({ error: 'not_found' }, 404), origin, env);
  } catch (error) {
    if (error instanceof Error) {
      return withCors(json({ error: 'bad_request', message: error.message }, 400), origin, env);
    }

    return withCors(json({ error: 'unavailable' }, 503), origin, env);
  }
}
