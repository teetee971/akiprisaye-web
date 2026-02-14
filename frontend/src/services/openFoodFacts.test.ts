import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchOffProductByBarcode, validateBarcode, __offInternals } from './openFoodFacts';
import { getCachedWithTTL, setCachedJson } from './localStore';

describe('openFoodFacts barcode validation', () => {
  it('rejects non-digit or out-of-range barcode', () => {
    const invalid = validateBarcode('ABC123');
    expect(invalid?.status).toBe('INVALID');

    const tooShort = validateBarcode('1234567');
    expect(tooShort?.status).toBe('INVALID');

    const valid = validateBarcode('12345678');
    expect(valid).toBeNull();
  });
});

describe('localStore TTL cache', () => {
  afterEach(() => {
    window.localStorage.clear();
    vi.useRealTimers();
  });

  it('returns cached value when still fresh and ignores corrupted json', () => {
    setCachedJson('off:product:12345678', { value: 'ok' });
    const cached = getCachedWithTTL<{ value: string }>('off:product:12345678', 1000);
    expect(cached).toEqual({ value: 'ok' });

    window.localStorage.setItem('off:product:bad', '{broken');
    const broken = getCachedWithTTL<{ value: string }>('off:product:bad', 1000);
    expect(broken).toBeNull();
  });

  it('expires stale values based on ttl', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    setCachedJson('off:product:12345678', { value: 'ok' });

    vi.setSystemTime(new Date('2026-01-09T00:00:01Z'));
    const stale = getCachedWithTTL<{ value: string }>('off:product:12345678', __offInternals.OFF_PRODUCT_CACHE_TTL_MS);
    expect(stale).toBeNull();
  });
});

describe('openFoodFacts response mapping', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  it('maps OFF product success response to normalized result', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        ({
          ok: true,
          status: 200,
          json: async () => ({
            status: 1,
            product: {
              product_name: 'Jus d’orange',
              brands: 'AKI',
              image_url: 'https://img.test/product.jpg',
              quantity: '1 L',
              categories_tags: ['en:beverages', 'fr:jus'],
            },
          }),
        } as unknown as globalThis.Response)
      )
    );

    const result = await fetchOffProductByBarcode('12345678');
    expect(result.status).toBe('OK');
    expect(result.product).toMatchObject({
      name: 'Jus d’orange',
      brands: 'AKI',
      imageUrl: 'https://img.test/product.jpg',
    });
  });

  it('maps OFF not-found response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ status: 0 }) } as unknown as globalThis.Response))
    );

    const result = await fetchOffProductByBarcode('12345678');
    expect(result.status).toBe('NOT_FOUND');
  });

  it('returns error for network failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('network down');
      })
    );

    const result = await fetchOffProductByBarcode('12345678');
    expect(result.status).toBe('ERROR');
    expect(result.error?.code).toBe('NETWORK_ERROR');
  });
});
