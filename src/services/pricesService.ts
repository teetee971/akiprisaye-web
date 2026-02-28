// src/services/pricesService.ts

export type PriceSourceId = 'open_food_facts' | 'open_prices' | 'data_gouv';

export type PriceSearchStatus = 'OK' | 'NO_DATA' | 'UNAVAILABLE' | 'PARTIAL';

export type TerritoryCode =
  | 'fr'
  | 'gp'
  | 'mq'
  | 'gf'
  | 're'
  | 'yt'
  | 'pm'
  | 'bl'
  | 'mf';

export interface PriceObservation {
  source: PriceSourceId;
  productName?: string;
  brand?: string;
  barcode?: string;
  price: number;
  currency: 'EUR';
  unit?: 'unit' | 'kg' | 'l';
  observedAt?: string; // ISO
  territory?: TerritoryCode;
  metadata?: Record<string, string>;
}

export interface NormalizedPriceObservation extends PriceObservation {
  pricePerUnit?: number;
  normalizedLabel: string;
}

export interface PriceSearchInput {
  barcode?: string;
  query?: string;
  brand?: string;
  category?: string;
  territory?: TerritoryCode;
  limit?: number;
}

export interface PriceInterval {
  min: number | null;
  median: number | null;
  max?: number | null;
}

type ApiResponse = {
  status: PriceSearchStatus;
  observations?: PriceObservation[];
  meta?: Record<string, unknown>;
};

// --- Config
const API_PATH = '/api/prices/search';
const CACHE_KEY_PREFIX = 'prices:v1:';
const DEFAULT_TTL_MS = 15 * 60_000; // 15 min
const DEFAULT_TIMEOUT_MS = 8_000; // 8s

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.fetch === 'function';
}

function safeJsonParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function getStorage(): Storage | null {
  // Vitest/jsdom: tu as un stub localStorage => OK
  // Node pur: pas de storage
  const ls = (globalThis as any)?.localStorage as Storage | undefined;
  if (!ls) return null;
  // Certains polyfills cassés => on valide au minimum setItem/getItem
  if (typeof ls.getItem !== 'function' || typeof ls.setItem !== 'function') return null;
  return ls;
}

function stableStringify(obj: unknown): string {
  // stringify stable (ordre des clés) pour clé de cache
  const seen = new WeakSet();
  const stringify = (v: any): any => {
    if (v === null || typeof v !== 'object') return v;
    if (seen.has(v)) return '[Circular]';
    seen.add(v);
    if (Array.isArray(v)) return v.map(stringify);
    const keys = Object.keys(v).sort();
    const out: Record<string, any> = {};
    for (const k of keys) out[k] = stringify(v[k]);
    return out;
  };
  return JSON.stringify(stringify(obj));
}

function buildQueryParams(input: PriceSearchInput): string {
  const p = new URLSearchParams();
  if (input.barcode) p.set('barcode', input.barcode);
  if (input.query) p.set('q', input.query);
  if (input.brand) p.set('brand', input.brand);
  if (input.category) p.set('category', input.category);
  if (input.territory) p.set('territory', input.territory);
  if (typeof input.limit === 'number') p.set('limit', String(input.limit));
  const qs = p.toString();
  return qs ? `?${qs}` : '';
}

function cacheKey(input: PriceSearchInput): string {
  // On n’inclut pas ttl/timeout etc. seulement la requête fonctionnelle.
  const normalized = {
    barcode: input.barcode ?? undefined,
    query: input.query ?? undefined,
    brand: input.brand ?? undefined,
    category: input.category ?? undefined,
    territory: input.territory ?? undefined,
    limit: typeof input.limit === 'number' ? input.limit : undefined,
  };
  return `${CACHE_KEY_PREFIX}${stableStringify(normalized)}`;
}

type CacheEnvelope = {
  v: 1;
  savedAt: number;
  ttlMs: number;
  payload: {
    status: PriceSearchStatus;
    observations: PriceObservation[];
  };
};

function readCache(key: string): CacheEnvelope | null {
  const ls = getStorage();
  if (!ls) return null;
  const env = safeJsonParse<CacheEnvelope>(ls.getItem(key));
  if (!env || env.v !== 1) return null;
  const age = Date.now() - env.savedAt;
  if (age > env.ttlMs) return null;
  return env;
}

function writeCache(key: string, value: CacheEnvelope): void {
  const ls = getStorage();
  if (!ls) return;
  try {
    ls.setItem(key, JSON.stringify(value));
  } catch {
    // quota / storage interdit => ignore
  }
}

function clearCacheByPrefix(prefix = CACHE_KEY_PREFIX): void {
  const ls = getStorage();
  if (!ls) return;
  try {
    const keys: string[] = [];
    for (let i = 0; i < ls.length; i++) {
      const k = ls.key(i);
      if (k && k.startsWith(prefix)) keys.push(k);
    }
    for (const k of keys) ls.removeItem(k);
  } catch {
    // ignore
  }
}

function median(values: number[]): number | null {
  if (!values.length) return null;
  const a = [...values].sort((x, y) => x - y);
  const mid = Math.floor(a.length / 2);
  return a.length % 2 ? a[mid] : (a[mid - 1] + a[mid]) / 2;
}

export function computePriceInterval(obs: NormalizedPriceObservation[]): PriceInterval {
  const prices = obs.map((o) => o.price).filter((n) => Number.isFinite(n));
  if (!prices.length) return { min: null, median: null, max: null };
  const minV = Math.min(...prices);
  const maxV = Math.max(...prices);
  return { min: minV, median: median(prices), max: maxV };
}

export function normalizePriceObservation(o: PriceObservation): NormalizedPriceObservation {
  const unit = o.unit ?? 'unit';

  let normalizedLabel = '€/unité';
  if (unit === 'kg') normalizedLabel = '€/kg';
  if (unit === 'l') normalizedLabel = '€/L';

  // pricePerUnit: ici on ne peut le calculer que si metadata contient une quantité exploitable.
  // Si tu ajoutes plus tard "quantity" dans l'observation, adapte ici.
  let pricePerUnit: number | undefined = undefined;
  const qtyRaw = o.metadata?.quantity ?? o.metadata?.qty;
  const qty = qtyRaw ? Number(String(qtyRaw).replace(',', '.')) : NaN;
  if (Number.isFinite(qty) && qty > 0) {
    // si prix est pour qty en unité (kg/L/unité), alors prix / qty => €/unité de base
    pricePerUnit = o.price / qty;
  }

  return {
    ...o,
    unit,
    normalizedLabel,
    pricePerUnit,
  };
}

function normalizeList(list: PriceObservation[]): NormalizedPriceObservation[] {
  const normalized = list.map(normalizePriceObservation);

  // tri simple: date desc, puis source
  const sourceRank: Record<PriceSourceId, number> = {
    data_gouv: 0,
    open_prices: 1,
    open_food_facts: 2,
  };

  normalized.sort((a, b) => {
    const da = a.observedAt ? Date.parse(a.observedAt) : 0;
    const db = b.observedAt ? Date.parse(b.observedAt) : 0;
    if (db !== da) return db - da;
    return (sourceRank[a.source] ?? 99) - (sourceRank[b.source] ?? 99);
  });

  return normalized;
}

async function fetchJsonWithTimeout(url: string, timeoutMs: number): Promise<ApiResponse> {
  // si window.fetch n'existe pas, on échoue proprement
  const f = (globalThis as any).fetch as typeof fetch | undefined;
  if (typeof f !== 'function') throw new Error('fetch_unavailable');

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await f(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });

    // 204 / 404 => NO_DATA
    if (res.status === 204 || res.status === 404) {
      return { status: 'NO_DATA', observations: [] };
    }

    const text = await res.text();
    const data = safeJsonParse<ApiResponse>(text);

    if (!res.ok) {
      // si serveur renvoie quand même un JSON, on peut l’utiliser
      if (data && data.status) return data;
      return { status: 'UNAVAILABLE', observations: [] };
    }

    if (!data || !data.status) {
      // contrat cassé
      return { status: 'UNAVAILABLE', observations: [] };
    }

    return data;
  } finally {
    clearTimeout(t);
  }
}

export async function searchPrices(
  input: PriceSearchInput,
  opts?: { ttlMs?: number; timeoutMs?: number; bypassCache?: boolean }
): Promise<{ status: PriceSearchStatus; observations: NormalizedPriceObservation[] }> {
  const ttlMs = opts?.ttlMs ?? DEFAULT_TTL_MS;
  const timeoutMs = opts?.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  const key = cacheKey(input);

  if (!opts?.bypassCache) {
    const cached = readCache(key);
    if (cached) {
      return {
        status: cached.payload.status,
        observations: normalizeList(cached.payload.observations),
      };
    }
  }

  // URL relative => OK sur Pages/CF
  const url = `${API_PATH}${buildQueryParams(input)}`;

  try {
    const data = await fetchJsonWithTimeout(url, timeoutMs);
    const list = Array.isArray(data.observations) ? data.observations : [];

    const status: PriceSearchStatus =
      list.length === 0
        ? data.status === 'OK'
          ? 'NO_DATA'
          : data.status
        : data.status;

    // cache seulement si on a un résultat déterministe (OK/PARTIAL/NO_DATA)
    if (status !== 'UNAVAILABLE') {
      writeCache(key, {
        v: 1,
        savedAt: Date.now(),
        ttlMs,
        payload: {
          status,
          observations: list,
        },
      });
    }

    return {
      status,
      observations: normalizeList(list),
    };
  } catch {
    // réseau / timeout / fetch absent
    return { status: 'UNAVAILABLE', observations: [] };
  }
}

// --- Helpers tests / debug
export function __test_resetPricesCache(): void {
  clearCacheByPrefix(CACHE_KEY_PREFIX);
}

export function __test_buildQueryParams(input: PriceSearchInput): string {
  return buildQueryParams(input);
}

export function __test_cacheKey(input: PriceSearchInput): string {
  return cacheKey(input);
}