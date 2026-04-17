/**
 * sponsorEngine.ts — Sponsor-safe product boost engine (V4)
 *
 * Rules:
 *   1. Sponsored products receive a configurable score bonus.
 *   2. A sponsored product MUST be labelled visibly in the UI —
 *      either "Sponsorisé" or "Mise en avant partenaire".
 *   3. A sponsored product CANNOT displace a product with a
 *      genuinely better deal (higher delta) by more than MAX_SPONSOR_OVERRIDE.
 *   4. Sponsor logic is pure — no side effects, no external calls.
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SponsorableProduct {
  name: string;
  delta?: number;
  revenueOSScore?: number;
  /** Operator flag — product has paid for placement */
  isSponsored?: boolean;
  /** Computed sponsor bonus (0 or SPONSOR_BONUS) */
  sponsorBoost?: number;
  /** Mandatory UI label if sponsored */
  sponsorLabel?: string;
  [key: string]: unknown;
}

// ── Constants ─────────────────────────────────────────────────────────────────

/** Score bonus added when a product is sponsored */
const SPONSOR_BONUS = 10;

/**
 * Maximum score override a sponsored product can receive above
 * the best organic product on the same page.
 * This prevents paid placement from fully defeating organic results.
 */
const MAX_SPONSOR_OVERRIDE = 15;

/** Mandatory display label for sponsored products */
export const SPONSOR_LABEL = 'Sponsorisé';
export const SPONSOR_LABEL_ALT = 'Mise en avant partenaire';

// ── Core functions ────────────────────────────────────────────────────────────

/**
 * Apply sponsor boost to a single product.
 *
 * If the product is not sponsored, it is returned unchanged.
 * Sponsored products receive SPONSOR_BONUS and a mandatory label.
 */
export function applySponsorBoost<T extends SponsorableProduct>(product: T): T {
  if (!product.isSponsored) {
    return { ...product, sponsorBoost: 0 };
  }

  return {
    ...product,
    sponsorBoost: SPONSOR_BONUS,
    sponsorLabel: SPONSOR_LABEL,
  };
}

/**
 * Apply sponsor boosts to a full product list while enforcing the
 * fairness cap: no sponsored product can rank more than
 * MAX_SPONSOR_OVERRIDE points above the best organic product.
 *
 * @param products  Products sorted by revenueOSScore descending (pre-sorted)
 */
export function applyFairSponsorRanking<T extends SponsorableProduct>(products: T[]): T[] {
  // Find the best organic score
  const bestOrganicScore = products
    .filter((p) => !p.isSponsored)
    .reduce((max, p) => Math.max(max, p.revenueOSScore ?? 0), 0);

  const cap = bestOrganicScore + MAX_SPONSOR_OVERRIDE;

  return products
    .map((p) => {
      if (!p.isSponsored) return { ...p, sponsorBoost: 0 };
      const boosted = Math.min(cap, (p.revenueOSScore ?? 0) + SPONSOR_BONUS);
      return {
        ...p,
        sponsorBoost: SPONSOR_BONUS,
        sponsorLabel: SPONSOR_LABEL,
        revenueOSScore: boosted,
      };
    })
    .sort((a, b) => (b.revenueOSScore ?? 0) - (a.revenueOSScore ?? 0));
}

/**
 * Guard: returns true only if a sponsored product has a visible label.
 * Use this in rendering to enforce the transparency rule.
 */
export function isSponsorLabelVisible(product: SponsorableProduct): boolean {
  return !product.isSponsored || Boolean(product.sponsorLabel);
}
