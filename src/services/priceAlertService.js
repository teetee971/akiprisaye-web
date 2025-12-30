/**
 * Real Price Alert Service
 * 
 * Core Features:
 * - Deterministic alert detection (NO AI/ML predictions)
 * - Real historical data comparison only
 * - Full data source transparency
 * - Legal compliance with neutral language
 * - Modular and extensible design
 * 
 * Constraints:
 * - NO predictive modeling
 * - NO synthetic data generation
 * - NO missing data interpolation
 * - Observable facts only
 */

import { db } from '../firebase_config';
import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';

// Default alert preferences
export const DEFAULT_ALERT_PREFERENCES = {
  priceDropEnabled: true,
  priceIncreaseEnabled: true,
  shrinkflationEnabled: true,
  increasePercentageThreshold: 5,      // Alert on +5% increase
  increaseAbsoluteThreshold: 0.50,     // Alert on +0.50€ increase
  inAppNotifications: true,
  emailNotifications: false,
  pushNotifications: false,
};

/**
 * Calculate alert severity based on percentage change
 */
function calculateSeverity(percentageChange) {
  const absChange = Math.abs(percentageChange);

  if (absChange >= 10) {
    return 'high';
  } else if (absChange >= 5) {
    return 'medium';
  } else {
    return 'low';
  }
}

/**
 * Determine confidence level based on data source
 */
function determineConfidence(source, verified = false) {
  if (verified) {
    return 'high';
  }

  switch (source) {
    case 'official_site':
    case 'observateur':
      return 'high';
    case 'public_listing':
      return 'medium';
    case 'user_report':
      return 'low';
    default:
      return 'low';
  }
}

/**
 * Detect price drop alert
 * 
 * Triggers when a new observed price is lower than the previous one
 */
export function detectPriceDrop(previousPrice, currentPrice, preferences) {
  if (!preferences.priceDropEnabled) {
    return null;
  }

  // Only trigger if current price is actually lower
  if (currentPrice >= previousPrice) {
    return null;
  }

  const absoluteChange = currentPrice - previousPrice;
  const percentageChange = ((absoluteChange / previousPrice) * 100);

  return {
    triggered: true,
    absoluteChange,
    percentageChange,
    severity: calculateSeverity(percentageChange),
  };
}

/**
 * Detect price increase alert
 * 
 * Triggers if price increase exceeds configurable thresholds
 */
export function detectPriceIncrease(previousPrice, currentPrice, preferences) {
  if (!preferences.priceIncreaseEnabled) {
    return null;
  }

  // Only trigger if current price is actually higher
  if (currentPrice <= previousPrice) {
    return null;
  }

  const absoluteChange = currentPrice - previousPrice;
  const percentageChange = ((absoluteChange / previousPrice) * 100);

  // Check if thresholds are exceeded
  const exceedsPercentageThreshold = percentageChange > preferences.increasePercentageThreshold;
  const exceedsAbsoluteThreshold = absoluteChange > preferences.increaseAbsoluteThreshold;

  if (exceedsPercentageThreshold || exceedsAbsoluteThreshold) {
    return {
      triggered: true,
      absoluteChange,
      percentageChange,
      severity: calculateSeverity(percentageChange),
    };
  }

  return null;
}

/**
 * Detect shrinkflation (reduced quantity with stable/higher price)
 * 
 * Critical: Requires TWO verifiable data points
 */
export function detectShrinkflation(
  previousPrice,
  currentPrice,
  previousQuantity,
  currentQuantity,
  preferences,
) {
  if (!preferences.shrinkflationEnabled) {
    return null;
  }

  // Require both quantity values
  if (!previousQuantity || !currentQuantity) {
    return null;
  }

  // Detect quantity reduction
  if (currentQuantity >= previousQuantity) {
    return null;
  }

  const quantityReduction = previousQuantity - currentQuantity;
  const quantityReductionPercentage = ((quantityReduction / previousQuantity) * 100);

  // Calculate price per unit
  const pricePerUnitBefore = previousPrice / previousQuantity;
  const pricePerUnitAfter = currentPrice / currentQuantity;

  // Calculate effective price increase per unit
  const effectivePriceIncrease = ((pricePerUnitAfter - pricePerUnitBefore) / pricePerUnitBefore) * 100;

  // Only trigger if there's an effective price increase per unit
  if (effectivePriceIncrease <= 0) {
    return null;
  }

  return {
    triggered: true,
    shrinkflationDetails: {
      previousQuantity,
      currentQuantity,
      quantityReduction,
      quantityReductionPercentage,
      pricePerUnitBefore,
      pricePerUnitAfter,
      effectivePriceIncrease,
    },
    severity: calculateSeverity(effectivePriceIncrease),
  };
}

/**
 * Create a price alert in Firestore
 */
export async function createPriceAlert(alertData) {
  if (!db) {
    console.warn('Firestore not available - alert not saved');
    return null;
  }
  
  try {
    const alertsRef = collection(db, 'priceAlerts');
    const docRef = await addDoc(alertsRef, {
      ...alertData,
      triggeredAt: Timestamp.now(),
      acknowledged: false,
      createdAt: Timestamp.now(),
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating price alert:', error);
    throw error;
  }
}

/**
 * Get alerts for a user
 */
export async function getUserAlerts(userId, filters = {}) {
  if (!db) {
    console.warn('Firestore not available - returning empty alerts');
    return [];
  }
  
  try {
    const alertsRef = collection(db, 'priceAlerts');
    let q = query(
      alertsRef,
      where('userId', '==', userId),
      orderBy('triggeredAt', 'desc'),
    );
    
    // Apply filters
    if (filters.alertType) {
      q = query(q, where('alertType', '==', filters.alertType));
    }
    if (filters.territory) {
      q = query(q, where('territory', '==', filters.territory));
    }
    if (filters.severity) {
      q = query(q, where('severity', '==', filters.severity));
    }
    if (filters.acknowledged !== undefined) {
      q = query(q, where('acknowledged', '==', filters.acknowledged));
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error fetching user alerts:', error);
    return [];
  }
}

/**
 * Acknowledge an alert
 */
export async function acknowledgeAlert(alertId) {
  if (!db) {
    console.warn('Firestore not available - alert not acknowledged');
    return;
  }
  
  try {
    const alertRef = doc(db, 'priceAlerts', alertId);
    await updateDoc(alertRef, {
      acknowledged: true,
      acknowledgedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error acknowledging alert:', error);
    throw error;
  }
}

/**
 * Track a product for price alerts
 */
export async function trackProduct(userId, productData, alertPreferences = DEFAULT_ALERT_PREFERENCES) {
  if (!db) {
    console.warn('Firestore not available - product tracking saved to localStorage');
    // Fallback to localStorage
    const tracked = JSON.parse(localStorage.getItem('trackedProducts') || '[]');
    const newTracking = {
      id: `${productData.id}-${Date.now()}`,
      userId,
      ...productData,
      trackingSince: new Date().toISOString(),
      alertsEnabled: true,
      alertPreferences,
    };
    tracked.push(newTracking);
    localStorage.setItem('trackedProducts', JSON.stringify(tracked));
    return newTracking.id;
  }
  
  try {
    const trackedRef = collection(db, 'trackedProducts');
    const docRef = await addDoc(trackedRef, {
      userId,
      ...productData,
      trackingSince: Timestamp.now(),
      alertsEnabled: true,
      alertPreferences,
      createdAt: Timestamp.now(),
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error tracking product:', error);
    throw error;
  }
}

/**
 * Get tracked products for a user
 */
export async function getTrackedProducts(userId) {
  if (!db) {
    console.warn('Firestore not available - loading from localStorage');
    const tracked = JSON.parse(localStorage.getItem('trackedProducts') || '[]');
    return tracked.filter(p => p.userId === userId);
  }
  
  try {
    const trackedRef = collection(db, 'trackedProducts');
    const q = query(
      trackedRef,
      where('userId', '==', userId),
      where('alertsEnabled', '==', true),
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error fetching tracked products:', error);
    return [];
  }
}

/**
 * Update alert preferences for a tracked product
 */
export async function updateAlertPreferences(trackingId, preferences) {
  if (!db) {
    console.warn('Firestore not available - updating localStorage');
    const tracked = JSON.parse(localStorage.getItem('trackedProducts') || '[]');
    const index = tracked.findIndex(p => p.id === trackingId);
    if (index !== -1) {
      tracked[index].alertPreferences = { ...tracked[index].alertPreferences, ...preferences };
      localStorage.setItem('trackedProducts', JSON.stringify(tracked));
    }
    return;
  }
  
  try {
    const trackingRef = doc(db, 'trackedProducts', trackingId);
    await updateDoc(trackingRef, {
      alertPreferences: preferences,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error updating alert preferences:', error);
    throw error;
  }
}

/**
 * Process price updates and generate alerts
 * 
 * This is the main engine that checks for alert conditions
 */
export async function processPriceUpdate(userId, productId, newPriceData) {
  try {
    // Get tracked product
    const trackedProducts = await getTrackedProducts(userId);
    const tracked = trackedProducts.find(p => p.productId === productId || p.id === productId);
    
    if (!tracked || !tracked.alertsEnabled) {
      return null;
    }
    
    const preferences = tracked.alertPreferences || DEFAULT_ALERT_PREFERENCES;
    const previousPrice = tracked.lastKnownPrice;
    const currentPrice = newPriceData.price;
    const previousQuantity = tracked.lastKnownQuantity;
    const currentQuantity = newPriceData.quantity;
    
    // Check for price drop
    const dropAlert = detectPriceDrop(previousPrice, currentPrice, preferences);
    if (dropAlert && dropAlert.triggered) {
      const alertData = {
        userId,
        productId: tracked.productId || tracked.id,
        productName: tracked.productName,
        alertType: 'price_drop',
        previousPrice,
        currentPrice,
        absoluteChange: dropAlert.absoluteChange,
        percentageChange: dropAlert.percentageChange,
        store: tracked.store,
        territory: tracked.territory,
        category: tracked.category,
        previousDataSource: tracked.lastObservationSource,
        currentDataSource: newPriceData.source,
        previousObservationDate: tracked.lastObservationDate,
        currentObservationDate: newPriceData.date,
        confidence: determineConfidence(newPriceData.source, newPriceData.verified),
        severity: dropAlert.severity,
      };
      
      await createPriceAlert(alertData);
      return alertData;
    }
    
    // Check for price increase
    const increaseAlert = detectPriceIncrease(previousPrice, currentPrice, preferences);
    if (increaseAlert && increaseAlert.triggered) {
      const alertData = {
        userId,
        productId: tracked.productId || tracked.id,
        productName: tracked.productName,
        alertType: 'price_increase',
        previousPrice,
        currentPrice,
        absoluteChange: increaseAlert.absoluteChange,
        percentageChange: increaseAlert.percentageChange,
        store: tracked.store,
        territory: tracked.territory,
        category: tracked.category,
        previousDataSource: tracked.lastObservationSource,
        currentDataSource: newPriceData.source,
        previousObservationDate: tracked.lastObservationDate,
        currentObservationDate: newPriceData.date,
        confidence: determineConfidence(newPriceData.source, newPriceData.verified),
        severity: increaseAlert.severity,
      };
      
      await createPriceAlert(alertData);
      return alertData;
    }
    
    // Check for shrinkflation
    const shrinkflationAlert = detectShrinkflation(
      previousPrice,
      currentPrice,
      previousQuantity,
      currentQuantity,
      preferences,
    );
    if (shrinkflationAlert && shrinkflationAlert.triggered) {
      const alertData = {
        userId,
        productId: tracked.productId || tracked.id,
        productName: tracked.productName,
        alertType: 'shrinkflation',
        previousPrice,
        currentPrice,
        previousQuantity,
        currentQuantity,
        absoluteChange: currentPrice - previousPrice,
        percentageChange: ((currentPrice - previousPrice) / previousPrice) * 100,
        store: tracked.store,
        territory: tracked.territory,
        category: tracked.category,
        previousDataSource: tracked.lastObservationSource,
        currentDataSource: newPriceData.source,
        previousObservationDate: tracked.lastObservationDate,
        currentObservationDate: newPriceData.date,
        confidence: determineConfidence(newPriceData.source, newPriceData.verified),
        severity: shrinkflationAlert.severity,
        shrinkflationDetails: shrinkflationAlert.shrinkflationDetails,
      };
      
      await createPriceAlert(alertData);
      return alertData;
    }
    
    return null;
  } catch (error) {
    console.error('Error processing price update:', error);
    throw error;
  }
}

/**
 * Get alert summary for dashboard
 */
export async function getAlertSummary(userId) {
  const alerts = await getUserAlerts(userId);
  
  const summary = {
    total: alerts.length,
    unacknowledged: alerts.filter(a => !a.acknowledged).length,
    byType: {
      price_drop: alerts.filter(a => a.alertType === 'price_drop').length,
      price_increase: alerts.filter(a => a.alertType === 'price_increase').length,
      shrinkflation: alerts.filter(a => a.alertType === 'shrinkflation').length,
    },
    bySeverity: {
      high: alerts.filter(a => a.severity === 'high').length,
      medium: alerts.filter(a => a.severity === 'medium').length,
      low: alerts.filter(a => a.severity === 'low').length,
    },
    byTerritory: {},
  };
  
  // Group by territory
  alerts.forEach(alert => {
    if (alert.territory) {
      summary.byTerritory[alert.territory] = (summary.byTerritory[alert.territory] || 0) + 1;
    }
  });
  
  return summary;
}

export default {
  DEFAULT_ALERT_PREFERENCES,
  detectPriceDrop,
  detectPriceIncrease,
  detectShrinkflation,
  createPriceAlert,
  getUserAlerts,
  acknowledgeAlert,
  trackProduct,
  getTrackedProducts,
  updateAlertPreferences,
  processPriceUpdate,
  getAlertSummary,
};
