/**
 * Service de génération de devis - Sprint 4
 *
 * Génération de devis personnalisés pour BUSINESS et INSTITUTIONS
 * IA déterministe (pas d'hallucination)
 * Aligné sur le schéma Prisma réel (quoteRequest / quote)
 */

import { PrismaClient, QuoteStatus, RequesterType } from '@prisma/client';
import type { quoteRequest, quote } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateQuoteRequestInput {
  requesterName: string;
  requesterType: RequesterType;
  email: string;
  phone?: string;
  organization?: string;
  message: string;
}

export class QuoteService {
  /**
   * Créer une demande de devis
   */
  async createRequest(input: CreateQuoteRequestInput): Promise<quoteRequest> {
    return prisma.quoteRequest.create({
      data: {
        requesterName: input.requesterName,
        requesterType: input.requesterType,
        email: input.email,
        phone: input.phone,
        organization: input.organization,
        message: input.message,
        status: 'PENDING',
      },
    });
  }

  /**
   * Générer un devis automatiquement (IA déterministe)
   *
   * RÈGLES:
   * - Calcul basé sur type de demandeur
   * - Pas d'hallucination - calcul déterministe
   * - Validité 30 jours
   */
  async generateQuote(quoteRequestId: string): Promise<quote> {
    const request = await prisma.quoteRequest.findUnique({
      where: { id: quoteRequestId },
    });

    if (!request) throw new Error('Demande de devis introuvable');
    if (request.status !== 'PENDING') throw new Error('Demande déjà traitée');

    // Calcul déterministe du montant
    let baseAmount = 50000; // 500€ de base

    // Ajustement selon type de demandeur
    if (request.requesterType === 'INSTITUTION') {
      baseAmount = 150000; // 1500€ pour institutions
    } else if (request.requesterType === 'BUSINESS') {
      baseAmount = 80000; // 800€ pour entreprises
    }

    // Détails JSON
    const details = {
      basePrice: baseAmount,
      requesterType: request.requesterType,
      includes: [
        'Accès API complet',
        'Support premium',
        'Données temps réel',
        'Prédictions IA illimitées',
      ],
      validityDays: 30,
      paymentTerms: 'Net 30 jours',
    };

    // Créer le devis (schéma: requestId, requester, email, details, status, validUntil)
    const createdQuote = await prisma.quote.create({
      data: {
        requestId: quoteRequestId,
        requester: request.requesterName,
        email: request.email,
        phone: request.phone,
        details,
        status: 'PENDING',
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 jours
      },
    });

    return createdQuote;
  }

  async getQuote(id: string): Promise<quote | null> {
    return prisma.quote.findUnique({
      where: { id },
    });
  }

  async getQuoteByRequest(quoteRequestId: string): Promise<quote | null> {
    return prisma.quote.findUnique({
      where: { requestId: quoteRequestId },
    });
  }

  async acceptQuote(id: string): Promise<quote> {
    const existingQuote = await prisma.quote.findUnique({
      where: { id },
    });

    if (!existingQuote) throw new Error('Devis introuvable');
    if (existingQuote.status === 'ACCEPTED') throw new Error('Devis déjà accepté');
    if (existingQuote.validUntil !== null && new Date() > existingQuote.validUntil) {
      throw new Error('Devis expiré');
    }

    const [updatedQuote] = await Promise.all([
      prisma.quote.update({
        where: { id },
        data: { status: 'ACCEPTED' },
      }),
      existingQuote.requestId
        ? prisma.quoteRequest.update({
            where: { id: existingQuote.requestId },
            data: { status: 'ACCEPTED' },
          })
        : Promise.resolve(null),
    ]);

    return updatedQuote;
  }

  async getRequests(page = 1, limit = 20): Promise<{
    requests: quoteRequest[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * Math.min(limit, 100);
    const take = Math.min(limit, 100);

    const [requests, total] = await Promise.all([
      prisma.quoteRequest.findMany({
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.quoteRequest.count(),
    ]);

    return { requests, total, page, totalPages: Math.ceil(total / take) };
  }

  async getStatistics(): Promise<{
    totalRequests: number;
    byStatus: Record<QuoteStatus, number>;
    byType: Record<RequesterType, number>;
  }> {
    const [total, pending, accepted, rejected, expired, individual, business, institution] =
      await Promise.all([
        prisma.quoteRequest.count(),
        prisma.quoteRequest.count({ where: { status: 'PENDING' } }),
        prisma.quoteRequest.count({ where: { status: 'ACCEPTED' } }),
        prisma.quoteRequest.count({ where: { status: 'REJECTED' } }),
        prisma.quoteRequest.count({ where: { status: 'EXPIRED' } }),
        prisma.quoteRequest.count({ where: { requesterType: 'INDIVIDUAL' } }),
        prisma.quoteRequest.count({ where: { requesterType: 'BUSINESS' } }),
        prisma.quoteRequest.count({ where: { requesterType: 'INSTITUTION' } }),
      ]);

    return {
      totalRequests: total,
      byStatus: { PENDING: pending, ACCEPTED: accepted, REJECTED: rejected, EXPIRED: expired },
      byType: { INDIVIDUAL: individual, BUSINESS: business, INSTITUTION: institution },
    };
  }
}

export default new QuoteService();
