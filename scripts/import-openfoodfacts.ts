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
        
        // Note: This assumes a Brand exists. In a real scenario, you'd need to:
        // 1. Either create a default brand
        // 2. Or associate products with existing brands
        // 3. Or skip brand requirement for now
        
        // For this implementation, we'll skip the actual database insert
        // as it requires proper brand setup. Instead, log what would be imported.
        
        console.log(`Would import: ${offProduct.code} - ${offProduct.product_name || 'Unknown'}`);
        
        /* TODO: Uncomment when database and brands are properly configured.
         * Requirements before enabling:
         * 1. Ensure Brand entities exist in the database
         * 2. Either create a default brand or associate products with existing brands
         * 3. Update brandId below to reference a valid Brand.id
         * 
         * Note: The Product model requires a brandId foreign key.
         * You can either:
         * - Create a generic "Open Food Facts" brand for imported products
         * - Map products to specific brands based on offProduct.brands
         * - Skip products without matching brands
         */
        
        /* Example database insert (uncomment and configure):
        await prisma.product.create({
          data: {
            brandId: 'YOUR_BRAND_ID', // Replace with valid brand ID
            name: offProduct.product_name || 'Produit sans nom',
            category: offProduct.categories?.split(',')[0]?.trim() || 'Autre',
            barcode: offProduct.code,
            imageUrl: offProduct.image_url || offProduct.image_small_url || null,
            description: offProduct.quantity || null,
            isActive: true,
          },
        });
        */
        
        imported++;
        
        if (imported % 100 === 0) {
          console.log(`✅ Processed ${imported} products...`);
        }
      } catch (error) {
        errors++;
        console.error(`❌ Error importing ${offProduct.code}:`, error instanceof Error ? error.message : String(error));
      }
    }
    
    console.log(`\n✅ Import simulation complete!`);
    console.log(`   📊 Would import: ${imported}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   ❌ Errors: ${errors}`);
    console.log(`\n⚠️  Note: Actual database insert is commented out.`);
    console.log(`   To enable, uncomment the prisma.product.create() call`);
    console.log(`   and ensure proper brand configuration exists.`);
    
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
