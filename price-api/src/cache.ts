import type { Env } from './types';

function hex(input: string): string {
  return Array.from(new TextEncoder().encode(input))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export function buildEtag(seed: string): string {
  return `W/\"${hex(seed)}\"`;
}

export function withCommonHeaders(body: BodyInit | null, init: ResponseInit, env: Env): Response {
  const ttl = Number(env.CACHE_TTL_SECONDS ?? '21600');
  const headers = new Headers(init.headers);
  headers.set('Cache-Control', `public, max-age=${ttl}`);
  headers.set('Content-Type', 'application/json; charset=utf-8');
  return new Response(body, { ...init, headers });
}

export async function readFromCache(request: Request): Promise<Response | null> {
  return (await (caches as CacheStorage & { default: Cache }).default.match(request)) ?? null;
}

export async function writeToCache(request: Request, response: Response): Promise<void> {
  await (caches as CacheStorage & { default: Cache }).default.put(request, response.clone());
}
