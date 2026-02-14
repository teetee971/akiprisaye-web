import { afterEach, describe, expect, it } from 'vitest';
import { clearRateLimitBuckets, parseJson, softRateLimit } from '../_lib/http';

describe('http helpers', () => {
  afterEach(() => {
    clearRateLimitBuckets();
  });

  it('parseJson rejects too large bodies', async () => {
    const request = new Request('https://example.com/api', {
      method: 'POST',
      body: JSON.stringify({ payload: 'x'.repeat(50) }),
      headers: { 'content-type': 'application/json' },
    });

    await expect(parseJson(request, { maxBytes: 10 })).rejects.toThrow('JSON_TOO_LARGE');
  });

  it('parseJson rejects invalid json', async () => {
    const request = new Request('https://example.com/api', {
      method: 'POST',
      body: '{bad json',
      headers: { 'content-type': 'application/json' },
    });

    await expect(parseJson(request)).rejects.toThrow('INVALID_JSON');
  });

  it('softRateLimit limits by ip in the same window', () => {
    const makeReq = () => new Request('https://example.com/api', { headers: { 'cf-connecting-ip': '1.1.1.1' } });

    expect(softRateLimit(makeReq(), { maxRequests: 2, windowMs: 60_000 }).ok).toBe(true);
    expect(softRateLimit(makeReq(), { maxRequests: 2, windowMs: 60_000 }).ok).toBe(true);

    const limited = softRateLimit(makeReq(), { maxRequests: 2, windowMs: 60_000 });
    expect(limited.ok).toBe(false);
    if (!limited.ok) {
      expect(limited.retryAfter).toBeGreaterThan(0);
    }
  });
});
