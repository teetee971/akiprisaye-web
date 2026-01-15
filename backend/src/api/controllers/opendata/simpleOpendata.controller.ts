/**
 * Simple OpenData Controller - Endpoints simplifiés (non-versionnés)
 * 
 * Conforme à:
 * - Licence Etalab 2.0
 * - RGPD (pas de données personnelles)
 * - Open Data France
 * 
 * Endpoints publics (pas d'authentification)
 */

import { Request, Response } from 'express';
import { Territory } from '@prisma/client';
import { OpenDataService } from '../../services/opendata/OpenDataService.js';
import { AnomalyDetectionService } from '../../services/opendata/AnomalyDetectionService.js';

export class SimpleOpenDataController {
  /**
   * GET /api/opendata/prices
   * Prix agrégés au format simplifié
   */
  static async getPrices(req: Request, res: Response) {
    try {
      const { territory, productId } = req.query;

      const filters: {
        territory?: Territory;
        productId?: string;
      } = {};

      if (territory && Object.values(Territory).includes(territory as Territory)) {
        filters.territory = territory as Territory;
      }

      // Filtrage effectif par productId
      if (productId) {
        filters.productId = productId as string;
      }

      // Récupérer les prix agrégés
      const result = await OpenDataService.getAggregatedPrices(filters);

      // Formater au format simplifié demandé
      const simplifiedPrices = result.prices.map((price: any) => ({
        productId: productId || price.productName.toLowerCase().replace(/\s+/g, '-'),
        productLabel: price.productName,
        territory: price.territory,
        price: price.averagePrice,
        unit: '€',
        observedAt: price.lastUpdated.toISOString().split('T')[0],
        source: 'open-data',
      }));

      res.json({
        data: simplifiedPrices,
        count: simplifiedPrices.length,
      });
    } catch (error) {
      console.error('Error in getPrices:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Impossible de récupérer les prix',
      });
    }
  }

  /**
   * GET /api/opendata/anomalies
   * Anomalies détectées (temporelles et spatiales)
   */
  static async getAnomalies(req: Request, res: Response) {
    try {
      const { territory } = req.query;

      let territoryFilter: Territory | undefined;
      if (territory && Object.values(Territory).includes(territory as Territory)) {
        territoryFilter = territory as Territory;
      }

      // Détecter les anomalies
      const anomalies = await AnomalyDetectionService.getAllAnomalies(territoryFilter);

      res.json({
        data: anomalies,
        count: anomalies.length,
      });
    } catch (error) {
      console.error('Error in getAnomalies:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Impossible de récupérer les anomalies',
      });
    }
  }
}
