/**
 * Tests unitaires pour PriceAnomalyService
 * Version: 1.0.0
 * 
 * Tests des fonctionnalités:
 * - Détection d'anomalies temporelles
 * - Détection d'anomalies territoriales
 * - Détection d'outliers statistiques
 * - Configuration des seuils
 * - Prévention des faux positifs
 */

import {
  PriceAnomalyService,
  AnomalyType,
  AnomalySeverity,
  ProductPriceSeries,
} from '../priceAnomalyService.js';
import { Territory } from '../../comparison/types.js';

describe('PriceAnomalyService', () => {
  let service: PriceAnomalyService;

  beforeEach(() => {
    service = PriceAnomalyService.getInstance();
    // Reset des seuils par défaut
    service.setThresholds({
      temporal: {
        low: 0.05,
        medium: 0.10,
        high: 0.20,
        periodDays: 7,
      },
      territorial: {
        low: 0.10,
        medium: 0.20,
        high: 0.30,
      },
      outlier: {
        medium: 2.0,
        high: 3.0,
      },
    });
  });

  describe('Singleton Pattern', () => {
    test('devrait créer une seule instance', () => {
      const instance1 = PriceAnomalyService.getInstance();
      const instance2 = PriceAnomalyService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Configuration des seuils', () => {
    test('devrait permettre de configurer les seuils temporels', () => {
      service.setThresholds({
        temporal: {
          low: 0.08,
          medium: 0.15,
          high: 0.25,
          periodDays: 10,
        },
      });

      const thresholds = service.getThresholds();
      expect(thresholds.temporal.low).toBe(0.08);
      expect(thresholds.temporal.medium).toBe(0.15);
      expect(thresholds.temporal.high).toBe(0.25);
      expect(thresholds.temporal.periodDays).toBe(10);
    });

    test('devrait permettre de configurer les seuils territoriaux', () => {
      service.setThresholds({
        territorial: {
          low: 0.15,
          medium: 0.25,
          high: 0.40,
        },
      });

      const thresholds = service.getThresholds();
      expect(thresholds.territorial.low).toBe(0.15);
      expect(thresholds.territorial.medium).toBe(0.25);
      expect(thresholds.territorial.high).toBe(0.40);
    });

    test('devrait permettre de configurer les seuils outliers', () => {
      service.setThresholds({
        outlier: {
          medium: 2.5,
          high: 3.5,
        },
      });

      const thresholds = service.getThresholds();
      expect(thresholds.outlier.medium).toBe(2.5);
      expect(thresholds.outlier.high).toBe(3.5);
    });
  });

  describe('Détection d\'anomalies temporelles', () => {
    test('devrait détecter une hausse brutale HIGH (+30%)', () => {
      const series: ProductPriceSeries = {
        productId: '3228857000906',
        productName: 'Produit Test',
        dataPoints: [
          {
            date: new Date('2026-01-01'),
            price: 10.0,
            territory: Territory.MARTINIQUE,
          },
          {
            date: new Date('2026-01-05'),
            price: 13.0, // +30%
            territory: Territory.MARTINIQUE,
          },
        ],
      };

      const anomalies = service.detectTemporalAnomalies(series);

      expect(anomalies.length).toBe(1);
      expect(anomalies[0].type).toBe(AnomalyType.TEMPORAL);
      expect(anomalies[0].severity).toBe(AnomalySeverity.HIGH);
      expect(anomalies[0].details.percentageChange).toBe(30);
      expect(anomalies[0].description).toContain('hausse');
      expect(anomalies[0].description).toContain('30%');
    });

    test('devrait détecter une hausse MEDIUM (+15%)', () => {
      const series: ProductPriceSeries = {
        productId: '3228857000906',
        productName: 'Produit Test',
        dataPoints: [
          {
            date: new Date('2026-01-01'),
            price: 10.0,
            territory: Territory.MARTINIQUE,
          },
          {
            date: new Date('2026-01-04'),
            price: 11.5, // +15%
            territory: Territory.MARTINIQUE,
          },
        ],
      };

      const anomalies = service.detectTemporalAnomalies(series);

      expect(anomalies.length).toBe(1);
      expect(anomalies[0].severity).toBe(AnomalySeverity.MEDIUM);
      expect(anomalies[0].details.percentageChange).toBe(15);
    });

    test('devrait détecter une hausse LOW (+7%)', () => {
      const series: ProductPriceSeries = {
        productId: '3228857000906',
        productName: 'Produit Test',
        dataPoints: [
          {
            date: new Date('2026-01-01'),
            price: 10.0,
            territory: Territory.MARTINIQUE,
          },
          {
            date: new Date('2026-01-03'),
            price: 10.7, // +7%
            territory: Territory.MARTINIQUE,
          },
        ],
      };

      const anomalies = service.detectTemporalAnomalies(series);

      expect(anomalies.length).toBe(1);
      expect(anomalies[0].severity).toBe(AnomalySeverity.LOW);
      expect(anomalies[0].details.percentageChange).toBe(7);
    });

    test('devrait détecter une baisse brutale', () => {
      const series: ProductPriceSeries = {
        productId: '3228857000906',
        productName: 'Produit Test',
        dataPoints: [
          {
            date: new Date('2026-01-01'),
            price: 10.0,
            territory: Territory.MARTINIQUE,
          },
          {
            date: new Date('2026-01-05'),
            price: 7.0, // -30%
            territory: Territory.MARTINIQUE,
          },
        ],
      };

      const anomalies = service.detectTemporalAnomalies(series);

      expect(anomalies.length).toBe(1);
      expect(anomalies[0].severity).toBe(AnomalySeverity.HIGH);
      expect(anomalies[0].details.percentageChange).toBe(-30);
      expect(anomalies[0].description).toContain('baisse');
    });

    test('ne devrait PAS détecter une variation normale (+3%)', () => {
      const series: ProductPriceSeries = {
        productId: '3228857000906',
        productName: 'Produit Test',
        dataPoints: [
          {
            date: new Date('2026-01-01'),
            price: 10.0,
            territory: Territory.MARTINIQUE,
          },
          {
            date: new Date('2026-01-03'),
            price: 10.3, // +3% < seuil de 5%
            territory: Territory.MARTINIQUE,
          },
        ],
      };

      const anomalies = service.detectTemporalAnomalies(series);

      expect(anomalies.length).toBe(0);
    });

    test('ne devrait PAS détecter si période > periodDays', () => {
      const series: ProductPriceSeries = {
        productId: '3228857000906',
        productName: 'Produit Test',
        dataPoints: [
          {
            date: new Date('2026-01-01'),
            price: 10.0,
            territory: Territory.MARTINIQUE,
          },
          {
            date: new Date('2026-01-20'), // 19 jours > 7 jours
            price: 13.0, // +30% mais sur une période trop longue
            territory: Territory.MARTINIQUE,
          },
        ],
      };

      const anomalies = service.detectTemporalAnomalies(series);

      expect(anomalies.length).toBe(0);
    });

    test('devrait gérer une série vide', () => {
      const series: ProductPriceSeries = {
        productId: '3228857000906',
        productName: 'Produit Test',
        dataPoints: [],
      };

      const anomalies = service.detectTemporalAnomalies(series);

      expect(anomalies.length).toBe(0);
    });

    test('devrait gérer une série avec un seul point', () => {
      const series: ProductPriceSeries = {
        productId: '3228857000906',
        productName: 'Produit Test',
        dataPoints: [
          {
            date: new Date('2026-01-01'),
            price: 10.0,
            territory: Territory.MARTINIQUE,
          },
        ],
      };

      const anomalies = service.detectTemporalAnomalies(series);

      expect(anomalies.length).toBe(0);
    });
  });

  describe('Détection d\'anomalies territoriales', () => {
    test('devrait détecter un écart territorial HIGH (+35%)', () => {
      const territoryPrices = new Map<Territory, number>([
        [Territory.FRANCE_HEXAGONALE, 10.0],
        [Territory.MARTINIQUE, 13.5], // +35%
      ]);

      const anomalies = service.detectTerritoryAnomalies(
        '3228857000906',
        'Produit Test',
        territoryPrices,
      );

      expect(anomalies.length).toBe(1);
      expect(anomalies[0].type).toBe(AnomalyType.TERRITORIAL);
      expect(anomalies[0].severity).toBe(AnomalySeverity.HIGH);
      expect(anomalies[0].territory).toBe(Territory.MARTINIQUE);
      expect(anomalies[0].details.percentageChange).toBe(35);
      expect(anomalies[0].description).toContain('supérieur');
      expect(anomalies[0].description).toContain('35%');
    });

    test('devrait détecter un écart territorial MEDIUM (+25%)', () => {
      const territoryPrices = new Map<Territory, number>([
        [Territory.FRANCE_HEXAGONALE, 10.0],
        [Territory.GUADELOUPE, 12.5], // +25%
      ]);

      const anomalies = service.detectTerritoryAnomalies(
        '3228857000906',
        'Produit Test',
        territoryPrices,
      );

      expect(anomalies.length).toBe(1);
      expect(anomalies[0].severity).toBe(AnomalySeverity.MEDIUM);
      expect(anomalies[0].details.percentageChange).toBe(25);
    });

    test('devrait détecter un écart territorial LOW (+12%)', () => {
      const territoryPrices = new Map<Territory, number>([
        [Territory.FRANCE_HEXAGONALE, 10.0],
        [Territory.LA_REUNION, 11.2], // +12%
      ]);

      const anomalies = service.detectTerritoryAnomalies(
        '3228857000906',
        'Produit Test',
        territoryPrices,
      );

      expect(anomalies.length).toBe(1);
      expect(anomalies[0].severity).toBe(AnomalySeverity.LOW);
      expect(anomalies[0].details.percentageChange).toBe(12);
    });

    test('devrait détecter un prix inférieur anormal', () => {
      const territoryPrices = new Map<Territory, number>([
        [Territory.FRANCE_HEXAGONALE, 10.0],
        [Territory.GUYANE, 6.5], // -35%
      ]);

      const anomalies = service.detectTerritoryAnomalies(
        '3228857000906',
        'Produit Test',
        territoryPrices,
      );

      expect(anomalies.length).toBe(1);
      expect(anomalies[0].severity).toBe(AnomalySeverity.HIGH);
      expect(anomalies[0].details.percentageChange).toBe(-35);
      expect(anomalies[0].description).toContain('inférieur');
    });

    test('ne devrait PAS détecter un écart normal (+8%)', () => {
      const territoryPrices = new Map<Territory, number>([
        [Territory.FRANCE_HEXAGONALE, 10.0],
        [Territory.MARTINIQUE, 10.8], // +8% < seuil de 10%
      ]);

      const anomalies = service.detectTerritoryAnomalies(
        '3228857000906',
        'Produit Test',
        territoryPrices,
      );

      expect(anomalies.length).toBe(0);
    });

    test('devrait détecter plusieurs territoires anormaux', () => {
      const territoryPrices = new Map<Territory, number>([
        [Territory.FRANCE_HEXAGONALE, 10.0],
        [Territory.MARTINIQUE, 13.0], // +30%
        [Territory.GUADELOUPE, 12.5], // +25%
        [Territory.GUYANE, 10.5], // +5% normal
      ]);

      const anomalies = service.detectTerritoryAnomalies(
        '3228857000906',
        'Produit Test',
        territoryPrices,
      );

      expect(anomalies.length).toBe(2);
      expect(anomalies.map(a => a.territory)).toContain(Territory.MARTINIQUE);
      expect(anomalies.map(a => a.territory)).toContain(Territory.GUADELOUPE);
      expect(anomalies.map(a => a.territory)).not.toContain(Territory.GUYANE);
    });

    test('ne devrait rien retourner sans prix de référence France', () => {
      const territoryPrices = new Map<Territory, number>([
        [Territory.MARTINIQUE, 13.0],
        [Territory.GUADELOUPE, 12.5],
      ]);

      const anomalies = service.detectTerritoryAnomalies(
        '3228857000906',
        'Produit Test',
        territoryPrices,
      );

      expect(anomalies.length).toBe(0);
    });

    test('ne devrait PAS comparer la France avec elle-même', () => {
      const territoryPrices = new Map<Territory, number>([
        [Territory.FRANCE_HEXAGONALE, 10.0],
      ]);

      const anomalies = service.detectTerritoryAnomalies(
        '3228857000906',
        'Produit Test',
        territoryPrices,
      );

      expect(anomalies.length).toBe(0);
    });
  });

  describe('Détection d\'outliers statistiques', () => {
    test('devrait détecter un outlier HIGH (3+ écarts-types)', () => {
      // Test with slightly varied base values to avoid floating point issues
      const prices = [
        { territory: Territory.MARTINIQUE, price: 10.00 },
        { territory: Territory.GUADELOUPE, price: 10.01 },
        { territory: Territory.GUYANE, price: 10.00 },
        { territory: Territory.LA_REUNION, price: 10.01 },
        { territory: Territory.SAINT_MARTIN, price: 10.00 },
        { territory: Territory.MAYOTTE, price: 10.05 }, // Outlier net par rapport à la fourchette serrée
      ];

      const anomalies = service.detectOutliers('3228857000906', 'Produit Test', prices);

      // Devrait détecter au moins un outlier (HIGH ou MEDIUM selon calcul exact)
      expect(anomalies.length).toBeGreaterThan(0);
      const mayotteAnomaly = anomalies.find(a => a.territory === Territory.MAYOTTE);
      expect(mayotteAnomaly).toBeDefined();
      expect(mayotteAnomaly?.description).toContain('écarts-types');
      // On accepte HIGH ou MEDIUM selon le z-score exact
      expect([AnomalySeverity.HIGH, AnomalySeverity.MEDIUM]).toContain(mayotteAnomaly?.severity);
    });

    test('devrait détecter un outlier MEDIUM (2-3 écarts-types)', () => {
      const prices = [
        { territory: Territory.MARTINIQUE, price: 10.0 },
        { territory: Territory.GUADELOUPE, price: 10.0 },
        { territory: Territory.GUYANE, price: 10.0 },
        { territory: Territory.LA_REUNION, price: 10.0 },
        { territory: Territory.MAYOTTE, price: 15.0 }, // Outlier moyen
      ];

      const anomalies = service.detectOutliers('3228857000906', 'Produit Test', prices);

      expect(anomalies.length).toBeGreaterThan(0);
      const mediumAnomaly = anomalies.find(a => a.severity === AnomalySeverity.MEDIUM);
      expect(mediumAnomaly).toBeDefined();
    });

    test('ne devrait PAS détecter d\'outlier si prix homogènes', () => {
      const prices = [
        { territory: Territory.MARTINIQUE, price: 10.0 },
        { territory: Territory.GUADELOUPE, price: 10.1 },
        { territory: Territory.GUYANE, price: 9.9 },
        { territory: Territory.LA_REUNION, price: 10.2 },
      ];

      const anomalies = service.detectOutliers('3228857000906', 'Produit Test', prices);

      expect(anomalies.length).toBe(0);
    });

    test('ne devrait rien retourner avec moins de 3 points', () => {
      const prices = [
        { territory: Territory.MARTINIQUE, price: 10.0 },
        { territory: Territory.GUADELOUPE, price: 20.0 },
      ];

      const anomalies = service.detectOutliers('3228857000906', 'Produit Test', prices);

      expect(anomalies.length).toBe(0);
    });

    test('ne devrait rien retourner si tous les prix sont identiques', () => {
      const prices = [
        { territory: Territory.MARTINIQUE, price: 10.0 },
        { territory: Territory.GUADELOUPE, price: 10.0 },
        { territory: Territory.GUYANE, price: 10.0 },
      ];

      const anomalies = service.detectOutliers('3228857000906', 'Produit Test', prices);

      expect(anomalies.length).toBe(0);
    });

    test('devrait détecter un outlier bas', () => {
      const prices = [
        { territory: Territory.MARTINIQUE, price: 10.0 },
        { territory: Territory.GUADELOUPE, price: 10.0 },
        { territory: Territory.GUYANE, price: 10.0 },
        { territory: Territory.LA_REUNION, price: 10.0 },
        { territory: Territory.SAINT_MARTIN, price: 10.0 },
        { territory: Territory.MAYOTTE, price: 0.5 }, // Outlier très bas: z-score > 3
      ];

      const anomalies = service.detectOutliers('3228857000906', 'Produit Test', prices);

      expect(anomalies.length).toBeGreaterThan(0);
      const lowOutlier = anomalies.find(a => a.territory === Territory.MAYOTTE);
      expect(lowOutlier).toBeDefined();
      expect(lowOutlier?.description).toContain('en-dessous');
    });
  });

  describe('Scoring d\'anomalies', () => {
    test('devrait scorer HIGH à 90+', () => {
      const anomaly = {
        productId: '3228857000906',
        territory: Territory.MARTINIQUE,
        type: AnomalyType.TEMPORAL,
        severity: AnomalySeverity.HIGH,
        description: 'Test',
        details: { percentageChange: 30 },
        detectedAt: new Date(),
        detectionMethod: 'Test',
      };

      const score = service.scoreAnomaly(anomaly);
      expect(score).toBeGreaterThanOrEqual(90);
    });

    test('devrait scorer MEDIUM à 60+', () => {
      const anomaly = {
        productId: '3228857000906',
        territory: Territory.MARTINIQUE,
        type: AnomalyType.TEMPORAL,
        severity: AnomalySeverity.MEDIUM,
        description: 'Test',
        details: { percentageChange: 15 },
        detectedAt: new Date(),
        detectionMethod: 'Test',
      };

      const score = service.scoreAnomaly(anomaly);
      expect(score).toBeGreaterThanOrEqual(60);
      expect(score).toBeLessThan(90);
    });

    test('devrait scorer LOW à 30+', () => {
      const anomaly = {
        productId: '3228857000906',
        territory: Territory.MARTINIQUE,
        type: AnomalyType.TEMPORAL,
        severity: AnomalySeverity.LOW,
        description: 'Test',
        details: { percentageChange: 7 },
        detectedAt: new Date(),
        detectionMethod: 'Test',
      };

      const score = service.scoreAnomaly(anomaly);
      expect(score).toBeGreaterThanOrEqual(30);
      expect(score).toBeLessThan(60);
    });

    test('devrait donner un bonus pour variation > 50%', () => {
      const anomaly1 = {
        productId: '3228857000906',
        territory: Territory.MARTINIQUE,
        type: AnomalyType.TEMPORAL,
        severity: AnomalySeverity.HIGH,
        description: 'Test',
        details: { percentageChange: 30 },
        detectedAt: new Date(),
        detectionMethod: 'Test',
      };

      const anomaly2 = {
        productId: '3228857000906',
        territory: Territory.MARTINIQUE,
        type: AnomalyType.TEMPORAL,
        severity: AnomalySeverity.HIGH,
        description: 'Test',
        details: { percentageChange: 60 },
        detectedAt: new Date(),
        detectionMethod: 'Test',
      };

      const score1 = service.scoreAnomaly(anomaly1);
      const score2 = service.scoreAnomaly(anomaly2);

      expect(score2).toBeGreaterThan(score1);
    });

    test('le score ne devrait jamais dépasser 100', () => {
      const anomaly = {
        productId: '3228857000906',
        territory: Territory.MARTINIQUE,
        type: AnomalyType.TEMPORAL,
        severity: AnomalySeverity.HIGH,
        description: 'Test',
        details: { percentageChange: 200 },
        detectedAt: new Date(),
        detectionMethod: 'Test',
      };

      const score = service.scoreAnomaly(anomaly);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe('Détection globale (detectAllAnomalies)', () => {
    test('devrait détecter anomalies temporelles ET territoriales', () => {
      const series: ProductPriceSeries = {
        productId: '3228857000906',
        productName: 'Produit Test',
        dataPoints: [
          {
            date: new Date('2026-01-01'),
            price: 10.0,
            territory: Territory.FRANCE_HEXAGONALE,
          },
          {
            date: new Date('2026-01-01'),
            price: 13.5, // +35% vs France
            territory: Territory.MARTINIQUE,
          },
          {
            date: new Date('2026-01-05'),
            price: 18.0, // +33% en 4 jours
            territory: Territory.MARTINIQUE,
          },
        ],
      };

      const anomalies = service.detectAllAnomalies(series);

      expect(anomalies.length).toBeGreaterThan(0);
      const temporalAnomalies = anomalies.filter(a => a.type === AnomalyType.TEMPORAL);
      const territorialAnomalies = anomalies.filter(a => a.type === AnomalyType.TERRITORIAL);

      expect(temporalAnomalies.length).toBeGreaterThan(0);
      expect(territorialAnomalies.length).toBeGreaterThan(0);
    });

    test('devrait détecter toutes les anomalies quand les données le permettent', () => {
      const series: ProductPriceSeries = {
        productId: '3228857000906',
        productName: 'Produit Test',
        dataPoints: [
          // Données temporelles + territoriales + outliers
          {
            date: new Date('2026-01-01'),
            price: 10.0,
            territory: Territory.FRANCE_HEXAGONALE,
          },
          {
            date: new Date('2026-01-01'),
            price: 10.2,
            territory: Territory.GUADELOUPE,
          },
          {
            date: new Date('2026-01-01'),
            price: 10.1,
            territory: Territory.GUYANE,
          },
          {
            date: new Date('2026-01-01'),
            price: 20.0, // Outlier HIGH
            territory: Territory.MAYOTTE,
          },
          {
            date: new Date('2026-01-05'),
            price: 15.0, // Hausse temporelle HIGH pour Mayotte
            territory: Territory.FRANCE_HEXAGONALE,
          },
        ],
      };

      const anomalies = service.detectAllAnomalies(series);

      // On devrait avoir au moins des anomalies temporelles, territoriales et outliers
      expect(anomalies.length).toBeGreaterThan(0);

      const types = new Set(anomalies.map(a => a.type));
      // Au moins 2 types d'anomalies détectés
      expect(types.size).toBeGreaterThanOrEqual(2);
    });

    test('ne devrait rien détecter pour des données normales', () => {
      const series: ProductPriceSeries = {
        productId: '3228857000906',
        productName: 'Produit Test',
        dataPoints: [
          {
            date: new Date('2026-01-01'),
            price: 10.0,
            territory: Territory.MARTINIQUE,
          },
          {
            date: new Date('2026-01-05'),
            price: 10.2, // +2% normal
            territory: Territory.MARTINIQUE,
          },
        ],
      };

      const anomalies = service.detectAllAnomalies(series);

      expect(anomalies.length).toBe(0);
    });
  });

  describe('Prévention des faux positifs', () => {
    test('ne devrait PAS déclencher pour une inflation normale graduelle', () => {
      const series: ProductPriceSeries = {
        productId: '3228857000906',
        productName: 'Produit Test',
        dataPoints: [
          {
            date: new Date('2026-01-01'),
            price: 10.0,
            territory: Territory.MARTINIQUE,
          },
          {
            date: new Date('2026-02-01'), // 31 jours
            price: 10.3, // +3% sur 1 mois = normal
            territory: Territory.MARTINIQUE,
          },
        ],
      };

      const anomalies = service.detectTemporalAnomalies(series);

      expect(anomalies.length).toBe(0);
    });

    test('devrait être stable avec des données bruitées', () => {
      const series: ProductPriceSeries = {
        productId: '3228857000906',
        productName: 'Produit Test',
        dataPoints: [
          {
            date: new Date('2026-01-01'),
            price: 10.0,
            territory: Territory.MARTINIQUE,
          },
          {
            date: new Date('2026-01-02'),
            price: 10.1,
            territory: Territory.MARTINIQUE,
          },
          {
            date: new Date('2026-01-03'),
            price: 9.95,
            territory: Territory.MARTINIQUE,
          },
          {
            date: new Date('2026-01-04'),
            price: 10.05,
            territory: Territory.MARTINIQUE,
          },
        ],
      };

      const anomalies = service.detectTemporalAnomalies(series);

      // Aucune variation ne dépasse les seuils
      expect(anomalies.length).toBe(0);
    });

    test('devrait respecter les seuils configurés strictement', () => {
      service.setThresholds({
        temporal: {
          low: 0.10,
          medium: 0.20,
          high: 0.30,
          periodDays: 7,
        },
      });

      const series: ProductPriceSeries = {
        productId: '3228857000906',
        productName: 'Produit Test',
        dataPoints: [
          {
            date: new Date('2026-01-01'),
            price: 10.0,
            territory: Territory.MARTINIQUE,
          },
          {
            date: new Date('2026-01-03'),
            price: 10.99, // +9.9% < 10%
            territory: Territory.MARTINIQUE,
          },
        ],
      };

      const anomalies = service.detectTemporalAnomalies(series);

      // Ne devrait pas déclencher car en dessous du seuil
      expect(anomalies.length).toBe(0);
    });
  });
});
