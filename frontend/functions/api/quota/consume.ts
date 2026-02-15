import { errorResponse, getRequestId, handleOptions, jsonResponse, methodGuard, parseJson, softRateLimit } from '../../_lib/http';
import { isEnumValue, isNonEmptyString } from '../../_lib/validate';

type Plan = 'free' | 'pro';
type QuotaBucket = { day: string; used: number };

const FREE_LIMIT = 20;
const PRO_LIMIT = 999999;
const buckets = new Map<string, QuotaBucket>();
const today = () => new Date().toISOString().slice(0, 10);

export const onRequestOptions: PagesFunction = async ({ request }) => handleOptions(request, ['POST']) ?? new Response(null, { status: 204 });

export const onRequestPost: PagesFunction = async ({ request }) => {
  const requestId = getRequestId(request);
  const blocked = methodGuard(request, ['POST']);
  if (blocked) return blocked;

  const rate = softRateLimit(request, { maxRequests: 80, windowMs: 60_000 });
  if (!rate.ok) {
    return jsonResponse({ ok: false, code: 'RATE_LIMITED', requestId, retryAfter: rate.retryAfter }, { status: 429, request });
  }

  try {
    const body = await parseJson<{ uid?: string; plan?: Plan }>(request);
    const uid = body.uid?.trim() ?? '';
    const plan = body.plan ?? 'free';

    if (!isNonEmptyString(uid, 200)) {
      return errorResponse('INVALID_INPUT', 'Missing uid', { status: 400, request, requestId });
    }

    if (!isEnumValue(plan, ['free', 'pro'])) {
      return errorResponse('INVALID_INPUT', 'Invalid plan', { status: 400, request, requestId });
    }

    const currentDay = today();
    const current = buckets.get(uid);
    const used = current && current.day === currentDay ? current.used : 0;
    const limit = plan === 'pro' ? PRO_LIMIT : FREE_LIMIT;

    if (used >= limit) {
      return jsonResponse({ allowed: false, remaining: 0, limit, used, plan }, { request });
    }

    const nextUsed = used + 1;
    buckets.set(uid, { day: currentDay, used: nextUsed });

    return jsonResponse({ allowed: true, remaining: Math.max(limit - nextUsed, 0), limit, used: nextUsed, plan }, { request });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'quota_error';
    return errorResponse('BAD_REQUEST', message, { status: 400, request, requestId });
  }
};
