import type { PriceSearchInput } from '../services/priceSearch/price.types';
import { normalizeText } from './normalize';
import { openPricesProvider } from './openPricesProvider';
import { seedProvider } from './seedProvider';
import type { PriceProvider, ProviderResult } from './types';

const OPEN_FOOD_FACTS_ENDPOINT = 'https://world.openfoodfacts.org';

const parseFlag = (value: string | boolean | undefined, fallback: boolean): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value !== 'string') return fallback;
  return ['1', 'true', 'on', 'yes'].includes(value.toLowerCase());
};

const env = import.meta.env;

const openFoodFactsProvider: PriceProvider = {
  source: 'open_food_facts',
  isEnabled: () => parseFlag(env.VITE_PRICE_PROVIDER_OPEN_FOOD_FACTS, true),
  async search(input, signal) {
    if (!input.barcode && !input.query) {
      return {
        source: 'open_food_facts',
        status: 'NO_DATA',
        observations: [],
        warnings: [],
      };
    }

    try {
      if (input.barcode) {
        const url = `${OPEN_FOOD_FACTS_ENDPOINT}/api/v2/product/${encodeURIComponent(input.barcode)}.json`;
        const response = await fetch(url, { signal });
        if (!response.ok) {
          return { source: 'open_food_facts', status: 'UNAVAILABLE', observations: [], warnings: [] };
        }
        const data = (await response.json()) as {
          product?: { product_name?: string; brands?: string };
        };

        return {
          source: 'open_food_facts',
          status: data.product ? 'OK' : 'NO_DATA',
          observations: [],
          warnings: [],
          productName: data.product?.product_name,
        };
      }

      const query = encodeURIComponent(normalizeText(input.query));
      const url = `${OPEN_FOOD_FACTS_ENDPOINT}/cgi/search.pl?search_terms=${query}&search_simple=1&action=process&json=1&page_size=1`;
      const response = await fetch(url, { signal });
      if (!response.ok) {
        return { source: 'open_food_facts', status: 'UNAVAILABLE', observations: [], warnings: [] };
      }
      const data = (await response.json()) as { products?: Array<{ product_name?: string }> };
      return {
        source: 'open_food_facts',
        status: data.products?.length ? 'OK' : 'NO_DATA',
        observations: [],
        warnings: [],
        productName: data.products?.[0]?.product_name,
      };
    } catch {
      return { source: 'open_food_facts', status: 'UNAVAILABLE', observations: [], warnings: [] };
    }
  },
};

const dataGouvStubProvider: PriceProvider = {
  source: 'data_gouv',
  isEnabled: () => parseFlag(env.VITE_PRICE_PROVIDER_DATA_GOUV, false),
  async search() {
    return {
      source: 'data_gouv',
      status: 'UNAVAILABLE',
      observations: [],
      warnings: ['data.gouv.fr indisponible (stub provider).'],
    };
  },
};

const PROVIDERS: PriceProvider[] = [openPricesProvider, openFoodFactsProvider, dataGouvStubProvider];

export async function queryProviders(input: PriceSearchInput, signal: AbortSignal): Promise<ProviderResult[]> {
  const enabledProviders = PROVIDERS.filter((provider) => provider.isEnabled());

  if (enabledProviders.length === 0) {
    return [await seedProvider.search(input, signal)];
  }

  const settled = await Promise.allSettled(enabledProviders.map((provider) => provider.search(input, signal)));
  const liveResults = settled.flatMap((result, index) => {
    const provider = enabledProviders[index];
    if (result.status === 'fulfilled') {
      return [result.value];
    }
    return [{ source: provider.source, status: 'UNAVAILABLE', observations: [], warnings: [] } as ProviderResult];
  });

  const hasPriceObservations = liveResults.some((result) => result.observations.length > 0);
  if (hasPriceObservations) {
    return liveResults;
  }

  const seedResult = await seedProvider.search(input, signal);
  return [...liveResults, seedResult];
}
