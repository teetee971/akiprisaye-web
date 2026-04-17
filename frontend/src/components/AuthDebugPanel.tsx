/**
 * AuthDebugPanel.tsx
 *
 * Floating visual debug overlay for the Firebase OAuth auth flow.
 * Shows real-time auth state (loading, user, redirect flag, route, events).
 *
 * Visible ONLY when:
 *   - import.meta.env.DEV === true, OR
 *   - sessionStorage['auth:debug'] === '1'
 *
 * Activate on a production device without opening DevTools:
 *   sessionStorage.setItem('auth:debug','1'); location.reload();
 * Deactivate:
 *   sessionStorage.removeItem('auth:debug'); location.reload();
 *
 * Or use the secret triple-tap zone in the Footer.
 */

import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { useAuth } from '@/context/authHook';
import { isAuthDebugEnabled, useAuthEvents, subscribeToAuthEvents } from '@/utils/authLogger';
import {
  getRedirectPendingFlag,
  getAuthRetryCount,
  clearAuthTransientStorage,
  type RedirectPendingData,
} from '@/auth/authStorage';
import { getAuthDiagnosticReport, clearAuthHistory } from '@/utils/authLogger';

/** Shorten an ISO timestamp to HH:MM:SS.mmm for compact display. */
function shortTs(iso: string): string {
  try {
    return iso.slice(11, 23);
  } catch {
    return iso;
  }
}

/** Colour code for each event type. */
function eventColour(event: string): string {
  if (event.includes('USER_PRESENT') || event.includes('SUCCESS')) return '#4ade80'; // green
  if (event.includes('NO_USER') || event.includes('TIMEOUT')) return '#f87171'; // red
  if (event.includes('START')) return '#60a5fa'; // blue
  return '#facc15'; // yellow
}

export default function AuthDebugPanel() {
  const [enabled, setEnabled] = useState(false);
  const [minimised, setMinimised] = useState(false);
  const [pendingFlag, setPendingFlag] = useState<RedirectPendingData | null>(null);

  const { user, loading } = useAuth();
  const authCtx = useAuth();
  const { authFlowState, lastIncident, authResolved } = authCtx;
  const location = useLocation();
  const events = useAuthEvents();

  // ── Determine whether debug is enabled ──────────────────────────────────
  useEffect(() => {
    setEnabled(isAuthDebugEnabled());
  }, []);

  // ── Sync the redirect-pending flag with the auth event bus ───────────────
  // Re-read sessionStorage on each auth event (flag is set/cleared during the
  // OAuth cycle) instead of polling on a fixed interval, so we consume no
  // extra CPU cycles when nothing is happening.
  useEffect(() => {
    if (!enabled) return;
    // Initial read on mount (covers flags set before this component rendered).
    setPendingFlag(getRedirectPendingFlag());
    // Re-read whenever an auth event fires — the flag state changes only
    // alongside these events (redirect start, result resolved, timeout, etc.).
    const unsubscribe = subscribeToAuthEvents(() => {
      setPendingFlag(getRedirectPendingFlag());
    });
    return unsubscribe;
  }, [enabled]);

  if (!enabled) return null;

  // ── Status indicators ─────────────────────────────────────────────────────
  const loadingColour = loading ? '#facc15' : '#4ade80';
  const userColour = user ? '#4ade80' : '#94a3b8';
  const flagColour = pendingFlag ? '#f97316' : '#94a3b8';
  const lastEvent = events[events.length - 1];

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 80,
        right: 12,
        zIndex: 99999,
        maxWidth: 320,
        fontFamily: 'monospace',
        fontSize: 11,
        lineHeight: 1.4,
        pointerEvents: 'auto',
      }}
      aria-label="Auth debug panel"
      role="complementary"
    >
      {/* ── Header bar ──────────────────────────────────────────────────── */}
      <button
        type="button"
        style={{
          background: '#1e293b',
          border: '1px solid #475569',
          borderRadius: minimised ? 8 : '8px 8px 0 0',
          padding: '4px 8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          userSelect: 'none',
        }}
        onClick={() => setMinimised((m) => !m)}
        title={minimised ? 'Expand auth debug panel' : 'Collapse auth debug panel'}
        aria-expanded={!minimised}
      >
        <span style={{ color: '#60a5fa', fontWeight: 700 }}>🔒 Auth Debug</span>
        <span style={{ color: '#94a3b8', fontSize: 10 }}>{minimised ? '▲' : '▼'}</span>
      </button>

      {/* ── Body ────────────────────────────────────────────────────────── */}
      {!minimised && (
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid #475569',
            borderTop: 'none',
            borderRadius: '0 0 8px 8px',
            padding: 8,
            backdropFilter: 'blur(4px)',
          }}
        >
          {/* Status row */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
            <StatusBadge colour={loadingColour} label={loading ? 'LOADING' : 'READY'} />
            <StatusBadge
              colour={userColour}
              label={user ? `✓ ${user.email ?? user.uid}` : '✗ no user'}
            />
            <StatusBadge
              colour={flagColour}
              label={pendingFlag ? `⏳ ${pendingFlag.provider}` : '✗ no flag'}
            />
          </div>

          {/* Route */}
          <Row label="Route" value={location.pathname + location.search} />

          {/* User UID */}
          {user && <Row label="UID" value={user.uid} />}

          {/* Pending flag detail */}
          {pendingFlag && <Row label="Flag→next" value={pendingFlag.next} />}

          {/* Last event */}
          {lastEvent && (
            <Row label="Last event" value={lastEvent.event} colour={eventColour(lastEvent.event)} />
          )}

          {/* Event history (last 6 entries) */}
          {events.length > 0 && (
            <div style={{ marginTop: 4, borderTop: '1px solid #334155', paddingTop: 4 }}>
              <div style={{ color: '#64748b', marginBottom: 2 }}>Events ({events.length}):</div>
              {events.slice(-6).map((e) => (
                <div
                  key={`${e.ts}_${e.event}`}
                  style={{
                    color: eventColour(e.event),
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {shortTs(e.ts)} {e.event}
                </div>
              ))}
            </div>
          )}

          {/* Disable button */}
          <button
            type="button"
            onClick={() => {
              try {
                sessionStorage.removeItem('auth:debug');
              } catch {
                /* */
              }
              window.location.reload();
            }}
            style={{
              marginTop: 6,
              width: '100%',
              padding: '2px 0',
              background: '#1e293b',
              border: '1px solid #475569',
              borderRadius: 4,
              color: '#94a3b8',
              cursor: 'pointer',
              fontSize: 10,
            }}
          >
            Disable debug &amp; reload
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Sub-components ─────────────────────────────────────────────────────── */

function StatusBadge({ colour, label }: { colour: string; label: string }) {
  return (
    <span
      style={{
        background: colour + '22',
        border: `1px solid ${colour}`,
        borderRadius: 4,
        padding: '1px 5px',
        color: colour,
        fontSize: 10,
        maxWidth: 140,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        display: 'inline-block',
      }}
      title={label}
    >
      {label}
    </span>
  );
}

function Row({
  label,
  value,
  colour = '#cbd5e1',
}: {
  label: string;
  value: string;
  colour?: string;
}) {
  return (
    <div style={{ display: 'flex', gap: 4, marginBottom: 2, overflow: 'hidden' }}>
      <span style={{ color: '#64748b', flexShrink: 0 }}>{label}:</span>
      <span
        style={{
          color: colour,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
        title={value}
      >
        {value}
      </span>
    </div>
  );
}
