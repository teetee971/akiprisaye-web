/**
 * Tests unitaires pour AntiCrisisBasketService
 * Version: 1.0.0
 * 
 * Scénarios de test:
 * 1. Produit stable et durablement moins cher → INCLUS
 * 2. Produit avec promotion ponctuelle → EXCLU
 * 3. Données insuffisantes → EXCLU
 * 4. Produit avec prix instable → EXCLU
 * 5. Produit sans observation récente → EXCLU
 * 6. Produit avec écart insuffisant vs 2ᵉ prix → EXCLU
 */

import {
  AntiCrisisBasketService,
  PriceObservation,
} from '../antiCrisisBasketService.js';
import { priceObservations } from './priceObservations.mock.js';
import { priceObservationsMultiTerritories } from './priceObservations.multiTerritories.mock.js';
import { priceObservationsLarge } from './priceObservations.large.mock.js';

describe('AntiCrisisBasketService', () => {
  let service: AntiCrisisBasketService;

  beforeEach(() => {
    service = AntiCrisisBasketService.getInstance();
  });

  test('devrait créer une instance singleton', () => {
    const instance1 = AntiCrisisBasketService.getInstance();
    const instance2 = AntiCrisisBasketService.getInstance();
    expect(instance1).toBe(instance2);
  });

  describe('Produit stable durablement moins cher', () => {
    test('devrait inclure un produit qui respecte tous les critères', () => {
      // Création d'observations pour un produit stable
      const observations: PriceObservation[] = [];
      const baseDate = new Date('2026-01-01');

      // 10 observations sur 10 jours différents
      // Magasin A: toujours à 5€ (stable, le moins cher)
      // Magasin B: toujours à 6€
      for (let i = 0; i < 10; i++) {
        const date = new Date(baseDate);
        date.setDate(date.getDate() + i);

        observations.push({
          date,
          price: 5.0,
          storeId: 'store-a',
          storeName: 'Magasin A',
          productId: 'product-1',
          productName: 'Riz 1kg',
          category: 'Alimentation',
          source: 'test',
        });

        observations.push({
          date,
          price: 6.0,
          storeId: 'store-b',
          storeName: 'Magasin B',
          productId: 'product-1',
          productName: 'Riz 1kg',
          category: 'Alimentation',
          source: 'test',
        });
      }

      const result = service.getAntiCrisisBasket('GUADELOUPE', observations);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        productId: 'product-1',
        productName: 'Riz 1kg',
        category: 'Alimentation',
        storeId: 'store-a',
        storeName: 'Magasin A',
        avgPrice: 5.0,
        cheapestRate: 100, // 100% du temps le moins cher
        observations: 10,
      });
      expect(result[0].avgDeltaVsSecond).toBeGreaterThan(0);
    });
  });

  describe('Produit avec promotion ponctuelle', () => {
    test('devrait exclure un produit avec prix instable (promotion)', () => {
      const observations: PriceObservation[] = [];
      const baseDate = new Date('2026-01-01');

      // 10 observations
      // Magasin A: 9 fois à 5€, 1 fois à 2€ (promotion)
      // Magasin B: toujours à 5.5€
      for (let i = 0; i < 10; i++) {
        const date = new Date(baseDate);
        date.setDate(date.getDate() + i);

        // Promotion au 5ème jour
        const priceA = i === 4 ? 2.0 : 5.0;

        observations.push({
          date,
          price: priceA,
          storeId: 'store-a',
          storeName: 'Magasin A',
          productId: 'product-promo',
          productName: 'Produit Promo',
          category: 'Alimentation',
          source: 'test',
        });

        observations.push({
          date,
          price: 5.5,
          storeId: 'store-b',
          storeName: 'Magasin B',
          productId: 'product-promo',
          productName: 'Produit Promo',
          category: 'Alimentation',
          source: 'test',
        });
      }

      const result = service.getAntiCrisisBasket('GUADELOUPE', observations);

      // Le produit devrait être exclu car la variance est trop élevée
      // (coefficient de variation > 15%)
      expect(result).toHaveLength(0);
    });
  });

  describe('Données insuffisantes', () => {
    test('devrait exclure un produit avec moins de 5 observations', () => {
      const observations: PriceObservation[] = [];
      const baseDate = new Date('2026-01-01');

      // Seulement 3 observations (< 5 minimum)
      for (let i = 0; i < 3; i++) {
        const date = new Date(baseDate);
        date.setDate(date.getDate() + i);

        observations.push({
          date,
          price: 5.0,
          storeId: 'store-a',
          storeName: 'Magasin A',
          productId: 'product-few',
          productName: 'Produit Peu Observé',
          category: 'Alimentation',
          source: 'test',
        });
      }

      const result = service.getAntiCrisisBasket('GUADELOUPE', observations);

      expect(result).toHaveLength(0);
    });

    test('devrait inclure un produit avec exactement 5 observations si stable', () => {
      const observations: PriceObservation[] = [];
      const baseDate = new Date('2026-01-01');

      // Exactement 5 observations
      for (let i = 0; i < 5; i++) {
        const date = new Date(baseDate);
        date.setDate(date.getDate() + i);

        observations.push({
          date,
          price: 5.0,
          storeId: 'store-a',
          storeName: 'Magasin A',
          productId: 'product-exact',
          productName: 'Produit Exact',
          category: 'Alimentation',
          source: 'test',
        });

        observations.push({
          date,
          price: 6.0,
          storeId: 'store-b',
          storeName: 'Magasin B',
          productId: 'product-exact',
          productName: 'Produit Exact',
          category: 'Alimentation',
          source: 'test',
        });
      }

      const result = service.getAntiCrisisBasket('GUADELOUPE', observations);

      expect(result).toHaveLength(1);
      expect(result[0].observations).toBe(5);
    });
  });

  describe('Produit sans observations récentes', () => {
    test('devrait exclure un produit sans observation récente (> 90 jours)', () => {
      const observations: PriceObservation[] = [];
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 100); // 100 jours dans le passé

      // 10 observations anciennes
      for (let i = 0; i < 10; i++) {
        const date = new Date(oldDate);
        date.setDate(date.getDate() + i);

        observations.push({
          date,
          price: 5.0,
          storeId: 'store-a',
          storeName: 'Magasin A',
          productId: 'product-old',
          productName: 'Produit Ancien',
          category: 'Alimentation',
          source: 'test',
        });

        observations.push({
          date,
          price: 6.0,
          storeId: 'store-b',
          storeName: 'Magasin B',
          productId: 'product-old',
          productName: 'Produit Ancien',
          category: 'Alimentation',
          source: 'test',
        });
      }

      const result = service.getAntiCrisisBasket('GUADELOUPE', observations);

      expect(result).toHaveLength(0);
    });
  });

  describe('Taux "moins cher" insuffisant', () => {
    test('devrait exclure un produit moins cher moins de 70% du temps', () => {
      const observations: PriceObservation[] = [];
      const baseDate = new Date('2026-01-01');

      // 10 observations
      // Magasin A: moins cher 6 fois sur 10 (60% < 70%)
      // Magasin B: moins cher 4 fois sur 10
      for (let i = 0; i < 10; i++) {
        const date = new Date(baseDate);
        date.setDate(date.getDate() + i);

        const priceA = i < 6 ? 5.0 : 5.5;
        const priceB = i < 6 ? 5.5 : 5.0;

        observations.push({
          date,
          price: priceA,
          storeId: 'store-a',
          storeName: 'Magasin A',
          productId: 'product-unstable',
          productName: 'Produit Instable',
          category: 'Alimentation',
          source: 'test',
        });

        observations.push({
          date,
          price: priceB,
          storeId: 'store-b',
          storeName: 'Magasin B',
          productId: 'product-unstable',
          productName: 'Produit Instable',
          category: 'Alimentation',
          source: 'test',
        });
      }

      const result = service.getAntiCrisisBasket('GUADELOUPE', observations);

      expect(result).toHaveLength(0);
    });
  });

  describe('Options de configuration', () => {
    test('devrait respecter minObservations personnalisé', () => {
      const observations: PriceObservation[] = [];
      const baseDate = new Date('2026-01-01');

      // 3 observations seulement
      for (let i = 0; i < 3; i++) {
        const date = new Date(baseDate);
        date.setDate(date.getDate() + i);

        observations.push({
          date,
          price: 5.0,
          storeId: 'store-a',
          storeName: 'Magasin A',
          productId: 'product-custom',
          productName: 'Produit Custom',
          category: 'Alimentation',
          source: 'test',
        });

        observations.push({
          date,
          price: 6.0,
          storeId: 'store-b',
          storeName: 'Magasin B',
          productId: 'product-custom',
          productName: 'Produit Custom',
          category: 'Alimentation',
          source: 'test',
        });
      }

      // Avec minObservations = 3, devrait être inclus
      const result = service.getAntiCrisisBasket('GUADELOUPE', observations, {
        minObservations: 3,
      });

      expect(result).toHaveLength(1);
      expect(result[0].observations).toBe(3);
    });

    test('devrait respecter minCheapestRate personnalisé', () => {
      const observations: PriceObservation[] = [];
      const baseDate = new Date('2026-01-01');

      // 10 observations
      // Magasin A: moins cher 6 fois sur 10 (60%)
      for (let i = 0; i < 10; i++) {
        const date = new Date(baseDate);
        date.setDate(date.getDate() + i);

        const priceA = i < 6 ? 5.0 : 5.5;
        const priceB = i < 6 ? 5.5 : 5.0;

        observations.push({
          date,
          price: priceA,
          storeId: 'store-a',
          storeName: 'Magasin A',
          productId: 'product-rate',
          productName: 'Produit Rate',
          category: 'Alimentation',
          source: 'test',
        });

        observations.push({
          date,
          price: priceB,
          storeId: 'store-b',
          storeName: 'Magasin B',
          productId: 'product-rate',
          productName: 'Produit Rate',
          category: 'Alimentation',
          source: 'test',
        });
      }

      // Avec minCheapestRate = 50%, devrait être inclus
      const result = service.getAntiCrisisBasket('GUADELOUPE', observations, {
        minCheapestRate: 50,
      });

      expect(result).toHaveLength(1);
      expect(result[0].cheapestRate).toBe(60);
    });
  });

  describe('Cas multiples produits', () => {
    test('devrait trier les produits par prix moyen croissant', () => {
      const observations: PriceObservation[] = [];
      const baseDate = new Date('2026-01-01');

      // Produit 1: prix moyen 5€
      // Produit 2: prix moyen 3€
      // Produit 3: prix moyen 7€
      const products = [
        { id: 'product-1', name: 'Produit 1', avgPrice: 5.0 },
        { id: 'product-2', name: 'Produit 2', avgPrice: 3.0 },
        { id: 'product-3', name: 'Produit 3', avgPrice: 7.0 },
      ];

      for (const product of products) {
        for (let i = 0; i < 10; i++) {
          const date = new Date(baseDate);
          date.setDate(date.getDate() + i);

          observations.push({
            date,
            price: product.avgPrice,
            storeId: 'store-a',
            storeName: 'Magasin A',
            productId: product.id,
            productName: product.name,
            category: 'Alimentation',
            source: 'test',
          });

          observations.push({
            date,
            price: product.avgPrice + 1,
            storeId: 'store-b',
            storeName: 'Magasin B',
            productId: product.id,
            productName: product.name,
            category: 'Alimentation',
            source: 'test',
          });
        }
      }

      const result = service.getAntiCrisisBasket('GUADELOUPE', observations);

      expect(result).toHaveLength(3);
      // Vérifier ordre croissant
      expect(result[0].avgPrice).toBeLessThan(result[1].avgPrice);
      expect(result[1].avgPrice).toBeLessThan(result[2].avgPrice);
      // Vérifier valeurs
      expect(result[0].productName).toBe('Produit 2'); // 3€
      expect(result[1].productName).toBe('Produit 1'); // 5€
      expect(result[2].productName).toBe('Produit 3'); // 7€
    });
  });

  describe('Calcul de avgDeltaVsSecond', () => {
    test('devrait calculer correctement l\'écart avec le 2ᵉ prix', () => {
      const observations: PriceObservation[] = [];
      const baseDate = new Date('2026-01-01');

      // Magasin A: 5€ (le moins cher)
      // Magasin B: 6€ (2ᵉ moins cher, écart = 1€)
      // Magasin C: 7€
      for (let i = 0; i < 10; i++) {
        const date = new Date(baseDate);
        date.setDate(date.getDate() + i);

        observations.push({
          date,
          price: 5.0,
          storeId: 'store-a',
          storeName: 'Magasin A',
          productId: 'product-delta',
          productName: 'Produit Delta',
          category: 'Alimentation',
          source: 'test',
        });

        observations.push({
          date,
          price: 6.0,
          storeId: 'store-b',
          storeName: 'Magasin B',
          productId: 'product-delta',
          productName: 'Produit Delta',
          category: 'Alimentation',
          source: 'test',
        });

        observations.push({
          date,
          price: 7.0,
          storeId: 'store-c',
          storeName: 'Magasin C',
          productId: 'product-delta',
          productName: 'Produit Delta',
          category: 'Alimentation',
          source: 'test',
        });
      }

      const result = service.getAntiCrisisBasket('GUADELOUPE', observations);

      expect(result).toHaveLength(1);
      // L'écart moyen devrait être proche de 1€ (6€ - 5€)
      expect(result[0].avgDeltaVsSecond).toBeCloseTo(1.0, 1);
    });
  });

  describe('Aucune observation', () => {
    test('devrait retourner un tableau vide si aucune observation', () => {
      const result = service.getAntiCrisisBasket('GUADELOUPE', []);

      expect(result).toHaveLength(0);
    });
  });

  describe('Jeu de données réaliste complet', () => {
    test('devrait inclure uniquement les produits anti-crise valides', () => {
      // Utilisation du jeu de données de test réaliste fourni
      const result = service.getAntiCrisisBasket('971', priceObservations);

      // ✅ Résultat attendu: uniquement le riz long grain 1kg
      expect(result).toHaveLength(1);
      expect(result[0].productId).toBe('p_rice_1kg');
      expect(result[0].productName).toBe('Riz long grain 1kg');
      expect(result[0].category).toBe('Épicerie');
      expect(result[0].storeId).toBe('store_A');
      expect(result[0].storeName).toBe('SuperMarché A');

      // Vérifications des métriques
      expect(result[0].avgPrice).toBeCloseTo(1.29, 2); // Prix moyen stable autour de 1.29€
      expect(result[0].cheapestRate).toBeGreaterThanOrEqual(70); // Au moins 70% du temps le moins cher
      expect(result[0].observations).toBeGreaterThanOrEqual(5); // Au moins 5 observations
      expect(result[0].avgDeltaVsSecond).toBeGreaterThan(0); // Écart significatif avec le 2ᵉ prix
    });

    test('devrait exclure le soda (promo ponctuelle)', () => {
      const result = service.getAntiCrisisBasket('971', priceObservations);

      // Le soda ne doit pas être inclus car variance trop élevée (promo 0.99€)
      const sodaProduct = result.find(p => p.productId === 'p_soda_1l');
      expect(sodaProduct).toBeUndefined();
    });

    test('devrait exclure le lait (données insuffisantes)', () => {
      const result = service.getAntiCrisisBasket('971', priceObservations);

      // Le lait ne doit pas être inclus car < 5 observations
      const milkProduct = result.find(p => p.productId === 'p_milk_1l');
      expect(milkProduct).toBeUndefined();
    });

    test('devrait exclure l\'huile (prix instable)', () => {
      const result = service.getAntiCrisisBasket('971', priceObservations);

      // L'huile ne doit pas être incluse car variance trop élevée
      const oilProduct = result.find(p => p.productId === 'p_oil_1l');
      expect(oilProduct).toBeUndefined();
    });

    test('devrait fournir des métadonnées complètes et traçables', () => {
      const result = service.getAntiCrisisBasket('971', priceObservations);

      expect(result).toHaveLength(1);
      const product = result[0];

      // Vérifier que toutes les métadonnées requises sont présentes
      expect(product.productId).toBeDefined();
      expect(product.productName).toBeDefined();
      expect(product.category).toBeDefined();
      expect(product.storeId).toBeDefined();
      expect(product.storeName).toBeDefined();
      expect(product.avgPrice).toBeGreaterThan(0);
      expect(product.cheapestRate).toBeGreaterThanOrEqual(0);
      expect(product.cheapestRate).toBeLessThanOrEqual(100);
      expect(product.observations).toBeGreaterThanOrEqual(5);
      expect(product.avgDeltaVsSecond).toBeGreaterThanOrEqual(0);
      expect(product.lastObservedAt).toBeDefined();

      // Vérifier le format de la date
      expect(() => new Date(product.lastObservedAt)).not.toThrow();
    });
  });

  describe('Jeu de données multi-territoires', () => {
    test('devrait retourner un panier anti-crise par territoire (971 - Guadeloupe)', () => {
      const basket = service.getAntiCrisisBasket('971', priceObservationsMultiTerritories);

      // ✅ Résultat attendu: 1 produit (riz), soda exclu (promo)
      expect(basket).toHaveLength(1);
      expect(basket[0].productId).toBe('p_rice_1kg');
      expect(basket[0].productName).toBe('Riz long grain 1kg');
      expect(basket[0].storeId).toBe('lp_971');
      expect(basket[0].storeName).toBe('Leader Price');
      expect(basket[0].avgPrice).toBeCloseTo(1.29, 2);
      expect(basket[0].cheapestRate).toBeGreaterThanOrEqual(70);
    });

    test('devrait retourner un panier anti-crise par territoire (972 - Martinique)', () => {
      const basket = service.getAntiCrisisBasket('972', priceObservationsMultiTerritories);

      // ✅ Résultat attendu: 1 produit (riz), huile exclue (instable)
      expect(basket).toHaveLength(1);
      expect(basket[0].productId).toBe('p_rice_1kg');
      expect(basket[0].productName).toBe('Riz long grain 1kg');
      expect(basket[0].storeId).toBe('u_972');
      expect(basket[0].storeName).toBe('Super U');
      expect(basket[0].avgPrice).toBeCloseTo(1.35, 2);
      expect(basket[0].cheapestRate).toBeGreaterThanOrEqual(70);
    });

    test('devrait retourner un panier anti-crise par territoire (973 - Guyane)', () => {
      const basket = service.getAntiCrisisBasket('973', priceObservationsMultiTerritories);

      // ✅ Résultat attendu: 1 produit (riz)
      // Prix plus élevé en Guyane (logistique), mais stable
      expect(basket).toHaveLength(1);
      expect(basket[0].productId).toBe('p_rice_1kg');
      expect(basket[0].productName).toBe('Riz long grain 1kg');
      expect(basket[0].storeId).toBe('cg_973');
      expect(basket[0].storeName).toBe('Carrefour Guyane');
      expect(basket[0].avgPrice).toBeCloseTo(1.56, 2);
      expect(basket[0].cheapestRate).toBeGreaterThanOrEqual(70);
    });

    test('devrait retourner un panier anti-crise par territoire (974 - La Réunion)', () => {
      const basket = service.getAntiCrisisBasket('974', priceObservationsMultiTerritories);

      // ✅ Résultat attendu: 1 produit (riz)
      expect(basket).toHaveLength(1);
      expect(basket[0].productId).toBe('p_rice_1kg');
      expect(basket[0].productName).toBe('Riz long grain 1kg');
      expect(basket[0].storeId).toBe('lp_974');
      expect(basket[0].storeName).toBe('Leader Price');
      expect(basket[0].avgPrice).toBeCloseTo(1.33, 2);
      expect(basket[0].cheapestRate).toBeGreaterThanOrEqual(70);
    });

    test('ne devrait jamais comparer les prix entre territoires', () => {
      // Récupérer les paniers de deux territoires différents
      const guadeloupe = service.getAntiCrisisBasket('971', priceObservationsMultiTerritories);
      const guyane = service.getAntiCrisisBasket('973', priceObservationsMultiTerritories);

      // Les prix doivent être différents (reflet des écarts logistiques réels)
      expect(guadeloupe[0].avgPrice).not.toBe(guyane[0].avgPrice);
      
      // Guadeloupe doit être moins cher que Guyane (réalité logistique DOM)
      expect(guadeloupe[0].avgPrice).toBeLessThan(guyane[0].avgPrice);
    });

    test('devrait respecter les écarts logistiques réels DOM', () => {
      const territories = ['971', '972', '973', '974'];
      const baskets = territories.map(t => 
        service.getAntiCrisisBasket(t, priceObservationsMultiTerritories)
      );

      // Tous les territoires doivent avoir le riz dans leur panier
      baskets.forEach(basket => {
        expect(basket).toHaveLength(1);
        expect(basket[0].productId).toBe('p_rice_1kg');
      });

      // Guyane (973) doit être le plus cher (écart logistique réel)
      const guyaneBasket = baskets[2]; // index 2 = 973
      const otherPrices = baskets.filter((_, i) => i !== 2).map(b => b[0].avgPrice);
      
      otherPrices.forEach(price => {
        expect(guyaneBasket[0].avgPrice).toBeGreaterThan(price);
      });
    });

    test('devrait exclure le soda en Guadeloupe (promo ponctuelle)', () => {
      const basket = service.getAntiCrisisBasket('971', priceObservationsMultiTerritories);
      
      // Le soda ne doit pas être dans le panier
      const sodaProduct = basket.find(p => p.productId === 'p_soda_15l');
      expect(sodaProduct).toBeUndefined();
    });

    test('devrait exclure l\'huile en Martinique (prix instable)', () => {
      const basket = service.getAntiCrisisBasket('972', priceObservationsMultiTerritories);
      
      // L'huile ne doit pas être dans le panier
      const oilProduct = basket.find(p => p.productId === 'p_oil_1l');
      expect(oilProduct).toBeUndefined();
    });

    test('devrait analyser chaque territoire indépendamment', () => {
      // Récupérer les paniers de tous les territoires
      const territories = ['971', '972', '973', '974'];
      const baskets = territories.map(t => 
        service.getAntiCrisisBasket(t, priceObservationsMultiTerritories)
      );

      // Chaque territoire doit avoir des enseignes locales différentes
      const stores = baskets.map(b => b[0].storeId);
      const uniqueStores = new Set(stores);
      
      // Au moins 3 enseignes différentes (certaines peuvent être présentes dans plusieurs territoires)
      expect(uniqueStores.size).toBeGreaterThanOrEqual(3);

      // Vérifier que chaque résultat correspond bien au territoire demandé
      expect(baskets[0][0].storeId).toContain('971'); // Guadeloupe
      expect(baskets[1][0].storeId).toContain('972'); // Martinique
      expect(baskets[2][0].storeId).toContain('973'); // Guyane
      expect(baskets[3][0].storeId).toContain('974'); // La Réunion
    });
  });

  describe('Dataset étendu (192 observations sur 12 mois)', () => {
    test('devrait sélectionner uniquement les produits stables (excluant l\'huile)', () => {
      // Test pour chaque territoire
      const territories = ['971', '972', '973', '974'];
      
      for (const territory of territories) {
        const basket = service.getAntiCrisisBasket(territory, priceObservationsLarge);
        
        // Vérifier qu'aucun produit instable n'est inclus
        const oilProduct = basket.find(p => p.productId === 'p_oil_1l');
        expect(oilProduct).toBeUndefined();
        
        // Vérifier que les produits stables sont présents
        expect(basket.length).toBeGreaterThanOrEqual(2); // Au moins riz, pâtes, lait
        expect(basket.every(p => p.productId !== 'p_oil_1l')).toBe(true);
      }
    });

    test('devrait respecter les contraintes anti-crise sur 12 mois de données', () => {
      const basket971 = service.getAntiCrisisBasket('971', priceObservationsLarge);
      
      // Tous les produits doivent avoir au moins 5 observations (12 mois > 5)
      basket971.forEach(product => {
        expect(product.observations).toBeGreaterThanOrEqual(5);
        expect(product.cheapestRate).toBeGreaterThanOrEqual(70);
        expect(product.avgDeltaVsSecond).toBeGreaterThan(0);
      });
    });

    test('ne devrait jamais comparer les prix inter-territoires', () => {
      const baskets = ['971', '972', '973', '974'].map(t => 
        service.getAntiCrisisBasket(t, priceObservationsLarge)
      );

      // Chaque territoire doit avoir son propre panier
      baskets.forEach(basket => {
        expect(basket.length).toBeGreaterThan(0);
      });

      // Les prix doivent refléter les écarts logistiques
      // Guyane (973) doit être le plus cher pour un même produit
      const riceProducts = baskets.map((b, idx) => ({
        territory: ['971', '972', '973', '974'][idx],
        rice: b.find(p => p.productId === 'p_rice_1kg'),
      })).filter(x => x.rice !== undefined);

      // Vérifier que Guyane est effectivement plus cher
      const guyaneRice = riceProducts.find(x => x.territory === '973')?.rice;
      const guadeloupeRice = riceProducts.find(x => x.territory === '971')?.rice;
      
      if (guyaneRice && guadeloupeRice) {
        expect(guyaneRice.avgPrice).toBeGreaterThan(guadeloupeRice.avgPrice);
      }
    });

    test('devrait performer correctement avec un dataset volumineux', () => {
      const start = performance.now();
      
      // Exécuter pour tous les territoires
      const results = ['971', '972', '973', '974'].map(t => 
        service.getAntiCrisisBasket(t, priceObservationsLarge)
      );
      
      const duration = performance.now() - start;
      
      // L'exécution doit être rapide (< 100ms pour 192 observations)
      expect(duration).toBeLessThan(100);
      
      // Tous les résultats doivent être cohérents
      results.forEach(basket => {
        expect(basket.length).toBeGreaterThan(0);
        expect(basket.every(p => p.observations >= 5)).toBe(true);
      });
    });

    test('devrait analyser la stabilité sur une longue période (12 mois)', () => {
      const basket = service.getAntiCrisisBasket('971', priceObservationsLarge);
      
      // Avec 12 mois de données, les critères de stabilité doivent être très stricts
      basket.forEach(product => {
        // Tous les produits dans le panier doivent être vraiment stables
        // (pas l'huile qui varie de 2.15 à 2.90)
        expect(product.productId).not.toBe('p_oil_1l');
        
        // Les observations doivent être régulières (12 mois)
        expect(product.observations).toBe(12);
      });
    });

    test('devrait identifier correctement les enseignes les moins chères par territoire', () => {
      const territories = ['971', '972', '973', '974'];

      territories.forEach(code => {
        const basket = service.getAntiCrisisBasket(code, priceObservationsLarge);
        
        // Vérifier que les produits sélectionnés proviennent de l'enseigne locale
        basket.forEach(product => {
          expect(product.storeId).toContain(code);
        });
      });
    });
  });
});

// TEMP DEBUG
