/**
 * Sync Orchestrator
 * 
 * Coordinates synchronization from multiple sources
 */

import { openFoodFactsSync } from './openFoodFactsSync.js';
import { openPricesSync } from './openPricesSync.js';

export interface OrchestratedSyncResult {
  openFoodFacts?: {
    success: boolean;
    result?: any;
    error?: string;
  };
  openPrices?: {
    success: boolean;
    result?: any;
    error?: string;
  };
  startedAt: Date;
  completedAt: Date;
  totalDuration: number;
}

export class SyncOrchestrator {
  /**
   * Run full synchronization from all sources
   */
  async syncAll(): Promise<OrchestratedSyncResult> {
    const startedAt = new Date();
    console.info('🚀 Starting full synchronization from all sources');

    const result: OrchestratedSyncResult = {
      startedAt,
      completedAt: new Date(),
      totalDuration: 0,
    };

    // Sync Open Food Facts
    try {
      console.info('📦 Starting Open Food Facts sync...');
      const offResult = await openFoodFactsSync.syncTerritories();
      result.openFoodFacts = {
        success: true,
        result: offResult,
      };
      console.info('✅ Open Food Facts sync completed');
    } catch (error) {
      console.error('❌ Open Food Facts sync failed:', error);
      result.openFoodFacts = {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }

    // Sync Open Prices
    try {
      console.info('💰 Starting Open Prices sync...');
      const opResult = await openPricesSync.syncTerritories();
      result.openPrices = {
        success: true,
        result: opResult,
      };
      console.info('✅ Open Prices sync completed');
    } catch (error) {
      console.error('❌ Open Prices sync failed:', error);
      result.openPrices = {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }

    result.completedAt = new Date();
    result.totalDuration = result.completedAt.getTime() - startedAt.getTime();

    console.info('✅ Full synchronization completed');
    console.info(`⏱️  Total duration: ${result.totalDuration}ms`);

    return result;
  }

  /**
   * Sync only Open Food Facts
   */
  async syncOpenFoodFacts() {
    console.info('📦 Syncing Open Food Facts only...');
    return await openFoodFactsSync.syncTerritories();
  }

  /**
   * Sync only Open Prices
   */
  async syncOpenPrices() {
    console.info('💰 Syncing Open Prices only...');
    return await openPricesSync.syncTerritories();
  }
}

// Export singleton instance
export const syncOrchestrator = new SyncOrchestrator();
