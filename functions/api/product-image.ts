const OFF_BASE_URL = 'https://world.openfoodfacts.org';
const EDGE_CACHE_TTL = 7 * 24 * 60 * 60;
const FETCH_TIMEOUT_MS = 5000;

type ImageSource = 'off' | 'placeholder';

const DEFAULT_PLACEHOLDER_URL = '/assets/placeholders/placeholder-default.svg';

type OffImagePayload = {
  image_url?: unknown;
  selected_images?: {
    front?: {
      display?: {
        fr?: unknown;
        en?: unknown;
      };
    };
  };
};

type OffProductResponse = {
  status?: unknown;
  product?: OffImagePayload;
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

function extractOffImageUrl(payload: OffProductResponse): string | undefined {
  if (payload.status === 0 || !payload.product) return undefined;

  return asNonEmptyString(payload.product.selected_images?.front?.display?.fr)
    ?? asNonEmptyString(payload.product.selected_images?.front?.display?.en)
    ?? asNonEmptyString(payload.product.image_url);
}

function jsonResponse(body: { url?: string; source: ImageSource }, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'Cache-Control': `public, max-age=${EDGE_CACHE_TTL}`,
      Vary: 'Accept',
    },
  });
}

function imageModeHeaders(contentType: string): HeadersInit {
  return {
    'content-type': contentType,
    'Cache-Control': `public, max-age=${EDGE_CACHE_TTL}`,
    Vary: 'Accept',
  };
}

function imageRedirectResponse(targetUrl: string): Response {
  return new Response(null, {
    status: 302,
    headers: {
      Location: targetUrl,
      'Cache-Control': `public, max-age=${EDGE_CACHE_TTL}`,
      Vary: 'Accept',
    },
  });
}

function wantsJsonResponse(request: Request, searchParams: URLSearchParams): boolean {
  if (searchParams.get('format') === 'json') {
    return true;
  }

  const accept = request.headers.get('accept') ?? '';
  return accept.toLowerCase().includes('application/json');
}

function placeholderSvgResponse(status = 200): Response {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="640" viewBox="0 0 640 640" role="img" aria-label="Image produit indisponible"><rect width="640" height="640" fill="#f3f4f6"/><g fill="none" stroke="#9ca3af" stroke-width="24" stroke-linecap="round" stroke-linejoin="round"><rect x="120" y="150" width="400" height="300" rx="24"/><path d="M165 395l92-92 74 74 54-54 90 90"/><circle cx="250" cy="240" r="38"/></g><text x="320" y="520" text-anchor="middle" fill="#6b7280" font-family="Arial, Helvetica, sans-serif" font-size="36">Image indisponible</text></svg>`;

  return new Response(svg, {
    status,
    headers: imageModeHeaders('image/svg+xml; charset=utf-8'),
  });
}

export const onRequestGet: PagesFunction = async ({ request }) => {
  const url = new URL(request.url);
  const ean = (url.searchParams.get('ean') ?? url.searchParams.get('barcode') ?? '').trim();
  const category = url.searchParams.get('category');
  const accept = request.headers.get('accept') ?? '';
  const wantsJson = wantsJsonResponse(request, url.searchParams);

  if (!ean) {
    const placeholder = getPlaceholderUrl(category);
    if (wantsJson) {
      return jsonResponse({ url: placeholder, source: 'placeholder' });
    }

    return imageRedirectResponse(placeholder);
  }

  const cache = caches.default;
  const cacheKey = new Request(url.toString(), {
    method: 'GET',
    headers: { Accept: accept },
  });
  const cached = await cache.match(cacheKey);

  if (cached) {
    return cached;
  }

  const offUrl = `${OFF_BASE_URL}/api/v2/product/${encodeURIComponent(ean)}.json`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(offUrl, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'User-Agent': 'A-KI-PRI-SA-YE (contact: support@akiprisaye.app)',
      },
    });

    let body: { url?: string; source: ImageSource };

    if (response.ok) {
      const payload = (await response.json()) as OffProductResponse;
      const offImage = extractOffImageUrl(payload);

      if (offImage) {
        body = { url: offImage, source: 'off' };
      } else {
        body = { url: getPlaceholderUrl(category), source: 'placeholder' };
      }
    } else {
      body = { url: getPlaceholderUrl(category), source: 'placeholder' };
    }

    let result: Response;
    if (wantsJson) {
      result = jsonResponse(body);
    } else if (body.url) {
      result = imageRedirectResponse(body.url);
    } else {
      result = placeholderSvgResponse();
    }

    await cache.put(cacheKey, result.clone());
    return result;
  } catch {
    const placeholder = getPlaceholderUrl(category);
    if (wantsJson) {
      return jsonResponse({ url: placeholder, source: 'placeholder' });
    }

    return imageRedirectResponse(placeholder);
  } finally {
    clearTimeout(timeoutId);
  }
};
