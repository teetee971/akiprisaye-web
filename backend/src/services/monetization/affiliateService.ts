/**
 * Affiliate Service v2
 *
 * Système d'affiliation complet : génération de liens, tracking UTM,
 * calcul de commissions, détection de fraude, leaderboard.
 */

export interface AffiliateLink {
  affiliateId: string;
  referralCode: string;
  targetUrl: string;
  trackedUrl: string;
  createdAt: Date;
}

export interface AffiliateStats {
  affiliateId: string;
  referralCode: string;
  totalClicks: number;
  totalConversions: number;
  pendingCommission: number;
  earnedCommission: number;
  paidCommission: number;
  conversionRate: number;
}

export interface CommissionConfig {
  planKey: string;
  planPrice: number;
  commissionRate: number;  // 0.10 = 10%
  perClickRate: number;    // 0.02 = 2% or fixed
}

export const COMMISSION_CONFIGS: CommissionConfig[] = [
  { planKey: 'CITIZEN_PREMIUM', planPrice: 4.99, commissionRate: 0.10, perClickRate: 0.02 },
  { planKey: 'SME', planPrice: 29.99, commissionRate: 0.10, perClickRate: 0.03 },
  { planKey: 'BUSINESS_PRO', planPrice: 79.99, commissionRate: 0.10, perClickRate: 0.05 },
  { planKey: 'INSTITUTIONAL', planPrice: 299, commissionRate: 0.05, perClickRate: 0.02 },
];

export interface AffiliateLeaderboardEntry {
  rank: number;
  affiliateId: string;
  displayName: string;
  totalCommission: number;
  totalConversions: number;
}

export class AffiliateService {
  private static readonly BASE_URL = 'https://akiprisaye.re';
  private static readonly COOKIE_DURATION_DAYS = 30;
  private static readonly MIN_PAYOUT = 50; // EUR

  /**
   * Generate a unique referral code.
   */
  static generateReferralCode(affiliateId: string): string {
    const hash = affiliateId.slice(0, 8).toUpperCase();
    const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `AKI-${hash}-${suffix}`;
  }

  /**
   * Build a tracked affiliate URL with UTM parameters.
   */
  static buildTrackedUrl(
    targetPath: string,
    referralCode: string,
    affiliateId: string,
    campaign = 'affiliate'
  ): string {
    const url = new URL(targetPath, this.BASE_URL);
    url.searchParams.set('ref', referralCode);
    url.searchParams.set('utm_source', 'affiliate');
    url.searchParams.set('utm_medium', 'referral');
    url.searchParams.set('utm_campaign', campaign);
    url.searchParams.set('aff', affiliateId);
    return url.toString();
  }

  /**
   * Compute subscription commission.
   */
  static computeSubscriptionCommission(planKey: string): number {
    const config = COMMISSION_CONFIGS.find((c) => c.planKey === planKey);
    if (!config) return 0;
    return Math.round(config.planPrice * config.commissionRate * 100) / 100;
  }

  /**
   * Compute click commission.
   */
  static computeClickCommission(planKey: string): number {
    const config = COMMISSION_CONFIGS.find((c) => c.planKey === planKey);
    if (!config) return 0;
    return Math.round(config.planPrice * config.perClickRate * 100) / 100;
  }

  /**
   * Check if an affiliate has reached the minimum payout threshold.
   */
  static isEligibleForPayout(pendingCommission: number): boolean {
    return pendingCommission >= this.MIN_PAYOUT;
  }

  /**
   * Detect potential affiliate fraud.
   */
  static detectFraud(params: {
    clicksFromSameIp: number;
    conversionIntervalMs: number;
    userAgents: string[];
  }): { suspicious: boolean; reason?: string } {
    if (params.clicksFromSameIp > 10) {
      return { suspicious: true, reason: 'Trop de clics depuis la même IP' };
    }
    if (params.conversionIntervalMs < 5000) {
      return { suspicious: true, reason: 'Conversions trop rapides (bot probable)' };
    }
    const uniqueUAs = new Set(params.userAgents).size;
    if (uniqueUAs === 1 && params.userAgents.length > 5) {
      return { suspicious: true, reason: 'User-agent identique sur plusieurs conversions' };
    }
    return { suspicious: false };
  }

  /**
   * Get commission configurations for all plans.
   */
  static getCommissionConfigs(): CommissionConfig[] {
    return COMMISSION_CONFIGS;
  }

  /**
   * Build affiliate marketing assets package info.
   */
  static getMarketingAssets(): Array<{ type: string; description: string; downloadUrl: string }> {
    return [
      { type: 'landing_page', description: 'Templates de landing pages', downloadUrl: '/assets/affiliate/landing-templates.zip' },
      { type: 'email_templates', description: 'Templates email HTML', downloadUrl: '/assets/affiliate/email-templates.zip' },
      { type: 'social_media', description: 'Visuels réseaux sociaux', downloadUrl: '/assets/affiliate/social-media-kit.zip' },
      { type: 'sms_snippets', description: 'Snippets SMS pré-rédigés', downloadUrl: '/assets/affiliate/sms-snippets.txt' },
    ];
  }

  /**
   * Calculate cookie expiration date (30 days from now).
   */
  static getCookieExpiration(): Date {
    const date = new Date();
    date.setDate(date.getDate() + this.COOKIE_DURATION_DAYS);
    return date;
  }
}
