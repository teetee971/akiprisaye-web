/**
 * Subscription API Routes
 * Endpoints for subscription management via SumUp
 */

import express, { Request, Response } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import subscriptionService from '../../services/subscription/subscriptionService.js';
import sumupWebhookHandler from '../../services/payment/sumupWebhookHandler.js';
import { SubscriptionTier } from '../../types/subscription.js';
import { getAllSubscriptionPlans } from '../../config/subscriptionPlans.js';
const router = express.Router();

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
 * Requires authentication - uses authenticated user ID
 */
router.post('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return void res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    const { planId, paymentMethodId, interval, affiliateSource } = req.body;

    if (!planId || !interval) {
      return void res.status(400).json({
        success: false,
        error: 'Missing required fields: planId, interval',
      });
    }

    // Normalize interval to 'monthly' | 'yearly'
    const normalizedInterval: 'monthly' | 'yearly' =
      interval === 'yearly' || interval === 'year' ? 'yearly' : 'monthly';

    const result = await subscriptionService.createSubscription({
      userId,
      planId: planId as SubscriptionTier,
      paymentMethodId: paymentMethodId || null,
      interval: normalizedInterval,
      affiliateSource: affiliateSource || undefined,
    });

    // Track affiliate conversion if an affiliate key was provided
    if (affiliateSource && result.subscription.id) {
      const plan = (await import('../../config/subscriptionPlans.js')).getSubscriptionPlan(
        planId as SubscriptionTier
      );
      const revenue =
        normalizedInterval === 'yearly'
          ? (plan?.pricing.yearly ?? 0)
          : (plan?.pricing.monthly ?? 0);

      await subscriptionService.trackAffiliateConversion({
        affiliateKey: affiliateSource,
        userId,
        plan: planId,
        revenue,
      });
    }

    res.json({
      success: true,
      subscription: result.subscription,
      // checkoutId is present for paid plans — frontend mounts SumUp widget with this
      ...(result.checkoutId ? { checkoutId: result.checkoutId } : {}),
    });
  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create subscription',
    });
  }
});

/**
 * GET /api/subscriptions/me
 * Get active subscription for the authenticated user
 */
router.get('/me', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return void res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    const subscription = await subscriptionService.getActiveSubscription(userId);

    if (!subscription) {
      return void res.json({
        success: true,
        subscription: null,
        message: 'No active subscription found',
      });
    }

    res.json({ success: true, subscription });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch subscription',
    });
  }
});

/**
 * POST /api/subscriptions/cancel
 * Cancel the authenticated user's active subscription
 */
router.post('/cancel', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return void res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    await subscriptionService.cancelSubscription(userId);

    res.json({ success: true, message: 'Subscription canceled successfully' });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to cancel subscription',
    });
  }
});

/**
 * POST /api/subscriptions/check-feature
 * Check if authenticated user has access to a feature
 */
router.post('/check-feature', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return void res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    const { feature } = req.body;

    if (!feature) {
      return void res.status(400).json({
        success: false,
        error: 'Feature name is required',
      });
    }

    const hasAccess = await subscriptionService.checkFeatureAccess(userId, feature);

    res.json({ success: true, hasAccess, feature });
  } catch (error) {
    console.error('Error checking feature access:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check feature access',
    });
  }
});

/**
 * POST /api/subscriptions/webhook
 * SumUp webhook endpoint
 * Must receive raw body for signature verification
 */
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  async (req: Request, res: Response): Promise<void> => {
    const signature = req.headers['x-webhook-signature'] as string | undefined;
    const webhookSecretConfigured = Boolean(process.env.SUMUP_WEBHOOK_SECRET);

    // If a webhook secret is configured, require and verify the signature
    if (webhookSecretConfigured) {
      if (!signature) {
        return void res.status(400).send('Missing webhook signature');
      }
      const valid = sumupWebhookHandler.verifySignature(req.body as Buffer, signature);
      if (!valid) {
        return void res.status(400).send('Invalid webhook signature');
      }
    }

    try {
      const event = JSON.parse((req.body as Buffer).toString('utf-8'));
      await sumupWebhookHandler.handleWebhook(event);
      res.json({ received: true });
    } catch (error) {
      console.error('Webhook error:', error);
      res
        .status(400)
        .send(`Webhook Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
);

export default router;
