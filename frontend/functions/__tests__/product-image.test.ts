import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { onRequestGet } from '../api/product-image';

function makeRequest(path: string, accept = 'text/html'): Request {
  return new Request(`https://example.com${path}`, {
    headers: { Accept: accept },
  });
}

describe('/api/product-image content negotiation', () => {
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

  it('returns redirect for browser requests (Accept: text/html)', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ status: 0 }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );

    const response = await onRequestGet({ request: makeRequest('/api/product-image?ean=3274080005003&v=1', 'text/html') } as never);

    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe('/assets/placeholders/placeholder-default.svg');
    expect(response.headers.get('cache-control')).toContain('max-age=');
    expect(response.headers.get('vary')).toContain('Accept');
  });

  it('returns redirect for image clients (Accept: image/*)', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ status: 0 }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );

    const response = await onRequestGet({ request: makeRequest('/api/product-image?ean=3274080005003&v=1', 'image/*') } as never);

    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe('/assets/placeholders/placeholder-default.svg');
    expect(response.headers.get('cache-control')).toContain('max-age=');
    expect(response.headers.get('vary')).toContain('Accept');
  });

  it('returns redirect for wildcard Accept and fallback is still an image', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ status: 0 }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );

    const response = await onRequestGet({ request: makeRequest('/api/product-image?ean=3274080005003&v=1', '*/*') } as never);

    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe('/assets/placeholders/placeholder-default.svg');
    expect(response.headers.get('content-type')).toBeNull();
  });

  it('returns JSON when format=json is provided', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ status: 0 }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );

    const response = await onRequestGet({ request: makeRequest('/api/product-image?ean=3274080005003&format=json&v=1', 'text/html') } as never);
    const body = await response.json() as { source: string; url?: string };

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');
    expect(response.headers.get('cache-control')).toContain('max-age=');
    expect(response.headers.get('vary')).toContain('Accept');
    expect(body.source).toBe('placeholder');
    expect(body.url).toBe('/assets/placeholders/placeholder-default.svg');
  });

  it('returns JSON when Accept requests application/json', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ status: 0 }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );

    const response = await onRequestGet({ request: makeRequest('/api/product-image?ean=3274080005003&v=1', 'application/json') } as never);

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');
    expect(response.headers.get('cache-control')).toContain('max-age=');
    expect(response.headers.get('vary')).toContain('Accept');
    await expect(response.json()).resolves.toMatchObject({ source: 'placeholder' });
  });
});
