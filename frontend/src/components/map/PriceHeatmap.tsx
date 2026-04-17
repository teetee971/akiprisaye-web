/**
 * PriceHeatmap Component
 * Displays a heat map overlay showing price intensity across locations
 */

import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';

interface HeatmapPoint {
  lat: number;
  lon: number;
  intensity: number; // 0-1 scale
}

interface PriceHeatmapProps {
  points: HeatmapPoint[];
  visible?: boolean;
  radius?: number;
  blur?: number;
  maxZoom?: number;
  minOpacity?: number;
  gradient?: { [key: number]: string };
}

/**
 * PriceHeatmap component - Leaflet.heat integration
 */
export function PriceHeatmap({
  points,
  visible = true,
  radius = 25,
  blur = 15,
  maxZoom = 15,
  minOpacity = 0.2,
  gradient = {
    0.0: '#22c55e', // Green (cheap)
    0.33: '#84cc16', // Light green
    0.5: '#f59e0b', // Orange (medium)
    0.67: '#f97316', // Dark orange
    1.0: '#ef4444', // Red (expensive)
  },
}: PriceHeatmapProps) {
  const map = useMap();

  useEffect(() => {
    if (!map || !visible || points.length === 0) {
      return;
    }

    // Convert points to leaflet.heat format: [lat, lng, intensity]
    const heatData: [number, number, number][] = points.map((point) => [
      point.lat,
      point.lon,
      point.intensity,
    ]);

    // Default options
    const heatmapOptions = {
      radius: radius || 25,
      blur: blur || 15,
      maxZoom: maxZoom || 12,
      max: 1.0,
      gradient: gradient || {
        0.0: '#22c55e', // Green (cheap)
        0.5: '#f59e0b', // Orange (medium)
        1.0: '#ef4444', // Red (expensive)
      },
    };

    // Create heatmap layer

    const heatLayer = (L as any).heatLayer(heatData, heatmapOptions);

    // Add to map
    heatLayer.addTo(map);

    // Cleanup on unmount
    return () => {
      map.removeLayer(heatLayer);
    };
  }, [map, points, visible, radius, blur, maxZoom, minOpacity, gradient]);

  // This component doesn't render anything visible itself
  return null;
}

export default PriceHeatmap;
