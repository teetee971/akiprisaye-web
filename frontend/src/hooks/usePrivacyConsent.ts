/**
 * usePrivacyConsent
 *
 * GDPR-compliant opt-in management for:
 *  - history    : local search/scan consultation history
 *  - analytics  : anonymous usage analytics
 *
 * Storage: localStorage only – no backend sync.
 * Consent is granular per category and versioned.
 *
 * Usage:
 *   const { consent, grantConsent, revokeConsent, hasAnswered } = usePrivacyConsent();
 *   if (consent.history) { // safe to record }
 */
import { useState, useCallback, useEffect } from 'react';
import { safeLocalStorage } from '../utils/safeLocalStorage';

export type ConsentCategory = 'history' | 'analytics';

export interface ConsentState {
  history: boolean;
  analytics: boolean;
}

interface StoredConsent {
  version: number;
  answeredAt: string;
  consent: ConsentState;
}

const STORAGE_KEY = 'akiprisaye:privacy:v1';
const CONSENT_VERSION = 1;

const DEFAULT_CONSENT: ConsentState = {
  history: false,
  analytics: false,
};

function loadStored(): StoredConsent | null {
  try {
    const raw = safeLocalStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredConsent;
    // Invalidate old versions
    if (parsed.version !== CONSENT_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

function persist(consent: ConsentState): void {
  const stored: StoredConsent = {
    version: CONSENT_VERSION,
    answeredAt: new Date().toISOString(),
    consent,
  };
  safeLocalStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
}

export function usePrivacyConsent() {
  const [stored, setStored] = useState<StoredConsent | null>(() => loadStored());

  // Reload if another tab changes consent
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setStored(loadStored());
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const consent: ConsentState = stored?.consent ?? DEFAULT_CONSENT;
  const hasAnswered = stored !== null;

  /** Grant one or all categories */
  const grantConsent = useCallback(
    (categories: ConsentCategory | ConsentCategory[] | 'all') => {
      const next = { ...consent };
      const cats: ConsentCategory[] =
        categories === 'all'
          ? ['history', 'analytics']
          : Array.isArray(categories)
            ? categories
            : [categories];
      for (const c of cats) next[c] = true;
      persist(next);
      setStored(loadStored());
    },
    [consent]
  );

  /** Revoke one or all categories and clear associated data */
  const revokeConsent = useCallback(
    (categories: ConsentCategory | ConsentCategory[] | 'all') => {
      const next = { ...consent };
      const cats: ConsentCategory[] =
        categories === 'all'
          ? ['history', 'analytics']
          : Array.isArray(categories)
            ? categories
            : [categories];
      for (const c of cats) next[c] = false;
      persist(next);
      setStored(loadStored());

      // Erase history if revoked
      if (cats.includes('history')) {
        safeLocalStorage.removeItem('akiprisaye:history:v1');
      }
    },
    [consent]
  );

  /** Accept all – convenience wrapper */
  const acceptAll = useCallback(() => grantConsent('all'), [grantConsent]);

  /** Reject all – convenience wrapper */
  const rejectAll = useCallback(() => revokeConsent('all'), [revokeConsent]);

  return { consent, hasAnswered, grantConsent, revokeConsent, acceptAll, rejectAll };
}
