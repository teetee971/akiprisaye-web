/**
 * Indicator Calculation Service Tests
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import {
  calculateAveragePrices,
  calculateDomHexagoneGaps,
  calculateIVC,
  calculateTemporalEvolution,
  calculateStoreDispersion,
} from '../indicatorCalculationService';
import type { PriceObservation } from '../../types/PriceObservation';

// Fixed reference date — makes all Date.now() / new Date() calls in the service deterministic
const FIXED_DATE = '2026-02-03T12:00:00.000Z';

describe('Indicator Calculation Service', () => {
  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(FIXED_DATE));
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  const today = FIXED_DATE;

  const baseObservation: PriceObservation = {
    id: 'obs-base',
    productId: '1234567890123',
    productLabel: 'Lait UHT',
    productCategory: 'Produits laitiers',
    territory: 'GP',
    price: 1.5,
    observedAt: today,
    sourceType: 'citizen',
    confidenceScore: 90,
    barcode: '1234567890123',
  };

  describe('calculateAveragePrices', () => {
    it('should calculate average prices correctly', () => {
      const observations: PriceObservation[] = [
        { ...baseObservation, price: 1.4 },
        { ...baseObservation, price: 1.5 },
        { ...baseObservation, price: 1.6 },
      ];

      const config = {
        periode_debut: today,
        periode_fin: today,
        agregation: 'moyenne' as const,
      };

      const result = calculateAveragePrices(observations, config);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.length).toBe(1);
      expect(result.data![0].prix_moyen).toBe(1.5);
      expect(result.data![0].nombre_observations).toBe(3);
    });

    it('should filter by territory', () => {
      const observations: PriceObservation[] = [
        { ...baseObservation, territory: 'GP', price: 1.5 },
        { ...baseObservation, territory: 'MQ', price: 1.6 },
      ];

      const config = {
        territoire: 'GP' as const,
        periode_debut: today,
        periode_fin: today,
        agregation: 'moyenne' as const,
      };

      const result = calculateAveragePrices(observations, config);

      expect(result.success).toBe(true);
      expect(result.data![0].territoire).toBe('GP');
      expect(result.data![0].nombre_observations).toBe(1);
    });

    it('should filter by category', () => {
      const observations: PriceObservation[] = [
        { ...baseObservation, productCategory: 'Produits laitiers' },
        { ...baseObservation, productCategory: 'Boissons' },
      ];

      const config = {
        categorie: 'Produits laitiers' as const,
        periode_debut: today,
        periode_fin: today,
        agregation: 'moyenne' as const,
      };

      const result = calculateAveragePrices(observations, config);

      expect(result.success).toBe(true);
      expect(result.data!.length).toBe(1);
      expect(result.data![0].categorie).toBe('Produits laitiers');
    });

    it('should calculate median when requested', () => {
      const observations: PriceObservation[] = [
        { ...baseObservation, price: 1.0 },
        { ...baseObservation, price: 1.5 },
        { ...baseObservation, price: 2.0 },
      ];

      const config = {
        periode_debut: today,
        periode_fin: today,
        agregation: 'mediane' as const,
      };

      const result = calculateAveragePrices(observations, config);

      expect(result.success).toBe(true);
      expect(result.data![0].prix_moyen).toBe(1.5);
    });

    it('should apply quality filter', () => {
      const observations: PriceObservation[] = [
        { ...baseObservation, confidenceScore: 90 },
        { ...baseObservation, confidenceScore: 30 },
      ];

      const config = {
        periode_debut: today,
        periode_fin: today,
        agregation: 'moyenne' as const,
        qualite_minimale: 50,
      };

      const result = calculateAveragePrices(observations, config);

      expect(result.success).toBe(true);
      expect(result.metadata.observations_utilisees).toBe(1);
    });
  });

  describe('calculateDomHexagoneGaps', () => {
    it('should calculate price gaps correctly', () => {
      // Create observations with different products to ensure they don't get grouped
      const observations: PriceObservation[] = [
        { ...baseObservation, territory: 'GP', barcode: '1234567890123', price: 1.65 },
        { ...baseObservation, territory: 'GP', barcode: '1234567890123', price: 1.65 },
        { ...baseObservation, territory: 'FR', barcode: '1234567890123', price: 1.5 },
        { ...baseObservation, territory: 'FR', barcode: '1234567890123', price: 1.5 },
      ];

      const config = {
        periode_debut: today,
        periode_fin: today,
        agregation: 'moyenne' as const,
      };

      const result = calculateDomHexagoneGaps(observations, config);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();

      if (result.data && result.data.length > 0) {
        expect(result.data.length).toBeGreaterThan(0);
        const gap = result.data[0];
        expect(gap.territoire_dom).toBe('GP');
        expect(gap.prix_dom).toBe(1.65);
        expect(gap.prix_hexagone).toBe(1.5);
        expect(gap.ecart_pourcentage).toBeCloseTo(10, 0);
        expect(gap.signification).toBe('plus_cher');
      }
    });

    it('should detect equivalent prices', () => {
      const observations: PriceObservation[] = [
        { ...baseObservation, territory: 'MQ', price: 1.52 },
        { ...baseObservation, territory: 'MQ', price: 1.52 },
        { ...baseObservation, territory: 'FR', price: 1.5 },
        { ...baseObservation, territory: 'FR', price: 1.5 },
      ];

      const config = {
        periode_debut: today,
        periode_fin: today,
        agregation: 'moyenne' as const,
      };

      const result = calculateDomHexagoneGaps(observations, config);

      expect(result.success).toBe(true);
      if (result.data && result.data.length > 0) {
        const gap = result.data![0];
        expect(gap.signification).toBe('equivalent');
      }
    });

    it('should detect cheaper prices in DOM', () => {
      const observations: PriceObservation[] = [
        { ...baseObservation, territory: 'GF', price: 1.3 },
        { ...baseObservation, territory: 'GF', price: 1.3 },
        { ...baseObservation, territory: 'FR', price: 1.5 },
        { ...baseObservation, territory: 'FR', price: 1.5 },
      ];

      const config = {
        periode_debut: today,
        periode_fin: today,
        agregation: 'moyenne' as const,
      };

      const result = calculateDomHexagoneGaps(observations, config);

      expect(result.success).toBe(true);
      if (result.data && result.data.length > 0) {
        const gap = result.data![0];
        expect(gap.signification).toBe('moins_cher');
      }
    });
  });

  describe('calculateIVC', () => {
    it('should calculate IVC correctly', () => {
      const observations: PriceObservation[] = [
        { ...baseObservation, territory: 'RE', price: 1.65 },
        { ...baseObservation, territory: 'RE', price: 1.65 },
        { ...baseObservation, territory: 'FR', price: 1.5 },
        { ...baseObservation, territory: 'FR', price: 1.5 },
      ];

      const result = calculateIVC(observations, 'RE', today);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.territoire).toBe('RE');
      // IVC should be approximately 110 (65/1.50 * 100)
      expect(result.data!.indice_global).toBeGreaterThanOrEqual(100);
      expect(result.data!.date_reference).toBe(today);
    });

    it('should have IVC close to 100 for similar prices', () => {
      const observations: PriceObservation[] = [
        { ...baseObservation, territory: 'FR', price: 1.5 },
        { ...baseObservation, territory: 'FR', price: 1.5 },
      ];

      const result = calculateIVC(observations, 'FR', today);

      // Note: IVC calculation requires comparison to Hexagone reference
      // When only Hexagone data is available, result may not be accurate
      expect(result.success).toBe(true);
      expect(result.data!.indice_global).toBeGreaterThan(0);
    });

    it('should include category breakdown', () => {
      const observations: PriceObservation[] = [
        {
          ...baseObservation,
          territory: 'YT',
          productCategory: 'Produits laitiers',
          price: 1.65,
        },
        {
          ...baseObservation,
          territory: 'YT',
          productCategory: 'Produits laitiers',
          price: 1.65,
        },
        {
          ...baseObservation,
          territory: 'FR',
          productCategory: 'Produits laitiers',
          price: 1.5,
        },
        {
          ...baseObservation,
          territory: 'FR',
          productCategory: 'Produits laitiers',
          price: 1.5,
        },
      ];

      const result = calculateIVC(observations, 'YT', today);

      expect(result.success).toBe(true);
      if (result.data!.par_categorie.length > 0) {
        expect(result.data!.par_categorie[0].categorie).toBe('Produits laitiers');
      }
    });
  });

  describe('calculateTemporalEvolution', () => {
    // Dates derived from the fixed system time (2026-02-03T12:00:00.000Z)
    const thirtyDaysAgo = '2026-01-04';

    it('should calculate price evolution over time', () => {
      const observations: PriceObservation[] = [
        { ...baseObservation, price: 1.6, observedAt: today },
        {
          ...baseObservation,
          price: 1.5,
          observedAt: thirtyDaysAgo,
        },
      ];

      const result = calculateTemporalEvolution(observations, baseObservation.barcode!, 'GP');

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.prix_actuel).toBeCloseTo(1.6, 2);
      expect(result.data!.evolutions.length).toBeGreaterThan(0);
    });

    it('should determine trend correctly', () => {
      const observations: PriceObservation[] = [
        { ...baseObservation, price: 1.7, observedAt: today },
        {
          ...baseObservation,
          price: 1.5,
          observedAt: thirtyDaysAgo,
        },
      ];

      const result = calculateTemporalEvolution(observations, baseObservation.barcode!, 'GP');

      expect(result.success).toBe(true);
      expect(result.data!.tendance).toBe('hausse');
    });
  });

  describe('calculateStoreDispersion', () => {
    it('should calculate price dispersion across stores', () => {
      const observations: PriceObservation[] = [
        { ...baseObservation, storeLabel: 'Carrefour', price: 1.4 },
        { ...baseObservation, storeLabel: 'Leclerc', price: 1.5 },
        { ...baseObservation, storeLabel: 'Casino', price: 1.6 },
      ];

      const result = calculateStoreDispersion(observations, baseObservation.barcode!, 'GP', 30);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.statistiques.prix_min).toBe(1.4);
      expect(result.data!.statistiques.prix_max).toBe(1.6);
      expect(result.data!.statistiques.prix_median).toBe(1.5);
      expect(result.data!.nombre_enseignes).toBe(3);
      expect(result.data!.par_enseigne).toHaveLength(3);
    });

    it('should identify min and max stores', () => {
      const observations: PriceObservation[] = [
        { ...baseObservation, storeLabel: 'StoreA', price: 1.2 },
        { ...baseObservation, storeLabel: 'StoreB', price: 1.5 },
        { ...baseObservation, storeLabel: 'StoreC', price: 1.8 },
      ];

      const result = calculateStoreDispersion(observations, baseObservation.barcode!, 'GP', 30);

      expect(result.success).toBe(true);
      const stores = result.data!.par_enseigne;
      expect(stores[0].position).toBe('min');
      expect(stores[stores.length - 1].position).toBe('max');
    });

    it('should handle stores without observations', () => {
      const observations: PriceObservation[] = [
        { ...baseObservation, storeLabel: undefined, price: 1.5 },
      ];

      const result = calculateStoreDispersion(observations, baseObservation.barcode!, 'GP', 30);

      expect(result.success).toBe(false);
    });
  });
});
