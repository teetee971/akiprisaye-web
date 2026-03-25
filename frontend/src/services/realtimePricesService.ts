import { liveApiFetchJson } from './liveApiClient';

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

const API_URL = '/prices/realtime';
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

export async function getRealtimePrices(options?: { timeoutMs?: number }): Promise<RealtimePriceResult> {
  const timeoutMs = Math.max(MIN_TIMEOUT_MS, options?.timeoutMs ?? DEFAULT_TIMEOUT_MS);

  try {
    const json = await liveApiFetchJson<any>(API_URL, {
      incidentReason: 'realtime_prices_api_unavailable',
      timeoutMs,
    });
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
    throw new Error(error instanceof Error ? error.message : 'API temps réel indisponible');
  }
}
