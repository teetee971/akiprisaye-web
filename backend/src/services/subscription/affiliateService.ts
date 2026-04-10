/**
 * AffiliateService — Affiliate Link Management & Tracking
 * Handles generation, tracking, and stats for affiliate/referral links
 */

import crypto from 'crypto';
import prisma from '../../database/prisma.js';

export interface AffiliateLink {
  id: string;
  userId: string;
  referralCode: string;
  platform: string;
  conversions: number;
  revenue: number;
  status: 'active' | 'pending' | 'suspended';
  createdAt: Date;
  updatedAt: Date;
}

export interface AffiliateStats {
  conversions: number;
  revenue: number;
  topPlan: string | null;
  links: AffiliateLink[];
}

export interface GenerateLinkResult {
  link: string;
  referralCode: string;
}

const BASE_URL = (() => {
  const url = process.env['APP_BASE_URL'];
  if (!url) {
    console.warn('[AffiliateService] APP_BASE_URL is not set; falling back to default URL');
    return 'https://akiprisaye-web.pages.dev';
  }
  return url;
})();

export class AffiliateService {
  /**
   * Generate or retrieve a referral link for a user on a given platform
   */
  async generateAffiliateLink(userId: string, platform: string): Promise<GenerateLinkResult> {
    // Check if a link already exists for this user & platform
    const existing = await prisma.affiliateLink.findFirst({
      where: { userId, platform, status: 'active' },
    });

    if (existing) {
      return {
        link: `${BASE_URL}/pricing?ref=${existing.referralCode}`,
        referralCode: existing.referralCode,
      };
    }

    // Generate unique referral code
    const referralCode = this._generateCode(userId, platform);

    await prisma.affiliateLink.create({
      data: {
        userId,
        referralCode,
        platform,
        conversions: 0,
        revenue: 0,
        status: 'active',
      },
    });

    return {
      link: `${BASE_URL}/pricing?ref=${referralCode}`,
      referralCode,
    };
  }

  /**
   * Track a conversion from an affiliate referral code
   */
  async trackAffiliateConversion(
    referralCode: string,
    _planKey: string,
    revenue: number
  ): Promise<void> {
    const link = await prisma.affiliateLink.findUnique({ where: { referralCode } });
    if (!link) return;

    await prisma.affiliateLink.update({
      where: { referralCode },
      data: {
        conversions: { increment: 1 },
        revenue: { increment: revenue },
      },
    });
  }

  /**
   * Get aggregate affiliate stats for a user
   */
  async getAffiliateStats(userId: string): Promise<AffiliateStats> {
    const links = await prisma.affiliateLink.findMany({ where: { userId } });

    const totalConversions = links.reduce((sum, l) => sum + l.conversions, 0);
    const totalRevenue = links.reduce((sum, l) => sum + l.revenue, 0);

    return {
      conversions: totalConversions,
      revenue: Math.round(totalRevenue * 100) / 100,
      topPlan: null, // Plan tracking can be enhanced via ConversionEvent
      links: links.map((l) => ({
        ...l,
        status: l.status as 'active' | 'pending' | 'suspended',
      })),
    };
  }

  /**
   * List top affiliates by conversions
   */
  async listTopAffiliates(limit: number = 10): Promise<AffiliateLink[]> {
    const links = await prisma.affiliateLink.findMany({
      where: { status: 'active' },
      orderBy: { conversions: 'desc' },
      take: limit,
    });

    return links.map((l) => ({
      ...l,
      status: l.status as 'active' | 'pending' | 'suspended',
    }));
  }

  /**
   * Generate a short unique referral code
   */
  private _generateCode(userId: string, platform: string): string {
    const hash = crypto
      .createHash('sha256')
      .update(`${userId}-${platform}-${Date.now()}`)
      .digest('hex')
      .slice(0, 8)
      .toUpperCase();
    return hash;
  }
}

export default new AffiliateService();
