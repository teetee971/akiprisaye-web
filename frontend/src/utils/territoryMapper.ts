/**
 * Territory Mapper
 *
 * Utilities for managing French overseas territories (DROM-COM).
 * Provides territory information, lookups, and grouping functions.
 */

import type { Territory, TerritoryInfo } from '../types/comparatorCommon';

/**
 * Complete territory information database
 */
export const TERRITORIES: Record<Territory, TerritoryInfo> = {
  GP: {
    code: 'GP',
    name: 'Guadeloupe',
    department: '971',
    region: 'Antilles',
    coordinates: { latitude: 16.265, longitude: -61.551 },
  },
  MQ: {
    code: 'MQ',
    name: 'Martinique',
    department: '972',
    region: 'Antilles',
    coordinates: { latitude: 14.6415, longitude: -61.0242 },
  },
  GF: {
    code: 'GF',
    name: 'Guyane',
    department: '973',
    region: 'Guyane',
    coordinates: { latitude: 3.9339, longitude: -53.1258 },
  },
  RE: {
    code: 'RE',
    name: 'La Réunion',
    department: '974',
    region: 'Océan Indien',
    coordinates: { latitude: -21.1151, longitude: 55.5364 },
  },
  PM: {
    code: 'PM',
    name: 'Saint-Pierre-et-Miquelon',
    department: '975',
    region: 'Amérique du Nord',
    coordinates: { latitude: 46.8852, longitude: -56.3159 },
  },
  YT: {
    code: 'YT',
    name: 'Mayotte',
    department: '976',
    region: 'Océan Indien',
    coordinates: { latitude: -12.8275, longitude: 45.1662 },
  },
  BL: {
    code: 'BL',
    name: 'Saint-Barthélemy',
    department: '977',
    region: 'Antilles',
    coordinates: { latitude: 17.9, longitude: -62.8333 },
  },
  MF: {
    code: 'MF',
    name: 'Saint-Martin',
    department: '978',
    region: 'Antilles',
    coordinates: { latitude: 18.0708, longitude: -63.0501 },
  },
  WF: {
    code: 'WF',
    name: 'Wallis-et-Futuna',
    department: '986',
    region: 'Pacifique',
    coordinates: { latitude: -13.2687, longitude: -176.1761 },
  },
  PF: {
    code: 'PF',
    name: 'Polynésie française',
    department: '987',
    region: 'Pacifique',
    coordinates: { latitude: -17.6797, longitude: -149.4068 },
  },
  NC: {
    code: 'NC',
    name: 'Nouvelle-Calédonie',
    department: '988',
    region: 'Pacifique',
    coordinates: { latitude: -20.9043, longitude: 165.618 },
  },
};

/**
 * Get territory information by code
 *
 * @param code - Territory code (e.g., 'GP', 'MQ')
 * @returns Territory information or undefined if not found
 */
export function getTerritoryByCode(code: string): TerritoryInfo | undefined {
  return TERRITORIES[code as Territory];
}

/**
 * Get territory information by department number
 *
 * @param dept - Department number (e.g., '971', '972')
 * @returns Territory information or undefined if not found
 */
export function getTerritoryByDepartment(dept: string): TerritoryInfo | undefined {
  return Object.values(TERRITORIES).find((t) => t.department === dept);
}

/**
 * Get human-readable label for a territory
 *
 * @param code - Territory code
 * @returns Territory name or the code if not found
 */
export function getTerritoryLabel(code: string): string {
  const territory = getTerritoryByCode(code);
  return territory ? territory.name : code;
}

/**
 * Get all territories in a specific region
 *
 * @param region - Region name (e.g., 'Antilles', 'Pacifique')
 * @returns Array of territory information
 */
export function getTerritoriesByRegion(region: string): TerritoryInfo[] {
  return Object.values(TERRITORIES).filter((t) => t.region === region);
}

/**
 * Get all territories as an array
 *
 * @returns Array of all territory information
 */
export function getAllTerritories(): TerritoryInfo[] {
  return Object.values(TERRITORIES);
}

/**
 * Get all unique regions
 *
 * @returns Array of region names
 */
export function getAllRegions(): string[] {
  const regions = new Set(Object.values(TERRITORIES).map((t) => t.region));
  return Array.from(regions).sort();
}

/**
 * Check if a code is a valid territory
 *
 * @param code - Code to validate
 * @returns true if valid territory code
 */
export function isValidTerritory(code: string): code is Territory {
  return code in TERRITORIES;
}

/**
 * Get territories grouped by region
 *
 * @returns Object with regions as keys and territories as values
 */
export function getTerritoriesGroupedByRegion(): Record<string, TerritoryInfo[]> {
  const grouped: Record<string, TerritoryInfo[]> = {};

  for (const territory of Object.values(TERRITORIES)) {
    if (!grouped[territory.region]) {
      grouped[territory.region] = [];
    }
    grouped[territory.region].push(territory);
  }

  return grouped;
}

/**
 * Calculate distance between two territories (approximate, using coordinates)
 * Uses the Haversine formula for great-circle distance
 *
 * @param code1 - First territory code
 * @param code2 - Second territory code
 * @returns Distance in kilometers, or null if coordinates unavailable
 */
export function calculateDistanceBetweenTerritories(code1: string, code2: string): number | null {
  const t1 = getTerritoryByCode(code1);
  const t2 = getTerritoryByCode(code2);

  if (!t1?.coordinates || !t2?.coordinates) {
    return null;
  }

  const { latitude: lat1, longitude: lon1 } = t1.coordinates;
  const { latitude: lat2, longitude: lon2 } = t2.coordinates;

  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance);
}

/**
 * Convert degrees to radians
 */
function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}
