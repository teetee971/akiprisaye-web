export type CacheMode = 'no-store' | 'short' | 'medium';

export type JsonResponseOptions = {
  status?: number;
  headers?: HeadersInit;
  cache?: CacheMode;
  request?: Request;
  origin?: string | null;
};

export type ErrorResponseOptions = JsonResponseOptions & {
  details?: unknown;
  requestId?: string;
};

export type ParseJsonOptions = {
  maxBytes?: number;
};

const CACHE_BY_MODE: Record<CacheMode, string> = {
  'no-store': 'no-store',
  short: 'public, max-age=60',
  medium: 'public, max-age=300',
};

const RATE_LIMIT_BUCKETS = new Map<string, { count: number; resetAt: number }>();

const shortId = () => Math.random().toString(36).slice(2, 10);

const sameOrigin = (request: Request) => {
  try {
    return new URL(request.url).origin;
  } catch {
    return null;
  }
};

const isAllowedOrigin = (origin: string, request: Request, allowlist: string[] = []) => {
  const requestOrigin = sameOrigin(request);
  if (requestOrigin && origin === requestOrigin) return true;
  if (origin.endsWith('.pages.dev')) return true;
  if (origin.endsWith('.github.io')) return true;
  return allowlist.includes(origin);
};

export const setCacheHeaders = (mode: CacheMode = 'no-store') => ({
  'Cache-Control': CACHE_BY_MODE[mode],
});

export const getRequestId = (request: Request): string => request.headers.get('cf-ray') ?? shortId();

export const parseQuery = (request: Request) => new URL(request.url).searchParams;

export const corsHeaders = (request: Request, origin?: string | null, allowlist: string[] = []): Record<string, string> => {
  const resolvedOrigin = origin ?? request.headers.get('Origin');
  if (!resolvedOrigin || !isAllowedOrigin(resolvedOrigin, request, allowlist)) {
    return {
      'Vary': 'Origin',
    };
  }

  return {
    'Access-Control-Allow-Origin': resolvedOrigin,
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
};

export const jsonResponse = (data: unknown, options: JsonResponseOptions = {}) => {
  const { status = 200, headers, cache = 'no-store', request, origin } = options;
  const merged = new Headers({
    'Content-Type': 'application/json; charset=utf-8',
    ...setCacheHeaders(cache),
  });

  if (request) {
    Object.entries(corsHeaders(request, origin)).forEach(([k, v]) => merged.set(k, v));
  }

  new Headers(headers).forEach((value, key) => merged.set(key, value));
  return new Response(JSON.stringify(data), { status, headers: merged });
};

export const errorResponse = (
  code: string,
  message: string,
  options: ErrorResponseOptions = {},
) => {
  const requestId = options.requestId ?? (options.request ? getRequestId(options.request) : shortId());
  const payload: Record<string, unknown> = {
    ok: false,
    code,
    message,
    requestId,
  };

  if (typeof options.details !== 'undefined') {
    payload.details = options.details;
  }

  return jsonResponse(payload, {
    status: options.status ?? 400,
    headers: options.headers,
    cache: options.cache,
    request: options.request,
    origin: options.origin,
  });
};

export const methodGuard = (request: Request, allowed: string[]) => {
  const method = request.method.toUpperCase();
  if (method === 'OPTIONS' || allowed.includes(method)) {
    return null;
  }

  return errorResponse('METHOD_NOT_ALLOWED', `Method ${method} not allowed`, {
    status: 405,
    request,
    headers: {
      Allow: ['OPTIONS', ...allowed].join(', '),
    },
  });
};

export const handleOptions = (request: Request, allowed: string[]) => {
  if (request.method.toUpperCase() !== 'OPTIONS') return null;

  return new Response(null, {
    status: 204,
    headers: {
      ...corsHeaders(request),
      Allow: ['OPTIONS', ...allowed].join(', '),
    },
  });
};

export const parseJson = async <T = unknown>(request: Request, options: ParseJsonOptions = {}): Promise<T> => {
  const maxBytes = options.maxBytes ?? 64 * 1024;
  const contentLength = Number(request.headers.get('content-length') ?? '0');
  if (contentLength > maxBytes) {
    throw new Error('JSON_TOO_LARGE');
  }

  const body = await request.text();
  const bytes = new TextEncoder().encode(body).byteLength;
  if (bytes > maxBytes) {
    throw new Error('JSON_TOO_LARGE');
  }

  try {
    return JSON.parse(body) as T;
  } catch {
    throw new Error('INVALID_JSON');
  }
};

export const softRateLimit = (
  request: Request,
  options: { windowMs?: number; maxRequests?: number } = {},
): { ok: true } | { ok: false; retryAfter: number } => {
  const ip = request.headers.get('cf-connecting-ip');
  if (!ip) return { ok: true };

  const now = Date.now();
  const windowMs = options.windowMs ?? 60_000;
  const maxRequests = options.maxRequests ?? 60;

  for (const [key, entry] of RATE_LIMIT_BUCKETS.entries()) {
    if (entry.resetAt <= now) RATE_LIMIT_BUCKETS.delete(key);
  }

  const existing = RATE_LIMIT_BUCKETS.get(ip);
  if (!existing || existing.resetAt <= now) {
    RATE_LIMIT_BUCKETS.set(ip, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }

  if (existing.count >= maxRequests) {
    return { ok: false, retryAfter: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)) };
  }

  existing.count += 1;
  return { ok: true };
};

export const clearRateLimitBuckets = () => {
  RATE_LIMIT_BUCKETS.clear();
};
