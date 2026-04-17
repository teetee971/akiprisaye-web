import { getCachedWithTTL, setCachedJson } from './localStore';
import { getProductOverride } from '../data/product_overrides';

const OFF_DEFAULT_BASE_URL = 'https://world.openfoodfacts.org';
const OFF_PRODUCT_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const OFF_TIMEOUT_MS = 8000;

type OffStatus = 'OK' | 'NOT_FOUND' | 'INVALID' | 'ERROR';
type OffSource = 'openfoodfacts' | 'local_override';

export type OffProductResult = {
  status: OffStatus;
  source?: OffSource;
  message?: string;
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
  nutriscore_grade?: unknown;
  nova_group?: unknown;
  ecoscore_grade?: unknown;
  nutriments?: unknown;
  ingredients_text?: unknown;
  allergens?: unknown;
};

type OffApiResponse = {
  status?: unknown;
  product?: OffApiProduct;
};

export type OffProductUiModel = {
  barcode: string;
  name?: string;
  brand?: string;
  image?: string;
  quantity?: string;
  nutriScore?: string;
  nova?: number;
  ecoScore?: string;
  nutriments: {
    kcal?: number;
    sugars?: number;
    fat?: number;
    salt?: number;
  };
  ingredients?: string;
  allergens?: string;
  categories?: string[];
  nutritionPer100g?: {
    energyKj?: number;
    energyKcal?: number;
    fat?: number;
    saturatedFat?: number;
    carbs?: number;
    sugars?: number;
    fiber?: number;
    protein?: number;
    salt?: number;
  };
  source?: OffSource;
  sourceMessage?: string;
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
    source: 'openfoodfacts',
    barcode,
    product: normalizedProduct,
    ...(import.meta.env.DEV ? { raw: payload } : {}),
  };
}

function getLocalOverrideResult(barcode: string): OffProductResult | null {
  const override = getProductOverride(barcode);
  if (!override) {
    return null;
  }

  return {
    status: 'OK',
    source: 'local_override',
    message: 'données internes',
    barcode,
    product: {
      name: override.productName,
      brands: override.brand,
      quantity: override.quantity,
      categories: override.categories,
    },
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
          Accept: 'application/json',
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        const local = getLocalOverrideResult(barcode);
        if (local) {
          return local;
        }
      }
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

    if (mapped.status === 'NOT_FOUND') {
      const local = getLocalOverrideResult(barcode);
      if (local) {
        return local;
      }
    }

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

const OFF_PRODUCT_FIELDS = [
  'product_name',
  'brands',
  'image_url',
  'nutriscore_grade',
  'nova_group',
  'nutriments',
  'ingredients_text',
  'allergens',
  'quantity',
  'ecoscore_grade',
].join(',');

function safeNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}

function mapToUiModel(barcode: string, product: OffApiProduct): OffProductUiModel {
  const nutriments =
    typeof product.nutriments === 'object' && product.nutriments !== null
      ? (product.nutriments as Record<string, unknown>)
      : {};

  return {
    barcode,
    name: safeString(product.product_name),
    brand: safeString(product.brands),
    image: safeString(product.image_url),
    quantity: safeString(product.quantity),
    nutriScore: safeString(product.nutriscore_grade)?.toUpperCase(),
    nova: safeNumber(product.nova_group),
    ecoScore: safeString(product.ecoscore_grade)?.toUpperCase(),
    nutriments: {
      kcal: safeNumber(nutriments['energy-kcal_100g']),
      sugars: safeNumber(nutriments.sugars_100g),
      fat: safeNumber(nutriments.fat_100g),
      salt: safeNumber(nutriments.salt_100g),
    },
    ingredients: safeString(product.ingredients_text),
    allergens: safeString(product.allergens),
    source: 'openfoodfacts',
  };
}

function mapOverrideToUiModel(barcode: string): OffProductUiModel | null {
  const override = getProductOverride(barcode);
  if (!override) {
    return null;
  }

  return {
    barcode,
    name: override.productName,
    brand: override.brand,
    quantity: override.quantity,
    nutriments: {
      kcal: override.nutritionPer100g?.energyKcal,
      sugars: override.nutritionPer100g?.sugars,
      fat: override.nutritionPer100g?.fat,
      salt: override.nutritionPer100g?.salt,
    },
    ingredients: override.ingredientsText,
    categories: override.categories,
    nutritionPer100g: override.nutritionPer100g,
    source: 'local_override',
    sourceMessage: 'données internes',
  };
}

export async function fetchOffProductDetails(
  barcode: string,
  opts?: { signal?: AbortSignal }
): Promise<OffProductResult & { ui?: OffProductUiModel }> {
  const invalid = validateBarcode(barcode);
  if (invalid) {
    return invalid;
  }

  try {
    const response = await fetch(
      `${getOffBaseUrl()}/api/v2/product/${encodeURIComponent(barcode)}.json?fields=${OFF_PRODUCT_FIELDS}`,
      {
        method: 'GET',
        signal: opts?.signal,
        headers: {
          Accept: 'application/json',
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        const localUi = mapOverrideToUiModel(barcode);
        if (localUi) {
          return {
            status: 'OK',
            source: 'local_override',
            message: 'données internes',
            barcode,
            ui: localUi,
            product: {
              name: localUi.name,
              brands: localUi.brand,
              quantity: localUi.quantity,
              categories: localUi.categories,
            },
          };
        }
      }
      return {
        status: response.status === 404 ? 'NOT_FOUND' : 'ERROR',
        barcode,
        error: {
          message: `Erreur Open Food Facts (${response.status})`,
          code: 'HTTP_ERROR',
        },
      };
    }

    const payload = (await response.json()) as OffApiResponse;

    if (payload.status === 0 || !payload.product) {
      const localUi = mapOverrideToUiModel(barcode);
      if (localUi) {
        return {
          status: 'OK',
          source: 'local_override',
          message: 'données internes',
          barcode,
          ui: localUi,
          product: {
            name: localUi.name,
            brands: localUi.brand,
            quantity: localUi.quantity,
            categories: localUi.categories,
          },
        };
      }
      return {
        status: 'NOT_FOUND',
        barcode,
      };
    }

    if (payload.status !== 1) {
      return {
        status: 'ERROR',
        barcode,
        error: {
          message: 'Réponse Open Food Facts invalide',
          code: 'INVALID_RESPONSE',
        },
      };
    }

    return {
      status: 'OK',
      source: 'openfoodfacts',
      barcode,
      ui: mapToUiModel(barcode, payload.product),
      product: {
        name: safeString(payload.product.product_name),
        brands: safeString(payload.product.brands),
        imageUrl: safeString(payload.product.image_url),
        quantity: safeString(payload.product.quantity),
      },
    };
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
  }
}

export const __offInternals = {
  cacheKey,
  isBarcodeValid,
  mapApiResponse,
  OFF_PRODUCT_CACHE_TTL_MS,
};
