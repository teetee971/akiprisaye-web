/**
 * Offline Mode Indicator
 * Phase 2 - Offline OCR Support
 *
 * Displays discrete indicator when user is offline
 * Shows network quality when connection is slow
 */

import { useOnlineStatus, useNetworkQuality } from '../hooks/useOnlineStatus';

export function OfflineIndicator() {
  const isOnline = useOnlineStatus();
  const quality = useNetworkQuality();

  // Don't show anything if connection is good
  if (isOnline && quality === 'fast') {
    return null;
  }

  return (
    <div
      className="fixed top-16 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-sm font-medium shadow-lg transition-all duration-300"
      style={{
        backgroundColor: quality === 'offline' ? 'rgb(239 68 68 / 0.9)' : 'rgb(251 191 36 / 0.9)',
        zIndex: 1000,
      }}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="flex items-center gap-2 text-white">
        <span className="text-base">{quality === 'offline' ? '📡' : '⚠️'}</span>
        <span>{quality === 'offline' ? 'Mode hors ligne' : 'Connexion lente'}</span>
        {quality === 'offline' && (
          <span className="ml-1 text-xs opacity-90">• OCR local actif</span>
        )}
      </div>
    </div>
  );
}
