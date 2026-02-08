/**
 * Inflation Dashboard Jobs
 * 
 * Automated tasks for calculating price indices and generating reports.
 */

export { 
  scheduleMonthlyIndexCalculation, 
  runMonthlyCalculationNow 
} from './calculateMonthlyIndex.js';

export { 
  scheduleMonthlyPressKitGeneration, 
  runPressKitGenerationNow 
} from './generatePressKit.js';

/**
 * Initialize all inflation dashboard jobs
 */
export function initializeInflationJobs(): void {
  console.log('\n🚀 Initializing Inflation Dashboard Jobs...');
  
  // Import and schedule jobs
  import('./calculateMonthlyIndex.js').then(({ scheduleMonthlyIndexCalculation }) => {
    scheduleMonthlyIndexCalculation();
  });

  import('./generatePressKit.js').then(({ scheduleMonthlyPressKitGeneration }) => {
    scheduleMonthlyPressKitGeneration();
  });

  console.log('✅ All inflation jobs initialized\n');
}
