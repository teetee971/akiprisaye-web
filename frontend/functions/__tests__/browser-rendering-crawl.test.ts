import { afterEach, describe, expect, it, vi } from 'vitest';
import { onRequestGet, onRequestPost } from '../api/browser-rendering-crawl';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('/api/browser-rendering/crawl', () => {
  const env = {
    CLOUDFLARE_ACCOUNT_ID: 'acct_123',
    CLOUDFLARE_BROWSER_RENDERING_API_TOKEN: 'cf_api_token',
    BROWSER_RENDERING_SHARED_SECRET: 'shared_secret',
  };

  it('rejects unauthorized start requests', async () => {
    const response = await onRequestPost({
      request: new Request('https://example.com/api/browser-rendering/crawl', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ url: 'https://example.com/docs' }),
      }),
      env,
    } as never);

    const body = await response.json() as { code: string };
    expect(response.status).toBe(401);
    expect(body.code).toBe('UNAUTHORIZED');
  });

  it('starts a crawl job via Cloudflare Browser Rendering', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      success: true,
      result: 'crawl-job-123',
    }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }));
    vi.stubGlobal('fetch', fetchMock);

    const response = await onRequestPost({
      request: new Request('https://example.com/api/browser-rendering/crawl', {
        method: 'POST',
        headers: {
          authorization: 'Bearer shared_secret',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          url: 'https://example.com/docs',
          limit: 999999,
          depth: 99,
          formats: ['markdown', 'json', 'bad-format'],
          source: 'all',
          render: false,
        }),
      }),
      env,
    } as never);

    const body = await response.json() as { ok: boolean; upstream: { result: string } };
    expect(response.status).toBe(202);
    expect(body.ok).toBe(true);
    expect(body.upstream.result).toBe('crawl-job-123');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.cloudflare.com/client/v4/accounts/acct_123/browser-rendering/crawl');
    expect(init.method).toBe('POST');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer cf_api_token');
    expect(JSON.parse(String(init.body))).toMatchObject({
      url: 'https://example.com/docs',
      limit: 50,
      depth: 25,
      formats: ['markdown', 'json'],
      source: 'all',
      render: false,
    });
  });

  it('rejects invalid payload types before calling Cloudflare', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const response = await onRequestPost({
      request: new Request('https://example.com/api/browser-rendering/crawl', {
        method: 'POST',
        headers: {
          authorization: 'Bearer shared_secret',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          url: 'https://example.com/docs',
          render: 'false',
        }),
      }),
      env,
    } as never);

    const body = await response.json() as { code: string };
    expect(response.status).toBe(400);
    expect(body.code).toBe('INVALID_INPUT');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('forwards advanced Cloudflare crawl options used for structured extraction', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      success: true,
      result: 'crawl-job-advanced',
    }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }));
    vi.stubGlobal('fetch', fetchMock);

    const response = await onRequestPost({
      request: new Request('https://example.com/api/browser-rendering/crawl', {
        method: 'POST',
        headers: {
          authorization: 'Bearer shared_secret',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          url: 'https://example.com/docs',
          limit: 50,
          formats: ['json'],
          modifiedSince: 1704067200,
          jsonOptions: {
            prompt: 'Extract product name, price and stock',
          },
          rejectResourceTypes: ['image', 'stylesheet'],
          authenticate: {
            username: 'demo',
            password: 'demo-pass',
          },
          options: {
            includePatterns: ['https://example.com/docs/**'],
            excludePatterns: ['**/changelog/**'],
          },
        }),
      }),
      env,
    } as never);

    expect(response.status).toBe(202);
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(String(init.body))).toMatchObject({
      url: 'https://example.com/docs',
      limit: 50,
      formats: ['json'],
      modifiedSince: 1704067200,
      jsonOptions: {
        prompt: 'Extract product name, price and stock',
      },
      rejectResourceTypes: ['image', 'stylesheet'],
      authenticate: {
        username: 'demo',
        password: 'demo-pass',
      },
      options: {
        includePatterns: ['https://example.com/docs/**'],
        excludePatterns: ['**/changelog/**'],
      },
    });
  });

  it('returns crawl job status via GET', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      success: true,
      result: { id: 'crawl-job-123', status: 'running', total: 12 },
    }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }));
    vi.stubGlobal('fetch', fetchMock);

    const response = await onRequestGet({
      request: new Request('https://example.com/api/browser-rendering/crawl?id=crawl-job-123&limit=1&status=completed', {
        method: 'GET',
        headers: {
          authorization: 'Bearer shared_secret',
        },
      }),
      env,
    } as never);

    const body = await response.json() as { upstream: { result: { status: string } } };
    expect(response.status).toBe(200);
    expect(body.upstream.result.status).toBe('running');

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.cloudflare.com/client/v4/accounts/acct_123/browser-rendering/crawl/crawl-job-123?limit=1&status=completed');
    expect(init.method).toBe('GET');
  });

  it('fails closed when the shared secret is not configured', async () => {
    const response = await onRequestGet({
      request: new Request('https://example.com/api/browser-rendering/crawl?id=crawl-job-123', {
        method: 'GET',
        headers: {
          authorization: 'Bearer shared_secret',
        },
      }),
      env: {
        CLOUDFLARE_ACCOUNT_ID: 'acct_123',
        CLOUDFLARE_BROWSER_RENDERING_API_TOKEN: 'cf_api_token',
      },
    } as never);

    const body = await response.json() as { code: string };
    expect(response.status).toBe(503);
    expect(body.code).toBe('SERVICE_UNAVAILABLE');
  });
});
