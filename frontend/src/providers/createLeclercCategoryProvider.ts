import type {
  PriceObservation,
  PriceSearchInput,
  PriceSourceId,
  TerritoryCode,
} from '../services/priceSearch/price.types';
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

const VALID_TERRITORIES = new Set<TerritoryCode>([
  'fr',
  'gp',
  'mq',
  'gf',
  're',
  'yt',
  'pm',
  'bl',
  'mf',
  'wf',
  'pf',
  'nc',
  'tf',
]);

const isValidTerritory = (v: unknown): v is TerritoryCode =>
  typeof v === 'string' && VALID_TERRITORIES.has(v as TerritoryCode);

type CatalogItem = {
  productName?: unknown;
  brand?: unknown;
  barcode?: unknown;
  price?: unknown;
  unit?: unknown;
  observedAt?: unknown;
  territory?: unknown;
  metadata?: Record<string, string>;
};

type CatalogResponse = {
  status?: string;
  observations?: CatalogItem[];
};

const withTimeoutSignal = (signal: AbortSignal, ms: number): AbortSignal => {
  const ctrl = new globalThis.AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  signal.addEventListener('abort', () => ctrl.abort(), { once: true });
  ctrl.signal.addEventListener('abort', () => clearTimeout(id), { once: true });
  return ctrl.signal;
};

const mapItem = (
  item: CatalogItem,
  source: PriceSourceId,
  input: PriceSearchInput
): PriceObservation | null => {
  const price = safeNumber(item.price);
  if (price === null || price <= 0) return null;

  const rawUnit = safeString(item.unit);
  const unit: PriceObservation['unit'] = rawUnit === 'kg' || rawUnit === 'l' ? rawUnit : 'unit';

  const territory = isValidTerritory(item.territory) ? item.territory : input.territory;

  return normalizePriceObservation({
    source,
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

export interface LeclercCategoryProviderConfig {
  /** Identifiant canonique de la source (doit figurer dans PriceSourceId) */
  source: PriceSourceId;
  /** Chemin de l'endpoint Cloudflare, ex: "/api/leclerc-jardin" */
  apiEndpoint: string;
  /** Variable d'environnement Vite qui active ce fournisseur */
  envFlag: string;
  /** Message d'avertissement quand le fournisseur est indisponible */
  unavailableMsg: string;
}

/**
 * Fabrique un PriceProvider E.Leclerc pour une catégorie donnée.
 * Toute la logique est partagée ; seul le config diffère par catalogue.
 */
export function createLeclercCategoryProvider(cfg: LeclercCategoryProviderConfig): PriceProvider {
  return {
    source: cfg.source,
    isEnabled: () => parseFlag(import.meta.env[cfg.envFlag], false),

    async search(input: PriceSearchInput, signal: AbortSignal): Promise<ProviderResult> {
      if (!input.barcode && !input.query) {
        return { source: cfg.source, status: 'NO_DATA', observations: [], warnings: [] };
      }

      const params = new URLSearchParams();
      if (input.barcode) params.set('barcode', input.barcode);
      if (input.query) params.set('q', input.query);
      if (input.territory) params.set('territory', input.territory);

      const base = (import.meta.env.VITE_PRICE_API_BASE ?? '').replace(/\/$/, '');
      const url = `${base}${cfg.apiEndpoint}?${params.toString()}`;

      try {
        const response = await fetch(url, {
          signal: withTimeoutSignal(signal, REQUEST_TIMEOUT_MS),
        });

        if (!response.ok) {
          return {
            source: cfg.source,
            status: 'UNAVAILABLE',
            observations: [],
            warnings: [cfg.unavailableMsg],
          };
        }

        const payload = (await response.json()) as CatalogResponse;

        if (payload.status === 'UNAVAILABLE') {
          return {
            source: cfg.source,
            status: 'UNAVAILABLE',
            observations: [],
            warnings: [`${cfg.unavailableMsg} (amont)`],
          };
        }

        const items: CatalogItem[] = Array.isArray(payload.observations)
          ? payload.observations
          : [];

        const observations = items
          .map((item) => mapItem(item, cfg.source, input))
          .filter((o): o is PriceObservation => o !== null);

        return {
          source: cfg.source,
          status: observations.length > 0 ? 'OK' : 'NO_DATA',
          observations,
          warnings:
            observations.length === 0
              ? [`Aucun résultat E.Leclerc (${cfg.source}) pour cette recherche.`]
              : [],
        };
      } catch {
        return {
          source: cfg.source,
          status: 'UNAVAILABLE',
          observations: [],
          warnings: [cfg.unavailableMsg],
        };
      }
    },
  };
}
