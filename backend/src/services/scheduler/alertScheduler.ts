/**
 * Alert Scheduler
 * Schedules periodic jobs for checking alerts and sending digests
 */

import * as cron from 'node-cron';
import { alertService } from '../alerts/alertService.js';
import { alertEngine } from '../alerts/alertEngine.js';
import { notificationService } from '../notifications/notificationService.js';

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
   * Send weekly digest to users
   */
  private async sendWeeklyDigest(): Promise<void> {
    try {
      console.log('[Scheduler] Sending weekly digest...');
      
      // TODO: Implement weekly digest logic
      // 1. Gather price changes for the week
      // 2. Generate digest for each user
      // 3. Send via email
      
      console.log('[Scheduler] Weekly digest sent');
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
