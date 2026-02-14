import { getCachedWithTTL, setCachedJson } from './localStore';

const OFF_DEFAULT_BASE_URL = 'https://world.openfoodfacts.org';
const OFF_PRODUCT_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const OFF_TIMEOUT_MS = 8000;

type OffStatus = 'OK' | 'NOT_FOUND' | 'INVALID' | 'ERROR';

export type OffProductResult = {
  status: OffStatus;
  barcode: string;
  product?: {
    name?: string;
    brands?: string;
    imageUrl?: string;
    quantity?: string;
    categories?: string[];
  };
  raw?: unknown;
  error?: { message: string; code?: string };
};

type OffApiProduct = {
  product_name?: unknown;
  brands?: unknown;
  image_url?: unknown;
  quantity?: unknown;
  categories_tags?: unknown;
};

type OffApiResponse = {
  status?: unknown;
  product?: OffApiProduct;
};

function getOffBaseUrl(): string {
  const configuredBaseUrl = import.meta.env.VITE_OPEN_FOOD_FACTS_BASE_URL;
  return typeof configuredBaseUrl === 'string' && configuredBaseUrl.trim().length > 0
    ? configuredBaseUrl.trim()
    : OFF_DEFAULT_BASE_URL;
}

function isBarcodeValid(barcode: string): boolean {
  return /^\d{8,14}$/.test(barcode);
}

function cacheKey(barcode: string): string {
  return `off:product:${barcode}`;
}

function safeString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function safeStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const cleaned = value
    .filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0)
    .map((entry) => entry.trim());

  return cleaned.length > 0 ? cleaned : undefined;
}

function mapApiResponse(barcode: string, payload: OffApiResponse): OffProductResult {
  if (payload.status === 0) {
    return {
      status: 'NOT_FOUND',
      barcode,
    };
  }

  if (payload.status !== 1 || !payload.product) {
    return {
      status: 'ERROR',
      barcode,
      error: {
        message: 'Réponse Open Food Facts invalide',
        code: 'INVALID_RESPONSE',
      },
    };
  }

  const normalizedProduct = {
    name: safeString(payload.product.product_name),
    brands: safeString(payload.product.brands),
    imageUrl: safeString(payload.product.image_url),
    quantity: safeString(payload.product.quantity),
    categories: safeStringArray(payload.product.categories_tags),
  };

  return {
    status: 'OK',
    barcode,
    product: normalizedProduct,
    ...(import.meta.env.DEV ? { raw: payload } : {}),
  };
}

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

export async function fetchOffProductByBarcode(
  barcode: string,
  opts?: { signal?: AbortSignal }
): Promise<OffProductResult> {
  const invalid = validateBarcode(barcode);
  if (invalid) {
    return invalid;
  }

  const cached = getCachedWithTTL<Pick<OffProductResult, 'status' | 'barcode' | 'product'>>(
    cacheKey(barcode),
    OFF_PRODUCT_CACHE_TTL_MS
  );

  if (cached) {
    return cached;
  }

  const externalSignal = opts?.signal;
  const controller = externalSignal ? null : new window.AbortController();
  const timeout = controller ? window.setTimeout(() => controller.abort(), OFF_TIMEOUT_MS) : null;

  try {
    const response = await fetch(
      `${getOffBaseUrl()}/api/v2/product/${encodeURIComponent(barcode)}.json`,
      {
        method: 'GET',
        signal: externalSignal ?? controller?.signal,
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      return {
        status: 'ERROR',
        barcode,
        error: {
          message: `Erreur Open Food Facts (${response.status})`,
          code: 'HTTP_ERROR',
        },
      };
    }

    const payload = (await response.json()) as OffApiResponse;
    const mapped = mapApiResponse(barcode, payload);

    if (mapped.status === 'OK' || mapped.status === 'NOT_FOUND') {
      setCachedJson(cacheKey(barcode), {
        status: mapped.status,
        barcode: mapped.barcode,
        product: mapped.product,
      });
    }

    return mapped;
  } catch (error: unknown) {
    const errorName = error instanceof Error ? error.name : '';
    const isAbortError = errorName === 'AbortError';
    return {
      status: 'ERROR',
      barcode,
      error: {
        message: isAbortError
          ? 'Délai dépassé lors de la requête Open Food Facts'
          : 'Erreur réseau lors de la requête Open Food Facts',
        code: isAbortError ? 'TIMEOUT' : 'NETWORK_ERROR',
      },
    };
  } finally {
    if (timeout) {
      window.clearTimeout(timeout);
    }
  }
}

export const __offInternals = {
  cacheKey,
  isBarcodeValid,
  mapApiResponse,
  OFF_PRODUCT_CACHE_TTL_MS,
};
