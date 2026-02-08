/**
 * Open Prices Synchronization Service
 * 
 * Syncs prices from Open Prices API (Open Food Facts project)
 * API Documentation: https://prices.openfoodfacts.org/api/docs
 */

import axios, { AxiosInstance } from 'axios';
import prisma from '../../database/prisma.js';
import { SYNC_CONFIG } from '../../config/syncConfig.js';
import {
  createProductFromOpenPrices,
  OpenPriceProduct,
} from '../products/autoProductCreation.js';

interface SyncResult {
  itemsProcessed: number;
  itemsCreated: number;
  itemsUpdated: number;
  itemsSkipped: number;
  errors: string[];
}

interface OpenPricesResponse {
  items: Array<{
    product_code: string;
    product_name?: string;
    price: number;
    currency: string;
    location_osm_id?: string;
    date: string;
  }>;
  total: number;
  page: number;
  size: number;
}

export class OpenPricesSync {
  private client: AxiosInstance;
  private config = SYNC_CONFIG.openPrices;

  constructor() {
    this.client = axios.create({
      baseURL: this.config.apiUrl,
      timeout: SYNC_CONFIG.sync.timeout,
    });
  }

  /**
   * Sync prices for DOM-TOM territories
   */
  async syncTerritories(): Promise<SyncResult> {
    console.info('🔄 Starting Open Prices sync for DOM-TOM territories');

    // TODO: Implement territory-specific filtering once location_osm_id mappings are available
    // Currently syncs recent prices globally, which may include non-DOM-TOM data
    // See: https://prices.openfoodfacts.org/api/docs for location filtering options

    const syncLog = await prisma.syncLog.create({
      data: {
        source: 'OPENPRICES',
        startedAt: new Date(),
        status: 'running',
      },
    });

    const result: SyncResult = {
      itemsProcessed: 0,
      itemsCreated: 0,
      itemsUpdated: 0,
      itemsSkipped: 0,
      errors: [],
    };

    try {
      // Sync recent prices (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const territoryResult = await this.syncRecentPrices(sevenDaysAgo);

      result.itemsProcessed += territoryResult.itemsProcessed;
      result.itemsCreated += territoryResult.itemsCreated;
      result.itemsUpdated += territoryResult.itemsUpdated;
      result.itemsSkipped += territoryResult.itemsSkipped;
      result.errors.push(...territoryResult.errors);

      // Update sync log
      await prisma.syncLog.update({
        where: { id: syncLog.id },
        data: {
          completedAt: new Date(),
          status: 'completed',
          itemsProcessed: result.itemsProcessed,
          itemsCreated: result.itemsCreated,
          itemsUpdated: result.itemsUpdated,
          itemsSkipped: result.itemsSkipped,
          errors: result.errors.length > 0 ? result.errors : undefined,
        },
      });

      console.info('✅ Open Prices sync completed:', result);
      return result;
    } catch (error) {
      // Update sync log with error
      await prisma.syncLog.update({
        where: { id: syncLog.id },
        data: {
          completedAt: new Date(),
          status: 'failed',
          errors: [error instanceof Error ? error.message : String(error)],
        },
      });

      console.error('❌ Open Prices sync failed:', error);
      throw error;
    }
  }

  /**
   * Sync recent prices
   */
  private async syncRecentPrices(since: Date): Promise<SyncResult> {
    const result: SyncResult = {
      itemsProcessed: 0,
      itemsCreated: 0,
      itemsUpdated: 0,
      itemsSkipped: 0,
      errors: [],
    };

    let page = 1;
    let hasMore = true;

    while (hasMore && page <= SYNC_CONFIG.sync.maxPagesPerSync) {
      // Limit based on config
      try {
        const prices = await this.fetchPrices({
          date_gte: since.toISOString().split('T')[0],
          page,
          size: this.config.batchSize,
        });

        if (!prices || prices.length === 0) {
          break;
        }

        for (const priceData of prices) {
          result.itemsProcessed++;

          try {
            const created = await createProductFromOpenPrices(priceData);
            if (created) {
              result.itemsCreated++;
            } else {
              result.itemsSkipped++;
            }

            // Rate limiting
            await this.delay(this.config.rateLimitDelay);
          } catch (error) {
            result.errors.push(
              `Error processing price for ${priceData.product_code}: ${error instanceof Error ? error.message : String(error)}`
            );
          }
        }

        page++;
        await this.delay(this.config.rateLimitDelay * 2); // Extra delay between pages
      } catch (error) {
        result.errors.push(
          `Error fetching page ${page}: ${error instanceof Error ? error.message : String(error)}`
        );
        hasMore = false;
      }
    }

    return result;
  }

  /**
   * Fetch prices from API
   */
  private async fetchPrices(params: {
    date_gte?: string;
    location_osm_id?: string;
    page?: number;
    size?: number;
  }): Promise<OpenPriceProduct[]> {
    try {
      const response = await this.client.get<OpenPricesResponse>('/prices', {
        params,
      });

      if (!response.data || !response.data.items) {
        return [];
      }

      return response.data.items.map((item) => ({
        product_code: item.product_code,
        product_name: item.product_name,
        price: item.price,
        currency: item.currency,
        location_osm_id: item.location_osm_id,
        date: item.date,
      }));
    } catch (error) {
      console.error('Error fetching prices:', error);
      return [];
    }
  }

  /**
   * Fetch prices for a specific product
   */
  async fetchProductPrices(productCode: string): Promise<OpenPriceProduct[]> {
    try {
      const response = await this.client.get<OpenPricesResponse>('/prices', {
        params: {
          product_code: productCode,
          size: 100,
        },
      });

      if (!response.data || !response.data.items) {
        return [];
      }

      return response.data.items.map((item) => ({
        product_code: item.product_code,
        product_name: item.product_name,
        price: item.price,
        currency: item.currency,
        location_osm_id: item.location_osm_id,
        date: item.date,
      }));
    } catch (error) {
      console.error(`Error fetching prices for product ${productCode}:`, error);
      return [];
    }
  }

  /**
   * Sync prices for a specific location
   */
  async syncLocation(locationOsmId: string): Promise<SyncResult> {
    console.info(`🔄 Syncing prices for location: ${locationOsmId}`);

    const result: SyncResult = {
      itemsProcessed: 0,
      itemsCreated: 0,
      itemsUpdated: 0,
      itemsSkipped: 0,
      errors: [],
    };

    try {
      const prices = await this.fetchPrices({
        location_osm_id: locationOsmId,
        size: this.config.batchSize,
      });

      for (const priceData of prices) {
        result.itemsProcessed++;

        try {
          const created = await createProductFromOpenPrices(priceData);
          if (created) {
            result.itemsCreated++;
          } else {
            result.itemsSkipped++;
          }

          // Rate limiting
          await this.delay(this.config.rateLimitDelay);
        } catch (error) {
          result.errors.push(
            `Error processing price for ${priceData.product_code}: ${error instanceof Error ? error.message : String(error)}`
          );
        }
      }

      return result;
    } catch (error) {
      result.errors.push(
        `Error syncing location ${locationOsmId}: ${error instanceof Error ? error.message : String(error)}`
      );
      return result;
    }
  }

  /**
   * Delay helper for rate limiting
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const openPricesSync = new OpenPricesSync();
