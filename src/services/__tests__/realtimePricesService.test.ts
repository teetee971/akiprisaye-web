import { describe, expect, it, vi, beforeEach } from 'vitest';
import { getRealtimePrices, type RealtimePrice } from '../realtimePricesService';

const sampleItem: RealtimePrice = {
  productId: 'riz-1kg',
  productLabel: 'Riz blanc 1kg',
  territory: 'Guadeloupe',
  price: 2.45,
  currency: 'EUR',
  source: 'open-data',
  observedAt: '2026-02-01T00:00:00Z',
};

describe('realtimePricesService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns live data when the API is available', async () => {
    const payload = {
      state: 'live',
      cache: 'miss',
      updated_at: '2026-02-01T00:00:00Z',
      source: { name: 'test-source' },
      items: [sampleItem],
    };

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => payload,
      } as unknown as Response)
    );

    const result = await getRealtimePrices({ timeoutMs: 200 });

    expect(result.state).toBe('live');
    expect(result.items).toHaveLength(1);
    expect(result.items[0].productId).toBe(sampleItem.productId);
    expect(result.updatedAt).toBe(payload.updated_at);
    expect(result.source).toBe('test-source');
  });

  it('falls back to local data when API fails', async () => {
    const fallbackPayload = [
      {
        ...sampleItem,
        source: 'fallback-file',
        price: 2.5,
      },
    ];

    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error('network down'))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => fallbackPayload,
      } as unknown as Response);

    vi.stubGlobal('fetch', fetchMock);

    const result = await getRealtimePrices({ timeoutMs: 50 });

    expect(result.state).toBe('offline');
    expect(result.items.length).toBeGreaterThan(0);
    expect(result.items[0].source).toBe('fallback-file');
    expect(fetchMock.mock.calls.length).toBeGreaterThan(1);
  });
});
