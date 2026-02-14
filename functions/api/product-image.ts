const OFF_BASE_URL = 'https://world.openfoodfacts.org';
const EDGE_CACHE_TTL = 7 * 24 * 60 * 60;
const FETCH_TIMEOUT_MS = 5000;

type ImageSource = 'off' | 'placeholder' | 'none';

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

function getPlaceholderUrl(category?: string | null): string | undefined {
  if (!category || !category.trim()) {
    return undefined;
  }

  return PLACEHOLDER_BY_CATEGORY[normalizeCategory(category)] ?? '/assets/placeholders/placeholder-default.svg';
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
    },
  });
}

export const onRequestGet: PagesFunction = async ({ request }) => {
  const url = new URL(request.url);
  const ean = (url.searchParams.get('ean') ?? '').trim();
  const category = url.searchParams.get('category');

  if (!ean) {
    const placeholder = getPlaceholderUrl(category);
    return jsonResponse(placeholder
      ? { url: placeholder, source: 'placeholder' }
      : { source: 'none' });
  }

  const cache = caches.default;
  const cacheKey = new Request(url.toString(), { method: 'GET' });
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
        const placeholder = getPlaceholderUrl(category);
        body = placeholder ? { url: placeholder, source: 'placeholder' } : { source: 'none' };
      }
    } else {
      const placeholder = getPlaceholderUrl(category);
      body = placeholder ? { url: placeholder, source: 'placeholder' } : { source: 'none' };
    }

    const result = jsonResponse(body);
    await cache.put(cacheKey, result.clone());
    return result;
  } catch {
    const placeholder = getPlaceholderUrl(category);
    return jsonResponse(placeholder ? { url: placeholder, source: 'placeholder' } : { source: 'none' });
  } finally {
    clearTimeout(timeoutId);
  }
};
