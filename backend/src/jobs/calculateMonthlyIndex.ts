/**
 * Monthly Price Index Calculation Job
 * 
 * Runs on the 1st of each month at 2 AM to calculate
 * price indices for all DOM-TOM territories.
 * 
 * Cron schedule: '0 2 1 * *' (1st day of month at 2:00 AM)
 */

import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { calculateAllIndices } from '../services/inflation/priceIndexCalculator.js';
import { 
  getAllCategoriesInflation 
} from '../services/inflation/categoryAnalysisService.js';
import { formatPeriod } from '../config/inflationConfig.js';

const prisma = new PrismaClient();

/**
 * Calculate monthly indices for the current month
 */
async function calculateMonthlyIndices(): Promise<void> {
  const startTime = Date.now();
  
  try {
    console.log('========================================');
    console.log('🗓️  Monthly Index Calculation Job Started');
    console.log(`📅 Timestamp: ${new Date().toISOString()}`);
    console.log('========================================');

    // Get current period (YYYY-MM)
    const period = formatPeriod(new Date());
    console.log(`📊 Calculating indices for period: ${period}`);

    // Calculate price indices for all territories
    console.log('\n📈 Calculating price indices...');
    const indices = await calculateAllIndices(period);
    console.log(`✓ Calculated ${indices.length} territory indices`);

    // Calculate category indices for all territories
    console.log('\n📊 Calculating category indices...');
    let categoryCount = 0;
    
    for (const index of indices) {
      try {
        const categories = await getAllCategoriesInflation(index.territory, period);
        
        // Save category indices to database
        for (const category of categories) {
          await prisma.categoryIndex.upsert({
            where: {
              territory_category_period: {
                territory: index.territory,
                category: category.category,
                period,
              },
            },
            update: {
              indexValue: category.indexValue,
              monthlyChange: category.monthlyChange,
              yearlyChange: category.yearlyChange,
              productCount: category.topIncreases.length + category.topDecreases.length,
            },
            create: {
              territory: index.territory,
              category: category.category,
              period,
              indexValue: category.indexValue,
              monthlyChange: category.monthlyChange,
              yearlyChange: category.yearlyChange,
              productCount: category.topIncreases.length + category.topDecreases.length,
            },
          });
          categoryCount++;
        }
        
        console.log(`  ✓ ${index.territory}: ${categories.length} categories`);
      } catch (error) {
        console.error(`  ✗ ${index.territory}: Failed to calculate categories`, error);
      }
    }
    
    console.log(`✓ Calculated ${categoryCount} category indices`);

    // Calculate overall statistics
    const globalIndex = indices.reduce((sum, idx) => sum + idx.indexValue, 0) / indices.length;
    const globalInflation = indices.reduce((sum, idx) => sum + idx.yearlyChange, 0) / indices.length;

    console.log('\n📊 Global Statistics:');
    console.log(`  • Average Index: ${globalIndex.toFixed(2)}`);
    console.log(`  • Average Inflation: ${globalInflation.toFixed(2)}%`);

    // Save inflation report
    console.log('\n💾 Saving inflation report...');
    await prisma.inflationReport.create({
      data: {
        period,
        globalIndex,
        territoryData: JSON.parse(JSON.stringify(indices)),
        categoryData: {},
        topMovers: {},
        metroComparison: {},
      },
    });
    console.log('✓ Inflation report saved');

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('\n========================================');
    console.log(`✅ Monthly Index Calculation Completed`);
    console.log(`⏱️  Duration: ${duration}s`);
    console.log('========================================\n');
  } catch (error) {
    console.error('\n========================================');
    console.error('❌ Monthly Index Calculation Failed');
    console.error(`⏱️  Duration: ${((Date.now() - startTime) / 1000).toFixed(2)}s`);
    console.error('Error:', error);
    console.error('========================================\n');
    throw error;
  }
}

/**
 * Schedule the monthly calculation job
 */
export function scheduleMonthlyIndexCalculation(): void {
  // Run on the 1st of each month at 2:00 AM
  const schedule = '0 2 1 * *';
  
  console.log(`📅 Scheduling monthly index calculation: ${schedule}`);
  
  cron.schedule(schedule, async () => {
    try {
      await calculateMonthlyIndices();
    } catch (error) {
      console.error('Failed to execute monthly index calculation:', error);
      // In production, you might want to send alerts here
    }
  });

  console.log('✓ Monthly index calculation job scheduled');
}

/**
 * Run calculation immediately (for testing or manual trigger)
 */
export async function runMonthlyCalculationNow(): Promise<void> {
  console.log('🚀 Running monthly index calculation immediately...\n');
  await calculateMonthlyIndices();
}

// If running directly from CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('Running monthly index calculation from CLI...\n');
  runMonthlyCalculationNow()
    .then(() => {
      console.log('✅ Done');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error:', error);
      process.exit(1);
    });
}
