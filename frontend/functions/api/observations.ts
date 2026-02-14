import { errorResponse, getRequestId, handleOptions, jsonResponse, methodGuard, parseJson, parseQuery } from '../_lib/http';
import { computeStatus, observationDriver, type Observation } from '../_lib/observations';

const ALLOWED_MODES = new Set(['inStore', 'drive', 'delivery']);

export const onRequestOptions: PagesFunction = async ({ request }) => handleOptions(request, ['GET', 'POST']) ?? new Response(null, { status: 204 });

export const onRequestGet: PagesFunction = async ({ request }) => {
  const query = parseQuery(request);
  const territory = (query.get('territory') ?? '').trim().toLowerCase() || undefined;
  const barcode = (query.get('barcode') ?? '').trim() || undefined;
  const q = (query.get('q') ?? '').trim() || undefined;
  const storeId = (query.get('storeId') ?? '').trim() || undefined;
  const modeRaw = (query.get('mode') ?? query.get('serviceMode') ?? '').trim();
  const mode = ALLOWED_MODES.has(modeRaw) ? modeRaw : undefined;

  const observations = observationDriver.list({
    territory,
    barcode,
    q,
  });

  const metadata: Record<string, unknown> = {
    status: computeStatus(observations.length),
    total: observations.length,
    driver: observationDriver.mode,
    lastUpdatedAt: observations[0]?.observedAt ?? null,
  };
  if (territory) metadata.territory = territory;
  if (storeId) metadata.storeId = storeId;
  if (mode) metadata.mode = mode;

  return jsonResponse({
    observations,
    metadata,
  }, { request });
};

export const onRequestPost: PagesFunction = async ({ request, env }) => {
  const requestId = getRequestId(request);
  const blocked = methodGuard(request, ['POST']);
  if (blocked) return blocked;

  const envObj = env as Record<string, string | undefined>;
  if (envObj.OBSERVATIONS_WRITE_ENABLED !== 'true') {
    return errorResponse('FORBIDDEN', 'Write endpoint disabled', { status: 403, request, requestId });
  }

  const adminKey = envObj.OBSERVATIONS_ADMIN_KEY;
  if (adminKey && request.headers.get('x-admin-key') !== adminKey) {
    return errorResponse('UNAUTHORIZED', 'Missing or invalid admin key', { status: 401, request, requestId });
  }

  const payload = await parseJson<Partial<Observation>>(request);
  if (!payload || typeof payload !== 'object') {
    return errorResponse('INVALID_INPUT', 'Invalid JSON body', { status: 400, request, requestId });
  }
  if (!payload?.barcode || !payload?.territory || typeof payload.price !== 'number' || !payload.observedAt) {
    return errorResponse('INVALID_INPUT', 'Missing required fields', { status: 400, request, requestId });
  }

  const observation: Observation = {
    id: payload.id ?? `${payload.barcode}-${payload.territory}-${Date.now()}`,
    barcode: payload.barcode,
    productName: payload.productName ?? 'Produit non précisé',
    territory: payload.territory,
    storeId: payload.storeId,
    storeName: payload.storeName ?? 'Magasin non précisé',
    price: Number(payload.price),
    currency: 'EUR',
    observedAt: new Date(payload.observedAt).toISOString(),
    source: payload.source ?? 'contribution admin',
    reliability: payload.reliability ?? 'medium',
  };

  return jsonResponse({ ok: true, observation: observationDriver.add(observation), driver: observationDriver.mode }, { request, status: 201 });
};
