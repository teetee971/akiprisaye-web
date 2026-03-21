/**
 * Service de gestion des magasins (Stores) - Sprint 4
 *
 * Gère les opérations CRUD sur les points de vente
 * Aligné sur le schéma Prisma réel (Store sans relations brand/prices)
 */

import { PrismaClient } from '@prisma/client';
import type { Store } from '@prisma/client';
import { Territory } from '../comparison/types.js';

const prisma = new PrismaClient();

export interface CreateStoreInput {
  normalizedName: string;
  rawName?: string;
  brand?: string;
  company?: string;
  siret?: string;
  address?: string;
  postalCode?: string;
  city?: string;
  territory: string;
}

export interface UpdateStoreInput {
  normalizedName?: string;
  rawName?: string;
  brand?: string;
  address?: string;
  postalCode?: string;
  city?: string;
}

export interface StoreSearchFilters {
  brand?: string;
  territory?: string;
  city?: string;
}

export class StoreService {
  async create(input: CreateStoreInput): Promise<Store> {
    return prisma.store.create({
      data: input,
    });
  }

  async findById(id: string): Promise<Store | null> {
    return prisma.store.findUnique({
      where: { id },
    });
  }

  async search(
    filters: StoreSearchFilters = {},
    page = 1,
    limit = 20
  ): Promise<{ stores: Store[]; total: number; page: number; totalPages: number }> {
    const skip = (page - 1) * Math.min(limit, 100);
    const take = Math.min(limit, 100);

    const where: Record<string, unknown> = {};
    if (filters.brand) where.brand = filters.brand;
    if (filters.territory) where.territory = filters.territory;
    if (filters.city) where.city = { contains: filters.city, mode: 'insensitive' };

    const [stores, total] = await Promise.all([
      prisma.store.findMany({
        where,
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
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.store.delete({ where: { id } });
  }

  async getStatistics(): Promise<{
    total: number;
    byTerritory: Partial<Record<Territory, number>>;
  }> {
    const [total, ...territoryCounts] = await Promise.all([
      prisma.store.count(),
      prisma.store.count({ where: { territory: Territory.FRANCE_HEXAGONALE } }),
      prisma.store.count({ where: { territory: Territory.GUADELOUPE } }),
      prisma.store.count({ where: { territory: Territory.MARTINIQUE } }),
      prisma.store.count({ where: { territory: Territory.GUYANE } }),
      prisma.store.count({ where: { territory: Territory.LA_REUNION } }),
      prisma.store.count({ where: { territory: Territory.MAYOTTE } }),
      prisma.store.count({ where: { territory: Territory.SAINT_MARTIN } }),
      prisma.store.count({ where: { territory: Territory.SAINT_BARTHELEMY } }),
      prisma.store.count({ where: { territory: Territory.SAINT_PIERRE_ET_MIQUELON } }),
      prisma.store.count({ where: { territory: Territory.WALLIS_ET_FUTUNA } }),
      prisma.store.count({ where: { territory: Territory.DOM } }),
      prisma.store.count({ where: { territory: Territory.COM } }),
    ]);

    const [gf, gp, mq, gy, re, yt, mf, bl, pm, wf, dom, com] = territoryCounts;

    return {
      total,
      byTerritory: {
        [Territory.FRANCE_HEXAGONALE]: gf,
        [Territory.GUADELOUPE]: gp,
        [Territory.MARTINIQUE]: mq,
        [Territory.GUYANE]: gy,
        [Territory.LA_REUNION]: re,
        [Territory.MAYOTTE]: yt,
        [Territory.SAINT_MARTIN]: mf,
        [Territory.SAINT_BARTHELEMY]: bl,
        [Territory.SAINT_PIERRE_ET_MIQUELON]: pm,
        [Territory.WALLIS_ET_FUTUNA]: wf,
        [Territory.DOM]: dom,
        [Territory.COM]: com,
      },
    };
  }
}

export default new StoreService();
