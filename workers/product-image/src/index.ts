/**
 * Cloudflare Worker — product image lookup by receipt label text.
 *
 * Endpoint:  GET /api/product-image?q=<label>&lang=fr&limit=1
 *
 * Lookup pipeline (all free, no API keys required):
 *   1. Cloudflare Cache API  (keyed by normalised query)
 *   2. OpenFoodFacts text search
 *   3. Wikimedia Commons image search
 *   4. null fallback
 *
 * See docs/PRODUCT_IMAGE_LOOKUP.md for full documentation.
 */

import { normalizeQuery } from './normalizer';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_Q_LENGTH = 200;
const FETCH_TIMEOUT_MS = 6000;
const CACHE_TTL_SECONDS = 3600; // 1 hour

const OFF_SEARCH_URL = 'https://world.openfoodfacts.org/cgi/search.pl';
const WIKIMEDIA_API_URL = 'https://commons.wikimedia.org/w/api.php';
const USER_AGENT =
  'akiprisaye-web/1.0 (https://github.com/teetee971/akiprisaye-web; contact@akiprisaye.fr)';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Env {
  /** Optional bearer token. When set, every request must supply it. */
  API_TOKEN?: string;
}

type ImageSource = 'openfoodfacts' | 'wikimedia' | 'none';

interface ProductImageResponse {
  query: string;
  normalizedQuery: string;
  imageUrl: string | null;
  source: ImageSource;
  confidence: number;
  cached: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...corsHeaders(),
    },
  });
}

// ---------------------------------------------------------------------------
// OpenFoodFacts text search
// ---------------------------------------------------------------------------

interface OffProduct {
  image_front_url?: string;
  image_url?: string;
  product_name?: string;
  product_name_fr?: string;
}

interface OffSearchResponse {
  products?: OffProduct[];
}

async function searchOpenFoodFacts(
  query: string,
  lang: string,
  limit: number,
  signal: AbortSignal,
): Promise<string | null> {
  const params = new URLSearchParams({
    search_terms: query,
    search_simple: '1',
    action: 'process',
    json: '1',
    page_size: String(Math.min(limit, 5)),
    fields: 'image_front_url,image_url,product_name,product_name_fr',
    lc: lang,
  });

  try {
    const resp = await fetch(`${OFF_SEARCH_URL}?${params.toString()}`, {
      signal,
      headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
    });
    if (!resp.ok) return null;

    const data = (await resp.json()) as OffSearchResponse;
    const products = Array.isArray(data.products) ? data.products : [];

    for (const p of products) {
      if (p.image_front_url && /^https?:\/\//.test(p.image_front_url)) {
        return p.image_front_url;
      }
      if (p.image_url && /^https?:\/\//.test(p.image_url)) {
        return p.image_url;
      }
    }
    return null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Wikimedia Commons fallback
// ---------------------------------------------------------------------------

interface WikiSearchHit {
  title: string;
}

interface WikiSearchResponse {
  query?: {
    search?: WikiSearchHit[];
  };
}

interface WikiImageInfoPage {
  imageinfo?: Array<{ thumburl?: string; url?: string }>;
}

interface WikiImageInfoResponse {
  query?: {
    pages?: Record<string, WikiImageInfoPage>;
  };
}

async function getWikimediaThumb(title: string, signal: AbortSignal): Promise<string | null> {
  const params = new URLSearchParams({
    action: 'query',
    titles: title,
    prop: 'imageinfo',
    iiprop: 'url',
    iiurlwidth: '300',
    format: 'json',
    origin: '*',
  });

  try {
    const resp = await fetch(`${WIKIMEDIA_API_URL}?${params.toString()}`, { signal });
    if (!resp.ok) return null;

    const data = (await resp.json()) as WikiImageInfoResponse;
    const pages = data.query?.pages ?? {};
    for (const page of Object.values(pages)) {
      const info = page.imageinfo?.[0];
      if (info?.thumburl) return info.thumburl;
      if (info?.url) return info.url;
    }
    return null;
  } catch {
    return null;
  }
}

async function searchWikimedia(query: string, signal: AbortSignal): Promise<string | null> {
  // Append context keywords to improve relevance.
  const searchQuery = `${query} produit packaging`;

  const params = new URLSearchParams({
    action: 'query',
    list: 'search',
    srsearch: searchQuery,
    srnamespace: '6', // File: namespace
    srlimit: '5',
    format: 'json',
    origin: '*',
  });

  try {
    const resp = await fetch(`${WIKIMEDIA_API_URL}?${params.toString()}`, { signal });
    if (!resp.ok) return null;

    const data = (await resp.json()) as WikiSearchResponse;
    const hits = data.query?.search ?? [];

    for (const hit of hits) {
      if (!hit.title.startsWith('File:')) continue;
      const thumbUrl = await getWikimediaThumb(hit.title, signal);
      if (thumbUrl) return thumbUrl;
    }
    return null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // CORS pre-flight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    // Route guard
    if (!url.pathname.endsWith('/api/product-image')) {
      return jsonResponse({ error: 'Not found' }, 404);
    }

    // Method guard
    if (request.method !== 'GET') {
      return jsonResponse({ error: 'Method not allowed' }, 405);
    }

    // Optional bearer-token auth
    if (env.API_TOKEN) {
      const authHeader = request.headers.get('Authorization') ?? '';
      const provided = authHeader.replace(/^Bearer\s+/i, '').trim();
      if (provided !== env.API_TOKEN) {
        return jsonResponse({ error: 'Unauthorized' }, 401);
      }
    }

    // Parse + validate parameters
    const rawQ = url.searchParams.get('q') ?? '';
    const lang = (url.searchParams.get('lang') ?? 'fr').slice(0, 5).replace(/[^a-z]/g, '');
    const limit = Math.max(1, Math.min(5, Number(url.searchParams.get('limit') ?? '1')));

    if (!rawQ.trim()) {
      return jsonResponse({ error: 'Missing required parameter: q' }, 400);
    }
    if (rawQ.length > MAX_Q_LENGTH) {
      return jsonResponse({ error: `Parameter q too long (max ${MAX_Q_LENGTH} characters)` }, 400);
    }

    const normalizedQuery = normalizeQuery(rawQ);
    if (!normalizedQuery) {
      return jsonResponse({ error: 'Query is empty after normalization' }, 400);
    }

    // Cache lookup
    const cacheKey = new Request(
      `https://product-image-cache.internal/${encodeURIComponent(normalizedQuery)}?lang=${lang}&limit=${limit}`,
      { method: 'GET' },
    );
    const cache = caches.default;
    const cached = await cache.match(cacheKey);
    if (cached) {
      const data = (await cached.json()) as ProductImageResponse;
      return jsonResponse({ ...data, cached: true });
    }

    // Shared abort controller for all upstream requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    let imageUrl: string | null = null;
    let source: ImageSource = 'none';
    let confidence = 0;

    try {
      // 1. OpenFoodFacts
      imageUrl = await searchOpenFoodFacts(normalizedQuery, lang, limit, controller.signal);
      if (imageUrl) {
        source = 'openfoodfacts';
        confidence = 0.7;
      }

      // 2. Wikimedia Commons fallback
      if (!imageUrl) {
        imageUrl = await searchWikimedia(normalizedQuery, controller.signal);
        if (imageUrl) {
          source = 'wikimedia';
          confidence = 0.4;
        }
      }
    } finally {
      clearTimeout(timeoutId);
    }

    const result: ProductImageResponse = {
      query: rawQ,
      normalizedQuery,
      imageUrl,
      source,
      confidence,
      cached: false,
    };

    // Store in cache asynchronously
    ctx.waitUntil(
      cache.put(
        cacheKey,
        new Response(JSON.stringify(result), {
          headers: {
            'content-type': 'application/json; charset=utf-8',
            'cache-control': `public, max-age=${CACHE_TTL_SECONDS}`,
          },
        }),
      ),
    );

    return jsonResponse(result);
  },
};
