import { describe, expect, it } from 'vitest';
import { onRequestGet } from '../api/health';

describe('/api/health', () => {
  it('returns 200 JSON with no-store cache control', async () => {
    const response = await onRequestGet({} as never);
    const body = await response.json() as { ok: boolean; ts: number };

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(body.ok).toBe(true);
    expect(typeof body.ts).toBe('number');
  });
});
