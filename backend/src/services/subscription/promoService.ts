/**
 * PromoService — Promo Code Management
 * Handles creation, validation, and application of promotional codes
 */

import prisma from '../../database/prisma.js';

export interface PromoCode {
  id: string;
  code: string;
  discount: number; // percentage (e.g., 20 for 20%)
  validFrom: Date;
  validUntil: Date;
  maxUses: number;
  currentUses: number;
  applicablePlans: string[];
  createdBy: string;
  createdAt: Date;
}

export interface ValidatePromoResult {
  valid: boolean;
  discount: number;
  message?: string;
  expiresAt?: Date;
  usesRemaining?: number;
}

export interface ApplyPromoResult {
  applied: boolean;
  newPrice: number;
  discount: number;
  message?: string;
}

/**
 * Plan base prices (monthly) used to compute promo-adjusted price.
 * Include both internal/backend plan IDs and frontend-facing aliases so
 * promo application can safely look up the correct base price regardless
 * of which vocabulary the caller uses.
 */
const PLAN_BASE_PRICES: Record<string, number> = {
  FREE: 0,

  // Internal/backend plan IDs
  CITIZEN_PREMIUM: 3.99,
  SME_FREEMIUM: 9.99,
  BUSINESS_PRO: 49,
  INSTITUTIONAL: 0, // custom
  RESEARCH: 0, // custom

  // Frontend-facing plan IDs / aliases
  PRO: 3.99,
  BUSINESS: 49,
  INSTITUTION: 0, // custom
};

export class PromoService {
  /**
   * Create a new promotional code
   */
  async createPromoCode(
    code: string,
    discount: number,
    validUntil: Date,
    applicablePlans: string[],
    maxUses: number = 100,
    createdBy: string = 'system',
    validFrom: Date = new Date()
  ): Promise<PromoCode> {
    const promo = await prisma.promoCode.create({
      data: {
        code: code.toUpperCase(),
        discount,
        validFrom,
        validUntil,
        maxUses,
        currentUses: 0,
        applicablePlans,
        createdBy,
      },
    });
    return promo;
  }

  /**
   * Validate a promo code for a given plan
   */
  async validatePromoCode(code: string, planKey: string): Promise<ValidatePromoResult> {
    const promo = await prisma.promoCode.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!promo) {
      return { valid: false, discount: 0, message: 'Code promo invalide' };
    }

    const now = new Date();

    if (now < promo.validFrom) {
      return { valid: false, discount: 0, message: 'Ce code promo n\'est pas encore actif' };
    }

    if (now > promo.validUntil) {
      return { valid: false, discount: 0, message: 'Ce code promo a expiré' };
    }

    if (promo.currentUses >= promo.maxUses) {
      return { valid: false, discount: 0, message: 'Ce code promo a atteint sa limite d\'utilisation' };
    }

    if (promo.applicablePlans.length > 0 && !promo.applicablePlans.includes(planKey)) {
      return { valid: false, discount: 0, message: `Ce code promo n'est pas applicable au plan ${planKey}` };
    }

    return {
      valid: true,
      discount: promo.discount,
      message: `Code valide : -${promo.discount}% jusqu'au ${promo.validUntil.toLocaleDateString('fr-FR')}`,
      expiresAt: promo.validUntil,
      usesRemaining: promo.maxUses - promo.currentUses,
    };
  }

  /**
   * Apply a promo code to a user subscription, returning adjusted price
   */
  async applyPromoCode(_userId: string, code: string, planKey: string): Promise<ApplyPromoResult> {
    const validation = await this.validatePromoCode(code, planKey);

    if (!validation.valid) {
      return { applied: false, newPrice: PLAN_BASE_PRICES[planKey] ?? 0, discount: 0, message: validation.message };
    }

    const now = new Date();
    const normalizedCode = code.toUpperCase();

    // Increment usage count atomically only if the promo is still valid and has remaining uses.
    const updateResult = await prisma.promoCode.updateMany({
      where: {
        code: normalizedCode,
        validFrom: { lte: now },
        validUntil: { gte: now },
        currentUses: { lt: prisma.promoCode.fields.maxUses },
        applicablePlans: { has: planKey },
      },
      data: { currentUses: { increment: 1 } },
    });

    if (updateResult.count === 0) {
      return {
        applied: false,
        newPrice: PLAN_BASE_PRICES[planKey] ?? 0,
        discount: 0,
        message: 'Code promo invalide, expiré ou limite d’utilisation atteinte',
      };
    }
    const basePrice = PLAN_BASE_PRICES[planKey] ?? 0;
    const newPrice = basePrice * (1 - validation.discount / 100);

    return {
      applied: true,
      newPrice: Math.round(newPrice * 100) / 100,
      discount: validation.discount,
      message: `Code appliqué : -${validation.discount}%`,
    };
  }

  /**
   * List all currently active promo codes
   * @deprecated Use listActivePromosSimple instead
   */
  async listActivePromos(): Promise<PromoCode[]> {
    return this.listActivePromosSimple();
  }

  /**
   * List all currently active promo codes (public safe fields only)
   */
  async listActivePromosSimple(): Promise<PromoCode[]> {
    const now = new Date();
    const promos = await prisma.promoCode.findMany({
      where: {
        validFrom: { lte: now },
        validUntil: { gte: now },
      },
      orderBy: { validUntil: 'asc' },
    });
    // Filter out exhausted promos
    return promos.filter((p) => p.currentUses < p.maxUses);
  }
}

export default new PromoService();
