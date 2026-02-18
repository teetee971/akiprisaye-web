import type { PriceAggregateRow, PriceObservationInput, PriceObservationRow, Retailer, Territory } from './types';

const toCents = (value: number): number => Math.round(value * 100);
const fromCents = (value: number | null): number | null => (value === null ? null : Number((value / 100).toFixed(2)));

export const insertObservation = async (db: D1Database, input: PriceObservationInput): Promise<{ id: string }> => {
  const id = crypto.randomUUID();
  await db
    .prepare(
      `INSERT INTO price_observations (
        id, ean, territory, retailer, price_cents, currency, unit,
        price_per_unit_cents, observed_at, source, store_ref, metadata_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      input.ean,
      input.territory,
      input.retailer,
      toCents(input.price),
      input.currency,
      input.unit ?? null,
      input.perUnit ? toCents(input.perUnit) : null,
      input.observedAt,
      input.source,
      input.storeRef ?? null,
      input.metadata ? JSON.stringify(input.metadata) : null
    )
    .run();

  return { id };
};

export const recomputeAggregate = async (
  db: D1Database,
  args: { ean: string; territory: Territory; retailer: Retailer; windowDays: number }
): Promise<void> => {
  const { ean, territory, retailer, windowDays } = args;
  const key = `${ean}|${territory}|${retailer}`;

  const rows = await db
    .prepare(
      `SELECT price_cents, observed_at
       FROM price_observations
       WHERE ean = ? AND territory = ? AND retailer = ?
         AND observed_at >= datetime('now', ?)
       ORDER BY observed_at DESC`
    )
    .bind(ean, territory, retailer, `-${windowDays} days`)
    .all<{ price_cents: number; observed_at: string }>();

  const observations = rows.results ?? [];
  const countObs = observations.length;

  if (!countObs) {
    await db
      .prepare(
        `INSERT INTO price_aggregates (
          key, ean, territory, retailer, count_obs, updated_at
        ) VALUES (?, ?, ?, ?, 0, datetime('now'))
        ON CONFLICT(key) DO UPDATE SET
          count_obs = 0,
          last_price_cents = NULL,
          last_observed_at = NULL,
          min_price_cents = NULL,
          max_price_cents = NULL,
          median_price_cents = NULL,
          updated_at = datetime('now')`
      )
      .bind(key, ean, territory, retailer)
      .run();
    return;
  }

  const prices = observations.map((obs) => obs.price_cents).sort((a, b) => a - b);
  const mid = Math.floor(prices.length / 2);
  const median = prices.length % 2 === 0 ? Math.round((prices[mid - 1] + prices[mid]) / 2) : prices[mid];

  const latest = observations[0];
  const min = prices[0];
  const max = prices[prices.length - 1];

  await db
    .prepare(
      `INSERT INTO price_aggregates (
        key, ean, territory, retailer,
        last_price_cents, last_observed_at,
        min_price_cents, max_price_cents, median_price_cents,
        count_obs, updated_at
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
    .bind(key, ean, territory, retailer, latest.price_cents, latest.observed_at, min, max, median, countObs)
    .run();
};

export const getAggregates = async (
  db: D1Database,
  args: { ean: string; territory: Territory; retailers: Retailer[] }
): Promise<PriceAggregateRow[]> => {
  const placeholders = args.retailers.map(() => '?').join(', ');
  const statement = db.prepare(
    `SELECT * FROM price_aggregates
     WHERE ean = ? AND territory = ? AND retailer IN (${placeholders})`
  );
  const result = await statement.bind(args.ean, args.territory, ...args.retailers).all<PriceAggregateRow>();
  return result.results ?? [];
};

export const getRecentObservations = async (
  db: D1Database,
  args: { ean: string; territory: Territory; retailer: Retailer; limit?: number }
): Promise<PriceObservationRow[]> => {
  const limit = args.limit ?? 10;
  const result = await db
    .prepare(
      `SELECT * FROM price_observations
       WHERE ean = ? AND territory = ? AND retailer = ?
       ORDER BY observed_at DESC
       LIMIT ?`
    )
    .bind(args.ean, args.territory, args.retailer, limit)
    .all<PriceObservationRow>();

  return result.results ?? [];
};

export const toAggregateResponse = (row: PriceAggregateRow) => ({
  last: row.last_price_cents
    ? {
        price: fromCents(row.last_price_cents),
        currency: 'EUR',
        observedAt: row.last_observed_at,
      }
    : null,
  min: fromCents(row.min_price_cents),
  median: fromCents(row.median_price_cents),
  max: fromCents(row.max_price_cents),
  count: row.count_obs,
});

export const toObservationResponse = (row: PriceObservationRow) => ({
  id: row.id,
  ean: row.ean,
  territory: row.territory,
  retailer: row.retailer,
  price: fromCents(row.price_cents),
  currency: row.currency,
  unit: row.unit,
  perUnit: fromCents(row.price_per_unit_cents),
  observedAt: row.observed_at,
  source: row.source,
  storeRef: row.store_ref,
  metadata: row.metadata_json ? JSON.parse(row.metadata_json) : null,
  createdAt: row.created_at,
});
