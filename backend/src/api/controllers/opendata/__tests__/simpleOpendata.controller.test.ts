/**
 * Tests unitaires pour SimpleOpenDataController
 * PR E - Export Open-Data Officiel
 */

import { Request, Response } from 'express';
import { SimpleOpenDataController } from '../simpleOpendata.controller';
import { Territory } from '@prisma/client';

// Mock les services
jest.mock('../../../services/opendata/OpenDataService');
jest.mock('../../../services/opendata/AnomalyDetectionService');

import { OpenDataService } from '../../../services/opendata/OpenDataService';
import { AnomalyDetectionService } from '../../../services/opendata/AnomalyDetectionService';

describe('SimpleOpenDataController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });

    mockRequest = {
      query: {},
    };

    mockResponse = {
      json: jsonMock,
      status: statusMock,
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getPrices', () => {
    it('devrait retourner les prix au format simplifié', async () => {
      const mockPrices = {
        prices: [
          {
            productName: 'Lait demi-écrémé 1L',
            category: 'Produits laitiers',
            territory: Territory.DOM,
            averagePrice: 1.38,
            minPrice: 1.2,
            maxPrice: 1.5,
            sampleSize: 10,
            lastUpdated: new Date('2026-01-01'),
          },
        ],
        total: 1,
      };

      (OpenDataService.getAggregatedPrices as jest.Mock).mockResolvedValue(
        mockPrices,
      );

      await SimpleOpenDataController.getPrices(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(jsonMock).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            productLabel: 'Lait demi-écrémé 1L',
            territory: Territory.DOM,
            price: 1.38,
            unit: '€',
            source: 'open-data',
          }),
        ]),
        count: 1,
      });
    });

    it('devrait filtrer par territoire', async () => {
      mockRequest.query = { territory: 'DOM' };

      const mockPrices = {
        prices: [],
        total: 0,
      };

      (OpenDataService.getAggregatedPrices as jest.Mock).mockResolvedValue(
        mockPrices,
      );

      await SimpleOpenDataController.getPrices(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(OpenDataService.getAggregatedPrices).toHaveBeenCalledWith({
        territory: Territory.DOM,
      });
    });

    it('devrait filtrer par productId', async () => {
      mockRequest.query = { productId: 'prod-123' };

      const mockPrices = {
        prices: [
          {
            productName: 'Riz blanc 1kg',
            category: 'Épicerie',
            territory: Territory.COM,
            averagePrice: 2.5,
            minPrice: 2.2,
            maxPrice: 2.8,
            sampleSize: 5,
            lastUpdated: new Date('2026-01-05'),
          },
        ],
        total: 1,
      };

      (OpenDataService.getAggregatedPrices as jest.Mock).mockResolvedValue(
        mockPrices,
      );

      await SimpleOpenDataController.getPrices(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(OpenDataService.getAggregatedPrices).toHaveBeenCalledWith({
        productId: 'prod-123',
      });
    });

    it('ne devrait retourner que les produits correspondant au productId', async () => {
      mockRequest.query = { productId: 'riz-1kg' };

      const mockPrices = {
        prices: [
          {
            productName: 'Riz blanc 1kg',
            category: 'Épicerie',
            territory: Territory.COM,
            averagePrice: 2.5,
            minPrice: 2.2,
            maxPrice: 2.8,
            sampleSize: 5,
            lastUpdated: new Date('2026-01-05'),
          },
        ],
        total: 1,
      };

      (OpenDataService.getAggregatedPrices as jest.Mock).mockResolvedValue(
        mockPrices,
      );

      await SimpleOpenDataController.getPrices(
        mockRequest as Request,
        mockResponse as Response,
      );

      const response = jsonMock.mock.calls[0][0];
      expect(response.count).toBe(1);
      expect(response.data[0].productLabel).toBe('Riz blanc 1kg');
    });

    it('devrait inclure les champs obligatoires sans données sensibles', async () => {
      const mockPrices = {
        prices: [
          {
            productName: 'Riz blanc 1kg',
            category: 'Épicerie',
            territory: Territory.COM,
            averagePrice: 2.5,
            minPrice: 2.2,
            maxPrice: 2.8,
            sampleSize: 5,
            lastUpdated: new Date('2026-01-05'),
          },
        ],
        total: 1,
      };

      (OpenDataService.getAggregatedPrices as jest.Mock).mockResolvedValue(
        mockPrices,
      );

      await SimpleOpenDataController.getPrices(
        mockRequest as Request,
        mockResponse as Response,
      );

      const response = jsonMock.mock.calls[0][0];
      const dataItem = response.data[0];

      // Vérifier présence des champs obligatoires
      expect(dataItem).toHaveProperty('productId');
      expect(dataItem).toHaveProperty('productLabel');
      expect(dataItem).toHaveProperty('territory');
      expect(dataItem).toHaveProperty('price');
      expect(dataItem).toHaveProperty('unit');
      expect(dataItem).toHaveProperty('observedAt');
      expect(dataItem).toHaveProperty('source');

      // Vérifier absence de champs sensibles
      expect(dataItem).not.toHaveProperty('userId');
      expect(dataItem).not.toHaveProperty('ip');
      expect(dataItem).not.toHaveProperty('storeId');
      expect(dataItem).not.toHaveProperty('minPrice');
      expect(dataItem).not.toHaveProperty('maxPrice');
    });

    it('devrait gérer les erreurs gracieusement', async () => {
      (OpenDataService.getAggregatedPrices as jest.Mock).mockRejectedValue(
        new Error('Database error'),
      );

      await SimpleOpenDataController.getPrices(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Erreur serveur',
        message: 'Impossible de récupérer les prix',
      });
    });
  });

  describe('getAnomalies', () => {
    it('devrait retourner les anomalies détectées', async () => {
      const mockAnomalies = [
        {
          productId: 'riz-1kg',
          productLabel: 'Riz blanc 1kg',
          territory: Territory.DOM,
          type: 'TEMPORAL' as const,
          severity: 'HIGH' as const,
          description: 'Variation +18 % en 7 jours',
          detectedAt: '2026-01-05',
        },
      ];

      (AnomalyDetectionService.getAllAnomalies as jest.Mock).mockResolvedValue(
        mockAnomalies,
      );

      await SimpleOpenDataController.getAnomalies(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(jsonMock).toHaveBeenCalledWith({
        data: mockAnomalies,
        count: 1,
      });
    });

    it('devrait filtrer les anomalies par territoire', async () => {
      mockRequest.query = { territory: 'COM' };

      (AnomalyDetectionService.getAllAnomalies as jest.Mock).mockResolvedValue(
        [],
      );

      await SimpleOpenDataController.getAnomalies(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(AnomalyDetectionService.getAllAnomalies).toHaveBeenCalledWith(
        Territory.COM,
      );
    });

    it('devrait inclure les champs obligatoires des anomalies', async () => {
      const mockAnomalies = [
        {
          productId: 'lait-1l',
          productLabel: 'Lait demi-écrémé 1L',
          territory: Territory.FRANCE_HEXAGONALE,
          type: 'SPATIAL' as const,
          severity: 'MEDIUM' as const,
          description: 'Écart de 35 % entre territoires',
          detectedAt: '2026-01-06',
        },
      ];

      (AnomalyDetectionService.getAllAnomalies as jest.Mock).mockResolvedValue(
        mockAnomalies,
      );

      await SimpleOpenDataController.getAnomalies(
        mockRequest as Request,
        mockResponse as Response,
      );

      const response = jsonMock.mock.calls[0][0];
      const anomaly = response.data[0];

      // Vérifier structure de l'anomalie
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
    });

    it('devrait gérer les erreurs gracieusement', async () => {
      (AnomalyDetectionService.getAllAnomalies as jest.Mock).mockRejectedValue(
        new Error('Detection error'),
      );

      await SimpleOpenDataController.getAnomalies(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Erreur serveur',
        message: 'Impossible de récupérer les anomalies',
      });
    });
  });
});
