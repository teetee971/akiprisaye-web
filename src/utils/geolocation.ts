/**
 * Enhanced Geolocation Utility with Permissions API and Error Handling
 * 
 * Provides geolocation functionality with:
 * - Graceful error handling for Permissions-Policy blocks
 * - Detection of common geolocation failure causes
 * - User-friendly error messages
 * - Permissions API support when available
 */

export interface GeolocationResult {
  position?: GeolocationPosition;
  error?: string;
  errorType?: 'permission-denied' | 'permissions-policy' | 'unavailable' | 'timeout' | 'unknown';
}

export interface GeolocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

/**
 * Check if Permissions API is available and query geolocation permission state
 */
async function checkGeolocationPermission(): Promise<'granted' | 'denied' | 'prompt' | 'unavailable'> {
  // Check if Permissions API is available
  if (!navigator.permissions || !navigator.permissions.query) {
    return 'unavailable';
  }

  try {
    const result = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
    return result.state as 'granted' | 'denied' | 'prompt';
  } catch (error) {
    // Permissions API failed, likely due to Permissions-Policy
    console.warn('Permissions API query failed:', error);
    return 'unavailable';
  }
}

/**
 * Detect if error is due to Permissions-Policy
 */
function isPermissionsPolicyError(error: GeolocationPositionError | Error): boolean {
  const message = error.message?.toLowerCase() || '';
  const hasPermissionPolicyKeyword = (
    message.includes('permissions policy') ||
    message.includes('permission-policy') ||
    message.includes('permissions-policy') ||
    message.includes('not allowed by permissions policy')
  );
  
  const hasDisabledKeyword = message.includes('disabled in this document');
  
  // Must have both a policy-related keyword AND indication that it's blocked
  // OR have the specific "disabled in this document" phrase which is unique to policy blocks
  return hasPermissionPolicyKeyword || hasDisabledKeyword;
}

/**
 * Generate user-friendly error message based on error type
 */
function getFriendlyErrorMessage(errorType: GeolocationResult['errorType']): string {
  switch (errorType) {
    case 'permissions-policy':
      return 'La géolocalisation est désactivée par la configuration du site. Consultez DEPLOYMENT_NOTES.md pour résoudre ce problème.';
    case 'permission-denied':
      return 'Vous avez refusé l\'accès à votre position. Veuillez autoriser la géolocalisation dans les paramètres de votre navigateur.';
    case 'unavailable':
      return 'La géolocalisation n\'est pas disponible sur cet appareil ou dans ce navigateur.';
    case 'timeout':
      return 'La demande de géolocalisation a expiré. Veuillez réessayer.';
    default:
      return 'Impossible d\'obtenir votre position. Veuillez réessayer.';
  }
}

/**
 * Request user's geolocation with comprehensive error handling
 * 
 * @param showMessage - Optional callback to display status messages to the user
 * @returns Promise with GeolocationResult containing position or error details
 * 
 * @example
 * const result = await requestGeolocation((msg) => setStatusMessage(msg));
 * if (result.position) {
 *   console.log('Location:', result.position.coords);
 * } else {
 *   console.error('Error:', result.error);
 * }
 */
export async function requestGeolocation(
  showMessage?: (message: string, type: 'info' | 'error' | 'success') => void
): Promise<GeolocationResult> {
  // Check if geolocation is available
  if (!('geolocation' in navigator)) {
    const error = 'La géolocalisation n\'est pas disponible dans ce navigateur.';
    showMessage?.(error, 'error');
    return {
      error,
      errorType: 'unavailable'
    };
  }

  // Check permissions first (if available)
  const permissionState = await checkGeolocationPermission();
  
  if (permissionState === 'denied') {
    const error = getFriendlyErrorMessage('permission-denied');
    showMessage?.(error, 'error');
    return {
      error,
      errorType: 'permission-denied'
    };
  }

  // Double-check geolocation is still available (for edge cases)
  if (!('geolocation' in navigator) || !navigator.geolocation) {
    const error = 'La géolocalisation n\'est pas disponible dans ce navigateur.';
    showMessage?.(error, 'error');
    return {
      error,
      errorType: 'unavailable'
    };
  }

  // Show loading message
  showMessage?.('Demande de localisation en cours...', 'info');

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        showMessage?.('Position obtenue avec succès.', 'success');
        resolve({
          position
        });
      },
      (error) => {
        let errorType: GeolocationResult['errorType'] = 'unknown';
        let errorMessage = '';

        // Detect Permissions-Policy block
        if (isPermissionsPolicyError(error)) {
          errorType = 'permissions-policy';
          errorMessage = getFriendlyErrorMessage('permissions-policy');
          console.error('Permissions-Policy blocking geolocation. See DEPLOYMENT_NOTES.md for fixes.');
        } else {
          // Handle standard GeolocationPositionError codes
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorType = 'permission-denied';
              errorMessage = getFriendlyErrorMessage('permission-denied');
              break;
            case error.POSITION_UNAVAILABLE:
              errorType = 'unavailable';
              errorMessage = getFriendlyErrorMessage('unavailable');
              break;
            case error.TIMEOUT:
              errorType = 'timeout';
              errorMessage = getFriendlyErrorMessage('timeout');
              break;
            default:
              errorMessage = getFriendlyErrorMessage('unknown');
          }
        }

        showMessage?.(errorMessage, 'error');
        resolve({
          error: errorMessage,
          errorType
        });
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  });
}

/**
 * Get simple coordinates from geolocation result
 */
export function getCoordinates(result: GeolocationResult): GeolocationCoordinates | null {
  if (!result.position) {
    return null;
  }
  
  return {
    latitude: result.position.coords.latitude,
    longitude: result.position.coords.longitude,
    accuracy: result.position.coords.accuracy
  };
}

/**
 * Check if geolocation is likely blocked by Permissions-Policy
 * This is a heuristic check - actual blocking is detected during requestGeolocation
 */
export async function isLikelyBlockedByPermissionsPolicy(): Promise<boolean> {
  // If Permissions API is unavailable, it might be blocked
  const permissionState = await checkGeolocationPermission();
  return permissionState === 'unavailable';
}
