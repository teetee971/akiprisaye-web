// @ts-nocheck
 
/**
 * Fuel Price API Client
 * Client for prix-carburants.gouv.fr API
 * 
 * Documentation: https://www.prix-carburants.gouv.fr/
 * 
 * This is the official French government API for fuel prices.
 * Note: In production, may require CORS handling or a backend proxy.
 * Rate limiting: To be determined based on API documentation.
 */

import type { FuelType, FuelPricePoint, FuelStation, Territory } from '../types/fuelComparison';

/**
 * API Base URL - Official French Government Fuel Price API
 */
const API_BASE_URL = 'https://www.prix-carburants.gouv.fr';

/**
 * Mapping DOM-TOM departments (tous les territoires d'outre-mer)
 */
const TERRITORY_TO_DEPARTMENT: Record<string, string> = {
  GP: '971', // Guadeloupe
  MQ: '972', // Martinique
  GF: '973', // Guyane française
  RE: '974', // La Réunion
  PM: '975', // Saint-Pierre-et-Miquelon
  YT: '976', // Mayotte
  BL: '977', // Saint-Barthélemy
  MF: '978', // Saint-Martin
};

/**
 * Mapping fuel types to API codes
 */
const _FUEL_TYPE_MAPPING: Record<FuelType, string> = {
  SP95: 'SP95',
  SP98: 'SP98',
  E10: 'E10',
  E85: 'E85',
  DIESEL: 'Gazole',
  GPL: 'GPLc',
};

/**
 * Fetch official fuel prices from government API
 * Note: This is a placeholder - actual API integration would require CORS handling
 */
export async function fetchOfficialFuelPrices(
  department: string,
  fuelType?: FuelType
): Promise<any[]> {
  try {
    // In production, this would call the real API
    // For now, return empty array and rely on JSON data
    console.log(`Would fetch fuel prices for department ${department}, fuelType: ${fuelType}`);
    
    // Real implementation would be:
    // const response = await fetch(`${API_BASE_URL}/api/stations/${department}`);
    // return await response.json();
    
    return [];
  } catch (error) {
    console.error('Error fetching fuel prices from API:', error);
    return [];
  }
}

/**
 * Parse API response to FuelPricePoint format
 */
export function parseAPIResponse(
  response: any[],
  territory: Territory
): FuelPricePoint[] {
  const prices: FuelPricePoint[] = [];

  for (const stationData of response) {
    try {
      const station: FuelStation = {
        id: stationData.id || `station-${stationData.cp || '00000'}-${Math.random()}`,
        name: stationData.name || stationData.enseigne || 'Station-service',
        address: stationData.adresse || '',
        city: stationData.ville || '',
        territory: territory,
        location: stationData.geom?.coordinates
          ? {
              lng: stationData.geom.coordinates[0],
              lat: stationData.geom.coordinates[1],
            }
          : undefined,
        brand: stationData.enseigne,
        services: stationData.services || [],
      };

      // Parse each fuel type price
      if (stationData.prix && Array.isArray(stationData.prix)) {
        for (const priceData of stationData.prix) {
          const fuelType = mapAPIFuelType(priceData.nom);
          if (fuelType) {
            const pricePoint: FuelPricePoint = {
              id: `${station.id}-${fuelType}-${priceData.maj || Date.now()}`,
              station: station,
              fuelType: fuelType,
              pricePerLiter: parseFloat(priceData.valeur),
              currency: 'EUR',
              observationDate: priceData.maj || new Date().toISOString(),
              source: {
                type: 'official_api',
                url: API_BASE_URL,
                observedAt: priceData.maj || new Date().toISOString(),
                reliability: 'high',
              },
              isPriceCapPlafonne: false, // Would be determined by comparing with official price cap
              territory: territory,
              lastUpdate: priceData.maj,
            };
            prices.push(pricePoint);
          }
        }
      }
    } catch (error) {
      console.error('Error parsing station data:', error);
      continue;
    }
  }

  return prices;
}

/**
 * Map API fuel type name to our FuelType enum
 */
function mapAPIFuelType(apiFuelName: string): FuelType | null {
  const mapping: Record<string, FuelType> = {
    SP95: 'SP95',
    'SP95-E10': 'E10',
    E10: 'E10',
    SP98: 'SP98',
    Gazole: 'DIESEL',
    'E85': 'E85',
    GPLc: 'GPL',
  };

  return mapping[apiFuelName] || null;
}

/**
 * Get department code from territory
 */
export function getDepartmentFromTerritory(territory: Territory): string | null {
  return TERRITORY_TO_DEPARTMENT[territory] || null;
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}
