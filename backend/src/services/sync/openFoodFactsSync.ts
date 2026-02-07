/**
 * Open Food Facts Synchronization Service
 * 
 * Syncs products from Open Food Facts API
 * API Documentation: https://openfoodfacts.github.io/openfoodfacts-server/api/
 */

import axios, { AxiosInstance } from 'axios';
import prisma from '../../database/prisma.js';
import { SYNC_CONFIG } from '../../config/syncConfig.js';
import {
  createProductFromOpenFoodFacts,
  OpenFoodFactsProduct,
} from '../products/autoProductCreation.js';

interface SyncResult {
  itemsProcessed: number;
  itemsCreated: number;
  itemsUpdated: number;
  itemsSkipped: number;
  errors: string[];
}

export class OpenFoodFactsSync {
  private client: AxiosInstance;
  private config = SYNC_CONFIG.openFoodFacts;

  constructor() {
    this.client = axios.create({
      baseURL: this.config.apiUrl,
      headers: {
        'User-Agent': this.config.userAgent,
      },
      timeout: SYNC_CONFIG.sync.timeout,
    });
  }

  /**
   * Sync products for DOM-TOM territories
   */
  async syncTerritories(): Promise<SyncResult> {
    console.info('🔄 Starting Open Food Facts sync for DOM-TOM territories');

    const syncLog = await prisma.syncLog.create({
      data: {
        source: 'OPENFOODFACTS',
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
      // Sync each territory
      for (const territory of this.config.territories) {
        console.info(`🌍 Syncing territory: ${territory}`);
        const territoryResult = await this.syncTerritory(territory);
        
        result.itemsProcessed += territoryResult.itemsProcessed;
        result.itemsCreated += territoryResult.itemsCreated;
        result.itemsUpdated += territoryResult.itemsUpdated;
        result.itemsSkipped += territoryResult.itemsSkipped;
        result.errors.push(...territoryResult.errors);

        // Rate limiting between territories
        await this.delay(this.config.rateLimitDelay * 2);
      }

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

      console.info('✅ Open Food Facts sync completed:', result);
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

      console.error('❌ Open Food Facts sync failed:', error);
      throw error;
    }
  }

  /**
   * Sync products for a specific territory
   */
  private async syncTerritory(territory: string): Promise<SyncResult> {
    const result: SyncResult = {
      itemsProcessed: 0,
      itemsCreated: 0,
      itemsUpdated: 0,
      itemsSkipped: 0,
      errors: [],
    };

    // Search for products with territory in name or categories
    const searchQueries = [
      `countries:${territory}`,
      `origins:${territory}`,
    ];

    for (const query of searchQueries) {
      try {
        const products = await this.searchProducts(query);
        
        for (const product of products) {
          result.itemsProcessed++;

          try {
            const created = await createProductFromOpenFoodFacts(product);
            if (created) {
              result.itemsCreated++;
            } else {
              result.itemsSkipped++;
            }

            // Rate limiting
            await this.delay(this.config.rateLimitDelay);
          } catch (error) {
            result.errors.push(
              `Error creating product ${product.code}: ${error instanceof Error ? error.message : String(error)}`
            );
          }
        }
      } catch (error) {
        result.errors.push(
          `Error searching territory ${territory}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    return result;
  }

  /**
   * Search products in Open Food Facts
   */
  private async searchProducts(
    query: string,
    page: number = 1
  ): Promise<OpenFoodFactsProduct[]> {
    try {
      const response = await this.client.get('/search', {
        params: {
          search_terms: query,
          page,
          page_size: this.config.batchSize,
          json: 1,
        },
      });

      if (!response.data || !response.data.products) {
        return [];
      }

      return response.data.products.map((p: any) => ({
        code: p.code || p._id,
        product_name: p.product_name || p.product_name_fr || '',
        brands: p.brands || '',
        categories: p.categories || '',
        quantity: p.quantity || '',
        image_url: p.image_url || p.image_front_url || '',
        nutriscore_grade: p.nutriscore_grade || '',
        ecoscore_grade: p.ecoscore_grade || '',
      }));
    } catch (error) {
      console.error('Error searching products:', error);
      return [];
    }
  }

  /**
   * Get product by barcode
   */
  async getProductByBarcode(barcode: string): Promise<OpenFoodFactsProduct | null> {
    try {
      const response = await this.client.get(`/product/${barcode}.json`);

      if (!response.data || !response.data.product) {
        return null;
      }

      const p = response.data.product;
      return {
        code: p.code || barcode,
        product_name: p.product_name || p.product_name_fr || '',
        brands: p.brands || '',
        categories: p.categories || '',
        quantity: p.quantity || '',
        image_url: p.image_url || p.image_front_url || '',
        nutriscore_grade: p.nutriscore_grade || '',
        ecoscore_grade: p.ecoscore_grade || '',
      };
    } catch (error) {
      console.error(`Error fetching product ${barcode}:`, error);
      return null;
    }
  }

  /**
   * Sync products by category
   */
  async syncByCategory(category: string): Promise<SyncResult> {
    console.info(`🔄 Syncing category: ${category}`);

    const result: SyncResult = {
      itemsProcessed: 0,
      itemsCreated: 0,
      itemsUpdated: 0,
      itemsSkipped: 0,
      errors: [],
    };

    let page = 1;
    let hasMore = true;

    while (hasMore && page <= SYNC_CONFIG.sync.maxPagesPerCategory) {
      // Limit based on config
      try {
        const products = await this.searchProducts(category, page);

        if (products.length === 0) {
          hasMore = false;
          break;
        }

        for (const product of products) {
          result.itemsProcessed++;

          try {
            const created = await createProductFromOpenFoodFacts(product);
            if (created) {
              result.itemsCreated++;
            } else {
              result.itemsSkipped++;
            }

            // Rate limiting
            await this.delay(this.config.rateLimitDelay);
          } catch (error) {
            result.errors.push(
              `Error creating product ${product.code}: ${error instanceof Error ? error.message : String(error)}`
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
   * Delay helper for rate limiting
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const openFoodFactsSync = new OpenFoodFactsSync();
