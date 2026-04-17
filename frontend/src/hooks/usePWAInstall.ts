/**
 * usePWAInstall.ts
 *
 * Hook that surfaces the PWA "Add to Home Screen" install prompt.
 * Captures the browser's `beforeinstallprompt` event and re-exposes it
 * so any component can trigger the native install dialog on user gesture.
 *
 * Usage:
 *   const { canInstall, install } = usePWAInstall();
 *   if (canInstall) <button onClick={install}>Installer l'app</button>
 *
 * Notes:
 *   - Only fires on browsers that support PWA install (Chrome/Edge/Android).
 *   - The prompt is consumed after the first call to install(); subsequent calls
 *     are no-ops unless the browser fires a new event.
 *   - `installed` becomes true after the user accepts the install dialog.
 */

import { useCallback, useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface UsePWAInstallResult {
  /** True when the browser has provided an install prompt (installable). */
  canInstall: boolean;
  /** True after the user accepted the install dialog. */
  installed: boolean;
  /** Trigger the native install prompt. No-op when canInstall is false. */
  install: () => Promise<void>;
}

export function usePWAInstall(): UsePWAInstallResult {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const installedHandler = () => setInstalled(true);

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', installedHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installedHandler);
    };
  }, []);

  const install = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setInstalled(true);
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  return { canInstall: deferredPrompt !== null, installed, install };
}
