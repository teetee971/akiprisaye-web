import { describe, expect, it } from 'vitest';
import { onRequestGet } from '../api/health';

describe('/api/health', () => {
  it('returns canary payload with no-store caching', async () => {
    const response = await onRequestGet({} as never);
    const body = await response.json() as { ok: boolean; ts: string };

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(body.ok).toBe(true);
    expect(typeof body.ts).toBe('string');
  });
});
