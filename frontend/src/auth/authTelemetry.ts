/**
 * authTelemetry.ts
 *
 * Typed telemetry event model for the Firebase Auth flow.
 * Provides structured creation, formatting, and diagnostic reporting.
 * No React, no Firebase — pure logic, fully testable.
 */

import type { AuthFlowState } from './authStateMachine';
import type { AuthIncidentCode } from './authIncidents';

export type AuthFlowMode = 'popup' | 'redirect';

export interface AuthTelemetryEvent {
  type: string;
  ts: number;
  route?: string;
  provider?: string;
  mode?: AuthFlowMode;
  state?: AuthFlowState;
  incident?: AuthIncidentCode | null;
  hasPendingFlag?: boolean;
  retryCount?: number;
  hasUser?: boolean;
  /** Truncated UID — never full UID. */
  uid?: string | null;
  /** Firebase error code only — never raw tokens or sensitive payloads. */
  errorCode?: string | null;
}

/**
 * Truncates a Firebase UID for safe inclusion in telemetry.
 * Returns null if uid is falsy.
 */
export function truncateUid(uid: string | null | undefined): string | null {
  if (!uid) return null;
  if (uid.length <= 8) return uid;
  return `${uid.slice(0, 4)}…${uid.slice(-4)}`;
}

/** Creates a typed telemetry event with the current timestamp. */
export function createAuthTelemetryEvent(
  type: string,
  input: Omit<AuthTelemetryEvent, 'type' | 'ts'> = {},
): AuthTelemetryEvent {
  return {
    type,
    ts: Date.now(),
    ...input,
  };
}

/** Formats a single telemetry event as a compact human-readable string. */
export function formatAuthTelemetryEvent(event: AuthTelemetryEvent): string {
  const date = new Date(event.ts).toISOString();
  const parts: Array<string | null> = [
    `[${date}]`,
    event.type,
    event.route       ? `route=${event.route}`              : null,
    event.provider    ? `provider=${event.provider}`        : null,
    event.mode        ? `mode=${event.mode}`                : null,
    event.state       ? `state=${event.state}`              : null,
    event.incident    ? `incident=${event.incident}`        : null,
    typeof event.hasPendingFlag === 'boolean'
      ? `pending=${event.hasPendingFlag}`                   : null,
    typeof event.retryCount === 'number'
      ? `retry=${event.retryCount}`                         : null,
    typeof event.hasUser === 'boolean'
      ? `hasUser=${event.hasUser}`                          : null,
    event.uid         ? `uid=${event.uid}`                  : null,
    event.errorCode   ? `error=${event.errorCode}`          : null,
  ];

  return parts.filter(Boolean).join(' ');
}

/** Formats an array of telemetry events as a multi-line report string. */
export function formatAuthDiagnosticReport(events: AuthTelemetryEvent[]): string {
  if (events.length === 0) return '(no auth events recorded)';
  return events.map(formatAuthTelemetryEvent).join('\n');
}
