/**
 * Tests pour le fournisseur Leader Price (Leader Price).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { leaderPriceProvider } from '../leaderPriceProvider';

const LEADER_PRICE_FLAG = 'VITE_PRICE_PROVIDER_LEADER_PRICE';

const makeController = () => new AbortController();

beforeEach(() => {
  vi.restoreAllMocks();
  vi.stubEnv(LEADER_PRICE_FLAG, 'false');
  vi.stubEnv('VITE_PRICE_API_BASE', '');
});

describe('leaderPriceProvider', () => {
  it('has the correct source ID', () => {
    expect(leaderPriceProvider.source).toBe('leader_price');
  });

  it('is disabled by default', () => {
    expect(leaderPriceProvider.isEnabled()).toBe(false);
  });

  it('is enabled when env flag is true', () => {
    vi.stubEnv(LEADER_PRICE_FLAG, 'true');
    expect(leaderPriceProvider.isEnabled()).toBe(true);
  });

  it('returns NO_DATA when no barcode or query provided', async () => {
    vi.stubEnv(LEADER_PRICE_FLAG, 'true');
    const result = await leaderPriceProvider.search({}, makeController().signal);
    expect(result.status).toBe('NO_DATA');
    expect(result.observations).toEqual([]);
  });

  it('returns UNAVAILABLE when fetch throws', async () => {
    vi.stubEnv(LEADER_PRICE_FLAG, 'true');
    vi.stubEnv('VITE_PRICE_API_BASE', 'https://example.com');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));

    const result = await leaderPriceProvider.search({ query: 'lait' }, makeController().signal);
    expect(result.status).toBe('UNAVAILABLE');
    expect(result.observations).toEqual([]);
  });

  it('returns UNAVAILABLE on HTTP error', async () => {
    vi.stubEnv(LEADER_PRICE_FLAG, 'true');
    vi.stubEnv('VITE_PRICE_API_BASE', 'https://example.com');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 503 }));

    const result = await leaderPriceProvider.search({ query: 'lait' }, makeController().signal);
    expect(result.status).toBe('UNAVAILABLE');
  });

  it('maps valid observations from API response', async () => {
    vi.stubEnv(LEADER_PRICE_FLAG, 'true');
    vi.stubEnv('VITE_PRICE_API_BASE', 'https://example.com');

    const observations = [
      {
        productName: 'Lait U demi-écrémé 1L',
        brand: 'U',
        barcode: '3256540000001',
        price: 1.29,
        currency: 'EUR',
        unit: 'unit',
        observedAt: '2026-03-11',
      },
    ];

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ status: 'OK', observations }),
      })
    );

    const result = await leaderPriceProvider.search(
      { query: 'lait', territory: 'gp' },
      makeController().signal
    );

    expect(result.status).toBe('OK');
    expect(result.observations).toHaveLength(1);
    expect(result.observations[0].source).toBe('leader_price');
    expect(result.observations[0].price).toBe(1.29);
    expect(result.observations[0].productName).toBe('Lait U demi-écrémé 1L');
  });

  it('returns NO_DATA when API returns empty observations', async () => {
    vi.stubEnv(LEADER_PRICE_FLAG, 'true');
    vi.stubEnv('VITE_PRICE_API_BASE', 'https://example.com');

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ status: 'NO_DATA', observations: [] }),
      })
    );

    const result = await leaderPriceProvider.search({ query: 'xyz' }, makeController().signal);
    expect(result.status).toBe('NO_DATA');
    expect(result.observations).toEqual([]);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('filters out observations with invalid prices', async () => {
    vi.stubEnv(LEADER_PRICE_FLAG, 'true');
    vi.stubEnv('VITE_PRICE_API_BASE', 'https://example.com');

    const observations = [
      { productName: 'Produit valide', price: 2.5, currency: 'EUR', unit: 'unit' },
      { productName: 'Produit invalide', price: -1, currency: 'EUR', unit: 'unit' },
      { productName: 'Produit manquant prix', price: null, currency: 'EUR', unit: 'unit' },
    ];

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ status: 'OK', observations }),
      })
    );

    const result = await leaderPriceProvider.search({ query: 'produit' }, makeController().signal);
    expect(result.observations).toHaveLength(1);
    expect(result.observations[0].productName).toBe('Produit valide');
  });

  it('passes territory to request params', async () => {
    vi.stubEnv(LEADER_PRICE_FLAG, 'true');
    vi.stubEnv('VITE_PRICE_API_BASE', 'https://example.com');

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'NO_DATA', observations: [] }),
    });
    vi.stubGlobal('fetch', mockFetch);

    await leaderPriceProvider.search({ query: 'riz', territory: 'gp' }, makeController().signal);

    expect(mockFetch).toHaveBeenCalledOnce();
    const calledUrl: string = mockFetch.mock.calls[0][0];
    expect(calledUrl).toContain('territory=gp');
    expect(calledUrl).toContain('q=riz');
  });
});
