/**
 * OpenDataService - Service pour l'API Open Data publique
 * 
 * Conforme à la Licence Ouverte / Open Licence v2.0
 * RGPD: Art. 5 (minimisation), Art. 25 (privacy by design)
 * Open Data France: Données publiques agrégées et anonymisées
 */

import { PrismaClient, Territory } from '@prisma/client';

const prisma = new PrismaClient();

interface AggregatedPrice {
  productName: string;
  category: string;
  territory: Territory;
  averagePrice: number;
  minPrice: number;
  maxPrice: number;
  sampleSize: number;
  lastUpdated: Date;
}

interface TerritoryData {
  code: Territory;
  name: string;
  storeCount: number;
  productCount: number;
  lastUpdated: Date;
}

interface Indicator {
  name: string;
  value: number;
  unit: string;
  territory?: Territory;
  period: string;
  calculatedAt: Date;
}

interface PriceHistory {
  productName: string;
  category: string;
  territory: Territory;
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
      where: {
        isActive: true,
      },
    });

    const territoryData: TerritoryData[] = [];

    for (const store of stores) {
      const productCount = await prisma.product.count({
        where: {
          brand: {
            stores: {
              some: {
                territory: store.territory,
                isActive: true,
              },
            },
          },
          isActive: true,
        },
      });

      const lastPrice = await prisma.price.findFirst({
        where: {
          store: {
            territory: store.territory,
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          createdAt: true,
        },
      });

      territoryData.push({
        code: store.territory,
        name: this.getTerritoryName(store.territory),
        storeCount: store._count.id,
        productCount,
        lastUpdated: lastPrice?.createdAt || new Date(),
      });
    }

    return territoryData;
  }

  /**
   * Récupère les produits agrégés (pas de détails magasin)
   */
  static async getProducts(filters: {
    territory?: Territory;
    category?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{
    products: Array<{
      name: string;
      category: string;
      territories: Territory[];
      priceRange: { min: number; max: number };
    }>;
    total: number;
  }> {
    const { territory, category, limit = 100, offset = 0 } = filters;

    const where: any = {
      isActive: true,
    };

    if (category) {
      where.category = category;
    }

    if (territory) {
      where.prices = {
        some: {
          store: {
            territory,
            isActive: true,
          },
        },
      };
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        select: {
          name: true,
          category: true,
          prices: {
            where: {
              store: {
                isActive: true,
              },
            },
            select: {
              price: true,
              store: {
                select: {
                  territory: true,
                },
              },
            },
            orderBy: {
              effectiveDate: 'desc',
            },
            take: 100,
          },
        },
        take: limit,
        skip: offset,
      }),
      prisma.product.count({ where }),
    ]);

    return {
      products: products.map((p) => {
        const prices = p.prices.map((pr) => Number(pr.price));
        const territories = [
          ...new Set(p.prices.map((pr) => pr.store.territory)),
        ];

        return {
          name: p.name,
          category: p.category,
          territories: territories as Territory[],
          priceRange: {
            min: prices.length > 0 ? Math.min(...prices) : 0,
            max: prices.length > 0 ? Math.max(...prices) : 0,
          },
        };
      }),
      total,
    };
  }

  /**
   * Récupère les prix agrégés par produit/territoire
   * IMPORTANT: Pas de données individuelles par magasin (anonymisation)
   */
  static async getAggregatedPrices(filters: {
    territory?: Territory;
    category?: string;
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
      startDate,
      endDate,
      limit = 100,
      offset = 0,
    } = filters;

    const where: any = {
      product: {
        isActive: true,
      },
      store: {
        isActive: true,
      },
    };

    if (territory) {
      where.store.territory = territory;
    }

    if (category) {
      where.product.category = category;
    }

    if (startDate) {
      where.effectiveDate = { gte: startDate };
    }

    if (endDate) {
      where.effectiveDate = {
        ...where.effectiveDate,
        lte: endDate,
      };
    }

    // Grouper par produit et territoire
    const priceGroups = await prisma.price.groupBy({
      by: ['productId'],
      _avg: {
        price: true,
      },
      _min: {
        price: true,
      },
      _max: {
        price: true,
      },
      _count: {
        id: true,
      },
      where,
      take: limit,
      skip: offset,
    });

    const total = await prisma.price.groupBy({
      by: ['productId'],
      where,
    });

    const aggregatedPrices: AggregatedPrice[] = [];

    for (const group of priceGroups) {
      const product = await prisma.product.findUnique({
        where: { id: group.productId },
        select: {
          name: true,
          category: true,
          prices: {
            where: {
              ...where,
              productId: group.productId,
            },
            select: {
              store: {
                select: {
                  territory: true,
                },
              },
              createdAt: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
            take: 1,
          },
        },
      });

      if (product && product.prices.length > 0) {
        aggregatedPrices.push({
          productName: product.name,
          category: product.category,
          territory: product.prices[0].store.territory,
          averagePrice: Number(group._avg.price || 0),
          minPrice: Number(group._min.price || 0),
          maxPrice: Number(group._max.price || 0),
          sampleSize: group._count.id,
          lastUpdated: product.prices[0].createdAt,
        });
      }
    }

    return {
      prices: aggregatedPrices,
      total: total.length,
    };
  }

  /**
   * Calcule les indicateurs publics (inflation locale, dispersion, etc.)
   */
  static async getIndicators(filters: {
    territory?: Territory;
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
    const productCount = await prisma.product.count({
      where: {
        isActive: true,
        ...(territory
          ? {
              prices: {
                some: {
                  store: {
                    territory,
                    isActive: true,
                  },
                },
              },
            }
          : {}),
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
    territory?: Territory;
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

    const where: any = {
      product: {
        isActive: true,
      },
    };

    if (productName) {
      where.product.name = { contains: productName, mode: 'insensitive' };
    }

    if (category) {
      where.product.category = category;
    }

    if (territory) {
      where.store = { territory, isActive: true };
    }

    if (startDate) {
      where.effectiveDate = { gte: startDate };
    }

    if (endDate) {
      where.effectiveDate = {
        ...where.effectiveDate,
        lte: endDate,
      };
    }

    const prices = await prisma.price.findMany({
      where,
      select: {
        price: true,
        effectiveDate: true,
        product: {
          select: {
            name: true,
            category: true,
          },
        },
        store: {
          select: {
            territory: true,
          },
        },
      },
      orderBy: {
        effectiveDate: 'desc',
      },
      take: 1000, // Limite pour éviter surcharge
    });

    // Grouper par produit et agréger par semaine
    const grouped = new Map<string, PriceHistory>();

    for (const price of prices) {
      const key = `${price.product.name}-${price.store.territory}`;

      if (!grouped.has(key)) {
        grouped.set(key, {
          productName: price.product.name,
          category: price.product.category,
          territory: price.store.territory,
          timeSeries: [],
        });
      }

      const history = grouped.get(key)!;
      const weekStart = this.getWeekStart(price.effectiveDate);

      const existing = history.timeSeries.find(
        (ts) => ts.date.getTime() === weekStart.getTime(),
      );

      if (existing) {
        const newAvg =
          (existing.averagePrice * existing.sampleSize +
            Number(price.price)) /
          (existing.sampleSize + 1);
        existing.averagePrice = newAvg;
        existing.sampleSize += 1;
      } else {
        history.timeSeries.push({
          date: weekStart,
          averagePrice: Number(price.price),
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

  private static getTerritoryName(territory: Territory): string {
    const names: Record<Territory, string> = {
      DOM: "Départements d'Outre-Mer",
      COM: "Collectivités d'Outre-Mer",
      FRANCE_HEXAGONALE: 'France hexagonale',
    };
    return names[territory] || territory;
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
    territory: Territory | undefined,
    startDate: Date,
    endDate: Date,
  ): Promise<number | null> {
    const result = await prisma.price.aggregate({
      _avg: {
        price: true,
      },
      where: {
        effectiveDate: {
          gte: startDate,
          lte: endDate,
        },
        ...(territory
          ? {
              store: {
                territory,
                isActive: true,
              },
            }
          : {}),
      },
    });

    return result._avg.price ? Number(result._avg.price) : null;
  }

  private static async getPriceDispersion(
    territory: Territory | undefined,
  ): Promise<{ coefficient: number } | null> {
    const result = await prisma.price.aggregate({
      _avg: {
        price: true,
      },
      where: {
        ...(territory
          ? {
              store: {
                territory,
                isActive: true,
              },
            }
          : {}),
      },
    });

    if (!result._avg.price) return null;

    const prices = await prisma.price.findMany({
      where: {
        ...(territory
          ? {
              store: {
                territory,
                isActive: true,
              },
            }
          : {}),
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
