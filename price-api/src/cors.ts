import type { Env } from './types';

const LOCALHOST_ALLOWLIST = new Set([
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
]);

function normalizeOrigin(origin: string): string {
  return origin.trim().replace(/\/$/, '');
}

export function isOriginAllowed(origin: string | null, env: Env): boolean {
  if (!origin) {
    return false;
  }

  const normalized = normalizeOrigin(origin);
  if (LOCALHOST_ALLOWLIST.has(normalized)) {
    return true;
  }

  const fromEnv = (env.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map(normalizeOrigin)
    .filter(Boolean);

  return fromEnv.includes(normalized);
}

export function buildCorsHeaders(origin: string | null, env: Env): Headers {
  const headers = new Headers({
    Vary: 'Origin',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization,If-None-Match',
    'Access-Control-Max-Age': '86400',
  });

  if (isOriginAllowed(origin, env)) {
    headers.set('Access-Control-Allow-Origin', normalizeOrigin(origin!));
  }

  return headers;
}

export function withCors(response: Response, origin: string | null, env: Env): Response {
  const headers = new Headers(response.headers);
  const corsHeaders = buildCorsHeaders(origin, env);
  corsHeaders.forEach((value, key) => headers.set(key, value));
  return new Response(response.body, {
    status: response.status,
    headers,
  });
}
