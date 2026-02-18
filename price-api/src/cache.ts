export function buildEtag(fingerprint: string): string {
  const bytes = new TextEncoder().encode(fingerprint);
  let hash = 0;
  for (const byte of bytes) {
    hash = (hash << 5) - hash + byte;
    hash |= 0;
  }

  return `W/\"${Math.abs(hash)}\"`;
}

export function shouldReturnNotModified(request: Request, etag: string): boolean {
  const ifNoneMatch = request.headers.get('If-None-Match');
  return Boolean(ifNoneMatch && ifNoneMatch === etag);
}

export async function fromCache(request: Request): Promise<Response | null> {
  const cache = caches.default;
  return (await cache.match(request)) ?? null;
}

export async function storeInCache(request: Request, response: Response): Promise<void> {
  const cache = caches.default;
  await cache.put(request, response.clone());
}
