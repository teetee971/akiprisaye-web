/**
 * Heatmap Service
 * Generate heatmap data for price visualization
 */

import { SEED_STORES } from '../../../../src/data/seedStores.js';
import { calculatePriceIndex } from './priceIndexCalculator.js';

export interface HeatmapPoint {
  lat: number;
  lon: number;
  intensity: number; // 0-1 (0=cheap, 1=expensive)
}

export interface HeatmapData {
  territory: string;
  points: HeatmapPoint[];
  bounds: [[number, number], [number, number]] | null;
}

/**
 * Generate heatmap data for a territory
 */
export async function generateHeatmap(
  territory?: string
): Promise<HeatmapData> {
  // Filter stores by territory if specified
  let stores = SEED_STORES;
  if (territory) {
    stores = stores.filter(
      s => s.territory.toLowerCase() === territory.toLowerCase()
    );
  }

  // Calculate price indices for stores
  const points: HeatmapPoint[] = [];

  for (const store of stores) {
    if (!store.coordinates) continue;

    try {
      const priceData = await calculatePriceIndex(store.id);
      
      // Convert price index (0-100) to intensity (0-1)
      // Lower index = cheaper = lower intensity (green)
      // Higher index = expensive = higher intensity (red)
      const intensity = priceData.priceIndex / 100;

      points.push({
        lat: store.coordinates.lat,
        lon: store.coordinates.lon,
        intensity: parseFloat(intensity.toFixed(2)),
      });
    } catch (error) {
      console.error(`Error generating heatmap point for ${store.id}:`, error);
    }
  }

  // Calculate bounds
  let bounds: [[number, number], [number, number]] | null = null;
  if (points.length > 0) {
    const lats = points.map(p => p.lat);
    const lons = points.map(p => p.lon);
    bounds = [
      [Math.min(...lats), Math.min(...lons)],
      [Math.max(...lats), Math.max(...lons)],
    ];
  }

  return {
    territory: territory || 'all',
    points,
    bounds,
  };
}
