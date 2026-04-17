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

const OFF_PROXY_PRODUCT_ENDPOINT = '/api/off/product';
const OFF_PROXY_SEARCH_ENDPOINT = '/api/off/search';
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
        const url = `${OFF_PROXY_PRODUCT_ENDPOINT}?barcode=${encodeURIComponent(input.barcode)}`;
        const data = await fetchJson<{ data?: { productName?: string } }>(url, signal);
        return {
          observations: [],
          warnings,
          provider: 'open_food_facts',
          productName: data.data?.productName,
        };
      }

      const query = encodeURIComponent(input.query ?? '');
      const url = `${OFF_PROXY_SEARCH_ENDPOINT}?q=${query}&page=1&pageSize=1`;
      const data = await fetchJson<{ products?: { productName?: string }[] }>(url, signal);
      return {
        observations: [],
        warnings,
        provider: 'open_food_facts',
        productName: data.products?.[0]?.productName,
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
      let data: {
        items?: Array<{
          price: number;
          currency?: string;
          unit?: string;
          product_name?: string;
          observed_at?: string;
          observedAt?: string;
          price_per?: string;
        }>;
        observations?: Array<{
          price: number;
          currency?: string;
          unit?: string;
          observedAt?: string;
        }>;
      };

      if (input.barcode) {
        // Route through Cloudflare proxy (/api/open-prices/by-barcode) when we have a barcode.
        // This provides: Cloudflare edge caching + territory (country_code) server-side filtering.
        const proxyParams = new URLSearchParams({
          barcode: input.barcode,
          pageSize: '50',
        });
        if (input.territory) {
          proxyParams.set('territory', input.territory.toLowerCase());
        }
        const proxyUrl = `/api/open-prices/by-barcode?${proxyParams.toString()}`;
        const proxyResp = await fetch(proxyUrl, { signal });
        if (proxyResp.ok) {
          const proxyData = (await proxyResp.json()) as {
            status?: string;
            observations?: Array<{
              price: number;
              currency?: string;
              unit?: string;
              observedAt?: string;
            }>;
          };
          if (proxyData.status === 'OK' && Array.isArray(proxyData.observations)) {
            const observations: PriceObservation[] = proxyData.observations
              .filter((obs) => typeof obs.price === 'number' && obs.price > 0)
              .map((obs) => ({
                source: 'open_prices',
                price: obs.price,
                currency: 'EUR',
                unit: obs.unit === 'kg' || obs.unit === 'l' ? obs.unit : 'unit',
                observedAt: obs.observedAt,
              }));
            if (observations.length === 0) {
              warnings.push('Aucun prix Open Prices trouvé pour cette requête.');
            }
            return { observations, warnings, provider: 'open_prices' };
          }
        }
        // Fallback: direct API call if proxy fails
        const params = new URLSearchParams({ product_code: input.barcode });
        if (input.territory) params.set('country_code', input.territory.toLowerCase());
        const url = `${OPEN_PRICES_ENDPOINT}/prices?${params.toString()}`;
        data = await fetchJson<typeof data>(url, signal);
      } else {
        // Text search — direct API call with optional territory
        const params = new URLSearchParams();
        if (input.query) params.set('q', input.query);
        if (input.territory) params.set('country_code', input.territory.toLowerCase());
        const url = `${OPEN_PRICES_ENDPOINT}/prices?${params.toString()}`;
        data = await fetchJson<typeof data>(url, signal);
      }

      const rawItems = data.items ?? [];
      const observations: PriceObservation[] = rawItems
        .filter((item) => typeof item.price === 'number' && item.price > 0)
        .map((item) => ({
          source: 'open_prices',
          productName: item.product_name,
          price: item.price,
          currency: 'EUR',
          unit:
            item.price_per === 'KILOGRAM' || item.unit === 'kg'
              ? 'kg'
              : item.price_per === 'LITER' || item.unit === 'l'
                ? 'l'
                : 'unit',
          observedAt: item.observed_at ?? item.observedAt,
        }));

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
