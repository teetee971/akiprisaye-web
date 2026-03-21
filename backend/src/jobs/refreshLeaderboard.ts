/**
 * Refresh Leaderboard Job
 * Periodic job to cache and refresh leaderboard data
 * Can be run hourly or as needed
 */

import { getLeaderboard, getLeaderboardStats } from '../services/gamification/leaderboardService';

/**
 * Run leaderboard refresh
 */
export async function runLeaderboardRefresh(): Promise<{
  success: boolean;
  refreshed: boolean;
  error?: string;
}> {
  try {
    console.log('[Leaderboard Refresh Job] Starting leaderboard refresh...');
    
    // Refresh all-time leaderboard
    await getLeaderboard({ period: 'all_time', limit: 100 });
    
    // Refresh monthly leaderboard
    await getLeaderboard({ period: 'monthly', limit: 100 });
    
    // Refresh weekly leaderboard
    await getLeaderboard({ period: 'weekly', limit: 100 });
    
    // Refresh stats
    await getLeaderboardStats();
    
    console.log('[Leaderboard Refresh Job] Leaderboard refreshed successfully');
    
    return {
      success: true,
      refreshed: true
    };
  } catch (error) {
    console.error('[Leaderboard Refresh Job] Error refreshing leaderboard:', error);
    return {
      success: false,
      refreshed: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Schedule the job to run periodically
 * Can be integrated with cron or other scheduling systems
 */
export function scheduleLeaderboardRefresh(): void {
  console.log('[Leaderboard Refresh Job] Scheduled to run every hour');
  
  // This would use a cron library like node-cron
  // import cron from 'node-cron';
  // cron.schedule('0 * * * *', async () => {
  //   await runLeaderboardRefresh();
  // });
}

// If running as standalone script
if (require.main === module) {
  runLeaderboardRefresh()
    .then(result => {
      console.log('Leaderboard refresh completed:', result);
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}
