 
/**
 * useStoreOpenStatus Hook
 * 
 * Custom hook for real-time store open status tracking
 * Automatically updates status every minute
 */

import { useState, useEffect, useRef } from 'react';
import { isStoreOpen, StoreHours, StoreStatusInfo } from '../utils/storeHoursUtils';

/**
 * Hook to get and track store open status
 * Updates automatically every minute
 * 
 * @param storeHours - Store hours configuration
 * @returns Store status information that updates in real-time
 */
export function useStoreOpenStatus(storeHours: StoreHours | null | undefined): StoreStatusInfo {
  const [statusInfo, setStatusInfo] = useState<StoreStatusInfo>(() => {
    if (!storeHours) {
      return {
        status: 'unknown',
        message: 'Horaires non disponibles',
      };
    }
    return isStoreOpen(storeHours);
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Update status immediately
    const updateStatus = () => {
      if (!storeHours) {
        setStatusInfo({
          status: 'unknown',
          message: 'Horaires non disponibles',
        });
        return;
      }

      const newStatus = isStoreOpen(storeHours);
      setStatusInfo(newStatus);
    };

    // Initial update
    updateStatus();

    // Set up interval to update every minute
    intervalRef.current = setInterval(updateStatus, 60000);

    // Cleanup on unmount or when storeHours changes
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [storeHours]);

  return statusInfo;
}

/**
 * Hook to filter stores by open status
 * 
 * @param stores - Array of stores with hours
 * @param openOnly - If true, only return stores that are currently open
 * @returns Filtered array of stores
 */
export function useFilterStoresByOpenStatus<T extends { hours?: StoreHours }>(
  stores: T[],
  openOnly: boolean
): T[] {
  const [filteredStores, setFilteredStores] = useState<T[]>(stores);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const filterStores = () => {
      if (!openOnly) {
        setFilteredStores(stores);
        return;
      }

      const filtered = stores.filter(store => {
        if (!store.hours) return false;
        const status = isStoreOpen(store.hours);
        return status.status === 'open' || status.status === 'closing_soon';
      });

      setFilteredStores(filtered);
    };

    // Initial filter
    filterStores();

    // Update filter every minute
    intervalRef.current = setInterval(filterStores, 60000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [stores, openOnly]);

  return filteredStores;
}
