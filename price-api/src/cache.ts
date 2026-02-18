const TTL_SECONDS = 6 * 60 * 60;

const encoder = new TextEncoder();

const toHex = (buffer: ArrayBuffer): string =>
  Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

const getCache = (): Promise<Cache> => caches.open('price-api-cache');

export const createEtag = async (payload: unknown): Promise<string> => {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(JSON.stringify(payload)));
  return `W/"${toHex(digest).slice(0, 24)}"`;
};

export const buildJsonResponse = async (payload: unknown, status = 200): Promise<Response> => {
  const etag = await createEtag(payload);
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': `public, max-age=${TTL_SECONDS}`,
      ETag: etag,
    },
  });
};

export const maybeReturnNotModified = (request: Request, etag: string): Response | null => {
  const ifNoneMatch = request.headers.get('If-None-Match');
  if (ifNoneMatch && ifNoneMatch === etag) {
    return new Response(null, { status: 304, headers: { ETag: etag } });
  }
  return null;
};

export const getCacheKey = (request: Request): Request => new Request(request.url, { method: 'GET' });

export const readCache = async (request: Request): Promise<Response | undefined> => {
  const cache = await getCache();
  return cache.match(getCacheKey(request));
};

export const writeCache = async (request: Request, response: Response): Promise<void> => {
  const cache = await getCache();
  await cache.put(getCacheKey(request), response.clone());
};
