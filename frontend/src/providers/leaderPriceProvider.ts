/**
 * Fournisseur de prix pour le catalogue Leader Price.
 *
 * Utilise l'API Leader Price accessible via le proxy Cloudflare /api/leader-price.
 * DOM-TOM : Guadeloupe, Martinique, La Réunion, Guyane.
 * Leader Price est très présent aux Antilles (Guadeloupe, Martinique).
 *
 * Activer via : VITE_PRICE_PROVIDER_LEADER_PRICE=true
 */

import type { PriceObservation, PriceSearchInput } from '../services/priceSearch/price.types';
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
  if (typeof value === 'number') return Number.isFinite(value) && value > 0 ? value : null;
  if (typeof value === 'string') {
    const parsed = Number(value.replace(',', '.'));
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }
  return null;
};

type LeaderPriceCatalogItem = {
  productName?: unknown;
  brand?: unknown;
  barcode?: unknown;
  price?: unknown;
  currency?: unknown;
  unit?: unknown;
  observedAt?: unknown;
  metadata?: Record<string, string>;
};

type LeaderPriceCatalogResponse = {
  status?: string;
  observations?: LeaderPriceCatalogItem[];
};

const withTimeoutSignal = (signal: AbortSignal, timeoutMs: number): AbortSignal => {
  const controller = new globalThis.AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  signal.addEventListener('abort', () => controller.abort(), { once: true });
  controller.signal.addEventListener('abort', () => clearTimeout(id), { once: true });
  return controller.signal;
};

const mapItem = (
  item: LeaderPriceCatalogItem,
  input: PriceSearchInput
): PriceObservation | null => {
  const price = safeNumber(item.price);
  if (price === null || price <= 0) return null;

  const rawUnit = safeString(item.unit);
  const unit: PriceObservation['unit'] = rawUnit === 'kg' || rawUnit === 'l' ? rawUnit : 'unit';

  return normalizePriceObservation({
    source: 'leader_price',
    productName: safeString(item.productName),
    brand: safeString(item.brand),
    barcode: safeString(item.barcode),
    price,
    currency: 'EUR',
    unit,
    observedAt: safeString(item.observedAt),
    territory: input.territory,
    metadata: item.metadata,
  });
};

export const leaderPriceProvider: PriceProvider = {
  source: 'leader_price',
  isEnabled: () => parseFlag(import.meta.env.VITE_PRICE_PROVIDER_LEADER_PRICE, false),

  async search(input: PriceSearchInput, signal: AbortSignal): Promise<ProviderResult> {
    if (!input.barcode && !input.query) {
      return {
        source: 'leader_price',
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
    const url = `${base}/api/leader-price?${params.toString()}`;

    try {
      const response = await fetch(url, {
        signal: withTimeoutSignal(signal, REQUEST_TIMEOUT_MS),
      });

      if (!response.ok) {
        return {
          source: 'leader_price',
          status: 'UNAVAILABLE',
          observations: [],
          warnings: ['Leader Price temporairement indisponible.'],
        };
      }

      const payload = (await response.json()) as LeaderPriceCatalogResponse;

      if (payload.status === 'UNAVAILABLE') {
        return {
          source: 'leader_price',
          status: 'UNAVAILABLE',
          observations: [],
          warnings: ['Leader Price indisponible (amont).'],
        };
      }

      const items: LeaderPriceCatalogItem[] = Array.isArray(payload.observations)
        ? payload.observations
        : [];

      const observations = items
        .map((item) => mapItem(item, input))
        .filter((o): o is PriceObservation => o !== null);

      return {
        source: 'leader_price',
        status: observations.length > 0 ? 'OK' : 'NO_DATA',
        observations,
        warnings:
          observations.length === 0 ? ['Aucun prix Leader Price trouvé pour cette recherche.'] : [],
      };
    } catch {
      return {
        source: 'leader_price',
        status: 'UNAVAILABLE',
        observations: [],
        warnings: ['Leader Price indisponible.'],
      };
    }
  },
};
