/**
 * notificationStorage.ts
 *
 * Lightweight, side-effect-free helpers for reading and writing in-app
 * notifications to localStorage.  Extracted here so services/hooks that only
 * need `addNotification` (e.g. usePriceAlertEvaluator) don't have to pull in
 * the full NotificationCenter React component — keeping it out of the critical
 * path bundle.
 */

import { safeLocalStorage } from '../utils/safeLocalStorage';

export type NotificationKind = 'price_drop' | 'price_increase' | 'shrinkflation' | 'availability';

export interface NotificationItem {
  id: string;
  kind: NotificationKind;
  productName: string;
  territory: string;
  message: string;
  triggeredAt: string; // ISO
  read: boolean;
  severity: 'low' | 'medium' | 'high';
}

const NOTIF_KEY = 'akiprisaye:notifications:v1';
const MAX_STORED = 50;

export function loadNotifications(): NotificationItem[] {
  const raw = safeLocalStorage?.getItem(NOTIF_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as NotificationItem[]) : [];
  } catch {
    return [];
  }
}

export function persistNotifications(items: NotificationItem[]): void {
  safeLocalStorage?.setItem(NOTIF_KEY, JSON.stringify(items.slice(0, MAX_STORED)));
}

export function addNotification(item: Omit<NotificationItem, 'id' | 'read' | 'triggeredAt'>): void {
  const existing = loadNotifications();
  const newItem: NotificationItem = {
    ...item,
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    read: false,
    triggeredAt: new Date().toISOString(),
  };
  persistNotifications([newItem, ...existing]);
}

export function markAllRead(): void {
  const items = loadNotifications().map((n) => ({ ...n, read: true }));
  persistNotifications(items);
}

export function dismissNotification(id: string): void {
  const items = loadNotifications().filter((n) => n.id !== id);
  persistNotifications(items);
}
