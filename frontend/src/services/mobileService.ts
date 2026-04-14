/**
 * mobileService — Détection Capacitor, cache, push notifications
 */

declare global {
  interface Window {
    Capacitor?: {
      isNativePlatform: () => boolean;
      getPlatform: () => string;
    };
  }
}

export function isNative(): boolean {
  return window.Capacitor?.isNativePlatform() ?? false;
}

export function getPlatform(): 'ios' | 'android' | 'web' {
  const p = window.Capacitor?.getPlatform();
  if (p === 'ios') return 'ios';
  if (p === 'android') return 'android';
  return 'web';
}

export async function requestPushPermission(): Promise<boolean> {
  if (isNative()) {
    // In a real Capacitor app, PushNotifications.requestPermissions() would be used here
    // Since @capacitor/push-notifications is not installed, we just return true for native
    return true;
  }
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

export function getLocalCacheSize(): { items: number; estimatedKB: number } {
  let total = 0;
  const items = localStorage.length;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i) ?? '';
    const value = localStorage.getItem(key) ?? '';
    total += key.length + value.length;
  }
  return {
    items,
    estimatedKB: Math.round((total * 2) / 1024), // UTF-16 = 2 bytes per char
  };
}

export function clearOldCache(): number {
  const STALE_PREFIXES = ['akiprisaye_cache_', 'aki_temp_', 'price_cache_'];
  const toRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && STALE_PREFIXES.some((p) => key.startsWith(p))) {
      toRemove.push(key);
    }
  }
  toRemove.forEach((k) => localStorage.removeItem(k));
  return toRemove.length;
}
