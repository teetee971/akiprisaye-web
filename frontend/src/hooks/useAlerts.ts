/**
 * useAlerts Hook
 *
 * Custom hook for managing user alerts.
 * Provides functions to create, update, delete, and retrieve alerts.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  createAlert as createAlertService,
  getUserAlerts,
  updateAlert as updateAlertService,
  deleteAlert as deleteAlertService,
  toggleAlert,
  getAlertStatistics,
} from '../services/alertService';
import type { Alert } from '../types/comparatorCommon';

interface UseAlertsReturn {
  alerts: Alert[];
  statistics: {
    total: number;
    active: number;
    triggered: number;
  };
  createAlert: (alert: Omit<Alert, 'id' | 'createdAt' | 'triggeredCount'>) => Promise<Alert>;
  updateAlert: (alertId: string, updates: Partial<Alert>) => Promise<Alert>;
  deleteAlert: (alertId: string) => Promise<void>;
  toggleAlertStatus: (alertId: string, active: boolean) => Promise<Alert>;
  refreshAlerts: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

/**
 * Hook for managing user alerts
 *
 * @param userId - User ID to fetch alerts for
 * @returns Alert management functions and state
 */
export function useAlerts(userId: string): UseAlertsReturn {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [statistics, setStatistics] = useState({
    total: 0,
    active: 0,
    triggered: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch alerts from the server
   */
  const fetchAlerts = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const [userAlerts, stats] = await Promise.all([
        getUserAlerts(userId),
        getAlertStatistics(userId),
      ]);

      setAlerts(userAlerts);
      setStatistics(stats);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors du chargement des alertes';
      setError(message);
      console.error('Error fetching alerts:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  /**
   * Create a new alert
   */
  const createAlert = useCallback(
    async (alert: Omit<Alert, 'id' | 'createdAt' | 'triggeredCount'>): Promise<Alert> => {
      setError(null);

      try {
        const newAlert = await createAlertService(alert);
        setAlerts((prev) => [newAlert, ...prev]);
        setStatistics((prev) => ({
          total: prev.total + 1,
          active: alert.active ? prev.active + 1 : prev.active,
          triggered: prev.triggered,
        }));
        return newAlert;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Erreur lors de la création de l'alerte";
        setError(message);
        throw err;
      }
    },
    []
  );

  /**
   * Update an existing alert
   */
  const updateAlert = useCallback(
    async (alertId: string, updates: Partial<Alert>): Promise<Alert> => {
      setError(null);

      try {
        const updatedAlert = await updateAlertService(alertId, updates);
        setAlerts((prev) => prev.map((alert) => (alert.id === alertId ? updatedAlert : alert)));
        return updatedAlert;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Erreur lors de la mise à jour de l'alerte";
        setError(message);
        throw err;
      }
    },
    []
  );

  /**
   * Delete an alert
   */
  const deleteAlert = useCallback(async (alertId: string): Promise<void> => {
    setError(null);

    try {
      await deleteAlertService(alertId);
      setAlerts((prev) => {
        const alert = prev.find((a) => a.id === alertId);
        if (alert) {
          setStatistics((stats) => ({
            total: stats.total - 1,
            active: alert.active ? stats.active - 1 : stats.active,
            triggered: alert.triggeredCount > 0 ? stats.triggered - 1 : stats.triggered,
          }));
        }
        return prev.filter((a) => a.id !== alertId);
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erreur lors de la suppression de l'alerte";
      setError(message);
      throw err;
    }
  }, []);

  /**
   * Toggle alert active status
   */
  const toggleAlertStatus = useCallback(
    async (alertId: string, active: boolean): Promise<Alert> => {
      setError(null);

      try {
        const updatedAlert = await toggleAlert(alertId, active);
        setAlerts((prev) => prev.map((alert) => (alert.id === alertId ? updatedAlert : alert)));
        setStatistics((prev) => ({
          ...prev,
          active: active ? prev.active + 1 : prev.active - 1,
        }));
        return updatedAlert;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Erreur lors du changement de statut de l'alerte";
        setError(message);
        throw err;
      }
    },
    []
  );

  /**
   * Refresh alerts from server
   */
  const refreshAlerts = useCallback(async () => {
    await fetchAlerts();
  }, [fetchAlerts]);

  // Fetch alerts on mount and when userId changes
  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  return {
    alerts,
    statistics,
    createAlert,
    updateAlert,
    deleteAlert,
    toggleAlertStatus,
    refreshAlerts,
    loading,
    error,
  };
}
