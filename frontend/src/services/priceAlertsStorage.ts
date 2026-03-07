/**
 * Shared price alerts storage constants and types.
 * Centralises the localStorage key and the SavedAlert shape so that
 * PriceAlertsPage and MonCompte always read/write the same key.
 */

import { safeLocalStorage } from '../utils/safeLocalStorage';

export const ALERTS_STORAGE_KEY = 'akiprisaye:price_alerts:v1';

export interface SavedAlert {
  id: string;
  productName: string;
  productEAN: string;
  alertType: string;
  thresholdMode: string;
  threshold: number;
  absolutePrice: string | number;
  territory: string;
  createdAt: string;
}

/** Read all saved alerts from localStorage (returns empty array on error). */
export function loadAlerts(): SavedAlert[] {
  const raw = safeLocalStorage?.getItem(ALERTS_STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SavedAlert[]) : [];
  } catch {
    return [];
  }
}

/** Persist the given alerts array to localStorage. */
export function persistAlerts(alerts: SavedAlert[]): void {
  safeLocalStorage?.setItem(ALERTS_STORAGE_KEY, JSON.stringify(alerts));
}
