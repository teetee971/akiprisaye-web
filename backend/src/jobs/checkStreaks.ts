/**
 * Check Streaks Job
 * Daily job to check and expire inactive streaks
 * Should be run once per day (e.g., at midnight)
 */

import { checkStreakExpiry } from '../services/gamification/streakService';

/**
 * Run the streak expiry check
 */
export async function runStreakCheck(): Promise<{
  success: boolean;
  expiredCount: number;
  error?: string;
}> {
  try {
    console.log('[Streak Job] Starting streak expiry check...');
    
    const expiredCount = await checkStreakExpiry();
    
    console.log(`[Streak Job] Expired ${expiredCount} streaks`);
    
    return {
      success: true,
      expiredCount
    };
  } catch (error) {
    console.error('[Streak Job] Error checking streaks:', error);
    return {
      success: false,
      expiredCount: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Schedule the job to run daily
 * Can be integrated with cron or other scheduling systems
 */
export function scheduleStreakCheck(): void {
  // Example: Run at midnight every day
  const MIDNIGHT = '0 0 * * *';
  
  console.log('[Streak Job] Scheduled to run daily at midnight');
  
  // This would use a cron library like node-cron
  // import cron from 'node-cron';
  // cron.schedule(MIDNIGHT, async () => {
  //   await runStreakCheck();
  // });
}

// If running as standalone script
if (require.main === module) {
  runStreakCheck()
    .then(result => {
      console.log('Streak check completed:', result);
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}
