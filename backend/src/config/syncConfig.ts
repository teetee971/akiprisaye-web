/**
 * Configuration for automatic product synchronization
 * 
 * Synchronization sources:
 * - Open Food Facts API
 * - Open Prices API
 * - OCR from receipts
 */

export const SYNC_CONFIG = {
  openFoodFacts: {
    apiUrl: 'https://world.openfoodfacts.org/api/v2',
    searchUrl: 'https://world.openfoodfacts.org/cgi/search.pl',
    userAgent: 'AKiPriSaYe/1.0 (contact@akiprisaye.com)',
    batchSize: 100,
    rateLimit: 100, // requests per minute
    rateLimitDelay: 600, // milliseconds between requests (100 requests/min = 600ms)
    categories: [
      'en:beverages',
      'en:dairy',
      'en:groceries',
      'en:snacks',
      'en:plant-based-foods',
      'en:meats',
      'en:seafood',
      'en:frozen-foods',
      'en:breakfast',
      'en:desserts',
    ],
    territories: ['gp', 'mq', 'gf', 're', 'yt'], // DOM-TOM territories
  },

  openPrices: {
    apiUrl: 'https://prices.openfoodfacts.org/api/v1',
    batchSize: 500,
    rateLimit: 60, // requests per minute
    rateLimitDelay: 1000, // milliseconds between requests (60 requests/min = 1000ms)
    territories: ['GP', 'MQ', 'GF', 'RE', 'YT'], // DOM-TOM location codes
  },

  scheduler: {
    timezone: 'America/Guadeloupe',
    jobs: {
      syncOpenFoodFacts: '0 3 * * *', // 3:00 AM every day
      syncOpenPrices: '0 */6 * * *', // every 6 hours
      processOcrQueue: '*/5 * * * *', // every 5 minutes
      cleanupDuplicates: '0 4 * * 0', // 4:00 AM on Sundays
    },
  },

  deduplication: {
    fuzzyThreshold: 0.85, // Similarity threshold (0-1)
    maxCandidates: 10, // Maximum number of candidates to check
    minNameLength: 3, // Minimum name length for fuzzy matching
  },

  validation: {
    autoApproveThreshold: 0.95, // Auto-approve if similarity >= 0.95
    requiresReviewSources: ['OCR', 'CITIZEN'], // Sources that require manual review
  },

  sync: {
    maxRetries: 3,
    retryDelay: 5000, // milliseconds
    timeout: 30000, // milliseconds
    maxPagesPerCategory: 10, // Maximum pages to fetch per category
    maxPagesPerSync: 20, // Maximum pages to fetch per sync
  },
} as const;

export type SyncConfig = typeof SYNC_CONFIG;
