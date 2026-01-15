/**
 * Cloudflare Pages Function: /api/prices
 * Nouvelle API temps réel avec D1 (historique) + KV (cache agrégé).
 * Compatible avec l'ancien paramètre EAN pour ne pas casser le comparateur existant.
 */

type Period = 'hour' | 'day' | 'week' | 'month';

type PriceRow = {
  id?: string;
  territoire: string;
  produit: string;
  prix: number;
  devise?: string;
  source_type?: string;
  source_name?: string;
  timestamp: string;
};

type Env = {
  PRICE_DB?: any; // D1 binding
  PRICE_CACHE?: any; // KV binding
};

const PERIOD_WINDOWS: Record<Period, number> = {
  hour: 1,
  day: 24,
  week: 24 * 7,
  month: 24 * 30,
};

const PERIOD_CACHE_TTL: Record<Period, number> = {
  hour: 120,
  day: 300,
  week: 600,
  month: 900,
};

/**
 * Sanitize EAN code (digits only, length 8-14)
 */
function sanitizeEan(ean: string | null): string | null {
  if (!ean) return null;
  const cleaned = ean.replace(/\D/g, '');
  if (cleaned.length >= 8 && cleaned.length <= 14) {
    return cleaned;
  }
  return null;
}

function normalizeText(value: string | null, max = 80): string {
  return (value ?? '').trim().slice(0, max);
}

function getWindowStart(period: Period): string {
  const hours = PERIOD_WINDOWS[period] ?? PERIOD_WINDOWS.day;
  const start = new Date(Date.now() - hours * 60 * 60 * 1000);
  return start.toISOString();
}

function getBucketTimestamp(date: Date, period: Period): string {
  const bucket = new Date(date);
  bucket.setUTCMilliseconds(0);
  bucket.setUTCSeconds(0);

  if (period === 'hour') {
    bucket.setUTCMinutes(0);
    return bucket.toISOString();
  }

  bucket.setUTCMinutes(0);
  bucket.setUTCHours(0);

  if (period === 'day') {
    return bucket.toISOString();
  }

  if (period === 'week') {
    const day = bucket.getUTCDay(); // 0 (dimanche) → 6
    const diff = (day + 6) % 7; // ramener à lundi
    bucket.setUTCDate(bucket.getUTCDate() - diff);
    return bucket.toISOString();
  }

  // month
  bucket.setUTCDate(1);
  return bucket.toISOString();
}

function aggregatePrices(rows: PriceRow[], period: Period) {
  if (!rows || rows.length === 0) return [];

  const buckets = new Map<string, { total: number; count: number }>();

  for (const row of rows) {
    if (typeof row.prix !== 'number' || Number.isNaN(row.prix)) continue;
    const parsed = new Date(row.timestamp);
    if (Number.isNaN(parsed.getTime())) continue;
    const key = getBucketTimestamp(parsed, period);
    const current = buckets.get(key) ?? { total: 0, count: 0 };
    current.total += row.prix;
    current.count += 1;
    buckets.set(key, current);
  }

  return Array.from(buckets.entries())
    .map(([timestamp, value]) => ({
      timestamp,
      prix: Number((value.total / value.count).toFixed(2)),
    }))
    .sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=60',
    },
  });
}

async function readFromCache(env: Env, cacheKey: string) {
  if (!env.PRICE_CACHE) return null;
  try {
    const cached = await env.PRICE_CACHE.get(cacheKey, { type: 'json' });
    return cached;
  } catch (error) {
    console.error('KV read error', error);
    return null;
  }
}

async function writeToCache(env: Env, cacheKey: string, value: unknown, period: Period) {
  if (!env.PRICE_CACHE) return;
  try {
    await env.PRICE_CACHE.put(cacheKey, JSON.stringify(value), {
      expirationTtl: PERIOD_CACHE_TTL[period] ?? 300,
    });
  } catch (error) {
    console.error('KV write error', error);
  }
}

function handleLegacyEan(params: URLSearchParams) {
  const ean = sanitizeEan(params.get('ean'));
  if (!ean) {
    return jsonResponse(
      {
        error: 'Invalid or missing EAN code',
        message: 'EAN must be 8-14 digits',
      },
      400
    );
  }

  const legacyPayload = {
    ean,
    product: null,
    prices: [],
    best: null,
    message:
      "Endpoint modernisé. Utilisez territoire/produit/période pour l'observatoire temps réel.",
  };

  return jsonResponse(legacyPayload, 200);
}

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const url = new URL(request.url);
  const params = url.searchParams;

  // Legacy support for EAN (comparateur historique)
  if (params.get('ean')) {
    return handleLegacyEan(params);
  }

  const territoire = normalizeText(params.get('territoire'));
  const produit = normalizeText(params.get('produit'));
  const requestedPeriod = params.get('period') as Period | null;
  const period: Period =
    requestedPeriod && ['hour', 'day', 'week', 'month'].includes(requestedPeriod)
      ? requestedPeriod
      : 'day';

  if (!territoire || !produit) {
    return jsonResponse(
      {
        error: 'Paramètres manquants',
        message: 'territoire et produit sont obligatoires',
      },
      400
    );
  }

  const cacheKey = `prices:${territoire.toLowerCase()}:${produit.toLowerCase()}:${period}`;
  const cached = await readFromCache(env, cacheKey);
  if (cached) {
    return jsonResponse({ ...cached, cache: 'kv' }, 200);
  }

  if (!env.PRICE_DB) {
    return jsonResponse(
      {
        error: 'D1 non configurée',
        message:
          'Aucune base D1 attachée. Ajoutez le binding PRICE_DB pour activer les courbes temps réel.',
        data: [],
        territoire,
        produit,
        period,
        updated_at: new Date().toISOString(),
      },
      503
    );
  }

  const windowStart = getWindowStart(period);
  const statement = env.PRICE_DB.prepare(
    `
    SELECT territoire, produit, prix, devise, source_type, source_name, timestamp
    FROM prices
    WHERE territoire = ? AND produit = ? AND timestamp >= ?
    ORDER BY timestamp ASC
  `
  );

  const result = await statement
    .bind(territoire, produit, windowStart)
    .all<PriceRow>();

  const rows = result?.results ?? [];
  const aggregated = aggregatePrices(rows, period);
  const latest = rows.at(-1);

  const payload = {
    territoire,
    produit,
    period,
    source_type: latest?.source_type ?? null,
    source_name: latest?.source_name ?? null,
    currency: latest?.devise ?? 'EUR',
    data: aggregated,
    updated_at: latest?.timestamp ?? new Date().toISOString(),
  };

  await writeToCache(env, cacheKey, payload, period);

  return jsonResponse(payload, 200);
}

// Declared for completeness — cron triggers call this worker to préchauffer le cache.
export async function onRequestPost(context: { env: Env }) {
  const { env } = context;
  if (!env.PRICE_CACHE) {
    return jsonResponse({ ok: false, message: 'KV manquante' }, 503);
  }
  // Utilisé par un cron externe pour préchauffer/rafraîchir.
  await writeToCache(
    env,
    'prices:last-refresh',
    { refreshed_at: new Date().toISOString() },
    'day'
  );
  return jsonResponse({ ok: true, message: 'Tâche cron exécutée' }, 200);
}
