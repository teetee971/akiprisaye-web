/**
 * Job: Sync Open Prices
 * 
 * Scheduled job to sync prices from Open Prices
 */

import { openPricesSync } from '../../sync/openPricesSync.js';

export async function syncOpenPricesJob(): Promise<void> {
  console.info('💰 [JOB] Starting Open Prices sync...');

  try {
    const result = await openPricesSync.syncTerritories();
    console.info('✅ [JOB] Open Prices sync completed:', result);
  } catch (error) {
    console.error('❌ [JOB] Open Prices sync failed:', error);
    throw error;
  }
}
