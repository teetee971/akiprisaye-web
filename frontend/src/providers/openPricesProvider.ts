import type { PriceObservation, PriceSearchInput, TerritoryCode } from '../services/priceSearch/price.types';
import { normalizePriceObservation, normalizeText } from './normalize';
import type { PriceProvider, ProviderResult } from './types';

const REQUEST_TIMEOUT_MS = 5000;

const parseFlag = (value: string | boolean | undefined, fallback: boolean): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value !== 'string') return fallback;
  return ['1', 'true', 'on', 'yes'].includes(value.toLowerCase());
};

const TERRITORY_LABEL_BY_CODE: Record<TerritoryCode, string> = {
  fr: 'france',
  gp: 'guadeloupe',
  mq: 'martinique',
  gf: 'guyane',
  re: 'la reunion',
  yt: 'mayotte',
  pm: 'saint-pierre-et-miquelon',
  bl: 'saint-barthelemy',
  mf: 'saint-martin',
  wf: 'wallis-et-futuna',
  pf: 'polynesie francaise',
  nc: 'nouvelle-caledonie',
  tf: 'terres australes et antarctiques francaises',
};

type OpenPricesItem = {
  price?: unknown;
  amount?: unknown;
  currency?: unknown;
  product_name?: unknown;
  productName?: unknown;
  brand?: unknown;
  code?: unknown;
  barcode?: unknown;
  unit?: unknown;
  observed_at?: unknown;
  observedAt?: unknown;
  territory?: unknown;
  location?: {
    territory?: unknown;
    country?: unknown;
  } | null;
};

type OpenPricesPayload = {
  items?: unknown;
  results?: unknown;
  data?: unknown;
};

const safeString = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;

const safeNumber = (value: unknown): number | null => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const deriveTerritoryLabel = (item: OpenPricesItem): string | undefined => {
  return (
    safeString(item.territory) ??
    safeString(item.location?.territory) ??
    safeString(item.location?.country)
  );
};

const territoryMatches = (label: string | undefined, expectedTerritory?: TerritoryCode): boolean => {
  if (!expectedTerritory) return true;
  const expectedLabel = TERRITORY_LABEL_BY_CODE[expectedTerritory];
  if (!expectedLabel || !label) return false;
  return normalizeText(label).includes(normalizeText(expectedLabel));
};

const withTimeoutSignal = (signal: AbortSignal): AbortSignal => {
  const timeoutController = new globalThis.AbortController();
  const timeoutId = setTimeout(() => timeoutController.abort(), REQUEST_TIMEOUT_MS);

  signal.addEventListener('abort', () => timeoutController.abort(), { once: true });
  timeoutController.signal.addEventListener(
    'abort',
    () => {
      clearTimeout(timeoutId);
    },
    { once: true }
  );

  return timeoutController.signal;
};

const toItemsArray = (payload: OpenPricesPayload): OpenPricesItem[] => {
  if (Array.isArray(payload.items)) return payload.items as OpenPricesItem[];
  if (Array.isArray(payload.results)) return payload.results as OpenPricesItem[];
  if (Array.isArray(payload.data)) return payload.data as OpenPricesItem[];
  return [];
};

const buildObservations = (items: OpenPricesItem[], input: PriceSearchInput): PriceObservation[] =>
  items
    .map((item) => {
      const price = safeNumber(item.price ?? item.amount);
      if (price === null || price <= 0) return null;

      const territoryLabel = deriveTerritoryLabel(item);
      if (!territoryMatches(territoryLabel, input.territory)) return null;

      const currency = safeString(item.currency)?.toUpperCase();
      if (currency && currency !== 'EUR') return null;

      const unit = safeString(item.unit);

      return normalizePriceObservation({
        source: 'open_prices',
        productName: safeString(item.product_name) ?? safeString(item.productName),
        brand: safeString(item.brand),
        barcode: safeString(item.code) ?? safeString(item.barcode),
        price,
        currency: 'EUR',
        unit: unit === 'kg' || unit === 'l' ? unit : 'unit',
        observedAt: safeString(item.observed_at) ?? safeString(item.observedAt),
        territory: input.territory,
      });
    })
    .filter((observation): observation is PriceObservation => Boolean(observation));

export const openPricesProvider: PriceProvider = {
  source: 'open_prices',
  isEnabled: () => parseFlag(import.meta.env.VITE_PRICE_PROVIDER_OPEN_PRICES, false),
  async search(input, signal): Promise<ProviderResult> {
    if (!input.barcode && !input.query) {
      return { source: 'open_prices', status: 'NO_DATA', observations: [], warnings: [] };
    }

    const endpoint = safeString(import.meta.env.VITE_PRICE_PROVIDER_OPEN_PRICES_ENDPOINT);
    if (!endpoint) {
      return {
        source: 'open_prices',
        status: 'UNAVAILABLE',
        observations: [],
        warnings: ['open_prices indisponible: VITE_PRICE_PROVIDER_OPEN_PRICES_ENDPOINT non configuré.'],
      };
    }

    const params = new URLSearchParams();
    if (input.barcode) params.set('code', input.barcode);
    if (input.query) params.set('q', normalizeText(input.query));
    const url = `${endpoint.replace(/\/$/, '')}/prices?${params.toString()}`;

    try {
      const response = await fetch(url, { signal: withTimeoutSignal(signal) });
      if (!response.ok) {
        return { source: 'open_prices', status: 'UNAVAILABLE', observations: [], warnings: [] };
      }

      const payload = (await response.json()) as OpenPricesPayload;
      const items = toItemsArray(payload);
      const observations = buildObservations(items, input);
      const warnings: string[] = [];

      if (input.territory && items.length > 0) {
        const hasTerritoryData = items.some((item) => Boolean(deriveTerritoryLabel(item)));
        if (!hasTerritoryData) {
          warnings.push('open_prices: territoire demandé mais non exposé par la réponse API.');
        }
      }

      return {
        source: 'open_prices',
        status: observations.length > 0 ? 'OK' : 'NO_DATA',
        observations,
        warnings,
      };
    } catch {
      return { source: 'open_prices', status: 'UNAVAILABLE', observations: [], warnings: [] };
    }
  },
};
