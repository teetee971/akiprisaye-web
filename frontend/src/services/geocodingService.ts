/**
 * Geocoding Service
 *
 * Phase 7: Provides address-to-coordinates conversion using Nominatim (OpenStreetMap)
 * Supports batch geocoding, caching, and rate limiting
 */

export interface GeocodingResult {
  success: boolean;
  address: string;
  coordinates?: {
    lat: number;
    lon: number;
  };
  error?: string;
  displayName?: string;
}

export interface BatchGeocodingResult {
  results: GeocodingResult[];
  successful: number;
  failed: number;
}

// Rate limiting: Nominatim requires 1 request per second max
const RATE_LIMIT_MS = 1000;
let lastRequestTime = 0;

// Cache to avoid repeated requests
const geocodingCache = new Map<string, GeocodingResult>();

/**
 * Wait for rate limit compliance
 */
async function waitForRateLimit(): Promise<void> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;

  if (timeSinceLastRequest < RATE_LIMIT_MS) {
    const waitTime = RATE_LIMIT_MS - timeSinceLastRequest;
    await new Promise((resolve) => setTimeout(resolve, waitTime));
  }

  lastRequestTime = Date.now();
}

/**
 * Geocode a single address using Nominatim API
 *
 * @param address - Full address string to geocode
 * @param useCache - Whether to use cached results (default: true)
 * @returns GeocodingResult with coordinates or error
 */
export async function geocodeAddress(address: string, useCache = true): Promise<GeocodingResult> {
  // Check cache first
  if (useCache && geocodingCache.has(address)) {
    return geocodingCache.get(address)!;
  }

  // Wait for rate limit
  await waitForRateLimit();

  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
    address
  )}&limit=1`;

  try {
    const response = await fetch(url, {
      headers: {
        'Accept-Language': 'fr',
        'User-Agent': 'akiprisaye-web/2.1.0 (+https://github.com/teetee971/akiprisaye-web)',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data || data.length === 0) {
      const result: GeocodingResult = {
        success: false,
        address,
        error: 'Adresse introuvable',
      };

      if (useCache) {
        geocodingCache.set(address, result);
      }

      return result;
    }

    const location = data[0];
    const result: GeocodingResult = {
      success: true,
      address,
      coordinates: {
        lat: parseFloat(location.lat),
        lon: parseFloat(location.lon),
      },
      displayName: location.display_name,
    };

    if (useCache) {
      geocodingCache.set(address, result);
    }

    return result;
  } catch (error) {
    const result: GeocodingResult = {
      success: false,
      address,
      error: error instanceof Error ? error.message : 'Erreur de géocodage',
    };

    if (useCache) {
      geocodingCache.set(address, result);
    }

    return result;
  }
}

/**
 * Geocode multiple addresses in batch with rate limiting
 *
 * @param addresses - Array of addresses to geocode
 * @param onProgress - Optional callback for progress updates
 * @returns BatchGeocodingResult with all results and statistics
 */
export async function geocodeBatch(
  addresses: string[],
  onProgress?: (current: number, total: number, result: GeocodingResult) => void
): Promise<BatchGeocodingResult> {
  const results: GeocodingResult[] = [];
  let successful = 0;
  let failed = 0;

  for (let i = 0; i < addresses.length; i++) {
    const address = addresses[i];
    const result = await geocodeAddress(address);

    results.push(result);

    if (result.success) {
      successful++;
    } else {
      failed++;
    }

    if (onProgress) {
      onProgress(i + 1, addresses.length, result);
    }
  }

  return {
    results,
    successful,
    failed,
  };
}

/**
 * Reverse geocode: convert coordinates to address
 *
 * @param lat - Latitude
 * @param lon - Longitude
 * @returns Address string or null if not found
 */
export async function reverseGeocode(lat: number, lon: number): Promise<string | null> {
  await waitForRateLimit();

  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;

  try {
    const response = await fetch(url, {
      headers: {
        'Accept-Language': 'fr',
        'User-Agent': 'akiprisaye-web/2.1.0 (+https://github.com/teetee971/akiprisaye-web)',
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.display_name || null;
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return null;
  }
}

/**
 * Clear the geocoding cache
 */
export function clearGeocodingCache(): void {
  geocodingCache.clear();
}

/**
 * Get cache size
 */
export function getGeocodingCacheSize(): number {
  return geocodingCache.size;
}

/**
 * Export geocoding cache for persistence
 */
export function exportGeocodingCache(): Record<string, GeocodingResult> {
  return Object.fromEntries(geocodingCache.entries());
}

/**
 * Import geocoding cache from persistence
 */
export function importGeocodingCache(cache: Record<string, GeocodingResult>): void {
  Object.entries(cache).forEach(([address, result]) => {
    geocodingCache.set(address, result);
  });
}

/**
 * Validate coordinates
 */
export function validateCoordinates(lat: number, lon: number): boolean {
  return (
    typeof lat === 'number' &&
    typeof lon === 'number' &&
    !isNaN(lat) &&
    !isNaN(lon) &&
    lat >= -90 &&
    lat <= 90 &&
    lon >= -180 &&
    lon <= 180
  );
}

/**
 * Format coordinates for display
 */
export function formatCoordinates(lat: number, lon: number, precision = 6): string {
  return `${lat.toFixed(precision)}, ${lon.toFixed(precision)}`;
}
