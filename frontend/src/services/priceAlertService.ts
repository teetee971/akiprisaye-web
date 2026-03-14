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

// ─── Alert detection helpers ────────────────────────────────────────────────

export interface AlertPreferences {
  priceDropEnabled: boolean;
  dropPercentageThreshold: number;      // e.g. 5 → triggered when drop >= 5%
  priceIncreaseEnabled: boolean;
  increasePercentageThreshold: number;  // e.g. 5 → triggered when increase >= 5%
  increaseAbsoluteThreshold: number;    // e.g. 0.50 € → triggered when increase >= 0.50 €
  shrinkflationEnabled: boolean;
  shrinkflationQuantityThreshold: number; // e.g. 5 → triggered when reduction >= 5%
}

export const DEFAULT_ALERT_PREFERENCES: AlertPreferences = {
  priceDropEnabled: true,
  dropPercentageThreshold: 3,
  priceIncreaseEnabled: true,
  increasePercentageThreshold: 5,
  increaseAbsoluteThreshold: 0.50,
  shrinkflationEnabled: true,
  shrinkflationQuantityThreshold: 5,
};

export type AlertSeverity = 'low' | 'medium' | 'high';

export interface AlertDetectionResult {
  triggered: true;
  absoluteChange: number;
  percentageChange: number;
  severity: AlertSeverity;
  shrinkflationDetails?: {
    quantityReduction: number;
    quantityReductionPercentage: number;
    effectivePriceIncrease: number;
  };
}

function severity(pctAbs: number): AlertSeverity {
  if (pctAbs >= 10) return 'high';
  if (pctAbs >= 5) return 'medium';
  return 'low';
}

/**
 * Détecte une baisse de prix.
 * Retourne null si non déclenchée ou désactivée.
 */
export function detectPriceDrop(
  previousPrice: number,
  currentPrice: number,
  prefs: AlertPreferences = DEFAULT_ALERT_PREFERENCES,
): AlertDetectionResult | null {
  if (!prefs.priceDropEnabled) return null;
  if (previousPrice <= 0) return null;
  const absoluteChange = currentPrice - previousPrice;
  if (absoluteChange >= 0) return null;
  const percentageChange = (absoluteChange / previousPrice) * 100;
  if (Math.abs(percentageChange) < prefs.dropPercentageThreshold) return null;
  return {
    triggered: true,
    absoluteChange: Math.round(absoluteChange * 100) / 100,
    percentageChange: Math.round(percentageChange * 10) / 10,
    severity: severity(Math.abs(percentageChange)),
  };
}

/**
 * Détecte une hausse de prix (pourcentage OU montant absolu).
 * Retourne null si non déclenchée ou désactivée.
 */
export function detectPriceIncrease(
  previousPrice: number,
  currentPrice: number,
  prefs: AlertPreferences = DEFAULT_ALERT_PREFERENCES,
): AlertDetectionResult | null {
  if (!prefs.priceIncreaseEnabled) return null;
  if (previousPrice <= 0) return null;
  const absoluteChange = currentPrice - previousPrice;
  if (absoluteChange <= 0) return null;
  const percentageChange = (absoluteChange / previousPrice) * 100;
  const exceedsPct = percentageChange >= prefs.increasePercentageThreshold;
  const exceedsAbs = absoluteChange >= prefs.increaseAbsoluteThreshold;
  if (!exceedsPct && !exceedsAbs) return null;
  return {
    triggered: true,
    absoluteChange: Math.round(absoluteChange * 100) / 100,
    percentageChange: Math.round(percentageChange * 10) / 10,
    severity: severity(percentageChange),
  };
}

/**
 * Détecte une shrinkflation : réduction de quantité sans baisse de prix unitaire.
 * Retourne null si non déclenchée, désactivée ou données manquantes.
 */
export function detectShrinkflation(
  previousPrice: number,
  currentPrice: number,
  previousQuantity: number | null,
  currentQuantity: number | null,
  prefs: AlertPreferences = DEFAULT_ALERT_PREFERENCES,
): AlertDetectionResult | null {
  if (!prefs.shrinkflationEnabled) return null;
  if (previousQuantity == null || currentQuantity == null) return null;
  if (currentQuantity >= previousQuantity) return null;
  if (previousQuantity <= 0 || currentQuantity <= 0) return null;
  const quantityReduction = previousQuantity - currentQuantity;
  const quantityReductionPercentage = (quantityReduction / previousQuantity) * 100;
  if (quantityReductionPercentage < prefs.shrinkflationQuantityThreshold) return null;
  // Price per unit comparison
  const prevPricePerUnit = previousPrice / previousQuantity;
  const currPricePerUnit = currentPrice / currentQuantity;
  if (currPricePerUnit <= prevPricePerUnit) return null;
  const effectivePriceIncrease = ((currPricePerUnit - prevPricePerUnit) / prevPricePerUnit) * 100;
  return {
    triggered: true,
    absoluteChange: Math.round((currentPrice - previousPrice) * 100) / 100,
    percentageChange: Math.round(((currentPrice - previousPrice) / previousPrice) * 100 * 10) / 10,
    severity: severity(effectivePriceIncrease),
    shrinkflationDetails: {
      quantityReduction,
      quantityReductionPercentage: Math.round(quantityReductionPercentage * 10) / 10,
      effectivePriceIncrease: Math.round(effectivePriceIncrease * 100) / 100,
    },
  };
}

const STORAGE_KEY = 'priceAlerts:v1';
const NOTIFICATION_COOLDOWN = 24 * 60 * 60 * 1000; // 24h

/**
 * Récupère toutes les alertes stockées
 */
export function getAllAlerts(): PriceAlert[] {
  return safeLocalStorage.getJSON<PriceAlert[]>(STORAGE_KEY, []);
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
