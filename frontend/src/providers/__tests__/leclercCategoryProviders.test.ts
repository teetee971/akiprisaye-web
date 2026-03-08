/**
 * Tests partagés pour les fournisseurs E.Leclerc basés sur la factory.
 *
 * Chaque entry de PROVIDERS_UNDER_TEST est testée avec la même suite :
 *  - désactivé par défaut
 *  - activable via flag d'env
 *  - NO_DATA sans barcode/query
 *  - UNAVAILABLE si fetch échoue
 *  - mappe les observations valides
 *  - filtre les prix invalides
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { leclercJardinProvider } from '../leclercJardinProvider';
import { leclercHighTechProvider } from '../leclercHighTechProvider';
import { leclercElectromenagerProvider } from '../leclercElectromenagerProvider';
import { leclercParapharmacieProvider } from '../leclercParapharmacieProvider';
import { leclercSecondeVieProvider } from '../leclercSecondeVieProvider';
import { macaveLeclercProvider } from '../macaveLeclercProvider';
import type { PriceProvider } from '../types';

interface ProviderCase {
  name: string;
  provider: PriceProvider;
  envFlag: string;
}

const PROVIDERS_UNDER_TEST: ProviderCase[] = [
  {
    name: 'leclercJardinProvider',
    provider: leclercJardinProvider,
    envFlag: 'VITE_PRICE_PROVIDER_LECLERC_JARDIN',
  },
  {
    name: 'leclercHighTechProvider',
    provider: leclercHighTechProvider,
    envFlag: 'VITE_PRICE_PROVIDER_LECLERC_HIGHTECH',
  },
  {
    name: 'leclercElectromenagerProvider',
    provider: leclercElectromenagerProvider,
    envFlag: 'VITE_PRICE_PROVIDER_LECLERC_ELECTROMENAGER',
  },
  {
    name: 'leclercParapharmacieProvider',
    provider: leclercParapharmacieProvider,
    envFlag: 'VITE_PRICE_PROVIDER_LECLERC_PARAPHARMACIE',
  },
  {
    name: 'leclercSecondeVieProvider',
    provider: leclercSecondeVieProvider,
    envFlag: 'VITE_PRICE_PROVIDER_LECLERC_SECONDEVIE',
  },
  {
    name: 'macaveLeclercProvider',
    provider: macaveLeclercProvider,
    envFlag: 'VITE_PRICE_PROVIDER_MACAVE_LECLERC',
  },
];

const makeController = () => new AbortController();

const mockFetchOk = (observations: unknown[]) =>
  vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ status: observations.length > 0 ? 'OK' : 'NO_DATA', observations }),
  });

const mockFetchFail = () =>
  vi.fn().mockRejectedValue(new Error('Network error'));

const mockFetchHttpError = (status: number) =>
  vi.fn().mockResolvedValue({ ok: false, status });

for (const { name, provider, envFlag } of PROVIDERS_UNDER_TEST) {
  describe(name, () => {
    beforeEach(() => {
      vi.restoreAllMocks();
      vi.stubEnv(envFlag, 'false');
      vi.stubEnv('VITE_PRICE_API_BASE', '');
    });

    it('is disabled by default', () => {
      expect(provider.isEnabled()).toBe(false);
    });

    it('is enabled when env flag is true', () => {
      vi.stubEnv(envFlag, 'true');
      expect(provider.isEnabled()).toBe(true);
    });

    it('returns NO_DATA when no barcode or query provided', async () => {
      const result = await provider.search({}, makeController().signal);
      expect(result.source).toBe(provider.source);
      expect(result.status).toBe('NO_DATA');
      expect(result.observations).toHaveLength(0);
    });

    it('returns UNAVAILABLE when fetch throws', async () => {
      vi.stubEnv(envFlag, 'true');
      vi.stubEnv('VITE_PRICE_API_BASE', 'https://example.com');
      vi.stubGlobal('fetch', mockFetchFail());

      const result = await provider.search({ query: 'test' }, makeController().signal);
      expect(result.status).toBe('UNAVAILABLE');
      expect(result.observations).toHaveLength(0);
    });

    it('returns UNAVAILABLE on HTTP error', async () => {
      vi.stubEnv(envFlag, 'true');
      vi.stubEnv('VITE_PRICE_API_BASE', 'https://example.com');
      vi.stubGlobal('fetch', mockFetchHttpError(503));

      const result = await provider.search({ query: 'test' }, makeController().signal);
      expect(result.status).toBe('UNAVAILABLE');
    });

    it('maps valid observations from API response', async () => {
      vi.stubEnv(envFlag, 'true');
      vi.stubEnv('VITE_PRICE_API_BASE', 'https://example.com');
      vi.stubGlobal(
        'fetch',
        mockFetchOk([
          {
            productName: 'Produit Test',
            brand: 'Marque Test',
            barcode: '3560070000001',
            price: 9.99,
            currency: 'EUR',
            unit: 'unit',
            observedAt: '2026-03-08',
            territory: 'gp',
          },
        ]),
      );

      const result = await provider.search({ query: 'produit test' }, makeController().signal);
      expect(result.status).toBe('OK');
      expect(result.observations).toHaveLength(1);
      expect(result.observations[0].price).toBe(9.99);
      expect(result.observations[0].source).toBe(provider.source);
    });

    it('returns NO_DATA when API returns empty observations', async () => {
      vi.stubEnv(envFlag, 'true');
      vi.stubEnv('VITE_PRICE_API_BASE', 'https://example.com');
      vi.stubGlobal('fetch', mockFetchOk([]));

      const result = await provider.search({ query: 'introuvable' }, makeController().signal);
      expect(result.status).toBe('NO_DATA');
      expect(result.observations).toHaveLength(0);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('filters out observations with invalid prices', async () => {
      vi.stubEnv(envFlag, 'true');
      vi.stubEnv('VITE_PRICE_API_BASE', 'https://example.com');
      vi.stubGlobal(
        'fetch',
        mockFetchOk([
          { productName: 'Valide', price: 5.0, unit: 'unit' },
          { productName: 'Prix négatif', price: -1, unit: 'unit' },
          { productName: 'Prix zéro', price: 0, unit: 'unit' },
          { productName: 'Prix absent', unit: 'unit' },
        ]),
      );

      const result = await provider.search({ query: 'produit' }, makeController().signal);
      expect(result.status).toBe('OK');
      expect(result.observations).toHaveLength(1);
      expect(result.observations[0].productName).toBe('Valide');
    });

    it('passes territory to request params', async () => {
      vi.stubEnv(envFlag, 'true');
      vi.stubEnv('VITE_PRICE_API_BASE', 'https://example.com');

      let capturedUrl = '';
      vi.stubGlobal(
        'fetch',
        vi.fn().mockImplementation((url: string) => {
          capturedUrl = url;
          return Promise.resolve({
            ok: true,
            json: async () => ({ status: 'NO_DATA', observations: [] }),
          });
        }),
      );

      await provider.search({ query: 'tondeuse', territory: 'gp' }, makeController().signal);
      expect(capturedUrl).toContain('territory=gp');
    });
  });
}
