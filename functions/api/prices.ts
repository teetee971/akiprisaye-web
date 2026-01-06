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

type PricePoint = {
  timestamp: string;
  prix: number;
};

type PriceAnomaly = {
  timestamp: string;
  prix: number;
  type: string;
  severity: 'warning' | 'critical';
  message: string;
};

type PriceKpi = {
  min: number;
  max: number;
  median: number;
  trend: number;
  sample: number;
  windowStart: string;
  windowEnd: string;
};

type PriceSeries = {
  territoire: string;
  produit: string;
  period: Period;
  data: PricePoint[];
  updated_at: string;
  source_type?: string | null;
  source_name?: string | null;
  currency?: string | null;
  cache?: string;
  anomalies?: PriceAnomaly[];
  kpis?: PriceKpi;
  message?: string;
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

const ANOMALY_Z_THRESHOLD = 2.5;
const ANOMALY_Z_CRITICAL = 3;
const ANOMALY_VARIATION_THRESHOLD = 25; // %

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

function getWindowStart(period: Period, from?: string | null): string {
  if (from) {
    const parsed = new Date(from);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }
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

function calculateKpis(points: PricePoint[], windowStart: string, windowEnd: string): PriceKpi | undefined {
  if (!points.length) return undefined;
  const prices = points.map((p) => p.prix).sort((a, b) => a - b);
  const min = prices[0];
  const max = prices[prices.length - 1];
  const mid = Math.floor(prices.length / 2);
  const median = prices.length % 2 !== 0 ? prices[mid] : (prices[mid - 1] + prices[mid]) / 2;
  const trend =
    prices.length >= 2 ? Number((((prices[prices.length - 1] - prices[0]) / prices[0]) * 100).toFixed(2)) : 0;
  return {
    min: Number(min.toFixed(2)),
    max: Number(max.toFixed(2)),
    median: Number(median.toFixed(2)),
    trend,
    sample: prices.length,
    windowStart,
    windowEnd,
  };
}

function detectAnomalies(points: PricePoint[]): PriceAnomaly[] {
  if (points.length < 3) return [];
  const values = points.map((p) => p.prix);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((acc, value) => acc + Math.pow(value - mean, 2), 0) / values.length;
  const std = Math.sqrt(variance);

  const anomalies: PriceAnomaly[] = [];
  for (const point of points) {
    const z = std === 0 ? 0 : (point.prix - mean) / std;
    if (Math.abs(z) >= ANOMALY_Z_THRESHOLD) {
      anomalies.push({
        timestamp: point.timestamp,
        prix: point.prix,
        type: 'z-score',
        severity: Math.abs(z) > ANOMALY_Z_CRITICAL ? 'critical' : 'warning',
        message: `Anomalie détectée (z=${z.toFixed(2)})`,
      });
    }
  }

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const current = points[i];
    if (prev.prix === 0) continue;
    const variation = ((current.prix - prev.prix) / prev.prix) * 100;
    if (Math.abs(variation) >= ANOMALY_VARIATION_THRESHOLD) {
      anomalies.push({
        timestamp: current.timestamp,
        prix: current.prix,
        type: 'variation',
        severity: 'warning',
        message: `Variation rapide de ${variation.toFixed(1)}%`,
      });
    }
  }

  return anomalies;
}

function generateSyntheticSeries(
  territoire: string,
  produit: string,
  period: Period,
  from?: string | null,
  to?: string | null
): PriceSeries {
  const TERRITORY_FACTOR: Record<string, number> = {
    guadeloupe: 1,
    martinique: 1.04,
    guyane: 1.12,
    'la réunion': 1.08,
    mayotte: 0.98,
  };

  const basePrices: Record<string, number> = {
    'Riz 1kg': 2.05,
    'Lait UHT 1L': 1.42,
    'Pâtes 500g': 1.18,
    'Sucre 1kg': 1.75,
  };

  const start = new Date(getWindowStart(period, from));
  const end = to ? new Date(to) : new Date();
  const stepHours = period === 'hour' ? 1 : period === 'day' ? 24 : period === 'week' ? 24 * 7 : 24 * 30;

  const base = basePrices[produit] ?? 1.5;
  const territoryKey = territoire.toLowerCase();
  const multiplier = TERRITORY_FACTOR[territoryKey] ?? 1.05;

  const points: PricePoint[] = [];
  for (let d = new Date(start); d <= end; d = new Date(d.getTime() + stepHours * 60 * 60 * 1000)) {
    const t = d.getTime();
    const seasonal = Math.sin(t / (1000 * 60 * 60 * 24 * 3)) * 0.05;
    const micro = Math.sin(t / (1000 * 60 * 60 * 6)) * 0.02;
    const price = Number((base * multiplier * (1 + seasonal + micro)).toFixed(2));
    points.push({ timestamp: new Date(d).toISOString(), prix: Math.max(price, 0.35) });
  }

  const kpis = calculateKpis(points, start.toISOString(), end.toISOString());
  const anomalies = detectAnomalies(points);

  return {
    territoire,
    produit,
    period,
    data: points,
    updated_at: end.toISOString(),
    source_type: 'open_data_fallback',
    source_name: 'Cache communautaire (synthetic)',
    currency: 'EUR',
    anomalies,
    kpis,
    message:
      "Source de secours générée sans flux caisse. Utilisez PRICE_DB/KV pour des données collectées en production.",
  };
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

  const primaryTerritoire = normalizeText(params.get('territoire'));
  const territoriesParam = params.get('territoires');
  const produit = normalizeText(params.get('produit'));
  const requestedPeriod = params.get('period') as Period | null;
  const period: Period =
    requestedPeriod && ['hour', 'day', 'week', 'month'].includes(requestedPeriod)
      ? requestedPeriod
      : 'day';

  const territories =
    territoriesParam
      ?.split(',')
      .map((t) => normalizeText(t))
      .filter(Boolean) ?? [];
  if (territories.length === 0 && primaryTerritoire) {
    territories.push(primaryTerritoire);
  }

  const fromParam = params.get('from');
  const toParam = params.get('to');
  const fromDate =
    fromParam && !Number.isNaN(new Date(fromParam).getTime()) ? new Date(fromParam).toISOString() : null;
  const toDate = toParam && !Number.isNaN(new Date(toParam).getTime()) ? new Date(toParam).toISOString() : null;

  if (territories.length === 0 || !produit) {
    return jsonResponse(
      {
        error: 'Paramètres manquants',
        message: 'territoire(s) et produit sont obligatoires',
      },
      400
    );
  }

  const cacheKey = `prices:${territories.join('-').toLowerCase()}:${produit.toLowerCase()}:${period}:${
    fromDate ?? 'window'
  }:${toDate ?? 'now'}`;
  const cached = await readFromCache(env, cacheKey);
  if (cached) {
    return jsonResponse({ ...cached, cache: 'kv' }, 200);
  }

  const windowStart = getWindowStart(period, fromDate);
  const series: PriceSeries[] = [];

  if (env.PRICE_DB) {
    for (const territoire of territories) {
      const sql = `
        SELECT territoire, produit, prix, devise, source_type, source_name, timestamp
        FROM prices
        WHERE territoire = ? AND produit = ? AND timestamp >= ?
        ${toDate ? 'AND timestamp <= ?' : ''}
        ORDER BY timestamp ASC
      `;
      const statement = env.PRICE_DB.prepare(sql);
      const result = toDate
        ? await statement.bind(territoire, produit, windowStart, toDate).all<PriceRow>()
        : await statement.bind(territoire, produit, windowStart).all<PriceRow>();

      const rows = result?.results ?? [];
      const aggregated = aggregatePrices(rows, period);
      const latest = rows.at(-1);
      const dataSeries: PriceSeries =
        aggregated.length > 0
          ? {
              territoire,
              produit,
              period,
              source_type: latest?.source_type ?? null,
              source_name: latest?.source_name ?? null,
              currency: latest?.devise ?? 'EUR',
              data: aggregated,
              updated_at: latest?.timestamp ?? new Date().toISOString(),
              anomalies: detectAnomalies(aggregated),
              kpis: calculateKpis(
                aggregated,
                windowStart,
                toDate ?? aggregated.at(aggregated.length - 1)?.timestamp ?? new Date().toISOString()
              ),
            }
          : generateSyntheticSeries(territoire, produit, period, fromDate, toDate);
      series.push(dataSeries);
    }
  } else {
    for (const territoire of territories) {
      series.push(generateSyntheticSeries(territoire, produit, period, fromDate, toDate));
    }
  }

  const updatedAt =
    series
      .map((s) => new Date(s.updated_at ?? new Date()).getTime())
      .sort((a, b) => b - a)
      .at(0) ?? Date.now();

  const payload = {
    territoire: series[0]?.territoire ?? territories[0],
    produit,
    period,
    source_type: series[0]?.source_type ?? null,
    source_name: series[0]?.source_name ?? null,
    currency: series[0]?.currency ?? 'EUR',
    data: series[0]?.data ?? [],
    updated_at: new Date(updatedAt).toISOString(),
    anomalies: series[0]?.anomalies ?? [],
    kpis: series[0]?.kpis,
    series,
    comparison: {
      territories: series.length,
      produit,
      period,
      from: windowStart,
      to: toDate ?? null,
    },
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

export { generateSyntheticSeries, detectAnomalies };
