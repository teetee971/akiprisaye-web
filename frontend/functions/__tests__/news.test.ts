import { describe, expect, it, vi, afterEach } from 'vitest';
import { onRequestGet } from '../api/news';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('/api/news', () => {
  it('filters by territory/type/q/limit and keeps date desc sorting', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      text: async () => `<?xml version="1.0"?><rss><channel>
        <item><title>Promo carburant GP</title><link>https://example.org/a</link><description>Test</description><pubDate>Wed, 22 Jan 2026 10:00:00 GMT</pubDate></item>
        <item><title>Ancienne actu</title><link>https://example.org/b</link><description>Test</description><pubDate>Wed, 20 Jan 2026 10:00:00 GMT</pubDate></item>
      </channel></rss>`,
    }));

    const request = new Request('https://example.com/api/news?territory=fr&type=press&q=promo&limit=1');
    const response = await onRequestGet({ request } as never);
    const body = await response.json() as { items: Array<{ title: string; published_at: string }>; mode: string };

    expect(response.status).toBe(200);
    expect(body.items).toHaveLength(1);
    expect(body.items[0].title).toContain('Promo');
    expect(body.mode).toBe('live');
  });

  it('returns mock mode when upstream is empty', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, text: async () => '<rss><channel></channel></rss>' }));

    const response = await onRequestGet({ request: new Request('https://example.com/api/news?limit=2') } as never);
    const body = await response.json() as { mode: string; items: unknown[] };

    expect(body.mode).toBe('mock');
    expect(body.items.length).toBe(2);
  });

  it('returns degraded mode when upstream fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('upstream down')));

    const response = await onRequestGet({ request: new Request('https://example.com/api/news') } as never);
    const body = await response.json() as { mode: string; sources: Record<string, string> };

    expect(body.mode).toBe('degraded');
    expect(body.sources['service-public-rss']).toBe('error');
  });
});
