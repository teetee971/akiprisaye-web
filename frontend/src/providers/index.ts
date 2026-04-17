import type { PriceSearchInput } from '../services/priceSearch/price.types';
import { calameoDynamicProvider } from './calameoDynamicProvider';
import { carrefourMilenisGuadeloupeProvider } from './carrefourMilenisGuadeloupeProvider';
import { connexionGuadeloupeProvider } from './connexionGuadeloupeProvider';
import { coursesUProvider } from './coursesUProvider';
import { ecologiteGuadeloupeProvider } from './ecologiteGuadeloupeProvider';
import { huitAHuitGuadeloupeProvider } from './huitAHuitGuadeloupeProvider';
import { intermarcheProvider } from './intermarcheProvider';
import { leclercCatalogProvider } from './leclercCatalogProvider';
import { leclercElectromenagerProvider } from './leclercElectromenagerProvider';
import { leclercHighTechProvider } from './leclercHighTechProvider';
import { leclercJardinProvider } from './leclercJardinProvider';
import { leclercParapharmacieProvider } from './leclercParapharmacieProvider';
import { leclercSecondeVieProvider } from './leclercSecondeVieProvider';
import { leaderPriceProvider } from './leaderPriceProvider';
import { macaveLeclercProvider } from './macaveLeclercProvider';
import { normalizeText } from './normalize';
import { openPricesProvider } from './openPricesProvider';
import { seedProvider } from './seedProvider';
import { supecoGuyaneProvider } from './supecoGuyaneProvider';
import type { PriceProvider, ProviderResult } from './types';

const OFF_PROXY_PRODUCT_ENDPOINT = '/api/off/product';
const OFF_PROXY_SEARCH_ENDPOINT = '/api/off/search';

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
        const url = `${OFF_PROXY_PRODUCT_ENDPOINT}?barcode=${encodeURIComponent(input.barcode)}`;
        const response = await fetch(url, { signal });
        if (!response.ok) {
          return {
            source: 'open_food_facts',
            status: 'UNAVAILABLE',
            observations: [],
            warnings: [],
          };
        }
        const data = (await response.json()) as {
          data?: { productName?: string };
        };

        return {
          source: 'open_food_facts',
          status: data.data ? 'OK' : 'NO_DATA',
          observations: [],
          warnings: [],
          productName: data.data?.productName,
        };
      }

      const query = encodeURIComponent(normalizeText(input.query));
      const url = `${OFF_PROXY_SEARCH_ENDPOINT}?q=${query}&page=1&pageSize=1`;
      const response = await fetch(url, { signal });
      if (!response.ok) {
        return { source: 'open_food_facts', status: 'UNAVAILABLE', observations: [], warnings: [] };
      }
      const data = (await response.json()) as { products?: Array<{ productName?: string }> };
      return {
        source: 'open_food_facts',
        status: data.products?.length ? 'OK' : 'NO_DATA',
        observations: [],
        warnings: [],
        productName: data.products?.[0]?.productName,
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

const PROVIDERS: PriceProvider[] = [
  openPricesProvider,
  openFoodFactsProvider,
  dataGouvStubProvider,
  leclercCatalogProvider,
  macaveLeclercProvider,
  leclercJardinProvider,
  leclercHighTechProvider,
  leclercElectromenagerProvider,
  leclercParapharmacieProvider,
  leclercSecondeVieProvider,
  ecologiteGuadeloupeProvider,
  huitAHuitGuadeloupeProvider,
  supecoGuyaneProvider,
  carrefourMilenisGuadeloupeProvider,
  connexionGuadeloupeProvider,
  coursesUProvider,
  intermarcheProvider,
  leaderPriceProvider,
  calameoDynamicProvider,
];

export async function runPriceProviders(
  input: PriceSearchInput,
  signal: AbortSignal
): Promise<ProviderResult[]> {
  const enabledProviders = PROVIDERS.filter((provider) => provider.isEnabled());

  if (enabledProviders.length === 0) {
    return [await seedProvider.search(input, signal)];
  }

  const settled = await Promise.allSettled(
    enabledProviders.map((provider) => provider.search(input, signal))
  );
  const liveResults = settled.flatMap((result, index) => {
    const provider = enabledProviders[index];
    if (result.status === 'fulfilled') {
      return [result.value];
    }
    return [
      {
        source: provider.source,
        status: 'UNAVAILABLE',
        observations: [],
        warnings: [],
      } as ProviderResult,
    ];
  });

  const hasPriceObservations = liveResults.some((result) => result.observations.length > 0);
  if (hasPriceObservations) {
    return liveResults;
  }

  const seedResult = await seedProvider.search(input, signal);
  return [...liveResults, seedResult];
}

export const queryProviders = runPriceProviders;
