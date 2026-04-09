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
   * Verify webhook signature from SumUp.
   * SumUp sends an HMAC-SHA256 hex signature in the x-webhook-signature header.
   * Returns true (skip verification) when SUMUP_WEBHOOK_SECRET is not configured.
   */
  verifySignature(payload: Buffer, signature: string): boolean {
    const secret = process.env.SUMUP_WEBHOOK_SECRET || '';
    if (!secret) {
      return true;
    }

    try {
      // Guard against malformed / non-hex signatures to prevent timingSafeEqual throwing
      if (!signature || !/^[0-9a-fA-F]+$/.test(signature) || signature.length % 2 !== 0) {
        return false;
      }

      const expected = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');

      const expectedBuffer = Buffer.from(expected, 'hex');
      const signatureBuffer = Buffer.from(signature, 'hex');

      // timingSafeEqual requires equal-length buffers
      if (expectedBuffer.length !== signatureBuffer.length) {
        return false;
      }

      return crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
    } catch {
      return false;
    }
  }

  /**
   * Main dispatcher: parse and route webhook event
   */
  async handleWebhook(event: SumUpWebhookEvent): Promise<void> {
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
        // Unknown event type — silently ignore; don't log webhook traffic
        break;
    }
  }

  private async handlePaymentSucceeded(event: SumUpWebhookEvent): Promise<void> {
    const payload = event.payload as {
      checkout_id?: string;
      checkout_reference?: string;
      amount?: number;
      currency?: string;
    };

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

    if (payload.checkout_reference) {
      await this.updateSubscriptionByRef(payload.checkout_reference, 'INACTIVE');
    }
  }

  private async handleSubscriptionRenewed(event: SumUpWebhookEvent): Promise<void> {
    const payload = event.payload as {
      subscription_id?: string;
      next_renewal_date?: string;
    };

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
