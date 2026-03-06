/**
 * usePushNotifications
 *
 * Manages Web Push subscription lifecycle (E – Alertes & notifications).
 *
 * The VAPID public key must be set via VITE_VAPID_PUBLIC_KEY.
 * The subscription endpoint is forwarded to the backend (VITE_PUSH_API_URL)
 * which stores it and sends push messages when price alerts fire.
 *
 * Gracefully degrades when:
 *  - Service worker is unavailable (no HTTPS / old browser)
 *  - VAPID key is not configured
 *  - User denies notification permission
 */
import { useState, useEffect, useCallback } from 'react';
import { logError, logInfo } from '../utils/logger';

export type PushStatus = 'idle' | 'requesting' | 'subscribed' | 'denied' | 'unsupported' | 'error';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;
const PUSH_API_URL = import.meta.env.VITE_PUSH_API_URL as string | undefined;

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export function usePushNotifications() {
  const [status, setStatus] = useState<PushStatus>('idle');
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);

  const isSupported =
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    !!VAPID_PUBLIC_KEY;

  useEffect(() => {
    if (!isSupported) {
      setStatus('unsupported');
      return;
    }
    if (Notification.permission === 'denied') {
      setStatus('denied');
    }
  }, [isSupported]);

  const subscribe = useCallback(async () => {
    if (!isSupported || !VAPID_PUBLIC_KEY) {
      setStatus('unsupported');
      return;
    }

    setStatus('requesting');
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setStatus('denied');
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
      });

      setSubscription(sub);
      setStatus('subscribed');
      logInfo('Push subscription created', { endpoint: sub.endpoint.slice(0, 60) + '…' });

      // Forward subscription to backend if configured
      if (PUSH_API_URL) {
        await fetch(`${PUSH_API_URL}/subscribe`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sub.toJSON()),
        });
      }
    } catch (err) {
      logError('Push subscription failed', err);
      setStatus('error');
    }
  }, [isSupported]);

  const unsubscribe = useCallback(async () => {
    if (!subscription) return;
    try {
      await subscription.unsubscribe();
      setSubscription(null);
      setStatus('idle');

      if (PUSH_API_URL) {
        await fetch(`${PUSH_API_URL}/unsubscribe`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
      }
    } catch (err) {
      logError('Push unsubscription failed', err);
    }
  }, [subscription]);

  return { status, subscription, isSupported, subscribe, unsubscribe };
}
