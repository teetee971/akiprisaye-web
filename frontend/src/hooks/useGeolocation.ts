/**
 * useGeolocation Hook
 * Manage browser geolocation with permissions
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { GeolocationState } from '../types/map';

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    position: null,
    accuracy: null,
    loading: false,
    error: null,
    permissionStatus: null,
  });

  const watchIdRef = useRef<number | null>(null);

  /**
   * Request user location once
   */
  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        error: 'Geolocation is not supported by your browser',
      }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      position => {
        setState({
          position: {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          },
          accuracy: position.coords.accuracy,
          loading: false,
          error: null,
          permissionStatus: 'granted',
        });
      },
      error => {
        let errorMessage = 'Unable to retrieve your location';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied';
            setState(prev => ({
              ...prev,
              loading: false,
              error: errorMessage,
              permissionStatus: 'denied',
            }));
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable';
            setState(prev => ({
              ...prev,
              loading: false,
              error: errorMessage,
            }));
            break;
          case error.TIMEOUT:
            errorMessage = 'The request to get user location timed out';
            setState(prev => ({
              ...prev,
              loading: false,
              error: errorMessage,
            }));
            break;
          default:
            setState(prev => ({
              ...prev,
              loading: false,
              error: errorMessage,
            }));
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, []);

  /**
   * Watch position continuously
   */
  const watchPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        error: 'Geolocation is not supported by your browser',
      }));
      return;
    }

    // Stop existing watch if any
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    watchIdRef.current = navigator.geolocation.watchPosition(
      position => {
        setState({
          position: {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          },
          accuracy: position.coords.accuracy,
          loading: false,
          error: null,
          permissionStatus: 'granted',
        });
      },
      error => {
        let errorMessage = 'Unable to retrieve your location';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied';
            setState(prev => ({
              ...prev,
              loading: false,
              error: errorMessage,
              permissionStatus: 'denied',
            }));
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable';
            setState(prev => ({
              ...prev,
              loading: false,
              error: errorMessage,
            }));
            break;
          case error.TIMEOUT:
            errorMessage = 'The request to get user location timed out';
            setState(prev => ({
              ...prev,
              loading: false,
              error: errorMessage,
            }));
            break;
          default:
            setState(prev => ({
              ...prev,
              loading: false,
              error: errorMessage,
            }));
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, []);

  /**
   * Stop watching position
   */
  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopWatching();
    };
  }, [stopWatching]);

  // Check permission status
  useEffect(() => {
    if ('permissions' in navigator) {
      navigator.permissions
        .query({ name: 'geolocation' as PermissionName })
        .then(result => {
          setState(prev => ({
            ...prev,
            permissionStatus: result.state as 'granted' | 'denied' | 'prompt',
          }));

          // Listen for permission changes
          result.onchange = () => {
            setState(prev => ({
              ...prev,
              permissionStatus: result.state as 'granted' | 'denied' | 'prompt',
            }));
          };
        })
        .catch(() => {
          // Permission API not supported, do nothing
        });
    }
  }, []);

  return {
    ...state,
    requestLocation,
    watchPosition,
    stopWatching,
  };
}
