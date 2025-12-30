/**
 * Routes Admin - Sprint 3
 *
 * Endpoints d'administration
 * Tous les endpoints sont protégés par:
 * - Authentification JWT (authMiddleware)
 * - Rôle SUPER_ADMIN (sauf stats accessible aux INSTITUTION)
 *
 * SÉCURITÉ:
 * - Rate limiting strict
 * - Audit automatique de toutes les actions
 */

import { Router } from 'express';
import * as adminController from './admin.controller.js';
import { authMiddleware } from '../api/middlewares/auth.middleware.js';
import {
  requireSuperAdmin,
  requirePermission,
} from '../security/rbac.middleware.js';
import { Permission } from '../security/permissions.js';
import rateLimit from 'express-rate-limit';

const router = Router();

// Appliquer l'authentification JWT à toutes les routes
router.use(authMiddleware);

// Rate limiting strict pour les routes admin (10 requêtes / 15 minutes)
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requêtes max
  message: {
    error: 'Trop de requêtes admin',
    message:
      'Limite de requêtes dépassée pour les opérations administratives. Veuillez réessayer dans 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.warn('[SECURITY] Rate limit admin dépassé:', {
      ip: req.ip,
      userId: req.user?.userId,
      path: req.path,
    });

    res.status(429).json({
      error: 'Trop de requêtes',
      message:
        'Limite de requêtes dépassée pour les opérations administratives. Veuillez réessayer dans 15 minutes.',
      timestamp: new Date().toISOString(),
    });
  },
});

router.use(adminLimiter);

/**
 * @swagger
 * /api/admin/stats:
 *   get:
 *     summary: Statistiques globales du système
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     description: Récupère les statistiques globales (utilisateurs, entités, audit)
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
 *                     users:
 *                       type: object
 *                     legalEntities:
 *                       type: object
 *                     audit:
 *                       type: object
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Permission ADMIN_VIEW_STATS requise
 */
router.get(
  '/stats',
  requirePermission(Permission.ADMIN_VIEW_STATS),
  adminController.getStats
);

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Liste tous les utilisateurs
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     description: Liste tous les utilisateurs avec filtres (SUPER_ADMIN uniquement)
 *     parameters:
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
 *           default: 20
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [USER, ANALYSTE, ENSEIGNE, INSTITUTION, SUPER_ADMIN]
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Liste des utilisateurs
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Réservé aux SUPER_ADMIN
 */
router.get('/users', requireSuperAdmin(), adminController.listUsers);

/**
 * @swagger
 * /api/admin/users/{id}/role:
 *   put:
 *     summary: Modifie le rôle d'un utilisateur
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     description: Change le rôle d'un utilisateur (SUPER_ADMIN uniquement)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de l'utilisateur
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [USER, ANALYSTE, ENSEIGNE, INSTITUTION, SUPER_ADMIN]
 *                 description: Nouveau rôle
 *     responses:
 *       200:
 *         description: Rôle modifié avec succès
 *       400:
 *         description: Opération interdite (modification de son propre rôle)
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Réservé aux SUPER_ADMIN
 *       404:
 *         description: Utilisateur non trouvé
 */
router.put('/users/:id/role', requireSuperAdmin(), adminController.updateUserRole);

export default router;
