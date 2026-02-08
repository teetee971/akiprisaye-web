/**
 * PriceHeatmap Component
 * Display price heatmap layer on the map
 */

import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';

interface HeatmapPoint {
  lat: number;
  lon: number;
  intensity: number; // 0-1 (0=cheap, 1=expensive)
}

interface PriceHeatmapProps {
  points: HeatmapPoint[];
  options?: {
    radius?: number;
    blur?: number;
    maxZoom?: number;
    max?: number;
    gradient?: Record<number, string>;
  };
}

export function PriceHeatmap({ points, options }: PriceHeatmapProps) {
  const map = useMap();

  useEffect(() => {
    if (!points || points.length === 0) return;

    // Convert points to heatmap format: [lat, lon, intensity]
    const heatmapData: [number, number, number][] = points.map(point => [
      point.lat,
      point.lon,
      point.intensity,
    ]);

    // Default options
    const heatmapOptions = {
      radius: options?.radius || 25,
      blur: options?.blur || 15,
      maxZoom: options?.maxZoom || 12,
      max: options?.max || 1.0,
      gradient: options?.gradient || {
        0.0: '#22c55e', // Green (cheap)
        0.5: '#f59e0b', // Orange (medium)
        1.0: '#ef4444', // Red (expensive)
      },
    };

    // Create heatmap layer
    // @ts-ignore - leaflet.heat types not complete
    const heatLayer = L.heatLayer(heatmapData, heatmapOptions);

    // Add to map
    heatLayer.addTo(map);

    // Cleanup on unmount
    return () => {
      map.removeLayer(heatLayer);
    };
  }, [map, points, options]);

  return null; // This component doesn't render anything directly
}
