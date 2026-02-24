export type SubscriptionStatus = 'CREATED' | 'ACTIVE' | 'SUSPENDED' | 'CANCELLED';

const EVENT_TYPE_TO_STATUS: Record<string, SubscriptionStatus> = {
  'BILLING.SUBSCRIPTION.CREATED': 'CREATED',
  'BILLING.SUBSCRIPTION.ACTIVATED': 'ACTIVE',
  'BILLING.SUBSCRIPTION.SUSPENDED': 'SUSPENDED',
  'BILLING.SUBSCRIPTION.CANCELLED': 'CANCELLED',
};

const PAYPAL_PLAN_ID_TO_INTERNAL_PLAN: Record<string, 'PREMIUM_MONTHLY' | 'PRO_MONTHLY'> = {
  // TODO: remplacez par vos vrais plan_id PayPal Sandbox/Live.
  PREMIUM_SANDBOX_PLAN_ID: 'PREMIUM_MONTHLY',
  PRO_SANDBOX_PLAN_ID: 'PRO_MONTHLY',
};

export function mapPayPalEventTypeToSubscriptionStatus(eventType?: string): SubscriptionStatus | null {
  if (!eventType) {
    return null;
  }

  return EVENT_TYPE_TO_STATUS[eventType] ?? null;
}

export function mapPayPalPlanIdToInternalPlan(planId?: string): string {
  if (!planId) {
    return 'PLAN_UNKNOWN';
  }

  return PAYPAL_PLAN_ID_TO_INTERNAL_PLAN[planId] ?? `PAYPAL_PLAN:${planId}`;
}
