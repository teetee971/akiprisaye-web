/**
 * PWA Service — Service Worker registration, push subscription, offline sync
 */

const SW_PATH = '/service-worker.js';

export function registerServiceWorker(): void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(SW_PATH)
      .then((registration) => {
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New version available — could show a toast here
                console.info('[PWA] Nouvelle version disponible');
              }
            });
          }
        });
      })
      .catch((err) => {
        console.warn('[PWA] Service Worker registration failed:', err);
      });
  });
}

export async function subscribeToPush(): Promise<PushSubscription | null> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return null;

  try {
    const registration = await navigator.serviceWorker.ready;
    const existing = await registration.pushManager.getSubscription();
    if (existing) return existing;

    // VAPID public key placeholder — replace with real key in production
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U',
      ) as unknown as BufferSource,
    });
    return subscription;
  } catch (err) {
    console.warn('[PWA] Push subscription failed:', err);
    return null;
  }
}

export async function syncOfflineQueue(): Promise<void> {
  const queueRaw = localStorage.getItem('akiprisaye_sync_queue');
  if (!queueRaw) return;

  let queue: unknown[];
  try {
    queue = JSON.parse(queueRaw) as unknown[];
  } catch {
    return;
  }

  if (queue.length === 0) return;

  const failed: unknown[] = [];
  for (const item of queue) {
    try {
      await fetch('/api/v1/prices/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
    } catch {
      failed.push(item);
    }
  }

  if (failed.length === 0) {
    localStorage.removeItem('akiprisaye_sync_queue');
  } else {
    localStorage.setItem('akiprisaye_sync_queue', JSON.stringify(failed));
  }
}

export function getInstallPrompt(): BeforeInstallPromptEvent | null {
  return (window as Window & { __pwaInstallPrompt?: BeforeInstallPromptEvent }).__pwaInstallPrompt ?? null;
}

export function captureInstallPrompt(): void {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    (window as Window & { __pwaInstallPrompt?: BeforeInstallPromptEvent }).__pwaInstallPrompt = e as BeforeInstallPromptEvent;
  });
}

// Helpers
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

// Type for the beforeinstallprompt event (not in standard TS lib)
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}
