/**
 * Service de gestion des prix (Prices) - Sprint 4
 *
 * Gère les opérations sur les prix
 * Historique immuable - détection d'anomalies
 *
 * RÈGLES:
 * - Chaque modification crée nouvelle entrée (historique)
 * - Aucune suppression autorisée
 * - Détection automatique anomalies (variations > seuil)
 * - Audit obligatoire
 */

import { PrismaClient, Price, PriceSource } from '@prisma/client';

const prisma = new PrismaClient();

// Seuil de détection d'anomalie: 50% de variation
const ANOMALY_THRESHOLD = 0.5;

export interface CreatePriceInput {
  productId: string;
  storeId: string;
  price: number; // en centimes
  currency?: string;
  source: PriceSource;
  effectiveDate: Date;
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
   *
   * @param input - Données du prix
   * @returns Prix créé + warning si anomalie détectée
   */
  async create(input: CreatePriceInput): Promise<{
    price: Price;
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
    const lastPrice = await prisma.price.findFirst({
      where: {
        productId: input.productId,
        storeId: input.storeId,
      },
      orderBy: { effectiveDate: 'desc' },
    });

    let anomalyDetected = false;
    let previousPrice: number | undefined;
    let variation: number | undefined;

    if (lastPrice) {
      previousPrice = lastPrice.price;
      const diff = Math.abs(input.price - lastPrice.price);
      variation = diff / lastPrice.price;

      // Détection anomalie
      if (variation > ANOMALY_THRESHOLD) {
        anomalyDetected = true;
      }
    }

    // Créer le prix (historique immuable)
    const price = await prisma.price.create({
      data: {
        productId: input.productId,
        storeId: input.storeId,
        price: input.price,
        currency: input.currency || 'EUR',
        source: input.source,
        effectiveDate: input.effectiveDate,
      },
      include: {
        product: true,
        store: true,
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
   *
   * @param productId - ID du produit
   * @param storeId - ID du magasin (optionnel - tous si omis)
   * @returns Historique des prix
   */
  async getHistory(
    productId: string,
    storeId?: string
  ): Promise<Price[]> {
    const where: any = { productId };
    if (storeId) where.storeId = storeId;

    return prisma.price.findMany({
      where,
      include: {
        product: true,
        store: true,
      },
      orderBy: { effectiveDate: 'desc' },
    });
  }

  /**
   * Récupérer les prix actuels d'un produit dans tous les magasins
   *
   * @param productId - ID du produit
   * @returns Prix actuels par magasin
   */
  async getCurrentPrices(productId: string): Promise<Price[]> {
    // Récupérer tous les magasins ayant un prix pour ce produit
    const stores = await prisma.store.findMany({
      where: {
        prices: {
          some: {
            productId,
          },
        },
      },
    });

    // Pour chaque magasin, récupérer le prix le plus récent
    const currentPrices = await Promise.all(
      stores.map(async (store) => {
        return prisma.price.findFirst({
          where: {
            productId,
            storeId: store.id,
          },
          include: {
            product: true,
            store: true,
          },
          orderBy: { effectiveDate: 'desc' },
        });
      })
    );

    return currentPrices.filter((p): p is Price => p !== null);
  }

  /**
   * Comparer les prix de plusieurs produits
   *
   * @param productIds - IDs des produits
   * @param storeId - ID du magasin (optionnel)
   * @returns Comparaison des prix
   */
  async compare(
    productIds: string[],
    storeId?: string
  ): Promise<Array<{ productId: string; prices: Price[] }>> {
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
   *
   * @param filters - Critères de recherche
   * @param page - Page
   * @param limit - Limite
   * @returns Liste de prix
   */
  async search(
    filters: PriceSearchFilters = {},
    page = 1,
    limit = 20
  ): Promise<{ prices: Price[]; total: number; page: number; totalPages: number }> {
    const skip = (page - 1) * Math.min(limit, 100);
    const take = Math.min(limit, 100);

    const where: any = {};
    if (filters.productId) where.productId = filters.productId;
    if (filters.storeId) where.storeId = filters.storeId;
    if (filters.source) where.source = filters.source;
    if (filters.fromDate || filters.toDate) {
      where.effectiveDate = {};
      if (filters.fromDate) where.effectiveDate.gte = filters.fromDate;
      if (filters.toDate) where.effectiveDate.lte = filters.toDate;
    }

    const [prices, total] = await Promise.all([
      prisma.price.findMany({
        where,
        include: {
          product: true,
          store: true,
        },
        skip,
        take,
        orderBy: { effectiveDate: 'desc' },
      }),
      prisma.price.count({ where }),
    ]);

    return { prices, total, page, totalPages: Math.ceil(total / take) };
  }

  /**
   * Obtenir les statistiques des prix
   *
   * @returns Statistiques
   */
  async getStatistics(): Promise<{
    total: number;
    bySource: Record<PriceSource, number>;
    averagePrice: number;
  }> {
    const [total, manual, api, institution, avg] = await Promise.all([
      prisma.price.count(),
      prisma.price.count({ where: { source: 'MANUAL' } }),
      prisma.price.count({ where: { source: 'API' } }),
      prisma.price.count({ where: { source: 'INSTITUTION' } }),
      prisma.price.aggregate({
        _avg: { price: true },
      }),
    ]);

    return {
      total,
      bySource: {
        MANUAL: manual,
        API: api,
        INSTITUTION: institution,
      },
      averagePrice: avg._avg.price || 0,
    };
  }
}

export default new PriceService();
