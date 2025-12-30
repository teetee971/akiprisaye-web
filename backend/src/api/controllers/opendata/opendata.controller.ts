/**
 * OpenData Controller - Gestionnaire des endpoints Open Data publics
 * 
 * Conforme à:
 * - Licence Ouverte / Open Licence v2.0
 * - Open Data France
 * - RGPD (pas de données personnelles)
 * 
 * Tous les endpoints sont publics (pas d'authentification requise)
 */

import { Request, Response } from 'express';
import { OpenDataService } from '../../services/opendata/OpenDataService';
import { Territory } from '@prisma/client';

/**
 * Métadonnées obligatoires pour chaque réponse Open Data
 */
function addMetadata(data: any) {
  return {
    metadata: {
      source: 'A KI PRI SA YÉ - Observatoire des prix',
      licence: 'Licence Ouverte / Open Licence v2.0',
      licence_url: 'https://www.etalab.gouv.fr/wp-content/uploads/2017/04/ETALAB-Licence-Ouverte-v2.0.pdf',
      updated_at: new Date().toISOString(),
      version: 'v1',
      contact: 'opendata@akiprisaye.fr',
      documentation: '/api/opendata/v1/metadata',
    },
    data,
  };
}

export class OpenDataController {
  /**
   * GET /api/opendata/v1/metadata
   * Métadonnées de l'API Open Data
   */
  static async getMetadata(req: Request, res: Response) {
    try {
      const metadata = {
        api_name: 'A KI PRI SA YÉ - API Open Data',
        version: 'v1',
        description:
          'API publique de données de prix agrégées pour les territoires français (DOM, COM, France hexagonale)',
        licence: 'Licence Ouverte / Open Licence v2.0',
        licence_url:
          'https://www.etalab.gouv.fr/wp-content/uploads/2017/04/ETALAB-Licence-Ouverte-v2.0.pdf',
        terms_of_use: {
          attribution: 'Obligatoire - Mentionner "A KI PRI SA YÉ" comme source',
          commercial_use: 'Autorisé',
          modification: 'Autorisée',
          redistribution: 'Autorisée',
        },
        rate_limit: {
          general: '1000 requêtes par heure',
          heavy_endpoints: '100 requêtes par heure (historique, etc.)',
        },
        endpoints: [
          'GET /api/opendata/v1/territories',
          'GET /api/opendata/v1/products',
          'GET /api/opendata/v1/prices',
          'GET /api/opendata/v1/indicators',
          'GET /api/opendata/v1/history',
          'GET /api/opendata/v1/metadata',
        ],
        data_protection: {
          gdpr_compliant: true,
          anonymized: true,
          aggregated: true,
          no_personal_data: true,
        },
        update_frequency: 'Quotidienne (mise à jour automatique)',
        coverage: {
          territories: ['DOM', 'COM', 'FRANCE_HEXAGONALE'],
          products: 'Variable selon les enseignes participantes',
          historical_depth: '12 mois minimum',
        },
        contact: {
          email: 'opendata@akiprisaye.fr',
          issues: 'https://github.com/teetee971/akiprisaye-web/issues',
        },
      };

      res.json(addMetadata(metadata));
    } catch (error) {
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Impossible de récupérer les métadonnées',
      });
    }
  }

  /**
   * GET /api/opendata/v1/territories
   * Liste des territoires disponibles
   */
  static async getTerritories(req: Request, res: Response) {
    try {
      const territories = await OpenDataService.getTerritories();
      res.json(addMetadata({ territories, count: territories.length }));
    } catch (error) {
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Impossible de récupérer les territoires',
      });
    }
  }

  /**
   * GET /api/opendata/v1/products
   * Liste des produits agrégés
   * Query params: territory, category, limit, offset
   */
  static async getProducts(req: Request, res: Response) {
    try {
      const { territory, category, limit, offset } = req.query;

      const filters: any = {};

      if (territory && Object.values(Territory).includes(territory as Territory)) {
        filters.territory = territory as Territory;
      }

      if (category) {
        filters.category = category as string;
      }

      if (limit) {
        filters.limit = Math.min(parseInt(limit as string, 10), 100);
      }

      if (offset) {
        filters.offset = parseInt(offset as string, 10);
      }

      const result = await OpenDataService.getProducts(filters);

      res.json(
        addMetadata({
          products: result.products,
          pagination: {
            total: result.total,
            limit: filters.limit || 100,
            offset: filters.offset || 0,
          },
        }),
      );
    } catch (error) {
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Impossible de récupérer les produits',
      });
    }
  }

  /**
   * GET /api/opendata/v1/prices
   * Prix agrégés (pas de données magasin individuelles)
   * Query params: territory, category, startDate, endDate, limit, offset
   */
  static async getPrices(req: Request, res: Response) {
    try {
      const { territory, category, startDate, endDate, limit, offset } = req.query;

      const filters: any = {};

      if (territory && Object.values(Territory).includes(territory as Territory)) {
        filters.territory = territory as Territory;
      }

      if (category) {
        filters.category = category as string;
      }

      if (startDate) {
        filters.startDate = new Date(startDate as string);
      }

      if (endDate) {
        filters.endDate = new Date(endDate as string);
      }

      if (limit) {
        filters.limit = Math.min(parseInt(limit as string, 10), 100);
      }

      if (offset) {
        filters.offset = parseInt(offset as string, 10);
      }

      const result = await OpenDataService.getAggregatedPrices(filters);

      res.json(
        addMetadata({
          prices: result.prices,
          pagination: {
            total: result.total,
            limit: filters.limit || 100,
            offset: filters.offset || 0,
          },
          disclaimer:
            'Prix agrégés et anonymisés. Pas de données individuelles par magasin.',
        }),
      );
    } catch (error) {
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Impossible de récupérer les prix',
      });
    }
  }

  /**
   * GET /api/opendata/v1/indicators
   * Indicateurs publics (inflation, dispersion, etc.)
   * Query params: territory, period
   */
  static async getIndicators(req: Request, res: Response) {
    try {
      const { territory, period } = req.query;

      const filters: any = {};

      if (territory && Object.values(Territory).includes(territory as Territory)) {
        filters.territory = territory as Territory;
      }

      if (period && ['month', 'quarter', 'year'].includes(period as string)) {
        filters.period = period as 'month' | 'quarter' | 'year';
      }

      const indicators = await OpenDataService.getIndicators(filters);

      res.json(
        addMetadata({
          indicators,
          count: indicators.length,
          disclaimer:
            'Indicateurs estimés à titre informatif uniquement. Ne constituent pas un conseil financier.',
        }),
      );
    } catch (error) {
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Impossible de récupérer les indicateurs',
      });
    }
  }

  /**
   * GET /api/opendata/v1/history
   * Historique des prix (séries temporelles agrégées)
   * Query params: productName, category, territory, startDate, endDate, limit
   */
  static async getHistory(req: Request, res: Response) {
    try {
      const { productName, category, territory, startDate, endDate, limit } =
        req.query;

      const filters: any = {};

      if (productName) {
        filters.productName = productName as string;
      }

      if (category) {
        filters.category = category as string;
      }

      if (territory && Object.values(Territory).includes(territory as Territory)) {
        filters.territory = territory as Territory;
      }

      if (startDate) {
        filters.startDate = new Date(startDate as string);
      }

      if (endDate) {
        filters.endDate = new Date(endDate as string);
      }

      if (limit) {
        filters.limit = Math.min(parseInt(limit as string, 10), 50);
      }

      const history = await OpenDataService.getHistory(filters);

      res.json(
        addMetadata({
          history,
          count: history.length,
          aggregation: 'weekly',
          disclaimer:
            'Données agrégées par semaine. Pas de données horaires ou quotidiennes individuelles.',
        }),
      );
    } catch (error) {
      res.status(500).json({
        error: 'Erreur serveur',
        message: "Impossible de récupérer l'historique",
      });
    }
  }
}
