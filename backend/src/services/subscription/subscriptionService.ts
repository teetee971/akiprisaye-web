/**
 * Subscription Service - Minimal Implementation
 * Handles subscription lifecycle with Stripe integration
 */

import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';
import {
  SubscriptionTier,
  type Subscription,
  type CreateSubscriptionParams
} from '../../types/subscription.js';
import { SUBSCRIPTION_PLANS, getSubscriptionPlan, getPlanPrice } from '../../config/subscriptionPlans.js';

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia'
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
        brandId: userId,
        plan: 'BASIC',
        price: 0,
        billingCycle: 'monthly',
        status: 'ACTIVE',
        startedAt: new Date(),
        endsAt: null,
      }
    });
    
    return this.mapSubscription(sub, SubscriptionTier.FREE);
  }
  
  private async createPaidSubscription(user: any, plan: any, paymentMethodId: string | null, interval: string): Promise<Subscription> {
    let customerId = user.stripeCustomerId;
    
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name || undefined,
        metadata: { userId: user.id }
      });
      customerId = customer.id;
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId }
      });
    }
    
    if (paymentMethodId) {
      await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId });
      await stripe.customers.update(customerId, {
        invoice_settings: { default_payment_method: paymentMethodId }
      });
    }
    
    const priceId = plan.pricing.stripePriceId;
    const stripeSub = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      metadata: { 
        userId: user.id, 
        planId: plan.id,
        actualTier: plan.id // Store the actual tier in metadata
      },
      trial_period_days: plan.id === SubscriptionTier.CITIZEN_PREMIUM ? 14 : 0
    });
    
    const sub = await prisma.subscription.create({
      data: {
        brandId: user.id,
        plan: this.mapTierToPlan(plan.id),
        price: getPlanPrice(plan.id, interval as 'month' | 'year') * 100,
        billingCycle: interval === 'year' ? 'yearly' : 'monthly',
        status: 'ACTIVE',
        startedAt: new Date(stripeSub.current_period_start * 1000),
        endsAt: stripeSub.current_period_end ? new Date(stripeSub.current_period_end * 1000) : null,
      }
    });
    
    return this.mapSubscription(sub, plan.id);
  }
  
  async getActiveSubscription(userId: string): Promise<Subscription | null> {
    const sub = await prisma.subscription.findFirst({
      where: { brandId: userId, status: 'ACTIVE' },
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
    
    const featureValue = (plan.features as any)[feature];
    if (typeof featureValue === 'boolean') return featureValue;
    if (typeof featureValue === 'number') return featureValue !== 0;
    if (Array.isArray(featureValue)) return featureValue.length > 0;
    return false;
  }
  
  /**
   * Helper: Map Prisma SubscriptionPlan to SubscriptionTier
   * This maps the database enum to our new tier system
   */
  private mapPlanToTier(plan: any): SubscriptionTier {
    // For basic mapping - in production, we'll need a more sophisticated approach
    // such as storing the actual tier in subscription metadata
    const priceBasedMapping: Record<string, SubscriptionTier> = {
      'BASIC': SubscriptionTier.FREE,
      'PRO': SubscriptionTier.CITIZEN_PREMIUM, // Default PRO to CITIZEN_PREMIUM
      'INSTITUTION': SubscriptionTier.INSTITUTIONAL
    };
    return priceBasedMapping[plan] || SubscriptionTier.FREE;
  }
  
  /**
   * Helper: Map Prisma subscription to our Subscription type
   * @param sub - Prisma subscription object
   * @param actualTier - The actual subscription tier (passed from context)
   */
  private mapSubscription(sub: any, actualTier: SubscriptionTier): Subscription {
    return {
      id: sub.id,
      userId: sub.brandId,
      planId: actualTier,
      status: sub.status.toLowerCase() as any,
      currentPeriodStart: sub.startedAt,
      currentPeriodEnd: sub.endsAt || new Date('2099-12-31'),
      cancelAtPeriodEnd: false,
      createdAt: sub.createdAt,
      updatedAt: sub.updatedAt
    };
  }
}

export default new SubscriptionService();
