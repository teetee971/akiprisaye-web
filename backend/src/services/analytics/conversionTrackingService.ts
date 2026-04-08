/**
 * ConversionTrackingService — Funnel Analytics
 * Tracks user progression through the subscription conversion funnel
 */

import prisma from '../../database/prisma.js';

export type ConversionStep = 'landing' | 'pricing' | 'form_start' | 'form_submit' | 'success';
export type ConversionSource = 'organic' | 'affiliate' | 'direct' | 'promo';

export interface ConversionEvent {
  id: string;
  userId?: string | null;
  step: ConversionStep;
  source: ConversionSource;
  planKey?: string | null;
  promoCodeUsed?: string | null;
  affiliateCode?: string | null;
  duration?: number | null; // ms from previous step
  timestamp: Date;
  sessionId?: string | null;
}

export interface FunnelStep {
  step: ConversionStep;
  count: number;
  dropoffRate: number; // percentage of users who dropped off before this step
}

export interface DailyConversionRate {
  date: string;
  rate: number;
  totalSubs: number;
}

const FUNNEL_STEPS: ConversionStep[] = ['landing', 'pricing', 'form_start', 'form_submit', 'success'];

export class ConversionTrackingService {
  /**
   * Track a step in the conversion funnel
   */
  async trackStep(
    step: ConversionStep,
    planKey: string,
    source: ConversionSource,
    options: {
      userId?: string;
      sessionId?: string;
      promoCodeUsed?: string;
      affiliateCode?: string;
      duration?: number;
    } = {}
  ): Promise<void> {
    await prisma.conversionEvent.create({
      data: {
        step,
        planKey,
        source,
        userId: options.userId ?? null,
        sessionId: options.sessionId ?? null,
        promoCodeUsed: options.promoCodeUsed ?? null,
        affiliateCode: options.affiliateCode ?? null,
        duration: options.duration ?? null,
        timestamp: new Date(),
      },
    });
  }

  /**
   * Get the full conversion funnel with drop-off rates
   */
  async getConversionFunnel(): Promise<FunnelStep[]> {
    const counts = await Promise.all(
      FUNNEL_STEPS.map((step) =>
        prisma.conversionEvent.count({ where: { step } })
      )
    );

    return FUNNEL_STEPS.map((step, i) => {
      const count = counts[i];
      const previousCount = i === 0 ? count : (counts[i - 1] ?? 0);
      // If previous step has no events, drop-off rate is 100% (all dropped before reaching this step)
      const dropoffRate =
        i === 0 ? 0
        : previousCount === 0 ? 100
        : Math.max(0, Math.min(100, Math.round((1 - count / previousCount) * 100)));
      return { step, count, dropoffRate };
    });
  }

  /**
   * Get daily conversion rate (success events / landing events per day)
   */
  async getDailyConversionRate(days: number = 30): Promise<DailyConversionRate[]> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const events = await prisma.conversionEvent.findMany({
      where: { timestamp: { gte: since } },
      select: { step: true, timestamp: true },
      orderBy: { timestamp: 'asc' },
    });

    // Aggregate by day
    const byDay: Record<string, { landing: number; success: number }> = {};

    for (const event of events) {
      const date = event.timestamp.toISOString().slice(0, 10);
      if (!byDay[date]) byDay[date] = { landing: 0, success: 0 };
      if (event.step === 'landing') byDay[date].landing++;
      if (event.step === 'success') byDay[date].success++;
    }

    return Object.entries(byDay).map(([date, data]) => ({
      date,
      rate: data.landing > 0 ? Math.round((data.success / data.landing) * 100) : 0,
      totalSubs: data.success,
    }));
  }
}

export default new ConversionTrackingService();
