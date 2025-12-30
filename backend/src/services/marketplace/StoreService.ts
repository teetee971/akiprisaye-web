/**
 * Service de gestion des magasins (Stores) - Sprint 4
 *
 * Gère les opérations CRUD sur les points de vente
 * Géolocalisation et segmentation par territoire
 */

import { PrismaClient, Store, Territory } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateStoreInput {
  brandId: string;
  name: string;
  address: string;
  postalCode: string;
  city: string;
  territory: Territory;
  latitude?: number;
  longitude?: number;
}

export interface UpdateStoreInput {
  name?: string;
  address?: string;
  postalCode?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  isActive?: boolean;
}

export interface StoreSearchFilters {
  brandId?: string;
  territory?: Territory;
  city?: string;
  isActive?: boolean;
}

export class StoreService {
  async create(input: CreateStoreInput): Promise<Store> {
    // Vérifier que la brand existe et est ACTIVE
    const brand = await prisma.brand.findUnique({ where: { id: input.brandId } });
    if (!brand || brand.status !== 'ACTIVE') {
      throw new Error('Enseigne introuvable ou non active');
    }

    return prisma.store.create({
      data: input,
      include: { brand: true },
    });
  }

  async findById(id: string): Promise<Store | null> {
    return prisma.store.findUnique({
      where: { id },
      include: { brand: true, prices: true },
    });
  }

  async search(
    filters: StoreSearchFilters = {},
    page = 1,
    limit = 20
  ): Promise<{ stores: Store[]; total: number; page: number; totalPages: number }> {
    const skip = (page - 1) * Math.min(limit, 100);
    const take = Math.min(limit, 100);

    const where: any = {};
    if (filters.brandId) where.brandId = filters.brandId;
    if (filters.territory) where.territory = filters.territory;
    if (filters.city) where.city = { contains: filters.city, mode: 'insensitive' };
    if (filters.isActive !== undefined) where.isActive = filters.isActive;

    const [stores, total] = await Promise.all([
      prisma.store.findMany({
        where,
        include: { brand: true },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.store.count({ where }),
    ]);

    return { stores, total, page, totalPages: Math.ceil(total / take) };
  }

  async update(id: string, input: UpdateStoreInput): Promise<Store> {
    return prisma.store.update({
      where: { id },
      data: input,
      include: { brand: true },
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.store.delete({ where: { id } });
  }

  async getStatistics(): Promise<{
    total: number;
    byTerritory: Record<Territory, number>;
    active: number;
  }> {
    const [total, france, dom, com, active] = await Promise.all([
      prisma.store.count(),
      prisma.store.count({ where: { territory: 'FRANCE_HEXAGONALE' } }),
      prisma.store.count({ where: { territory: 'DOM' } }),
      prisma.store.count({ where: { territory: 'COM' } }),
      prisma.store.count({ where: { isActive: true } }),
    ]);

    return {
      total,
      byTerritory: {
        FRANCE_HEXAGONALE: france,
        DOM: dom,
        COM: com,
      },
      active,
    };
  }
}

export default new StoreService();
