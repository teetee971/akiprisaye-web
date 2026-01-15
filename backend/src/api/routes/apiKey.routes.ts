/**
 * Routes de gestion des API Keys
 * 
 * Endpoints:
 * - GET /api/api-keys - Liste des clés (JWT uniquement)
 * - POST /api/api-keys - Créer une clé (JWT uniquement, Premium+)
 * - DELETE /api/api-keys/:id - Révoquer une clé (JWT uniquement)
 * - GET /api/api-keys/:id/usage - Statistiques (JWT uniquement)
 * 
 * Authentification: JWT Bearer Token (pas d'API Key pour ces routes)
 */

import { Router } from 'express';
import * as apiKeyController from '../controllers/apiKey.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { requireSubscriptionTier } from '../middlewares/apiAuth.middleware.js';
import { SubscriptionTier } from '@prisma/client';

const router = Router();

// Toutes les routes nécessitent une authentification JWT
router.use(authMiddleware);

/**
 * @swagger
 * /api/api-keys:
 *   get:
 *     summary: Liste des API keys de l'utilisateur
 *     tags: [API Keys]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des clés API
 *       401:
 *         description: Non autorisé
 */
router.get('/', apiKeyController.listApiKeys);

/**
 * @swagger
 * /api/api-keys:
 *   post:
 *     summary: Créer une nouvelle API key
 *     tags: [API Keys]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 100
 *                 example: Production API
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [READ_COMPARATORS, READ_PRICES, READ_TERRITORIES, READ_ANALYTICS, WRITE_CONTRIBUTIONS, EXPORT_DATA, ADMIN]
 *               expiresIn:
 *                 type: integer
 *                 description: Durée de validité en jours (max 365)
 *                 example: 365
 *     responses:
 *       201:
 *         description: Clé créée avec succès
 *       400:
 *         description: Validation échouée
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Abonnement insuffisant
 */
router.post(
  '/',
  requireSubscriptionTier(SubscriptionTier.CITIZEN_PREMIUM),
  apiKeyController.createApiKey
);

/**
 * @swagger
 * /api/api-keys/{id}:
 *   delete:
 *     summary: Révoquer une API key
 *     tags: [API Keys]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Clé révoquée
 *       401:
 *         description: Non autorisé
 *       404:
 *         description: Clé non trouvée
 */
router.delete('/:id', apiKeyController.revokeApiKey);

/**
 * @swagger
 * /api/api-keys/{id}/usage:
 *   get:
 *     summary: Statistiques d'usage d'une API key
 *     tags: [API Keys]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: period
 *         in: query
 *         schema:
 *           type: string
 *           enum: [day, week, month]
 *           default: day
 *     responses:
 *       200:
 *         description: Statistiques d'usage
 *       401:
 *         description: Non autorisé
 *       404:
 *         description: Clé non trouvée
 */
router.get('/:id/usage', apiKeyController.getApiKeyUsage);

export default router;
