const OFF_BASE_URL = 'https://world.openfoodfacts.org';
const REQUEST_TIMEOUT_MS = 5000;

export interface OffProduct {
  code?: string;
  product_name?: string;
  brands?: string;
  image_url?: string;
  image_front_url?: string;
  categories_tags?: string[];
  quantity?: string;
}

interface OffProductResponse {
  status?: number;
  product?: OffProduct;
}

interface OffSearchResponse {
  products?: OffProduct[];
}

async function fetchWithRetry(url: URL, init: RequestInit = {}, retries = 1): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        ...init.headers,
      },
    });

    if (!response.ok && retries > 0 && response.status >= 500) {
      return fetchWithRetry(url, init, retries - 1);
    }

    return response;
  } catch (error) {
    if (retries > 0) {
      return fetchWithRetry(url, init, retries - 1);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function lookupProductByEan(ean: string): Promise<OffProduct | null> {
  const url = new URL(`${OFF_BASE_URL}/api/v0/product/${encodeURIComponent(ean)}.json`);
  const response = await fetchWithRetry(url);

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as OffProductResponse;
  if (payload.status !== 1 || !payload.product) {
    return null;
  }

  return payload.product;
}

export async function searchProductsByText(searchTerms: string): Promise<OffProduct[]> {
  const url = new URL(`${OFF_BASE_URL}/cgi/search.pl`);
  url.searchParams.set('search_terms', searchTerms);
  url.searchParams.set('search_simple', '1');
  url.searchParams.set('action', 'process');
  url.searchParams.set('json', '1');
  url.searchParams.set('page_size', '15');

  const response = await fetchWithRetry(url);
  if (!response.ok) {
    return [];
  }

  const payload = (await response.json()) as OffSearchResponse;
  return payload.products ?? [];
}
