 
 
import { buildRealtimeFallback } from '../utils/realtimeFallbackProxy';

export type RealtimePriceState = 'live' | 'cached' | 'offline';

export type RealtimePrice = {
  productId: string;
  productLabel: string;
  territory: string;
  price: number;
  currency: string;
  source: string;
  observedAt: string | null;
};

export type RealtimePriceResult = {
  state: RealtimePriceState;
  updatedAt: string | null;
  items: RealtimePrice[];
  cache: string | null;
  source: string;
  message?: string;
};

const API_URL = '/api/prices/realtime';
const FALLBACK_URL = `${import.meta.env.BASE_URL}data/prices.json`;
const DEFAULT_TIMEOUT_MS = 6000;
const MIN_TIMEOUT_MS = 2000;

function isValidPrice(item: any): item is RealtimePrice {
  return (
    item &&
    typeof item.productId === 'string' &&
    typeof item.productLabel === 'string' &&
    typeof item.territory === 'string' &&
    typeof item.price === 'number' &&
    Number.isFinite(item.price) &&
    typeof item.currency === 'string' &&
    typeof item.source === 'string' &&
    (typeof item.observedAt === 'string' || item.observedAt === null)
  );
}

function parseItems(payload: any): RealtimePrice[] {
  if (!Array.isArray(payload)) return [];
  const items: RealtimePrice[] = [];
  for (const item of payload) {
    const normalized = {
      ...item,
      currency: item?.currency ?? 'EUR',
      observedAt: typeof item?.observedAt === 'string' ? item.observedAt : item?.updated_at ?? null,
    };
    if (isValidPrice(normalized)) {
      items.push(normalized);
    }
  }
  return items;
}

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function loadLocalFallback(): Promise<RealtimePrice[]> {
  try {
    const res = await fetch(FALLBACK_URL, { headers: { Accept: 'application/json' } });
    if (res.ok) {
      const json = await res.json();
      const parsed = parseItems(json);
      if (parsed.length > 0) {
        return parsed;
      }
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('Fallback local indisponible, utilisation des données embarquées', error);
    }
  }
  return buildRealtimeFallback();
}

export async function getRealtimePrices(options?: { timeoutMs?: number }): Promise<RealtimePriceResult> {
  const timeoutMs = Math.max(MIN_TIMEOUT_MS, options?.timeoutMs ?? DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetchWithTimeout(API_URL, timeoutMs);
    if (!response.ok) {
      throw new Error(`Statut inattendu: ${response.status}`);
    }

    const json = await response.json();
    const items = parseItems(json?.items);
    if (!items.length) {
      throw new Error('Payload vide ou invalide');
    }

    const state: RealtimePriceState =
      json?.state === 'cached' || json?.state === 'offline'
        ? json.state
        : 'live';

    const updatedAt =
      typeof json?.updated_at === 'string' ? json.updated_at : items[0]?.observedAt ?? null;

    return {
      state,
      updatedAt,
      items,
      cache: typeof json?.cache === 'string' ? json.cache : null,
      source: typeof json?.source?.name === 'string' ? json.source.name : 'API /api/prices/realtime',
      message: typeof json?.message === 'string' ? json.message : undefined,
    };
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('API temps réel indisponible, fallback local utilisé', error);
    }
    const items = await loadLocalFallback();
    return {
      state: 'offline',
      updatedAt: items[0]?.observedAt ?? null,
      items,
      cache: 'none',
      source: 'fallback-local',
      message: 'Données locales servies en secours.',
    };
  }
}
