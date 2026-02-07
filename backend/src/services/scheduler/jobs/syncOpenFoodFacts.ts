/**
 * Job: Sync Open Food Facts
 * 
 * Scheduled job to sync products from Open Food Facts
 */

import { openFoodFactsSync } from '../../sync/openFoodFactsSync.js';

export async function syncOpenFoodFactsJob(): Promise<void> {
  console.info('📦 [JOB] Starting Open Food Facts sync...');

  try {
    const result = await openFoodFactsSync.syncTerritories();
    console.info('✅ [JOB] Open Food Facts sync completed:', result);
  } catch (error) {
    console.error('❌ [JOB] Open Food Facts sync failed:', error);
    throw error;
  }
}
