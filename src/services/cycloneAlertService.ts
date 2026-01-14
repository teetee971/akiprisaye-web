/**
 * Cyclone Alert Service
 * 
 * Manages cyclone alerts and notifications
 * Integration with Météo France data
 */

import type { CycloneAlert, Territory, CycloneVigilance } from '../types/cycloneComparison';

/**
 * Get current alerts for a territory
 */
export async function getCurrentAlerts(territory: Territory): Promise<CycloneAlert[]> {
  // In a real implementation, this would fetch from Météo France API
  // For now, we'll check local storage for mock data
  try {
    const alerts = localStorage.getItem(`cyclone-alerts-${territory}`);
    if (alerts) {
      return JSON.parse(alerts);
    }
    return [];
  } catch (error) {
    console.error('Error loading cyclone alerts:', error);
    return [];
  }
}

/**
 * Subscribe user to alerts for a territory
 */
export async function subscribeToAlerts(
  userId: string,
  territory: Territory
): Promise<void> {
  try {
    const subscriptions = getSubscriptions(userId);
    if (!subscriptions.includes(territory)) {
      subscriptions.push(territory);
      localStorage.setItem(`alert-subscriptions-${userId}`, JSON.stringify(subscriptions));
    }
  } catch (error) {
    console.error('Error subscribing to alerts:', error);
  }
}

/**
 * Unsubscribe from alerts
 */
export async function unsubscribeFromAlerts(
  userId: string,
  territory: Territory
): Promise<void> {
  try {
    const subscriptions = getSubscriptions(userId);
    const updated = subscriptions.filter(t => t !== territory);
    localStorage.setItem(`alert-subscriptions-${userId}`, JSON.stringify(updated));
  } catch (error) {
    console.error('Error unsubscribing from alerts:', error);
  }
}

/**
 * Get user's alert subscriptions
 */
function getSubscriptions(userId?: string): Territory[] {
  try {
    const key = userId ? `alert-subscriptions-${userId}` : 'alert-subscriptions';
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

/**
 * Notify users (would typically use push notifications)
 */
export async function notifyUsers(alert: CycloneAlert): Promise<void> {
  // In a real implementation, this would send push notifications
  // For now, we'll just log and store the notification
  console.log('Sending alert notification:', alert);
  
  try {
    const notifications = getNotifications();
    notifications.unshift({
      alert,
      sentAt: new Date().toISOString(),
      read: false
    });
    
    // Keep only last 50 notifications
    if (notifications.length > 50) {
      notifications.length = 50;
    }
    
    localStorage.setItem('cyclone-notifications', JSON.stringify(notifications));
  } catch (error) {
    console.error('Error storing notification:', error);
  }
}

/**
 * Get notifications
 */
function getNotifications(): any[] {
  try {
    const data = localStorage.getItem('cyclone-notifications');
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

/**
 * Parse Météo France data (mock implementation)
 */
export function parseMeteoFranceData(data: any): CycloneAlert {
  // This would parse actual Météo France API data
  // Returning a basic structure for now
  return {
    id: data.id || `alert-${Date.now()}`,
    territory: data.territory,
    vigilance: data.vigilance || 'vert',
    cycloneName: data.cycloneName,
    category: data.category,
    forecast: {
      passageTime: data.forecast?.passageTime,
      windSpeed: data.forecast?.windSpeed || 0,
      rainfall: data.forecast?.rainfall || 0,
      trajectory: data.forecast?.trajectory || []
    },
    officialInstructions: data.officialInstructions || [],
    issuedAt: data.issuedAt || new Date().toISOString(),
    updatedAt: data.updatedAt || new Date().toISOString(),
    source: data.source || 'MeteoFrance'
  };
}

/**
 * Get vigilance color for display
 */
export function getVigilanceColor(vigilance: CycloneVigilance): string {
  const colors = {
    vert: '#22c55e',    // green-500
    jaune: '#eab308',   // yellow-500
    orange: '#f97316',  // orange-500
    rouge: '#ef4444',   // red-500
    violet: '#a855f7'   // purple-500
  };
  return colors[vigilance];
}

/**
 * Get vigilance level text
 */
export function getVigilanceText(vigilance: CycloneVigilance): string {
  const texts = {
    vert: 'Pas de vigilance particulière',
    jaune: 'Vigilance jaune - Soyez attentif',
    orange: 'Vigilance orange - Soyez très vigilant',
    rouge: 'Vigilance rouge - Danger, restez chez vous',
    violet: 'Vigilance violette - Danger extrême'
  };
  return texts[vigilance];
}

/**
 * Check if alert is active
 */
export function isAlertActive(alert: CycloneAlert): boolean {
  // An alert is active if it's not green vigilance and was updated recently
  if (alert.vigilance === 'vert') return false;
  
  const updatedAt = new Date(alert.updatedAt);
  const now = new Date();
  const hoursSinceUpdate = (now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60);
  
  // Consider alert active if updated in last 24 hours
  return hoursSinceUpdate < 24;
}

/**
 * Get alert severity score (for sorting)
 */
export function getAlertSeverity(alert: CycloneAlert): number {
  const vigilanceScores = {
    vert: 0,
    jaune: 1,
    orange: 2,
    rouge: 3,
    violet: 4
  };
  
  const categoryScore = alert.category || 0;
  const vigilanceScore = vigilanceScores[alert.vigilance];
  
  return vigilanceScore * 10 + categoryScore;
}

/**
 * Format alert for notification
 */
export function formatAlertNotification(alert: CycloneAlert): {
  title: string;
  body: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
} {
  const vigilanceText = getVigilanceText(alert.vigilance);
  const cycloneName = alert.cycloneName ? ` ${alert.cycloneName}` : '';
  
  let urgency: 'low' | 'medium' | 'high' | 'critical';
  if (alert.vigilance === 'violet' || alert.vigilance === 'rouge') {
    urgency = 'critical';
  } else if (alert.vigilance === 'orange') {
    urgency = 'high';
  } else if (alert.vigilance === 'jaune') {
    urgency = 'medium';
  } else {
    urgency = 'low';
  }
  
  return {
    title: `🌀 Alerte Cyclone${cycloneName}`,
    body: vigilanceText,
    urgency
  };
}

/**
 * Create mock alert for testing
 */
export function createMockAlert(
  territory: Territory,
  vigilance: CycloneVigilance
): CycloneAlert {
  return {
    id: `mock-alert-${Date.now()}`,
    territory,
    vigilance,
    cycloneName: vigilance !== 'vert' ? 'Test' : undefined,
    category: vigilance === 'rouge' || vigilance === 'violet' ? 4 : undefined,
    forecast: {
      windSpeed: vigilance === 'rouge' ? 200 : vigilance === 'orange' ? 150 : 80,
      rainfall: vigilance === 'rouge' ? 300 : vigilance === 'orange' ? 200 : 50,
      trajectory: []
    },
    officialInstructions: [
      'Restez informé via les médias officiels',
      'Préparez votre kit de survie',
      'Protégez votre habitation'
    ],
    issuedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    source: 'MeteoFrance'
  };
}
