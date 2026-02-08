/**
 * Generate Weekly Challenges Job
 * Weekly job to generate new challenges
 * Should be run once per week (e.g., Monday morning)
 */

import { generateWeeklyChallenges, generateDailyChallenges } from '../services/gamification/challengeService';

/**
 * Run weekly challenge generation
 */
export async function runWeeklyChallengeGeneration(): Promise<{
  success: boolean;
  challengesCreated: number;
  error?: string;
}> {
  try {
    console.log('[Weekly Challenges Job] Starting weekly challenge generation...');
    
    const challenges = await generateWeeklyChallenges();
    
    console.log(`[Weekly Challenges Job] Generated ${challenges.length} weekly challenges`);
    
    return {
      success: true,
      challengesCreated: challenges.length
    };
  } catch (error) {
    console.error('[Weekly Challenges Job] Error generating challenges:', error);
    return {
      success: false,
      challengesCreated: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Run daily challenge generation
 */
export async function runDailyChallengeGeneration(): Promise<{
  success: boolean;
  challengesCreated: number;
  error?: string;
}> {
  try {
    console.log('[Daily Challenges Job] Starting daily challenge generation...');
    
    const challenges = await generateDailyChallenges();
    
    console.log(`[Daily Challenges Job] Generated ${challenges.length} daily challenges`);
    
    return {
      success: true,
      challengesCreated: challenges.length
    };
  } catch (error) {
    console.error('[Daily Challenges Job] Error generating challenges:', error);
    return {
      success: false,
      challengesCreated: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Schedule the job to run weekly
 * Can be integrated with cron or other scheduling systems
 */
export function scheduleWeeklyChallenges(): void {
  // Example: Run at 6 AM every Monday
  const MONDAY_6AM = '0 6 * * 1';
  
  console.log('[Weekly Challenges Job] Scheduled to run every Monday at 6 AM');
  
  // This would use a cron library like node-cron
  // import cron from 'node-cron';
  // cron.schedule(MONDAY_6AM, async () => {
  //   await runWeeklyChallengeGeneration();
  // });
}

/**
 * Schedule daily challenges
 */
export function scheduleDailyChallenges(): void {
  // Example: Run at 6 AM every day
  const DAILY_6AM = '0 6 * * *';
  
  console.log('[Daily Challenges Job] Scheduled to run every day at 6 AM');
  
  // This would use a cron library like node-cron
  // import cron from 'node-cron';
  // cron.schedule(DAILY_6AM, async () => {
  //   await runDailyChallengeGeneration();
  // });
}

// If running as standalone script
if (require.main === module) {
  const type = process.argv[2] || 'weekly';
  
  const runJob = type === 'daily' ? runDailyChallengeGeneration : runWeeklyChallengeGeneration;
  
  runJob()
    .then(result => {
      console.log('Challenge generation completed:', result);
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}
