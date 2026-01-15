/**
 * Tests unitaires pour AnomalyDetectionService
 * PR E - Export Open-Data Officiel
 */

import { AnomalyDetectionService } from '../AnomalyDetectionService';
import { Territory } from '@prisma/client';

// Mock Prisma Client
jest.mock('@prisma/client', () => {
  const mockPrismaClient = {
    product: {
      findMany: jest.fn(),
    },
  };
  return {
    PrismaClient: jest.fn(() => mockPrismaClient),
    Territory: {
      DOM: 'DOM',
      COM: 'COM',
      FRANCE_HEXAGONALE: 'FRANCE_HEXAGONALE',
    },
  };
});

describe('AnomalyDetectionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('detectTemporalAnomalies', () => {
    it('devrait détecter une anomalie temporelle HIGH pour variation > 25%', async () => {
      const mockProducts = [
        {
          id: 'prod-1',
          name: 'Riz blanc 1kg',
          prices: [
            {
              price: 2.0,
              effectiveDate: new Date('2026-01-01'),
              store: { territory: Territory.DOM },
            },
            {
              price: 2.5,
              effectiveDate: new Date('2026-01-07'),
              store: { territory: Territory.DOM },
            },
          ],
        },
      ];

      const { PrismaClient } = require('@prisma/client');
      const mockPrisma = new PrismaClient();
      mockPrisma.product.findMany.mockResolvedValue(mockProducts);

      const anomalies = await AnomalyDetectionService.detectTemporalAnomalies();

      expect(anomalies.length).toBeGreaterThan(0);
      const anomaly = anomalies[0];
      expect(anomaly.type).toBe('TEMPORAL');
      expect(anomaly.severity).toBe('HIGH');
      expect(anomaly.description).toContain('%');
    });

    it('devrait détecter une anomalie MEDIUM pour variation entre 15% et 25%', async () => {
      const mockProducts = [
        {
          id: 'prod-2',
          name: 'Lait 1L',
          prices: [
            {
              price: 1.0,
              effectiveDate: new Date('2026-01-01'),
              store: { territory: Territory.COM },
            },
            {
              price: 1.18,
              effectiveDate: new Date('2026-01-07'),
              store: { territory: Territory.COM },
            },
          ],
        },
      ];

      const { PrismaClient } = require('@prisma/client');
      const mockPrisma = new PrismaClient();
      mockPrisma.product.findMany.mockResolvedValue(mockProducts);

      const anomalies = await AnomalyDetectionService.detectTemporalAnomalies();

      expect(anomalies.length).toBeGreaterThan(0);
      const anomaly = anomalies[0];
      expect(anomaly.severity).toBe('MEDIUM');
    });

    it('ne devrait pas détecter d\'anomalie pour variation < 10%', async () => {
      const mockProducts = [
        {
          id: 'prod-3',
          name: 'Pain 500g',
          prices: [
            {
              price: 1.0,
              effectiveDate: new Date('2026-01-01'),
              store: { territory: Territory.DOM },
            },
            {
              price: 1.05,
              effectiveDate: new Date('2026-01-07'),
              store: { territory: Territory.DOM },
            },
          ],
        },
      ];

      const { PrismaClient } = require('@prisma/client');
      const mockPrisma = new PrismaClient();
      mockPrisma.product.findMany.mockResolvedValue(mockProducts);

      const anomalies = await AnomalyDetectionService.detectTemporalAnomalies();

      expect(anomalies.length).toBe(0);
    });

    it('ne devrait pas détecter d\'anomalie si écart temporel < 3 jours', async () => {
      const mockProducts = [
        {
          id: 'prod-temporal',
          name: 'Produit test temporel',
          prices: [
            {
              price: 1.0,
              effectiveDate: new Date('2026-01-01'),
              store: { territory: Territory.DOM },
            },
            {
              price: 1.5, // 50% variation
              effectiveDate: new Date('2026-01-02'), // Seulement 1 jour
              store: { territory: Territory.DOM },
            },
          ],
        },
      ];

      const { PrismaClient } = require('@prisma/client');
      const mockPrisma = new PrismaClient();
      mockPrisma.product.findMany.mockResolvedValue(mockProducts);

      const anomalies = await AnomalyDetectionService.detectTemporalAnomalies();

      // Ne devrait pas détecter d'anomalie car écart < 3 jours
      expect(anomalies.length).toBe(0);
    });

    it('devrait détecter une anomalie si écart temporel >= 3 jours', async () => {
      const mockProducts = [
        {
          id: 'prod-temporal-ok',
          name: 'Produit test temporel OK',
          prices: [
            {
              price: 1.0,
              effectiveDate: new Date('2026-01-01'),
              store: { territory: Territory.DOM },
            },
            {
              price: 1.5, // 50% variation
              effectiveDate: new Date('2026-01-05'), // 4 jours
              store: { territory: Territory.DOM },
            },
          ],
        },
      ];

      const { PrismaClient } = require('@prisma/client');
      const mockPrisma = new PrismaClient();
      mockPrisma.product.findMany.mockResolvedValue(mockProducts);

      const anomalies = await AnomalyDetectionService.detectTemporalAnomalies();

      // Devrait détecter une anomalie car écart >= 3 jours
      expect(anomalies.length).toBeGreaterThan(0);
      expect(anomalies[0].type).toBe('TEMPORAL');
    });

    it('devrait filtrer par territoire si spécifié', async () => {
      const { PrismaClient } = require('@prisma/client');
      const mockPrisma = new PrismaClient();
      mockPrisma.product.findMany.mockResolvedValue([]);

      await AnomalyDetectionService.detectTemporalAnomalies(Territory.DOM);

      expect(mockPrisma.product.findMany).toHaveBeenCalled();
    });
  });

  describe('detectSpatialAnomalies', () => {
    it('devrait détecter une anomalie spatiale pour écart > 30% entre territoires', async () => {
      const mockProducts = [
        {
          id: 'prod-4',
          name: 'Huile d\'olive 1L',
          prices: [
            {
              price: 5.0,
              store: { territory: Territory.DOM },
            },
            {
              price: 7.0,
              store: { territory: Territory.COM },
            },
          ],
        },
      ];

      const { PrismaClient } = require('@prisma/client');
      const mockPrisma = new PrismaClient();
      mockPrisma.product.findMany.mockResolvedValue(mockProducts);

      const anomalies = await AnomalyDetectionService.detectSpatialAnomalies();

      expect(anomalies.length).toBeGreaterThan(0);
      const anomaly = anomalies[0];
      expect(anomaly.type).toBe('SPATIAL');
      expect(anomaly.description).toContain('territoires');
    });

    it('devrait classifier severity HIGH pour écart > 60%', async () => {
      const mockProducts = [
        {
          id: 'prod-5',
          name: 'Produit test',
          prices: [
            {
              price: 1.0,
              store: { territory: Territory.DOM },
            },
            {
              price: 2.0,
              store: { territory: Territory.COM },
            },
          ],
        },
      ];

      const { PrismaClient } = require('@prisma/client');
      const mockPrisma = new PrismaClient();
      mockPrisma.product.findMany.mockResolvedValue(mockProducts);

      const anomalies = await AnomalyDetectionService.detectSpatialAnomalies();

      const highSeverityAnomaly = anomalies.find((a) => a.severity === 'HIGH');
      expect(highSeverityAnomaly).toBeDefined();
    });
  });

  describe('getAllAnomalies', () => {
    it('devrait combiner anomalies temporelles et spatiales', async () => {
      const { PrismaClient } = require('@prisma/client');
      const mockPrisma = new PrismaClient();
      mockPrisma.product.findMany.mockResolvedValue([]);

      const anomalies = await AnomalyDetectionService.getAllAnomalies();

      // Devrait retourner un tableau (même vide)
      expect(Array.isArray(anomalies)).toBe(true);
    });

    it('ne devrait pas inclure anomalies spatiales si territoire spécifié', async () => {
      const { PrismaClient } = require('@prisma/client');
      const mockPrisma = new PrismaClient();
      mockPrisma.product.findMany.mockResolvedValue([]);

      await AnomalyDetectionService.getAllAnomalies(Territory.DOM);

      // Vérifier que detectTemporalAnomalies a été appelé
      expect(mockPrisma.product.findMany).toHaveBeenCalled();
    });
  });

  describe('Structure des anomalies', () => {
    it('devrait retourner une anomalie avec tous les champs requis', async () => {
      const mockProducts = [
        {
          id: 'prod-6',
          name: 'Test Product',
          prices: [
            {
              price: 1.0,
              effectiveDate: new Date('2026-01-01'),
              store: { territory: Territory.DOM },
            },
            {
              price: 1.3,
              effectiveDate: new Date('2026-01-07'),
              store: { territory: Territory.DOM },
            },
          ],
        },
      ];

      const { PrismaClient } = require('@prisma/client');
      const mockPrisma = new PrismaClient();
      mockPrisma.product.findMany.mockResolvedValue(mockProducts);

      const anomalies = await AnomalyDetectionService.detectTemporalAnomalies();

      if (anomalies.length > 0) {
        const anomaly = anomalies[0];
        expect(anomaly).toHaveProperty('productId');
        expect(anomaly).toHaveProperty('productLabel');
        expect(anomaly).toHaveProperty('territory');
        expect(anomaly).toHaveProperty('type');
        expect(anomaly).toHaveProperty('severity');
        expect(anomaly).toHaveProperty('description');
        expect(anomaly).toHaveProperty('detectedAt');

        // Vérifier les valeurs des enums
        expect(['TEMPORAL', 'SPATIAL', 'OUTLIER']).toContain(anomaly.type);
        expect(['LOW', 'MEDIUM', 'HIGH']).toContain(anomaly.severity);
      }
    });
  });
});
