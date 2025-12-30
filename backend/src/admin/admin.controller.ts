/**
 * Contrôleur Admin - Sprint 3
 *
 * Endpoints d'administration réservés aux SUPER_ADMIN
 * Gestion des utilisateurs et statistiques globales
 *
 * SÉCURITÉ:
 * - Accès réservé aux SUPER_ADMIN uniquement
 * - Toutes les actions sont auditées
 */

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { PrismaClient, UserRole } from '@prisma/client';
import { AuditService } from '../audit/audit.service.js';

const prisma = new PrismaClient();
const auditService = new AuditService(prisma);

/**
 * Schéma de validation pour la liste des utilisateurs
 */
const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  role: z.enum(['USER', 'ANALYSTE', 'ENSEIGNE', 'INSTITUTION', 'SUPER_ADMIN']).optional(),
  isActive: z.coerce.boolean().optional(),
});

/**
 * Schéma de validation pour la modification de rôle
 */
const updateUserRoleSchema = z.object({
  role: z.enum(['USER', 'ANALYSTE', 'ENSEIGNE', 'INSTITUTION', 'SUPER_ADMIN'], {
    errorMap: () => ({ message: 'Rôle invalide' }),
  }),
});

/**
 * GET /api/admin/users
 *
 * Liste tous les utilisateurs avec filtres et pagination
 * Réservé aux SUPER_ADMIN
 *
 * Query params:
 * - page: numéro de page (défaut: 1)
 * - limit: nombre par page (défaut: 20, max: 100)
 * - role: filtrer par rôle
 * - isActive: filtrer par statut actif/inactif
 *
 * Returns: { data: User[], pagination: {...} }
 */
export async function listUsers(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Validation des query params
    const query = listUsersQuerySchema.parse(req.query);

    // Calcul pagination
    const skip = (query.page - 1) * query.limit;

    // Construction des filtres
    const where: any = {};
    if (query.role) {
      where.role = query.role;
    }
    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    // Récupérer les utilisateurs
    const users = await prisma.user.findMany({
      where,
      skip,
      take: query.limit,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
        // Ne pas exposer passwordHash
      },
      orderBy: { createdAt: 'desc' },
    });

    // Compter le total
    const total = await prisma.user.count({ where });

    res.status(200).json({
      data: users,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/admin/users/:id/role
 *
 * Modifie le rôle d'un utilisateur
 * Réservé aux SUPER_ADMIN
 *
 * Params: id (UUID utilisateur)
 * Body: { role: UserRole }
 * Returns: { data: User }
 */
export async function updateUserRole(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    // Validation du body
    const { role } = updateUserRoleSchema.parse(req.body);

    // Vérifier que l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      res.status(404).json({
        error: 'Non trouvé',
        message: 'Utilisateur non trouvé',
      });
      return;
    }

    // Interdire la modification du propre rôle
    if (req.user?.userId === id) {
      res.status(400).json({
        error: 'Opération interdite',
        message: 'Vous ne pouvez pas modifier votre propre rôle',
      });
      return;
    }

    // Mettre à jour le rôle
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role: role as UserRole },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Audit log
    await auditService.create({
      userId: req.user!.userId,
      userRole: req.userRole as UserRole,
      action: 'UPDATE_USER_ROLE',
      entity: 'User',
      entityId: id,
      result: 'SUCCESS',
      message: `Rôle modifié: ${user.role} → ${role}`,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(200).json({
      message: 'Rôle utilisateur modifié avec succès',
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/admin/stats
 *
 * Récupère les statistiques globales du système
 * Réservé aux SUPER_ADMIN et INSTITUTION
 *
 * Returns: { data: { users, legalEntities, audit } }
 */
export async function getStats(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Statistiques utilisateurs
    const totalUsers = await prisma.user.count();
    const activeUsers = await prisma.user.count({ where: { isActive: true } });
    const usersByRole = await prisma.user.groupBy({
      by: ['role'],
      _count: true,
    });

    const usersByRoleMap: Record<string, number> = {};
    usersByRole.forEach((item) => {
      usersByRoleMap[item.role] = item._count;
    });

    // Statistiques Legal Entities
    const totalLegalEntities = await prisma.legalEntity.count();
    const activeLegalEntities = await prisma.legalEntity.count({
      where: { status: 'ACTIVE' },
    });
    const ceasedLegalEntities = await prisma.legalEntity.count({
      where: { status: 'CEASED' },
    });

    // Statistiques Audit
    const auditStats = await auditService.getStatistics();

    res.status(200).json({
      data: {
        users: {
          total: totalUsers,
          active: activeUsers,
          byRole: usersByRoleMap,
        },
        legalEntities: {
          total: totalLegalEntities,
          active: activeLegalEntities,
          ceased: ceasedLegalEntities,
        },
        audit: auditStats,
      },
    });
  } catch (error) {
    next(error);
  }
}
