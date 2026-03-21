/**
 * Service de gestion des enseignes (Brands) - Sprint 4
 *
 * Gère les opérations CRUD sur les enseignes commerciales
 * Aligné sur le schéma Prisma réel (brand simplifié)
 *
 * Conformité RGPD et juridique
 */

import { PrismaClient, BrandStatus } from '@prisma/client';
import type { brand } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateBrandInput {
  name: string;
  normalizedName: string;
  logoUrl?: string;
  description?: string;
  website?: string;
}

export interface UpdateBrandInput {
  name?: string;
  normalizedName?: string;
  logoUrl?: string;
  description?: string;
  website?: string;
}

export interface BrandSearchFilters {
  status?: BrandStatus;
  search?: string;
}

export class BrandService {
  /**
   * Créer une nouvelle enseigne
   *
   * @param input - Données de l'enseigne
   * @returns Enseigne créée (status = INACTIVE)
   */
  async create(input: CreateBrandInput): Promise<brand> {
    return prisma.brand.create({
      data: {
        name: input.name,
        normalizedName: input.normalizedName,
        logoUrl: input.logoUrl,
        description: input.description,
        website: input.website,
        status: 'INACTIVE', // Toujours INACTIVE initialement, activée après validation
      },
    });
  }

  /**
   * Récupérer une enseigne par ID
   *
   * @param id - ID de l'enseigne
   * @returns Enseigne ou null
   */
  async findById(id: string): Promise<brand | null> {
    return prisma.brand.findUnique({
      where: { id },
    });
  }

  /**
   * Lister les enseignes avec filtres et pagination
   */
  async search(
    filters: BrandSearchFilters = {},
    page = 1,
    limit = 20
  ): Promise<{ brands: brand[]; total: number; page: number; totalPages: number }> {
    const skip = (page - 1) * Math.min(limit, 100);
    const take = Math.min(limit, 100);

    const where: Record<string, unknown> = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [brands, total] = await Promise.all([
      prisma.brand.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.brand.count({ where }),
    ]);

    return {
      brands,
      total,
      page,
      totalPages: Math.ceil(total / take),
    };
  }

  /**
   * Mettre à jour une enseigne
   */
  async update(id: string, input: UpdateBrandInput): Promise<brand> {
    return prisma.brand.update({
      where: { id },
      data: input,
    });
  }

  /**
   * Approuver une enseigne — change INACTIVE → ACTIVE
   */
  async approve(id: string): Promise<brand> {
    const existing = await prisma.brand.findUnique({ where: { id } });

    if (!existing) {
      throw new Error('Enseigne introuvable');
    }

    if (existing.status !== 'INACTIVE') {
      throw new Error('Seules les enseignes inactives (INACTIVE) peuvent être approuvées');
    }

    return prisma.brand.update({
      where: { id },
      data: { status: 'ACTIVE' },
    });
  }

  /**
   * Suspendre une enseigne — change ACTIVE → INACTIVE
   */
  async suspend(id: string): Promise<brand> {
    return prisma.brand.update({
      where: { id },
      data: { status: 'INACTIVE' },
    });
  }

  /**
   * Réactiver une enseigne — change INACTIVE → ACTIVE
   */
  async reactivate(id: string): Promise<brand> {
    const existing = await prisma.brand.findUnique({ where: { id } });

    if (!existing) {
      throw new Error('Enseigne introuvable');
    }

    if (existing.status !== 'INACTIVE') {
      throw new Error('Seules les enseignes inactives (INACTIVE) peuvent être réactivées');
    }

    return prisma.brand.update({
      where: { id },
      data: { status: 'ACTIVE' },
    });
  }

  /**
   * Supprimer une enseigne
   */
  async delete(id: string): Promise<void> {
    await prisma.brand.delete({
      where: { id },
    });
  }

  /**
   * Obtenir les statistiques des enseignes
   */
  async getStatistics(): Promise<{
    total: number;
    byStatus: Record<BrandStatus, number>;
  }> {
    const [total, active, inactive] = await Promise.all([
      prisma.brand.count(),
      prisma.brand.count({ where: { status: 'ACTIVE' } }),
      prisma.brand.count({ where: { status: 'INACTIVE' } }),
    ]);

    return {
      total,
      byStatus: {
        ACTIVE: active,
        INACTIVE: inactive,
      },
    };
  }
}

export default new BrandService();
