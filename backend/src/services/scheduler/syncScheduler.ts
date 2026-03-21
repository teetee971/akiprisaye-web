/**
 * Sync Scheduler Service
 * 
 * Manages scheduled synchronization jobs using node-cron
 */

import * as cron from 'node-cron';
import { SYNC_CONFIG } from '../../config/syncConfig.js';
import { syncOpenFoodFactsJob } from './jobs/syncOpenFoodFacts.js';
import { syncOpenPricesJob } from './jobs/syncOpenPrices.js';
import { processOcrQueueJob } from './jobs/processOcrQueue.js';
import { cleanupDuplicatesJob } from './jobs/cleanupDuplicates.js';

export interface ScheduledJob {
  id: string;
  name: string;
  cron: string;
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
  status: 'idle' | 'running' | 'failed';
  task?: cron.ScheduledTask;
}

export class SyncScheduler {
  private jobs: Map<string, ScheduledJob> = new Map();

  constructor() {
    this.initializeJobs();
  }

  /**
   * Initialize all scheduled jobs
   */
  private initializeJobs() {
    const jobsConfig = SYNC_CONFIG.scheduler.jobs;

    // Job: Sync Open Food Facts (daily at 3am)
    this.registerJob({
      id: 'sync:openfoodfacts',
      name: 'Sync Open Food Facts',
      cron: jobsConfig.syncOpenFoodFacts,
      enabled: true,
      handler: syncOpenFoodFactsJob,
    });

    // Job: Sync Open Prices (every 6 hours)
    this.registerJob({
      id: 'sync:openprices',
      name: 'Sync Open Prices',
      cron: jobsConfig.syncOpenPrices,
      enabled: true,
      handler: syncOpenPricesJob,
    });

    // Job: Process OCR Queue (every 5 minutes)
    this.registerJob({
      id: 'process:ocr-queue',
      name: 'Process OCR Queue',
      cron: jobsConfig.processOcrQueue,
      enabled: true,
      handler: processOcrQueueJob,
    });

    // Job: Cleanup Duplicates (Sunday at 4am)
    this.registerJob({
      id: 'cleanup:duplicates',
      name: 'Cleanup Duplicates',
      cron: jobsConfig.cleanupDuplicates,
      enabled: true,
      handler: cleanupDuplicatesJob,
    });

    console.info(`✅ Initialized ${this.jobs.size} scheduled jobs`);
  }

  /**
   * Register a new job
   */
  private registerJob(config: {
    id: string;
    name: string;
    cron: string;
    enabled: boolean;
    handler: () => Promise<void>;
  }) {
    const job: ScheduledJob = {
      id: config.id,
      name: config.name,
      cron: config.cron,
      enabled: config.enabled,
      status: 'idle',
    };

    if (config.enabled) {
      // Schedule the job with scheduled: false to prevent auto-start
      job.task = cron.schedule(
        config.cron,
        async () => {
          await this.runJob(config.id, config.handler);
        },
        {
          timezone: SYNC_CONFIG.scheduler.timezone,
        }
      );

      console.info(`📅 Scheduled job: ${config.name} (${config.cron})`);
    }

    this.jobs.set(config.id, job);
  }

  /**
   * Run a job
   */
  private async runJob(jobId: string, handler: () => Promise<void>) {
    const job = this.jobs.get(jobId);
    if (!job) {
      console.error(`Job ${jobId} not found`);
      return;
    }

    if (job.status === 'running') {
      console.warn(`Job ${jobId} is already running, skipping...`);
      return;
    }

    console.info(`🚀 Starting job: ${job.name}`);
    job.status = 'running';
    job.lastRun = new Date();

    try {
      await handler();
      job.status = 'idle';
      console.info(`✅ Job completed: ${job.name}`);
    } catch (error) {
      job.status = 'failed';
      console.error(`❌ Job failed: ${job.name}`, error);
    }
  }

  /**
   * Start all enabled jobs
   */
  start() {
    console.info('🚀 Starting scheduler...');
    this.jobs.forEach((job) => {
      if (job.enabled && job.task) {
        job.task.start();
      }
    });
    console.info(`✅ Scheduler started with ${this.jobs.size} jobs`);
  }

  /**
   * Stop all jobs
   */
  stop() {
    console.info('🛑 Stopping scheduler...');
    this.jobs.forEach((job) => {
      if (job.task) {
        job.task.stop();
      }
    });
    console.info('✅ Scheduler stopped');
  }

  /**
   * Get all jobs
   */
  getJobs(): ScheduledJob[] {
    return Array.from(this.jobs.values()).map((job) => ({
      id: job.id,
      name: job.name,
      cron: job.cron,
      enabled: job.enabled,
      lastRun: job.lastRun,
      nextRun: job.task ? this.getNextRun(job.task) : undefined,
      status: job.status,
    }));
  }

  /**
   * Get next run time for a scheduled task
   */
  private getNextRun(_task: cron.ScheduledTask): Date | undefined {
    // Note: node-cron doesn't provide a direct way to get next run time
    // This is a placeholder - in production, you might want to use a library like cron-parser
    return undefined;
  }

  /**
   * Manually trigger a job
   */
  async triggerJob(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    console.info(`🔧 Manually triggering job: ${job.name}`);

    // Map job ID to handler
    const handlers: Record<string, () => Promise<void>> = {
      'sync:openfoodfacts': syncOpenFoodFactsJob,
      'sync:openprices': syncOpenPricesJob,
      'process:ocr-queue': processOcrQueueJob,
      'cleanup:duplicates': cleanupDuplicatesJob,
    };

    const handler = handlers[jobId];
    if (!handler) {
      throw new Error(`No handler found for job ${jobId}`);
    }

    await this.runJob(jobId, handler);
  }

  /**
   * Enable a job
   */
  enableJob(jobId: string): void {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    job.enabled = true;
    if (job.task) {
      job.task.start();
    }
    console.info(`✅ Job enabled: ${job.name}`);
  }

  /**
   * Disable a job
   */
  disableJob(jobId: string): void {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    job.enabled = false;
    if (job.task) {
      job.task.stop();
    }
    console.info(`🛑 Job disabled: ${job.name}`);
  }
}

// Export singleton instance
export const syncScheduler = new SyncScheduler();
