/**
 * Service de gestion des prix produits - Sprint 4
 *
 * Gère les observations de prix (ProductPrice)
 * Historique immuable - détection d'anomalies
 *
 * RÈGLES:
 * - Chaque modification crée nouvelle entrée (historique)
 * - Aucune suppression autorisée
 * - Détection automatique anomalies (variations > seuil)
 * - Audit obligatoire
 */

import { PrismaClient, PriceSource } from '@prisma/client';
import type { ProductPrice } from '@prisma/client';

const prisma = new PrismaClient();

// Seuil de détection d'anomalie: 50% de variation
const ANOMALY_THRESHOLD = 0.5;

export interface CreatePriceInput {
  productId: string;
  storeId: string;
  price: number; // en centimes
  currency?: string;
  source: PriceSource;
  observedAt: Date;
}

export interface PriceSearchFilters {
  productId?: string;
  storeId?: string;
  source?: PriceSource;
  fromDate?: Date;
  toDate?: Date;
}

export class PriceService {
  /**
   * Créer/Mettre à jour un prix
   *
   * Détection d'anomalie: si variation > 50% par rapport au dernier prix
   */
  async create(input: CreatePriceInput): Promise<{
    price: ProductPrice;
    anomalyDetected: boolean;
    previousPrice?: number;
    variation?: number;
  }> {
    // Vérifier produit et magasin existent
    const [product, store] = await Promise.all([
      prisma.product.findUnique({ where: { id: input.productId } }),
      prisma.store.findUnique({ where: { id: input.storeId } }),
    ]);

    if (!product) throw new Error('Produit introuvable');
    if (!store) throw new Error('Magasin introuvable');

    // Récupérer le dernier prix pour ce produit/magasin
    const lastPrice = await prisma.productPrice.findFirst({
      where: {
        productId: input.productId,
        storeId: input.storeId,
      },
      orderBy: { observedAt: 'desc' },
    });

    let anomalyDetected = false;
    let previousPrice: number | undefined;
    let variation: number | undefined;

    if (lastPrice) {
      previousPrice = lastPrice.price;
      const diff = Math.abs(input.price - lastPrice.price);
      variation = diff / lastPrice.price;

      if (variation > ANOMALY_THRESHOLD) {
        anomalyDetected = true;
      }
    }

    // Créer le prix (historique immuable)
    const price = await prisma.productPrice.create({
      data: {
        productId: input.productId,
        storeId: input.storeId,
        price: input.price,
        currency: input.currency ?? 'EUR',
        source: input.source,
        observedAt: input.observedAt,
      },
    });

    return {
      price,
      anomalyDetected,
      previousPrice,
      variation,
    };
  }

  /**
   * Récupérer l'historique des prix d'un produit
   */
  async getHistory(
    productId: string,
    storeId?: string
  ): Promise<ProductPrice[]> {
    const where: Record<string, unknown> = { productId };
    if (storeId) where.storeId = storeId;

    return prisma.productPrice.findMany({
      where,
      orderBy: { observedAt: 'desc' },
    });
  }

  /**
   * Récupérer les prix actuels d'un produit dans tous les magasins
   */
  async getCurrentPrices(productId: string): Promise<ProductPrice[]> {
    // Récupérer tous les storeIds ayant un prix pour ce produit
    const storeEntries = await prisma.productPrice.findMany({
      where: { productId },
      select: { storeId: true },
      distinct: ['storeId'],
    });

    // Pour chaque magasin, récupérer le prix le plus récent
    const currentPrices = await Promise.all(
      storeEntries.map(({ storeId }) =>
        prisma.productPrice.findFirst({
          where: { productId, storeId },
          orderBy: { observedAt: 'desc' },
        })
      )
    );

    return currentPrices.filter((p): p is ProductPrice => p !== null);
  }

  /**
   * Comparer les prix de plusieurs produits
   */
  async compare(
    productIds: string[],
    storeId?: string
  ): Promise<Array<{ productId: string; prices: ProductPrice[] }>> {
    const results = await Promise.all(
      productIds.map(async (productId) => {
        const prices = storeId
          ? await this.getHistory(productId, storeId)
          : await this.getCurrentPrices(productId);

        return { productId, prices };
      })
    );

    return results;
  }

  /**
   * Rechercher des prix avec filtres
   */
  async search(
    filters: PriceSearchFilters = {},
    page = 1,
    limit = 20
  ): Promise<{ prices: ProductPrice[]; total: number; page: number; totalPages: number }> {
    const skip = (page - 1) * Math.min(limit, 100);
    const take = Math.min(limit, 100);

    const where: Record<string, unknown> = {};
    if (filters.productId) where.productId = filters.productId;
    if (filters.storeId) where.storeId = filters.storeId;
    if (filters.source) where.source = filters.source;
    if (filters.fromDate || filters.toDate) {
      where.observedAt = {};
      if (filters.fromDate) (where.observedAt as Record<string, unknown>).gte = filters.fromDate;
      if (filters.toDate) (where.observedAt as Record<string, unknown>).lte = filters.toDate;
    }

    const [prices, total] = await Promise.all([
      prisma.productPrice.findMany({
        where,
        skip,
        take,
        orderBy: { observedAt: 'desc' },
      }),
      prisma.productPrice.count({ where }),
    ]);

    return { prices, total, page, totalPages: Math.ceil(total / take) };
  }

  /**
   * Obtenir les statistiques des prix
   */
  async getStatistics(): Promise<{
    total: number;
    bySource: Record<PriceSource, number>;
    averagePrice: number;
  }> {
    const [total, ocr, api, openPrices, manual, crowd, scraping, avg] = await Promise.all([
      prisma.productPrice.count(),
      prisma.productPrice.count({ where: { source: 'OCR_TICKET' } }),
      prisma.productPrice.count({ where: { source: 'OFFICIAL_API' } }),
      prisma.productPrice.count({ where: { source: 'OPEN_PRICES' } }),
      prisma.productPrice.count({ where: { source: 'MANUAL_ENTRY' } }),
      prisma.productPrice.count({ where: { source: 'CROWDSOURCED' } }),
      prisma.productPrice.count({ where: { source: 'SCRAPING_AUTHORIZED' } }),
      prisma.productPrice.aggregate({
        _avg: { price: true },
      }),
    ]);

    return {
      total,
      bySource: {
        OCR_TICKET: ocr,
        OFFICIAL_API: api,
        OPEN_PRICES: openPrices,
        MANUAL_ENTRY: manual,
        CROWDSOURCED: crowd,
        SCRAPING_AUTHORIZED: scraping,
      },
      averagePrice: avg._avg.price ?? 0,
    };
  }
}

export default new PriceService();
