/**
 * errorTracker.ts
 * Captures runtime errors and promise rejections in a structured format.
 * Extends the existing runtimeCrashProbe with a proper typed buffer.
 * Safe for production: no console output unless in DEV.
 */

import { monitoringBuffer } from './storageBuffer';

export interface ErrorEntry {
  type: 'runtime_error' | 'promise_rejection';
  message: string;
  stack?: string;
  route: string;
  timestamp: string;
  userAgent: string;
  buildId: string;
}

let _installed = false;

function getBuildId(): string {
  return (window as Window & { __BUILD_SHA__?: string }).__BUILD_SHA__ ?? 'unknown';
}

function makeEntry(type: ErrorEntry['type'], message: string, stack?: string): ErrorEntry {
  return {
    type,
    message: message.slice(0, 500), // cap length for storage
    stack: stack?.slice(0, 1000),
    route: window.location.pathname,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent.slice(0, 200),
    buildId: getBuildId(),
  };
}

function onError(event: ErrorEvent): void {
  const msg = event.message ?? String(event.error ?? 'Unknown error');
  const stack = (event.error as Error | null)?.stack;
  const entry = makeEntry('runtime_error', msg, stack);
  monitoringBuffer.addItem(entry);
  if (import.meta.env.DEV) {
    console.warn('[errorTracker] runtime_error', entry);
  }
}

function onUnhandledRejection(event: PromiseRejectionEvent): void {
  const reason = event.reason;
  const msg = reason instanceof Error ? reason.message : String(reason ?? 'Unhandled rejection');
  const stack = reason instanceof Error ? reason.stack : undefined;
  const entry = makeEntry('promise_rejection', msg, stack);
  monitoringBuffer.addItem(entry);
  if (import.meta.env.DEV) {
    console.warn('[errorTracker] promise_rejection', entry);
  }
}

/**
 * Install global error listeners.
 * Idempotent — safe to call from React.StrictMode (double-invoke guard).
 */
export function initErrorTracker(): void {
  if (_installed) return;
  _installed = true;
  window.addEventListener('error', onError);
  window.addEventListener('unhandledrejection', onUnhandledRejection);
}

/** Return all buffered errors (newest last) */
export function getErrors(): ErrorEntry[] {
  return monitoringBuffer
    .getItems()
    .filter(
      (item): item is ErrorEntry =>
        typeof item === 'object' &&
        item !== null &&
        'type' in item &&
        ((item as ErrorEntry).type === 'runtime_error' ||
          (item as ErrorEntry).type === 'promise_rejection')
    );
}

/** Reset install flag (tests only) */
export function _resetErrorTracker(): void {
  _installed = false;
  window.removeEventListener('error', onError);
  window.removeEventListener('unhandledrejection', onUnhandledRejection);
}
