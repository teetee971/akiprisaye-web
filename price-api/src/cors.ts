import type { Env } from './types';

const DEFAULT_ALLOWED = ['https://akiprisaye-web.pages.dev'];

export const getAllowedOrigins = (env: Env): string[] => {
  const fromEnv = env.ALLOWED_ORIGINS
    ? env.ALLOWED_ORIGINS.split(',')
        .map((origin) => origin.trim())
        .filter(Boolean)
    : [];

  return Array.from(new Set([...DEFAULT_ALLOWED, ...fromEnv]));
};

export const buildCorsHeaders = (request: Request, env: Env): Record<string, string> => {
  const origin = request.headers.get('Origin');
  const allowedOrigins = getAllowedOrigins(env);
  const allowOrigin = origin && allowedOrigins.includes(origin) ? origin : DEFAULT_ALLOWED[0];

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization,If-None-Match',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
};

export const withCors = (response: Response, request: Request, env: Env): Response => {
  const headers = new Headers(response.headers);
  const corsHeaders = buildCorsHeaders(request, env);
  Object.entries(corsHeaders).forEach(([key, value]) => headers.set(key, value));
  return new Response(response.body, { ...response, headers });
};
