/**
 * Alert Scheduler
 * Schedules periodic jobs for checking alerts and sending digests
 */

import * as cron from 'node-cron';
import { alertService } from '../alerts/alertService.js';
import { alertEngine } from '../alerts/alertEngine.js';
import { notificationService } from '../notifications/notificationService.js';
import prisma from '../../database/prisma.js';

class AlertScheduler {
  private jobs: Map<string, cron.ScheduledTask> = new Map();

  /**
   * Start all scheduled jobs
   */
  start(): void {
    console.log('Starting alert scheduler...');

    // Check price alerts every 15 minutes
    const checkAlertsJob = cron.schedule('*/15 * * * *', async () => {
      await this.checkAllAlerts();
    });
    this.jobs.set('check-alerts', checkAlertsJob);

    // Send weekly digest every Sunday at 8am (Guadeloupe time)
    const weeklyDigestJob = cron.schedule('0 8 * * 0', async () => {
      await this.sendWeeklyDigest();
    }, {
      timezone: 'America/Guadeloupe',
    });
    this.jobs.set('weekly-digest', weeklyDigestJob);

    // Cleanup expired alerts every day at 3am
    const cleanupJob = cron.schedule('0 3 * * *', async () => {
      await this.cleanupExpiredAlerts();
    }, {
      timezone: 'America/Guadeloupe',
    });
    this.jobs.set('cleanup', cleanupJob);

    console.log('Alert scheduler started with', this.jobs.size, 'jobs');
  }

  /**
   * Stop all scheduled jobs
   */
  stop(): void {
    console.log('Stopping alert scheduler...');
    this.jobs.forEach((job, name) => {
      job.stop();
      console.log(`Stopped job: ${name}`);
    });
    this.jobs.clear();
  }

  /**
   * Check all active alerts
   */
  private async checkAllAlerts(): Promise<void> {
    try {
      console.log('[Scheduler] Running alert check...');
      const result = await alertEngine.runAlertCheck();
      
      console.log(`[Scheduler] Alert check complete:`, {
        totalChecked: result.totalChecked,
        triggered: result.triggeredCount,
        failed: result.failedCount,
      });

      // Send notifications for triggered alerts
      for (const triggeredAlert of result.triggeredAlerts) {
        try {
          await notificationService.sendAlertNotification(triggeredAlert);
        } catch (error) {
          console.error('[Scheduler] Error sending notification:', error);
        }
      }
    } catch (error) {
      console.error('[Scheduler] Error in checkAllAlerts:', error);
    }
  }

  /**
   * Send weekly digest to users with active alerts
   */
  private async sendWeeklyDigest(): Promise<void> {
    try {
      console.log('[Scheduler] Sending weekly digest...');

      // Gather all users who have active price alerts
      const activeAlerts = await alertService.getActiveAlerts();
      const userIds = [...new Set(activeAlerts.map((a) => a.userId))];

      let sentCount = 0;

      for (const userId of userIds) {
        try {
          // Fetch user email
          const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { email: true, name: true },
          });

          if (!user?.email) continue;

          // Collect price changes from the last 7 days for this user's alert products
          const userAlerts = activeAlerts.filter((a) => a.userId === userId);
          const productIds = [...new Set(userAlerts.map((a) => a.productId))];

          const weekAgo = new Date(Date.now() - 7 * 86_400_000);

          const recentChanges = await prisma.priceObservation.findMany({
            where: {
              productId: { in: productIds },
              observedAt: { gte: weekAgo },
            },
            orderBy: { observedAt: 'desc' },
            include: {
              product: { select: { displayName: true } },
            },
            distinct: ['productId'],
          });

          if (recentChanges.length === 0) continue;

          // Build digest notification
          const productLines = recentChanges
            .map((obs) => `- ${obs.product?.displayName ?? obs.productLabel}: ${obs.price.toFixed(2)}€`)
            .join('\n');

          await notificationService.sendNotification({
            userId,
            type: 'WEEKLY_SUMMARY',
            channel: 'EMAIL',
            title: '📊 Votre récap hebdo A KI PRI SA YÉ',
            body: `Bonjour ${user.name ?? ''},\n\nVoici les derniers prix observés pour vos produits suivis :\n\n${productLines}\n\nBonne semaine !`,
            data: { productCount: recentChanges.length },
          });

          sentCount++;
        } catch (userError) {
          console.error(`[Scheduler] Failed to send digest to user ${userId}:`, userError);
        }
      }

      console.log(`[Scheduler] Weekly digest sent to ${sentCount}/${userIds.length} users`);
    } catch (error) {
      console.error('[Scheduler] Error sending weekly digest:', error);
    }
  }

  /**
   * Cleanup expired alerts
   */
  private async cleanupExpiredAlerts(): Promise<void> {
    try {
      console.log('[Scheduler] Cleaning up expired alerts...');
      const count = await alertService.cleanupExpiredAlerts();
      console.log(`[Scheduler] Deactivated ${count} expired alerts`);
    } catch (error) {
      console.error('[Scheduler] Error cleaning up expired alerts:', error);
    }
  }

  /**
   * Run a job manually (for testing)
   */
  async runJob(jobName: string): Promise<void> {
    switch (jobName) {
      case 'check-alerts':
        await this.checkAllAlerts();
        break;
      case 'weekly-digest':
        await this.sendWeeklyDigest();
        break;
      case 'cleanup':
        await this.cleanupExpiredAlerts();
        break;
      default:
        throw new Error(`Unknown job: ${jobName}`);
    }
  }
}

export const alertScheduler = new AlertScheduler();
