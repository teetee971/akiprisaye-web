import type {
  ImportJobRecord,
  ImportJobStatus,
  ImportRowRecord,
  ImportRowStatus,
  InsertObservationCentsInput,
  InsertObservationInput,
  PriceAggregateRecord,
  PriceObservationRecord,
  ProductRecord,
  SubscriptionRecord,
  Territory,
} from './types';

interface AggregateFingerprint {
  maxUpdatedAt: string | null;
  rowCount: number;
}

export interface SubscriptionUpsertPayload {
  userId: string;
  plan: string;
  status: 'CREATED' | 'ACTIVE' | 'SUSPENDED' | 'CANCELLED';
  paypalSubscriptionId: string;
  payerId?: string;
  email?: string;
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

export async function ensureProductExists(
  db: D1Database,
  input: {
    ean: string;
    quantity?: string;
  },
): Promise<void> {
  await db
    .prepare(`INSERT OR IGNORE INTO products (ean, product_name, quantity, updated_at) VALUES (?, NULL, ?, datetime('now'))`)
    .bind(input.ean, input.quantity ?? null)
    .run();
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

export async function insertObservationAndRefreshAggregate(
  db: D1Database,
  input: InsertObservationInput,
): Promise<void> {
  await insertObservationCentsAndRefreshAggregate(db, {
    ...input,
    priceCents: Math.round(input.price * 100),
  });
}

export async function insertObservationCentsAndRefreshAggregate(
  db: D1Database,
  input: InsertObservationCentsInput,
): Promise<void> {
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
      input.priceCents,
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

export async function createImportJob(
  db: D1Database,
  payload: { id: string; filename: string; r2Key: string; territory: Territory; status?: ImportJobStatus },
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO import_jobs (id, filename, r2_key, territory, status, total_rows, success_rows, error_rows)
       VALUES (?, ?, ?, ?, ?, 0, 0, 0)`,
    )
    .bind(payload.id, payload.filename, payload.r2Key, payload.territory, payload.status ?? 'queued')
    .run();
}

export async function updateImportJobProgress(
  db: D1Database,
  payload: {
    id: string;
    status: ImportJobStatus;
    totalRows: number;
    successRows: number;
    errorRows: number;
    finished: boolean;
  },
): Promise<void> {
  await db
    .prepare(
      `UPDATE import_jobs
       SET status = ?, total_rows = ?, success_rows = ?, error_rows = ?, finished_at = CASE WHEN ? THEN datetime('now') ELSE NULL END
       WHERE id = ?`,
    )
    .bind(payload.status, payload.totalRows, payload.successRows, payload.errorRows, payload.finished ? 1 : 0, payload.id)
    .run();
}

export async function getImportJobs(db: D1Database, limit = 50): Promise<ImportJobRecord[]> {
  const { results } = await db
    .prepare('SELECT * FROM import_jobs ORDER BY created_at DESC LIMIT ?')
    .bind(limit)
    .all<ImportJobRecord>();
  return results ?? [];
}

export async function getImportJobById(db: D1Database, jobId: string): Promise<ImportJobRecord | null> {
  return db.prepare('SELECT * FROM import_jobs WHERE id = ?').bind(jobId).first<ImportJobRecord>();
}

export async function getImportRowsByJobId(db: D1Database, jobId: string, limit = 200): Promise<ImportRowRecord[]> {
  const { results } = await db
    .prepare('SELECT * FROM import_rows WHERE job_id = ? ORDER BY row_number ASC LIMIT ?')
    .bind(jobId, limit)
    .all<ImportRowRecord>();
  return results ?? [];
}

export async function insertImportRow(
  db: D1Database,
  payload: {
    jobId: string;
    rowNumber: number;
    ean?: string | null;
    retailer?: string | null;
    territory?: string | null;
    priceCents?: number | null;
    status: ImportRowStatus;
    errorMessage?: string | null;
  },
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO import_rows (id, job_id, row_number, ean, retailer, territory, price_cents, status, error_message)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      crypto.randomUUID(),
      payload.jobId,
      payload.rowNumber,
      payload.ean ?? null,
      payload.retailer ?? null,
      payload.territory ?? null,
      payload.priceCents ?? null,
      payload.status,
      payload.errorMessage ?? null,
    )
    .run();
}

export async function applySimpleRateLimit(
  db: D1Database,
  key: string,
  limit = 60,
  windowSeconds = 60,
): Promise<boolean> {
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

export async function updateReceiptJobCashier(
  db: D1Database,
  jobId: string,
  fields: { cashierLabelRaw: string | null; cashierHash: string | null; cashierOperatorId: string | null },
): Promise<void> {
  await db
    .prepare(
      `UPDATE receipt_jobs
       SET cashier_label_raw = ?, cashier_hash = ?, cashier_operator_id = ?
       WHERE id = ?`,
    )
    .bind(fields.cashierLabelRaw, fields.cashierHash, fields.cashierOperatorId, jobId)
    .run();
}

export async function recordWebhookEventIfNew(
  db: D1Database,
  payload: { eventId: string; eventType: string; createTime?: string; rawJson: string },
): Promise<boolean> {
  const cappedRawJson = payload.rawJson.length > 64000 ? payload.rawJson.slice(0, 64000) : payload.rawJson;
  const result = await db
    .prepare(
      `INSERT OR IGNORE INTO webhook_events (event_id, event_type, create_time, raw_json)
       VALUES (?, ?, ?, ?)`,
    )
    .bind(payload.eventId, payload.eventType, payload.createTime ?? null, cappedRawJson)
    .run();

  return Boolean(result.meta.changes && result.meta.changes > 0);
}

export async function upsertSubscriptionByPayPalId(db: D1Database, payload: SubscriptionUpsertPayload): Promise<void> {
  await db
    .prepare(
      `INSERT INTO subscriptions (user_id, plan, status, paypal_subscription_id, payer_id, email)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(paypal_subscription_id) DO UPDATE SET
         user_id = excluded.user_id,
         plan = excluded.plan,
         status = excluded.status,
         payer_id = excluded.payer_id,
         email = excluded.email,
         updated_at = datetime('now')`,
    )
    .bind(
      payload.userId,
      payload.plan,
      payload.status,
      payload.paypalSubscriptionId,
      payload.payerId ?? null,
      payload.email ?? null,
    )
    .run();
}

export async function getLatestSubscriptions(db: D1Database, limit = 50): Promise<SubscriptionRecord[]> {
  const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 200) : 50;
  const { results } = await db
    .prepare('SELECT * FROM subscriptions ORDER BY updated_at DESC LIMIT ?')
    .bind(safeLimit)
    .all<SubscriptionRecord>();

  return results ?? [];
}

export async function getSubscriptionByUserId(db: D1Database, userId: string): Promise<SubscriptionRecord | null> {
  return db
    .prepare('SELECT * FROM subscriptions WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1')
    .bind(userId)
    .first<SubscriptionRecord>();
}
