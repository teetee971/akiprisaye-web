 
/**
 * Alert Service
 * 
 * Manages user alerts for comparators. Allows users to:
 * - Create alerts based on conditions (price thresholds, availability, etc.)
 * - Manage alerts (activate/deactivate/delete)
 * - Receive notifications when alerts are triggered
 * 
 * Features:
 * - Firebase Firestore integration
 * - Email and push notification support
 * - Alert condition evaluation
 * - Rate limiting
 */

import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import type { Alert, Territory } from '../types/comparatorCommon';

/**
 * Create a new alert
 * 
 * @param alert - Alert data (without id, createdAt, triggeredCount)
 * @returns Created alert with ID
 */
export async function createAlert(
  alert: Omit<Alert, 'id' | 'createdAt' | 'triggeredCount'>
): Promise<Alert> {
  const db = getFirestore();
  const alertsRef = collection(db, 'alerts');

  const docRef = await addDoc(alertsRef, {
    ...alert,
    createdAt: serverTimestamp(),
    triggeredCount: 0,
  });

  const docSnapshot = await getDoc(docRef);
  const data = docSnapshot.data();

  return {
    id: docRef.id,
    userId: alert.userId,
    comparatorType: alert.comparatorType,
    type: alert.type,
    territory: alert.territory,
    conditions: alert.conditions,
    notificationMethod: alert.notificationMethod,
    active: alert.active,
    createdAt: (data?.createdAt as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
    triggeredCount: 0,
    label: alert.label,
  };
}

/**
 * Get all alerts for a user
 * 
 * @param userId - User ID
 * @returns Array of user alerts
 */
export async function getUserAlerts(userId: string): Promise<Alert[]> {
  const db = getFirestore();
  const alertsRef = collection(db, 'alerts');

  const q = query(
    alertsRef,
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );

  const snapshot = await getDocs(q);
  const alerts: Alert[] = [];

  snapshot.forEach((doc) => {
    const data = doc.data();
    alerts.push({
      id: doc.id,
      userId: data.userId,
      comparatorType: data.comparatorType,
      type: data.type,
      territory: data.territory,
      conditions: data.conditions,
      notificationMethod: data.notificationMethod,
      active: data.active,
      createdAt: (data.createdAt as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
      lastTriggered: data.lastTriggered
        ? (data.lastTriggered as Timestamp).toDate().toISOString()
        : undefined,
      triggeredCount: data.triggeredCount || 0,
      label: data.label,
    });
  });

  return alerts;
}

/**
 * Get alerts by comparator type
 * 
 * @param comparatorType - Comparator type
 * @param territory - Optional territory filter
 * @returns Array of alerts
 * 
 * Note: This query requires Firestore composite indexes.
 * 
 * To create the required indexes:
 * 1. Via Firebase Console: Go to Firestore > Indexes and create composite indexes for:
 *    - Collection: alerts, Fields: comparatorType (Ascending), active (Ascending)
 *    - Collection: alerts, Fields: comparatorType (Ascending), active (Ascending), territory (Ascending)
 * 
 * 2. Via Firebase CLI (firestore.indexes.json):
 *    {
 *      "indexes": [
 *        {
 *          "collectionGroup": "alerts",
 *          "queryScope": "COLLECTION",
 *          "fields": [
 *            { "fieldPath": "comparatorType", "order": "ASCENDING" },
 *            { "fieldPath": "active", "order": "ASCENDING" }
 *          ]
 *        }
 *      ]
 *    }
 */
export async function getAlertsByComparator(
  comparatorType: string,
  territory?: Territory
): Promise<Alert[]> {
  const db = getFirestore();
  const alertsRef = collection(db, 'alerts');

  let q = query(
    alertsRef,
    where('comparatorType', '==', comparatorType),
    where('active', '==', true)
  );

  if (territory) {
    q = query(q, where('territory', '==', territory));
  }

  const snapshot = await getDocs(q);
  const alerts: Alert[] = [];

  snapshot.forEach((doc) => {
    const data = doc.data();
    alerts.push({
      id: doc.id,
      userId: data.userId,
      comparatorType: data.comparatorType,
      type: data.type,
      territory: data.territory,
      conditions: data.conditions,
      notificationMethod: data.notificationMethod,
      active: data.active,
      createdAt: (data.createdAt as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
      lastTriggered: data.lastTriggered
        ? (data.lastTriggered as Timestamp).toDate().toISOString()
        : undefined,
      triggeredCount: data.triggeredCount || 0,
      label: data.label,
    });
  });

  return alerts;
}

/**
 * Update an alert
 * 
 * @param alertId - Alert ID
 * @param updates - Partial alert data to update
 * @returns Updated alert
 */
export async function updateAlert(
  alertId: string,
  updates: Partial<Alert>
): Promise<Alert> {
  const db = getFirestore();
  const alertRef = doc(db, 'alerts', alertId);

  // Remove fields that shouldn't be updated
  const { id, createdAt, triggeredCount, ...updateData } = updates;

  await updateDoc(alertRef, updateData);

  const docSnapshot = await getDoc(alertRef);
  const data = docSnapshot.data();

  if (!data) {
    throw new Error('Alert not found');
  }

  return {
    id: alertId,
    userId: data.userId,
    comparatorType: data.comparatorType,
    type: data.type,
    territory: data.territory,
    conditions: data.conditions,
    notificationMethod: data.notificationMethod,
    active: data.active,
    createdAt: (data.createdAt as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
    lastTriggered: data.lastTriggered
      ? (data.lastTriggered as Timestamp).toDate().toISOString()
      : undefined,
    triggeredCount: data.triggeredCount || 0,
    label: data.label,
  };
}

/**
 * Delete an alert
 * 
 * @param alertId - Alert ID
 */
export async function deleteAlert(alertId: string): Promise<void> {
  const db = getFirestore();
  const alertRef = doc(db, 'alerts', alertId);

  await deleteDoc(alertRef);
}

/**
 * Toggle alert active status
 * 
 * @param alertId - Alert ID
 * @param active - New active status
 * @returns Updated alert
 */
export async function toggleAlert(alertId: string, active: boolean): Promise<Alert> {
  return updateAlert(alertId, { active });
}

/**
 * Trigger an alert (mark as triggered and increment count)
 * 
 * @param alertId - Alert ID
 */
export async function triggerAlert(alertId: string): Promise<void> {
  const db = getFirestore();
  const alertRef = doc(db, 'alerts', alertId);

  const docSnapshot = await getDoc(alertRef);
  if (!docSnapshot.exists()) {
    throw new Error('Alert not found');
  }

  const data = docSnapshot.data();
  const triggeredCount = (data.triggeredCount || 0) + 1;

  await updateDoc(alertRef, {
    lastTriggered: serverTimestamp(),
    triggeredCount,
  });

  // TODO: Send notification based on notificationMethod
  // This would integrate with email service or push notification service
}

/**
 * Check if alert conditions are met
 * 
 * @param alert - Alert to check
 * @param data - Current data to compare against
 * @returns true if conditions are met
 */
export function checkAlertConditions(
  alert: Alert,
  data: Record<string, unknown>
): boolean {
  const { type, conditions } = alert;

  switch (type) {
    case 'price_threshold': {
      const currentPrice = data.price as number;
      const threshold = conditions.threshold as number;
      const operator = conditions.operator as 'below' | 'above';

      if (operator === 'below') {
        return currentPrice <= threshold;
      } else {
        return currentPrice >= threshold;
      }
    }

    case 'availability': {
      return data.available === true;
    }

    case 'new_item': {
      return data.isNew === true;
    }

    case 'significant_change': {
      const changePercentage = data.changePercentage as number;
      const threshold = conditions.threshold as number;
      return Math.abs(changePercentage) >= threshold;
    }

    default:
      return false;
  }
}

/**
 * Check all alerts and trigger notifications
 * This should be called periodically (e.g., via a scheduled function)
 */
export async function checkAlertsAndNotify(): Promise<void> {
  // This would be implemented as a Cloud Function
  // that runs periodically to check active alerts
  // and send notifications when conditions are met

  console.log('Alert checking not yet implemented for client-side');
  // TODO: Implement server-side alert checking
}

/**
 * Get alert statistics for a user
 * 
 * @param userId - User ID
 * @returns Alert statistics
 */
export async function getAlertStatistics(userId: string): Promise<{
  total: number;
  active: number;
  triggered: number;
}> {
  const alerts = await getUserAlerts(userId);

  return {
    total: alerts.length,
    active: alerts.filter((a) => a.active).length,
    triggered: alerts.filter((a) => a.triggeredCount > 0).length,
  };
}
