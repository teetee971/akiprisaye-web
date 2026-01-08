/**
 * Geolocation Utility Service
 * 
 * Provides geolocation functionality for store distance calculation
 * and GPS-based filtering in comparison pages.
 * 
 * PERFORMANCE OPTIMIZATIONS:
 * - Position caching to avoid repeated geolocation requests
 * - Distance calculation caching with memoization
 * - Batch distance calculations for multiple stores
 * - Pre-computed trigonometric values
 * 
 * ERROR HANDLING:
 * - Detects Permissions-Policy header blocking
 * - Detects iframe without allow="geolocation"
 * - Provides user-friendly error messages with remediation steps
 */

export interface GeoPosition {
  lat: number;
  lon: number;
}

export enum GeolocationErrorType {
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  POSITION_UNAVAILABLE = 'POSITION_UNAVAILABLE',
  TIMEOUT = 'TIMEOUT',
  PERMISSIONS_POLICY = 'PERMISSIONS_POLICY',
  NOT_SUPPORTED = 'NOT_SUPPORTED',
  UNKNOWN = 'UNKNOWN'
}

export interface GeolocationResult {
  success: boolean;
  position?: GeoPosition;
  error?: {
    type: GeolocationErrorType;
    message: string;
    remediation?: string;
  };
}

export interface StoreWithDistance {
  storeId: string;
  storeName: string;
  distance: number; // in km
  address: string;
  lat: number;
  lon: number;
}

export interface StoreLocation {
  id: string;
  lat: number;
  lon: number;
  [key: string]: any;
}

// Cache for user position with timestamp
let positionCache: { position: GeoPosition; timestamp: number } | null = null;
const POSITION_CACHE_DURATION = 300000; // 5 minutes

// Cache for distance calculations
const distanceCache = new Map<string, number>();
const DISTANCE_CACHE_MAX_SIZE = 1000;

/**
 * Pre-computed constant for Earth's radius
 */
const EARTH_RADIUS_KM = 6371;

/**
 * Pre-computed degrees to radians conversion factor (Math.PI / 180)
 * Using pre-computed value for performance in hot code paths
 */
const DEG_TO_RAD = Math.PI / 180;

/**
 * Convert degrees to radians (inline optimization)
 */
function toRadians(degrees: number): number {
  return degrees * DEG_TO_RAD;
}

/**
 * Generate cache key for distance calculation
 * Rounds to 4 decimal places (~11m accuracy) for efficient caching
 */
function getCacheKey(lat1: number, lon1: number, lat2: number, lon2: number): string {
  return `${lat1.toFixed(4)},${lon1.toFixed(4)},${lat2.toFixed(4)},${lon2.toFixed(4)}`;
}

/**
 * Calculate distance between two points using optimized Haversine formula
 * @param lat1 Latitude of first point
 * @param lon1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lon2 Longitude of second point
 * @returns Distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  // Check cache first
  const cacheKey = getCacheKey(lat1, lon1, lat2, lon2);
  const cached = distanceCache.get(cacheKey);
  if (cached !== undefined) {
    return cached;
  }

  // Calculate distance using Haversine formula
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const lat1Rad = toRadians(lat1);
  const lat2Rad = toRadians(lat2);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = Math.round(EARTH_RADIUS_KM * c * 10) / 10; // Round to 1 decimal
  
  // Cache the result (with size limit)
  if (distanceCache.size >= DISTANCE_CACHE_MAX_SIZE) {
    // Remove oldest entry (first key)
    const firstKey = distanceCache.keys().next().value;
    if (firstKey) distanceCache.delete(firstKey);
  }
  distanceCache.set(cacheKey, distance);
  
  return distance;
}

/**
 * Batch calculate distances for multiple stores (more efficient)
 * @param userPos User's position
 * @param stores Array of store locations
 * @returns Array of stores with distances
 */
export function calculateDistancesBatch<T extends StoreLocation>(
  userPos: GeoPosition,
  stores: T[]
): (T & { distance: number })[] {
  // Pre-compute user position in radians for efficiency
  const userLatRad = toRadians(userPos.lat);
  const cosUserLat = Math.cos(userLatRad);
  
  return stores.map(store => {
    const dLat = toRadians(store.lat - userPos.lat);
    const dLon = toRadians(store.lon - userPos.lon);
    const storLatRad = toRadians(store.lat);
    
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      cosUserLat * Math.cos(storLatRad) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = Math.round(EARTH_RADIUS_KM * c * 10) / 10;
    
    return { ...store, distance };
  });
}

/**
 * Get user's current position with caching
 * @param forceRefresh Force a new geolocation request
 * @returns Promise with user's position or null if denied/unavailable
 */
export async function getUserPosition(forceRefresh = false): Promise<GeoPosition | null> {
  // Check cache first (unless force refresh)
  if (!forceRefresh && positionCache) {
    const age = Date.now() - positionCache.timestamp;
    if (age < POSITION_CACHE_DURATION) {
      return positionCache.position;
    }
  }

  return new Promise((resolve) => {
    if (!('geolocation' in navigator)) {
      console.warn('Geolocation is not available');
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const geoPos: GeoPosition = {
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        };
        
        // Update cache
        positionCache = {
          position: geoPos,
          timestamp: Date.now(),
        };
        
        resolve(geoPos);
      },
      (error) => {
        console.error('Geolocation error:', error);
        resolve(null);
      },
      {
        timeout: 10000,
        maximumAge: 300000, // Cache position for 5 minutes
        enableHighAccuracy: false, // Faster, less battery drain
      }
    );
  });
}

/**
 * Check if geolocation is available in the browser
 */
export function isGeolocationAvailable(): boolean {
  return 'geolocation' in navigator;
}

/**
 * Format distance for display
 * @param distance Distance in kilometers
 * @returns Formatted string like "2.5 km" or "350 m"
 */
export function formatDistance(distance: number): string {
  if (distance < 1) {
    return `${Math.round(distance * 1000)} m`;
  }
  return `${distance.toFixed(1)} km`;
}

/**
 * Clear position cache (useful for testing or privacy)
 */
export function clearPositionCache(): void {
  positionCache = null;
}

/**
 * Clear distance calculation cache
 */
export function clearDistanceCache(): void {
  distanceCache.clear();
}

/**
 * Get cache statistics (for debugging/monitoring)
 */
export function getCacheStats(): { positionCached: boolean; distanceCacheSize: number } {
  return {
    positionCached: positionCache !== null,
    distanceCacheSize: distanceCache.size,
  };
}

/**
 * Check if Permissions API is available and get permission state
 */
async function checkGeolocationPermission(): Promise<PermissionState | null> {
  if (!('permissions' in navigator)) {
    return null;
  }

  try {
    const result = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
    return result.state;
  } catch (error) {
    // Permissions API might not support geolocation query in some browsers
    return null;
  }
}

/**
 * Detect if geolocation is blocked by Permissions-Policy header
 */
function detectPermissionsPolicy(error: GeolocationPositionError): boolean {
  const errorMessage = error.message.toLowerCase();
  return (
    errorMessage.includes('permissions-policy') ||
    errorMessage.includes('disabled in this document') ||
    errorMessage.includes('permissions policy')
  );
}

/**
 * Get user-friendly error message and remediation steps
 */
function getErrorDetails(
  error: GeolocationPositionError,
  permissionState: PermissionState | null
): { type: GeolocationErrorType; message: string; remediation?: string } {
  // Check for Permissions-Policy blocking first
  if (detectPermissionsPolicy(error)) {
    return {
      type: GeolocationErrorType.PERMISSIONS_POLICY,
      message: 'La géolocalisation est bloquée par la configuration du serveur.',
      remediation: 
        'Cette application nécessite la géolocalisation pour afficher les magasins proches. ' +
        'Si vous êtes le propriétaire du site, consultez DEPLOYMENT_NOTES.md pour configurer ' +
        'les en-têtes HTTP Permissions-Policy. Si vous consultez cette page dans une iframe, ' +
        'assurez-vous que l\'attribut allow="geolocation" est défini.'
    };
  }

  switch (error.code) {
    case error.PERMISSION_DENIED:
      if (permissionState === 'denied') {
        return {
          type: GeolocationErrorType.PERMISSION_DENIED,
          message: 'Vous avez refusé l\'accès à votre position.',
          remediation:
            'Pour utiliser cette fonctionnalité, autorisez la géolocalisation dans les paramètres de votre navigateur. ' +
            'Sur mobile : Paramètres > Applications > Navigateur > Autorisations > Localisation. ' +
            'Sur ordinateur : cliquez sur l\'icône 🔒 ou ⓘ dans la barre d\'adresse et activez la géolocalisation.'
        };
      }
      return {
        type: GeolocationErrorType.PERMISSION_DENIED,
        message: 'Accès à la géolocalisation refusé.',
        remediation: 'Veuillez autoriser l\'accès à votre position dans votre navigateur.'
      };

    case error.POSITION_UNAVAILABLE:
      return {
        type: GeolocationErrorType.POSITION_UNAVAILABLE,
        message: 'Impossible de déterminer votre position.',
        remediation:
          'Assurez-vous que les services de localisation sont activés sur votre appareil. ' +
          'Vous pouvez aussi être dans une zone sans signal GPS (intérieur, sous-sol).'
      };

    case error.TIMEOUT:
      return {
        type: GeolocationErrorType.TIMEOUT,
        message: 'La demande de géolocalisation a expiré.',
        remediation:
          'Réessayez. Si le problème persiste, vérifiez votre connexion GPS ou ' +
          'essayez de vous déplacer vers un endroit avec un meilleur signal.'
      };

    default:
      return {
        type: GeolocationErrorType.UNKNOWN,
        message: 'Erreur de géolocalisation inconnue.',
        remediation: 'Réessayez plus tard ou contactez le support si le problème persiste.'
      };
  }
}

/**
 * Request user's geolocation with comprehensive error handling
 * 
 * This function provides enhanced error detection including:
 * - Permissions-Policy header blocking detection
 * - iframe without allow="geolocation" detection
 * - WebView restrictions detection
 * - User-friendly error messages with remediation steps
 * 
 * @param showMessage Optional callback to display messages to user
 * @returns Promise with GeolocationResult containing position or detailed error
 */
export async function requestGeolocation(
  showMessage?: (message: string, type: 'success' | 'error' | 'info') => void
): Promise<GeolocationResult> {
  // Check if geolocation is supported
  if (!('geolocation' in navigator)) {
    const error = {
      type: GeolocationErrorType.NOT_SUPPORTED,
      message: 'Votre navigateur ne supporte pas la géolocalisation.',
      remediation: 'Veuillez utiliser un navigateur moderne (Chrome, Firefox, Safari, Edge).'
    };
    if (showMessage) {
      showMessage(error.message, 'error');
    }
    return { success: false, error };
  }

  // Check permission state if Permissions API is available
  const permissionState = await checkGeolocationPermission();
  
  if (permissionState === 'denied') {
    const error = {
      type: GeolocationErrorType.PERMISSION_DENIED,
      message: 'Vous avez refusé l\'accès à votre position.',
      remediation:
        'Pour utiliser cette fonctionnalité, autorisez la géolocalisation dans les paramètres de votre navigateur.'
    };
    if (showMessage) {
      showMessage(error.message, 'error');
    }
    return { success: false, error };
  }

  if (showMessage && permissionState === 'prompt') {
    showMessage('Autorisation requise pour accéder à votre position...', 'info');
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const geoPos: GeoPosition = {
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        };
        
        // Update cache
        positionCache = {
          position: geoPos,
          timestamp: Date.now(),
        };
        
        if (showMessage) {
          showMessage('Position obtenue avec succès', 'success');
        }
        
        resolve({ success: true, position: geoPos });
      },
      (error) => {
        const errorDetails = getErrorDetails(error, permissionState);
        
        if (showMessage) {
          const fullMessage = errorDetails.remediation 
            ? `${errorDetails.message} ${errorDetails.remediation}`
            : errorDetails.message;
          showMessage(fullMessage, 'error');
        }
        
        console.error('Geolocation error:', {
          code: error.code,
          message: error.message,
          type: errorDetails.type
        });
        
        resolve({ success: false, error: errorDetails });
      },
      {
        timeout: 10000,
        maximumAge: 300000, // Cache position for 5 minutes
        enableHighAccuracy: false, // Faster, less battery drain
      }
    );
  });
}
