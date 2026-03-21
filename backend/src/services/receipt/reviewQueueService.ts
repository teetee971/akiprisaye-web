/**
 * Review Queue Service
 *
 * Gère la file de relecture humaine pour les entités ambiguës
 * (receipts, items, produits, images produit).
 */

import { randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import prisma from '../../database/prisma.js';
import type { ReviewEntityType, ReviewQueueEntryInput } from '../../types/receipt.types.js';

export class ReviewQueueService {

  /**
   * Ajoute une entrée dans la review queue.
   * Idempotent: si une entrée pending existe déjà pour (entityType, entityId), elle est réutilisée.
   */
  async enqueue(input: ReviewQueueEntryInput): Promise<string> {
    // Chercher entrée pending existante
    const existing = await prisma.reviewQueueEntry.findFirst({
      where: {
        entityType: input.entityType,
        entityId: input.entityId,
        status: 'pending',
      },
    });

    if (existing) return existing.id;

    const entry = await prisma.reviewQueueEntry.create({
      data: {
        id: randomUUID(),
        entityType: input.entityType,
        entityId: input.entityId,
        reason: input.reason,
        payloadJson: (input.payloadJson as Prisma.InputJsonValue | undefined) ?? undefined,
        status: 'pending',
      },
    });

    return entry.id;
  }

  /**
   * Enqueue en masse — ignore les erreurs individuelles pour ne pas bloquer l'import.
   */
  async enqueueBatch(entries: ReviewQueueEntryInput[]): Promise<number> {
    let count = 0;
    for (const entry of entries) {
      try {
        await this.enqueue(entry);
        count++;
      } catch {
        // best-effort
      }
    }
    return count;
  }

  async countPending(entityType?: ReviewEntityType): Promise<number> {
    return prisma.reviewQueueEntry.count({
      where: { status: 'pending', ...(entityType ? { entityType } : {}) },
    });
  }
}

export const reviewQueueService = new ReviewQueueService();
