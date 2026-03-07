 
/**
 * useGeolocation Hook
 * Manages geolocation permissions and provides position tracking
 */

import { useState, useEffect, useCallback } from 'react';

interface UserPosition {
  lat: number;
  lon: number;
  accuracy?: number;
  timestamp?: number;
}

interface GeolocationError {
  code: number;
  message: string;
}

interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  continuous?: boolean; // Watch position continuously
}

interface UseGeolocationReturn {
  position: UserPosition | null;
  error: GeolocationError | null;
  loading: boolean;
  permission: 'granted' | 'denied' | 'prompt' | 'unknown';
  requestPermission: () => Promise<void>;
  getCurrentPosition: () => Promise<void>;
  clearPosition: () => void;
}

/**
 * Custom hook for geolocation
 * @param options Geolocation options
 * @returns Geolocation state and controls
 */
export function useGeolocation(
  options: UseGeolocationOptions = {}
): UseGeolocationReturn {
  const {
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 0,
    continuous = false,
  } = options;

  const [position, setPosition] = useState<UserPosition | null>(null);
  const [error, setError] = useState<GeolocationError | null>(null);
  const [loading, setLoading] = useState(false);
  const [permission, setPermission] = useState<
    'granted' | 'denied' | 'prompt' | 'unknown'
  >('unknown');
  const [watchId, setWatchId] = useState<number | null>(null);

  // Check if geolocation is supported
  const isSupported = 'geolocation' in navigator;

  // Check permission status
  useEffect(() => {
    if (!isSupported) {
      setPermission('unknown');
      return;
    }

    // Try to check permission status (not supported in all browsers)
    if ('permissions' in navigator) {
      navigator.permissions
        .query({ name: 'geolocation' })
        .then((result) => {
          setPermission(result.state as 'granted' | 'denied' | 'prompt');
          
          // Listen for permission changes
          result.addEventListener('change', () => {
            setPermission(result.state as 'granted' | 'denied' | 'prompt');
          });
        })
        .catch(() => {
          // Permissions API not supported, assume prompt
          setPermission('prompt');
        });
    } else {
      setPermission('prompt');
    }
  }, [isSupported]);

  // Handle position success
  const handleSuccess = useCallback((pos: globalThis.GeolocationPosition) => {
    const newPosition: UserPosition = {
      lat: pos.coords.latitude,
      lon: pos.coords.longitude,
      accuracy: pos.coords.accuracy,
      timestamp: pos.timestamp,
    };

    setPosition(newPosition);
    setError(null);
    setLoading(false);
  }, []);

  // Handle position error
  const handleError = useCallback((err: GeolocationPositionError) => {
    const newError: GeolocationError = {
      code: err.code,
      message: err.message,
    };

    setError(newError);
    setPosition(null);
    setLoading(false);

    // Update permission based on error
    if (err.code === 1) {
      // PERMISSION_DENIED
      setPermission('denied');
    }
  }, []);

  // Request permission and get position
  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      setError({
        code: 0,
        message: 'Geolocation is not supported by your browser',
      });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      navigator.geolocation.getCurrentPosition(
        handleSuccess,
        handleError,
        {
          enableHighAccuracy,
          timeout,
          maximumAge,
        }
      );
    } catch (_err) {
      setError({
        code: 0,
        message: 'Failed to request geolocation permission',
      });
      setLoading(false);
    }
  }, [isSupported, enableHighAccuracy, timeout, maximumAge, handleSuccess, handleError]);

  // Get current position
  const getCurrentPosition = useCallback(async () => {
    if (!isSupported) {
      setError({
        code: 0,
        message: 'Geolocation is not supported by your browser',
      });
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      handleSuccess,
      handleError,
      {
        enableHighAccuracy,
        timeout,
        maximumAge,
      }
    );
  }, [isSupported, enableHighAccuracy, timeout, maximumAge, handleSuccess, handleError]);

  // Clear position
  const clearPosition = useCallback(() => {
    setPosition(null);
    setError(null);
    setLoading(false);

    // Stop watching if active
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
  }, [watchId]);

  // Setup continuous watching
  useEffect(() => {
    if (!continuous || !isSupported || permission !== 'granted') {
      return;
    }

    const id = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      {
        enableHighAccuracy,
        timeout,
        maximumAge,
      }
    );

    setWatchId(id);

    return () => {
      navigator.geolocation.clearWatch(id);
    };
  }, [
    continuous,
    isSupported,
    permission,
    enableHighAccuracy,
    timeout,
    maximumAge,
    handleSuccess,
    handleError,
  ]);

  return {
    position,
    error,
    loading,
    permission,
    requestPermission,
    getCurrentPosition,
    clearPosition,
  };
}
