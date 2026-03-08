import { describe, it, expect, vi, beforeEach } from 'vitest';
import { leclercCatalogProvider } from '../leclercCatalogProvider';

const makeController = () => new AbortController();

beforeEach(() => {
  vi.restoreAllMocks();
  // Provider désactivé par défaut
  vi.stubEnv('VITE_PRICE_PROVIDER_LECLERC_CATALOG', 'false');
  vi.stubEnv('VITE_PRICE_API_BASE', '');
});

describe('leclercCatalogProvider', () => {
  it('is disabled by default (VITE_PRICE_PROVIDER_LECLERC_CATALOG not set)', () => {
    expect(leclercCatalogProvider.isEnabled()).toBe(false);
  });

  it('is enabled when env flag is true', () => {
    vi.stubEnv('VITE_PRICE_PROVIDER_LECLERC_CATALOG', 'true');
    expect(leclercCatalogProvider.isEnabled()).toBe(true);
  });

  it('returns NO_DATA when no barcode or query provided', async () => {
    const result = await leclercCatalogProvider.search({}, makeController().signal);
    expect(result.source).toBe('leclerc_catalog');
    expect(result.status).toBe('NO_DATA');
    expect(result.observations).toHaveLength(0);
  });

  it('returns UNAVAILABLE when fetch fails', async () => {
    vi.stubEnv('VITE_PRICE_PROVIDER_LECLERC_CATALOG', 'true');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));

    const result = await leclercCatalogProvider.search(
      { barcode: '3560070123456' },
      makeController().signal,
    );

    expect(result.source).toBe('leclerc_catalog');
    expect(result.status).toBe('UNAVAILABLE');
    expect(result.observations).toHaveLength(0);
  });

  it('maps observations from a valid API response', async () => {
    vi.stubEnv('VITE_PRICE_PROVIDER_LECLERC_CATALOG', 'true');
    vi.stubEnv('VITE_PRICE_API_BASE', 'https://example.com');

    const mockResponse = {
      status: 'OK',
      observations: [
        {
          source: 'leclerc_catalog',
          productName: 'Lait UHT 1L',
          brand: 'Marque Repère',
          barcode: '3560070123456',
          price: 1.09,
          currency: 'EUR',
          unit: 'unit',
          observedAt: '2026-03-01',
          territory: 'gp',
        },
      ],
    };

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      }),
    );

    const result = await leclercCatalogProvider.search(
      { barcode: '3560070123456', territory: 'gp' },
      makeController().signal,
    );

    expect(result.source).toBe('leclerc_catalog');
    expect(result.status).toBe('OK');
    expect(result.observations).toHaveLength(1);
    expect(result.observations[0].price).toBe(1.09);
    expect(result.observations[0].productName).toBe('Lait UHT 1L');
    expect(result.observations[0].territory).toBe('gp');
  });

  it('returns NO_DATA when API returns empty observations', async () => {
    vi.stubEnv('VITE_PRICE_PROVIDER_LECLERC_CATALOG', 'true');
    vi.stubEnv('VITE_PRICE_API_BASE', 'https://example.com');

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ status: 'NO_DATA', observations: [] }),
      }),
    );

    const result = await leclercCatalogProvider.search(
      { query: 'produit inexistant' },
      makeController().signal,
    );

    expect(result.status).toBe('NO_DATA');
    expect(result.observations).toHaveLength(0);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('filters out observations with invalid prices', async () => {
    vi.stubEnv('VITE_PRICE_PROVIDER_LECLERC_CATALOG', 'true');
    vi.stubEnv('VITE_PRICE_API_BASE', 'https://example.com');

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          status: 'OK',
          observations: [
            { productName: 'Produit OK', price: 2.5, currency: 'EUR', unit: 'unit' },
            { productName: 'Produit invalide', price: -1, currency: 'EUR', unit: 'unit' },
            { productName: 'Produit zéro', price: 0, currency: 'EUR', unit: 'unit' },
          ],
        }),
      }),
    );

    const result = await leclercCatalogProvider.search(
      { query: 'produit' },
      makeController().signal,
    );

    expect(result.status).toBe('OK');
    expect(result.observations).toHaveLength(1);
    expect(result.observations[0].productName).toBe('Produit OK');
  });
});
