import { getCached, setCached } from './productCache';

const OFF_BASE_URL = 'https://world.openfoodfacts.org';
const OFF_TIMEOUT_MS = 5_000;

export type OffFetchStatus = 'OK' | 'NOT_FOUND' | 'ERROR' | 'TIMEOUT' | 'INVALID';

export type OffProductMinimal = {
  barcode: string;
  productName?: string;
  brands?: string;
  imageUrl?: string;
  quantity?: string;
  categories?: string[];
  stores?: string;
  nutriments?: Record<string, unknown>;
};

type OffApiResponse = {
  status?: number;
  product?: Record<string, unknown>;
};

type FetchOptions = {
  signal?: AbortSignal;
  timeoutMs?: number;
};

export type OffFetchResult = {
  status: OffFetchStatus;
  product?: OffProductMinimal;
  sourceUrl: string;
  responseMs: number;
  errorKind?: 'NETWORK' | 'HTTP' | 'ABORT' | 'INVALID';
};

function isBarcodeValid(barcode: string): boolean {
  return /^\d{8,14}$/.test(barcode);
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function asStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const valid = value
    .map((entry) => asString(entry))
    .filter((entry): entry is string => Boolean(entry));

  return valid.length > 0 ? valid : undefined;
}

export function mapOffResponseToMinimal(json: unknown): OffProductMinimal | null {
  const payload = json as OffApiResponse;
  if (!payload || payload.status !== 1 || !payload.product) {
    return null;
  }

  const product = payload.product;
  const barcode = asString(product.code) ?? asString((payload as Record<string, unknown>).code);

  return {
    barcode: barcode ?? '',
    productName: asString(product.product_name),
    brands: asString(product.brands),
    imageUrl: asString(product.image_url) ?? asString(product.image_front_url),
    quantity: asString(product.quantity),
    categories: asStringArray(product.categories_tags),
    stores: asString(product.stores),
    nutriments: typeof product.nutriments === 'object' && product.nutriments !== null
      ? (product.nutriments as Record<string, unknown>)
      : undefined,
  };
}

function buildOffUrl(barcode: string): string {
  return `${OFF_BASE_URL}/api/v2/product/${encodeURIComponent(barcode)}.json`;
}

async function fetchOnce(
  barcode: string,
  options: FetchOptions,
  sourceUrl: string
): Promise<OffFetchResult> {
  const startedAt = performance.now();
  const timeoutMs = options.timeoutMs ?? OFF_TIMEOUT_MS;

  const timeoutController = new AbortController();
  const mergedSignal = options.signal;
  const timeoutId = window.setTimeout(() => timeoutController.abort(), timeoutMs);

  const abortListener = () => timeoutController.abort();
  if (mergedSignal) {
    mergedSignal.addEventListener('abort', abortListener, { once: true });
  }

  try {
    const response = await fetch(sourceUrl, {
      method: 'GET',
      signal: timeoutController.signal,
      headers: {
        Accept: 'application/json',
      },
    });

    const responseMs = Math.round(performance.now() - startedAt);

    if (response.status === 404) {
      return { status: 'NOT_FOUND', sourceUrl, responseMs };
    }

    if (!response.ok) {
      return { status: 'ERROR', sourceUrl, responseMs, errorKind: 'HTTP' };
    }

    const json = (await response.json()) as OffApiResponse;

    if (json.status === 0) {
      return { status: 'NOT_FOUND', sourceUrl, responseMs };
    }

    const mapped = mapOffResponseToMinimal(json);
    if (!mapped) {
      return { status: 'ERROR', sourceUrl, responseMs, errorKind: 'HTTP' };
    }

    mapped.barcode = mapped.barcode || barcode;
    return {
      status: 'OK',
      product: mapped,
      sourceUrl,
      responseMs,
    };
  } catch (error) {
    const responseMs = Math.round(performance.now() - startedAt);
    const isAbort = error instanceof DOMException && error.name === 'AbortError';
    return {
      status: isAbort ? 'TIMEOUT' : 'ERROR',
      sourceUrl,
      responseMs,
      errorKind: isAbort ? 'ABORT' : 'NETWORK',
    };
  } finally {
    window.clearTimeout(timeoutId);
    if (mergedSignal) {
      mergedSignal.removeEventListener('abort', abortListener);
    }
  }
}

export async function fetchOffProduct(
  barcode: string,
  options: FetchOptions = {}
): Promise<OffFetchResult> {
  const sourceUrl = buildOffUrl(barcode);

  if (!isBarcodeValid(barcode)) {
    return { status: 'INVALID', sourceUrl, responseMs: 0, errorKind: 'INVALID' };
  }

  const first = await fetchOnce(barcode, options, sourceUrl);
  if (first.status !== 'ERROR' || first.errorKind !== 'NETWORK') {
    return first;
  }

  // lightweight retry only for network errors
  return fetchOnce(barcode, options, sourceUrl);
}

export type OffProductResult = {
  status: 'OK' | 'NOT_FOUND' | 'INVALID' | 'ERROR';
  barcode: string;
  product?: {
    name?: string;
    brands?: string;
    imageUrl?: string;
    quantity?: string;
    categories?: string[];
  };
  error?: { message: string; code?: string };
};

export function validateBarcode(barcode: string): OffProductResult | null {
  if (isBarcodeValid(barcode)) {
    return null;
  }

  return {
    status: 'INVALID',
    barcode,
    error: {
      message: 'Code-barres invalide. Format attendu: 8 à 14 chiffres.',
      code: 'INVALID_BARCODE',
    },
  };
}

export async function fetchOffProductByBarcode(barcode: string, opts?: { signal?: AbortSignal }): Promise<OffProductResult> {
  const invalid = validateBarcode(barcode);
  if (invalid) {
    return invalid;
  }

  const result = await fetchOffProduct(barcode, { signal: opts?.signal });

  if (result.status === 'OK') {
    return {
      status: 'OK',
      barcode,
      product: {
        name: result.product?.productName,
        brands: result.product?.brands,
        imageUrl: result.product?.imageUrl,
        quantity: result.product?.quantity,
        categories: result.product?.categories,
      },
    };
  }

  if (result.status === 'NOT_FOUND') {
    return { status: 'NOT_FOUND', barcode };
  }

  if (result.status === 'INVALID') {
    return {
      status: 'INVALID',
      barcode,
      error: {
        message: 'Code-barres invalide. Format attendu: 8 à 14 chiffres.',
        code: 'INVALID_BARCODE',
      },
    };
  }

  return {
    status: 'ERROR',
    barcode,
    error: {
      message: result.status === 'TIMEOUT' ? 'Délai dépassé lors de la requête Open Food Facts' : 'Erreur réseau Open Food Facts',
      code: result.status === 'TIMEOUT' ? 'TIMEOUT' : 'NETWORK_ERROR',
    },
  };
}

export async function fetchCachedOrRemoteOffProduct(
  barcode: string,
  options: FetchOptions = {}
): Promise<OffFetchResult & { cacheHit: boolean }> {
  const cached = getCached(barcode);
  const sourceUrl = buildOffUrl(barcode);
  if (cached) {
    return {
      status: cached.status,
      product: cached.data ?? undefined,
      sourceUrl,
      responseMs: 0,
      cacheHit: true,
    };
  }

  const remote = await fetchOffProduct(barcode, options);
  if (remote.status === 'OK' || remote.status === 'NOT_FOUND') {
    setCached(barcode, {
      status: remote.status,
      data: remote.product ?? null,
    });
  }

  return {
    ...remote,
    cacheHit: false,
  };
}
