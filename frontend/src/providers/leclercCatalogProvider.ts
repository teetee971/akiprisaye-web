import type { PriceObservation, PriceSearchInput, TerritoryCode } from '../services/priceSearch/price.types';
import { normalizePriceObservation } from './normalize';
import type { PriceProvider, ProviderResult } from './types';

const REQUEST_TIMEOUT_MS = 6000;

const parseFlag = (value: string | boolean | undefined, fallback: boolean): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value !== 'string') return fallback;
  return ['1', 'true', 'on', 'yes'].includes(value.toLowerCase());
};

const safeString = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;

const safeNumber = (value: unknown): number | null => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string') {
    const parsed = Number(value.replace(',', '.'));
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }
  return null;
};

type LeclercCatalogItem = {
  source?: unknown;
  productName?: unknown;
  brand?: unknown;
  barcode?: unknown;
  price?: unknown;
  currency?: unknown;
  unit?: unknown;
  observedAt?: unknown;
  territory?: unknown;
  metadata?: Record<string, string>;
};

type LeclercCatalogResponse = {
  status?: string;
  observations?: LeclercCatalogItem[];
  upstream?: { url?: string };
};

const VALID_TERRITORIES: ReadonlySet<TerritoryCode> = new Set<TerritoryCode>([
  'fr', 'gp', 'mq', 'gf', 're', 'yt', 'pm', 'bl', 'mf', 'wf', 'pf', 'nc', 'tf',
]);

const isValidTerritory = (value: unknown): value is TerritoryCode =>
  typeof value === 'string' && VALID_TERRITORIES.has(value as TerritoryCode);

const withTimeoutSignal = (signal: AbortSignal, timeoutMs: number): AbortSignal => {
  const controller = new globalThis.AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  signal.addEventListener('abort', () => controller.abort(), { once: true });
  controller.signal.addEventListener('abort', () => clearTimeout(id), { once: true });
  return controller.signal;
};

const mapItem = (
  item: LeclercCatalogItem,
  input: PriceSearchInput,
): PriceObservation | null => {
  const price = safeNumber(item.price);
  if (price === null || price <= 0) return null;

  const rawUnit = safeString(item.unit);
  const unit: PriceObservation['unit'] =
    rawUnit === 'kg' || rawUnit === 'l' ? rawUnit : 'unit';

  const territory = isValidTerritory(item.territory)
    ? item.territory
    : input.territory;

  return normalizePriceObservation({
    source: 'leclerc_catalog',
    productName: safeString(item.productName),
    brand: safeString(item.brand),
    barcode: safeString(item.barcode),
    price,
    currency: 'EUR',
    unit,
    observedAt: safeString(item.observedAt),
    territory,
    metadata: item.metadata,
  });
};

export const leclercCatalogProvider: PriceProvider = {
  source: 'leclerc_catalog',
  isEnabled: () =>
    parseFlag(import.meta.env.VITE_PRICE_PROVIDER_LECLERC_CATALOG, false),

  async search(input: PriceSearchInput, signal: AbortSignal): Promise<ProviderResult> {
    if (!input.barcode && !input.query) {
      return {
        source: 'leclerc_catalog',
        status: 'NO_DATA',
        observations: [],
        warnings: [],
      };
    }

    const params = new URLSearchParams();
    if (input.barcode) params.set('barcode', input.barcode);
    if (input.query) params.set('q', input.query);
    if (input.territory) params.set('territory', input.territory);

    const base = (import.meta.env.VITE_PRICE_API_BASE ?? '').replace(/\/$/, '');
    const url = `${base}/api/leclerc-catalog?${params.toString()}`;

    try {
      const response = await fetch(url, {
        signal: withTimeoutSignal(signal, REQUEST_TIMEOUT_MS),
      });

      if (!response.ok) {
        return {
          source: 'leclerc_catalog',
          status: 'UNAVAILABLE',
          observations: [],
          warnings: ['Catalogue E.Leclerc temporairement indisponible.'],
        };
      }

      const payload = (await response.json()) as LeclercCatalogResponse;

      if (payload.status === 'UNAVAILABLE') {
        return {
          source: 'leclerc_catalog',
          status: 'UNAVAILABLE',
          observations: [],
          warnings: ['Catalogue E.Leclerc indisponible (amont).'],
        };
      }

      const items: LeclercCatalogItem[] = Array.isArray(payload.observations)
        ? payload.observations
        : [];

      const observations = items
        .map((item) => mapItem(item, input))
        .filter((o): o is PriceObservation => o !== null);

      return {
        source: 'leclerc_catalog',
        status: observations.length > 0 ? 'OK' : 'NO_DATA',
        observations,
        warnings:
          observations.length === 0
            ? ['Aucun prix E.Leclerc trouvé pour cette recherche.']
            : [],
      };
    } catch {
      return {
        source: 'leclerc_catalog',
        status: 'UNAVAILABLE',
        observations: [],
        warnings: ['Catalogue E.Leclerc indisponible.'],
      };
    }
  },
};
