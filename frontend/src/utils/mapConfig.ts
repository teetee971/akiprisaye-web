/**
 * Map Configuration
 * Leaflet and territory-specific settings
 */

export interface TerritoryConfig {
  center: [number, number];
  zoom: number;
  name: string;
}

export const TERRITORY_CENTERS: Record<string, TerritoryConfig> = {
  GP: { center: [16.25, -61.55], zoom: 10, name: 'Guadeloupe' },
  MQ: { center: [14.64, -61.02], zoom: 10, name: 'Martinique' },
  GF: { center: [4.92, -52.33], zoom: 8, name: 'Guyane' },
  RE: { center: [-21.11, 55.53], zoom: 10, name: 'La Réunion' },
  YT: { center: [-12.82, 45.17], zoom: 11, name: 'Mayotte' },
  SX: { center: [18.08, -63.05], zoom: 12, name: 'Saint-Martin' },
  BL: { center: [17.9, -62.83], zoom: 13, name: 'Saint-Barthélemy' },
};

export const MAP_CONFIG = {
  // Default view
  defaultCenter: [16.25, -61.55] as [number, number],
  defaultZoom: 10,

  // Tile layers
  tileLayer: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19,
  },

  // Marker clustering
  cluster: {
    maxClusterRadius: 50,
    spiderfyOnMaxZoom: true,
    showCoverageOnHover: false,
    disableClusteringAtZoom: 15,
  },

  // Heatmap configuration
  heatmap: {
    radius: 25,
    blur: 15,
    maxZoom: 12,
    max: 1.0,
    gradient: {
      0.0: '#22c55e', // Green (cheap)
      0.5: '#f59e0b', // Orange (medium)
      1.0: '#ef4444', // Red (expensive)
    },
  },

  // User location
  userLocation: {
    color: '#3b82f6',
    radius: 8,
    fillOpacity: 0.8,
  },

  // Search radius options (in km)
  radiusOptions: [1, 2, 5, 10, 20, 50],
  defaultRadius: 10,
};

/**
 * Get territory configuration by code
 */
export function getTerritoryConfig(code: string): TerritoryConfig | null {
  return TERRITORY_CENTERS[code.toUpperCase()] || null;
}

/**
 * Get all territory codes
 */
export function getAllTerritoryCodes(): string[] {
  return Object.keys(TERRITORY_CENTERS);
}
