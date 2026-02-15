const OFF_BASE_URL = 'https://world.openfoodfacts.org';
const EDGE_CACHE_TTL = 7 * 24 * 60 * 60;
const FETCH_TIMEOUT_MS = 8000;

const DEFAULT_PLACEHOLDER_URL = '/assets/placeholders/placeholder-default.svg';

type ImageSource = 'openfoodfacts' | 'placeholder';
type DebugReason = 'ok' | 'forbidden' | 'rate_limited' | 'no_image' | 'timeout' | 'bad_response' | 'network_error' | 'unknown';
type SelectedImage = 'front' | 'small' | 'thumb' | 'none';
type OffFetch = typeof fetch;

type OffProductResponse = {
  status?: unknown;
  product?: {
    image_url?: unknown;
    image_front_url?: unknown;
    image_small_url?: unknown;
    selected_images?: {
      front?: {
        display?: unknown;
      };
    };
  };
};

type DebugPayload = {
  ok: boolean;
  source: ImageSource;
  barcode: string;
  tried: {
    endpoint: string;
  };
  status?: number;
  reason: DebugReason;
  image_url?: string;
  selected_image?: SelectedImage;
  redirect_to: string;
};

type ImageSelection = {
  url?: string;
  selected: SelectedImage;
};

const PLACEHOLDER_BY_CATEGORY: Record<string, string> = {
  bebe: '/assets/placeholders/placeholder-bebe.svg',
  epicerie: '/assets/placeholders/placeholder-epicerie.svg',
  'viande/poisson': '/assets/placeholders/placeholder-viande-poisson.svg',
  hygiene: '/assets/placeholders/placeholder-hygiene.svg',
};

function normalizeCategory(category: string): string {
  return category
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function getPlaceholderUrl(category?: string | null): string {
  if (!category || !category.trim()) {
    return DEFAULT_PLACEHOLDER_URL;
  }

  return PLACEHOLDER_BY_CATEGORY[normalizeCategory(category)] ?? DEFAULT_PLACEHOLDER_URL;
}

function asNonEmptyString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function asValidHttpUrl(value: unknown): string | undefined {
  const raw = asNonEmptyString(value);
  return raw && /^https?:\/\//i.test(raw) ? raw : undefined;
}

function pickFromDisplay(display: unknown): string | undefined {
  if (typeof display === 'string') {
    return asValidHttpUrl(display);
  }

  if (!display || typeof display !== 'object') {
    return undefined;
  }

  const record = display as Record<string, unknown>;
  const direct = asValidHttpUrl(record.fr) ?? asValidHttpUrl(record.en);
  if (direct) {
    return direct;
  }

  for (const value of Object.values(record)) {
    const candidate = asValidHttpUrl(value);
    if (candidate) {
      return candidate;
    }
  }

  return undefined;
}

function extractOffImage(payload: OffProductResponse): ImageSelection {
  if (!payload.product) {
    return { selected: 'none' };
  }

  const imageUrl = asValidHttpUrl(payload.product.image_url);
  if (imageUrl) {
    return { url: imageUrl, selected: 'thumb' };
  }

  const imageFrontUrl = asValidHttpUrl(payload.product.image_front_url);
  if (imageFrontUrl) {
    return { url: imageFrontUrl, selected: 'front' };
  }

  const imageSmallUrl = asValidHttpUrl(payload.product.image_small_url);
  if (imageSmallUrl) {
    return { url: imageSmallUrl, selected: 'small' };
  }

  const display = payload.product.selected_images?.front?.display;
  const displayFr = asValidHttpUrl((display as Record<string, unknown> | undefined)?.fr);
  if (displayFr) {
    return { url: displayFr, selected: 'front' };
  }

  const displayEn = asValidHttpUrl((display as Record<string, unknown> | undefined)?.en);
  if (displayEn) {
    return { url: displayEn, selected: 'front' };
  }

  const fallbackDisplay = pickFromDisplay(display);
  if (fallbackDisplay) {
    return { url: fallbackDisplay, selected: 'front' };
  }

  return { selected: 'none' };
}

function wantsJsonResponse(request: Request, searchParams: URLSearchParams): boolean {
  if (searchParams.get('format') === 'json') {
    return true;
  }

  const accept = request.headers.get('accept') ?? '';
  return accept.toLowerCase().includes('application/json');
}

function buildDebugHeaders(payload: DebugPayload): HeadersInit {
  return {
    'x-akps-source': payload.source,
    'x-akps-reason': payload.reason,
    'x-akps-off-status': typeof payload.status === 'number' ? String(payload.status) : 'n/a',
    'x-akps-selected': payload.selected_image ?? 'none',
  };
}

function jsonResponse(body: DebugPayload): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': `public, max-age=${EDGE_CACHE_TTL}`,
      vary: 'Accept',
      ...buildDebugHeaders(body),
    },
  });
}

function imageRedirectResponse(targetUrl: string, body: DebugPayload): Response {
  return new Response(null, {
    status: 302,
    headers: {
      location: targetUrl,
      'cache-control': `public, max-age=${EDGE_CACHE_TTL}`,
      vary: 'Accept',
      ...buildDebugHeaders(body),
    },
  });
}

function buildDebug(params: {
  source: ImageSource;
  barcode: string;
  endpoint: string;
  redirectTo: string;
  reason: DebugReason;
  status?: number;
  imageUrl?: string;
  selectedImage?: SelectedImage;
}): DebugPayload {
  return {
    ok: params.source === 'openfoodfacts',
    source: params.source,
    barcode: params.barcode,
    tried: { endpoint: params.endpoint },
    ...(typeof params.status === 'number' ? { status: params.status } : {}),
    reason: params.reason,
    ...(params.imageUrl ? { image_url: params.imageUrl } : {}),
    ...(params.selectedImage ? { selected_image: params.selectedImage } : {}),
    redirect_to: params.redirectTo,
  };
}

function mapStatusReason(status: number): DebugReason {
  if (status === 403) return 'forbidden';
  if (status === 429) return 'rate_limited';
  if (status >= 400) return 'bad_response';
  return 'unknown';
}

function mapErrorReason(error: unknown): DebugReason {
  if (error && typeof error === 'object' && 'name' in error) {
    const errorName = String((error as { name?: unknown }).name ?? '');
    if (errorName === 'AbortError') {
      return 'timeout';
    }
  }

  return 'network_error';
}

export function createProductImageHandler(offFetch: OffFetch = fetch): PagesFunction {
  return async ({ request }) => {
    const url = new URL(request.url);
    const barcode = (url.searchParams.get('ean') ?? url.searchParams.get('barcode') ?? '').trim();
    const category = url.searchParams.get('category');
    const wantsJson = wantsJsonResponse(request, url.searchParams);
    const placeholder = getPlaceholderUrl(category);
    const endpoint = barcode
      ? `${OFF_BASE_URL}/api/v2/product/${encodeURIComponent(barcode)}`
      : `${OFF_BASE_URL}/api/v2/product/`;

    if (!barcode) {
      const debug = buildDebug({
        source: 'placeholder',
        barcode,
        endpoint,
        redirectTo: placeholder,
        reason: 'unknown',
        selectedImage: 'none',
      });

      return wantsJson ? jsonResponse(debug) : imageRedirectResponse(placeholder, debug);
    }

    const cache = caches.default;
    const cacheKey = new Request(url.toString(), {
      method: 'GET',
      headers: {
        accept: request.headers.get('accept') ?? '',
      },
    });

    const cached = await cache.match(cacheKey);
    if (cached) {
      return cached;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const response = await offFetch(endpoint, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          'User-Agent': 'akiprisaye-web/1.0 (contact: https://github.com/teetee971/akiprisaye-web)',
        },
      });

      let debug: DebugPayload;

      if (!response.ok) {
        debug = buildDebug({
          source: 'placeholder',
          barcode,
          endpoint,
          status: response.status,
          reason: mapStatusReason(response.status),
          redirectTo: placeholder,
          selectedImage: 'none',
        });
      } else {
        let payload: OffProductResponse;
        try {
          payload = (await response.json()) as OffProductResponse;
        } catch {
          debug = buildDebug({
            source: 'placeholder',
            barcode,
            endpoint,
            status: response.status,
            reason: 'bad_response',
            redirectTo: placeholder,
            selectedImage: 'none',
          });

          const result = wantsJson ? jsonResponse(debug) : imageRedirectResponse(placeholder, debug);
          await cache.put(cacheKey, result.clone());
          return result;
        }

        const selection = extractOffImage(payload);
        if (selection.url) {
          debug = buildDebug({
            source: 'openfoodfacts',
            barcode,
            endpoint,
            status: response.status,
            reason: 'ok',
            imageUrl: selection.url,
            selectedImage: selection.selected,
            redirectTo: selection.url,
          });
        } else {
          debug = buildDebug({
            source: 'placeholder',
            barcode,
            endpoint,
            status: response.status,
            reason: 'no_image',
            selectedImage: 'none',
            redirectTo: placeholder,
          });
        }
      }

      const result = wantsJson ? jsonResponse(debug) : imageRedirectResponse(debug.redirect_to, debug);
      await cache.put(cacheKey, result.clone());
      return result;
    } catch (error) {
      const debug = buildDebug({
        source: 'placeholder',
        barcode,
        endpoint,
        reason: mapErrorReason(error),
        selectedImage: 'none',
        redirectTo: placeholder,
      });

      const result = wantsJson ? jsonResponse(debug) : imageRedirectResponse(placeholder, debug);
      await cache.put(cacheKey, result.clone());
      return result;
    } finally {
      clearTimeout(timeoutId);
    }
  };
}

export const onRequestGet = createProductImageHandler();
