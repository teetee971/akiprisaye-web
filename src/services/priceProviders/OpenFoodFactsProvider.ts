import type { ProductPrice } from '../../types/ProductPrice';
import type { PriceProvider } from './PriceProvider';

const SEARCH_ENDPOINT = 'https://world.openfoodfacts.org/cgi/search.pl';
const REQUEST_TIMEOUT_MS = 6500;

interface OpenFoodFactsProduct {
  _id?: string;
  code?: string;
  product_name?: string;
  generic_name?: string;
  brands?: string;
  categories?: string;
  categories_tags?: string[];
  countries_tags?: string[];
  last_modified_t?: number;
}

interface OpenFoodFactsResponse {
  products?: OpenFoodFactsProduct[];
}

const normalizeText = (value: string): string =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

const resolveRegion = (countriesTags?: string[]): 'FR' | 'DOM' | undefined => {
  if (!countriesTags || countriesTags.length === 0) {
    return undefined;
  }

  const normalized = countriesTags.map((tag) => normalizeText(tag));
  if (normalized.some((tag) => tag.includes('martinique') || tag.includes('guadeloupe') || tag.includes('reunion') || tag.includes('guyane') || tag.includes('mayotte'))) {
    return 'DOM';
  }
  if (normalized.some((tag) => tag.includes('france'))) {
    return 'FR';
  }
  return undefined;
};

const getCategory = (product: OpenFoodFactsProduct): string | undefined => {
  if (product.categories && product.categories.trim().length > 0) {
    return product.categories.split(',')[0]?.trim();
  }
  return product.categories_tags?.[0];
};

const formatLastUpdated = (timestamp?: number): string => {
  if (!timestamp) {
    return new Date().toISOString();
  }
  return new Date(timestamp * 1000).toISOString();
};

const fetchWithTimeout = async (url: string, timeoutMs: number): Promise<Response> => {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    window.clearTimeout(timeout);
  }
};

export class OpenFoodFactsProvider implements PriceProvider {
  async search(query: string): Promise<ProductPrice[]> {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      return [];
    }

    const url = new URL(SEARCH_ENDPOINT);
    url.searchParams.set('search_terms', trimmed);
    url.searchParams.set('json', '1');
    url.searchParams.set('page_size', '12');

    const response = await fetchWithTimeout(url.toString(), REQUEST_TIMEOUT_MS);
    if (!response.ok) {
      throw new Error('openfoodfacts_unavailable');
    }

    const payload = (await response.json()) as OpenFoodFactsResponse;
    const products = payload.products ?? [];

    return products
      .map((product): ProductPrice | null => {
        const name = product.product_name?.trim() || product.generic_name?.trim();
        if (!name) {
          return null;
        }

        return {
          id: product._id ?? product.code ?? name,
          name,
          brand: product.brands?.split(',')[0]?.trim(),
          category: getCategory(product),
          currency: 'EUR',
          region: resolveRegion(product.countries_tags),
          lastUpdated: formatLastUpdated(product.last_modified_t),
          source: 'openfoodfacts',
          confidence: 'low',
        };
      })
      .filter((product): product is ProductPrice => Boolean(product));
  }
}
