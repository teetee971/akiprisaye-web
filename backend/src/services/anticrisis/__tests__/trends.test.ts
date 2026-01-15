/**
 * Tests unitaires pour le service de tendances
 * Version: 1.0.0
 */

import {
  computeTrend,
  selectAntiCrisisProducts,
  groupPricePoints,
  TrendMetrics,
} from '../trends.js';
import { priceHistory24m } from './priceHistory.24m.mock.js';

describe('Trends Service', () => {
  describe('computeTrend', () => {
    test('devrait calculer les statistiques de base correctement', () => {
      const prices = [1.0, 1.1, 1.2, 1.1, 1.0];
      const metrics = computeTrend(prices);

      expect(metrics.avgPrice).toBeCloseTo(1.08, 2);
      expect(metrics.min).toBe(1.0);
      expect(metrics.max).toBe(1.2);
      expect(metrics.observations).toBe(5);
    });

    test('devrait calculer le MoM correctement', () => {
      const prices = [1.0, 1.1]; // +10%
      const metrics = computeTrend(prices);

      expect(metrics.momPct).toBeCloseTo(10, 1);
    });

    test('devrait calculer le YoY correctement avec 13+ observations', () => {
      // 13 mois: mois 0 à 1.00, mois 12 à 1.12 = +12%
      const prices = Array.from({ length: 13 }, (_, i) => 1.0 + i * 0.01);
      const metrics = computeTrend(prices);

      expect(metrics.yoyPct).toBeDefined();
      expect(metrics.yoyPct).toBeCloseTo(12, 1);
    });

    test('ne devrait pas calculer YoY avec moins de 13 observations', () => {
      const prices = Array.from({ length: 12 }, (_, i) => 1.0 + i * 0.01);
      const metrics = computeTrend(prices);

      expect(metrics.yoyPct).toBeUndefined();
    });

    test('devrait identifier un produit stable', () => {
      // Prix très stable (variation minimale)
      const prices = [1.29, 1.30, 1.29, 1.30, 1.29, 1.30];
      const metrics = computeTrend(prices);

      expect(metrics.stable).toBe(true);
      expect(metrics.volatility).toBeLessThan(0.02);
    });

    test('devrait identifier un produit instable', () => {
      // Prix volatile (variations importantes)
      const prices = [2.1, 2.9, 2.4, 2.8, 2.2, 2.95];
      const metrics = computeTrend(prices);

      expect(metrics.stable).toBe(false);
      expect(metrics.volatility).toBeGreaterThan(0.2);
    });

    test('devrait calculer une pente positive pour inflation', () => {
      // Prix en augmentation régulière
      const prices = Array.from({ length: 12 }, (_, i) => 1.0 + i * 0.05);
      const metrics = computeTrend(prices);

      expect(metrics.slope).toBeGreaterThan(0);
    });

    test('devrait calculer une pente négative pour déflation', () => {
      // Prix en baisse régulière
      const prices = Array.from({ length: 12 }, (_, i) => 2.0 - i * 0.05);
      const metrics = computeTrend(prices);

      expect(metrics.slope).toBeLessThan(0);
    });

    test('devrait lever une erreur pour un tableau vide', () => {
      expect(() => computeTrend([])).toThrow();
    });
  });

  describe('selectAntiCrisisProducts', () => {
    test('devrait retenir uniquement les produits stables', () => {
      const series = {
        rice: [1.28, 1.29, 1.30, 1.29, 1.28, 1.30], // Stable
        oil: [2.1, 2.9, 2.4, 2.8, 2.2, 2.95],        // Instable
        pasta: [0.89, 0.90, 0.89, 0.90, 0.89, 0.90], // Stable
      };

      const selected = selectAntiCrisisProducts(series);

      expect(selected.map(s => s.productId)).toContain('rice');
      expect(selected.map(s => s.productId)).toContain('pasta');
      expect(selected.map(s => s.productId)).not.toContain('oil');
    });

    test('devrait trier les produits par prix moyen croissant', () => {
      const series = {
        expensive: [5.0, 5.0, 5.0, 5.1, 5.1, 5.0], // Stable mais cher
        cheap: [1.0, 1.0, 1.0, 1.1, 1.1, 1.0],     // Stable et pas cher
        medium: [3.0, 3.0, 3.0, 3.1, 3.1, 3.0],    // Stable intermédiaire
      };

      const selected = selectAntiCrisisProducts(series);

      expect(selected).toHaveLength(3);
      expect(selected[0].productId).toBe('cheap');
      expect(selected[1].productId).toBe('medium');
      expect(selected[2].productId).toBe('expensive');
    });

    test('devrait retourner un tableau vide si aucun produit stable', () => {
      const series = {
        volatile1: [1.0, 2.0, 1.5, 2.5, 1.2],
        volatile2: [3.0, 5.0, 3.5, 5.5, 3.2],
      };

      const selected = selectAntiCrisisProducts(series);

      expect(selected).toHaveLength(0);
    });
  });

  describe('groupPricePoints', () => {
    test('devrait grouper les prix par produit et enseigne', () => {
      const points = [
        { productId: 'p1', storeId: 's1', price: 1.0 },
        { productId: 'p1', storeId: 's1', price: 1.1 },
        { productId: 'p1', storeId: 's2', price: 1.2 },
        { productId: 'p2', storeId: 's1', price: 2.0 },
      ];

      const groups = groupPricePoints(points);

      expect(groups['p1_s1']).toEqual([1.0, 1.1]);
      expect(groups['p1_s2']).toEqual([1.2]);
      expect(groups['p2_s1']).toEqual([2.0]);
    });

    test('devrait filtrer par territoire si spécifié', () => {
      const points = [
        { productId: 'p1', storeId: 's1', territory: '971', price: 1.0 },
        { productId: 'p1', storeId: 's1', territory: '972', price: 1.5 },
        { productId: 'p1', storeId: 's1', territory: '971', price: 1.1 },
      ];

      const groups = groupPricePoints(points, '971');

      expect(groups['p1_s1_971']).toEqual([1.0, 1.1]);
      expect(groups['p1_s1_972']).toBeUndefined();
    });
  });

  describe('Dataset 24 mois réel', () => {
    test('devrait exclure l\'huile (instable) du panier anti-crise', () => {
      // Grouper les prix par produit/enseigne pour le territoire 971
      const groups = groupPricePoints(priceHistory24m, '971');

      // Calculer les tendances
      const trends: Record<string, TrendMetrics> = {};
      for (const [key, prices] of Object.entries(groups)) {
        trends[key] = computeTrend(prices);
      }

      // Vérifier que l'huile est instable
      const oilKey = Object.keys(trends).find(k => k.includes('p_oil_1l'));
      if (oilKey) {
        expect(trends[oilKey].stable).toBe(false);
        expect(trends[oilKey].volatility).toBeGreaterThan(0.15);
      }

      // Vérifier que le riz est stable
      const riceKey = Object.keys(trends).find(k => k.includes('p_rice_1kg'));
      if (riceKey) {
        expect(trends[riceKey].stable).toBe(true);
      }
    });

    test('devrait calculer correctement les YoY sur 24 mois', () => {
      // Grouper les prix pour la Guyane (inflation progressive)
      const groups = groupPricePoints(priceHistory24m, '973');

      for (const prices of Object.values(groups)) {
        if (prices.length === 24) {
          const metrics = computeTrend(prices);
          
          // Avec 24 observations, YoY doit être défini
          expect(metrics.yoyPct).toBeDefined();
          expect(metrics.observations).toBe(24);
        }
      }
    });

    test('devrait identifier tous les territoires correctement', () => {
      const territories = ['971', '972', '973', '974'];
      
      for (const territory of territories) {
        const groups = groupPricePoints(priceHistory24m, territory);
        
        // Chaque territoire doit avoir des données
        expect(Object.keys(groups).length).toBeGreaterThan(0);
        
        // Toutes les clés doivent contenir le territoire
        Object.keys(groups).forEach(key => {
          expect(key).toContain(territory);
        });
      }
    });

    test('devrait respecter les écarts logistiques DOM sur 24 mois', () => {
      // Comparer les prix moyens du riz entre territoires
      const territories = ['971', '972', '973', '974'];
      const riceAvgPrices: Record<string, number> = {};

      for (const territory of territories) {
        const groups = groupPricePoints(priceHistory24m, territory);
        const riceKey = Object.keys(groups).find(k => k.includes('p_rice_1kg'));
        
        if (riceKey) {
          const metrics = computeTrend(groups[riceKey]);
          riceAvgPrices[territory] = metrics.avgPrice;
        }
      }

      // Guyane (973) doit être le plus cher (logistique)
      expect(riceAvgPrices['973']).toBeGreaterThan(riceAvgPrices['971']);
      expect(riceAvgPrices['973']).toBeGreaterThan(riceAvgPrices['972']);
      expect(riceAvgPrices['973']).toBeGreaterThan(riceAvgPrices['974']);
    });
  });
});
