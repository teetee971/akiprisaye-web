import type { PriceObservation, PriceSearchInput, PriceSourceId } from './price.types';

export interface PriceProviderResult {
  observations: PriceObservation[];
  warnings: string[];
  provider: PriceSourceId;
  productName?: string;
}

export interface PriceProvider {
  id: PriceSourceId;
  label: string;
  enabled: boolean;
  search: (input: PriceSearchInput, signal: AbortSignal) => Promise<PriceProviderResult>;
}

const OPEN_FOOD_FACTS_ENDPOINT = 'https://world.openfoodfacts.org';
const OPEN_PRICES_ENDPOINT = 'https://prices.openfoodfacts.org/api/v1';

async function fetchJson<T>(url: string, signal: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`Request failed (${response.status})`);
  }
  return (await response.json()) as T;
}

const openFoodFactsProvider: PriceProvider = {
  id: 'open_food_facts',
  label: 'Open Food Facts',
  enabled: true,
  async search(input, signal) {
    const warnings: string[] = [];
    if (!input.barcode && !input.query) {
      return { observations: [], warnings, provider: 'open_food_facts' };
    }

    try {
      if (input.barcode) {
        const url = `${OPEN_FOOD_FACTS_ENDPOINT}/api/v2/product/${encodeURIComponent(input.barcode)}.json`;
        const data = await fetchJson<{ product?: { product_name?: string; brands?: string } }>(
          url,
          signal
        );
        return {
          observations: [],
          warnings,
          provider: 'open_food_facts',
          productName: data.product?.product_name,
        };
      }

      const query = encodeURIComponent(input.query ?? '');
      const url = `${OPEN_FOOD_FACTS_ENDPOINT}/cgi/search.pl?search_terms=${query}&search_simple=1&action=process&json=1&page_size=1`;
      const data = await fetchJson<{ products?: { product_name?: string }[] }>(url, signal);
      return {
        observations: [],
        warnings,
        provider: 'open_food_facts',
        productName: data.products?.[0]?.product_name,
      };
    } catch (error) {
      warnings.push('Open Food Facts indisponible pour le moment.');
      return { observations: [], warnings, provider: 'open_food_facts' };
    }
  },
};

const openPricesProvider: PriceProvider = {
  id: 'open_prices',
  label: 'Open Prices',
  enabled: true,
  async search(input, signal) {
    const warnings: string[] = [];
    if (!input.barcode && !input.query) {
      return { observations: [], warnings, provider: 'open_prices' };
    }

    try {
      const params = new URLSearchParams();
      if (input.barcode) params.set('code', input.barcode);
      if (input.query) params.set('q', input.query);
      const url = `${OPEN_PRICES_ENDPOINT}/prices?${params.toString()}`;
      const data = await fetchJson<{
        items?: Array<{
          price: number;
          currency?: string;
          unit?: string;
          product_name?: string;
          observed_at?: string;
        }>;
      }>(url, signal);

      const observations: PriceObservation[] =
        data.items?.map((item) => ({
          source: 'open_prices',
          productName: item.product_name,
          price: item.price,
          currency: 'EUR',
          unit: item.unit === 'kg' || item.unit === 'l' ? item.unit : 'unit',
          observedAt: item.observed_at,
        })) ?? [];

      if (observations.length === 0) {
        warnings.push('Aucun prix Open Prices trouvé pour cette requête.');
      }

      return { observations, warnings, provider: 'open_prices' };
    } catch (error) {
      warnings.push('Open Prices indisponible pour le moment.');
      return { observations: [], warnings, provider: 'open_prices' };
    }
  },
};

const dataGouvProvider: PriceProvider = {
  id: 'data_gouv',
  label: 'Data.gouv.fr',
  enabled: false,
  async search() {
    return {
      observations: [],
      warnings: ['Data.gouv.fr désactivé (feature flag).'],
      provider: 'data_gouv',
    };
  },
};

export const PRICE_PROVIDERS: PriceProvider[] = [
  openFoodFactsProvider,
  openPricesProvider,
  dataGouvProvider,
];
