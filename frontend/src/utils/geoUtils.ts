/**
 * Geographic Utilities
 * Distance calculations and coordinate utilities
 */

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param lat1 Latitude of first point
 * @param lon1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lon2 Longitude of second point
 * @returns Distance in kilometers
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Convert degrees to radians
 */
function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Format distance for display
 */
export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  return `${km.toFixed(1)} km`;
}

/**
 * Check if a point is within a radius of another point
 */
export function isWithinRadius(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
  radiusKm: number
): boolean {
  const distance = calculateDistance(lat1, lon1, lat2, lon2);
  return distance <= radiusKm;
}

/**
 * Get bounds from a list of coordinates
 */
export function getBounds(
  coordinates: Array<{ lat: number; lon: number }>
): [[number, number], [number, number]] | null {
  if (coordinates.length === 0) return null;

  const lats = coordinates.map((c) => c.lat);
  const lons = coordinates.map((c) => c.lon);

  return [
    [Math.min(...lats), Math.min(...lons)],
    [Math.max(...lats), Math.max(...lons)],
  ];
}

/**
 * Calculate center point from coordinates
 */
export function getCenterPoint(
  coordinates: Array<{ lat: number; lon: number }>
): { lat: number; lon: number } | null {
  if (coordinates.length === 0) return null;

  const avgLat = coordinates.reduce((sum, c) => sum + c.lat, 0) / coordinates.length;
  const avgLon = coordinates.reduce((sum, c) => sum + c.lon, 0) / coordinates.length;

  return { lat: avgLat, lon: avgLon };
}
