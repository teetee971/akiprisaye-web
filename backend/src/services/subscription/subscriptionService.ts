/**
 * Subscription Service
 * Handles subscription lifecycle with SumUp integration
 */

import { PrismaClient, SubscriptionPlan } from '@prisma/client';
import {
  SubscriptionTier,
  type Subscription,
  type CreateSubscriptionParams,
} from '../../types/subscription.js';
import { getSubscriptionPlan, getPlanPrice } from '../../config/subscriptionPlans.js';
import sumupService from '../payment/sumupService.js';

const prisma = new PrismaClient();

export class SubscriptionService {
  async createSubscription(params: CreateSubscriptionParams): Promise<Subscription> {
    const { userId, planId, paymentMethodId, interval } = params;

    const plan = getSubscriptionPlan(planId);
    if (!plan) throw new Error(`Plan not found: ${planId}`);

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    if (planId === SubscriptionTier.FREE) {
      return this.createFreeSubscription(userId);
    }

    return this.createPaidSubscription(user, plan, paymentMethodId, interval);
  }

  private async createFreeSubscription(userId: string): Promise<Subscription> {
    const sub = await prisma.subscription.upsert({
      where: { userId },
      update: {
        plan: 'FREE',
        status: 'ACTIVE',
        startDate: new Date(),
        endDate: null,
      },
      create: {
        userId,
        plan: 'FREE',
        status: 'ACTIVE',
        startDate: new Date(),
      },
    });

    return this.mapSubscription(sub, SubscriptionTier.FREE);
  }

  private async createPaidSubscription(
    user: { id: string; email: string; name?: string | null },
    plan: NonNullable<ReturnType<typeof getSubscriptionPlan>>,
    _paymentMethodId: string | null,
    interval: string
  ): Promise<Subscription> {
    const billingCycle: 'monthly' | 'yearly' = interval === 'yearly' ? 'yearly' : 'monthly';

    // Create or retrieve SumUp customer
    const sumupCustomer = await sumupService.createCustomer({
      email: user.email,
      name: user.name || undefined,
      userId: user.id,
    });

    const amount = getPlanPrice(plan.id, billingCycle === 'yearly' ? 'year' : 'month');
    // Create recurring SumUp subscription
    const sumupSub = await sumupService.createSubscription({
      customerId: sumupCustomer.customer_id,
      planKey: plan.pricing.sumupPlanKey,
      amount,
      currency: 'EUR',
      interval: billingCycle,
      description: `A KI PRI SA YÉ – ${plan.name} (${billingCycle === 'yearly' ? 'annuel' : 'mensuel'})`,
    });

    // Calculate period dates
    const startDate = new Date();
    const endDate = new Date(startDate);
    if (billingCycle === 'yearly') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    const nextRenewalDate = new Date(endDate);

    const sub = await prisma.subscription.upsert({
      where: { userId: user.id },
      update: {
        plan: this.mapTierToPlan(plan.id),
        status: 'ACTIVE',
        startDate,
        endDate,
        sumupCustomerId: sumupCustomer.customer_id,
        sumupSubscriptionId: sumupSub.id,
        billingCycle,
        nextRenewalDate,
        externalRef: sumupCustomer.customer_id,
      },
      create: {
        userId: user.id,
        plan: this.mapTierToPlan(plan.id),
        status: 'ACTIVE',
        startDate,
        endDate,
        sumupCustomerId: sumupCustomer.customer_id,
        sumupSubscriptionId: sumupSub.id,
        billingCycle,
        nextRenewalDate,
        externalRef: sumupCustomer.customer_id,
      },
    });

    return this.mapSubscription(sub, plan.id, billingCycle);
  }

  async cancelSubscription(userId: string): Promise<void> {
    const sub = await prisma.subscription.findUnique({ where: { userId } });
    if (!sub) throw new Error('Subscription not found');

    if (sub.sumupSubscriptionId) {
      await sumupService.cancelSubscription(sub.sumupSubscriptionId);
    }

    await prisma.subscription.update({
      where: { id: sub.id },
      data: { status: 'CANCELED' },
    });
  }

  async getActiveSubscription(userId: string): Promise<Subscription | null> {
    const sub = await prisma.subscription.findFirst({
      where: { userId, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
    });
    if (!sub) return null;

    const tier = this.mapPlanToTier(sub.plan);
    const billingCycle =
      sub.billingCycle === 'yearly' || sub.billingCycle === 'monthly'
        ? (sub.billingCycle as 'monthly' | 'yearly')
        : undefined;
    return this.mapSubscription(sub, tier, billingCycle);
  }

  async checkFeatureAccess(userId: string, feature: string): Promise<boolean> {
    const sub = await this.getActiveSubscription(userId);
    const planId = sub?.planId || SubscriptionTier.FREE;
    const plan = getSubscriptionPlan(planId);
    if (!plan) return false;

    const featureValue = (plan.features as Record<string, unknown>)[feature];
    if (typeof featureValue === 'boolean') return featureValue;
    if (typeof featureValue === 'number') return featureValue !== 0;
    if (Array.isArray(featureValue)) return featureValue.length > 0;
    return false;
  }

  /**
   * Track an affiliate conversion in the database
   */
  async trackAffiliateConversion(params: {
    affiliateKey: string;
    userId: string;
    plan: string;
    revenue: number;
  }): Promise<void> {
    await prisma.affiliateTracking.create({
      data: {
        affiliateKey: params.affiliateKey,
        userId: params.userId,
        plan: params.plan,
        revenue: params.revenue,
        status: 'pending',
        conversionDate: new Date(),
      },
    });
  }

  private mapTierToPlan(tier: SubscriptionTier): SubscriptionPlan {
    const mapping: Record<string, SubscriptionPlan> = {
      [SubscriptionTier.FREE]: 'FREE',
      [SubscriptionTier.CITIZEN_PREMIUM]: 'PREMIUM',
      [SubscriptionTier.SME_FREEMIUM]: 'PREMIUM',
      [SubscriptionTier.BUSINESS_PRO]: 'PREMIUM',
      [SubscriptionTier.INSTITUTIONAL]: 'INSTITUTION',
      [SubscriptionTier.RESEARCH]: 'INSTITUTION',
    };
    return mapping[tier] ?? 'FREE';
  }

  private mapPlanToTier(plan: SubscriptionPlan): SubscriptionTier {
    const mapping: Partial<Record<SubscriptionPlan, SubscriptionTier>> = {
      FREE: SubscriptionTier.FREE,
      BASIC: SubscriptionTier.FREE,
      PREMIUM: SubscriptionTier.CITIZEN_PREMIUM,
      INSTITUTION: SubscriptionTier.INSTITUTIONAL,
    };
    return mapping[plan] ?? SubscriptionTier.FREE;
  }

  private mapSubscription(
    sub: {
      id: string;
      userId: string;
      status: string;
      startDate: Date;
      endDate?: Date | null;
      sumupSubscriptionId?: string | null;
      sumupCustomerId?: string | null;
      sumupPaymentId?: string | null;
      nextRenewalDate?: Date | null;
      affiliateSource?: string | null;
      createdAt: Date;
      updatedAt: Date;
    },
    actualTier: SubscriptionTier,
    billingCycle?: 'monthly' | 'yearly'
  ): Subscription {
    return {
      id: sub.id,
      userId: sub.userId,
      planId: actualTier,
      status: sub.status.toLowerCase() as Subscription['status'],
      currentPeriodStart: sub.startDate,
      currentPeriodEnd: sub.endDate || new Date('2099-12-31'),
      cancelAtPeriodEnd: false,
      sumupSubscriptionId: sub.sumupSubscriptionId ?? undefined,
      sumupCustomerId: sub.sumupCustomerId ?? undefined,
      sumupPaymentId: sub.sumupPaymentId ?? undefined,
      billingCycle,
      nextRenewalDate: sub.nextRenewalDate ?? undefined,
      affiliateSource: sub.affiliateSource ?? undefined,
      createdAt: sub.createdAt,
      updatedAt: sub.updatedAt,
    };
  }
}

export default new SubscriptionService();
