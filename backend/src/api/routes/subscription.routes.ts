/**
 * Subscription API Routes
 * Endpoints for subscription management
 */

import express, { Request, Response, NextFunction } from 'express';
import Stripe from 'stripe';
import subscriptionService from '../../services/subscription/subscriptionService.js';
import stripeWebhookHandler from '../../services/payment/stripeWebhookHandler.js';
import { SubscriptionTier } from '../../types/subscription.js';
import { getAllSubscriptionPlans } from '../../config/subscriptionPlans.js';

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia'
});

/**
 * GET /api/subscriptions/plans
 * Get all available subscription plans
 */
router.get('/plans', (_req: Request, res: Response) => {
  try {
    const plans = getAllSubscriptionPlans();
    res.json({ success: true, plans });
  } catch (error) {
    console.error('Error fetching plans:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch plans' });
  }
});

/**
 * POST /api/subscriptions
 * Create a new subscription
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { userId, planId, paymentMethodId, interval } = req.body;
    
    if (!userId || !planId || !interval) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: userId, planId, interval'
      });
    }
    
    const subscription = await subscriptionService.createSubscription({
      userId,
      planId: planId as SubscriptionTier,
      paymentMethodId: paymentMethodId || null,
      interval
    });
    
    res.json({ success: true, subscription });
  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create subscription'
    });
  }
});

/**
 * GET /api/subscriptions/:userId
 * Get active subscription for a user
 */
router.get('/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const subscription = await subscriptionService.getActiveSubscription(userId);
    
    if (!subscription) {
      return res.json({
        success: true,
        subscription: null,
        message: 'No active subscription found'
      });
    }
    
    res.json({ success: true, subscription });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch subscription'
    });
  }
});

/**
 * POST /api/subscriptions/:userId/check-feature
 * Check if user has access to a feature
 */
router.post('/:userId/check-feature', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { feature } = req.body;
    
    if (!feature) {
      return res.status(400).json({
        success: false,
        error: 'Feature name is required'
      });
    }
    
    const hasAccess = await subscriptionService.checkFeatureAccess(userId, feature);
    
    res.json({ success: true, hasAccess, feature });
  } catch (error) {
    console.error('Error checking feature access:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check feature access'
    });
  }
});

/**
 * POST /api/subscriptions/webhook
 * Stripe webhook endpoint
 */
router.post('/webhook', express.raw({ type: 'application/json' }), async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'];
  
  if (!sig) {
    return res.status(400).send('Missing stripe-signature header');
  }
  
  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );
    
    await stripeWebhookHandler.handleWebhook(event);
    
    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).send(`Webhook Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
});

export default router;
