/**
 * systemSnapshot.ts
 * Captures the current application state for diagnostics.
 * Returns a plain object — safe to JSON.stringify.
 */

export interface SystemSnapshot {
  route: string;
  /** Anonymised user identifier (first 6 chars of UID or 'anonymous') */
  userId: string;
  buildId: string;
  mode: 'development' | 'production' | 'test';
  debugFlags: string[];
  timestamp: string;
  /** Browser info */
  viewport: { width: number; height: number };
  online: boolean;
}

type UserLike = { uid?: string; displayName?: string } | null | undefined;

/**
 * @param user Optional current Firebase/auth user object (anonymised before snapshot)
 */
export function getSystemSnapshot(user?: UserLike): SystemSnapshot {
  const uid = user?.uid;
  const userId = uid ? uid.slice(0, 6) + '…' : 'anonymous';

  const debugFlags: string[] = [];
  try {
    if (sessionStorage.getItem('auth:debug') === '1') debugFlags.push('auth');
    if (localStorage.getItem('debug') === 'true') debugFlags.push('global');
    if (new URLSearchParams(window.location.search).get('debug') === '1') debugFlags.push('query');
  } catch {
    // storage unavailable
  }

  return {
    route: window.location.pathname,
    userId,
    buildId: (window as Window & { __BUILD_SHA__?: string }).__BUILD_SHA__ ?? 'unknown',
    mode: import.meta.env.MODE as SystemSnapshot['mode'],
    debugFlags,
    timestamp: new Date().toISOString(),
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
    },
    online: navigator.onLine,
  };
}
