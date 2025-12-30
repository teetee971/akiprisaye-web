/**
 * Contrôleur Audit - Sprint 3
 *
 * Endpoints de consultation du journal d'audit
 * Accès réservé aux utilisateurs avec permission AUDIT_READ
 *
 * RÈGLES:
 * - ✅ Lecture seule (GET uniquement)
 * - ❌ Aucune modification
 * - ❌ Aucune suppression
 */

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { PrismaClient, AuditResult, UserRole } from '@prisma/client';
import { AuditService } from './audit.service.js';

const prisma = new PrismaClient();
const auditService = new AuditService(prisma);

/**
 * Schéma de validation pour la liste des logs
 */
const listLogsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  userId: z.string().uuid().optional(),
  userRole: z.enum(['USER', 'ANALYSTE', 'ENSEIGNE', 'INSTITUTION', 'SUPER_ADMIN']).optional(),
  action: z.string().optional(),
  entity: z.string().optional(),
  entityId: z.string().optional(),
  result: z.enum(['SUCCESS', 'FAILURE', 'DENIED']).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

/**
 * GET /api/audit/logs
 *
 * Liste tous les logs d'audit avec filtres et pagination
 *
 * Query params:
 * - page: numéro de page (défaut: 1)
 * - limit: nombre par page (défaut: 50, max: 100)
 * - userId: filtrer par utilisateur
 * - userRole: filtrer par rôle
 * - action: filtrer par action (recherche partielle)
 * - entity: filtrer par type d'entité
 * - entityId: filtrer par ID d'entité
 * - result: filtrer par résultat (SUCCESS, FAILURE, DENIED)
 * - startDate: date de début
 * - endDate: date de fin
 *
 * Returns: { data: AuditLog[], pagination: {...} }
 */
export async function listLogs(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Validation des query params
    const query = listLogsQuerySchema.parse(req.query);

    // Calcul pagination
    const skip = (query.page - 1) * query.limit;

    // Recherche avec filtres
    const logs = await auditService.search(
      {
        userId: query.userId,
        userRole: query.userRole as UserRole | undefined,
        action: query.action,
        entity: query.entity,
        entityId: query.entityId,
        result: query.result as AuditResult | undefined,
        startDate: query.startDate,
        endDate: query.endDate,
      },
      skip,
      query.limit
    );

    // Compter le total
    const total = await auditService.count({
      userId: query.userId,
      userRole: query.userRole as UserRole | undefined,
      action: query.action,
      entity: query.entity,
      entityId: query.entityId,
      result: query.result as AuditResult | undefined,
      startDate: query.startDate,
      endDate: query.endDate,
    });

    res.status(200).json({
      data: logs,
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
 * GET /api/audit/logs/:entityId
 *
 * Récupère les logs d'audit pour une entité spécifique
 *
 * Params: entityId (UUID ou identifiant)
 * Returns: { data: AuditLog[], pagination: {...} }
 */
export async function getLogsByEntity(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { entityId } = req.params;

    // Validation query params pour pagination
    const query = z
      .object({
        page: z.coerce.number().int().min(1).optional().default(1),
        limit: z.coerce.number().int().min(1).max(100).optional().default(50),
      })
      .parse(req.query);

    const skip = (query.page - 1) * query.limit;

    // Récupérer les logs pour cette entité
    const logs = await auditService.findByEntityId(entityId, skip, query.limit);

    // Compter le total pour cette entité
    const total = await auditService.count({ entityId });

    res.status(200).json({
      data: logs,
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
 * GET /api/audit/stats
 *
 * Récupère les statistiques du journal d'audit
 *
 * Returns: { total, byResult, byRole, last24Hours }
 */
export async function getStats(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const stats = await auditService.getStatistics();

    res.status(200).json({
      data: stats,
    });
  } catch (error) {
    next(error);
  }
}
