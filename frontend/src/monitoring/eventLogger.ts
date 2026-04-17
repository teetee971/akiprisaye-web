/**
 * eventLogger.ts
 * Centralised business event logger.
 * Call logEvent() anywhere in the app to track significant user / system actions.
 */

import { monitoringBuffer } from './storageBuffer';

export type EventName =
  | 'login_success'
  | 'login_error'
  | 'logout'
  | 'oauth_start'
  | 'oauth_callback'
  | 'oauth_error'
  | 'data_fetch_error'
  | 'api_timeout'
  | 'scan_success'
  | 'scan_error'
  | 'price_reported'
  | 'basket_viewed'
  | 'comparator_used'
  | 'debug_panel_opened'
  | string; // allow extension without breaking TS

export interface AppEvent {
  category: 'event';
  name: EventName;
  payload?: Record<string, unknown>;
  route: string;
  timestamp: string;
}

/**
 * Log a business event.
 * @param name  Event name (use EventName values for autocomplete)
 * @param payload Optional structured metadata (never include PII)
 */
export function logEvent(name: EventName, payload?: Record<string, unknown>): void {
  const entry: AppEvent = {
    category: 'event',
    name,
    payload,
    route: window.location.pathname,
    timestamp: new Date().toISOString(),
  };
  monitoringBuffer.addItem(entry);
  if (import.meta.env.DEV) {
    console.info(`[eventLogger] ${name}`, payload ?? '');
  }
}

/** Return all buffered events */
export function getEvents(): AppEvent[] {
  return monitoringBuffer
    .getItems()
    .filter(
      (item): item is AppEvent =>
        typeof item === 'object' && item !== null && (item as AppEvent).category === 'event'
    );
}
