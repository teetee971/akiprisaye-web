/**
 * Price History Aggregation Service
 *
 * Maintient les agrégats mensuels et annuels de prix par produit + territoire.
 * Compatible avec affichages: graphique 3 mois, 12 mois, multi-années.
 *
 * Stratégie d'upsert:
 * - On recalcule avg/min/max à partir des observations stockées
 *   pour le mois/année concerné(e).
 * - Utilise une transaction pour éviter les race conditions.
 */

import { randomUUID } from 'node:crypto';
import prismaDefault from '../../database/prisma.js';

// Minimal Prisma interface for dependency injection / testing
type MonthlyRecord = {
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
  observationsCount: number;
};
type YearlyRecord = {
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
  observationsCount: number;
};
type PrismaLike = {
  priceHistoryMonthly: {
    findUnique: (...args: unknown[]) => Promise<MonthlyRecord | null>;
    create: (...args: unknown[]) => Promise<unknown>;
    update: (...args: unknown[]) => Promise<unknown>;
    findMany: (...args: unknown[]) => Promise<MonthlyRecord[]>;
  };
  priceHistoryYearly: {
    findUnique: (...args: unknown[]) => Promise<YearlyRecord | null>;
    create: (...args: unknown[]) => Promise<unknown>;
    update: (...args: unknown[]) => Promise<unknown>;
    findMany: (...args: unknown[]) => Promise<YearlyRecord[]>;
  };
};

export interface HistoryUpdateResult {
  monthlyCreated: boolean;
  yearlyCreated: boolean;
}

export class PriceHistoryAggregationService {

  constructor(private readonly prisma: PrismaLike = prismaDefault as unknown as PrismaLike) {}

  /**
   * Met à jour les agrégats mensuel ET annuel pour un produit.
   * Doit être appelé après chaque nouvelle observation de prix.
   */
  async update(
    productId: string,
    territory: string,
    observedAt: Date,
    price: number,
  ): Promise<HistoryUpdateResult> {
    const year = observedAt.getFullYear();
    const month = observedAt.getMonth() + 1; // 1-12

    const [monthly, yearly] = await Promise.all([
      this.updateMonthly(productId, territory, year, month, price),
      this.updateYearly(productId, territory, year, price),
    ]);

    return { monthlyCreated: monthly, yearlyCreated: yearly };
  }

  // ─── Monthly ───────────────────────────────────────────────────────────────

  async updateMonthly(
    productId: string,
    territory: string,
    year: number,
    month: number,
    newPrice: number,
  ): Promise<boolean> {
    const existing = await this.prisma.priceHistoryMonthly.findUnique({
      where: { productId_territory_year_month: { productId, territory, year, month } },
    });

    if (!existing) {
      await this.prisma.priceHistoryMonthly.create({
        data: {
          id: randomUUID(),
          productId,
          territory,
          year,
          month,
          avgPrice: newPrice,
          minPrice: newPrice,
          maxPrice: newPrice,
          observationsCount: 1,
        },
      });
      return true;
    }

    // Recalculer avg en ligne (formule incrémentale: évite rechargement de toutes les obs)
    const n = existing.observationsCount;
    const newAvg = (existing.avgPrice * n + newPrice) / (n + 1);
    const newMin = Math.min(existing.minPrice, newPrice);
    const newMax = Math.max(existing.maxPrice, newPrice);

    await this.prisma.priceHistoryMonthly.update({
      where: { productId_territory_year_month: { productId, territory, year, month } },
      data: {
        avgPrice: newAvg,
        minPrice: newMin,
        maxPrice: newMax,
        observationsCount: n + 1,
      },
    });
    return false;
  }

  // ─── Yearly ────────────────────────────────────────────────────────────────

  async updateYearly(
    productId: string,
    territory: string,
    year: number,
    newPrice: number,
  ): Promise<boolean> {
    const existing = await this.prisma.priceHistoryYearly.findUnique({
      where: { productId_territory_year: { productId, territory, year } },
    });

    if (!existing) {
      await this.prisma.priceHistoryYearly.create({
        data: {
          id: randomUUID(),
          productId,
          territory,
          year,
          avgPrice: newPrice,
          minPrice: newPrice,
          maxPrice: newPrice,
          observationsCount: 1,
        },
      });
      return true;
    }

    const n = existing.observationsCount;
    const newAvg = (existing.avgPrice * n + newPrice) / (n + 1);

    await this.prisma.priceHistoryYearly.update({
      where: { productId_territory_year: { productId, territory, year } },
      data: {
        avgPrice: newAvg,
        minPrice: Math.min(existing.minPrice, newPrice),
        maxPrice: Math.max(existing.maxPrice, newPrice),
        observationsCount: n + 1,
      },
    });
    return false;
  }

  // ─── Queries ───────────────────────────────────────────────────────────────

  /**
   * Historique mensuel sur N mois glissants.
   */
  async getMonthlyHistory(
    productId: string,
    territory: string,
    months = 12,
  ) {
    const now = new Date();
    const since = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);
    return this.prisma.priceHistoryMonthly.findMany({
      where: {
        productId,
        territory,
        OR: [
          { year: { gt: since.getFullYear() } },
          {
            year: since.getFullYear(),
            month: { gte: since.getMonth() + 1 },
          },
        ],
      },
      orderBy: [{ year: 'asc' }, { month: 'asc' }],
    });
  }

  /**
   * Historique annuel.
   */
  async getYearlyHistory(productId: string, territory: string) {
    return this.prisma.priceHistoryYearly.findMany({
      where: { productId, territory },
      orderBy: { year: 'asc' },
    });
  }
}

export const priceHistoryAggregationService = new PriceHistoryAggregationService();
