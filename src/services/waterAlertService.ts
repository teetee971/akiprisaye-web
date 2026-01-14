/**
 * Water Alert Service
 * Système d'alertes pour l'eau potable
 * 
 * Gestion des alertes citoyennes pour les coupures d'eau,
 * problèmes de qualité, etc.
 */

import type {
  WaterAlert,
} from '../types/waterComparison';

// In-memory storage for alerts (in real app, would use backend/database)
const alerts: WaterAlert[] = [];

/**
 * Create a new alert
 */
export async function createAlert(
  userId: string,
  type: WaterAlert['type'],
  location: {
    commune: string;
    quartier?: string;
    radius?: number;
  }
): Promise<WaterAlert> {
  const newAlert: WaterAlert = {
    id: `alert_${Date.now()}`,
    userId,
    type,
    location,
    active: true,
    createdAt: new Date().toISOString(),
    triggeredCount: 0,
  };

  alerts.push(newAlert);
  console.log('Alert created:', newAlert);

  return newAlert;
}

/**
 * Get alerts for a user
 */
export async function getUserAlerts(userId: string): Promise<WaterAlert[]> {
  return alerts.filter((alert) => alert.userId === userId);
}

/**
 * Get active alerts for a user
 */
export async function getActiveAlerts(userId: string): Promise<WaterAlert[]> {
  return alerts.filter(
    (alert) => alert.userId === userId && alert.active
  );
}

/**
 * Toggle alert active status
 */
export async function toggleAlert(
  alertId: string,
  active: boolean
): Promise<WaterAlert> {
  const alert = alerts.find((a) => a.id === alertId);

  if (!alert) {
    throw new Error(`Alert with ID ${alertId} not found`);
  }

  alert.active = active;
  console.log('Alert toggled:', alert);

  return alert;
}

/**
 * Delete an alert
 */
export async function deleteAlert(alertId: string): Promise<void> {
  const index = alerts.findIndex((a) => a.id === alertId);

  if (index === -1) {
    throw new Error(`Alert with ID ${alertId} not found`);
  }

  alerts.splice(index, 1);
  console.log('Alert deleted:', alertId);
}

/**
 * Trigger an alert (simulates notification)
 */
export async function triggerAlert(alertId: string): Promise<WaterAlert> {
  const alert = alerts.find((a) => a.id === alertId);

  if (!alert) {
    throw new Error(`Alert with ID ${alertId} not found`);
  }

  if (!alert.active) {
    throw new Error('Cannot trigger inactive alert');
  }

  alert.triggeredCount++;
  alert.lastTriggered = new Date().toISOString();

  console.log('Alert triggered:', alert);

  return alert;
}

/**
 * Get alert description
 */
export function getAlertDescription(type: WaterAlert['type']): string {
  const descriptions: Record<WaterAlert['type'], string> = {
    cut_imminent: '🚨 Coupure imminente - Coupure prévue prochainement dans votre zone',
    cut_active: '🔴 Coupure en cours - Coupure actuellement active dans votre zone',
    quality_issue: '⚠️ Problème de qualité - Eau non potable ou qualité dégradée',
    water_restored: '💧 Eau rétablie - L\'eau est revenue dans votre zone',
    leak_nearby: '🆕 Fuite signalée - Nouvelle fuite signalée près de chez vous',
  };

  return descriptions[type] || 'Alerte eau';
}

/**
 * Get alert recommendations
 */
export function getAlertRecommendations(
  type: WaterAlert['type']
): string[] {
  const recommendations: Record<WaterAlert['type'], string[]> = {
    cut_imminent: [
      'Remplir des contenants d\'eau propre',
      'Prévoir de l\'eau pour la cuisine et l\'hygiène',
      'Vérifier la durée prévue de la coupure',
    ],
    cut_active: [
      'Économiser l\'eau stockée',
      'Se renseigner sur les points d\'eau d\'urgence',
      'Signaler tout problème prolongé',
    ],
    quality_issue: [
      'Ne pas boire l\'eau du robinet',
      'Faire bouillir l\'eau avant consommation',
      'Utiliser de l\'eau en bouteille',
      'Suivre les consignes des autorités',
    ],
    water_restored: [
      'Laisser couler l\'eau quelques minutes',
      'Vérifier la clarté de l\'eau',
      'Signaler toute anomalie (couleur, odeur)',
    ],
    leak_nearby: [
      'Vérifier que ce n\'est pas votre installation',
      'Éviter la zone si fuite importante',
      'Signaler aux autorités compétentes',
    ],
  };

  return recommendations[type] || [];
}

/**
 * Check if alert should be triggered based on conditions
 */
export function shouldTriggerAlert(
  alert: WaterAlert,
  commune: string,
  type: WaterAlert['type']
): boolean {
  if (!alert.active) return false;
  if (alert.type !== type) return false;

  // Check location match
  const locationMatch =
    alert.location.commune.toLowerCase() === commune.toLowerCase();

  return locationMatch;
}

/**
 * Get alert statistics for user
 */
export async function getAlertStatistics(
  userId: string
): Promise<{
  total: number;
  active: number;
  totalTriggered: number;
  byType: Record<string, number>;
}> {
  const userAlerts = await getUserAlerts(userId);

  const byType: Record<string, number> = {};
  let totalTriggered = 0;

  userAlerts.forEach((alert) => {
    byType[alert.type] = (byType[alert.type] || 0) + 1;
    totalTriggered += alert.triggeredCount;
  });

  return {
    total: userAlerts.length,
    active: userAlerts.filter((a) => a.active).length,
    totalTriggered,
    byType,
  };
}
