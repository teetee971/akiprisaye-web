/**
 * OpenDataService - Service pour l'API Open Data publique
 * 
 * Conforme à la Licence Ouverte / Open Licence v2.0
 * RGPD: Art. 5 (minimisation), Art. 25 (privacy by design)
 * Open Data France: Données publiques agrégées et anonymisées
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AggregatedPrice {
  productName: string;
  category: string | null;
  territory: string;
  averagePrice: number;
  minPrice: number;
  maxPrice: number;
  sampleSize: number;
  lastUpdated: Date;
}

interface TerritoryData {
  code: string;
  name: string;
  storeCount: number;
  productCount: number;
  lastUpdated: Date;
}

interface Indicator {
  name: string;
  value: number;
  unit: string;
  territory?: string;
  period: string;
  calculatedAt: Date;
}

interface PriceHistory {
  productName: string;
  category: string | null;
  territory: string;
  timeSeries: {
    date: Date;
    averagePrice: number;
    sampleSize: number;
  }[];
}

export class OpenDataService {
  /**
   * Liste tous les territoires disponibles dans l'Open Data
   */
  static async getTerritories(): Promise<TerritoryData[]> {
    const stores = await prisma.store.groupBy({
      by: ['territory'],
      _count: {
        id: true,
      },
    });

    const territoryData: TerritoryData[] = [];

    for (const store of stores) {
      const productCount = await prisma.priceObservation.count({
        where: {
          territory: store.territory,
        },
      });

      const lastObservation = await prisma.priceObservation.findFirst({
        where: {
          territory: store.territory,
        },
        orderBy: {
          observedAt: 'desc',
        },
        select: {
          observedAt: true,
        },
      });

      territoryData.push({
        code: store.territory,
        name: this.getTerritoryName(store.territory),
        storeCount: store._count.id,
        productCount,
        lastUpdated: lastObservation?.observedAt || new Date(),
      });
    }

    return territoryData;
  }

  /**
   * Récupère les produits agrégés (pas de détails magasin)
   */
  static async getProducts(filters: {
    territory?: string;
    category?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{
    products: Array<{
      name: string;
      category: string | null;
      territories: string[];
      priceRange: { min: number; max: number };
    }>;
    total: number;
  }> {
    const { territory, category, limit = 100, offset = 0 } = filters;

    const where: any = {};

    if (category) {
      where.category = category;
    }

    if (territory) {
      where.territory = territory;
    }

    const [observations, total] = await Promise.all([
      prisma.priceObservation.findMany({
        where,
        select: {
          normalizedLabel: true,
          category: true,
          territory: true,
          price: true,
        },
        orderBy: { observedAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.priceObservation.count({ where }),
    ]);

    // Aggregate by normalizedLabel
    const productMap = new Map<string, {
      name: string;
      category: string | null;
      territories: Set<string>;
      prices: number[];
    }>();

    for (const obs of observations) {
      const key = obs.normalizedLabel;
      if (!productMap.has(key)) {
        productMap.set(key, { name: obs.normalizedLabel, category: obs.category, territories: new Set(), prices: [] });
      }
      const entry = productMap.get(key)!;
      entry.territories.add(obs.territory);
      entry.prices.push(obs.price);
    }

    return {
      products: Array.from(productMap.values()).map((p) => ({
        name: p.name,
        category: p.category,
        territories: Array.from(p.territories) as string[],
        priceRange: {
          min: p.prices.length > 0 ? Math.min(...p.prices) : 0,
          max: p.prices.length > 0 ? Math.max(...p.prices) : 0,
        },
      })),
      total,
    };
  }

  /**
   * Récupère les prix agrégés par produit/territoire
   * IMPORTANT: Pas de données individuelles par magasin (anonymisation)
   */
  static async getAggregatedPrices(filters: {
    territory?: string;
    category?: string;
    productId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  } = {}): Promise<{
    prices: AggregatedPrice[];
    total: number;
  }> {
    const {
      territory,
      category,
      productId,
      startDate,
      endDate,
      limit = 100,
      offset = 0,
    } = filters;

    const where: any = {
      productId: { not: null },
    };

    if (territory) {
      where.territory = territory;
    }

    if (category) {
      where.category = category;
    }

    if (productId) {
      where.productId = productId;
    }

    if (startDate || endDate) {
      where.observedAt = {};
      if (startDate) where.observedAt.gte = startDate;
      if (endDate) where.observedAt.lte = endDate;
    }

    // Group by productId and territory
    const priceGroups = await prisma.priceObservation.groupBy({
      by: ['productId', 'territory'],
      _avg: { price: true },
      _min: { price: true },
      _max: { price: true },
      _count: { id: true },
      where,
      orderBy: { productId: 'asc' },
      take: limit,
      skip: offset,
    });

    const totalCount = await prisma.priceObservation.groupBy({
      by: ['productId', 'territory'],
      where,
      _count: { _all: true },
    });

    const aggregatedPrices: AggregatedPrice[] = [];

    for (const group of priceGroups) {
      if (!group.productId) continue;

      const product = await prisma.product.findUnique({
        where: { id: group.productId },
        select: { displayName: true, category: true },
      });

      const lastObs = await prisma.priceObservation.findFirst({
        where: { productId: group.productId, territory: group.territory },
        orderBy: { observedAt: 'desc' },
        select: { observedAt: true },
      });

      if (product) {
        aggregatedPrices.push({
          productName: product.displayName,
          category: product.category,
          territory: group.territory,
          averagePrice: Number(group._avg?.price ?? 0),
          minPrice: Number(group._min?.price ?? 0),
          maxPrice: Number(group._max?.price ?? 0),
          sampleSize: group._count.id,
          lastUpdated: lastObs?.observedAt ?? new Date(),
        });
      }
    }

    return {
      prices: aggregatedPrices,
      total: totalCount.length,
    };
  }

  /**
   * Calcule les indicateurs publics (inflation locale, dispersion, etc.)
   */
  static async getIndicators(filters: {
    territory?: string;
    period?: 'month' | 'quarter' | 'year';
  } = {}): Promise<Indicator[]> {
    const { territory, period = 'month' } = filters;
    const indicators: Indicator[] = [];

    const now = new Date();
    const periodStart = this.getPeriodStart(now, period);

    // Inflation locale estimée
    const currentPrices = await this.getAveragePriceForPeriod(
      territory,
      now,
      now,
    );
    const previousPrices = await this.getAveragePriceForPeriod(
      territory,
      periodStart,
      periodStart,
    );

    if (currentPrices && previousPrices && previousPrices > 0) {
      const inflation =
        ((currentPrices - previousPrices) / previousPrices) * 100;
      indicators.push({
        name: 'inflation_estimate',
        value: Math.round(inflation * 100) / 100,
        unit: 'percent',
        territory,
        period: period,
        calculatedAt: new Date(),
      });
    }

    // Dispersion des prix (coefficient de variation)
    const priceStats = await this.getPriceDispersion(territory);
    if (priceStats) {
      indicators.push({
        name: 'price_dispersion',
        value: Math.round(priceStats.coefficient * 100) / 100,
        unit: 'coefficient',
        territory,
        period: period,
        calculatedAt: new Date(),
      });
    }

    // Nombre de produits suivis
    const productCount = await prisma.priceObservation.count({
      where: {
        ...(territory ? { territory } : {}),
      },
    });

    indicators.push({
      name: 'tracked_products',
      value: productCount,
      unit: 'count',
      territory,
      period: period,
      calculatedAt: new Date(),
    });

    return indicators;
  }

  /**
   * Récupère l'historique des prix (séries temporelles)
   * Agrégé par semaine pour réduire le volume
   */
  static async getHistory(filters: {
    productName?: string;
    category?: string;
    territory?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  } = {}): Promise<PriceHistory[]> {
    const {
      productName,
      category,
      territory,
      startDate,
      endDate,
      limit = 50,
    } = filters;

    const where: any = {};

    if (productName) {
      where.normalizedLabel = { contains: productName.toLowerCase(), mode: 'insensitive' };
    }

    if (category) {
      where.category = category;
    }

    if (territory) {
      where.territory = territory;
    }

    if (startDate || endDate) {
      where.observedAt = {};
      if (startDate) where.observedAt.gte = startDate;
      if (endDate) where.observedAt.lte = endDate;
    }

    const observations = await prisma.priceObservation.findMany({
      where,
      select: {
        price: true,
        observedAt: true,
        normalizedLabel: true,
        category: true,
        territory: true,
      },
      orderBy: {
        observedAt: 'desc',
      },
      take: 1000,
    });

    const grouped = new Map<string, PriceHistory>();

    for (const obs of observations) {
      const key = `${obs.normalizedLabel}-${obs.territory}`;

      if (!grouped.has(key)) {
        grouped.set(key, {
          productName: obs.normalizedLabel,
          category: obs.category,
          territory: obs.territory,
          timeSeries: [],
        });
      }

      const history = grouped.get(key)!;
      const weekStart = this.getWeekStart(obs.observedAt);

      const existing = history.timeSeries.find(
        (ts) => ts.date.getTime() === weekStart.getTime(),
      );

      if (existing) {
        const newAvg =
          (existing.averagePrice * existing.sampleSize + Number(obs.price)) /
          (existing.sampleSize + 1);
        existing.averagePrice = newAvg;
        existing.sampleSize += 1;
      } else {
        history.timeSeries.push({
          date: weekStart,
          averagePrice: Number(obs.price),
          sampleSize: 1,
        });
      }
    }

    return Array.from(grouped.values())
      .slice(0, limit)
      .map((h) => ({
        ...h,
        timeSeries: h.timeSeries.sort(
          (a, b) => a.date.getTime() - b.date.getTime(),
        ),
      }));
  }

  // ============ Méthodes utilitaires privées ============

  private static getTerritoryName(territory: string): string {
    const names: Record<string, string> = {
      gp: 'Guadeloupe',
      mq: 'Martinique',
      gf: 'Guyane',
      re: 'La Réunion',
      pm: 'Saint-Pierre-et-Miquelon',
      yt: 'Mayotte',
    };
    return names[territory] || territory.toUpperCase();
  }

  private static getPeriodStart(date: Date, period: string): Date {
    const start = new Date(date);
    switch (period) {
      case 'month':
        start.setMonth(start.getMonth() - 1);
        break;
      case 'quarter':
        start.setMonth(start.getMonth() - 3);
        break;
      case 'year':
        start.setFullYear(start.getFullYear() - 1);
        break;
    }
    return start;
  }

  private static async getAveragePriceForPeriod(
    territory: string | undefined,
    startDate: Date,
    endDate: Date,
  ): Promise<number | null> {
    const result = await prisma.priceObservation.aggregate({
      _avg: {
        price: true,
      },
      where: {
        observedAt: {
          gte: startDate,
          lte: endDate,
        },
        ...(territory ? { territory } : {}),
      },
    });

    return result._avg.price ? Number(result._avg.price) : null;
  }

  private static async getPriceDispersion(
    territory: string | undefined,
  ): Promise<{ coefficient: number } | null> {
    const result = await prisma.priceObservation.aggregate({
      _avg: {
        price: true,
      },
      where: {
        ...(territory ? { territory } : {}),
      },
    });

    if (!result._avg.price) return null;

    const prices = await prisma.priceObservation.findMany({
      where: {
        ...(territory ? { territory } : {}),
      },
      select: {
        price: true,
      },
      take: 1000,
    });

    const avg = Number(result._avg.price);
    const variance =
      prices.reduce(
        (sum, p) => sum + Math.pow(Number(p.price) - avg, 2),
        0,
      ) / prices.length;
    const stdDev = Math.sqrt(variance);
    const coefficient = stdDev / avg;

    return { coefficient };
  }

  private static getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Lundi
    return new Date(d.setDate(diff));
  }
}
