/**
 * Routes LegalEntity
 *
 * Tous les endpoints sont protégés par authentification JWT
 *
 * Endpoints:
 * - POST /api/legal-entities - Créer
 * - GET /api/legal-entities - Lister
 * - GET /api/legal-entities/stats - Statistiques
 * - GET /api/legal-entities/:id - Détails
 * - PUT /api/legal-entities/:id - Modifier
 * - DELETE /api/legal-entities/:id - Supprimer
 */

import { Router } from 'express';
import * as legalEntityController from '../controllers/legalEntity.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { createLimiter } from '../middlewares/rateLimit.middleware.js';

const router = Router();

// Appliquer l'authentification JWT à toutes les routes
router.use(authMiddleware);

/**
 * GET /api/legal-entities/stats
 *
 * Récupère les statistiques (total, active, ceased)
 * Note: Doit être avant /:id pour éviter confusion avec params
 */
router.get('/stats', legalEntityController.getStats);

/**
 * POST /api/legal-entities
 *
 * Crée une nouvelle entité juridique
 * Rate limited: 20 créations par heure
 */
router.post('/', createLimiter, legalEntityController.create);

/**
 * GET /api/legal-entities
 *
 * Liste les entités juridiques avec pagination et filtres
 * Query params: ?page=1&limit=20&siren=...&siret=...&name=...&status=ACTIVE
 */
router.get('/', legalEntityController.list);

/**
 * GET /api/legal-entities/:id
 *
 * Récupère les détails d'une entité juridique par ID
 */
router.get('/:id', legalEntityController.getById);

/**
 * PUT /api/legal-entities/:id
 *
 * Met à jour une entité juridique
 */
router.put('/:id', legalEntityController.update);

/**
 * DELETE /api/legal-entities/:id
 *
 * Supprime une entité juridique
 */
router.delete('/:id', legalEntityController.remove);

export default router;
