/**
 * Price Observation Service
 *
 * Crée les observations de prix issues d'un ticket OCR.
 * Une observation = une ligne produit à un instant donné dans un magasin.
 */

import { randomUUID } from 'node:crypto';
import prisma from '../../database/prisma.js';
import type { PriceObservationInput } from '../../types/receipt.types.js';

export class PriceObservationService {

  /**
   * Crée une observation de prix.
   * Retourne l'ID de l'observation créée.
   */
  async create(input: PriceObservationInput): Promise<string> {
    const obs = await prisma.priceObservation.create({
      data: {
        id: randomUUID(),
        source: input.source,
        receiptId: input.receiptId,
        receiptItemId: input.receiptItemId ?? null,
        productId: input.productId ?? null,
        territory: input.territory,
        storeId: input.storeId ?? null,
        storeLabel: input.storeLabel,
        observedAt: input.observedAt,
        productLabel: input.productLabel,
        normalizedLabel: input.normalizedLabel,
        category: input.category ?? null,
        brand: input.brand ?? null,
        barcode: input.barcode ?? null,
        quantity: input.quantity ?? null,
        unit: input.unit ?? null,
        packageSizeValue: input.packageSizeValue ?? null,
        packageSizeUnit: input.packageSizeUnit ?? null,
        price: input.price,
        currency: input.currency,
        confidenceScore: Math.round(input.confidenceScore * 100),
        needsReview: input.needsReview,
      },
    });
    return obs.id;
  }

  /**
   * Récupère les observations d'un produit dans un territoire donné.
   */
  async getForProduct(
    productId: string,
    territory: string,
    from?: Date,
    to?: Date,
  ) {
    return prisma.priceObservation.findMany({
      where: {
        productId,
        territory,
        ...(from || to
          ? {
              observedAt: {
                ...(from ? { gte: from } : {}),
                ...(to ? { lte: to } : {}),
              },
            }
          : {}),
      },
      orderBy: { observedAt: 'asc' },
    });
  }

  /**
   * Prix minimum historique pour un produit + territoire.
   */
  async getHistoricalMin(productId: string, territory: string): Promise<number | null> {
    const result = await prisma.priceObservation.aggregate({
      where: { productId, territory },
      _min: { price: true },
    });
    return result._min.price ?? null;
  }
}

export const priceObservationService = new PriceObservationService();
