/**
 * Integration-style tests for the product-image worker.
 *
 * Because the Worker uses Cloudflare-specific globals (caches, ExecutionContext),
 * we test the HTTP-level logic by stubbing those globals and the global fetch.
 */

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import worker from '../src/index';
import type { Env } from '../src/index';

// ---------------------------------------------------------------------------
// Minimal stubs for Cloudflare Worker globals
// ---------------------------------------------------------------------------

const cachePutStub = vi.fn().mockResolvedValue(undefined);
const cacheMatchStub = vi.fn().mockResolvedValue(undefined); // no cached entry by default

const cachesStub = {
  default: {
    match: cacheMatchStub,
    put: cachePutStub,
  },
};

vi.stubGlobal('caches', cachesStub);

/** Minimal ExecutionContext that runs waitUntil promises synchronously in tests. */
const ctxStub = {
  waitUntil: (promise: Promise<unknown>) => {
    promise.catch(() => undefined);
  },
  passThroughOnException: () => undefined,
} as unknown as ExecutionContext;

const ENV_EMPTY: Env = {};

// ---------------------------------------------------------------------------
// Fetch mock helpers
// ---------------------------------------------------------------------------

function makeJsonFetch(responses: Map<string, unknown>) {
  return vi.fn(async (input: RequestInfo | URL) => {
    const urlStr = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url;
    for (const [prefix, body] of responses.entries()) {
      if (urlStr.startsWith(prefix)) {
        return new Response(JSON.stringify(body), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      }
    }
    return new Response('Not found', { status: 404 });
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('product-image worker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cacheMatchStub.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ---- CORS pre-flight ----

  it('responds 204 to OPTIONS request', async () => {
    const req = new Request('https://worker.test/api/product-image', { method: 'OPTIONS' });
    const res = await worker.fetch(req, ENV_EMPTY, ctxStub);
    expect(res.status).toBe(204);
    expect(res.headers.get('access-control-allow-origin')).toBe('*');
  });

  // ---- Route guards ----

  it('returns 404 for unknown paths', async () => {
    const req = new Request('https://worker.test/unknown', { method: 'GET' });
    const res = await worker.fetch(req, ENV_EMPTY, ctxStub);
    expect(res.status).toBe(404);
  });

  it('returns 405 for non-GET methods', async () => {
    const req = new Request('https://worker.test/api/product-image?q=test', { method: 'POST' });
    const res = await worker.fetch(req, ENV_EMPTY, ctxStub);
    expect(res.status).toBe(405);
  });

  // ---- Input validation ----

  it('returns 400 when q is missing', async () => {
    const req = new Request('https://worker.test/api/product-image', { method: 'GET' });
    const res = await worker.fetch(req, ENV_EMPTY, ctxStub);
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toMatch(/missing/i);
  });

  it('returns 400 when q is empty', async () => {
    const req = new Request('https://worker.test/api/product-image?q=', { method: 'GET' });
    const res = await worker.fetch(req, ENV_EMPTY, ctxStub);
    expect(res.status).toBe(400);
  });

  it('returns 400 when q is too long', async () => {
    const longQ = 'a'.repeat(201);
    const req = new Request(`https://worker.test/api/product-image?q=${longQ}`, { method: 'GET' });
    const res = await worker.fetch(req, ENV_EMPTY, ctxStub);
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toMatch(/too long/i);
  });

  it('returns 400 when q normalises to empty string (only store name)', async () => {
    // "CRF" alone normalises to "" after store-suffix removal.
    const req = new Request('https://worker.test/api/product-image?q=CRF', { method: 'GET' });
    const res = await worker.fetch(req, ENV_EMPTY, ctxStub);
    expect(res.status).toBe(400);
  });

  // ---- Auth ----

  it('returns 401 when token env is set and no token supplied', async () => {
    const env: Env = { API_TOKEN: 'secret123' };
    const req = new Request('https://worker.test/api/product-image?q=sucre', { method: 'GET' });
    const res = await worker.fetch(req, env, ctxStub);
    expect(res.status).toBe(401);
  });

  it('passes auth when correct bearer token is supplied', async () => {
    const env: Env = { API_TOKEN: 'secret123' };
    vi.stubGlobal(
      'fetch',
      makeJsonFetch(
        new Map([
          [
            'https://world.openfoodfacts.org',
            { products: [{ image_front_url: 'https://images.openfoodfacts.org/test.jpg' }] },
          ],
        ]),
      ),
    );
    const req = new Request('https://worker.test/api/product-image?q=sucre', {
      method: 'GET',
      headers: { Authorization: 'Bearer secret123' },
    });
    const res = await worker.fetch(req, env, ctxStub);
    expect(res.status).toBe(200);
  });

  // ---- Cache hit ----

  it('returns cached: true when cache hits', async () => {
    const cachedPayload = {
      query: 'sucre',
      normalizedQuery: 'sucre',
      imageUrl: 'https://cached.example.com/img.jpg',
      source: 'openfoodfacts',
      confidence: 0.7,
      cached: false,
    };
    cacheMatchStub.mockResolvedValue(
      new Response(JSON.stringify(cachedPayload), {
        headers: { 'content-type': 'application/json' },
      }),
    );
    const req = new Request('https://worker.test/api/product-image?q=sucre', { method: 'GET' });
    const res = await worker.fetch(req, ENV_EMPTY, ctxStub);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { cached: boolean; imageUrl: string };
    expect(body.cached).toBe(true);
    expect(body.imageUrl).toBe('https://cached.example.com/img.jpg');
  });

  // ---- OpenFoodFacts success ----

  it('returns openfoodfacts image when OFF search succeeds', async () => {
    vi.stubGlobal(
      'fetch',
      makeJsonFetch(
        new Map([
          [
            'https://world.openfoodfacts.org',
            { products: [{ image_front_url: 'https://images.openfoodfacts.org/sucre.jpg' }] },
          ],
        ]),
      ),
    );
    const req = new Request('https://worker.test/api/product-image?q=sucre+blanc+500g', {
      method: 'GET',
    });
    const res = await worker.fetch(req, ENV_EMPTY, ctxStub);
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      source: string;
      imageUrl: string;
      confidence: number;
      cached: boolean;
      normalizedQuery: string;
    };
    expect(body.source).toBe('openfoodfacts');
    expect(body.imageUrl).toBe('https://images.openfoodfacts.org/sucre.jpg');
    expect(body.confidence).toBeGreaterThan(0);
    expect(body.cached).toBe(false);
    expect(body.normalizedQuery).toBe('sucre blanc 500g');
  });

  // ---- Wikimedia fallback ----

  it('falls back to wikimedia when OFF returns no image', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string | URL | Request) => {
        const url = typeof input === 'string' ? input : input instanceof Request ? input.url : input.toString();
        const parsedUrl = new URL(url);

        if (parsedUrl.origin === 'https://world.openfoodfacts.org') {
          return new Response(JSON.stringify({ products: [] }), {
            headers: { 'content-type': 'application/json' },
          });
        }

        if (
          parsedUrl.origin === 'https://commons.wikimedia.org' &&
          parsedUrl.pathname === '/w/api.php' &&
          parsedUrl.searchParams.get('action') === 'query' &&
          parsedUrl.searchParams.get('list') === 'search'
        ) {
          return new Response(
            JSON.stringify({ query: { search: [{ title: 'File:Sucre_blanc.jpg' }] } }),
            { headers: { 'content-type': 'application/json' } },
          );
        }

        if (
          parsedUrl.origin === 'https://commons.wikimedia.org' &&
          parsedUrl.pathname === '/w/api.php' &&
          parsedUrl.searchParams.get('action') === 'query' &&
          parsedUrl.searchParams.get('titles') === 'File:Sucre_blanc.jpg'
        ) {
          return new Response(
            JSON.stringify({
              query: {
                pages: {
                  '12345': { imageinfo: [{ thumburl: 'https://upload.wikimedia.org/thumb.jpg' }] },
                },
              },
            }),
            { headers: { 'content-type': 'application/json' } },
          );
        }

        throw new Error(`Unexpected fetch URL in Wikimedia fallback test: ${url}`);
      }),
    );
    const req = new Request('https://worker.test/api/product-image?q=sucre+roux', { method: 'GET' });
    const res = await worker.fetch(req, ENV_EMPTY, ctxStub);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { source: string; imageUrl: string | null };
    expect(body.source).toBe('wikimedia');
    expect(body.imageUrl).toBe('https://upload.wikimedia.org/thumb.jpg');
  });

  // ---- None fallback ----

  it('returns source=none when all upstream searches fail', async () => {
    vi.stubGlobal(
      'fetch',
      makeJsonFetch(new Map()),
    );
    const req = new Request('https://worker.test/api/product-image?q=produit+inconnu', {
      method: 'GET',
    });
    const res = await worker.fetch(req, ENV_EMPTY, ctxStub);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { source: string; imageUrl: null; confidence: number };
    expect(body.source).toBe('none');
    expect(body.imageUrl).toBeNull();
    expect(body.confidence).toBe(0);
  });

  // ---- CORS headers ----

  it('sets CORS headers on successful responses', async () => {
    vi.stubGlobal(
      'fetch',
      makeJsonFetch(new Map([['https://world.openfoodfacts.org', { products: [] }]])),
    );
    const req = new Request('https://worker.test/api/product-image?q=test', { method: 'GET' });
    const res = await worker.fetch(req, ENV_EMPTY, ctxStub);
    expect(res.headers.get('access-control-allow-origin')).toBe('*');
  });

  // ---- Store-suffix stripping is reflected in normalizedQuery ----

  it('strips store suffix from normalizedQuery', async () => {
    vi.stubGlobal('fetch', makeJsonFetch(new Map([['https://world.openfoodfacts.org', { products: [] }]])));
    const req = new Request(
      'https://worker.test/api/product-image?q=SUCRE+BLANC+1KG+CRF',
      { method: 'GET' },
    );
    const res = await worker.fetch(req, ENV_EMPTY, ctxStub);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { normalizedQuery: string };
    expect(body.normalizedQuery).toBe('sucre blanc 1kg');
  });
});
