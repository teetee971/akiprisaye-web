import type { PriceSearchInput } from '../services/priceSearch/price.types';
import { normalizeText } from './normalize';
import { openPricesProvider } from './openPricesProvider';
import { seedProvider } from './seedProvider';
import type { PriceProvider, ProviderResult } from './types';
import { track } from '../telemetry';

const OPEN_FOOD_FACTS_ENDPOINT = 'https://world.openfoodfacts.org';

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

const openFoodFactsProvider: PriceProvider = {
  source: 'open_food_facts',
  isEnabled: () => parseFlag(readEnv('VITE_PRICE_PROVIDER_OPEN_FOOD_FACTS'), true),
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
  isEnabled: () => parseFlag(readEnv('VITE_PRICE_PROVIDER_DATA_GOUV'), false),
  async search() {
    return {
      source: 'data_gouv',
      status: 'UNAVAILABLE',
      observations: [],
      warnings: ['data.gouv.fr indisponible (stub provider).'],
    };
  },
};

const PROVIDERS: PriceProvider[] = [openFoodFactsProvider, openPricesProvider, dataGouvStubProvider];

type ProviderRun = {
  result: ProviderResult;
  durationMs: number;
  errorType?: string;
};

async function runProvider(provider: PriceProvider, input: PriceSearchInput, signal: AbortSignal): Promise<ProviderRun> {
  const startedAt = performance.now();
  try {
    const result = await provider.search(input, signal);
    return {
      result,
      durationMs: Math.round(performance.now() - startedAt),
    };
  } catch {
    return {
      result: {
        source: provider.source,
        status: 'UNAVAILABLE',
        observations: [],
        warnings: [`${provider.source} indisponible (exception provider).`],
      },
      durationMs: Math.round(performance.now() - startedAt),
      errorType: 'provider_rejected',
    };
  }
}

function trackProviderRun(
  input: PriceSearchInput,
  run: { source: string; status: ProviderResult['status']; warningsCount: number; observationsCount: number; durationMs: number; errorType?: string }
): void {
  const mode = input.barcode && input.query ? 'mixed' : input.barcode ? 'ean' : 'query';
  const territory = input.territory ?? 'fr';
  const queryLen = input.query?.trim().length ?? 0;
  const eanLen = input.barcode?.trim().length ?? 0;

  track({
    kind: 'provider_run',
    territory,
    mode,
    queryLen,
    eanLen,
    durationMs: run.durationMs,
    status: run.status,
    sourcesUsed: [run.source],
    warningsCount: run.warningsCount,
    meta: {
      provider: run.source,
      observations: run.observationsCount,
      ...(run.errorType ? { errorType: run.errorType } : {}),
    },
  });
}

export async function queryProviders(input: PriceSearchInput, signal: AbortSignal): Promise<ProviderResult[]> {
  const enabledProviders = PROVIDERS.filter((provider) => provider.isEnabled());

  if (enabledProviders.length === 0) {
    const seedRun = await runProvider(seedProvider, input, signal);
    trackProviderRun(input, {
      source: seedRun.result.source,
      status: seedRun.result.status,
      warningsCount: seedRun.result.warnings.length,
      observationsCount: seedRun.result.observations.length,
      durationMs: seedRun.durationMs,
      errorType: seedRun.errorType,
    });
    return [seedRun.result];
  }

  const liveRuns = await Promise.all(enabledProviders.map((provider) => runProvider(provider, input, signal)));
  for (const run of liveRuns) {
    trackProviderRun(input, {
      source: run.result.source,
      status: run.result.status,
      warningsCount: run.result.warnings.length,
      observationsCount: run.result.observations.length,
      durationMs: run.durationMs,
      errorType: run.errorType,
    });
  }

  const liveResults = liveRuns.map((run) => run.result);
  const hasPriceObservations = liveResults.some((result) => result.observations.length > 0);
  if (hasPriceObservations) {
    return liveResults;
  }

  const seedRun = await runProvider(seedProvider, input, signal);
  trackProviderRun(input, {
    source: seedRun.result.source,
    status: seedRun.result.status,
    warningsCount: seedRun.result.warnings.length,
    observationsCount: seedRun.result.observations.length,
    durationMs: seedRun.durationMs,
    errorType: seedRun.errorType,
  });
  return [...liveResults, seedRun.result];
}
