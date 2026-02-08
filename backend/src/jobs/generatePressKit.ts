/**
 * Monthly Press Kit Generation Job
 * 
 * Runs on the 1st of each month at 6 AM (after index calculation at 2 AM)
 * to generate comprehensive press kits for media distribution.
 * 
 * Cron schedule: '0 6 1 * *' (1st day of month at 6:00 AM)
 */

import cron from 'node-cron';
import { generatePressKit } from '../services/inflation/pressKitService.js';
import { formatPeriod } from '../config/inflationConfig.js';

/**
 * Generate monthly press kit
 */
async function generateMonthlyPressKit(): Promise<void> {
  const startTime = Date.now();
  
  try {
    console.log('========================================');
    console.log('📰 Monthly Press Kit Generation Started');
    console.log(`📅 Timestamp: ${new Date().toISOString()}`);
    console.log('========================================');

    // Get current period (YYYY-MM)
    const period = formatPeriod(new Date());
    console.log(`📊 Generating press kit for period: ${period}`);

    // Generate the press kit
    console.log('\n📝 Generating press kit...');
    const pressKit = await generatePressKit(period);
    
    // Save to database (imported from pressKitService)
    const { savePressKit } = await import('../services/inflation/pressKitService.js');
    await savePressKit(pressKit);
    console.log('✓ Press kit saved to database');
    
    console.log('\n📊 Press Kit Summary:');
    console.log(`  • Title: ${pressKit.title}`);
    console.log(`  • Period: ${pressKit.period}`);
    console.log(`  • Highlights: ${pressKit.highlights.length}`);
    console.log(`  • Sections: ${pressKit.sections.length}`);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('\n========================================');
    console.log(`✅ Press Kit Generation Completed`);
    console.log(`⏱️  Duration: ${duration}s`);
    console.log('========================================\n');

    return;
  } catch (error) {
    console.error('\n========================================');
    console.error('❌ Press Kit Generation Failed');
    console.error(`⏱️  Duration: ${((Date.now() - startTime) / 1000).toFixed(2)}s`);
    console.error('Error:', error);
    console.error('========================================\n');
    throw error;
  }
}

/**
 * Schedule the monthly press kit generation job
 */
export function scheduleMonthlyPressKitGeneration(): void {
  // Run on the 1st of each month at 6:00 AM (after index calculation)
  const schedule = '0 6 1 * *';
  
  console.log(`📅 Scheduling monthly press kit generation: ${schedule}`);
  
  cron.schedule(schedule, async () => {
    try {
      await generateMonthlyPressKit();
    } catch (error) {
      console.error('Failed to execute monthly press kit generation:', error);
      // In production, you might want to send alerts here
    }
  });

  console.log('✓ Monthly press kit generation job scheduled');
}

/**
 * Run press kit generation immediately (for testing or manual trigger)
 */
export async function runPressKitGenerationNow(): Promise<void> {
  console.log('🚀 Running press kit generation immediately...\n');
  await generateMonthlyPressKit();
}

// If running directly from CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('Running press kit generation from CLI...\n');
  runPressKitGenerationNow()
    .then(() => {
      console.log('✅ Done');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error:', error);
      process.exit(1);
    });
}
