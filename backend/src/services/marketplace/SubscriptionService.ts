/**
 * Service de gestion des abonnements et facturation - Sprint 4
 *
 * Gestion monétisation de la plateforme
 * Aligné sur le schéma Prisma réel (Subscription par userId, invoice)
 *
 * RÈGLES:
 * - Un abonnement par utilisateur
 * - Facturation manuelle via invoice
 */

import { PrismaClient, SubscriptionPlan, SubscriptionStatus } from '@prisma/client';
import type { Subscription, invoice } from '@prisma/client';

const prisma = new PrismaClient();

// Prix des plans (en centimes/mois)
const PLAN_PRICES: Record<SubscriptionPlan, number> = {
  FREE: 0,           // 0€
  BASIC: 9900,       // 99€
  PREMIUM: 29900,    // 299€
  INSTITUTION: 99900, // 999€
};

export interface CreateSubscriptionInput {
  userId: string;
  plan: SubscriptionPlan;
  billingCycle?: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
}

export class SubscriptionService {
  /**
   * Créer ou remplacer un abonnement utilisateur
   */
  async create(input: CreateSubscriptionInput): Promise<{
    subscription: Subscription;
    invoice: invoice;
  }> {
    const user = await prisma.user.findUnique({ where: { id: input.userId } });
    if (!user) throw new Error('Utilisateur introuvable');

    const billingCycle = input.billingCycle ?? 'MONTHLY';
    const basePrice = PLAN_PRICES[input.plan];
    let invoiceAmount = basePrice;

    if (billingCycle === 'QUARTERLY') {
      invoiceAmount = Math.round(basePrice * 3 * 0.95); // 5% réduction
    } else if (billingCycle === 'YEARLY') {
      invoiceAmount = Math.round(basePrice * 12 * 0.85); // 15% réduction
    }

    const now = new Date();
    let endDate: Date | undefined;

    if (billingCycle === 'MONTHLY') {
      endDate = new Date(new Date(now).setMonth(now.getMonth() + 1));
    } else if (billingCycle === 'QUARTERLY') {
      endDate = new Date(new Date(now).setMonth(now.getMonth() + 3));
    } else if (billingCycle === 'YEARLY') {
      endDate = new Date(new Date(now).setFullYear(now.getFullYear() + 1));
    }

    // Upsert l'abonnement (un seul par userId)
    const subscription = await prisma.subscription.upsert({
      where: { userId: input.userId },
      create: {
        userId: input.userId,
        plan: input.plan,
        status: 'ACTIVE',
        startDate: now,
        endDate,
      },
      update: {
        plan: input.plan,
        status: 'ACTIVE',
        startDate: now,
        endDate,
      },
      include: { user: true },
    });

    // Générer une facture
    const invoiceNumber = `INV-${Date.now()}-${subscription.id.slice(0, 8)}`;
    const createdInvoice = await prisma.invoice.create({
      data: {
        userId: input.userId,
        number: invoiceNumber,
        amount: invoiceAmount,
        currency: 'EUR',
        status: 'PENDING',
        issuedAt: now,
      },
    });

    return { subscription, invoice: createdInvoice };
  }

  async findById(id: string): Promise<Subscription | null> {
    return prisma.subscription.findUnique({
      where: { id },
      include: { user: true },
    });
  }

  async getByUser(userId: string): Promise<Subscription | null> {
    return prisma.subscription.findUnique({
      where: { userId },
      include: { user: true },
    });
  }

  async cancel(id: string): Promise<Subscription> {
    return prisma.subscription.update({
      where: { id },
      data: { status: 'CANCELED' },
      include: { user: true },
    });
  }

  async suspend(id: string): Promise<Subscription> {
    return prisma.subscription.update({
      where: { id },
      data: { status: 'INACTIVE' },
      include: { user: true },
    });
  }

  async getInvoice(id: string): Promise<invoice | null> {
    return prisma.invoice.findUnique({
      where: { id },
    });
  }

  async getInvoicesByUser(userId: string): Promise<invoice[]> {
    return prisma.invoice.findMany({
      where: { userId },
      orderBy: { issuedAt: 'desc' },
    });
  }

  async markInvoicePaid(invoiceId: string): Promise<invoice> {
    return prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: 'PAID',
        paidAt: new Date(),
      },
    });
  }

  async getStatistics(): Promise<{
    totalSubscriptions: number;
    byPlan: Record<SubscriptionPlan, number>;
    byStatus: Record<SubscriptionStatus, number>;
    totalRevenue: number;
  }> {
    const [total, free, basic, premium, institution, active, inactive, canceled, expired, revenue] =
      await Promise.all([
        prisma.subscription.count(),
        prisma.subscription.count({ where: { plan: 'FREE' } }),
        prisma.subscription.count({ where: { plan: 'BASIC' } }),
        prisma.subscription.count({ where: { plan: 'PREMIUM' } }),
        prisma.subscription.count({ where: { plan: 'INSTITUTION' } }),
        prisma.subscription.count({ where: { status: 'ACTIVE' } }),
        prisma.subscription.count({ where: { status: 'INACTIVE' } }),
        prisma.subscription.count({ where: { status: 'CANCELED' } }),
        prisma.subscription.count({ where: { status: 'EXPIRED' } }),
        prisma.invoice.aggregate({
          where: { status: 'PAID' },
          _sum: { amount: true },
        }),
      ]);

    return {
      totalSubscriptions: total,
      byPlan: { FREE: free, BASIC: basic, PREMIUM: premium, INSTITUTION: institution },
      byStatus: { ACTIVE: active, INACTIVE: inactive, CANCELED: canceled, EXPIRED: expired },
      totalRevenue: revenue._sum.amount ?? 0,
    };
  }
}

export default new SubscriptionService();
