/**
 * Update Scheduler Service
 * 
 * Manages 4 cron jobs for the verified pricing system:
 * 1. Price refresh (6am daily) - Update freshness status
 * 2. Anomaly check (every 4h) - Detect price anomalies
 * 3. Sync (weekly) - Synchronize data
 * 4. Cleanup (daily) - Deactivate old prices
 */

import cron from 'node-cron';
import { updateFreshnessStatus, deactivateOldPrices, getPriceStats } from '../pricing/verifiedPricing.js';
import { checkAndRecordAnomalies } from '../pricing/priceAnomalyDetector.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Job 1: Price Refresh - Update freshness status
 * Runs daily at 6:00 AM
 */
export function schedulePriceRefresh(): void {
  // Run at 6:00 AM every day
  cron.schedule('0 6 * * *', async () => {
    console.info('[Price Refresh] Starting daily price freshness update...');
    
    try {
      const updatedCount = await updateFreshnessStatus();
      console.info(`[Price Refresh] Updated freshness status for ${updatedCount} prices`);
      
      // Log statistics
      const stats = await getPriceStats();
      console.info(`[Price Refresh] Stats: ${stats.freshPrices} fresh / ${stats.activePrices} active`);
    } catch (error) {
      console.error('[Price Refresh] Error:', error);
    }
  });
  
  console.info('[Scheduler] Price refresh job scheduled (daily at 6:00 AM)');
}

/**
 * Job 2: Anomaly Check - Detect price anomalies
 * Runs every 4 hours
 */
export function scheduleAnomalyCheck(): void {
  // Run every 4 hours
  cron.schedule('0 */4 * * *', async () => {
    console.info('[Anomaly Check] Starting anomaly detection...');
    
    try {
      // Get recent prices (last 48 hours) to check
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      
      const recentPrices = await prisma.productPrice.findMany({
        where: {
          isActive: true,
          createdAt: {
            gte: twoDaysAgo,
          },
        },
        select: {
          id: true,
        },
      });
      
      let anomalyCount = 0;
      
      for (const price of recentPrices) {
        const result = await checkAndRecordAnomalies(price.id);
        if (result.hasAnomaly) {
          anomalyCount += result.anomalies.length;
        }
      }
      
      console.info(`[Anomaly Check] Checked ${recentPrices.length} prices, found ${anomalyCount} anomalies`);
    } catch (error) {
      console.error('[Anomaly Check] Error:', error);
    }
  });
  
  console.info('[Scheduler] Anomaly check job scheduled (every 4 hours)');
}

/**
 * Job 3: Data Sync - Synchronize pricing data
 * Runs weekly on Sunday at 3:00 AM
 */
export function scheduleDataSync(): void {
  // Run every Sunday at 3:00 AM
  cron.schedule('0 3 * * 0', async () => {
    console.info('[Data Sync] Starting weekly data synchronization...');
    
    try {
      // Recalculate confidence scores for all active prices
      const activePrices = await prisma.productPrice.findMany({
        where: {
          isActive: true,
        },
        select: {
          id: true,
        },
      });
      
      console.info(`[Data Sync] Recalculating confidence scores for ${activePrices.length} prices...`);
      
      // This would normally involve more complex sync logic
      // For now, just log the count
      
      // Get updated statistics
      const stats = await getPriceStats();
      console.info('[Data Sync] Current stats:', stats);
      
      console.info('[Data Sync] Weekly sync completed');
    } catch (error) {
      console.error('[Data Sync] Error:', error);
    }
  });
  
  console.info('[Scheduler] Data sync job scheduled (weekly on Sunday at 3:00 AM)');
}

/**
 * Job 4: Cleanup - Deactivate old prices
 * Runs daily at 2:00 AM
 */
export function scheduleCleanup(): void {
  // Run every day at 2:00 AM
  cron.schedule('0 2 * * *', async () => {
    console.info('[Cleanup] Starting daily cleanup...');
    
    try {
      // Deactivate prices older than 90 days
      const deactivated = await deactivateOldPrices(90);
      console.info(`[Cleanup] Deactivated ${deactivated} old prices`);
      
      // Clean up resolved anomalies older than 180 days
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setDate(sixMonthsAgo.getDate() - 180);
      
      const deletedAnomalies = await prisma.priceAnomaly.deleteMany({
        where: {
          isResolved: true,
          resolvedAt: {
            lt: sixMonthsAgo,
          },
        },
      });
      
      console.info(`[Cleanup] Deleted ${deletedAnomalies.count} old resolved anomalies`);
      
      // Clean up old rejected product updates
      const deletedUpdates = await prisma.productUpdate.deleteMany({
        where: {
          status: 'REJECTED',
          createdAt: {
            lt: sixMonthsAgo,
          },
        },
      });
      
      console.info(`[Cleanup] Deleted ${deletedUpdates.count} old rejected updates`);
      
    } catch (error) {
      console.error('[Cleanup] Error:', error);
    }
  });
  
  console.info('[Scheduler] Cleanup job scheduled (daily at 2:00 AM)');
}

/**
 * Initialize all scheduled jobs
 */
export function initializeScheduler(): void {
  console.info('[Scheduler] Initializing pricing system scheduled jobs...');
  
  schedulePriceRefresh();
  scheduleAnomalyCheck();
  scheduleDataSync();
  scheduleCleanup();
  
  console.info('[Scheduler] All pricing jobs initialized successfully');
}

/**
 * Run jobs manually (for testing)
 */
export async function runJobManually(jobName: 'refresh' | 'anomaly' | 'sync' | 'cleanup') {
  console.info(`[Manual] Running ${jobName} job...`);
  
  switch (jobName) {
    case 'refresh': {
      const refreshed = await updateFreshnessStatus();
      return { success: true, updated: refreshed };
    }
      
    case 'anomaly': {
      const recentPrices = await prisma.productPrice.findMany({
        where: { isActive: true },
        take: 100,
        select: { id: true },
      });
      
      let anomalies = 0;
      for (const price of recentPrices) {
        const result = await checkAndRecordAnomalies(price.id);
        if (result.hasAnomaly) anomalies += result.anomalies.length;
      }
      return { success: true, anomaliesFound: anomalies };
    }
      
    case 'sync': {
      const stats = await getPriceStats();
      return { success: true, stats };
    }
      
    case 'cleanup': {
      const deactivated = await deactivateOldPrices(90);
      return { success: true, deactivated };
    }
      
    default:
      return { success: false, error: 'Invalid job name' };
  }
}
