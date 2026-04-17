/**
 * revenuePrioritizer.ts — Cash-first priority classifier (V4)
 *
 * Translates Revenue OS scores into concrete action plans for each
 * distribution channel: homepage, push, social, SEO.
 */

import { type RevenueOSScoredProduct, classifyRevenueTier } from './revenueOS';

// ── Types ─────────────────────────────────────────────────────────────────────

export type RevenuePriority = 'cash-max' | 'growth' | 'background';

export interface DistributionPlan {
  product: string;
  score: number;
  priority: RevenuePriority;
  /** Ordered list of channels to activate for this product */
  channels: DistributionChannel[];
  /** Whether to include in push notifications */
  push: boolean;
  /** Whether to feature on homepage */
  homepage: boolean;
  /** Whether to boost in SEO pipeline */
  seo: boolean;
  /** Whether to include in social content */
  social: boolean;
}

export type DistributionChannel =
  | 'homepage-top'
  | 'push-notification'
  | 'social-content'
  | 'seo-boost'
  | 'alert-primary'
  | 'alert-secondary'
  | 'comparator'
  | 'archive';

// ── Channel config per priority ───────────────────────────────────────────────

const CHANNEL_MAP: Record<RevenuePriority, DistributionChannel[]> = {
  'cash-max': ['homepage-top', 'push-notification', 'social-content', 'seo-boost', 'alert-primary'],
  growth: ['seo-boost', 'comparator', 'alert-secondary'],
  background: ['archive'],
};

// ── Core classifier ───────────────────────────────────────────────────────────

/**
 * Classify a numeric Revenue OS score into a priority.
 * Identical to classifyRevenueTier — exported here for direct use without the
 * full scored product type.
 */
export function classifyRevenuePriority(score: number): RevenuePriority {
  return classifyRevenueTier(score);
}

/**
 * Build a distribution plan for a single product.
 */
export function buildDistributionPlan(product: RevenueOSScoredProduct): DistributionPlan {
  const priority = product.revenueTier;
  const channels = CHANNEL_MAP[priority];

  return {
    product: product.name,
    score: product.revenueOSScore,
    priority,
    channels,
    push: channels.includes('push-notification'),
    homepage: channels.includes('homepage-top'),
    seo: channels.includes('seo-boost'),
    social: channels.includes('social-content'),
  };
}

/**
 * Build distribution plans for a full scored product list.
 * Returns plans grouped by priority tier.
 */
export function buildAllPlans(products: RevenueOSScoredProduct[]): {
  cashMax: DistributionPlan[];
  growth: DistributionPlan[];
  background: DistributionPlan[];
} {
  const plans = products.map(buildDistributionPlan);
  return {
    cashMax: plans.filter((p) => p.priority === 'cash-max'),
    growth: plans.filter((p) => p.priority === 'growth'),
    background: plans.filter((p) => p.priority === 'background'),
  };
}

/**
 * Filter products that should trigger a push notification.
 *
 * @param products  Revenue-scored product list
 * @param userSegment  Optional — 'visiteur-froid' users skip push
 */
export function shouldPushRevenue(product: RevenueOSScoredProduct, userSegment?: string): boolean {
  if (userSegment === 'visiteur-froid') return false;
  return product.revenueOSScore > 70;
}
