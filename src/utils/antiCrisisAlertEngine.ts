/**
 * antiCrisisAlertEngine.ts — Alert decision logic for Anti-Crisis improvements
 * 
 * Purpose: Decide when to trigger alerts based on score changes
 * Pure function, testable, no side effects
 * 
 * Alert Policy:
 * - Only alert when score improves meaningfully
 * - Prevent spam with state tracking
 * - User must opt-in (checked externally)
 * 
 * Legal Compliance:
 * - No predictions or promises
 * - Descriptive only ("price became more stable")
 * - Factual observations of historical data
 * 
 * @module antiCrisisAlertEngine
 */

import { getAlertState, setAlertState, type AlertState } from '../storage/antiCrisisAlertsStore';
import type { AntiCrisisScore } from '../config/antiCrisisRules';

/**
 * Alert trigger result
 */
export interface AlertTrigger {
  /** Whether to trigger an alert */
  shouldAlert: boolean;
  
  /** Reason for the alert (or why not) */
  reason: string;
  
  /** Type of improvement detected */
  improvementType?: 'became_anticrisis' | 'became_strong' | 'most_resilient';
  
  /** Previous score */
  previousScore?: number;
  
  /** New score */
  newScore: number;
}

/**
 * Minimum time between alerts for the same item (24 hours)
 * Prevents alert fatigue
 */
const MIN_ALERT_INTERVAL_MS = 24 * 60 * 60 * 1000;

/**
 * Check if enough time has passed since last alert
 */
function canAlertAgain(state: AlertState): boolean {
  if (!state.lastAlertAt) return true;
  
  const timeSinceLastAlert = Date.now() - state.lastAlertAt;
  return timeSinceLastAlert >= MIN_ALERT_INTERVAL_MS;
}

/**
 * Determine if an Anti-Crisis alert should be triggered
 * 
 * Alert triggers:
 * 1. Score changes from <2 to ≥2 (becomes Anti-Crisis)
 * 2. Score changes from 2 to 3 (becomes Strong Anti-Crisis)
 * 
 * No alert if:
 * - Score decreases
 * - Score stays the same
 * - Minor fluctuations (e.g., 2 to 2)
 * - Alert was sent too recently (< 24h)
 * 
 * @param id - Unique identifier for the item (basket/product/territory combo)
 * @param newScore - New Anti-Crisis score (0-3)
 * @returns Alert trigger decision with reasoning
 * 
 * @example
 * const trigger = shouldTriggerAntiCrisisAlert('GP_basket-familial', 2);
 * if (trigger.shouldAlert) {
 *   showNotification(trigger.reason);
 * }
 */
export function shouldTriggerAntiCrisisAlert(
  id: string,
  newScore: AntiCrisisScore
): AlertTrigger {
  const state = getAlertState(id);

  // First time seeing this item - just record the score, no alert
  if (state.lastScore === undefined) {
    setAlertState(id, { lastScore: newScore });
    return {
      shouldAlert: false,
      reason: 'First observation, establishing baseline',
      newScore,
    };
  }

  const previousScore = state.lastScore;

  // No change in score - no alert
  if (previousScore === newScore) {
    return {
      shouldAlert: false,
      reason: 'Score unchanged',
      previousScore,
      newScore,
    };
  }

  // Score decreased - no alert (we only alert on improvements)
  if (newScore < previousScore) {
    setAlertState(id, { ...state, lastScore: newScore });
    return {
      shouldAlert: false,
      reason: 'Score decreased (no alert on degradation)',
      previousScore,
      newScore,
    };
  }

  // Check rate limiting
  if (!canAlertAgain(state)) {
    const timeSinceAlert = state.lastAlertAt ? Date.now() - state.lastAlertAt : 0;
    const hoursUntilNext = Math.ceil(
      (MIN_ALERT_INTERVAL_MS - timeSinceAlert) / (60 * 60 * 1000)
    );
    return {
      shouldAlert: false,
      reason: `Rate limited (alert sent recently, next available in ~${hoursUntilNext}h)`,
      previousScore,
      newScore,
    };
  }

  // Trigger 1: Became Anti-Crisis (score went from <2 to ≥2)
  if (previousScore < 2 && newScore >= 2) {
    const alertCount = (state.alertCount || 0) + 1;
    setAlertState(id, {
      lastScore: newScore,
      lastAlertAt: Date.now(),
      alertCount,
    });

    return {
      shouldAlert: true,
      reason: 'Prix devenu Anti-Crise',
      improvementType: 'became_anticrisis',
      previousScore,
      newScore,
    };
  }

  // Trigger 2: Became Strong Anti-Crisis (score went from 2 to 3)
  if (previousScore === 2 && newScore === 3) {
    const alertCount = (state.alertCount || 0) + 1;
    setAlertState(id, {
      lastScore: newScore,
      lastAlertAt: Date.now(),
      alertCount,
    });

    return {
      shouldAlert: true,
      reason: 'Prix devenu Anti-Crise Fort',
      improvementType: 'became_strong',
      previousScore,
      newScore,
    };
  }

  // Other score increases (e.g., 0 to 1, or 1 to 2 not crossing threshold) - just update state
  setAlertState(id, { ...state, lastScore: newScore });
  return {
    shouldAlert: false,
    reason: `Score improved but didn't cross alert threshold (${previousScore} → ${newScore})`,
    previousScore,
    newScore,
  };
}

/**
 * Check if item has most resilient price among a group
 * Used for multi-territory comparisons
 * 
 * @param itemId - Item to check
 * @param itemScore - Score of the item
 * @param otherScores - Scores of other items to compare against
 * @returns Alert trigger if this item is most resilient
 */
export function checkMostResilient(
  itemId: string,
  itemScore: AntiCrisisScore,
  otherScores: number[]
): AlertTrigger {
  const state = getAlertState(itemId);

  // Must be Anti-Crisis to be considered most resilient
  if (itemScore < 2) {
    return {
      shouldAlert: false,
      reason: 'Not Anti-Crisis (score < 2)',
      newScore: itemScore,
    };
  }

  // Check if this is the highest score
  const isMostResilient = otherScores.every(score => itemScore >= score);

  if (!isMostResilient) {
    return {
      shouldAlert: false,
      reason: 'Not the most resilient in the group',
      newScore: itemScore,
    };
  }

  // Check rate limiting
  if (!canAlertAgain(state)) {
    return {
      shouldAlert: false,
      reason: 'Rate limited',
      newScore: itemScore,
    };
  }

  // Trigger alert for most resilient
  const alertCount = (state.alertCount || 0) + 1;
  setAlertState(itemId, {
    lastScore: itemScore,
    lastAlertAt: Date.now(),
    alertCount,
  });

  return {
    shouldAlert: true,
    reason: 'Prix le plus résilient parmi les territoires',
    improvementType: 'most_resilient',
    newScore: itemScore,
  };
}

/**
 * Get human-readable notification message
 * Play Store compliant: factual, descriptive, no promises
 * 
 * @param trigger - Alert trigger result
 * @param itemName - Name of the item (basket, product)
 * @returns Notification message object
 */
export function getNotificationMessage(
  trigger: AlertTrigger,
  itemName: string
): { title: string; body: string; } {
  switch (trigger.improvementType) {
    case 'became_anticrisis':
      return {
        title: '🟡 Prix plus stable détecté',
        body: `${itemName} présente désormais une meilleure stabilité de prix (score ${trigger.newScore}/3).`,
      };

    case 'became_strong':
      return {
        title: '🟢 Stabilité renforcée',
        body: `${itemName} atteint le score maximum de stabilité (3/3 critères validés).`,
      };

    case 'most_resilient':
      return {
        title: '⭐ Prix le plus résilient',
        body: `${itemName} présente la meilleure résilience parmi les territoires comparés.`,
      };

    default:
      return {
        title: 'Amélioration détectée',
        body: `${itemName} : ${trigger.reason}`,
      };
  }
}

/**
 * Reset alert state for testing or user request
 * 
 * @param id - Item identifier
 */
export function resetAlertState(id: string): void {
  setAlertState(id, {});
}
