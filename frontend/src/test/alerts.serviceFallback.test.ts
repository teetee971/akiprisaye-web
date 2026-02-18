import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getAlerts } from '../services/alertsService';

describe('alertsService fallback', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns local fallback when API fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network down'));

    const result = await getAlerts({ territory: 'gp', onlyActive: true });

    expect(result.metadata.source).toBe('fallback');
    expect(result.alerts.length).toBeGreaterThan(0);
    expect(result.alerts.every((alert) => alert.territory === 'gp')).toBe(true);
  });
});

describe('priceSearch local overrides fallback', () => {
  const runPriceProvidersMock = vi.fn();

  beforeEach(() => {
    runPriceProvidersMock.mockReset();
  });

  afterEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.doUnmock('../providers');
    vi.doUnmock('../providers/cache');
    vi.doUnmock('../services/priceSearch/telemetry');
  });

  async function loadSearchProductPrices() {
    vi.doMock('../providers', () => ({
      runPriceProviders: runPriceProvidersMock,
    }));

    vi.doMock('../providers/cache', () => ({
      buildCacheKey: () => 'price-search-key',
      getCache: () => null,
      setCache: vi.fn(),
      purgeExpiredCache: vi.fn(),
    }));

    vi.doMock('../services/priceSearch/telemetry', () => ({
      trackSearchStart: vi.fn(),
      trackSearchResult: vi.fn(),
      trackSearchError: vi.fn(),
    }));

    const module = await import('../services/priceSearch/priceSearch.service');
    return module.searchProductPrices;
  }

  it('returns local overrides when live providers return no data', async () => {
    runPriceProvidersMock.mockResolvedValue([
      { source: 'open_prices', status: 'NO_DATA', observations: [], warnings: [] },
    ]);

    const searchProductPrices = await loadSearchProductPrices();
    const result = await searchProductPrices({
      barcode: '3560070894222',
      territory: 'gp',
    });

    expect(result.status).toBe('PARTIAL');
    expect(result.sourcesUsed).toContain('local_override');
    expect(result.observations).toHaveLength(4);
    expect(result.observations.every((entry) => entry.source === 'local_override')).toBe(true);
  });

  it('keeps NO_DATA when no local override exists', async () => {
    runPriceProvidersMock.mockResolvedValue([
      { source: 'open_prices', status: 'NO_DATA', observations: [], warnings: [] },
    ]);

    const searchProductPrices = await loadSearchProductPrices();
    const result = await searchProductPrices({
      barcode: '0000000000000',
      territory: 'gp',
    });

    expect(result.status).toBe('NO_DATA');
    expect(result.sourcesUsed).not.toContain('local_override');
    expect(result.observations).toHaveLength(0);
  });

  it('filters local overrides by territory and retailer', async () => {
    runPriceProvidersMock.mockResolvedValue([
      { source: 'open_prices', status: 'NO_DATA', observations: [], warnings: [] },
    ]);

    const searchProductPrices = await loadSearchProductPrices();
    const result = await searchProductPrices({
      barcode: '3560070894222',
      territory: 'mq',
      storeId: 'carrefour',
    });

    expect(result.observations).toHaveLength(1);
    expect(result.observations[0]?.metadata?.retailer).toBe('carrefour');
    expect(result.observations[0]?.territory).toBe('mq');
  });
});
