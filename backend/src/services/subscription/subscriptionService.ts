/**
 * Subscription Service - Minimal Implementation
 * Handles subscription lifecycle with Stripe integration
 */

import Stripe from 'stripe';
import { PrismaClient, SubscriptionPlan } from '@prisma/client';
import {
  SubscriptionTier,
  type Subscription,
  type CreateSubscriptionParams
} from '../../types/subscription.js';
import { getSubscriptionPlan } from '../../config/subscriptionPlans.js';

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16'
});

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
    const sub = await prisma.subscription.create({
      data: {
        userId,
        plan: 'FREE',
        status: 'ACTIVE',
        startDate: new Date(),
      }
    });
    
    return this.mapSubscription(sub, SubscriptionTier.FREE);
  }
  
  private async createPaidSubscription(user: { id: string; email: string; name?: string | null }, plan: ReturnType<typeof getSubscriptionPlan>, paymentMethodId: string | null, _interval: string): Promise<Subscription> {
    if (!plan) throw new Error('Plan is required');

    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name || undefined,
      metadata: { userId: user.id }
    });
    const customerId = customer.id;
    
    if (paymentMethodId) {
      await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId });
      await stripe.customers.update(customerId, {
        invoice_settings: { default_payment_method: paymentMethodId }
      });
    }
    
    const priceId = (plan.pricing as { stripePriceId?: string }).stripePriceId;
    const stripeSub = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      metadata: { 
        userId: user.id, 
        planId: plan.id,
        actualTier: plan.id
      },
      trial_period_days: plan.id === SubscriptionTier.CITIZEN_PREMIUM ? 14 : 0
    });
    
    const sub = await prisma.subscription.create({
      data: {
        userId: user.id,
        plan: this.mapTierToPlan(plan.id),
        status: 'ACTIVE',
        startDate: new Date(stripeSub.current_period_start * 1000),
        endDate: stripeSub.current_period_end ? new Date(stripeSub.current_period_end * 1000) : null,
        externalRef: customerId,
      }
    });
    
    return this.mapSubscription(sub, plan.id);
  }
  
  async getActiveSubscription(userId: string): Promise<Subscription | null> {
    const sub = await prisma.subscription.findFirst({
      where: { userId, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' }
    });
    if (!sub) return null;
    
    // Determine tier from database plan
    const tier = this.mapPlanToTier(sub.plan);
    return this.mapSubscription(sub, tier);
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
   * Helper: Map SubscriptionTier to Prisma SubscriptionPlan enum
   */
  private mapTierToPlan(tier: SubscriptionTier): SubscriptionPlan {
    const mapping: Record<string, SubscriptionPlan> = {
      [SubscriptionTier.FREE]: 'FREE',
      [SubscriptionTier.CITIZEN_PREMIUM]: 'PREMIUM',
      [SubscriptionTier.SME_FREEMIUM]: 'PREMIUM',
      [SubscriptionTier.BUSINESS_PRO]: 'PREMIUM',
      [SubscriptionTier.INSTITUTIONAL]: 'INSTITUTION',
    };
    return mapping[tier] ?? 'FREE';
  }
  
  /**
   * Helper: Map Prisma SubscriptionPlan to SubscriptionTier
   */
  private mapPlanToTier(plan: SubscriptionPlan): SubscriptionTier {
    const mapping: Partial<Record<SubscriptionPlan, SubscriptionTier>> = {
      'FREE': SubscriptionTier.FREE,
      'BASIC': SubscriptionTier.FREE,
      'PREMIUM': SubscriptionTier.CITIZEN_PREMIUM,
      'INSTITUTION': SubscriptionTier.INSTITUTIONAL,
    };
    return mapping[plan] ?? SubscriptionTier.FREE;
  }
  
  /**
   * Helper: Map Prisma subscription to our Subscription type
   */
  private mapSubscription(sub: { id: string; userId: string; status: string; startDate: Date; endDate?: Date | null; createdAt: Date; updatedAt: Date }, actualTier: SubscriptionTier): Subscription {
    return {
      id: sub.id,
      userId: sub.userId,
      planId: actualTier,
      status: sub.status.toLowerCase() as Subscription['status'],
      currentPeriodStart: sub.startDate,
      currentPeriodEnd: sub.endDate || new Date('2099-12-31'),
      cancelAtPeriodEnd: false,
      createdAt: sub.createdAt,
      updatedAt: sub.updatedAt
    };
  }
}

export default new SubscriptionService();
