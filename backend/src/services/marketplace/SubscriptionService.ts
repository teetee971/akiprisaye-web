/**
 * Service de gestion des abonnements et facturation - Sprint 4
 *
 * Gestion monétisation B2B de la plateforme
 *
 * RÈGLES:
 * - Abonnement obligatoire pour publier produits/prix
 * - Facturation automatique selon billingCycle
 * - Suspension automatique en cas de non-paiement
 */

import { PrismaClient, Subscription, Invoice, SubscriptionPlan, SubscriptionStatus } from '@prisma/client';

const prisma = new PrismaClient();

// Prix des plans (en centimes/mois)
const PLAN_PRICES: Record<SubscriptionPlan, number> = {
  BASIC: 9900, // 99€
  PRO: 29900, // 299€
  INSTITUTION: 99900, // 999€
};

export interface CreateSubscriptionInput {
  brandId: string;
  plan: SubscriptionPlan;
  billingCycle: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
}

export class SubscriptionService {
  /**
   * Créer un nouvel abonnement
   *
   * @param input - Données de l'abonnement
   * @returns Abonnement créé + première facture
   */
  async create(input: CreateSubscriptionInput): Promise<{
    subscription: Subscription;
    invoice: Invoice;
  }> {
    const brand = await prisma.brand.findUnique({ where: { id: input.brandId } });
    if (!brand) throw new Error('Enseigne introuvable');

    const basePrice = PLAN_PRICES[input.plan];
    let price = basePrice;
    let invoiceAmount = basePrice;

    // Réductions selon billing cycle
    if (input.billingCycle === 'QUARTERLY') {
      price = basePrice * 3;
      invoiceAmount = Math.round(price * 0.95); // 5% de réduction
    } else if (input.billingCycle === 'YEARLY') {
      price = basePrice * 12;
      invoiceAmount = Math.round(price * 0.85); // 15% de réduction
    }

    const now = new Date();
    const startedAt = now;
    let endsAt: Date | undefined;

    if (input.billingCycle === 'MONTHLY') {
      endsAt = new Date(now.setMonth(now.getMonth() + 1));
    } else if (input.billingCycle === 'QUARTERLY') {
      endsAt = new Date(now.setMonth(now.getMonth() + 3));
    } else if (input.billingCycle === 'YEARLY') {
      endsAt = new Date(now.setFullYear(now.getFullYear() + 1));
    }

    // Créer l'abonnement
    const subscription = await prisma.subscription.create({
      data: {
        brandId: input.brandId,
        plan: input.plan,
        price,
        billingCycle: input.billingCycle,
        status: 'ACTIVE',
        startedAt,
        endsAt,
      },
      include: { brand: true },
    });

    // Générer la première facture
    const invoiceNumber = `INV-${Date.now()}-${subscription.id.slice(0, 8)}`;
    const invoice = await prisma.invoice.create({
      data: {
        subscriptionId: subscription.id,
        amount: invoiceAmount,
        currency: 'EUR',
        status: 'PENDING',
        invoiceNumber,
        issuedAt: new Date(),
        dueAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 jours
      },
      include: { subscription: true },
    });

    // Mettre à jour le plan de la brand
    await prisma.brand.update({
      where: { id: input.brandId },
      data: { subscriptionPlan: input.plan },
    });

    return { subscription, invoice };
  }

  async findById(id: string): Promise<Subscription | null> {
    return prisma.subscription.findUnique({
      where: { id },
      include: { brand: true, invoices: true },
    });
  }

  async getByBrand(brandId: string): Promise<Subscription[]> {
    return prisma.subscription.findMany({
      where: { brandId },
      include: { invoices: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async cancel(id: string): Promise<Subscription> {
    return prisma.subscription.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: { brand: true },
    });
  }

  async suspend(id: string): Promise<Subscription> {
    return prisma.subscription.update({
      where: { id },
      data: { status: 'SUSPENDED' },
      include: { brand: true },
    });
  }

  async getInvoice(id: string): Promise<Invoice | null> {
    return prisma.invoice.findUnique({
      where: { id },
      include: { subscription: { include: { brand: true } } },
    });
  }

  async getInvoicesBySubscription(subscriptionId: string): Promise<Invoice[]> {
    return prisma.invoice.findMany({
      where: { subscriptionId },
      orderBy: { issuedAt: 'desc' },
    });
  }

  async markInvoicePaid(invoiceId: string): Promise<Invoice> {
    return prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: 'PAID',
        paidAt: new Date(),
      },
      include: { subscription: true },
    });
  }

  async getStatistics(): Promise<{
    totalSubscriptions: number;
    byPlan: Record<SubscriptionPlan, number>;
    byStatus: Record<SubscriptionStatus, number>;
    totalRevenue: number;
  }> {
    const [total, basic, pro, institution, active, cancelled, suspended, expired, revenue] = await Promise.all([
      prisma.subscription.count(),
      prisma.subscription.count({ where: { plan: 'BASIC' } }),
      prisma.subscription.count({ where: { plan: 'PRO' } }),
      prisma.subscription.count({ where: { plan: 'INSTITUTION' } }),
      prisma.subscription.count({ where: { status: 'ACTIVE' } }),
      prisma.subscription.count({ where: { status: 'CANCELLED' } }),
      prisma.subscription.count({ where: { status: 'SUSPENDED' } }),
      prisma.subscription.count({ where: { status: 'EXPIRED' } }),
      prisma.invoice.aggregate({
        where: { status: 'PAID' },
        _sum: { amount: true },
      }),
    ]);

    return {
      totalSubscriptions: total,
      byPlan: { BASIC: basic, PRO: pro, INSTITUTION: institution },
      byStatus: { ACTIVE: active, CANCELLED: cancelled, SUSPENDED: suspended, EXPIRED: expired },
      totalRevenue: revenue._sum.amount || 0,
    };
  }
}

export default new SubscriptionService();
