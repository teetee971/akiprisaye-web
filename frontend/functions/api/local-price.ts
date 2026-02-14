const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json; charset=utf-8',
};

type FirestoreValue =
  | { stringValue: string }
  | { integerValue: string }
  | { doubleValue: number }
  | { booleanValue: boolean }
  | { timestampValue: string }
  | { mapValue: { fields?: Record<string, FirestoreValue> } }
  | { arrayValue: { values?: FirestoreValue[] } }
  | { nullValue: null };

const OFF_BASE = 'https://world.openfoodfacts.org';

const asNumber = (value: unknown): number | null => {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const toFsValue = (value: unknown): FirestoreValue => {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === 'string') return { stringValue: value };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (typeof value === 'number') {
    if (Number.isInteger(value)) return { integerValue: String(value) };
    return { doubleValue: value };
  }
  if (Array.isArray(value)) {
    return { arrayValue: { values: value.map((item) => toFsValue(item)) } };
  }

  const fields: Record<string, FirestoreValue> = {};
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    fields[key] = toFsValue(item);
  }
  return { mapValue: { fields } };
};

const fromFsValue = (value: FirestoreValue): unknown => {
  if ('stringValue' in value) return value.stringValue;
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return value.doubleValue;
  if ('booleanValue' in value) return value.booleanValue;
  if ('timestampValue' in value) return value.timestampValue;
  if ('nullValue' in value) return null;
  if ('arrayValue' in value) return (value.arrayValue.values ?? []).map((entry) => fromFsValue(entry));
  if ('mapValue' in value) {
    const mapped: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value.mapValue.fields ?? {})) {
      mapped[key] = fromFsValue(item);
    }
    return mapped;
  }
  return null;
};

const fromDoc = (doc: { fields?: Record<string, FirestoreValue> } | null | undefined): Record<string, unknown> | null => {
  if (!doc?.fields) return null;
  const mapped: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(doc.fields)) {
    mapped[key] = fromFsValue(value);
  }
  return mapped;
};

const median = (values: number[]) => {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) return (sorted[mid - 1] + sorted[mid]) / 2;
  return sorted[mid];
};

const withKey = (url: string, apiKey?: string) => {
  if (!apiKey) return url;
  return `${url}${url.includes('?') ? '&' : '?'}key=${encodeURIComponent(apiKey)}`;
};

const fetchProductFromOFF = async (barcode: string) => {
  try {
    const res = await fetch(`${OFF_BASE}/api/v2/product/${encodeURIComponent(barcode)}.json`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;

    const payload = (await res.json()) as { status?: number; product?: Record<string, unknown> };
    if (payload.status !== 1 || !payload.product) return null;

    const p = payload.product;
    return {
      barcode,
      name: (p.product_name_fr as string) || (p.product_name as string) || '',
      brand: (p.brands as string) || '',
      imageUrl: (p.image_front_url as string) || (p.image_url as string) || '',
      quantity: (p.quantity as string) || '',
      categories: Array.isArray(p.categories_tags) ? p.categories_tags : [],
      updatedAt: Date.now(),
    };
  } catch (_error) {
    return null;
  }
};

const fetchDoc = async (
  base: string,
  path: string,
  headers: Headers,
  apiKey?: string,
): Promise<Record<string, unknown> | null> => {
  const res = await fetch(withKey(`${base}/${path}`, apiKey), { headers });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`firestore_read_failed:${res.status}`);
  const payload = (await res.json()) as { fields?: Record<string, FirestoreValue> };
  return fromDoc(payload);
};

const patchDoc = async (
  base: string,
  path: string,
  data: Record<string, unknown>,
  headers: Headers,
  apiKey?: string,
): Promise<void> => {
  const bodyFields: Record<string, FirestoreValue> = {};
  for (const [k, v] of Object.entries(data)) bodyFields[k] = toFsValue(v);

  const res = await fetch(withKey(`${base}/${path}`, apiKey), {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ fields: bodyFields }),
  });

  if (!res.ok) {
    throw new Error(`firestore_patch_failed:${res.status}`);
  }
};

const fetchTimeseries = async (
  base: string,
  barcode: string,
  territory: string,
  days: number,
  headers: Headers,
  apiKey?: string,
) => {
  const sinceDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const collectionPath = `price_timeseries/${encodeURIComponent(barcode)}/territories/${encodeURIComponent(territory)}/days`;
  const url = withKey(`${base}/${collectionPath}?pageSize=120&orderBy=date`, apiKey);
  const res = await fetch(url, { headers });

  if (!res.ok) return [];

  const payload = (await res.json()) as { documents?: Array<{ fields?: Record<string, FirestoreValue> }> };
  return (payload.documents ?? [])
    .map((doc) => fromDoc(doc))
    .filter((doc): doc is Record<string, unknown> => Boolean(doc))
    .filter((doc) => String(doc.date ?? '') >= sinceDate)
    .map((doc) => ({
      date: String(doc.date ?? ''),
      median: asNumber(doc.median),
      min: asNumber(doc.min),
      max: asNumber(doc.max),
      sampleCount: asNumber(doc.sampleCount) ?? 0,
    }));
};

const computeAggregateFromObservations = async (
  base: string,
  barcode: string,
  territory: string,
  days: number,
  headers: Headers,
  apiKey?: string,
) => {
  const since = Date.now() - days * 24 * 60 * 60 * 1000;
  const res = await fetch(withKey(`${base}:runQuery`, apiKey), {
    method: 'POST',
    headers,
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: 'price_observations' }],
        where: {
          compositeFilter: {
            op: 'AND',
            filters: [
              { fieldFilter: { field: { fieldPath: 'barcode' }, op: 'EQUAL', value: { stringValue: barcode } } },
              { fieldFilter: { field: { fieldPath: 'territory' }, op: 'EQUAL', value: { stringValue: territory } } },
              { fieldFilter: { field: { fieldPath: 'observedAt' }, op: 'GREATER_THAN_OR_EQUAL', value: { integerValue: String(since) } } },
            ],
          },
        },
        orderBy: [{ field: { fieldPath: 'observedAt' }, direction: 'DESCENDING' }],
        limit: 250,
      },
    }),
  });

  if (!res.ok) return null;

  const rows = (await res.json()) as Array<{ document?: { fields?: Record<string, FirestoreValue> } }>;
  const docs = rows
    .map((row) => fromDoc(row.document))
    .filter((doc): doc is Record<string, unknown> => Boolean(doc))
    .filter((doc) => ['user', 'partner'].includes(String(doc.source ?? 'user')));

  const prices = docs.map((doc) => asNumber(doc.price)).filter((n): n is number => n !== null);
  if (!prices.length) {
    return {
      min: null,
      median: null,
      max: null,
      sampleCount: 0,
      lastObservedAt: null,
      updatedAt: Date.now(),
    };
  }

  const observed = docs.map((doc) => asNumber(doc.observedAt) ?? 0);
  return {
    min: Math.min(...prices),
    median: median(prices),
    max: Math.max(...prices),
    sampleCount: prices.length,
    lastObservedAt: Math.max(...observed),
    updatedAt: Date.now(),
  };
};

export const onRequestOptions: PagesFunction = async () => new Response(null, { status: 204, headers: corsHeaders });

export const onRequestGet: PagesFunction = async ({ request, env }) => {
  const url = new URL(request.url);
  const barcode = (url.searchParams.get('barcode') ?? '').trim();
  const territory = (url.searchParams.get('territory') ?? 'fr').trim().toLowerCase();
  const days = Math.min(90, Math.max(7, Number(url.searchParams.get('days') ?? '30')));

  if (!barcode) {
    return new Response(JSON.stringify({ ok: false, error: 'missing_barcode' }), {
      status: 400,
      headers: corsHeaders,
    });
  }

  const envObj = env as Record<string, string | undefined>;
  const projectId = envObj.FIREBASE_PROJECT_ID;
  const apiKey = envObj.FIREBASE_API_KEY;

  const headers = new Headers({ 'Content-Type': 'application/json' });
  const auth = request.headers.get('Authorization');
  if (auth) headers.set('Authorization', auth);

  const fallbackProduct = await fetchProductFromOFF(barcode);

  if (!projectId) {
    return new Response(
      JSON.stringify({
        ok: true,
        product: fallbackProduct,
        aggregate: null,
        timeseries: [],
        warning: 'firestore_unconfigured',
      }),
      { status: 200, headers: corsHeaders },
    );
  }

  const base = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;

  try {
    let product = await fetchDoc(base, `products/${encodeURIComponent(barcode)}`, headers, apiKey);

    if (!product && fallbackProduct) {
      await patchDoc(base, `products/${encodeURIComponent(barcode)}`, fallbackProduct, headers, apiKey);
      product = fallbackProduct;
    }

    const aggregateDoc = await fetchDoc(
      base,
      `price_aggregates/${encodeURIComponent(barcode)}/territories/${encodeURIComponent(territory)}`,
      headers,
      apiKey,
    );

    const aggregate = aggregateDoc ?? (await computeAggregateFromObservations(base, barcode, territory, days, headers, apiKey));
    const timeseries = await fetchTimeseries(base, barcode, territory, days, headers, apiKey);

    return new Response(JSON.stringify({ ok: true, product: product ?? fallbackProduct, aggregate, timeseries }), {
      status: 200,
      headers: { ...corsHeaders, 'Cache-Control': 'public, max-age=120' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        ok: true,
        product: fallbackProduct,
        aggregate: null,
        timeseries: [],
        warning: error instanceof Error ? error.message : String(error),
      }),
      { status: 200, headers: corsHeaders },
    );
  }
};
