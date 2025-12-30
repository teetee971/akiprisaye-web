/**
 * Routes Audit - Sprint 3
 *
 * Endpoints de consultation du journal d'audit
 * Tous les endpoints sont protégés par:
 * - Authentification JWT (authMiddleware)
 * - Permission AUDIT_READ (requirePermission)
 *
 * RÈGLES:
 * - ✅ GET uniquement (lecture seule)
 * - ❌ Aucun POST/PUT/DELETE
 */

import { Router } from 'express';
import * as auditController from './audit.controller.js';
import { authMiddleware } from '../api/middlewares/auth.middleware.js';
import { requirePermission } from '../security/rbac.middleware.js';
import { Permission } from '../security/permissions.js';

const router = Router();

// Appliquer l'authentification JWT à toutes les routes
router.use(authMiddleware);

// Appliquer la permission AUDIT_READ à toutes les routes
router.use(requirePermission(Permission.AUDIT_READ));

/**
 * @swagger
 * /api/audit/stats:
 *   get:
 *     summary: Statistiques du journal d'audit
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     description: Récupère les statistiques globales du journal d'audit (total, par résultat, par rôle, dernières 24h)
 *     responses:
 *       200:
 *         description: Statistiques récupérées
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: number
 *                     byResult:
 *                       type: object
 *                     byRole:
 *                       type: object
 *                     last24Hours:
 *                       type: number
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Permission AUDIT_READ requise
 */
router.get('/stats', auditController.getStats);

/**
 * @swagger
 * /api/audit/logs:
 *   get:
 *     summary: Liste les logs d'audit avec filtres
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     description: Récupère tous les logs d'audit avec pagination et filtres multiples
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Numéro de page
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *         description: Nombre d'entrées par page
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filtrer par utilisateur
 *       - in: query
 *         name: userRole
 *         schema:
 *           type: string
 *           enum: [USER, ANALYSTE, ENSEIGNE, INSTITUTION, SUPER_ADMIN]
 *         description: Filtrer par rôle
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *         description: Filtrer par action (recherche partielle)
 *       - in: query
 *         name: entity
 *         schema:
 *           type: string
 *         description: Filtrer par type d'entité
 *       - in: query
 *         name: entityId
 *         schema:
 *           type: string
 *         description: Filtrer par ID d'entité
 *       - in: query
 *         name: result
 *         schema:
 *           type: string
 *           enum: [SUCCESS, FAILURE, DENIED]
 *         description: Filtrer par résultat
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Date de début
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Date de fin
 *     responses:
 *       200:
 *         description: Liste des logs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                 pagination:
 *                   type: object
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Permission AUDIT_READ requise
 */
router.get('/logs', auditController.listLogs);

/**
 * @swagger
 * /api/audit/logs/{entityId}:
 *   get:
 *     summary: Logs d'audit pour une entité spécifique
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     description: Récupère tous les logs concernant une entité particulière
 *     parameters:
 *       - in: path
 *         name: entityId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'entité
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *     responses:
 *       200:
 *         description: Logs pour l'entité
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Permission AUDIT_READ requise
 */
router.get('/logs/:entityId', auditController.getLogsByEntity);

export default router;
