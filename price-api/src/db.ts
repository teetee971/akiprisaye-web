import type { Env, PriceAggregateRow, PriceObservationInput, PriceObservationRow } from './types';

function toCents(value: number): number {
  return Math.round(value * 100);
}

export async function insertObservation(env: Env, payload: PriceObservationInput): Promise<string> {
  const id = crypto.randomUUID();
  await env.PRICE_DB.prepare(
    `INSERT INTO price_observations (
      id, ean, territory, retailer, price_cents, currency, unit, price_per_unit_cents,
      observed_at, source, store_ref, metadata_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      id,
      payload.ean,
      payload.territory,
      payload.retailer,
      toCents(payload.price),
      payload.currency ?? 'EUR',
      payload.unit ?? null,
      payload.pricePerUnit !== undefined ? toCents(payload.pricePerUnit) : null,
      payload.observedAt,
      payload.source,
      payload.storeRef ?? null,
      payload.metadata ? JSON.stringify(payload.metadata) : null
    )
    .run();

  await refreshAggregate(env, payload.ean, payload.territory, payload.retailer);
  return id;
}

async function refreshAggregate(env: Env, ean: string, territory: string, retailer: string): Promise<void> {
  const latest = await env.PRICE_DB.prepare(
    `SELECT
      price_cents,
      observed_at
     FROM price_observations
     WHERE ean = ? AND territory = ? AND retailer = ?
     ORDER BY observed_at DESC
     LIMIT 1`
  )
    .bind(ean, territory, retailer)
    .first<{ price_cents: number; observed_at: string }>();

  const stats = await env.PRICE_DB.prepare(
    `SELECT
      MIN(price_cents) AS min_price_cents,
      MAX(price_cents) AS max_price_cents,
      COUNT(*) AS count_obs
     FROM price_observations
     WHERE ean = ? AND territory = ? AND retailer = ?`
  )
    .bind(ean, territory, retailer)
    .first<{ min_price_cents: number; max_price_cents: number; count_obs: number }>();

  const medianRow = await env.PRICE_DB.prepare(
    `WITH ordered AS (
      SELECT price_cents,
             ROW_NUMBER() OVER (ORDER BY price_cents) AS rn,
             COUNT(*) OVER () AS cnt
      FROM price_observations
      WHERE ean = ? AND territory = ? AND retailer = ?
    )
    SELECT CAST(AVG(price_cents) AS INTEGER) AS median_price_cents
    FROM ordered
    WHERE rn IN ((cnt + 1) / 2, (cnt + 2) / 2)`
  )
    .bind(ean, territory, retailer)
    .first<{ median_price_cents: number | null }>();

  const key = `${ean}:${territory}:${retailer}`;
  await env.PRICE_DB.prepare(
    `INSERT INTO price_aggregates (
      key, ean, territory, retailer, last_price_cents, last_observed_at,
      min_price_cents, max_price_cents, median_price_cents, count_obs, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(key) DO UPDATE SET
      last_price_cents = excluded.last_price_cents,
      last_observed_at = excluded.last_observed_at,
      min_price_cents = excluded.min_price_cents,
      max_price_cents = excluded.max_price_cents,
      median_price_cents = excluded.median_price_cents,
      count_obs = excluded.count_obs,
      updated_at = datetime('now')`
  )
    .bind(
      key,
      ean,
      territory,
      retailer,
      latest?.price_cents ?? null,
      latest?.observed_at ?? null,
      stats?.min_price_cents ?? null,
      stats?.max_price_cents ?? null,
      medianRow?.median_price_cents ?? null,
      stats?.count_obs ?? 0
    )
    .run();
}

export async function getAggregates(
  env: Env,
  ean: string,
  territory: string,
  retailers: string[],
  windowDays: number
): Promise<PriceAggregateRow[]> {
  const placeholders = retailers.map(() => '?').join(',');
  const sinceExpr = `datetime('now', '-' || ? || ' days')`;

  const query = `
    SELECT
      key,
      ean,
      territory,
      retailer,
      last_price_cents,
      last_observed_at,
      min_price_cents,
      max_price_cents,
      median_price_cents,
      count_obs,
      updated_at
    FROM price_aggregates
    WHERE ean = ?
      AND territory = ?
      AND retailer IN (${placeholders})
      AND (last_observed_at IS NULL OR last_observed_at >= ${sinceExpr})
    ORDER BY retailer ASC
  `;

  const result = await env.PRICE_DB.prepare(query)
    .bind(ean, territory, ...retailers, String(windowDays))
    .all<PriceAggregateRow>();

  return result.results ?? [];
}

export async function getObservations(
  env: Env,
  ean: string,
  territory: string,
  retailers: string[],
  limit = 200
): Promise<PriceObservationRow[]> {
  const placeholders = retailers.map(() => '?').join(',');

  const result = await env.PRICE_DB.prepare(
    `SELECT
      id,
      ean,
      territory,
      retailer,
      price_cents,
      currency,
      unit,
      price_per_unit_cents,
      observed_at,
      source,
      store_ref,
      metadata_json,
      created_at
    FROM price_observations
    WHERE ean = ?
      AND territory = ?
      AND retailer IN (${placeholders})
    ORDER BY observed_at DESC
    LIMIT ?`
  )
    .bind(ean, territory, ...retailers, limit)
    .all<PriceObservationRow>();

  return result.results ?? [];
}

export async function getAggregateFingerprint(
  env: Env,
  ean: string,
  territory: string,
  retailers: string[]
): Promise<string> {
  const placeholders = retailers.map(() => '?').join(',');
  const row = await env.PRICE_DB.prepare(
    `SELECT COALESCE(MAX(updated_at), 'none') AS max_updated_at
    FROM price_aggregates
    WHERE ean = ? AND territory = ? AND retailer IN (${placeholders})`
  )
    .bind(ean, territory, ...retailers)
    .first<{ max_updated_at: string }>();

  return row?.max_updated_at ?? 'none';
}

export async function applyRateLimit(env: Env, key: string, maxPerMinute: number): Promise<boolean> {
  await env.PRICE_DB.prepare(
    `CREATE TABLE IF NOT EXISTS rate_limit (
      key TEXT NOT NULL,
      minute_bucket TEXT NOT NULL,
      count INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (key, minute_bucket)
    )`
  ).run();

  const now = new Date();
  const minuteBucket = now.toISOString().slice(0, 16);
  const result = (await env.PRICE_DB.prepare(
    `INSERT INTO rate_limit (key, minute_bucket, count)
      VALUES (?, ?, 1)
      ON CONFLICT(key, minute_bucket) DO UPDATE SET count = count + 1
      RETURNING count`
  )
    .bind(key, minuteBucket)
    .first<{ count: number }>()) as { count: number } | null;

  return (result?.count ?? 0) <= maxPerMinute;
}
