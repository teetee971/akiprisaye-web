/**
 * Tests pour le service de découverte automatique Calameo
 * et le fournisseur dynamique calameoDynamicProvider.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import {
  getCatalogs,
  getCachedCatalogs,
  clearDiscoveryCache,
  getLastFetchedAt,
  type DiscoveredCatalog,
} from '../../services/calameoDiscoveryService';
import { calameoDynamicProvider } from '../calameoDynamicProvider';

const makeController = () => new AbortController();

const SAMPLE_CATALOGS: DiscoveredCatalog[] = [
  {
    bkcode: '00672206587e18c17d3bd',
    accountId: '006722065',
    title: 'CATALOGUE PROMO HUIT A 8 GUADELOUPE CAREME FEVRIER 2026',
    publicUrl: 'https://www.calameo.com/books/00672206587e18c17d3bd',
    date: '2026-02-25',
    pages: 24,
  },
  {
    bkcode: '0067220656cd5be3f9f3a',
    accountId: '006722065',
    title: 'CATALOGUE PROMO SUP ECO GUYANE MAXI ECONOMIES MARS 2026',
    publicUrl: 'https://www.calameo.com/books/0067220656cd5be3f9f3a',
    date: '2026-03-01',
    pages: 16,
  },
  {
    bkcode: '005456123ba91a2661670',
    accountId: '005456123',
    title: 'Catalogue Ecologite Guadeloupe 2026',
    publicUrl: 'https://www.calameo.com/books/005456123ba91a2661670',
    date: '2026-01-15',
    pages: 32,
  },
];

const mockSuccessResponse = (catalogs: DiscoveredCatalog[] = SAMPLE_CATALOGS) =>
  vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      catalogs,
      fetchedAt: '2026-03-08T10:00:00.000Z',
      accountsQueried: ['006722065', '005456123'],
    }),
  });

beforeEach(() => {
  vi.restoreAllMocks();
  clearDiscoveryCache();
  vi.stubEnv('VITE_PRICE_API_BASE', 'https://example.com');
  vi.stubEnv('VITE_CALAMEO_ACCOUNTS', '006722065,005456123');
  vi.stubEnv('VITE_PRICE_PROVIDER_CALAMEO_DYNAMIC', 'false');
});

afterEach(() => {
  clearDiscoveryCache();
});

// ─── calameoDiscoveryService ─────────────────────────────────────────────────

describe('calameoDiscoveryService', () => {
  it('returns empty list when no cache and fetch fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));
    const catalogs = await getCatalogs();
    expect(catalogs).toEqual([]);
  });

  it('fetches and returns catalog list from API', async () => {
    vi.stubGlobal('fetch', mockSuccessResponse());
    const catalogs = await getCatalogs();
    expect(catalogs).toHaveLength(SAMPLE_CATALOGS.length);
    expect(catalogs[0].bkcode).toBe(SAMPLE_CATALOGS[0].bkcode);
  });

  it('caches results in localStorage', async () => {
    vi.stubGlobal('fetch', mockSuccessResponse());
    await getCatalogs();

    // Second call should use cache — no fetch needed
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Should not be called')));
    const cached = await getCatalogs();
    expect(cached).toHaveLength(SAMPLE_CATALOGS.length);
  });

  it('getCachedCatalogs returns empty array when cache is empty', () => {
    expect(getCachedCatalogs()).toEqual([]);
  });

  it('getCachedCatalogs returns data after a successful fetch', async () => {
    vi.stubGlobal('fetch', mockSuccessResponse());
    await getCatalogs();
    expect(getCachedCatalogs()).toHaveLength(SAMPLE_CATALOGS.length);
  });

  it('forceRefresh bypasses cache and re-fetches', async () => {
    vi.stubGlobal('fetch', mockSuccessResponse());
    await getCatalogs();

    const newCatalog: DiscoveredCatalog = {
      bkcode: 'NEWBOOK123',
      accountId: '006722065',
      title: 'Nouveau Catalogue Mars 2026',
      publicUrl: 'https://www.calameo.com/books/NEWBOOK123',
      date: '2026-03-08',
    };
    vi.stubGlobal('fetch', mockSuccessResponse([...SAMPLE_CATALOGS, newCatalog]));
    const fresh = await getCatalogs(true);
    expect(fresh).toHaveLength(SAMPLE_CATALOGS.length + 1);
  });

  it('getLastFetchedAt returns null when cache is empty', () => {
    expect(getLastFetchedAt()).toBeNull();
  });

  it('getLastFetchedAt returns ISO string after fetch', async () => {
    vi.stubGlobal('fetch', mockSuccessResponse());
    await getCatalogs();
    expect(getLastFetchedAt()).toBe('2026-03-08T10:00:00.000Z');
  });

  it('dispatches calameo:new-catalogs event when new books appear', async () => {
    // Initial fetch — no previous cache
    vi.stubGlobal('fetch', mockSuccessResponse([SAMPLE_CATALOGS[0]]));
    await getCatalogs();

    const newCatalog: DiscoveredCatalog = {
      bkcode: 'BRANDNEW456',
      accountId: '006722065',
      title: 'Tout Nouveau Catalogue',
      publicUrl: 'https://www.calameo.com/books/BRANDNEW456',
      date: '2026-03-09',
    };

    const events: CustomEvent[] = [];
    window.addEventListener('calameo:new-catalogs', (e) => events.push(e as CustomEvent));

    vi.stubGlobal('fetch', mockSuccessResponse([SAMPLE_CATALOGS[0], newCatalog]));
    await getCatalogs(true);

    expect(events).toHaveLength(1);
    expect(events[0].detail.catalogs).toHaveLength(1);
    expect(events[0].detail.catalogs[0].bkcode).toBe('BRANDNEW456');
  });

  it('clearDiscoveryCache empties the cache', async () => {
    vi.stubGlobal('fetch', mockSuccessResponse());
    await getCatalogs();
    expect(getCachedCatalogs().length).toBeGreaterThan(0);

    clearDiscoveryCache();
    expect(getCachedCatalogs()).toEqual([]);
  });
});

// ─── calameoDynamicProvider ──────────────────────────────────────────────────

describe('calameoDynamicProvider', () => {
  it('has source calameo_catalog', () => {
    expect(calameoDynamicProvider.source).toBe('calameo_catalog');
  });

  it('is disabled by default', () => {
    expect(calameoDynamicProvider.isEnabled()).toBe(false);
  });

  it('is enabled when env flag is true', () => {
    vi.stubEnv('VITE_PRICE_PROVIDER_CALAMEO_DYNAMIC', 'true');
    expect(calameoDynamicProvider.isEnabled()).toBe(true);
  });

  it('returns NO_DATA with catalog URLs in warnings', async () => {
    vi.stubGlobal('fetch', mockSuccessResponse());
    // Pre-populate cache
    await getCatalogs();

    vi.stubEnv('VITE_PRICE_PROVIDER_CALAMEO_DYNAMIC', 'true');
    const result = await calameoDynamicProvider.search(
      { query: 'huit a 8' },
      makeController().signal
    );

    expect(result.source).toBe('calameo_catalog');
    expect(result.status).toBe('NO_DATA');
    expect(result.observations).toHaveLength(0);
    // Warnings should contain catalog URLs
    expect(
      result.warnings.some((w) => {
        try {
          const url = new URL(w);
          return url.hostname === 'calameo.com' || url.hostname.endsWith('.calameo.com');
        } catch {
          return false;
        }
      })
    ).toBe(true);
  });

  it('returns all catalogs when no query given', async () => {
    vi.stubGlobal('fetch', mockSuccessResponse());
    await getCatalogs();

    vi.stubEnv('VITE_PRICE_PROVIDER_CALAMEO_DYNAMIC', 'true');
    const result = await calameoDynamicProvider.search({}, makeController().signal);

    expect(result.status).toBe('NO_DATA');
    // All 3 sample catalogs should appear as warnings
    expect(result.warnings).toHaveLength(SAMPLE_CATALOGS.length);
  });

  it('returns NO_DATA with fallback warning when discovery service returns nothing', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    vi.stubEnv('VITE_PRICE_PROVIDER_CALAMEO_DYNAMIC', 'true');

    const result = await calameoDynamicProvider.search({ query: 'rhum' }, makeController().signal);

    // The discovery service absorbs network errors and returns [] gracefully.
    // The provider maps that to NO_DATA (not a hard UNAVAILABLE).
    expect(result.status).toBe('NO_DATA');
    expect(result.observations).toHaveLength(0);
    expect(result.warnings.length).toBeGreaterThan(0);
  });
});
