import { buildEtag, shouldReturnNotModified, storeInCache } from './cache';
import {
  applySimpleRateLimit,
  createReceiptJob,
  getAggregateFingerprint,
  getPriceAggregates,
  getProduct,
  getReceiptJob,
  getRecentObservations,
  insertObservationAndRefreshAggregate,
  insertReceiptItem,
  updateReceiptJobStatus,
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
  receiptCompleteSchema,
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


function redactServerText(text: string): string {
  const piiPatterns = [
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}/g,
    /\b(?:\+33|0)[1-9](?:[\s.-]?\d{2}){4}\b/g,
    /\b(?:\d{4}[\s.-]?){3}\d{4}\b/g,
    /\b[A-Z]{2}\d{2}[A-Z0-9]{11,30}\b/gi,
  ];
  return piiPatterns.reduce((acc, pattern) => acc.replace(pattern, '[REDACTED]'), text);
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

    if (request.method === 'POST' && url.pathname === '/v1/ingest/receipt/init') {
      const body = (await request.json()) as { territory?: 'fr' | 'gp' | 'mq' };
      const territory = body.territory ?? 'gp';
      const jobId = await createReceiptJob(env.PRICE_DB, territory);
      return withCors(json({ status: 'OK', jobId }, 201), origin, env);
    }

    if (request.method === 'GET' && url.pathname.startsWith('/v1/ingest/receipt/jobs/')) {
      const jobId = decodeURIComponent(url.pathname.replace('/v1/ingest/receipt/jobs/', ''));
      const job = await getReceiptJob(env.PRICE_DB, jobId);
      if (!job) {
        return withCors(json({ error: 'not_found' }, 404), origin, env);
      }
      return withCors(json({ status: 'OK', job }, 200), origin, env);
    }

    if (request.method === 'POST' && url.pathname === '/v1/ingest/receipt/confirm') {
      const body = (await request.json()) as { jobId?: string };
      if (!body.jobId) {
        return withCors(json({ error: 'bad_request', message: 'jobId is required' }, 400), origin, env);
      }
      await updateReceiptJobStatus(env.PRICE_DB, body.jobId, 'confirmed');
      return withCors(json({ status: 'OK', jobId: body.jobId }, 200), origin, env);
    }

    if (request.method === 'POST' && url.pathname === '/v1/ingest/receipt/complete') {
      const body = receiptCompleteSchema.parse(await request.json());
      const jobId = body.jobId ?? (await createReceiptJob(env.PRICE_DB, body.territory));
      const redactedText = redactServerText(body.redactedText);
      const observedAt = body.purchasedAt ?? new Date().toISOString();
      let insertedObservations = 0;

      for (const item of body.items) {
        await insertReceiptItem(env.PRICE_DB, {
          jobId,
          label: redactServerText(item.label),
          qty: item.qty,
          unit: item.unit,
          priceCents: item.priceCents,
          confidence: item.confidence,
          ean: item.ean,
        });

        if (item.ean) {
          await insertObservationAndRefreshAggregate(env.PRICE_DB, {
            ean: item.ean,
            territory: body.territory,
            retailer: validateRetailer(body.retailer),
            price: item.priceCents / 100,
            currency: body.currency,
            unit: item.unit,
            observedAt,
            storeName: body.storeLabel ? redactServerText(body.storeLabel) : undefined,
            source: 'receipt_user',
            confidence: item.confidence,
            metadata: {
              jobId,
              redactedTextPreview: redactedText.slice(0, 500),
            },
          });
          insertedObservations += 1;
        }
      }

      const status = insertedObservations === body.items.length ? 'success' : insertedObservations > 0 ? 'partial' : 'failed';
      await updateReceiptJobStatus(env.PRICE_DB, jobId, status, insertedObservations === 0 ? 'No EAN in payload items' : undefined);

      return withCors(
        json({ status: 'OK', jobId, jobStatus: status, insertedItems: body.items.length, insertedObservations }, 201),
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
