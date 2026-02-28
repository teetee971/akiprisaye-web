import { buildEtag, shouldReturnNotModified, storeInCache } from './cache';
import {
  applySimpleRateLimit,
  getAggregateFingerprint,
  getImportJobById,
  getImportJobs,
  getImportRowsByJobId,
  getPriceAggregates,
  getProduct,
  getRecentObservations,
  getLatestSubscriptions,
  getSubscriptionByUserId,
  insertObservationAndRefreshAggregate,
  recordWebhookEventIfNew,
  upsertSubscriptionByPayPalId,
  upsertProduct,
} from './db';
import { withCors } from './cors';
import { queueCsvImport } from './importCsv';
import { verifyPayPalWebhookSignature, type PayPalWebhookEvent } from './paypal';
import { mapPayPalEventTypeToSubscriptionStatus, mapPayPalPlanIdToInternalPlan } from './subscriptionPlans';
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

function adminJson(data: unknown, status = 200): Response {
  return json(data, status, { 'Cache-Control': 'no-store' });
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

function assertSubscriptionLookupToken(request: Request, adminToken: string): boolean {
  const token = request.headers.get('X-Admin-Token');
  return Boolean(token && token === adminToken);
}

export async function handleRequest(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const url = new URL(request.url);
  const origin = request.headers.get('Origin');

  if (request.method === 'OPTIONS') {
    return withCors(new Response(null, { status: 204 }), origin, env);
  }

  try {
    if (request.method === 'POST' && url.pathname === '/v1/webhooks/paypal') {
      const bodyText = await request.text();
      let event: PayPalWebhookEvent;
      try {
        event = JSON.parse(bodyText) as PayPalWebhookEvent;
      } catch {
        console.warn('paypal_webhook_ignored', { reason: 'invalid_json' });
        return withCors(json({ error: 'invalid_json' }, 400), origin, env);
      }

      const eventId = event.id ?? 'unknown';
      const eventType = event.event_type ?? 'unknown';

      if (!event.id || !event.event_type) {
        console.warn('paypal_webhook_ignored', { eventId, eventType, reason: 'missing_event_identity' });
        return withCors(json({ status: 'ignored', reason: 'missing_event_identity' }, 200), origin, env);
      }

      const isVerified = await verifyPayPalWebhookSignature(request, env, event);
      if (!isVerified) {
        console.warn('paypal_webhook_rejected', { eventId, eventType, reason: 'invalid_signature' });
        return withCors(json({ error: 'invalid_signature' }, 401), origin, env);
      }

      const status = mapPayPalEventTypeToSubscriptionStatus(event.event_type);
      if (!status) {
        console.log('paypal_webhook_ignored', { eventId, eventType, reason: 'unsupported_event_type' });
        return withCors(json({ status: 'ignored', reason: 'unsupported_event_type' }, 200), origin, env);
      }

      const isNewEvent = await recordWebhookEventIfNew(env.PRICE_DB, {
        eventId: event.id,
        eventType: event.event_type,
        createTime: event.create_time,
        rawJson: bodyText,
      });

      if (!isNewEvent) {
        console.log('paypal_webhook_ignored', { eventId, eventType, reason: 'duplicate_event' });
        return withCors(json({ status: 'ignored', reason: 'duplicate_event' }, 200), origin, env);
      }

      const userId = event.resource?.custom_id;
      if (!userId) {
        console.warn('paypal_webhook_ignored', { eventId, eventType, reason: 'missing_custom_id' });
        return withCors(json({ status: 'ignored', reason: 'missing_custom_id' }, 200), origin, env);
      }

      const subscriptionId = event.resource?.id;
      if (!subscriptionId) {
        console.warn('paypal_webhook_ignored', { eventId, eventType, reason: 'missing_subscription_id' });
        return withCors(json({ status: 'ignored', reason: 'missing_subscription_id' }, 200), origin, env);
      }

      await upsertSubscriptionByPayPalId(env.PRICE_DB, {
        userId,
        plan: mapPayPalPlanIdToInternalPlan(event.resource?.plan_id),
        status,
        paypalSubscriptionId: subscriptionId,
        payerId: event.resource?.subscriber?.payer_id,
        email: event.resource?.subscriber?.email_address,
      });

      console.log('paypal_webhook_processed', { eventId, eventType, status, userId, subscriptionId });

      return withCors(json({ status: 'processed' }, 200), origin, env);
    }

    if (request.method === 'GET' && url.pathname === '/v1/me/subscription') {
      if (!assertSubscriptionLookupToken(request, env.PRICE_ADMIN_TOKEN)) {
        return withCors(json({ error: 'unauthorized' }, 401), origin, env);
      }

      const userId = url.searchParams.get('user_id');
      if (!userId) {
        return withCors(json({ error: 'missing_user_id' }, 400), origin, env);
      }

      // TODO: remplacer user_id query param par une authentification utilisateur (JWT/session).
      const subscription = await getSubscriptionByUserId(env.PRICE_DB, userId);
      if (!subscription) {
        return withCors(json({ status: 'FREE' }, 200), origin, env);
      }

      return withCors(
        json({
          status: subscription.status,
          plan: subscription.plan,
          updatedAt: subscription.updated_at,
        }),
        origin,
        env,
      );
    }

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

    if (
      (request.method === 'POST' && url.pathname.startsWith('/v1/admin/')) ||
      (request.method === 'GET' && url.pathname.startsWith('/v1/admin/import/'))
    ) {
      if (!assertAdminToken(request, env.PRICE_ADMIN_TOKEN)) {
        return withCors(adminJson({ error: 'unauthorized' }, 401), origin, env);
      }

      const ipKey = request.headers.get('CF-Connecting-IP') ?? 'unknown';
      const allowed = await applySimpleRateLimit(env.PRICE_DB, `admin:${ipKey}`, 120, 60);
      if (!allowed) {
        return withCors(adminJson({ error: 'rate_limited' }, 429), origin, env);
      }

      if (request.method === 'POST' && url.pathname === '/v1/admin/import/csv') {
        const queued = await queueCsvImport(request, env, ctx);
        return withCors(adminJson({ status: 'queued', jobId: queued.jobId, filename: queued.filename }, 202), origin, env);
      }

      if (request.method === 'GET' && url.pathname === '/v1/admin/import/jobs') {
        const limit = Number(url.searchParams.get('limit') ?? '50');
        const jobs = await getImportJobs(env.PRICE_DB, Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 200) : 50);
        return withCors(adminJson({ status: 'OK', jobs }, 200), origin, env);
      }

      if (request.method === 'GET' && url.pathname === '/v1/admin/subscriptions') {
        const limit = Number(url.searchParams.get('limit') ?? '50');
        const subscriptions = await getLatestSubscriptions(env.PRICE_DB, limit);
        return withCors(adminJson({ status: 'OK', subscriptions }, 200), origin, env);
      }

      if (request.method === 'GET' && /^\/v1\/admin\/import\/jobs\/[^/]+$/.test(url.pathname)) {
        const jobId = decodeURIComponent(url.pathname.replace('/v1/admin/import/jobs/', ''));
        const [job, rows] = await Promise.all([getImportJobById(env.PRICE_DB, jobId), getImportRowsByJobId(env.PRICE_DB, jobId, 500)]);

        if (!job) {
          return withCors(adminJson({ error: 'not_found' }, 404), origin, env);
        }

        return withCors(adminJson({ status: 'OK', job, rows }, 200), origin, env);
      }

      if (request.method === 'POST' && url.pathname === '/v1/admin/products') {
        const body = adminProductSchema.parse(await request.json());
        await upsertProduct(env.PRICE_DB, body);
        return withCors(adminJson({ status: 'OK', ean: body.ean }, 200), origin, env);
      }

      if (request.method === 'POST' && url.pathname === '/v1/admin/observations') {
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

        return withCors(adminJson({ status: 'OK', ean: body.ean }, 201), origin, env);
      }

      if (request.method === 'POST' && url.pathname === '/v1/admin/seed') {
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

        return withCors(adminJson({ status: 'OK', ean, inserted: seedPayloads.length }, 201), origin, env);
      }
    }

    return withCors(json({ error: 'not_found' }, 404), origin, env);
  } catch (error) {
    if (error instanceof Error) {
      return withCors(adminJson({ error: 'bad_request', message: error.message }, 400), origin, env);
    }

    return withCors(adminJson({ error: 'unavailable' }, 503), origin, env);
  }
}
