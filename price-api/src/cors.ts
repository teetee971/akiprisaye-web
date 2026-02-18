import type { Env } from './types';

function getAllowedOrigins(env: Env): string[] {
  const value = env.ALLOWED_ORIGINS ?? '';
  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function getCorsOrigin(req: Request, env: Env): string | null {
  const origin = req.headers.get('Origin');
  if (!origin) return null;

  const allowed = getAllowedOrigins(env);
  return allowed.includes(origin) ? origin : null;
}

export function corsHeaders(origin: string | null): HeadersInit {
  const base: Record<string, string> = {
    'Vary': 'Origin',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };

  if (origin) {
    base['Access-Control-Allow-Origin'] = origin;
  }

  return base;
}

export function preflight(req: Request, env: Env): Response {
  const origin = getCorsOrigin(req, env);
  return new Response(null, { status: 204, headers: corsHeaders(origin) });
}

export function assertOriginAllowed(req: Request, env: Env): void {
  const origin = req.headers.get('Origin');
  if (!origin) return;

  if (!getCorsOrigin(req, env)) {
    throw new Error('Origin not allowed');
  }
}
