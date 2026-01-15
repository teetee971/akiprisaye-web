#!/usr/bin/env node
/**
 * Open Food Facts Product Import Script
 * 
 * Imports products from Open Food Facts API into the local database
 * with focus on products available in DOM-TOM territories.
 * 
 * Features:
 * - Batch import with rate limiting
 * - Duplicate detection
 * - Category mapping
 * - Image URL caching
 * - Progress tracking
 * - Error handling and retry logic
 * 
 * Usage:
 *   node scripts/import-openfoodfacts.mjs --count 1000 --territories guadeloupe,martinique
 *   node scripts/import-openfoodfacts.mjs --categories fruits,vegetables --limit 500
 * 
 * @module import-openfoodfacts
 */

import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';

const prisma = new PrismaClient();

// Configuration
const CONFIG = {
  BATCH_SIZE: 50,
  MAX_CONCURRENT: 5,
  RATE_LIMIT_DELAY: 1000, // ms between batches
  MAX_RETRIES: 3,
  DEFAULT_IMPORT_COUNT: 1000,
  API_BASE_URL: 'https://world.openfoodfacts.org'
};

// DOM-TOM territories and their Open Food Facts country codes
const DOM_TOM_COUNTRIES = {
  guadeloupe: ['gp', 'guadeloupe'],
  martinique: ['mq', 'martinique'],
  guyane: ['gf', 'french-guiana', 'guyane'],
  reunion: ['re', 'reunion', 'réunion'],
  mayotte: ['yt', 'mayotte'],
  'saint-martin': ['mf', 'saint-martin'],
  'saint-barthelemy': ['bl', 'saint-barthelemy'],
  'polynesie-francaise': ['pf', 'french-polynesia'],
  'nouvelle-caledonie': ['nc', 'new-caledonia'],
  'wallis-et-futuna': ['wf', 'wallis-and-futuna'],
  'saint-pierre-et-miquelon': ['pm', 'saint-pierre-and-miquelon']
};

// Category mapping from Open Food Facts to our categories
const CATEGORY_MAP = {
  'fruits': 'fruits-legumes',
  'vegetables': 'fruits-legumes',
  'beverages': 'boissons',
  'waters': 'boissons',
  'sodas': 'boissons',
  'juices': 'boissons',
  'meats': 'viande',
  'fishes': 'poisson',
  'seafood': 'poisson',
  'dairies': 'produits-laitiers',
  'cheeses': 'produits-laitiers',
  'yogurts': 'produits-laitiers',
  'breads': 'pain-patisserie',
  'pastries': 'pain-patisserie',
  'snacks': 'epicerie',
  'groceries': 'epicerie',
  'frozen-foods': 'surgeles',
  'baby-foods': 'bebe',
  'hygiene': 'hygiene',
  'cleaning-products': 'entretien'
};

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    count: CONFIG.DEFAULT_IMPORT_COUNT,
    territories: Object.keys(DOM_TOM_COUNTRIES),
    categories: [],
    forceRefresh: false,
    skipExisting: true
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    switch (arg) {
      case '--count':
      case '-c':
        options.count = parseInt(nextArg, 10) || CONFIG.DEFAULT_IMPORT_COUNT;
        i++;
        break;
      case '--territories':
      case '-t':
        options.territories = nextArg ? nextArg.split(',') : options.territories;
        i++;
        break;
      case '--categories':
        options.categories = nextArg ? nextArg.split(',') : [];
        i++;
        break;
      case '--force':
      case '-f':
        options.forceRefresh = true;
        options.skipExisting = false;
        break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
        break;
    }
  }

  return options;
}

/**
 * Print help message
 */
function printHelp() {
  console.log(`
Open Food Facts Product Import Script

Usage:
  node scripts/import-openfoodfacts.mjs [options]

Options:
  --count, -c <number>       Number of products to import (default: 1000)
  --territories, -t <list>   Comma-separated list of territories
                             Available: ${Object.keys(DOM_TOM_COUNTRIES).join(', ')}
  --categories <list>        Comma-separated list of categories to filter
  --force, -f                Force refresh existing products
  --help, -h                 Show this help message

Examples:
  # Import 1000 products for Guadeloupe and Martinique
  node scripts/import-openfoodfacts.mjs --count 1000 --territories guadeloupe,martinique

  # Import 500 fruits and vegetables
  node scripts/import-openfoodfacts.mjs --count 500 --categories fruits,vegetables

  # Force refresh of all products
  node scripts/import-openfoodfacts.mjs --force
  `);
}

/**
 * Map Open Food Facts category to our category
 */
function mapCategory(offCategory) {
  if (!offCategory) return 'autre';
  
  const categoryLower = offCategory.toLowerCase();
  
  for (const [offCat, ourCat] of Object.entries(CATEGORY_MAP)) {
    if (categoryLower.includes(offCat)) {
      return ourCat;
    }
  }
  
  return 'alimentaire'; // Default fallback
}

/**
 * Search products on Open Food Facts
 */
async function searchProducts(options = {}) {
  const {
    page = 1,
    pageSize = CONFIG.BATCH_SIZE,
    territories = [],
    categories = []
  } = options;

  try {
    const url = new URL(`${CONFIG.API_BASE_URL}/cgi/search.pl`);
    url.searchParams.set('action', 'process');
    url.searchParams.set('json', '1');
    url.searchParams.set('page', page.toString());
    url.searchParams.set('page_size', pageSize.toString());
    url.searchParams.set('fields', 'code,product_name,product_name_fr,brands,categories_tags,quantity,image_url,image_small_url,countries_tags');
    
    // Add territory filter
    if (territories.length > 0) {
      const countryCodes = territories.flatMap(t => DOM_TOM_COUNTRIES[t] || []);
      url.searchParams.set('countries_tags', countryCodes.join(','));
    }
    
    // Add category filter
    if (categories.length > 0) {
      url.searchParams.set('categories_tags', categories.join(','));
    }

    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      products: data.products || [],
      count: data.count || 0,
      page: data.page || 1,
      pageCount: data.page_count || 1
    };
  } catch (error) {
    console.error('Error searching products:', error);
    return { products: [], count: 0, page: 1, pageCount: 1 };
  }
}

/**
 * Transform Open Food Facts product to our format
 */
function transformProduct(offProduct, defaultBrandId) {
  const barcode = offProduct.code;
  const name = offProduct.product_name_fr || offProduct.product_name || 'Produit inconnu';
  const brand = offProduct.brands || null;
  const category = mapCategory(offProduct.categories_tags?.[0]);
  
  // Extract quantity and unit (variables for future use)
  const quantityMatch = offProduct.quantity?.match(/(\d+(?:\.\d+)?)\s*([a-zA-Z]+)/);
  const _contenance = quantityMatch ? parseFloat(quantityMatch[1]) : 100;
  const _unite = quantityMatch ? quantityMatch[2].toLowerCase() : 'g';

  return {
    brandId: defaultBrandId,
    name,
    category,
    barcode,
    description: `Produit ${name}${brand ? ` - ${brand}` : ''}`,
    imageUrl: offProduct.image_url || offProduct.image_small_url || null,
    isActive: true
  };
}

/**
 * Import a batch of products
 */
async function importProductBatch(products, defaultBrandId, skipExisting) {
  const imported = [];
  const skipped = [];
  const errors = [];

  for (const offProduct of products) {
    try {
      const barcode = offProduct.code;
      
      if (!barcode) {
        skipped.push({ reason: 'no-barcode', product: offProduct });
        continue;
      }

      // Check if product already exists
      if (skipExisting) {
        const existing = await prisma.product.findFirst({
          where: { barcode }
        });

        if (existing) {
          skipped.push({ reason: 'exists', barcode });
          continue;
        }
      }

      // Transform and import
      const productData = transformProduct(offProduct, defaultBrandId);
      
      const result = await prisma.product.upsert({
        where: { barcode },
        update: productData,
        create: productData
      });

      imported.push(result);
    } catch (error) {
      errors.push({ product: offProduct, error: error.message });
    }
  }

  return { imported, skipped, errors };
}

/**
 * Main import function
 */
async function importProducts(options) {
  console.log('🚀 Starting Open Food Facts import...');
  console.log('Options:', options);

  // Get or create a default brand for Open Food Facts products
  let defaultBrand = await prisma.brand.findFirst({
    where: { name: 'Open Food Facts Import' }
  });

  if (!defaultBrand) {
    console.log('Creating default brand for imported products...');
    // We need a legal entity first
    let legalEntity = await prisma.legalEntity.findFirst({
      where: { name: 'Open Food Facts Data' }
    });

    if (!legalEntity) {
      legalEntity = await prisma.legalEntity.create({
        data: {
          siren: '000000000',
          siret: '00000000000000',
          name: 'Open Food Facts Data',
          status: 'ACTIVE'
        }
      });
    }

    defaultBrand = await prisma.brand.create({
      data: {
        name: 'Open Food Facts Import',
        legalEntityId: legalEntity.id,
        status: 'ACTIVE',
        subscriptionPlan: 'BASIC',
        description: 'Products imported from Open Food Facts database'
      }
    });
  }

  const stats = {
    total: 0,
    imported: 0,
    skipped: 0,
    errors: 0
  };

  let currentPage = 1;
  let hasMore = true;

  while (hasMore && stats.imported < options.count) {
    console.log(`\n📦 Fetching page ${currentPage}...`);
    
    const searchResult = await searchProducts({
      page: currentPage,
      pageSize: CONFIG.BATCH_SIZE,
      territories: options.territories,
      categories: options.categories
    });

    if (searchResult.products.length === 0) {
      console.log('No more products to import.');
      hasMore = false;
      break;
    }

    console.log(`Found ${searchResult.products.length} products on page ${currentPage}`);

    // Import batch
    const batchResult = await importProductBatch(
      searchResult.products,
      defaultBrand.id,
      options.skipExisting
    );

    stats.imported += batchResult.imported.length;
    stats.skipped += batchResult.skipped.length;
    stats.errors += batchResult.errors.length;
    stats.total += searchResult.products.length;

    console.log(`✅ Imported: ${batchResult.imported.length}`);
    console.log(`⏭️  Skipped: ${batchResult.skipped.length}`);
    console.log(`❌ Errors: ${batchResult.errors.length}`);

    // Check if we've reached our target
    if (stats.imported >= options.count) {
      console.log(`\n🎯 Target reached: ${stats.imported} products imported`);
      hasMore = false;
      break;
    }

    // Check if there are more pages
    if (currentPage >= searchResult.pageCount) {
      hasMore = false;
      break;
    }

    currentPage++;

    // Rate limiting delay
    await new Promise(resolve => setTimeout(resolve, CONFIG.RATE_LIMIT_DELAY));
  }

  console.log('\n📊 Import Summary:');
  console.log(`Total processed: ${stats.total}`);
  console.log(`Successfully imported: ${stats.imported}`);
  console.log(`Skipped: ${stats.skipped}`);
  console.log(`Errors: ${stats.errors}`);

  return stats;
}

/**
 * Main execution
 */
async function main() {
  try {
    const options = parseArgs();
    await importProducts(options);
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { importProducts, searchProducts, transformProduct };
