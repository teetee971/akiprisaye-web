 
import { safeLocalStorage } from './safeLocalStorage';
/**
 * Territory Detection Utility
 * 
 * Detects user's territory using multiple methods:
 * 1. safeLocalStorage cache (fastest)
 * 2. Geolocation API (GPS)
 * 3. IP Geolocation (fallback)
 * 4. Default fallback
 */

export async function detectTerritory(): Promise<string> {
  // 1. Check safeLocalStorage cache
  const cached = safeLocalStorage.getItem('user_territory');
  if (cached) {
    console.log('Territory from cache:', cached);
    return cached;
  }

  // 2. Try geolocation API
  try {
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, { 
        timeout: 5000,
        enableHighAccuracy: false 
      });
    });
    
    const territory = mapCoordsToTerritory(position.coords.latitude, position.coords.longitude);
    if (territory) {
      safeLocalStorage.setItem('user_territory', territory);
      console.log('Territory from GPS:', territory);
      return territory;
    }
  } catch (e) {
    const errorMsg = e instanceof GeolocationPositionError 
      ? ['Permission denied', 'Position unavailable', 'Timeout'][e.code - 1]
      : 'Unknown error';
    console.log(`Geolocation failed (${errorMsg}), trying IP detection`);
  }

  // 3. Fallback: IP geolocation with retry logic
  try {
    const response = await fetch('https://ipapi.co/json/', {
      signal: AbortSignal.timeout(8000)
    });
    
    if (!response.ok) {
      throw new Error(`IP API returned ${response.status}`);
    }
    
    const data = await response.json();
    const territory = mapCountryCodeToTerritory(data.country_code, data.region);
    if (territory) {
      safeLocalStorage.setItem('user_territory', territory);
      console.log('Territory from IP:', territory);
      return territory;
    }
  } catch (e) {
    console.warn('IP geolocation failed:', e instanceof Error ? e.message : 'Unknown error');
  }

  // 4. Default fallback
  const defaultTerritory = 'DOM-TOM';
  safeLocalStorage.setItem('user_territory', defaultTerritory);
  return defaultTerritory;
}

/**
 * Map GPS coordinates to territory
 */
function mapCoordsToTerritory(lat: number, lon: number): string | null {
  // Guadeloupe: ~16.25°N, -61.58°W
  if (lat > 15 && lat < 17 && lon > -62 && lon < -61) {
    return 'Guadeloupe';
  }
  
  // Martinique: ~14.64°N, -61.02°W
  if (lat > 14 && lat < 15 && lon > -62 && lon < -60) {
    return 'Martinique';
  }
  
  // Guyane: ~4°N, -53°W
  if (lat > 2 && lat < 6 && lon > -55 && lon < -51) {
    return 'Guyane';
  }
  
  // Réunion: ~-21°S, 55.5°E
  if (lat > -22 && lat < -20 && lon > 55 && lon < 56) {
    return 'Réunion';
  }
  
  // Mayotte: ~-12.8°S, 45.1°E
  if (lat > -13 && lat < -12 && lon > 45 && lon < 46) {
    return 'Mayotte';
  }
  
  // Nouvelle-Calédonie: ~-21.5°S, 165.5°E
  if (lat > -23 && lat < -20 && lon > 164 && lon < 167) {
    return 'Nouvelle-Calédonie';
  }
  
  // Polynésie française: ~-17.5°S, -149.5°W
  if (lat > -18 && lat < -17 && lon > -150 && lon < -149) {
    return 'Polynésie française';
  }
  
  // Wallis-et-Futuna: ~-13.3°S, -176.2°W
  if (lat > -14 && lat < -13 && lon > -177 && lon < -176) {
    return 'Wallis-et-Futuna';
  }
  
  // Saint-Pierre-et-Miquelon: ~46.8°N, -56.3°W
  if (lat > 46 && lat < 47 && lon > -57 && lon < -56) {
    return 'Saint-Pierre-et-Miquelon';
  }
  
  // Saint-Barthélemy: ~17.9°N, -62.8°W
  if (lat > 17.5 && lat < 18 && lon > -63 && lon < -62.5) {
    return 'Saint-Barthélemy';
  }
  
  // Saint-Martin: ~18.1°N, -63.0°W
  if (lat > 18 && lat < 18.5 && lon > -63.5 && lon < -62.5) {
    return 'Saint-Martin';
  }
  
  // France métropolitaine: ~46°N, 2°E
  if (lat > 41 && lat < 51 && lon > -5 && lon < 10) {
    return 'Métropole';
  }
  
  return null;
}

/**
 * Map country/region code to territory
 */
function mapCountryCodeToTerritory(countryCode: string, region: string): string | null {
  if (countryCode === 'GP') return 'Guadeloupe';
  if (countryCode === 'MQ') return 'Martinique';
  if (countryCode === 'GF') return 'Guyane';
  if (countryCode === 'RE') return 'Réunion';
  if (countryCode === 'YT') return 'Mayotte';
  if (countryCode === 'NC') return 'Nouvelle-Calédonie';
  if (countryCode === 'PF') return 'Polynésie française';
  if (countryCode === 'WF') return 'Wallis-et-Futuna';
  if (countryCode === 'PM') return 'Saint-Pierre-et-Miquelon';
  if (countryCode === 'BL') return 'Saint-Barthélemy';
  if (countryCode === 'MF') return 'Saint-Martin';
  if (countryCode === 'FR') return 'Métropole';
  
  return null;
}

/**
 * Clear cached territory (useful for testing)
 */
export function clearTerritoryCache(): void {
  safeLocalStorage.removeItem('user_territory');
}
