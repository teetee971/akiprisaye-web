import type {
  FetchJobListRecord,
  FetchJobRecord,
  FetchJobStatus,
  InsertObservationInput,
  PriceAggregateRecord,
  PriceObservationRecord,
  ProductRecord,
  SourceRecord,
  Territory,
} from './types';

interface AggregateFingerprint {
  maxUpdatedAt: string | null;
  rowCount: number;
}

export async function getAggregateFingerprint(
  db: D1Database,
  ean: string,
  territory?: Territory,
  retailer?: string,
): Promise<AggregateFingerprint> {
  let sql = `
    SELECT MAX(updated_at) AS maxUpdatedAt, COUNT(*) AS rowCount
    FROM price_aggregates
    WHERE ean = ?
  `;
  const binds: (string | null)[] = [ean];

  if (territory) {
    sql += ' AND territory = ?';
    binds.push(territory);
  }

  if (retailer) {
    sql += ' AND retailer = ?';
    binds.push(retailer);
  }

  const result = await db.prepare(sql).bind(...binds).first<AggregateFingerprint>();
  return {
    maxUpdatedAt: result?.maxUpdatedAt ?? null,
    rowCount: Number(result?.rowCount ?? 0),
  };
}

export async function getPriceAggregates(
  db: D1Database,
  ean: string,
  territory?: Territory,
  retailer?: string,
): Promise<PriceAggregateRecord[]> {
  let sql = 'SELECT * FROM price_aggregates WHERE ean = ?';
  const binds: string[] = [ean];

  if (territory) {
    sql += ' AND territory = ?';
    binds.push(territory);
  }

  if (retailer) {
    sql += ' AND retailer = ?';
    binds.push(retailer);
  }

  sql += ' ORDER BY territory, retailer, currency, unit';
  const { results } = await db.prepare(sql).bind(...binds).all<PriceAggregateRecord>();
  return results ?? [];
}

export async function getRecentObservations(
  db: D1Database,
  ean: string,
  territory?: Territory,
  retailer?: string,
  limit = 20,
): Promise<PriceObservationRecord[]> {
  let sql = 'SELECT * FROM price_observations WHERE ean = ?';
  const binds: (string | number)[] = [ean];

  if (territory) {
    sql += ' AND territory = ?';
    binds.push(territory);
  }

  if (retailer) {
    sql += ' AND retailer = ?';
    binds.push(retailer);
  }

  sql += ' ORDER BY observed_at DESC LIMIT ?';
  binds.push(limit);

  const { results } = await db.prepare(sql).bind(...binds).all<PriceObservationRecord>();
  return results ?? [];
}

export async function getProduct(db: D1Database, ean: string): Promise<ProductRecord | null> {
  return db.prepare('SELECT * FROM products WHERE ean = ?').bind(ean).first<ProductRecord>();
}

export async function upsertProduct(
  db: D1Database,
  input: {
    ean: string;
    productName: string;
    brand?: string;
    quantity?: string;
    ingredientsText?: string;
  },
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO products (ean, product_name, brand, quantity, ingredients_text, updated_at)
       VALUES (?, ?, ?, ?, ?, datetime('now'))
       ON CONFLICT(ean) DO UPDATE SET
         product_name = excluded.product_name,
         brand = excluded.brand,
         quantity = excluded.quantity,
         ingredients_text = excluded.ingredients_text,
         updated_at = datetime('now')`,
    )
    .bind(
      input.ean,
      input.productName,
      input.brand ?? null,
      input.quantity ?? null,
      input.ingredientsText ?? null,
    )
    .run();
}

export async function insertObservationAndRefreshAggregate(db: D1Database, input: InsertObservationInput): Promise<void> {
  const priceCents = Math.round(input.price * 100);
  const observedAt = input.observedAt ?? new Date().toISOString();
  const id = crypto.randomUUID();

  await db
    .prepare(
      `INSERT INTO price_observations (
        id, ean, territory, retailer, store_id, store_name, price_cents,
        currency, unit, observed_at, source, confidence, metadata_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      id,
      input.ean,
      input.territory,
      input.retailer,
      input.storeId ?? null,
      input.storeName ?? null,
      priceCents,
      input.currency,
      input.unit ?? null,
      observedAt,
      input.source,
      input.confidence ?? 1,
      input.metadata ? JSON.stringify(input.metadata) : null,
    )
    .run();

  await refreshAggregate(db, {
    ean: input.ean,
    territory: input.territory,
    retailer: input.retailer,
    currency: input.currency,
    unit: input.unit ?? null,
  });
}

export async function refreshAggregate(
  db: D1Database,
  key: { ean: string; territory: Territory; retailer: string; currency: string; unit: string | null },
): Promise<void> {
  const stats = await db
    .prepare(
      `SELECT
         COUNT(*) AS count_observations,
         MIN(price_cents) AS min_price_cents,
         MAX(price_cents) AS max_price_cents,
         (SELECT po2.price_cents FROM price_observations po2
            WHERE po2.ean = ? AND po2.territory = ? AND po2.retailer = ? AND po2.currency = ?
              AND ((po2.unit IS NULL AND ? IS NULL) OR po2.unit = ?)
            ORDER BY po2.observed_at DESC LIMIT 1) AS last_price_cents,
         MAX(observed_at) AS last_observed_at,
         (
          SELECT CAST(AVG(mid.price_cents) AS INTEGER)
          FROM (
            SELECT po3.price_cents
            FROM price_observations po3
            WHERE po3.ean = ? AND po3.territory = ? AND po3.retailer = ? AND po3.currency = ?
              AND ((po3.unit IS NULL AND ? IS NULL) OR po3.unit = ?)
            ORDER BY po3.price_cents
            LIMIT 2 - (
              SELECT COUNT(*)
              FROM price_observations po4
              WHERE po4.ean = ? AND po4.territory = ? AND po4.retailer = ? AND po4.currency = ?
                AND ((po4.unit IS NULL AND ? IS NULL) OR po4.unit = ?)
            ) % 2
            OFFSET (
              (
                SELECT COUNT(*)
                FROM price_observations po5
                WHERE po5.ean = ? AND po5.territory = ? AND po5.retailer = ? AND po5.currency = ?
                  AND ((po5.unit IS NULL AND ? IS NULL) OR po5.unit = ?)
              ) - 1
            ) / 2
          ) AS mid
        ) AS median_price_cents
       FROM price_observations
       WHERE ean = ? AND territory = ? AND retailer = ? AND currency = ?
         AND ((unit IS NULL AND ? IS NULL) OR unit = ?)`,
    )
    .bind(
      key.ean,
      key.territory,
      key.retailer,
      key.currency,
      key.unit,
      key.unit,
      key.ean,
      key.territory,
      key.retailer,
      key.currency,
      key.unit,
      key.unit,
      key.ean,
      key.territory,
      key.retailer,
      key.currency,
      key.unit,
      key.unit,
      key.ean,
      key.territory,
      key.retailer,
      key.currency,
      key.unit,
      key.unit,
      key.ean,
      key.territory,
      key.retailer,
      key.currency,
      key.unit,
      key.unit,
    )
    .first<{
      count_observations: number;
      min_price_cents: number | null;
      max_price_cents: number | null;
      last_price_cents: number | null;
      median_price_cents: number | null;
      last_observed_at: string | null;
    }>();

  if (!stats || Number(stats.count_observations) === 0) {
    return;
  }

  await db
    .prepare(
      `INSERT INTO price_aggregates (
        ean, territory, retailer, currency, unit,
        last_price_cents, min_price_cents, max_price_cents, median_price_cents,
        count_observations, last_observed_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      ON CONFLICT(ean, territory, retailer, currency, unit) DO UPDATE SET
        last_price_cents = excluded.last_price_cents,
        min_price_cents = excluded.min_price_cents,
        max_price_cents = excluded.max_price_cents,
        median_price_cents = excluded.median_price_cents,
        count_observations = excluded.count_observations,
        last_observed_at = excluded.last_observed_at,
        updated_at = datetime('now')`,
    )
    .bind(
      key.ean,
      key.territory,
      key.retailer,
      key.currency,
      key.unit,
      stats.last_price_cents,
      stats.min_price_cents,
      stats.max_price_cents,
      stats.median_price_cents,
      stats.count_observations,
      stats.last_observed_at,
    )
    .run();
}

export async function applySimpleRateLimit(db: D1Database, key: string, limit = 60, windowSeconds = 60): Promise<boolean> {
  const now = new Date();
  const currentWindow = new Date(Math.floor(now.getTime() / (windowSeconds * 1000)) * windowSeconds * 1000).toISOString();

  const existing = await db.prepare('SELECT key, count, window_start FROM rate_limits WHERE key = ?').bind(key).first<{
    key: string;
    count: number;
    window_start: string;
  }>();

  if (!existing || existing.window_start !== currentWindow) {
    await db
      .prepare(
        `INSERT INTO rate_limits (key, count, window_start)
         VALUES (?, 1, ?)
         ON CONFLICT(key) DO UPDATE SET count = 1, window_start = excluded.window_start`,
      )
      .bind(key, currentWindow)
      .run();
    return true;
  }

  if (existing.count >= limit) {
    return false;
  }

  await db.prepare('UPDATE rate_limits SET count = count + 1 WHERE key = ?').bind(key).run();
  return true;
}

export async function upsertSource(db: D1Database, source: Omit<SourceRecord, 'created_at'>): Promise<void> {
  await db
    .prepare(
      `INSERT INTO sources (id, name, type, base_url, auth_type, enabled, territory_scope, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
       ON CONFLICT(id) DO UPDATE SET
         name = excluded.name,
         type = excluded.type,
         base_url = excluded.base_url,
         auth_type = excluded.auth_type,
         enabled = excluded.enabled,
         territory_scope = excluded.territory_scope`,
    )
    .bind(source.id, source.name, source.type, source.base_url, source.auth_type, source.enabled, source.territory_scope)
    .run();
}

export async function ensureDefaultSources(db: D1Database): Promise<void> {
  const defaults: Omit<SourceRecord, 'created_at'>[] = [
    {
      id: 'backoffice',
      name: 'Backoffice Placeholder',
      type: 'backoffice',
      base_url: null,
      auth_type: 'none',
      enabled: 1,
      territory_scope: 'fr,gp,mq',
    },
    {
      id: 'open_data_dummy',
      name: 'Open Data Dummy',
      type: 'open_data',
      base_url: null,
      auth_type: 'none',
      enabled: 1,
      territory_scope: 'fr,gp,mq',
    },
  ];

  for (const source of defaults) {
    await upsertSource(db, source);
  }
}

export async function createFetchJob(db: D1Database, sourceId: string, territory: Territory): Promise<string> {
  const id = crypto.randomUUID();
  await db.prepare('INSERT INTO fetch_jobs (id, source_id, territory, status) VALUES (?, ?, ?, ?)').bind(id, sourceId, territory, 'queued').run();
  return id;
}

export async function getFetchJob(db: D1Database, jobId: string): Promise<FetchJobRecord | null> {
  return db.prepare('SELECT * FROM fetch_jobs WHERE id = ?').bind(jobId).first<FetchJobRecord>();
}

export async function updateFetchJobStatus(
  db: D1Database,
  jobId: string,
  status: FetchJobStatus,
  patch?: { startedAt?: string; finishedAt?: string; error?: string | null },
): Promise<void> {
  await db
    .prepare(
      `UPDATE fetch_jobs
       SET status = ?,
           started_at = COALESCE(?, started_at),
           finished_at = COALESCE(?, finished_at),
           error = ?
       WHERE id = ?`,
    )
    .bind(status, patch?.startedAt ?? null, patch?.finishedAt ?? null, patch?.error ?? null, jobId)
    .run();
}

export async function insertFetchJobItem(
  db: D1Database,
  input: {
    jobId: string;
    ean: string;
    retailer?: string;
    status: 'ok' | 'no_data' | 'invalid' | 'error';
    rawRef?: string;
    rawPayloadJson?: string;
    observedPriceCents?: number;
    currency?: string;
    unit?: string;
    observedAt?: string;
  },
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO fetch_job_items (
        id, job_id, ean, retailer, status, raw_ref, raw_payload_json,
        observed_price_cents, currency, unit, observed_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
    )
    .bind(
      crypto.randomUUID(),
      input.jobId,
      input.ean,
      input.retailer ?? null,
      input.status,
      input.rawRef ?? null,
      input.rawPayloadJson ?? null,
      input.observedPriceCents ?? null,
      input.currency ?? null,
      input.unit ?? null,
      input.observedAt ?? null,
    )
    .run();
}

export async function listFetchJobs(
  db: D1Database,
  filters: { territory?: Territory; sourceId?: string; limit?: number },
): Promise<FetchJobListRecord[]> {
  let sql = `
    SELECT
      j.*,
      SUM(CASE WHEN i.status = 'ok' THEN 1 ELSE 0 END) AS ok_count,
      SUM(CASE WHEN i.status = 'no_data' THEN 1 ELSE 0 END) AS no_data_count,
      SUM(CASE WHEN i.status = 'error' THEN 1 ELSE 0 END) AS error_count,
      SUM(CASE WHEN i.status = 'invalid' THEN 1 ELSE 0 END) AS invalid_count
    FROM fetch_jobs j
    LEFT JOIN fetch_job_items i ON i.job_id = j.id
    WHERE 1=1
  `;
  const binds: (string | number)[] = [];

  if (filters.territory) {
    sql += ' AND j.territory = ?';
    binds.push(filters.territory);
  }

  if (filters.sourceId) {
    sql += ' AND j.source_id = ?';
    binds.push(filters.sourceId);
  }

  sql += ' GROUP BY j.id ORDER BY COALESCE(j.started_at, j.finished_at) DESC, j.id DESC LIMIT ?';
  binds.push(filters.limit ?? 20);

  const { results } = await db.prepare(sql).bind(...binds).all<FetchJobListRecord>();
  return (results ?? []).map((item) => ({
    ...item,
    ok_count: Number(item.ok_count ?? 0),
    no_data_count: Number(item.no_data_count ?? 0),
    error_count: Number(item.error_count ?? 0),
    invalid_count: Number(item.invalid_count ?? 0),
  }));
}

export async function selectKnownEans(db: D1Database, limit: number): Promise<string[]> {
  const { results } = await db
    .prepare('SELECT ean FROM products ORDER BY updated_at DESC LIMIT ?')
    .bind(limit)
    .all<{ ean: string }>();
  return (results ?? []).map((item) => item.ean);
}
