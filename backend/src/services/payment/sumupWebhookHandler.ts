/**
 * SumUp Webhook Handler
 * Handles SumUp payment events for subscription management
 * Docs: https://developer.sumup.com/webhooks
 */

import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import type { SumUpWebhookEvent, SumUpWebhookEventType } from '../../types/subscription.js';

const prisma = new PrismaClient();

export class SumUpWebhookHandler {
  /**
   * Verify webhook signature from SumUp
   * SumUp sends an HMAC-SHA256 signature in the x-webhook-signature header
   */
  verifySignature(payload: Buffer, signature: string): boolean {
    const secret = process.env.SUMUP_WEBHOOK_SECRET || '';
    if (!secret) {
      console.warn('SUMUP_WEBHOOK_SECRET not configured — skipping signature verification');
      return true;
    }
    const expected = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(signature, 'hex'));
  }

  /**
   * Main dispatcher: parse and route webhook event
   */
  async handleWebhook(event: SumUpWebhookEvent): Promise<void> {
    console.log(`SumUp webhook received: ${event.event_type} (${event.id})`);

    switch (event.event_type as SumUpWebhookEventType) {
      case 'payment.succeeded':
        await this.handlePaymentSucceeded(event);
        break;

      case 'payment.failed':
        await this.handlePaymentFailed(event);
        break;

      case 'subscription.renewed':
        await this.handleSubscriptionRenewed(event);
        break;

      case 'subscription.canceled':
        await this.handleSubscriptionCanceled(event);
        break;

      default:
        console.log(`Unhandled SumUp event type: ${event.event_type}`);
    }
  }

  private async handlePaymentSucceeded(event: SumUpWebhookEvent): Promise<void> {
    const payload = event.payload as {
      checkout_id?: string;
      checkout_reference?: string;
      amount?: number;
      currency?: string;
    };

    console.log(`Payment succeeded: checkout=${payload.checkout_reference}, amount=${payload.amount} ${payload.currency}`);

    // Update subscription status if linked via checkout_reference
    if (payload.checkout_reference) {
      await this.updateSubscriptionByRef(payload.checkout_reference, 'ACTIVE');
    }
  }

  private async handlePaymentFailed(event: SumUpWebhookEvent): Promise<void> {
    const payload = event.payload as {
      checkout_reference?: string;
      failure_reason?: string;
    };

    console.warn(`Payment failed: checkout=${payload.checkout_reference}, reason=${payload.failure_reason}`);

    if (payload.checkout_reference) {
      await this.updateSubscriptionByRef(payload.checkout_reference, 'INACTIVE');
    }
  }

  private async handleSubscriptionRenewed(event: SumUpWebhookEvent): Promise<void> {
    const payload = event.payload as {
      subscription_id?: string;
      next_renewal_date?: string;
    };

    console.log(`Subscription renewed: id=${payload.subscription_id}, next=${payload.next_renewal_date}`);

    if (payload.subscription_id) {
      const nextRenewal = payload.next_renewal_date
        ? new Date(payload.next_renewal_date)
        : null;

      await prisma.subscription.updateMany({
        where: { sumupSubscriptionId: payload.subscription_id },
        data: {
          status: 'ACTIVE',
          ...(nextRenewal ? { nextRenewalDate: nextRenewal } : {}),
        },
      });
    }
  }

  private async handleSubscriptionCanceled(event: SumUpWebhookEvent): Promise<void> {
    const payload = event.payload as {
      subscription_id?: string;
    };

    console.log(`Subscription canceled: id=${payload.subscription_id}`);

    if (payload.subscription_id) {
      await prisma.subscription.updateMany({
        where: { sumupSubscriptionId: payload.subscription_id },
        data: { status: 'CANCELED' },
      });
    }
  }

  /**
   * Update subscription status matched by SumUp checkout_reference
   * The checkout reference is stored in externalRef / sumupPaymentId
   */
  private async updateSubscriptionByRef(ref: string, status: 'ACTIVE' | 'INACTIVE'): Promise<void> {
    await prisma.subscription.updateMany({
      where: { sumupPaymentId: ref },
      data: { status },
    });
  }
}

export default new SumUpWebhookHandler();
