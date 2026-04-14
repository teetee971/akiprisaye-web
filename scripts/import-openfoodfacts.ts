/**
 * Open Food Facts Import Script
 * Mass import products from Open Food Facts API into database
 * 
 * Usage:
 *   npm run import:off -- --territory=GP --limit=1000
 * 
 * Features:
 * - Filters products by country (France for DOM-TOM)
 * - Imports product metadata (name, brand, category, images)
 * - Skips existing products (by EAN)
 * - Progress logging
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface OpenFoodFactsProduct {
  code: string;
  product_name?: string;
  brands?: string;
  categories?: string;
  quantity?: string;
  image_url?: string;
  image_small_url?: string;
}

interface OpenFoodFactsResponse {
  products: OpenFoodFactsProduct[];
  count: number;
  page: number;
  page_size: number;
}

/**
 * Import products from Open Food Facts
 * 
 * @param territory - Territory code (GP, MQ, GF, RE, etc.)
 * @param limit - Maximum number of products to import
 */
async function importProductsFromOpenFoodFacts(
  territory: string,
  limit: number = 1000
): Promise<void> {
  console.log(`🔍 Importing products from Open Food Facts for territory ${territory}...`);
  console.log(`📊 Limit: ${limit} products\n`);
  
  try {
    // Fetch products from Open Food Facts API
    // Filter by France (includes DOM-TOM) and sort by popularity
    const url = new URL('https://world.openfoodfacts.org/cgi/search.pl');
    url.searchParams.set('search_terms', '');
    url.searchParams.set('tagtype_0', 'countries');
    url.searchParams.set('tag_contains_0', 'contains');
    url.searchParams.set('tag_0', 'france');
    url.searchParams.set('sort_by', 'unique_scans_n');
    url.searchParams.set('page_size', Math.min(limit, 1000).toString());
    url.searchParams.set('json', '1');
    
    console.log(`🌐 Fetching from: ${url.toString()}\n`);
    
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: OpenFoodFactsResponse = await response.json();
    const products = data.products || [];
    
    console.log(`📦 Found ${products.length} products from Open Food Facts\n`);
    
    if (products.length === 0) {
      console.log('⚠️  No products found. Exiting.');
      return;
    }
    
    let imported = 0;
    let skipped = 0;
    let errors = 0;
    
    for (const offProduct of products) {
      // Skip products without EAN code
      if (!offProduct.code || offProduct.code.length < 8) {
        skipped++;
        continue;
      }
      
      try {
        // Check if product already exists
        const existing = await prisma.product.findUnique({
          where: { barcode: offProduct.code },
        });

        if (existing) {
          skipped++;
          continue;
        }

        const displayName = offProduct.product_name || 'Produit sans nom';
        const normalizedLabel = displayName.toLowerCase().trim();
        const productKey = `off-${offProduct.code}`;

        await prisma.product.create({
          data: {
            productKey,
            displayName,
            rawLabel: displayName,
            normalizedLabel,
            brand: offProduct.brands?.split(',')[0]?.trim() ?? null,
            category: offProduct.categories?.split(',')[0]?.trim() ?? null,
            barcode: offProduct.code,
            primaryImageUrl: offProduct.image_small_url ?? offProduct.image_url ?? null,
          },
        });

        imported++;

        if (imported % 100 === 0) {
          console.log(`✅ Imported ${imported} products...`);
        }
      } catch (error) {
        errors++;
        console.error(`❌ Error importing ${offProduct.code}:`, error instanceof Error ? error.message : String(error));
      }
    }
    
    console.log(`\n✅ Import complete!`);
    console.log(`   📊 Imported: ${imported}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   ❌ Errors: ${errors}`);
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    throw error;
  }
}

/**
 * Main execution
 */
async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const territoryArg = args.find(a => a.startsWith('--territory='));
  const limitArg = args.find(a => a.startsWith('--limit='));
  
  const territory = territoryArg?.split('=')[1] || 'GP';
  const limit = parseInt(limitArg?.split('=')[1] || '1000');
  
  if (isNaN(limit) || limit < 1) {
    console.error('❌ Invalid limit value. Must be a positive number.');
    process.exit(1);
  }
  
  console.log('═══════════════════════════════════════════════════');
  console.log('   Open Food Facts Import Script');
  console.log('═══════════════════════════════════════════════════\n');
  
  await importProductsFromOpenFoodFacts(territory, limit);
  
  await prisma.$disconnect();
  
  console.log('\n✅ Script completed successfully!\n');
}

// Run the script
main()
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
