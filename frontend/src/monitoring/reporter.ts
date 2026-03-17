/**
 * reporter.ts
 * Abstraction layer for sending monitoring data.
 *
 * Current strategies:
 *  - 'console'  — dev-only structured log
 *  - 'buffer'   — writes to monitoringBuffer (default)
 *
 * Future strategies (drop-in extension):
 *  - 'firebase' — Firestore write
 *  - 'api'      — custom endpoint / Cloudflare Worker
 */

import { monitoringBuffer } from './storageBuffer';

export type ReportStrategy = 'console' | 'buffer';

export interface ReportOptions {
  strategy?: ReportStrategy | ReportStrategy[];
}

/**
 * Send arbitrary monitoring data through one or more strategies.
 * @param data     Any serialisable object
 * @param options  Optional strategy override (defaults to ['buffer'])
 */
export function report(data: unknown, options?: ReportOptions): void {
  const strategies: ReportStrategy[] = Array.isArray(options?.strategy)
    ? options.strategy
    : options?.strategy
      ? [options.strategy]
      : ['buffer'];

  for (const strategy of strategies) {
    switch (strategy) {
      case 'buffer':
        monitoringBuffer.addItem(data);
        break;
      case 'console':
        if (import.meta.env.DEV) {
          console.log('[reporter]', data);
        }
        break;
      default:
        // Unknown strategy — silently skip (forward-compat)
        break;
    }
  }
}

/** Flush the buffer (e.g. before page unload for future backend) */
export function flushBuffer(): unknown[] {
  const items = monitoringBuffer.getItems();
  monitoringBuffer.clear();
  return items;
}
