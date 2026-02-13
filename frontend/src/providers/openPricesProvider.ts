import { normalizeTerritoryCode } from '../services/priceSearch/normalizeTerritoryCode';
import type {
  PriceObservation,
  PriceSearchInput,
  PriceSourceId,
  TerritoryCode,
} from '../services/priceSearch/price.types';
import { normalizePriceObservation } from './normalize';
import type { PriceProvider, ProviderResult } from './types';

const REQUEST_TIMEOUT_MS = 5000;
const OPEN_PRICES_SOURCE: PriceSourceId = 'open_prices';

const parseFlag = (value: string | boolean | undefined, fallback: boolean): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value !== 'string') return fallback;
  return ['1', 'true', 'on', 'yes'].includes(value.toLowerCase());
};

const env = (import.meta as ImportMeta & { env?: Record<string, string | boolean | undefined> }).env ?? {};

function readEnv(name: string): string | boolean | undefined {
  const fromVite = env[name];
  if (fromVite !== undefined) return fromVite;
  const runtime = globalThis as typeof globalThis & { process?: { env?: Record<string, string | undefined> } };
  if (runtime.process?.env) {
    return runtime.process.env[name];
  }
  return undefined;
}

function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value.replace(',', '.').trim());
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function toStringOrUndefined(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function parseUnit(value: unknown): PriceObservation['unit'] {
  if (value === 'kg' || value === 'l' || value === 'unit') return value;
  return 'unit';
}

function parseObservation(raw: unknown, input: PriceSearchInput): PriceObservation | null {
  if (!raw || typeof raw !== 'object') return null;
  const item = raw as Record<string, unknown>;

  const priceCandidate = toNumber(item.price ?? item.amount ?? item.value);
  if (priceCandidate === null || priceCandidate <= 0) return null;

  const territory = toStringOrUndefined(item.territory ?? item.territoryCode);
  const normalizedTerritory = territory ? normalizeTerritoryCode(territory) : input.territory;

  return normalizePriceObservation({
    source: OPEN_PRICES_SOURCE,
    productName: toStringOrUndefined(item.productName ?? item.product_name ?? item.name),
    brand: toStringOrUndefined(item.brand),
    barcode: toStringOrUndefined(item.barcode ?? item.ean),
    price: priceCandidate,
    currency: 'EUR',
    unit: parseUnit(item.unit),
    observedAt: toStringOrUndefined(item.observedAt ?? item.observed_at ?? item.timestamp),
    territory: normalizedTerritory,
    metadata: {
      endpoint: 'open_prices_live',
      store: toStringOrUndefined(item.storeName ?? item.store ?? item.seller) ?? 'unknown',
    },
  });
}

function pickItems(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];

  const data = payload as Record<string, unknown>;
  const candidates = [data.items, data.results, data.data, data.prices];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
  }
  return [];
}

function buildUrl(input: PriceSearchInput, endpoint: string): string {
  const url = new URL(endpoint);
  if (input.barcode) {
    url.searchParams.set('ean', input.barcode.trim());
  }
  if (input.query) {
    url.searchParams.set('q', input.query.trim());
  }
  if (input.territory) {
    url.searchParams.set('territory', input.territory);
  }
  return url.toString();
}

function filterByTerritory(observations: PriceObservation[], territory: TerritoryCode): PriceObservation[] {
  return observations.filter((obs) => {
    if (!obs.territory) return true;
    return normalizeTerritoryCode(obs.territory) === territory;
  });
}

async function withTimeoutFetch(url: string, signal: AbortSignal) {
  const controller = new globalThis.AbortController();
  const timeoutId = globalThis.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  const relayAbort = () => controller.abort();
  signal.addEventListener('abort', relayAbort);

  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });
  } finally {
    signal.removeEventListener('abort', relayAbort);
    globalThis.clearTimeout(timeoutId);
  }
}

export const openPricesProvider: PriceProvider = {
  source: OPEN_PRICES_SOURCE,
  isEnabled: () => parseFlag(readEnv('VITE_PRICE_PROVIDER_OPEN_PRICES'), false),
  async search(input, signal): Promise<ProviderResult> {
    const endpoint = typeof readEnv('VITE_PRICE_PROVIDER_OPEN_PRICES_ENDPOINT') === 'string'
      ? String(readEnv('VITE_PRICE_PROVIDER_OPEN_PRICES_ENDPOINT')).trim()
      : '';

    if (!endpoint) {
      return {
        source: OPEN_PRICES_SOURCE,
        status: 'UNAVAILABLE',
        observations: [],
        warnings: ['open_prices live non configuré: définir VITE_PRICE_PROVIDER_OPEN_PRICES_ENDPOINT.'],
      };
    }

    const territory = normalizeTerritoryCode(input.territory ?? 'fr');

    try {
      const response = await withTimeoutFetch(buildUrl(input, endpoint), signal);
      if (!response.ok) {
        return {
          source: OPEN_PRICES_SOURCE,
          status: 'UNAVAILABLE',
          observations: [],
          warnings: [`open_prices live HTTP ${response.status}.`],
        };
      }

      const body = (await response.json()) as unknown;
      const items = pickItems(body);
      const parsed = items
        .map((item) => parseObservation(item, input))
        .filter((item): item is PriceObservation => item !== null);

      if (parsed.length === 0) {
        return {
          source: OPEN_PRICES_SOURCE,
          status: 'NO_DATA',
          observations: [],
          warnings: ['open_prices live: aucune observation exploitable dans la réponse.'],
        };
      }

      const territoryScoped = filterByTerritory(parsed, territory);
      if (territoryScoped.length === 0) {
        return {
          source: OPEN_PRICES_SOURCE,
          status: 'PARTIAL',
          observations: [],
          warnings: ['open_prices live: données reçues hors territoire demandé.'],
        };
      }

      return {
        source: OPEN_PRICES_SOURCE,
        status: 'OK',
        observations: territoryScoped,
        warnings: territoryScoped.length < parsed.length
          ? ['open_prices live: observations hors territoire ignorées.']
          : [],
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return {
          source: OPEN_PRICES_SOURCE,
          status: 'UNAVAILABLE',
          observations: [],
          warnings: ['open_prices live timeout/abort (>5s).'],
        };
      }
      return {
        source: OPEN_PRICES_SOURCE,
        status: 'UNAVAILABLE',
        observations: [],
        warnings: ['open_prices live indisponible (erreur réseau ou parsing).'],
      };
    }
  },
};
