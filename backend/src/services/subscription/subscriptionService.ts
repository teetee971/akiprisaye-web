/**
 * Subscription Service
 * Handles subscription lifecycle with SumUp integration
 *
 * Flow for paid plans:
 * 1. Create SumUp customer
 * 2. Create SumUp checkout (returns checkoutId for frontend widget)
 * 3. Persist subscription in DB with INACTIVE status + sumupPaymentId = checkout reference
 * 4. Return { subscription, checkoutId } to caller
 * 5. On payment.succeeded webhook → activate subscription
 */

import { PrismaClient, SubscriptionPlan } from '@prisma/client';
import {
  SubscriptionTier,
  type Subscription,
  type CreateSubscriptionParams,
  type CreateSubscriptionResult,
} from '../../types/subscription.js';
import { getSubscriptionPlan, getPlanPrice } from '../../config/subscriptionPlans.js';
import sumupService from '../payment/sumupService.js';

const prisma = new PrismaClient();

export class SubscriptionService {
  async createSubscription(params: CreateSubscriptionParams): Promise<CreateSubscriptionResult> {
    const { userId, planId, paymentMethodId, interval, affiliateSource } = params;

    const plan = getSubscriptionPlan(planId);
    if (!plan) throw new Error(`Plan not found: ${planId}`);

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    if (planId === SubscriptionTier.FREE) {
      return { subscription: await this.createFreeSubscription(userId, affiliateSource) };
    }

    return this.createPaidSubscription(user, plan, paymentMethodId, interval, affiliateSource);
  }

  private async createFreeSubscription(
    userId: string,
    affiliateSource?: string
  ): Promise<Subscription> {
    const sub = await prisma.subscription.upsert({
      where: { userId },
      update: {
        plan: 'FREE',
        status: 'ACTIVE',
        startDate: new Date(),
        endDate: null,
        tierLabel: SubscriptionTier.FREE,
        affiliateSource: affiliateSource ?? null,
      },
      create: {
        userId,
        plan: 'FREE',
        status: 'ACTIVE',
        startDate: new Date(),
        tierLabel: SubscriptionTier.FREE,
        affiliateSource: affiliateSource ?? null,
      },
    });

    return this.mapSubscription(sub, SubscriptionTier.FREE);
  }

  private async createPaidSubscription(
    user: { id: string; email: string; name?: string | null },
    plan: NonNullable<ReturnType<typeof getSubscriptionPlan>>,
    _paymentMethodId: string | null,
    interval: string,
    affiliateSource?: string
  ): Promise<CreateSubscriptionResult> {
    const billingCycle: 'monthly' | 'yearly' = interval === 'yearly' ? 'yearly' : 'monthly';

    // Create or retrieve SumUp customer
    const sumupCustomer = await sumupService.createCustomer({
      email: user.email,
      name: user.name || undefined,
      userId: user.id,
    });

    const amount = getPlanPrice(plan.id, billingCycle === 'yearly' ? 'year' : 'month');

    // Generate a unique checkout reference to correlate the webhook event
    const checkoutRef = sumupService.generateCheckoutReference(user.id, plan.pricing.sumupPlanKey);

    // Create a SumUp checkout (the frontend widget needs this to capture the card)
    const checkout = await sumupService.createCheckout({
      amount,
      currency: 'EUR',
      description: `A KI PRI SA YÉ – ${plan.name} (${billingCycle === 'yearly' ? 'annuel' : 'mensuel'})`,
      checkoutReference: checkoutRef,
      customerId: sumupCustomer.customer_id,
      affiliateKey: affiliateSource
        ? (process.env.SUMUP_AFFILIATE_KEY ?? undefined)
        : undefined,
    });

    // Calculate expected period dates
    const startDate = new Date();
    const endDate = new Date(startDate);
    if (billingCycle === 'yearly') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    // Persist subscription as INACTIVE — activated by payment.succeeded webhook
    const sub = await prisma.subscription.upsert({
      where: { userId: user.id },
      update: {
        plan: this.mapTierToPrismaEnum(plan.id),
        status: 'INACTIVE',
        startDate,
        endDate,
        sumupCustomerId: sumupCustomer.customer_id,
        sumupPaymentId: checkoutRef,       // Used by webhook to correlate
        billingCycle,
        nextRenewalDate: new Date(endDate),
        tierLabel: plan.id,                // Exact tier — prevents information loss
        affiliateSource: affiliateSource ?? null,
        externalRef: sumupCustomer.customer_id,
      },
      create: {
        userId: user.id,
        plan: this.mapTierToPrismaEnum(plan.id),
        status: 'INACTIVE',
        startDate,
        endDate,
        sumupCustomerId: sumupCustomer.customer_id,
        sumupPaymentId: checkoutRef,
        billingCycle,
        nextRenewalDate: new Date(endDate),
        tierLabel: plan.id,
        affiliateSource: affiliateSource ?? null,
        externalRef: sumupCustomer.customer_id,
      },
    });

    return {
      subscription: this.mapSubscription(sub, plan.id, billingCycle),
      checkoutId: checkout.id,
    };
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

    // Prefer tierLabel (exact tier) over the mapped enum
    const tier = sub.tierLabel
      ? (sub.tierLabel as SubscriptionTier)
      : this.mapPrismaEnumToTier(sub.plan);

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

  /**
   * Maps SubscriptionTier to the Prisma SubscriptionPlan enum.
   * NOTE: Multiple tiers map to PREMIUM — always use tierLabel for the exact tier.
   */
  private mapTierToPrismaEnum(tier: SubscriptionTier): SubscriptionPlan {
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

  /**
   * Maps Prisma SubscriptionPlan enum back to SubscriptionTier.
   * Falls back to the lowest tier in each group — use tierLabel when possible.
   */
  private mapPrismaEnumToTier(plan: SubscriptionPlan): SubscriptionTier {
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
      tierLabel?: string | null;
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
