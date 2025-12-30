/**
 * Service d'audit - Sprint 3
 *
 * Gestion du journal d'audit légal
 * RÈGLES STRICTES:
 * - ✅ Création uniquement (CREATE)
 * - ❌ Aucune modification (NO UPDATE)
 * - ❌ Aucune suppression (NO DELETE)
 * - ✅ Lecture par utilisateurs autorisés
 *
 * Conformité RGPD Art. 30 (registre des activités de traitement)
 */

import { PrismaClient, AuditLog, AuditResult, UserRole } from '@prisma/client';

export interface CreateAuditLogInput {
  userId: string;
  userRole: UserRole;
  action: string;
  entity?: string;
  entityId?: string;
  result: AuditResult;
  message?: string;
  ip?: string;
  userAgent?: string;
}

export interface SearchAuditLogsInput {
  userId?: string;
  userRole?: UserRole;
  action?: string;
  entity?: string;
  entityId?: string;
  result?: AuditResult;
  startDate?: Date;
  endDate?: Date;
}

export class AuditService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Crée une entrée dans le journal d'audit
   *
   * IMMUABLE: Une fois créée, l'entrée ne peut jamais être modifiée ou supprimée
   *
   * @param data - Données de l'audit
   * @returns AuditLog créé
   */
  async create(data: CreateAuditLogInput): Promise<AuditLog> {
    const auditLog = await this.prisma.auditLog.create({
      data: {
        userId: data.userId,
        userRole: data.userRole,
        action: data.action,
        entity: data.entity,
        entityId: data.entityId,
        result: data.result,
        message: data.message,
        ip: data.ip,
        userAgent: data.userAgent,
      },
    });

    return auditLog;
  }

  /**
   * Récupère tous les logs d'audit avec pagination
   *
   * @param skip - Nombre d'entrées à sauter
   * @param take - Nombre d'entrées à récupérer
   * @returns Liste des audit logs
   */
  async findAll(skip = 0, take = 50): Promise<AuditLog[]> {
    return this.prisma.auditLog.findMany({
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * Recherche les logs d'audit selon des critères
   *
   * @param criteria - Critères de recherche
   * @param skip - Pagination skip
   * @param take - Pagination take
   * @returns Liste des audit logs correspondants
   */
  async search(
    criteria: SearchAuditLogsInput,
    skip = 0,
    take = 50
  ): Promise<AuditLog[]> {
    const where: any = {};

    if (criteria.userId) {
      where.userId = criteria.userId;
    }

    if (criteria.userRole) {
      where.userRole = criteria.userRole;
    }

    if (criteria.action) {
      where.action = {
        contains: criteria.action,
        mode: 'insensitive',
      };
    }

    if (criteria.entity) {
      where.entity = criteria.entity;
    }

    if (criteria.entityId) {
      where.entityId = criteria.entityId;
    }

    if (criteria.result) {
      where.result = criteria.result;
    }

    if (criteria.startDate || criteria.endDate) {
      where.createdAt = {};
      if (criteria.startDate) {
        where.createdAt.gte = criteria.startDate;
      }
      if (criteria.endDate) {
        where.createdAt.lte = criteria.endDate;
      }
    }

    return this.prisma.auditLog.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * Récupère les logs d'audit pour une entité spécifique
   *
   * @param entityId - ID de l'entité
   * @param skip - Pagination skip
   * @param take - Pagination take
   * @returns Logs pour cette entité
   */
  async findByEntityId(
    entityId: string,
    skip = 0,
    take = 50
  ): Promise<AuditLog[]> {
    return this.prisma.auditLog.findMany({
      where: { entityId },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * Compte le nombre total de logs
   *
   * @param criteria - Critères de recherche optionnels
   * @returns Nombre total
   */
  async count(criteria?: SearchAuditLogsInput): Promise<number> {
    if (!criteria) {
      return this.prisma.auditLog.count();
    }

    const where: any = {};

    if (criteria.userId) where.userId = criteria.userId;
    if (criteria.userRole) where.userRole = criteria.userRole;
    if (criteria.action)
      where.action = { contains: criteria.action, mode: 'insensitive' };
    if (criteria.entity) where.entity = criteria.entity;
    if (criteria.entityId) where.entityId = criteria.entityId;
    if (criteria.result) where.result = criteria.result;

    if (criteria.startDate || criteria.endDate) {
      where.createdAt = {};
      if (criteria.startDate) where.createdAt.gte = criteria.startDate;
      if (criteria.endDate) where.createdAt.lte = criteria.endDate;
    }

    return this.prisma.auditLog.count({ where });
  }

  /**
   * Statistiques du journal d'audit
   *
   * @returns Statistiques globales
   */
  async getStatistics(): Promise<{
    total: number;
    byResult: Record<AuditResult, number>;
    byRole: Record<UserRole, number>;
    last24Hours: number;
  }> {
    const total = await this.prisma.auditLog.count();

    // Statistiques par résultat
    const byResultData = await this.prisma.auditLog.groupBy({
      by: ['result'],
      _count: true,
    });

    const byResult: Record<string, number> = {};
    byResultData.forEach((item) => {
      byResult[item.result] = item._count;
    });

    // Statistiques par rôle
    const byRoleData = await this.prisma.auditLog.groupBy({
      by: ['userRole'],
      _count: true,
    });

    const byRole: Record<string, number> = {};
    byRoleData.forEach((item) => {
      byRole[item.userRole] = item._count;
    });

    // Logs des dernières 24h
    const last24HoursDate = new Date();
    last24HoursDate.setHours(last24HoursDate.getHours() - 24);

    const last24Hours = await this.prisma.auditLog.count({
      where: {
        createdAt: {
          gte: last24HoursDate,
        },
      },
    });

    return {
      total,
      byResult: byResult as Record<AuditResult, number>,
      byRole: byRole as Record<UserRole, number>,
      last24Hours,
    };
  }

  /**
   * ❌ UPDATE INTERDIT
   *
   * Les logs d'audit ne peuvent jamais être modifiés
   */
  async update(): Promise<never> {
    throw new Error(
      'INTERDIT: Les logs d\'audit sont immuables et ne peuvent pas être modifiés'
    );
  }

  /**
   * ❌ DELETE INTERDIT
   *
   * Les logs d'audit ne peuvent jamais être supprimés
   */
  async delete(): Promise<never> {
    throw new Error(
      'INTERDIT: Les logs d\'audit sont immuables et ne peuvent pas être supprimés'
    );
  }
}
