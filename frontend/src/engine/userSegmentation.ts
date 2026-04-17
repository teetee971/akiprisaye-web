/**
 * userSegmentation.ts — Automatic user behavioural segmentation (V3)
 *
 * Classifies users into actionable segments based on their UserProfile.
 * Each segment drives a different homepage block order and push-message tone.
 *
 * Segments:
 *   chasseur-promos  — deal hunter, high product-click velocity
 *   comparateur      — compares many retailers before deciding
 *   fidele-enseigne  — loyal to a single retailer
 *   panier-frequent  — regular basket builder, repeat visits
 *   visiteur-froid   — new or inactive visitor
 */

import type { UserProfile } from './userProfileEngine';

// ── Types ─────────────────────────────────────────────────────────────────────

export type UserSegment =
  | 'chasseur-promos'
  | 'comparateur'
  | 'fidele-enseigne'
  | 'panier-frequent'
  | 'visiteur-froid';

export interface SegmentConfig {
  label: string;
  description: string;
  /** Ordered list of homepage block IDs to display for this segment */
  homepageBlocks: string[];
  /** Tone for push messages */
  pushTone: 'urgency' | 'loyalty' | 'discovery' | 'neutral';
}

// ── Segment definitions ───────────────────────────────────────────────────────

export const SEGMENT_CONFIGS: Record<UserSegment, SegmentConfig> = {
  'chasseur-promos': {
    label: 'Chasseur de promos',
    description: 'Cherche activement les meilleures offres',
    homepageBlocks: ['topDeals', 'priceDrops', 'hotAlerts', 'viralDeals'],
    pushTone: 'urgency',
  },
  comparateur: {
    label: 'Comparateur rapide',
    description: "Compare plusieurs enseignes avant d'acheter",
    homepageBlocks: ['priceComparison', 'topDeals', 'retailerRanking', 'priceDrops'],
    pushTone: 'discovery',
  },
  'fidele-enseigne': {
    label: 'Fidèle enseigne',
    description: 'Achète principalement dans une enseigne favorite',
    homepageBlocks: ['favoriteRetailerDeals', 'priceComparison', 'topDeals', 'alternatives'],
    pushTone: 'loyalty',
  },
  'panier-frequent': {
    label: 'Panier fréquent',
    description: 'Effectue des courses régulières avec un panier récurrent',
    homepageBlocks: ['basketOptimizer', 'recurringProducts', 'topDeals', 'priceDrops'],
    pushTone: 'neutral',
  },
  'visiteur-froid': {
    label: 'Visiteur froid',
    description: 'Nouveau visiteur ou visiteur peu actif',
    homepageBlocks: ['topDeals', 'priceDrops', 'howItWorks', 'socialProof'],
    pushTone: 'discovery',
  },
};

// ── Classifier ────────────────────────────────────────────────────────────────

/**
 * Classify a user into a behavioural segment based on their profile.
 *
 * Rules are applied in priority order — the first match wins.
 *
 * @param profile  UserProfile built by userProfileEngine.buildUserProfile
 */
export function classifyUser(profile: UserProfile): UserSegment {
  const { repeatVisits, clickedProducts, clickedRetailers, viewedProducts, avgSessionDepth } =
    profile;

  // Panier fréquent — loyal repeat user with many product clicks
  if (repeatVisits >= 3 && clickedProducts.length >= 5) {
    return 'panier-frequent';
  }

  // Fidèle enseigne — always clicks the same single retailer
  if (clickedRetailers.length === 1 && clickedProducts.length >= 2) {
    return 'fidele-enseigne';
  }

  // Chasseur de promos — many product clicks across multiple retailers
  if (clickedProducts.length >= 3 && clickedRetailers.length >= 2) {
    return 'chasseur-promos';
  }

  // Comparateur rapide — browses many products but few affiliate clicks
  if (viewedProducts.length >= 5 && avgSessionDepth >= 4) {
    return 'comparateur';
  }

  return 'visiteur-froid';
}

/**
 * Return the homepage block order for a given segment.
 */
export function getHomepageBlocks(segment: UserSegment): string[] {
  return SEGMENT_CONFIGS[segment].homepageBlocks;
}

/**
 * Return the push tone for a given segment.
 */
export function getPushTone(segment: UserSegment): SegmentConfig['pushTone'] {
  return SEGMENT_CONFIGS[segment].pushTone;
}
