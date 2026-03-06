// @ts-nocheck
/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Enhanced Geolocation Utility
 * 
 * Provides geolocation with improved error handling and user-friendly messages.
 * Detects common issues like Permissions-Policy blocks, iframe restrictions,
 * WebView limitations, and user denials.
 */

import uxMonitor from './uxMonitor';

export interface GeolocationResult {
  success: boolean;
  position?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
  error?: {
    code: string;
    message: string;
    userMessage: string;
    suggestions?: string[];
  };
}

/**
 * Check if Permissions API is available and query geolocation permission state
 */
async function checkPermissionState(): Promise<PermissionState | null> {
  if (!('permissions' in navigator)) {
    return null;
  }

  try {
    const result = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
    return result.state;
  } catch (error) {
    // Permissions API not supported or query failed
    return null;
  }
}

/**
 * Detect if error is caused by Permissions-Policy
 */
function isPermissionsPolicyError(error: GeolocationPositionError): boolean {
  // Check error message for common Permissions-Policy indicators
  const message = error.message.toLowerCase();
  return (
    message.includes('permissions policy') ||
    message.includes('permissions-policy') ||
    message.includes('feature policy') ||
    message.includes('disabled in this document')
  );
}

/**
 * Detect if running in an iframe
 */
function isInIframe(): boolean {
  try {
    return window.self !== window.top;
  } catch (e) {
    // Cross-origin iframe - can't access window.top
    return true;
  }
}

/**
 * Detect if running in a WebView
 */
function isWebView(): boolean {
  const ua = navigator.userAgent || '';
  // Common WebView user agents
  return (
    ua.includes('wv') || // Android WebView
    ua.includes('WebView') ||
    (ua.includes('iPhone') && !ua.includes('Safari')) || // iOS WebView (no Safari in UA)
    (ua.includes('iPad') && !ua.includes('Safari'))
  );
}

/**
 * Map GeolocationPositionError to user-friendly message
 * 
 * Note: Error messages are currently in French to match the application's language.
 * In a future update, consider extracting these messages to a localization/i18n system
 * for multi-language support.
 */
function mapGeolocationError(error: GeolocationPositionError): GeolocationResult['error'] {
  const isInFrame = isInIframe();
  const isWebViewContext = isWebView();

  // Check for Permissions-Policy block
  if (isPermissionsPolicyError(error)) {
    return {
      code: 'PERMISSIONS_POLICY_BLOCKED',
      message: error.message,
      userMessage: isInFrame
        ? 'La géolocalisation est bloquée dans cette iframe. Cette page doit être configurée pour autoriser la géolocalisation.'
        : 'La géolocalisation est bloquée par la politique de permissions du serveur.',
      suggestions: isInFrame
        ? [
            'Le site doit ajouter l\'attribut allow="geolocation" à l\'iframe',
            'Ouvrez cette page directement (hors iframe) si possible'
          ]
        : [
            'Le site doit configurer l\'en-tête HTTP Permissions-Policy',
            'Voir DEPLOYMENT_NOTES.md pour les instructions'
          ]
    };
  }

  // User denied permission
  if (error.code === error.PERMISSION_DENIED) {
    const inFrameMessage = isInFrame
      ? ' Vous êtes dans une iframe, ce qui peut nécessiter des permissions supplémentaires.'
      : '';

    const webViewMessage = isWebViewContext
      ? ' Dans une application mobile, l\'app doit avoir la permission de localisation.'
      : '';

    return {
      code: 'PERMISSION_DENIED',
      message: error.message,
      userMessage: `Vous avez refusé l'accès à votre position.${inFrameMessage}${webViewMessage}`,
      suggestions: [
        'Cliquez sur l\'icône de localisation dans la barre d\'adresse de votre navigateur',
        'Autorisez l\'accès à la localisation pour ce site',
        ...(isWebViewContext ? ['Vérifiez les permissions de l\'application dans les paramètres de votre téléphone'] : []),
        ...(isInFrame ? ['Essayez d\'ouvrir la page directement (hors iframe)'] : [])
      ]
    };
  }

  // Position unavailable
  if (error.code === error.POSITION_UNAVAILABLE) {
    return {
      code: 'POSITION_UNAVAILABLE',
      message: error.message,
      userMessage: 'Impossible de déterminer votre position. Vérifiez que le GPS est activé.',
      suggestions: [
        'Activez le GPS sur votre appareil',
        'Vérifiez votre connexion internet (pour le géoréférencement WiFi)',
        'Essayez de vous placer à l\'extérieur pour un meilleur signal GPS'
      ]
    };
  }

  // Timeout
  if (error.code === error.TIMEOUT) {
    return {
      code: 'TIMEOUT',
      message: error.message,
      userMessage: 'La demande de localisation a pris trop de temps.',
      suggestions: [
        'Réessayez dans quelques instants',
        'Vérifiez que le GPS est activé',
        'Placez-vous dans un endroit avec une meilleure réception'
      ]
    };
  }

  // Unknown error
  return {
    code: 'UNKNOWN_ERROR',
    message: error.message,
    userMessage: 'Une erreur inconnue s\'est produite lors de la géolocalisation.',
    suggestions: ['Réessayez plus tard', 'Vérifiez les paramètres de votre navigateur']
  };
}

/**
 * Request user's geolocation with enhanced error handling
 * 
 * @param showMessage - Optional callback to display messages to the user
 * @returns Promise with GeolocationResult
 */
export async function requestGeolocation(
  showMessage?: (message: string, type: 'info' | 'error' | 'success') => void
): Promise<GeolocationResult> {
  // Check if geolocation is available
  if (!('geolocation' in navigator)) {
    const result: GeolocationResult = {
      success: false,
      error: {
        code: 'NOT_SUPPORTED',
        message: 'Geolocation API not available',
        userMessage: 'Votre navigateur ne supporte pas la géolocalisation.',
        suggestions: ['Utilisez un navigateur récent (Chrome, Firefox, Safari, Edge)']
      }
    };
    
    if (showMessage) {
      showMessage(result.error.userMessage, 'error');
    }
    
    return result;
  }

  // Check permission state if available
  const permissionState = await checkPermissionState();
  
  // PROMPT 4: Monitor geolocation request
  uxMonitor.geolocationRequested();
  
  if (permissionState === 'denied') {
    const result: GeolocationResult = {
      success: false,
      error: {
        code: 'PERMISSION_DENIED',
        message: 'Geolocation permission denied',
        userMessage: 'L\'accès à votre position a été refusé précédemment.',
        suggestions: [
          'Cliquez sur l\'icône de localisation dans la barre d\'adresse',
          'Réinitialisez les permissions pour ce site dans les paramètres de votre navigateur'
        ]
      }
    };
    
    if (showMessage) {
      showMessage(result.error.userMessage, 'error');
    }
    
    // PROMPT 4: Monitor geolocation denied
    uxMonitor.geolocationDenied('denied_previously');
    
    return result;
  }

  if (permissionState === 'prompt' && showMessage) {
    showMessage('Veuillez autoriser l\'accès à votre position...', 'info');
  }

  // Request geolocation
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const result: GeolocationResult = {
          success: true,
          position: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          }
        };
        
        if (showMessage) {
          showMessage('Position obtenue avec succès !', 'success');
        }
        
        // PROMPT 4: Monitor geolocation success
        uxMonitor.geolocationGranted();
        
        resolve(result);
      },
      (error) => {
        const result: GeolocationResult = {
          success: false,
          error: mapGeolocationError(error)
        };
        
        if (showMessage) {
          const errorInfo = result.error!;
          let message = errorInfo.userMessage;
          
          if (errorInfo.suggestions && errorInfo.suggestions.length > 0) {
            message += '\n\nSuggestions:\n' + errorInfo.suggestions.map(s => `• ${s}`).join('\n');
          }
          
          showMessage(message, 'error');
        }
        
        // PROMPT 4: Monitor geolocation denied
        uxMonitor.geolocationDenied(result.error?.code || 'unknown');
        
        resolve(result);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // Cache for 5 minutes
      }
    );
  });
}

/**
 * Check if geolocation is available and likely to work
 */
export async function isGeolocationAvailable(): Promise<{
  available: boolean;
  reason?: string;
}> {
  if (!('geolocation' in navigator)) {
    return {
      available: false,
      reason: 'Geolocation API not supported by browser'
    };
  }

  const permissionState = await checkPermissionState();
  
  if (permissionState === 'denied') {
    return {
      available: false,
      reason: 'Geolocation permission denied'
    };
  }

  return { available: true };
}

/**
 * Get diagnostic information about geolocation setup
 * Useful for debugging
 */
export async function getGeolocationDiagnostics(): Promise<{
  apiSupported: boolean;
  permissionsApiSupported: boolean;
  permissionState: PermissionState | null;
  isInIframe: boolean;
  isWebView: boolean;
  userAgent: string;
}> {
  return {
    apiSupported: 'geolocation' in navigator,
    permissionsApiSupported: 'permissions' in navigator,
    permissionState: await checkPermissionState(),
    isInIframe: isInIframe(),
    isWebView: isWebView(),
    userAgent: navigator.userAgent
  };
}
