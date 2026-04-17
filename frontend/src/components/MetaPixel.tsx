/**
 * MetaPixel.tsx
 *
 * Consent-gated Meta (Facebook) Pixel integration.
 *
 * Fires ONLY when ALL of the following are true:
 *   1. VITE_META_PIXEL_ID is set at build time (non-empty string)
 *   2. The user has granted `analytics` consent via usePrivacyConsent
 *
 * When consent is revoked the script tag is removed and `fbq` is cleared.
 *
 * Configuration:
 *   Set VITE_META_PIXEL_ID in .env.local or as a GitHub secret.
 *   Add the domain to the Meta Business Manager pixel settings.
 *
 * Usage:
 *   Mount once inside Layout — renders nothing visible.
 *   <MetaPixel />
 *
 * Tracked events (automatic):
 *   PageView — on every mount (consent granted)
 *
 * Manual events (call from anywhere):
 *   window.fbq?.('track', 'Lead');
 *   window.fbq?.('track', 'ViewContent', { content_name: 'comparateur' });
 */

import { useEffect } from 'react';
import { usePrivacyConsent } from '../hooks/usePrivacyConsent';

// Pixel ID injected at build time — empty string when not configured.
const PIXEL_ID = (import.meta.env.VITE_META_PIXEL_ID ?? '').trim();

// Script URL — typed as const so TS doesn't widen to string for CSP reasons
const FB_SDK_URL = 'https://connect.facebook.net/en_US/fbevents.js' as const;
const SCRIPT_ID = 'meta-pixel-sdk';

function loadPixel(pixelId: string) {
  if (document.getElementById(SCRIPT_ID)) return; // already loaded

  // Minimal pixel bootstrap (mirrors Meta's official snippet)
  type FbqFn = (...args: unknown[]) => void;
  interface FbqQueue extends FbqFn {
    callMethod?: (...args: unknown[]) => void;
    queue: unknown[][];
    push: FbqFn;
    loaded: boolean;
    version: string;
  }

  if (!window.fbq) {
    const fbq: FbqQueue = function (...args: unknown[]) {
      if (fbq.callMethod) {
        fbq.callMethod(...args);
      } else {
        fbq.queue.push(args);
      }
    } as FbqQueue;
    fbq.push = fbq;
    fbq.loaded = true;
    fbq.version = '2.0';
    fbq.queue = [];
    window.fbq = fbq;
    (window as { _fbq?: unknown })._fbq = fbq;
  }

  const script = document.createElement('script');
  script.id = SCRIPT_ID;
  script.async = true;
  script.src = FB_SDK_URL;

  const first = document.getElementsByTagName('script')[0];
  first.parentNode?.insertBefore(script, first);

  window.fbq('init', pixelId);
  window.fbq('track', 'PageView');
}

function unloadPixel() {
  document.getElementById(SCRIPT_ID)?.remove();
  // Clear the fbq reference so re-consent triggers a fresh init
  delete window.fbq;
  delete (window as { _fbq?: unknown })._fbq;
}

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: unknown;
  }
}

export default function MetaPixel() {
  const { consent } = usePrivacyConsent();

  useEffect(() => {
    // No pixel ID configured — nothing to do
    if (!PIXEL_ID) return;

    if (consent.analytics) {
      loadPixel(PIXEL_ID);
    } else {
      unloadPixel();
    }

    return () => {
      // Component unmount — leave pixel loaded if consent still active
    };
  }, [consent.analytics]);

  // Renders nothing visible
  return null;
}
