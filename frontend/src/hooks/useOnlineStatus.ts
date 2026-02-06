/**
 * Online/Offline Detection Hook
 * Phase 2 - Offline OCR Support
 * 
 * Detects network connectivity and provides offline mode indicator
 */

import { useState, useEffect } from 'react';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    function handleOnline() {
      setIsOnline(true);
    }

    function handleOffline() {
      setIsOnline(false);
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

/**
 * Network Quality Detection
 * Detects slow connections that might affect online services
 */
export function useNetworkQuality() {
  const [quality, setQuality] = useState<'fast' | 'slow' | 'offline'>('fast');
  const isOnline = useOnlineStatus();

  useEffect(() => {
    if (!isOnline) {
      setQuality('offline');
      return;
    }

    // Check connection type if available (Chrome, Edge)
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      
      const updateQuality = () => {
        if (!navigator.onLine) {
          setQuality('offline');
          return;
        }

        const effectiveType = connection?.effectiveType;
        
        // 2g or slow-2g = slow
        if (effectiveType === '2g' || effectiveType === 'slow-2g') {
          setQuality('slow');
        } else {
          setQuality('fast');
        }
      };

      updateQuality();
      connection?.addEventListener?.('change', updateQuality);

      return () => {
        connection?.removeEventListener?.('change', updateQuality);
      };
    }
  }, [isOnline]);

  return quality;
}
