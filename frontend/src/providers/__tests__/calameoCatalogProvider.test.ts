/**
 * Tests pour les fournisseurs de catalogues Calameo.
 * Couvre la factory createCalameoCatalogProvider et l'instance ecologiteGuadeloupeProvider.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { createCalameoCatalogProvider } from '../createCalameoCatalogProvider';
import { ecologiteGuadeloupeProvider } from '../ecologiteGuadeloupeProvider';

const makeController = () => new AbortController();

const ECOLOGITE_FLAG = 'VITE_PRICE_PROVIDER_ECOLOGITE_GUADELOUPE';

beforeEach(() => {
  vi.restoreAllMocks();
  vi.stubEnv(ECOLOGITE_FLAG, 'false');
  vi.stubEnv('VITE_PRICE_API_BASE', '');
});

// ─── ecologiteGuadeloupeProvider ────────────────────────────────────────────

describe('ecologiteGuadeloupeProvider', () => {
  it('has the correct source ID', () => {
    expect(ecologiteGuadeloupeProvider.source).toBe('ecologite_guadeloupe');
  });

  it('is disabled by default', () => {
    expect(ecologiteGuadeloupeProvider.isEnabled()).toBe(false);
  });

  it('is enabled when env flag is true', () => {
    vi.stubEnv(ECOLOGITE_FLAG, 'true');
    expect(ecologiteGuadeloupeProvider.isEnabled()).toBe(true);
  });

  it('returns NO_DATA (visual catalog, no OCR) with a warning containing the catalog URL', async () => {
    vi.stubEnv(ECOLOGITE_FLAG, 'true');
    vi.stubEnv('VITE_PRICE_API_BASE', 'https://example.com');

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          status: 'PARTIAL',
          source: 'ecologite_guadeloupe',
          observations: [],
          catalog: {
            bkcode: '005456123ba91a2661670',
            title: 'Catalogue Ecologite Guadeloupe 2026',
            publicUrl: 'https://www.calameo.com/books/005456123ba91a2661670',
          },
          warnings: [
            'Catalogue visuel (Catalogue Ecologite Guadeloupe 2026) : extraction automatique des prix non disponible. ' +
              'Consulter le catalogue : https://www.calameo.com/books/005456123ba91a2661670',
          ],
        }),
      }),
    );

    const result = await ecologiteGuadeloupeProvider.search(
      { query: 'isolant thermique' },
      makeController().signal,
    );

    expect(result.source).toBe('ecologite_guadeloupe');
    expect(result.status).toBe('NO_DATA');
    expect(result.observations).toHaveLength(0);
    expect(result.warnings.some((w) => w.includes('calameo') || w.includes('catalogue') || w.includes('Ecologite'))).toBe(true);
  });

  it('returns UNAVAILABLE when fetch fails', async () => {
    vi.stubEnv(ECOLOGITE_FLAG, 'true');
    vi.stubEnv('VITE_PRICE_API_BASE', 'https://example.com');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));

    const result = await ecologiteGuadeloupeProvider.search(
      { query: 'panneau' },
      makeController().signal,
    );

    expect(result.status).toBe('UNAVAILABLE');
    expect(result.observations).toHaveLength(0);
  });

  it('returns UNAVAILABLE on HTTP error', async () => {
    vi.stubEnv(ECOLOGITE_FLAG, 'true');
    vi.stubEnv('VITE_PRICE_API_BASE', 'https://example.com');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 503 }));

    const result = await ecologiteGuadeloupeProvider.search(
      { query: 'panneau' },
      makeController().signal,
    );

    expect(result.status).toBe('UNAVAILABLE');
  });

  it('includes bkcode in the upstream request URL', async () => {
    vi.stubEnv(ECOLOGITE_FLAG, 'true');
    vi.stubEnv('VITE_PRICE_API_BASE', 'https://example.com');

    let capturedUrl = '';
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string) => {
        capturedUrl = url;
        return Promise.resolve({
          ok: true,
          json: async () => ({ status: 'PARTIAL', observations: [], warnings: [] }),
        });
      }),
    );

    await ecologiteGuadeloupeProvider.search({ query: 'isolant' }, makeController().signal);
    expect(capturedUrl).toContain('bkcode=005456123ba91a2661670');
    expect(capturedUrl).toContain('authid=KEl4wzU8WfzM');
    expect(capturedUrl).toContain('source=ecologite_guadeloupe');
  });
});

// ─── createCalameoCatalogProvider factory ───────────────────────────────────

describe('createCalameoCatalogProvider (factory)', () => {
  const TEST_FLAG = 'VITE_PRICE_PROVIDER_TEST_CALAMEO';

  beforeEach(() => {
    vi.stubEnv(TEST_FLAG, 'false');
  });

  it('creates a provider with the given source ID', () => {
    const provider = createCalameoCatalogProvider({
      source: 'ecologite_guadeloupe',
      bkcode: 'TESTCODE',
      envFlag: TEST_FLAG,
      label: 'Test Catalogue',
    });
    expect(provider.source).toBe('ecologite_guadeloupe');
  });

  it('is disabled by default', () => {
    const provider = createCalameoCatalogProvider({
      source: 'ecologite_guadeloupe',
      bkcode: 'TESTCODE',
      envFlag: TEST_FLAG,
      label: 'Test Catalogue',
    });
    expect(provider.isEnabled()).toBe(false);
  });

  it('returns a warning message when enabled but API returns no prices', async () => {
    vi.stubEnv(TEST_FLAG, 'true');
    vi.stubEnv('VITE_PRICE_API_BASE', 'https://example.com');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          status: 'PARTIAL',
          observations: [],
          warnings: ['Catalogue visuel : consultation manuelle requise.'],
        }),
      }),
    );

    const provider = createCalameoCatalogProvider({
      source: 'ecologite_guadeloupe',
      bkcode: 'TESTCODE',
      envFlag: TEST_FLAG,
      label: 'Test Catalogue',
    });

    const result = await provider.search({ query: 'produit' }, makeController().signal);
    expect(result.status).toBe('NO_DATA');
    expect(result.observations).toHaveLength(0);
    expect(result.warnings.length).toBeGreaterThan(0);
  });
});
