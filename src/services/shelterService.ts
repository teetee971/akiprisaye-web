/**
 * Shelter Service
 * 
 * Manages cyclone shelters/refuges information
 */

import type { Shelter, Territory } from '../types/cycloneComparison';

/**
 * Get all shelters for a territory
 */
export async function getAllShelters(territory: Territory): Promise<Shelter[]> {
  try {
    const response = await fetch('/data/survival-kit-prices.json');
    const data = await response.json();
    
    return data.shelters
      .filter((s: Shelter) => s.territory === territory)
      .map((s: any) => ({
        id: s.id,
        name: s.name,
        type: s.type,
        territory: s.territory,
        commune: s.commune,
        address: s.address,
        coordinates: s.coordinates,
        capacity: s.capacity,
        facilities: s.facilities,
        contact: s.contact,
        status: s.status,
        currentOccupancy: s.currentOccupancy,
        officialShelter: s.officialShelter,
        lastUpdated: s.lastUpdated
      }));
  } catch (error) {
    console.error('Error loading shelters:', error);
    return [];
  }
}

/**
 * Get nearest shelters based on coordinates
 */
export async function getNearestShelters(
  coordinates: [number, number],
  maxDistance: number = 50
): Promise<Array<Shelter & { distance: number }>> {
  try {
    const response = await fetch('/data/survival-kit-prices.json');
    const data = await response.json();
    
    const sheltersWithDistance = data.shelters.map((shelter: Shelter) => {
      const distance = calculateDistance(
        coordinates[0],
        coordinates[1],
        shelter.coordinates[0],
        shelter.coordinates[1]
      );
      
      return {
        ...shelter,
        distance
      };
    });

    // Filter by max distance and sort by distance
    return sheltersWithDistance
      .filter((s: any) => s.distance <= maxDistance)
      .sort((a: any, b: any) => a.distance - b.distance);
  } catch (error) {
    console.error('Error loading nearest shelters:', error);
    return [];
  }
}

/**
 * Update shelter status (would typically call an API)
 */
export async function updateShelterStatus(
  shelterId: string,
  status: Shelter['status'],
  occupancy?: number
): Promise<Shelter | null> {
  // In a real implementation, this would call an API
  // For now, we'll just update in local storage
  try {
    const key = `shelter-status-${shelterId}`;
    const statusData = {
      status,
      currentOccupancy: occupancy,
      lastUpdated: new Date().toISOString()
    };
    
    localStorage.setItem(key, JSON.stringify(statusData));
    
    // Return updated shelter data
    // This is a simplified version
    return null;
  } catch (error) {
    console.error('Error updating shelter status:', error);
    return null;
  }
}

/**
 * Get shelter by ID
 */
export async function getShelterById(shelterId: string): Promise<Shelter | null> {
  try {
    const response = await fetch('/data/survival-kit-prices.json');
    const data = await response.json();
    
    const shelter = data.shelters.find((s: Shelter) => s.id === shelterId);
    return shelter || null;
  } catch (error) {
    console.error('Error loading shelter:', error);
    return null;
  }
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Get shelters by commune
 */
export async function getSheltersByCommune(
  territory: Territory,
  commune: string
): Promise<Shelter[]> {
  const allShelters = await getAllShelters(territory);
  return allShelters.filter(
    s => s.commune.toLowerCase() === commune.toLowerCase()
  );
}

/**
 * Get available shelters (open and not full)
 */
export async function getAvailableShelters(territory: Territory): Promise<Shelter[]> {
  const allShelters = await getAllShelters(territory);
  return allShelters.filter(s => s.status === 'open' && s.status !== 'full');
}

/**
 * Check if shelter has specific facility
 */
export function hasFacility(shelter: Shelter, facility: keyof Shelter['facilities']): boolean {
  return shelter.facilities[facility] === true;
}

/**
 * Get shelter capacity status
 */
export function getShelterCapacityStatus(shelter: Shelter): {
  available: number;
  percentFull: number;
  status: 'available' | 'filling' | 'almost_full' | 'full';
} {
  const occupancy = shelter.currentOccupancy || 0;
  const available = shelter.capacity - occupancy;
  const percentFull = (occupancy / shelter.capacity) * 100;
  
  let status: 'available' | 'filling' | 'almost_full' | 'full';
  if (percentFull === 100) {
    status = 'full';
  } else if (percentFull >= 90) {
    status = 'almost_full';
  } else if (percentFull >= 50) {
    status = 'filling';
  } else {
    status = 'available';
  }
  
  return { available, percentFull, status };
}
