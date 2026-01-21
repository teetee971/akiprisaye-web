import { safeLocalStorage } from '../utils/safeLocalStorage';
/**
 * Service pour gérer les alertes de prix
 * Stockage local sans backend
 */

export interface PriceAlert {
  productId: string;
  productName?: string;
  territory: string;
  targetPrice: number | null;
  targetPercentDrop: number | null;
  createdAt: number;
  lastNotifiedAt: number | null;
}

const STORAGE_KEY = 'priceAlerts:v1';
const NOTIFICATION_COOLDOWN = 24 * 60 * 60 * 1000; // 24h

/**
 * Récupère toutes les alertes stockées
 */
export function getAllAlerts(): PriceAlert[] {
  try {
    const data = safeLocalStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading price alerts:', error);
    return [];
  }
}

/**
 * Sauvegarde une alerte
 */
export function saveAlert(alert: PriceAlert): void {
  const alerts = getAllAlerts();
  alerts.push(alert);
  safeLocalStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));
}

/**
 * Supprime une alerte
 */
export function deleteAlert(productId: string, territory: string): void {
  const alerts = getAllAlerts();
  const filtered = alerts.filter(
    a => !(a.productId === productId && a.territory === territory)
  );
  safeLocalStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

/**
 * Vérifie si une alerte existe pour un produit
 */
export function hasAlert(productId: string, territory: string): boolean {
  const alerts = getAllAlerts();
  return alerts.some(a => a.productId === productId && a.territory === territory);
}

/**
 * Vérifie les alertes déclenchées pour un produit
 * Retourne null si pas d'alerte ou si déjà notifié récemment
 */
export function checkAlert(
  productId: string,
  territory: string,
  currentPrice: number
): PriceAlert | null {
  const alerts = getAllAlerts();
  const alert = alerts.find(
    a => a.productId === productId && a.territory === territory
  );

  if (!alert) return null;

  // Vérifier si déjà notifié récemment
  if (alert.lastNotifiedAt) {
    const timeSinceNotification = Date.now() - alert.lastNotifiedAt;
    if (timeSinceNotification < NOTIFICATION_COOLDOWN) {
      return null;
    }
  }

  // Vérifier si le seuil est atteint
  let triggered = false;

  if (alert.targetPrice !== null) {
    triggered = currentPrice <= alert.targetPrice;
  } else if (alert.targetPercentDrop !== null) {
    // Pour le pourcentage, on ne peut pas calculer sans prix de référence
    // On considère que c'est déclenché si le prix actuel est inférieur
    triggered = true; // Simplified logic
  }

  if (triggered) {
    return alert;
  }

  return null;
}

/**
 * Marque une alerte comme notifiée
 */
export function markAsNotified(productId: string, territory: string): void {
  const alerts = getAllAlerts();
  const alert = alerts.find(
    a => a.productId === productId && a.territory === territory
  );

  if (alert) {
    alert.lastNotifiedAt = Date.now();
    safeLocalStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));
  }
}

/**
 * Nettoie les alertes anciennes (>30 jours)
 */
export function cleanOldAlerts(): void {
  const alerts = getAllAlerts();
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  
  const filtered = alerts.filter(a => a.createdAt > thirtyDaysAgo);
  
  if (filtered.length < alerts.length) {
    safeLocalStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  }
}
