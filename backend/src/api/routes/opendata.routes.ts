/**
 * Routes Open Data API (v1)
 * 
 * API publique (pas d'authentification requise)
 * Licence Ouverte / Open Licence v2.0
 * 
 * Endpoints:
 * - GET /api/opendata/v1/metadata - Métadonnées API
 * - GET /api/opendata/v1/territories - Liste territoires
 * - GET /api/opendata/v1/products - Produits agrégés
 * - GET /api/opendata/v1/prices - Prix agrégés
 * - GET /api/opendata/v1/indicators - Indicateurs publics
 * - GET /api/opendata/v1/history - Historique prix
 * 
 * Endpoints simplifiés (PR E):
 * - GET /api/opendata/prices - Prix format simplifié
 * - GET /api/opendata/anomalies - Anomalies détectées
 */

import { Router } from 'express';
import { OpenDataController } from '../controllers/opendata/opendata.controller';
import { SimpleOpenDataController } from '../controllers/opendata/simpleOpendata.controller';
import {
  opendataRateLimiter,
  opendataHeavyRateLimiter,
} from '../middlewares/opendataRateLimit.middleware';
import { opendataHeaders } from '../middlewares/opendataHeaders.middleware';

const router = Router();

// Appliquer les headers Open Data à toutes les routes
router.use(opendataHeaders);

/**
 * @swagger
 * /api/opendata/v1/metadata:
 *   get:
 *     summary: Métadonnées de l'API Open Data
 *     tags: [Open Data]
 *     responses:
 *       200:
 *         description: Métadonnées complètes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.get('/v1/metadata', opendataRateLimiter, OpenDataController.getMetadata);

/**
 * @swagger
 * /api/opendata/v1/territories:
 *   get:
 *     summary: Liste des territoires disponibles
 *     tags: [Open Data]
 *     responses:
 *       200:
 *         description: Liste territoires (DOM, COM, France hexagonale)
 */
router.get(
  '/v1/territories',
  opendataRateLimiter,
  OpenDataController.getTerritories,
);

/**
 * @swagger
 * /api/opendata/v1/products:
 *   get:
 *     summary: Produits agrégés
 *     tags: [Open Data]
 *     parameters:
 *       - in: query
 *         name: territory
 *         schema:
 *           type: string
 *           enum: [DOM, COM, FRANCE_HEXAGONALE]
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           maximum: 100
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Liste produits agrégés
 */
router.get('/v1/products', opendataRateLimiter, OpenDataController.getProducts);

/**
 * @swagger
 * /api/opendata/v1/prices:
 *   get:
 *     summary: Prix agrégés (anonymisés)
 *     tags: [Open Data]
 *     parameters:
 *       - in: query
 *         name: territory
 *         schema:
 *           type: string
 *           enum: [DOM, COM, FRANCE_HEXAGONALE]
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           maximum: 100
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Prix agrégés (pas de données magasin individuelles)
 */
router.get('/v1/prices', opendataRateLimiter, OpenDataController.getPrices);

/**
 * @swagger
 * /api/opendata/v1/indicators:
 *   get:
 *     summary: Indicateurs publics (inflation, dispersion, etc.)
 *     tags: [Open Data]
 *     parameters:
 *       - in: query
 *         name: territory
 *         schema:
 *           type: string
 *           enum: [DOM, COM, FRANCE_HEXAGONALE]
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [month, quarter, year]
 *     responses:
 *       200:
 *         description: Indicateurs calculés
 */
router.get(
  '/v1/indicators',
  opendataRateLimiter,
  OpenDataController.getIndicators,
);

/**
 * @swagger
 * /api/opendata/v1/history:
 *   get:
 *     summary: Historique des prix (séries temporelles)
 *     tags: [Open Data]
 *     parameters:
 *       - in: query
 *         name: productName
 *         schema:
 *           type: string
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: territory
 *         schema:
 *           type: string
 *           enum: [DOM, COM, FRANCE_HEXAGONALE]
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           maximum: 50
 *     responses:
 *       200:
 *         description: Séries temporelles agrégées (hebdomadaire)
 */
router.get(
  '/v1/history',
  opendataHeavyRateLimiter, // Rate limit plus strict
  OpenDataController.getHistory,
);

// ========================================
// Endpoints simplifiés (PR E - Format institutionnel)
// ========================================

/**
 * @swagger
 * /api/opendata/prices:
 *   get:
 *     summary: Prix au format simplifié (PR E)
 *     tags: [Open Data]
 *     parameters:
 *       - in: query
 *         name: territory
 *         schema:
 *           type: string
 *           enum: [DOM, COM, FRANCE_HEXAGONALE]
 *       - in: query
 *         name: productId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Prix format simplifié avec licence Etalab 2.0
 *         headers:
 *           X-Data-License:
 *             description: Licence des données
 *             schema:
 *               type: string
 *               example: Etalab-2.0
 *           X-Disclaimer:
 *             description: Avertissement légal
 *             schema:
 *               type: string
 *           Cache-Control:
 *             description: Politique de cache
 *             schema:
 *               type: string
 */
router.get('/prices', opendataRateLimiter, SimpleOpenDataController.getPrices);

/**
 * @swagger
 * /api/opendata/anomalies:
 *   get:
 *     summary: Anomalies de prix détectées (PR E)
 *     tags: [Open Data]
 *     parameters:
 *       - in: query
 *         name: territory
 *         schema:
 *           type: string
 *           enum: [DOM, COM, FRANCE_HEXAGONALE]
 *     responses:
 *       200:
 *         description: Anomalies détectées (temporelles et spatiales)
 *         headers:
 *           X-Data-License:
 *             description: Licence des données
 *             schema:
 *               type: string
 *               example: Etalab-2.0
 *           X-Disclaimer:
 *             description: Avertissement légal
 *             schema:
 *               type: string
 */
router.get(
  '/anomalies',
  opendataRateLimiter,
  SimpleOpenDataController.getAnomalies,
);

export default router;
