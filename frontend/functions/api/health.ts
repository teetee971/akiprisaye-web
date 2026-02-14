import { getRequestId, handleOptions, jsonResponse, methodGuard } from '../_lib/http';
import { logInfo } from '../_lib/log';

export const onRequestOptions: PagesFunction = async ({ request }) => handleOptions(request, ['GET']) ?? new Response(null, { status: 204 });

export const onRequestGet: PagesFunction = async ({ request }) => {
  const t0 = Date.now();
  const requestId = getRequestId(request);

  const blocked = methodGuard(request, ['GET']);
  if (blocked) return blocked;

  const response = jsonResponse(
    {
      status: 'ok',
      service: 'cloudflare-pages-functions',
      timestamp: new Date().toISOString(),
      requestId,
    },
    { status: 200, request, cache: 'no-store' },
  );

  logInfo('health', {
    requestId,
    endpoint: '/api/health',
    status: response.status,
    durationMs: Date.now() - t0,
  });

  return response;
};
