/**
 * Tests pour les fournisseurs de catalogues Calameo.
 * Couvre la factory createCalameoCatalogProvider et toutes les instances.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { createCalameoCatalogProvider } from '../createCalameoCatalogProvider';
import { carrefourMilenisGuadeloupeProvider } from '../carrefourMilenisGuadeloupeProvider';
import { connexionGuadeloupeProvider } from '../connexionGuadeloupeProvider';
import { ecologiteGuadeloupeProvider } from '../ecologiteGuadeloupeProvider';
import { huitAHuitGuadeloupeProvider } from '../huitAHuitGuadeloupeProvider';
import { supecoGuyaneProvider } from '../supecoGuyaneProvider';

const makeController = () => new AbortController();

const ECOLOGITE_FLAG = 'VITE_PRICE_PROVIDER_ECOLOGITE_GUADELOUPE';
const HUITAHUIT_FLAG = 'VITE_PRICE_PROVIDER_HUIT_A_HUIT_GUADELOUPE';
const SUPECO_FLAG = 'VITE_PRICE_PROVIDER_SUPECO_GUYANE';
const CARREFOUR_FLAG = 'VITE_PRICE_PROVIDER_CARREFOUR_MILENIS_GUADELOUPE';
const CONNEXION_FLAG = 'VITE_PRICE_PROVIDER_CONNEXION_GUADELOUPE';

beforeEach(() => {
  vi.restoreAllMocks();
  vi.stubEnv(ECOLOGITE_FLAG, 'false');
  vi.stubEnv(HUITAHUIT_FLAG, 'false');
  vi.stubEnv(SUPECO_FLAG, 'false');
  vi.stubEnv(CARREFOUR_FLAG, 'false');
  vi.stubEnv(CONNEXION_FLAG, 'false');
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
      })
    );

    const result = await ecologiteGuadeloupeProvider.search(
      { query: 'isolant thermique' },
      makeController().signal
    );

    expect(result.source).toBe('ecologite_guadeloupe');
    expect(result.status).toBe('NO_DATA');
    expect(result.observations).toHaveLength(0);
    expect(
      result.warnings.some(
        (w) => w.includes('calameo') || w.includes('catalogue') || w.includes('Ecologite')
      )
    ).toBe(true);
  });

  it('returns UNAVAILABLE when fetch fails', async () => {
    vi.stubEnv(ECOLOGITE_FLAG, 'true');
    vi.stubEnv('VITE_PRICE_API_BASE', 'https://example.com');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));

    const result = await ecologiteGuadeloupeProvider.search(
      { query: 'panneau' },
      makeController().signal
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
      makeController().signal
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
      })
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
      })
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

// ─── huitAHuitGuadeloupeProvider ────────────────────────────────────────────

describe('huitAHuitGuadeloupeProvider', () => {
  it('has correct source ID and book code in request', async () => {
    expect(huitAHuitGuadeloupeProvider.source).toBe('huit_a_huit_guadeloupe');

    vi.stubEnv(HUITAHUIT_FLAG, 'true');
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
      })
    );

    await huitAHuitGuadeloupeProvider.search({ query: 'biscuits' }, makeController().signal);
    expect(capturedUrl).toContain('bkcode=00672206587e18c17d3bd');
    expect(capturedUrl).toContain('source=huit_a_huit_guadeloupe');
  });

  it('is disabled by default', () => {
    expect(huitAHuitGuadeloupeProvider.isEnabled()).toBe(false);
  });

  it('is enabled when env flag is set', () => {
    vi.stubEnv(HUITAHUIT_FLAG, 'true');
    expect(huitAHuitGuadeloupeProvider.isEnabled()).toBe(true);
  });

  it('returns UNAVAILABLE when fetch throws', async () => {
    vi.stubEnv(HUITAHUIT_FLAG, 'true');
    vi.stubEnv('VITE_PRICE_API_BASE', 'https://example.com');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('timeout')));

    const result = await huitAHuitGuadeloupeProvider.search(
      { query: 'rhum' },
      makeController().signal
    );
    expect(result.status).toBe('UNAVAILABLE');
    expect(result.observations).toHaveLength(0);
  });
});

// ─── supecoGuyaneProvider ────────────────────────────────────────────────────

describe('supecoGuyaneProvider', () => {
  it('has correct source ID and book code in request', async () => {
    expect(supecoGuyaneProvider.source).toBe('supeco_guyane');

    vi.stubEnv(SUPECO_FLAG, 'true');
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
      })
    );

    await supecoGuyaneProvider.search({ query: 'riz' }, makeController().signal);
    expect(capturedUrl).toContain('bkcode=0067220656cd5be3f9f3a');
    expect(capturedUrl).toContain('source=supeco_guyane');
  });

  it('is disabled by default', () => {
    expect(supecoGuyaneProvider.isEnabled()).toBe(false);
  });

  it('is enabled when env flag is set', () => {
    vi.stubEnv(SUPECO_FLAG, 'true');
    expect(supecoGuyaneProvider.isEnabled()).toBe(true);
  });

  it('returns UNAVAILABLE when fetch throws', async () => {
    vi.stubEnv(SUPECO_FLAG, 'true');
    vi.stubEnv('VITE_PRICE_API_BASE', 'https://example.com');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('timeout')));

    const result = await supecoGuyaneProvider.search({ query: 'huile' }, makeController().signal);
    expect(result.status).toBe('UNAVAILABLE');
    expect(result.observations).toHaveLength(0);
  });
});

// ─── carrefourMilenisGuadeloupeProvider ─────────────────────────────────────

describe('carrefourMilenisGuadeloupeProvider', () => {
  it('has correct source ID and book code in request', async () => {
    expect(carrefourMilenisGuadeloupeProvider.source).toBe('carrefour_milenis_guadeloupe');

    vi.stubEnv(CARREFOUR_FLAG, 'true');
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
      })
    );

    await carrefourMilenisGuadeloupeProvider.search(
      { query: 'crème solaire' },
      makeController().signal
    );
    expect(capturedUrl).toContain('bkcode=0067220659b9adde1c784');
    expect(capturedUrl).toContain('source=carrefour_milenis_guadeloupe');
  });

  it('is disabled by default', () => {
    expect(carrefourMilenisGuadeloupeProvider.isEnabled()).toBe(false);
  });

  it('is enabled when env flag is set', () => {
    vi.stubEnv(CARREFOUR_FLAG, 'true');
    expect(carrefourMilenisGuadeloupeProvider.isEnabled()).toBe(true);
  });

  it('returns UNAVAILABLE when fetch throws', async () => {
    vi.stubEnv(CARREFOUR_FLAG, 'true');
    vi.stubEnv('VITE_PRICE_API_BASE', 'https://example.com');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('timeout')));

    const result = await carrefourMilenisGuadeloupeProvider.search(
      { query: 'shampoing' },
      makeController().signal
    );
    expect(result.status).toBe('UNAVAILABLE');
    expect(result.observations).toHaveLength(0);
  });

  it('returns NO_DATA with catalog link warning on success', async () => {
    vi.stubEnv(CARREFOUR_FLAG, 'true');
    vi.stubEnv('VITE_PRICE_API_BASE', 'https://example.com');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          status: 'PARTIAL',
          observations: [],
          warnings: [
            'Catalogue visuel (Carrefour Milénis Guadeloupe — Spécial Beauté 2026) : ' +
              'extraction automatique des prix non disponible. ' +
              'Consulter le catalogue : https://www.calameo.com/books/0067220659b9adde1c784',
          ],
        }),
      })
    );

    const result = await carrefourMilenisGuadeloupeProvider.search(
      { query: 'rouge à lèvres' },
      makeController().signal
    );

    expect(result.source).toBe('carrefour_milenis_guadeloupe');
    expect(result.status).toBe('NO_DATA');
    expect(result.observations).toHaveLength(0);
    expect(
      result.warnings.some(
        (w) =>
          w.toLowerCase().includes('milenis') ||
          w.toLowerCase().includes('beauté') ||
          w.includes('calameo')
      )
    ).toBe(true);
  });
});

// ─── connexionGuadeloupeProvider ─────────────────────────────────────────────

describe('connexionGuadeloupeProvider', () => {
  it('has correct source ID and book code in request', async () => {
    expect(connexionGuadeloupeProvider.source).toBe('connexion_guadeloupe');

    vi.stubEnv(CONNEXION_FLAG, 'true');
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
      })
    );

    await connexionGuadeloupeProvider.search({ query: 'lave-linge' }, makeController().signal);
    expect(capturedUrl).toContain('bkcode=0077620289340a0cc1cc8');
    expect(capturedUrl).toContain('source=connexion_guadeloupe');
  });

  it('is disabled by default', () => {
    expect(connexionGuadeloupeProvider.isEnabled()).toBe(false);
  });

  it('is enabled when env flag is set', () => {
    vi.stubEnv(CONNEXION_FLAG, 'true');
    expect(connexionGuadeloupeProvider.isEnabled()).toBe(true);
  });

  it('returns UNAVAILABLE when fetch throws', async () => {
    vi.stubEnv(CONNEXION_FLAG, 'true');
    vi.stubEnv('VITE_PRICE_API_BASE', 'https://example.com');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('timeout')));

    const result = await connexionGuadeloupeProvider.search(
      { query: 'réfrigérateur' },
      makeController().signal
    );
    expect(result.status).toBe('UNAVAILABLE');
    expect(result.observations).toHaveLength(0);
  });

  it('returns NO_DATA with catalog link warning on success', async () => {
    vi.stubEnv(CONNEXION_FLAG, 'true');
    vi.stubEnv('VITE_PRICE_API_BASE', 'https://example.com');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          status: 'PARTIAL',
          observations: [],
          warnings: [
            'Catalogue visuel (Connexion Guadeloupe — Catalogue Mars 2026) : ' +
              'extraction automatique des prix non disponible. ' +
              'Consulter le catalogue : https://www.calameo.com/books/0077620289340a0cc1cc8',
          ],
        }),
      })
    );

    const result = await connexionGuadeloupeProvider.search(
      { query: 'four micro-ondes' },
      makeController().signal
    );

    expect(result.source).toBe('connexion_guadeloupe');
    expect(result.status).toBe('NO_DATA');
    expect(result.observations).toHaveLength(0);
    expect(
      result.warnings.some(
        (w) => w.toLowerCase().includes('connexion') || w.includes('0077620289340a0cc1cc8')
      )
    ).toBe(true);
  });
});
