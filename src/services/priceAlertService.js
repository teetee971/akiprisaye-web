import { safeLocalStorage } from '../utils/safeLocalStorage';
/**
 * Price Alert Service
 * Gestion des alertes de prix côté navigateur
 */

const STORAGE_KEY = 'aki_price_alerts';

export const DEFAULT_ALERT_PREFERENCES = {
  priceDropEnabled: true,
  priceIncreaseEnabled: true,
  shrinkflationEnabled: true,
  dropPercentageThreshold: 1,
  increasePercentageThreshold: 5,
  increaseAbsoluteThreshold: 0.5,
};

function classifySeverity(percentageChange) {
  const variation = Math.abs(percentageChange);
  if (variation >= 10) return 'high';
  if (variation >= 5) return 'medium';
  return 'low';
}

/**
 * Récupère les alertes
 */
export function getPriceAlerts() {
  try {
    const raw = safeLocalStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error('[PriceAlertService] read error', error);
    return [];
  }
}

/**
 * Sauvegarde les alertes
 */
export function savePriceAlerts(alerts) {
  try {
    safeLocalStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));
  } catch (error) {
    console.error('[PriceAlertService] save error', error);
  }
}

/**
 * Ajoute une alerte
 */
export function addPriceAlert(alert) {
  const alerts = getPriceAlerts();
  alerts.push({
    ...alert,
    createdAt: Date.now(),
  });
  savePriceAlerts(alerts);
}

/**
 * Supprime une alerte
 */
export function removePriceAlert(id) {
  const alerts = getPriceAlerts().filter(a => a.id !== id);
  savePriceAlerts(alerts);
}

export function detectPriceDrop(previousPrice, currentPrice, preferences = DEFAULT_ALERT_PREFERENCES) {
  if (!preferences.priceDropEnabled) return null;
  if (previousPrice <= 0 || currentPrice >= previousPrice) return null;

  const absoluteChange = currentPrice - previousPrice;
  const percentageChange = (absoluteChange / previousPrice) * 100;

  if (Math.abs(percentageChange) < preferences.dropPercentageThreshold) {
    return null;
  }

  return {
    triggered: true,
    absoluteChange,
    percentageChange,
    severity: classifySeverity(percentageChange),
  };
}

export function detectPriceIncrease(previousPrice, currentPrice, preferences = DEFAULT_ALERT_PREFERENCES) {
  if (!preferences.priceIncreaseEnabled) return null;
  if (previousPrice <= 0 || currentPrice <= previousPrice) return null;

  const absoluteChange = currentPrice - previousPrice;
  const percentageChange = (absoluteChange / previousPrice) * 100;

  const exceedsThreshold =
    percentageChange >= preferences.increasePercentageThreshold ||
    absoluteChange >= preferences.increaseAbsoluteThreshold;

  if (!exceedsThreshold) {
    return null;
  }

  return {
    triggered: true,
    absoluteChange,
    percentageChange,
    severity: classifySeverity(percentageChange),
  };
}

export function detectShrinkflation(
  previousPrice,
  currentPrice,
  previousQuantity,
  currentQuantity,
  preferences = DEFAULT_ALERT_PREFERENCES,
) {
  if (!preferences.shrinkflationEnabled) return null;
  if (previousQuantity == null || currentQuantity == null) return null;
  if (currentQuantity >= previousQuantity) return null;

  const previousUnitPrice = previousPrice / previousQuantity;
  const currentUnitPrice = currentPrice / currentQuantity;

  if (currentUnitPrice <= previousUnitPrice) return null;

  const quantityReduction = previousQuantity - currentQuantity;
  const quantityReductionPercentage = (quantityReduction / previousQuantity) * 100;
  const effectivePriceIncrease = ((currentUnitPrice - previousUnitPrice) / previousUnitPrice) * 100;

  return {
    triggered: true,
    shrinkflationDetails: {
      quantityReduction,
      quantityReductionPercentage,
      effectivePriceIncrease,
    },
    severity: classifySeverity(effectivePriceIncrease),
  };
}
