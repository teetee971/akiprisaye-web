/**
 * Map Types
 * Type definitions for the interactive map feature
 */

import { PriceCategory } from '../utils/priceColors';

export interface StoreMarker {
  id: string;
  name: string;
  chain: string;
  chainLogo?: string;
  coordinates: {
    lat: number;
    lon: number;
  };
  priceIndex: number; // 0-100 (0=cheap, 100=expensive)
  priceCategory: PriceCategory;
  averageBasketPrice: number; // Price for reference basket
  distance?: number; // Distance from user in km
  isOpen?: boolean; // Currently open
  address: string;
  city?: string;
  postalCode?: string;
  phone?: string;
  services: string[];
  territory: string;
}

export interface StoreMapProps {
  territory?: string; // Filter by territory
  chains?: string[]; // Filter by chains
  center?: [number, number]; // Initial center
  zoom?: number; // Initial zoom
  showHeatmap?: boolean; // Show price heatmap
  showUserLocation?: boolean; // Show user location
  radius?: number; // Search radius in km
}

export interface GeolocationState {
  position: {
    lat: number;
    lon: number;
  } | null;
  accuracy: number | null;
  loading: boolean;
  error: string | null;
  permissionStatus: 'granted' | 'denied' | 'prompt' | null;
}

export interface NearbyStoresOptions {
  lat: number;
  lon: number;
  radius: number; // in km
  chains?: string[];
  limit?: number;
  sortBy?: 'distance' | 'price' | 'name';
}

export interface MapFilters {
  territory: string | null;
  chains: string[];
  priceCategory: PriceCategory[];
  services: string[];
  radius: number; // km
  onlyOpen: boolean;
}

export interface HeatmapData {
  points: Array<{
    lat: number;
    lon: number;
    intensity: number; // 0-1 (0=cheap, 1=expensive)
  }>;
}

export interface RouteResult {
  distance: number; // in meters
  duration: number; // in seconds
  geometry: GeoJSON.LineString;
  instructions: RouteInstruction[];
}

export interface RouteInstruction {
  type: 'turn' | 'continue' | 'arrive' | 'depart';
  direction?: 'left' | 'right' | 'straight';
  streetName?: string;
  distance: number; // in meters
  duration: number; // in seconds
}

export interface PriceIndexResult {
  storeId: string;
  priceIndex: number; // 0-100
  averageBasketPrice: number; // € for reference basket
  comparisonToTerritory: number; // % vs territory average
  comparisonToChain: number; // % vs chain average
  lastCalculatedAt: string;
  basketComposition: BasketItem[];
}

export interface BasketItem {
  productId: string;
  productName: string;
  price: number;
  territoryAverage: number;
  chainAverage?: number;
}
