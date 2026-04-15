import type { Env } from './types';

export type SubscriptionStatus = 'CREATED' | 'ACTIVE' | 'SUSPENDED' | 'CANCELLED';

const EVENT_TYPE_TO_STATUS: Record<string, SubscriptionStatus> = {
  'BILLING.SUBSCRIPTION.CREATED': 'CREATED',
  'BILLING.SUBSCRIPTION.ACTIVATED': 'ACTIVE',
  'BILLING.SUBSCRIPTION.SUSPENDED': 'SUSPENDED',
  'BILLING.SUBSCRIPTION.CANCELLED': 'CANCELLED',
};

export function mapPayPalEventTypeToSubscriptionStatus(eventType?: string): SubscriptionStatus | null {
  if (!eventType) {
    return null;
  }

  return EVENT_TYPE_TO_STATUS[eventType] ?? null;
}

/**
 * Maps a PayPal plan_id to an internal subscription plan name.
 *
 * Plan IDs are resolved at runtime from environment variables so that
 * sandbox and live IDs can be managed without code changes:
 *   - PAYPAL_PREMIUM_PLAN_ID → 'PREMIUM_MONTHLY'
 *   - PAYPAL_PRO_PLAN_ID     → 'PRO_MONTHLY'
 *
 * @param planId  PayPal plan ID from the webhook payload.
 * @param env     Cloudflare Worker environment bindings.
 */
export function mapPayPalPlanIdToInternalPlan(planId: string | undefined, env?: Env): string {
  if (!planId) {
    return 'PLAN_UNKNOWN';
  }

  if (env?.PAYPAL_PREMIUM_PLAN_ID && planId === env.PAYPAL_PREMIUM_PLAN_ID) {
    return 'PREMIUM_MONTHLY';
  }

  if (env?.PAYPAL_PRO_PLAN_ID && planId === env.PAYPAL_PRO_PLAN_ID) {
    return 'PRO_MONTHLY';
  }

  // Unknown plan — return a prefixed string so it can be inspected in the DB.
  return `PAYPAL_PLAN:${planId}`;
}
