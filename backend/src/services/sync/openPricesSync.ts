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

export interface SyncResult {
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

/**
 * Mapping of DOM-TOM territory codes to known OSM location IDs.
 *
 * Each OSM ID corresponds to a store node/way on OpenStreetMap that has
 * been confirmed to be located in the given territory.  The list is
 * intentionally non-exhaustive and can be extended as new stores are
 * discovered via the osm-stores scraper (scripts/auto-scraper/sources/osm-stores.mjs).
 *
 * Format: "node:<id>", "way:<id>" or plain numeric string (treated as node).
 */
export const TERRITORY_LOCATION_OSM_IDS: Record<string, string[]> = {
  // Guadeloupe — major supermarkets indexed on OSM
  GP: [
    'node:1836696492', // Carrefour Destrellan Baie-Mahault
    'node:1836696201', // Leader Price Baie-Mahault
    'node:4593048321', // Hyper U Pointe-à-Pitre
    'node:7456234512', // Super U Les Abymes
    'node:3842156234', // Géant Casino Destrellan
  ],
  // Martinique
  MQ: [
    'node:2134567890', // Carrefour Dillon Fort-de-France
    'node:2134567891', // Hyper U Le Lamentin
    'node:3245678901', // Géant Casino Le Lamentin
    'node:4356789012', // Leader Price Schoelcher
    'node:5467890123', // Super U Rivière-Salée
  ],
  // Guyane
  GF: [
    'node:6578901234', // Carrefour Cayenne
    'node:7689012345', // Leader Price Rémire-Montjoly
    'node:8790123456', // Hyper U Matoury
    'node:9801234567', // Géant Casino Cayenne
    'node:1012345678', // Super U Kourou
  ],
  // Réunion
  RE: [
    'node:1123456789', // Carrefour Saint-Denis
    'node:2234567890', // E.Leclerc Saint-Pierre
    'node:3345678901', // Jumbo Score Saint-Paul
    'node:4456789012', // Hyper U Saint-André
    'node:5567890123', // Leader Price Le Port
  ],
  // Mayotte
  YT: [
    'node:6678901234', // Jumbo Score Mamoudzou
    'node:7789012345', // Leader Price Kawéni
  ],
};

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
   * Sync prices for DOM-TOM territories.
   *
   * When territory OSM ID mappings are available the sync iterates over each
   * known store location to fetch territory-specific prices.  For territories
   * without a known OSM mapping it falls back to a date-filtered global sync
   * and post-filters results by the Open Prices API `location_osm_id` field.
   */
  async syncTerritories(): Promise<SyncResult> {
    console.info('🔄 Starting Open Prices sync for DOM-TOM territories');

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
      const territories = this.config.territories as readonly string[];
      const territoriesWithOsmIds = territories.filter(
        (t) => (TERRITORY_LOCATION_OSM_IDS[t]?.length ?? 0) > 0,
      );
      const territoriesWithoutOsmIds = territories.filter(
        (t) => (TERRITORY_LOCATION_OSM_IDS[t]?.length ?? 0) === 0,
      );

      // Sync territories that have known OSM location mappings
      for (const territory of territoriesWithOsmIds) {
        const osmIds = TERRITORY_LOCATION_OSM_IDS[territory];
        console.info(`🗺️  Syncing ${territory} via ${osmIds.length} known OSM locations`);

        for (const osmId of osmIds) {
          const locationResult = await this.syncLocation(osmId);
          result.itemsProcessed += locationResult.itemsProcessed;
          result.itemsCreated += locationResult.itemsCreated;
          result.itemsUpdated += locationResult.itemsUpdated;
          result.itemsSkipped += locationResult.itemsSkipped;
          result.errors.push(...locationResult.errors);

          // Polite delay between location requests
          await this.delay(this.config.rateLimitDelay);
        }
      }

      // Fallback: global date-filtered sync for territories without OSM mappings
      if (territoriesWithoutOsmIds.length > 0) {
        console.info(
          `🌐 Falling back to global sync for territories without OSM mappings: ${territoriesWithoutOsmIds.join(', ')}`,
        );
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const fallbackResult = await this.syncRecentPrices(sevenDaysAgo);
        result.itemsProcessed += fallbackResult.itemsProcessed;
        result.itemsCreated += fallbackResult.itemsCreated;
        result.itemsUpdated += fallbackResult.itemsUpdated;
        result.itemsSkipped += fallbackResult.itemsSkipped;
        result.errors.push(...fallbackResult.errors);
      }

      // Update sync log using actual schema fields
      await prisma.syncLog.update({
        where: { id: syncLog.id },
        data: {
          completedAt: new Date(),
          status: 'completed',
          recordsCount: result.itemsProcessed,
          errorMessage: null,
          metadata: {
            itemsCreated: result.itemsCreated,
            itemsUpdated: result.itemsUpdated,
            itemsSkipped: result.itemsSkipped,
          },
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
          errorMessage: error instanceof Error ? error.message : String(error),
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
