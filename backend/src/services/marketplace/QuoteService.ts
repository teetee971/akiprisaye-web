/**
 * Service de génération de devis - Sprint 4
 *
 * Génération de devis personnalisés pour PRO et INSTITUTIONS
 * IA déterministe (pas d'hallucination)
 */

import { PrismaClient, QuoteRequest, Quote, QuoteStatus, RequesterType, Territory } from '@prisma/client';

const prisma = new PrismaClient();

const MODEL_VERSION = 'v1.0.0-quote-generator';

export interface CreateQuoteRequestInput {
  requesterType: RequesterType;
  email: string;
  companyName: string;
  needs: string;
  estimatedVolume?: string;
  territory?: Territory;
}

export class QuoteService {
  /**
   * Créer une demande de devis
   *
   * @param input - Données de la demande
   * @returns Demande créée
   */
  async createRequest(input: CreateQuoteRequestInput): Promise<QuoteRequest> {
    return prisma.quoteRequest.create({
      data: {
        requesterType: input.requesterType,
        email: input.email,
        companyName: input.companyName,
        needs: input.needs,
        estimatedVolume: input.estimatedVolume,
        territory: input.territory,
        status: 'PENDING',
      },
    });
  }

  /**
   * Générer un devis automatiquement (IA déterministe)
   *
   * RÈGLES:
   * - Calcul basé sur volume estimé et type de demandeur
   * - Pas d'hallucination - calcul déterministe
   * - Validité 30 jours
   *
   * @param quoteRequestId - ID de la demande
   * @returns Devis généré
   */
  async generateQuote(quoteRequestId: string): Promise<Quote> {
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
    }

    // Ajustement selon volume (si fourni)
    if (request.estimatedVolume) {
      const volumeMatch = request.estimatedVolume.match(/\d+/);
      if (volumeMatch) {
        const volume = parseInt(volumeMatch[0]);
        if (volume > 100) baseAmount *= 1.5;
        if (volume > 500) baseAmount *= 2;
        if (volume > 1000) baseAmount *= 3;
      }
    }

    // Détails JSON
    const details = JSON.stringify({
      basePrice: baseAmount,
      requesterType: request.requesterType,
      territory: request.territory,
      includes: [
        'Accès API complet',
        'Support premium',
        'Données temps réel',
        'Prédictions IA illimitées',
      ],
      validityDays: 30,
      paymentTerms: 'Net 30 jours',
    });

    // Créer le devis
    const quote = await prisma.quote.create({
      data: {
        quoteRequestId,
        amount: baseAmount,
        currency: 'EUR',
        details,
        generatedByAI: true,
        modelVersion: MODEL_VERSION,
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 jours
      },
      include: { quoteRequest: true },
    });

    // Mettre à jour le statut de la demande
    await prisma.quoteRequest.update({
      where: { id: quoteRequestId },
      data: { status: 'SENT' },
    });

    return quote;
  }

  async getQuote(id: string): Promise<Quote | null> {
    return prisma.quote.findUnique({
      where: { id },
      include: { quoteRequest: true },
    });
  }

  async getQuoteByRequest(quoteRequestId: string): Promise<Quote | null> {
    return prisma.quote.findUnique({
      where: { quoteRequestId },
      include: { quoteRequest: true },
    });
  }

  async acceptQuote(id: string): Promise<Quote> {
    const quote = await prisma.quote.findUnique({
      where: { id },
      include: { quoteRequest: true },
    });

    if (!quote) throw new Error('Devis introuvable');
    if (quote.acceptedAt) throw new Error('Devis déjà accepté');
    if (new Date() > quote.validUntil) throw new Error('Devis expiré');

    const [updatedQuote] = await Promise.all([
      prisma.quote.update({
        where: { id },
        data: { acceptedAt: new Date() },
        include: { quoteRequest: true },
      }),
      prisma.quoteRequest.update({
        where: { id: quote.quoteRequestId },
        data: { status: 'ACCEPTED' },
      }),
    ]);

    return updatedQuote;
  }

  async getRequests(page = 1, limit = 20): Promise<{
    requests: QuoteRequest[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * Math.min(limit, 100);
    const take = Math.min(limit, 100);

    const [requests, total] = await Promise.all([
      prisma.quoteRequest.findMany({
        include: { quote: true },
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
    totalValue: number;
  }> {
    const [total, pending, sent, accepted, rejected, pro, institution, value] = await Promise.all([
      prisma.quoteRequest.count(),
      prisma.quoteRequest.count({ where: { status: 'PENDING' } }),
      prisma.quoteRequest.count({ where: { status: 'SENT' } }),
      prisma.quoteRequest.count({ where: { status: 'ACCEPTED' } }),
      prisma.quoteRequest.count({ where: { status: 'REJECTED' } }),
      prisma.quoteRequest.count({ where: { requesterType: 'PRO' } }),
      prisma.quoteRequest.count({ where: { requesterType: 'INSTITUTION' } }),
      prisma.quote.aggregate({
        where: { acceptedAt: { not: null } },
        _sum: { amount: true },
      }),
    ]);

    return {
      totalRequests: total,
      byStatus: { PENDING: pending, SENT: sent, ACCEPTED: accepted, REJECTED: rejected },
      byType: { PRO: pro, INSTITUTION: institution },
      totalValue: value._sum.amount || 0,
    };
  }
}

export default new QuoteService();
