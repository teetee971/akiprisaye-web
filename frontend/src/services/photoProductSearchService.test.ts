import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchProductPrices } from './photoProductSearchService';

// ─── fetchProductPrices ───────────────────────────────────────────────────────

describe('fetchProductPrices', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns [] when fetch throws (network error)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')));
    const prices = await fetchProductPrices('3017620422003');
    expect(prices).toEqual([]);
  });

  it('returns [] when HTTP status is not ok', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }));
    const prices = await fetchProductPrices('3017620422003');
    expect(prices).toEqual([]);
  });

  it('returns [] when response items is missing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ count: 0 }),
      })
    );
    const prices = await fetchProductPrices('3017620422003');
    expect(prices).toEqual([]);
  });

  it('parses and returns valid price listings, filters out entries without price', async () => {
    const mockItems = [
      {
        price: 2.5,
        currency: 'EUR',
        date: '2026-01-15',
        location_name: 'Carrefour',
        location_city: 'Fort-de-France',
        location_country: 'MQ',
      },
      { price: '2.30', currency: 'EUR', date: '2026-01-10', location_city: 'Pointe-à-Pitre' },
      { price: null }, // invalid — filtered
      { price: 'not-a-number' }, // invalid — filtered
    ];
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ items: mockItems }),
      })
    );

    const prices = await fetchProductPrices('3017620422003');

    expect(prices).toHaveLength(2);
    expect(prices[0]).toMatchObject({
      price: 2.5,
      currency: 'EUR',
      date: '2026-01-15',
      locationName: 'Carrefour',
      locationCity: 'Fort-de-France',
      locationCountry: 'MQ',
    });
    expect(prices[1].price).toBe(2.3);
    expect(prices[1].locationCity).toBe('Pointe-à-Pitre');
  });

  it('defaults currency to EUR when not provided', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ items: [{ price: 1.99, date: '2026-02-01' }] }),
      })
    );

    const prices = await fetchProductPrices('0000000000000');
    expect(prices[0].currency).toBe('EUR');
  });

  it('uses HTTPS Open Prices API endpoint with product_code param', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ items: [] }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await fetchProductPrices('3017620422003');

    expect(fetchMock).toHaveBeenCalledOnce();
    const calledUrl = fetchMock.mock.calls[0][0] as string;
    expect(calledUrl).toContain('prices.openfoodfacts.org');
    expect(calledUrl).toContain('product_code=3017620422003');
  });
});
