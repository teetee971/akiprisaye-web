/**
 * NotificationCenter
 *
 * In-app notification center for price alerts.
 * Reads triggered alert events from localStorage and displays them
 * with badge counts and dismissal support.
 */

import { useState, useEffect, useCallback } from 'react';
import { Bell, BellOff, X, TrendingDown, TrendingUp, Package, CheckCircle } from 'lucide-react';
// Re-export shared types and storage helpers from the lightweight utility module.
// usePriceAlertEvaluator and other services import from there to avoid pulling
// this React component into the critical-path bundle.
export type { NotificationKind, NotificationItem } from '../utils/notificationStorage';
export {
  loadNotifications,
  persistNotifications,
  addNotification,
  markAllRead,
  dismissNotification,
} from '../utils/notificationStorage';
import {
  type NotificationKind,
  type NotificationItem,
  loadNotifications,
  markAllRead,
  dismissNotification,
} from '../utils/notificationStorage';

// ─── Icon helpers ─────────────────────────────────────────────────────────────

function kindIcon(kind: NotificationKind, className = 'w-4 h-4') {
  switch (kind) {
    case 'price_drop':
      return <TrendingDown className={`${className} text-green-500`} />;
    case 'price_increase':
      return <TrendingUp className={`${className} text-red-500`} />;
    case 'shrinkflation':
      return <Package className={`${className} text-orange-500`} />;
    default:
      return <Bell className={`${className} text-blue-500`} />;
  }
}

function severityClass(severity: NotificationItem['severity']): string {
  switch (severity) {
    case 'high':
      return 'border-l-red-500';
    case 'medium':
      return 'border-l-orange-400';
    default:
      return 'border-l-blue-400';
  }
}

function relativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60_000);
  if (mins < 1) return "À l'instant";
  if (mins < 60) return `Il y a ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Il y a ${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `Il y a ${days}j`;
}

// ─── Component ────────────────────────────────────────────────────────────────

interface NotificationCenterProps {
  /** If true, renders as a full panel instead of a popover */
  fullPage?: boolean;
}

export function NotificationCenter({ fullPage = false }: NotificationCenterProps) {
  const [open, setOpen] = useState(fullPage);
  const [items, setItems] = useState<NotificationItem[]>([]);

  const refresh = useCallback(() => {
    setItems(loadNotifications());
  }, []);

  useEffect(() => {
    refresh();
    // Poll every 30 s so alerts evaluated elsewhere are reflected
    const id = setInterval(refresh, 30_000);
    return () => clearInterval(id);
  }, [refresh]);

  const unread = items.filter((n) => !n.read).length;

  const handleMarkAllRead = () => {
    markAllRead();
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleDismiss = (id: string) => {
    dismissNotification(id);
    setItems((prev) => prev.filter((n) => n.id !== id));
  };

  if (fullPage) {
    return (
      <NotificationList items={items} onDismiss={handleDismiss} onMarkAllRead={handleMarkAllRead} />
    );
  }

  return (
    <div className="relative">
      {/* Bell button */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={`Notifications${unread > 0 ? ` (${unread} non lues)` : ''}`}
        className="relative p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
      >
        {unread > 0 ? (
          <Bell className="w-5 h-5 text-slate-700 dark:text-slate-200" />
        ) : (
          <BellOff className="w-5 h-5 text-slate-400 dark:text-slate-500" />
        )}
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Popover */}
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="absolute right-0 z-50 mt-2 w-80 rounded-xl bg-white dark:bg-slate-800 shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
              <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                Notifications
              </h3>
              {unread > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  <CheckCircle className="w-3 h-3" />
                  Tout marquer lu
                </button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              <NotificationList
                items={items}
                onDismiss={handleDismiss}
                onMarkAllRead={handleMarkAllRead}
                compact
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Notification list (shared between popover and full-page) ─────────────────

interface NotificationListProps {
  items: NotificationItem[];
  onDismiss: (id: string) => void;
  onMarkAllRead: () => void;
  compact?: boolean;
}

function NotificationList({
  items,
  onDismiss,
  onMarkAllRead,
  compact = false,
}: NotificationListProps) {
  if (items.length === 0) {
    return (
      <div
        className={`flex flex-col items-center justify-center py-10 text-slate-400 dark:text-slate-500 ${compact ? 'px-4' : 'py-16'}`}
      >
        <BellOff className="w-8 h-8 mb-2 opacity-40" />
        <p className="text-sm">Aucune notification</p>
      </div>
    );
  }

  return (
    <ul className={compact ? '' : 'space-y-2 p-4'}>
      {!compact && items.some((n) => !n.read) && (
        <li className="flex justify-end mb-2">
          <button
            onClick={onMarkAllRead}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            <CheckCircle className="w-3 h-3" />
            Tout marquer lu
          </button>
        </li>
      )}
      {items.map((n) => (
        <li
          key={n.id}
          className={`
            flex items-start gap-3 px-4 py-3 border-l-4 transition-colors
            ${severityClass(n.severity)}
            ${n.read ? 'bg-white dark:bg-slate-800' : 'bg-blue-50 dark:bg-blue-900/20'}
            ${!compact ? 'rounded-lg border border-slate-200 dark:border-slate-700' : 'border-b border-slate-100 dark:border-slate-700'}
          `}
        >
          <span className="mt-0.5 flex-shrink-0">{kindIcon(n.kind)}</span>
          <div className="flex-1 min-w-0">
            <p
              className={`text-sm font-medium truncate ${n.read ? 'text-slate-700 dark:text-slate-300' : 'text-slate-900 dark:text-white'}`}
            >
              {n.productName}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
              {n.message}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              {n.territory} · {relativeTime(n.triggeredAt)}
            </p>
          </div>
          <button
            onClick={() => onDismiss(n.id)}
            aria-label="Supprimer la notification"
            className="flex-shrink-0 p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-3 h-3" />
          </button>
        </li>
      ))}
    </ul>
  );
}
