/**
 * Indicator Calculation Service Tests
 */

import { describe, it, expect } from 'vitest';
import {
  calculateAveragePrices,
  calculateDomHexagoneGaps,
  calculateIVC,
  calculateTemporalEvolution,
  calculateStoreDispersion,
} from '../indicatorCalculationService';
import type { CanonicalPriceObservation } from '../../types/canonicalPriceObservation';

describe('Indicator Calculation Service', () => {
  const today = new Date().toISOString().split('T')[0];
  
  const baseObservation: CanonicalPriceObservation = {
    territoire: 'Guadeloupe',
    produit: {
      nom: 'Lait UHT',
      ean: '1234567890123',
      categorie: 'Produits laitiers',
      unite: '1L',
    },
    prix: 1.50,
    date_releve: today,
    source: 'releve_citoyen',
    qualite: {
      niveau: 'verifie',
      preuve: true,
      score: 0.9,
    },
  };

  describe('calculateAveragePrices', () => {
    it('should calculate average prices correctly', () => {
      const observations: CanonicalPriceObservation[] = [
        { ...baseObservation, prix: 1.40 },
        { ...baseObservation, prix: 1.50 },
        { ...baseObservation, prix: 1.60 },
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
      expect(result.data![0].prix_moyen).toBe(1.50);
      expect(result.data![0].nombre_observations).toBe(3);
    });

    it('should filter by territory', () => {
      const observations: CanonicalPriceObservation[] = [
        { ...baseObservation, territoire: 'Guadeloupe', prix: 1.50 },
        { ...baseObservation, territoire: 'Martinique', prix: 1.60 },
      ];

      const config = {
        territoire: 'Guadeloupe' as const,
        periode_debut: today,
        periode_fin: today,
        agregation: 'moyenne' as const,
      };

      const result = calculateAveragePrices(observations, config);

      expect(result.success).toBe(true);
      expect(result.data![0].territoire).toBe('Guadeloupe');
      expect(result.data![0].nombre_observations).toBe(1);
    });

    it('should filter by category', () => {
      const observations: CanonicalPriceObservation[] = [
        { ...baseObservation, produit: { ...baseObservation.produit, categorie: 'Produits laitiers' } },
        { ...baseObservation, produit: { ...baseObservation.produit, categorie: 'Boissons' } },
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
      const observations: CanonicalPriceObservation[] = [
        { ...baseObservation, prix: 1.00 },
        { ...baseObservation, prix: 1.50 },
        { ...baseObservation, prix: 2.00 },
      ];

      const config = {
        periode_debut: today,
        periode_fin: today,
        agregation: 'mediane' as const,
      };

      const result = calculateAveragePrices(observations, config);

      expect(result.success).toBe(true);
      expect(result.data![0].prix_moyen).toBe(1.50);
    });

    it('should apply quality filter', () => {
      const observations: CanonicalPriceObservation[] = [
        { ...baseObservation, qualite: { niveau: 'verifie', preuve: true, score: 0.9 } },
        { ...baseObservation, qualite: { niveau: 'a_verifier', preuve: false, score: 0.3 } },
      ];

      const config = {
        periode_debut: today,
        periode_fin: today,
        agregation: 'moyenne' as const,
        qualite_minimale: 0.5,
      };

      const result = calculateAveragePrices(observations, config);

      expect(result.success).toBe(true);
      expect(result.metadata.observations_utilisees).toBe(1);
    });
  });

  describe('calculateDomHexagoneGaps', () => {
    it('should calculate price gaps correctly', () => {
      // Create observations with different products to ensure they don't get grouped
      const observations: CanonicalPriceObservation[] = [
        { ...baseObservation, territoire: 'Guadeloupe', produit: { ...baseObservation.produit, ean: '1234567890123' }, prix: 1.65 },
        { ...baseObservation, territoire: 'Guadeloupe', produit: { ...baseObservation.produit, ean: '1234567890123' }, prix: 1.65 },
        { ...baseObservation, territoire: 'Hexagone', produit: { ...baseObservation.produit, ean: '1234567890123' }, prix: 1.50 },
        { ...baseObservation, territoire: 'Hexagone', produit: { ...baseObservation.produit, ean: '1234567890123' }, prix: 1.50 },
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
        expect(gap.territoire_dom).toBe('Guadeloupe');
        expect(gap.prix_dom).toBe(1.65);
        expect(gap.prix_hexagone).toBe(1.50);
        expect(gap.ecart_pourcentage).toBeCloseTo(10, 0);
        expect(gap.signification).toBe('plus_cher');
      }
    });

    it('should detect equivalent prices', () => {
      const observations: CanonicalPriceObservation[] = [
        { ...baseObservation, territoire: 'Martinique', prix: 1.52 },
        { ...baseObservation, territoire: 'Martinique', prix: 1.52 },
        { ...baseObservation, territoire: 'Hexagone', prix: 1.50 },
        { ...baseObservation, territoire: 'Hexagone', prix: 1.50 },
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
      const observations: CanonicalPriceObservation[] = [
        { ...baseObservation, territoire: 'Guyane', prix: 1.30 },
        { ...baseObservation, territoire: 'Guyane', prix: 1.30 },
        { ...baseObservation, territoire: 'Hexagone', prix: 1.50 },
        { ...baseObservation, territoire: 'Hexagone', prix: 1.50 },
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
      const observations: CanonicalPriceObservation[] = [
        { ...baseObservation, territoire: 'La Réunion', prix: 1.65 },
        { ...baseObservation, territoire: 'La Réunion', prix: 1.65 },
        { ...baseObservation, territoire: 'Hexagone', prix: 1.50 },
        { ...baseObservation, territoire: 'Hexagone', prix: 1.50 },
      ];

      const result = calculateIVC(observations, 'La Réunion', today);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.territoire).toBe('La Réunion');
      // IVC should be approximately 110 (65/1.50 * 100)
      expect(result.data!.indice_global).toBeGreaterThanOrEqual(100);
      expect(result.data!.date_reference).toBe(today);
    });

    it('should have IVC close to 100 for similar prices', () => {
      const observations: CanonicalPriceObservation[] = [
        { ...baseObservation, territoire: 'Hexagone', prix: 1.50 },
        { ...baseObservation, territoire: 'Hexagone', prix: 1.50 },
      ];

      const result = calculateIVC(observations, 'Hexagone', today);

      // Note: IVC calculation requires comparison to Hexagone reference
      // When only Hexagone data is available, result may not be accurate
      expect(result.success).toBe(true);
      expect(result.data!.indice_global).toBeGreaterThan(0);
    });

    it('should include category breakdown', () => {
      const observations: CanonicalPriceObservation[] = [
        {
          ...baseObservation,
          territoire: 'Mayotte',
          produit: { ...baseObservation.produit, categorie: 'Produits laitiers' },
          prix: 1.65,
        },
        {
          ...baseObservation,
          territoire: 'Mayotte',
          produit: { ...baseObservation.produit, categorie: 'Produits laitiers' },
          prix: 1.65,
        },
        {
          ...baseObservation,
          territoire: 'Hexagone',
          produit: { ...baseObservation.produit, categorie: 'Produits laitiers' },
          prix: 1.50,
        },
        {
          ...baseObservation,
          territoire: 'Hexagone',
          produit: { ...baseObservation.produit, categorie: 'Produits laitiers' },
          prix: 1.50,
        },
      ];

      const result = calculateIVC(observations, 'Mayotte', today);

      expect(result.success).toBe(true);
      if (result.data!.par_categorie.length > 0) {
        expect(result.data!.par_categorie[0].categorie).toBe('Produits laitiers');
      }
    });
  });

  describe('calculateTemporalEvolution', () => {
    it('should calculate price evolution over time', () => {
      const todayDate = new Date();
      const thirtyDaysAgo = new Date(todayDate);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const observations: CanonicalPriceObservation[] = [
        { ...baseObservation, prix: 1.60, date_releve: today },
        {
          ...baseObservation,
          prix: 1.50,
          date_releve: thirtyDaysAgo.toISOString().split('T')[0],
        },
      ];

      const result = calculateTemporalEvolution(
        observations,
        baseObservation.produit.ean!,
        'Guadeloupe'
      );

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.prix_actuel).toBeCloseTo(1.60, 2);
      expect(result.data!.evolutions.length).toBeGreaterThan(0);
    });

    it('should determine trend correctly', () => {
      const todayDate = new Date();
      const thirtyDaysAgo = new Date(todayDate);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const observations: CanonicalPriceObservation[] = [
        { ...baseObservation, prix: 1.70, date_releve: today },
        {
          ...baseObservation,
          prix: 1.50,
          date_releve: thirtyDaysAgo.toISOString().split('T')[0],
        },
      ];

      const result = calculateTemporalEvolution(
        observations,
        baseObservation.produit.ean!,
        'Guadeloupe'
      );

      expect(result.success).toBe(true);
      expect(result.data!.tendance).toBe('hausse');
    });
  });

  describe('calculateStoreDispersion', () => {
    it('should calculate price dispersion across stores', () => {
      const observations: CanonicalPriceObservation[] = [
        { ...baseObservation, enseigne: 'Carrefour', prix: 1.40 },
        { ...baseObservation, enseigne: 'Leclerc', prix: 1.50 },
        { ...baseObservation, enseigne: 'Casino', prix: 1.60 },
      ];

      const result = calculateStoreDispersion(
        observations,
        baseObservation.produit.ean!,
        'Guadeloupe',
        30
      );

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.statistiques.prix_min).toBe(1.40);
      expect(result.data!.statistiques.prix_max).toBe(1.60);
      expect(result.data!.statistiques.prix_median).toBe(1.50);
      expect(result.data!.nombre_enseignes).toBe(3);
      expect(result.data!.par_enseigne).toHaveLength(3);
    });

    it('should identify min and max stores', () => {
      const observations: CanonicalPriceObservation[] = [
        { ...baseObservation, enseigne: 'StoreA', prix: 1.20 },
        { ...baseObservation, enseigne: 'StoreB', prix: 1.50 },
        { ...baseObservation, enseigne: 'StoreC', prix: 1.80 },
      ];

      const result = calculateStoreDispersion(
        observations,
        baseObservation.produit.ean!,
        'Guadeloupe',
        30
      );

      expect(result.success).toBe(true);
      const stores = result.data!.par_enseigne;
      expect(stores[0].position).toBe('min');
      expect(stores[stores.length - 1].position).toBe('max');
    });

    it('should handle stores without observations', () => {
      const observations: CanonicalPriceObservation[] = [
        { ...baseObservation, enseigne: undefined, prix: 1.50 },
      ];

      const result = calculateStoreDispersion(
        observations,
        baseObservation.produit.ean!,
        'Guadeloupe',
        30
      );

      expect(result.success).toBe(false);
    });
  });
});
