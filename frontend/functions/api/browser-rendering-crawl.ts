import { errorResponse, handleOptions, jsonResponse, methodGuard, parseJson, parseQuery, softRateLimit } from '../_lib/http';

type Env = {
  CLOUDFLARE_ACCOUNT_ID?: string;
  CLOUDFLARE_BROWSER_RENDERING_API_TOKEN?: string;
  BROWSER_RENDERING_SHARED_SECRET?: string;
};

type CrawlRequestBody = {
  url?: unknown;
  limit?: unknown;
  depth?: unknown;
  source?: unknown;
  render?: unknown;
  formats?: unknown;
  maxAge?: unknown;
  modifiedSince?: unknown;
  options?: unknown;
} & Record<string, unknown>;

const CLOUDFLARE_API_BASE = 'https://api.cloudflare.com/client/v4/accounts';
const ALLOWED_FILTER_STATUSES = new Set(['queued', 'completed', 'disallowed', 'skipped', 'errored', 'cancelled']);
const ALLOWED_SOURCES = new Set(['all', 'sitemaps', 'links']);
const ALLOWED_FORMATS = new Set(['html', 'markdown', 'json']);
const MAX_CRAWL_LIMIT = 50;
const MAX_DEPTH = 25;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const readEnv = (env: Env | undefined) => {
  const accountId = env?.CLOUDFLARE_ACCOUNT_ID?.trim();
  const apiToken = env?.CLOUDFLARE_BROWSER_RENDERING_API_TOKEN?.trim();
  const sharedSecret = env?.BROWSER_RENDERING_SHARED_SECRET?.trim();
  return { accountId, apiToken, sharedSecret };
};

const getBearerToken = (request: Request) => {
  const auth = request.headers.get('authorization') ?? request.headers.get('Authorization') ?? '';
  if (!auth.startsWith('Bearer ')) return null;
  return auth.slice('Bearer '.length).trim();
};

const requireAuthorization = (request: Request, env: Env | undefined) => {
  const token = getBearerToken(request);
  const { sharedSecret } = readEnv(env);

  if (!sharedSecret) {
    return errorResponse('SERVICE_UNAVAILABLE', 'Browser Rendering auth secret is not configured', {
      status: 503,
      request,
    });
  }

  if (!token || token !== sharedSecret) {
    return errorResponse('UNAUTHORIZED', 'Missing or invalid bearer token', {
      status: 401,
      request,
      headers: { 'WWW-Authenticate': 'Bearer' },
    });
  }

  return null;
};

const requireCloudflareConfig = (request: Request, env: Env | undefined) => {
  const { accountId, apiToken } = readEnv(env);
  if (!accountId || !apiToken) {
    return {
      error: errorResponse(
        'SERVICE_UNAVAILABLE',
        'Cloudflare Browser Rendering is not configured',
        { status: 503, request },
      ),
    };
  }

  return { accountId, apiToken };
};

const parsePositiveInteger = (value: unknown, fallback: number, max: number) => {
  const numeric = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
  if (!Number.isFinite(numeric)) return fallback;
  return Math.min(max, Math.max(1, Math.trunc(numeric)));
};

const normalizeStartPayload = (payload: CrawlRequestBody) => {
  const rawUrl = typeof payload.url === 'string' ? payload.url.trim() : '';
  if (!rawUrl) {
    return { error: ['url is required'] };
  }

  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return { error: ['url must be a valid absolute URL'] };
  }

  if (!['http:', 'https:'].includes(url.protocol)) {
    return { error: ['url must use http or https'] };
  }

  const normalized: Record<string, unknown> = {
    ...payload,
    url: url.toString(),
  };

  if (typeof payload.limit !== 'undefined') {
    normalized.limit = parsePositiveInteger(payload.limit, 10, MAX_CRAWL_LIMIT);
  }

  if (typeof payload.depth !== 'undefined') {
    normalized.depth = parsePositiveInteger(payload.depth, 1, MAX_DEPTH);
  }

  if (typeof payload.render !== 'undefined') {
    if (typeof payload.render !== 'boolean') {
      return { error: ['render must be a boolean when provided'] };
    }
    normalized.render = payload.render;
  }

  if (typeof payload.source !== 'undefined') {
    if (typeof payload.source !== 'string' || !ALLOWED_SOURCES.has(payload.source)) {
      return { error: ['source must be one of: all, sitemaps, links'] };
    }
    normalized.source = payload.source;
  }

  if (typeof payload.formats !== 'undefined') {
    if (!Array.isArray(payload.formats) || payload.formats.length === 0) {
      return { error: ['formats must be a non-empty array when provided'] };
    }

    const formats = payload.formats
      .filter((format): format is string => typeof format === 'string')
      .map((format) => format.toLowerCase())
      .filter((format) => ALLOWED_FORMATS.has(format));

    if (formats.length === 0) {
      return { error: ['formats must contain at least one of: html, markdown, json'] };
    }

    normalized.formats = [...new Set(formats)];
  }

  return { payload: normalized };
};

const buildUpstreamUrl = (accountId: string, jobId?: string, query?: URLSearchParams) => {
  const base = new URL(`${CLOUDFLARE_API_BASE}/${encodeURIComponent(accountId)}/browser-rendering/crawl${jobId ? `/${encodeURIComponent(jobId)}` : ''}`);

  if (query) {
    const limit = query.get('limit');
    const cursor = query.get('cursor');
    const status = query.get('status');

    if (limit) base.searchParams.set('limit', String(parsePositiveInteger(limit, 10, 100)));
    if (cursor) base.searchParams.set('cursor', cursor);
    if (status) {
      if (!ALLOWED_FILTER_STATUSES.has(status)) {
        return { error: 'status must be one of: queued, completed, disallowed, skipped, errored, cancelled' };
      }
      base.searchParams.set('status', status);
    }
  }

  return { url: base.toString() };
};

const proxyCloudflare = async (request: Request, env: Env | undefined, init: RequestInit, upstreamUrl: string) => {
  const config = requireCloudflareConfig(request, env);
  if ('error' in config) return config.error;

  const upstream = await fetch(upstreamUrl, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiToken}`,
      ...(init.headers ?? {}),
    },
  });

  let body: unknown = null;
  try {
    body = await upstream.json();
  } catch {
    body = null;
  }

  const success = isRecord(body) && body.success === false ? false : true;

  if (!upstream.ok || !success) {
    return errorResponse('UPSTREAM_ERROR', 'Cloudflare Browser Rendering request failed', {
      status: upstream.ok ? 502 : upstream.status,
      request,
      details: body ?? { upstreamUrl },
    });
  }

  return jsonResponse(
    {
      ok: true,
      provider: 'cloudflare-browser-rendering',
      upstream: body,
    },
    {
      status: init.method === 'POST' ? 202 : 200,
      request,
      cache: 'no-store',
    },
  );
};

export const onRequestOptions: PagesFunction = async ({ request }) =>
  handleOptions(request, ['GET', 'POST']) ?? new Response(null, { status: 204 });

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const optionsResponse = handleOptions(request, ['GET', 'POST']);
  if (optionsResponse) return optionsResponse;

  const blocked = methodGuard(request, ['GET']);
  if (blocked) return blocked;

  const unauthorized = requireAuthorization(request, env);
  if (unauthorized) return unauthorized;

  const rateLimited = softRateLimit(request, { maxRequests: 60, windowMs: 60_000 });
  if (!rateLimited.ok) {
    return errorResponse('RATE_LIMITED', 'Too many crawl status requests', {
      status: 429,
      request,
      headers: { 'Retry-After': String(rateLimited.retryAfter) },
    });
  }

  const query = parseQuery(request);
  const jobId = (query.get('id') ?? '').trim();
  if (!jobId) {
    return errorResponse('MISSING_PARAM', 'Missing required query parameter: id', {
      status: 400,
      request,
    });
  }

  const upstream = buildUpstreamUrl(readEnv(env).accountId ?? '', jobId, query);
  if ('error' in upstream) {
    return errorResponse('INVALID_INPUT', upstream.error, {
      status: 400,
      request,
    });
  }

  return proxyCloudflare(request, env, { method: 'GET' }, upstream.url);
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const optionsResponse = handleOptions(request, ['GET', 'POST']);
  if (optionsResponse) return optionsResponse;

  const blocked = methodGuard(request, ['POST']);
  if (blocked) return blocked;

  const unauthorized = requireAuthorization(request, env);
  if (unauthorized) return unauthorized;

  const rateLimited = softRateLimit(request, { maxRequests: 20, windowMs: 60_000 });
  if (!rateLimited.ok) {
    return errorResponse('RATE_LIMITED', 'Too many crawl start requests', {
      status: 429,
      request,
      headers: { 'Retry-After': String(rateLimited.retryAfter) },
    });
  }

  let payload: CrawlRequestBody;
  try {
    payload = await parseJson<CrawlRequestBody>(request, { maxBytes: 32 * 1024 });
  } catch (error) {
    return errorResponse('INVALID_JSON', error instanceof Error ? error.message : 'Invalid JSON body', {
      status: 400,
      request,
    });
  }

  if (!isRecord(payload)) {
    return errorResponse('INVALID_INPUT', 'JSON body must be an object', {
      status: 400,
      request,
    });
  }

  const normalized = normalizeStartPayload(payload);
  if ('error' in normalized) {
    return errorResponse('INVALID_INPUT', 'Invalid crawl request payload', {
      status: 400,
      request,
      details: normalized.error,
    });
  }

  const accountId = readEnv(env).accountId ?? '';
  const upstream = buildUpstreamUrl(accountId);
  if ('error' in upstream) {
    return errorResponse('INVALID_INPUT', upstream.error, {
      status: 400,
      request,
    });
  }

  return proxyCloudflare(
    request,
    env,
    {
      method: 'POST',
      body: JSON.stringify(normalized.payload),
    },
    upstream.url,
  );
};
