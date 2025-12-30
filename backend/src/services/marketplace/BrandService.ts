/**
 * Service de gestion des enseignes (Brands) - Sprint 4
 *
 * Gère les opérations CRUD sur les enseignes commerciales
 * Validation stricte avec entité légale (SIREN/SIRET)
 *
 * Règles métier:
 * - Une enseigne doit être liée à une LegalEntity validée
 * - Validation requise par INSTITUTION ou SUPER_ADMIN
 * - Abonnement obligatoire pour publier produits/prix
 *
 * Conformité RGPD et juridique
 */

import { PrismaClient, Brand, BrandStatus, SubscriptionPlan } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateBrandInput {
  name: string;
  legalEntityId: string;
  subscriptionPlan?: SubscriptionPlan;
  logoUrl?: string;
  description?: string;
  website?: string;
}

export interface UpdateBrandInput {
  name?: string;
  logoUrl?: string;
  description?: string;
  website?: string;
  subscriptionPlan?: SubscriptionPlan;
}

export interface BrandSearchFilters {
  status?: BrandStatus;
  subscriptionPlan?: SubscriptionPlan;
  legalEntityId?: string;
  search?: string;
}

export class BrandService {
  /**
   * Créer une nouvelle enseigne
   *
   * @param input - Données de l'enseigne
   * @returns Enseigne créée (status = PENDING)
   * @throws Error si legalEntityId invalide
   */
  async create(input: CreateBrandInput): Promise<Brand> {
    // Vérifier que l'entité légale existe
    const legalEntity = await prisma.legalEntity.findUnique({
      where: { id: input.legalEntityId },
    });

    if (!legalEntity) {
      throw new Error('Entité légale introuvable');
    }

    if (legalEntity.status !== 'ACTIVE') {
      throw new Error("L'entité légale doit être active (ACTIVE)");
    }

    // Créer l'enseigne (status = PENDING par défaut)
    return prisma.brand.create({
      data: {
        name: input.name,
        legalEntityId: input.legalEntityId,
        subscriptionPlan: input.subscriptionPlan || 'BASIC',
        logoUrl: input.logoUrl,
        description: input.description,
        website: input.website,
        status: 'PENDING', // Toujours PENDING initialement
      },
      include: {
        legalEntity: true,
      },
    });
  }

  /**
   * Récupérer une enseigne par ID
   *
   * @param id - ID de l'enseigne
   * @returns Enseigne ou null
   */
  async findById(id: string): Promise<Brand | null> {
    return prisma.brand.findUnique({
      where: { id },
      include: {
        legalEntity: true,
        stores: true,
        products: true,
        subscriptions: true,
      },
    });
  }

  /**
   * Lister les enseignes avec filtres et pagination
   *
   * @param filters - Critères de recherche
   * @param page - Numéro de page (défaut: 1)
   * @param limit - Nombre par page (défaut: 20, max: 100)
   * @returns Liste d'enseignes
   */
  async search(
    filters: BrandSearchFilters = {},
    page = 1,
    limit = 20
  ): Promise<{ brands: Brand[]; total: number; page: number; totalPages: number }> {
    const skip = (page - 1) * Math.min(limit, 100);
    const take = Math.min(limit, 100);

    const where: any = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.subscriptionPlan) {
      where.subscriptionPlan = filters.subscriptionPlan;
    }

    if (filters.legalEntityId) {
      where.legalEntityId = filters.legalEntityId;
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
        include: {
          legalEntity: true,
        },
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
   *
   * @param id - ID de l'enseigne
   * @param input - Données à mettre à jour
   * @returns Enseigne mise à jour
   */
  async update(id: string, input: UpdateBrandInput): Promise<Brand> {
    return prisma.brand.update({
      where: { id },
      data: input,
      include: {
        legalEntity: true,
      },
    });
  }

  /**
   * Approuver une enseigne (INSTITUTION/SUPER_ADMIN uniquement)
   *
   * Change le statut de PENDING à ACTIVE
   *
   * @param id - ID de l'enseigne
   * @returns Enseigne approuvée
   */
  async approve(id: string): Promise<Brand> {
    const brand = await prisma.brand.findUnique({ where: { id } });

    if (!brand) {
      throw new Error('Enseigne introuvable');
    }

    if (brand.status !== 'PENDING') {
      throw new Error("Seules les enseignes en attente (PENDING) peuvent être approuvées");
    }

    return prisma.brand.update({
      where: { id },
      data: { status: 'ACTIVE' },
      include: {
        legalEntity: true,
      },
    });
  }

  /**
   * Suspendre une enseigne (INSTITUTION/SUPER_ADMIN uniquement)
   *
   * Change le statut à SUSPENDED
   * Raisons: non-paiement, violation CGU, etc.
   *
   * @param id - ID de l'enseigne
   * @returns Enseigne suspendue
   */
  async suspend(id: string): Promise<Brand> {
    return prisma.brand.update({
      where: { id },
      data: { status: 'SUSPENDED' },
      include: {
        legalEntity: true,
      },
    });
  }

  /**
   * Réactiver une enseigne suspendue
   *
   * @param id - ID de l'enseigne
   * @returns Enseigne réactivée
   */
  async reactivate(id: string): Promise<Brand> {
    const brand = await prisma.brand.findUnique({ where: { id } });

    if (!brand) {
      throw new Error('Enseigne introuvable');
    }

    if (brand.status !== 'SUSPENDED') {
      throw new Error("Seules les enseignes suspendues (SUSPENDED) peuvent être réactivées");
    }

    return prisma.brand.update({
      where: { id },
      data: { status: 'ACTIVE' },
      include: {
        legalEntity: true,
      },
    });
  }

  /**
   * Supprimer une enseigne
   *
   * ⚠️ Supprime en cascade: stores, products, prices, subscriptions
   * Uniquement si aucune facture payée
   *
   * @param id - ID de l'enseigne
   */
  async delete(id: string): Promise<void> {
    // Vérifier qu'il n'y a pas de factures payées
    const paidInvoices = await prisma.invoice.count({
      where: {
        subscription: {
          brandId: id,
        },
        status: 'PAID',
      },
    });

    if (paidInvoices > 0) {
      throw new Error(
        'Impossible de supprimer une enseigne avec des factures payées. Contactez le support.'
      );
    }

    await prisma.brand.delete({
      where: { id },
    });
  }

  /**
   * Obtenir les statistiques des enseignes
   *
   * @returns Statistiques globales
   */
  async getStatistics(): Promise<{
    total: number;
    byStatus: Record<BrandStatus, number>;
    byPlan: Record<SubscriptionPlan, number>;
  }> {
    const [total, pending, active, suspended, basic, pro, institution] = await Promise.all([
      prisma.brand.count(),
      prisma.brand.count({ where: { status: 'PENDING' } }),
      prisma.brand.count({ where: { status: 'ACTIVE' } }),
      prisma.brand.count({ where: { status: 'SUSPENDED' } }),
      prisma.brand.count({ where: { subscriptionPlan: 'BASIC' } }),
      prisma.brand.count({ where: { subscriptionPlan: 'PRO' } }),
      prisma.brand.count({ where: { subscriptionPlan: 'INSTITUTION' } }),
    ]);

    return {
      total,
      byStatus: {
        PENDING: pending,
        ACTIVE: active,
        SUSPENDED: suspended,
      },
      byPlan: {
        BASIC: basic,
        PRO: pro,
        INSTITUTION: institution,
      },
    };
  }
}

export default new BrandService();
