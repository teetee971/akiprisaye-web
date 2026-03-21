/**
 * Heatmap Service
 * Generates price intensity heatmap data for visualization
 * Maps prices to a 0-1 intensity scale
 */

import { Store } from './nearbyStoresService.js';

export interface HeatmapPoint {
  lat: number;
  lon: number;
  intensity: number; // 0-1 scale (0 = cheapest, 1 = most expensive)
  storeId: string;
  storeName: string;
  priceIndex?: number; // Original price index (0-100)
}

export interface HeatmapData {
  territory: string;
  points: HeatmapPoint[];
  minIntensity: number;
  maxIntensity: number;
  averageIntensity: number;
}

/**
 * Convert price index (0-100) to heatmap intensity (0-1)
 * @param priceIndex Price index from 0 (cheapest) to 100 (most expensive)
 * @returns Intensity value from 0 to 1
 */
function priceIndexToIntensity(priceIndex: number): number {
  // Direct mapping: 0-100 -> 0-1
  return Math.max(0, Math.min(1, priceIndex / 100));
}

/**
 * Generate heatmap data from stores with price indices
 * @param stores Array of stores with location data
 * @param priceIndices Map of store ID to price index (0-100)
 * @param territory Territory code
 * @returns Heatmap data ready for visualization
 */
export function generateHeatmapData(
  stores: Store[],
  priceIndices: Map<string, number>,
  territory: string
): HeatmapData {
  const points: HeatmapPoint[] = [];

  stores.forEach((store) => {
    const priceIndex = priceIndices.get(store.id);
    
    // Skip stores without price data
    if (priceIndex === undefined) {
      return;
    }

    const intensity = priceIndexToIntensity(priceIndex);

    points.push({
      lat: store.lat,
      lon: store.lon,
      intensity,
      storeId: store.id,
      storeName: store.name,
      priceIndex,
    });
  });

  // Calculate statistics
  const intensities = points.map((p) => p.intensity);
  const minIntensity = intensities.length > 0 ? Math.min(...intensities) : 0;
  const maxIntensity = intensities.length > 0 ? Math.max(...intensities) : 1;
  const averageIntensity =
    intensities.length > 0
      ? intensities.reduce((sum, i) => sum + i, 0) / intensities.length
      : 0.5;

  return {
    territory,
    points,
    minIntensity,
    maxIntensity,
    averageIntensity,
  };
}

/**
 * Generate heatmap configuration for leaflet.heat
 * @param heatmapData Heatmap data
 * @returns Configuration object for leaflet.heat
 */
export function getHeatmapConfig(_heatmapData: HeatmapData) {
  return {
    radius: 25, // Radius of influence for each point
    blur: 15, // Amount of blur
    maxZoom: 15, // Max zoom level for heatmap
    max: 1.0, // Maximum intensity value
    minOpacity: 0.2, // Minimum opacity
    gradient: {
      // Color gradient: green (low) -> orange (medium) -> red (high)
      0.0: '#22c55e', // Green (cheap)
      0.33: '#84cc16', // Light green
      0.5: '#f59e0b', // Orange (medium)
      0.67: '#f97316', // Dark orange
      1.0: '#ef4444', // Red (expensive)
    },
  };
}

/**
 * Filter heatmap points by intensity range
 * @param points Array of heatmap points
 * @param minIntensity Minimum intensity threshold (0-1)
 * @param maxIntensity Maximum intensity threshold (0-1)
 * @returns Filtered points
 */
export function filterHeatmapByIntensity(
  points: HeatmapPoint[],
  minIntensity: number = 0,
  maxIntensity: number = 1
): HeatmapPoint[] {
  return points.filter(
    (p) => p.intensity >= minIntensity && p.intensity <= maxIntensity
  );
}

/**
 * Get heatmap statistics
 * @param points Array of heatmap points
 * @returns Statistics object
 */
export function getHeatmapStats(points: HeatmapPoint[]): {
  totalPoints: number;
  cheapPoints: number; // intensity < 0.33
  mediumPoints: number; // intensity 0.33-0.67
  expensivePoints: number; // intensity > 0.67
  coverage: {
    minLat: number;
    maxLat: number;
    minLon: number;
    maxLon: number;
  };
} {
  const cheapPoints = points.filter((p) => p.intensity < 0.33).length;
  const mediumPoints = points.filter(
    (p) => p.intensity >= 0.33 && p.intensity <= 0.67
  ).length;
  const expensivePoints = points.filter((p) => p.intensity > 0.67).length;

  const lats = points.map((p) => p.lat);
  const lons = points.map((p) => p.lon);

  return {
    totalPoints: points.length,
    cheapPoints,
    mediumPoints,
    expensivePoints,
    coverage: {
      minLat: lats.length > 0 ? Math.min(...lats) : 0,
      maxLat: lats.length > 0 ? Math.max(...lats) : 0,
      minLon: lons.length > 0 ? Math.min(...lons) : 0,
      maxLon: lons.length > 0 ? Math.max(...lons) : 0,
    },
  };
}

/**
 * Convert heatmap data to leaflet.heat format
 * @param points Array of heatmap points
 * @returns Array in format [lat, lon, intensity]
 */
export function toLeafletHeatFormat(
  points: HeatmapPoint[]
): [number, number, number][] {
  return points.map((p) => [p.lat, p.lon, p.intensity]);
}
