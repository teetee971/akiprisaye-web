import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createProductImageHandler } from '../api/product-image';

function makeRequest(path: string, accept = 'text/html'): Request {
  return new Request(`https://example.com${path}`, {
    headers: { Accept: accept },
  });
}

describe('/api/product-image', () => {
  const cacheStore = new Map<string, Response>();

  beforeEach(() => {
    cacheStore.clear();
    vi.restoreAllMocks();

    const cacheApi = {
      match: vi.fn(async (request: Request) => cacheStore.get(`${request.url}|${request.headers.get('accept') ?? ''}`)),
      put: vi.fn(async (request: Request, response: Response) => {
        cacheStore.set(`${request.url}|${request.headers.get('accept') ?? ''}`, response);
      }),
    };

    Object.defineProperty(globalThis, 'caches', {
      configurable: true,
      value: { default: cacheApi },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('redirects to OFF image and exposes debug headers', async () => {
    const imageUrl = 'https://images.openfoodfacts.org/images/products/301/762/042/2003/front_fr.400.jpg';
    const handler = createProductImageHandler(async () => new Response(JSON.stringify({
      status: 1,
      product: { image_url: imageUrl },
    }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }));

    const response = await handler({ request: makeRequest('/api/product-image?ean=3017620422003&v=1', 'text/html') } as never);

    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe(imageUrl);
    expect(response.headers.get('x-akps-source')).toBe('openfoodfacts');
    expect(response.headers.get('x-akps-reason')).toBe('ok');
    expect(response.headers.get('x-akps-selected')).toBe('thumb');
  });

  it('maps OFF 403 and 429 to placeholder with explicit reasons', async () => {
    const handler403 = createProductImageHandler(async () => new Response('', { status: 403 }));
    const response403 = await handler403({ request: makeRequest('/api/product-image?ean=3017620422003&v=1', 'text/html') } as never);

    expect(response403.status).toBe(302);
    expect(response403.headers.get('location')).toBe('/assets/placeholders/placeholder-default.svg');
    expect(response403.headers.get('x-akps-reason')).toBe('forbidden');

    const handler429 = createProductImageHandler(async () => new Response('', { status: 429 }));
    const response429 = await handler429({ request: makeRequest('/api/product-image?ean=3017620422003&v=2', 'text/html') } as never);

    expect(response429.status).toBe(302);
    expect(response429.headers.get('x-akps-reason')).toBe('rate_limited');
  });

  it('returns timeout reason when OFF fetch aborts', async () => {
    const abortError = Object.assign(new Error('aborted'), { name: 'AbortError' });
    const handler = createProductImageHandler(async () => { throw abortError; });

    const response = await handler({ request: makeRequest('/api/product-image?barcode=3017620422003&format=json&v=1', 'text/html') } as never);
    const body = await response.json() as { reason: string; redirect_to: string };

    expect(response.status).toBe(200);
    expect(body.reason).toBe('timeout');
    expect(body.redirect_to).toBe('/assets/placeholders/placeholder-default.svg');
    expect(response.headers.get('x-akps-reason')).toBe('timeout');
  });


  it('caches network-error fallback responses to avoid repeated OFF calls', async () => {
    const offFetch = vi.fn(async () => {
      throw new Error('network down');
    });
    const handler = createProductImageHandler(offFetch as never);

    const first = await handler({ request: makeRequest('/api/product-image?barcode=3017620422003&v=cache-1', 'text/html') } as never);
    const second = await handler({ request: makeRequest('/api/product-image?barcode=3017620422003&v=cache-1', 'text/html') } as never);

    expect(first.status).toBe(302);
    expect(first.headers.get('x-akps-reason')).toBe('network_error');
    expect(second.status).toBe(302);
    expect(offFetch).toHaveBeenCalledTimes(1);
  });

  it('returns detailed json payload when format=json is requested', async () => {
    const imageUrl = 'https://images.openfoodfacts.org/images/products/301/762/042/2003/front_en.200.jpg';
    const handler = createProductImageHandler(async () => new Response(JSON.stringify({
      status: 1,
      product: {
        selected_images: {
          front: {
            display: { en: imageUrl },
          },
        },
      },
    }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }));

    const response = await handler({ request: makeRequest('/api/product-image?barcode=3017620422003&format=json&v=1', 'text/html') } as never);
    const body = await response.json() as {
      ok: boolean;
      source: string;
      reason: string;
      status?: number;
      image_url?: string;
      redirect_to: string;
    };

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.source).toBe('openfoodfacts');
    expect(body.reason).toBe('ok');
    expect(body.status).toBe(200);
    expect(body.image_url).toBe(imageUrl);
    expect(body.redirect_to).toBe(imageUrl);
  });
});
