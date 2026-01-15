/**
 * Route Optimization Utilities
 * Implements TSP (Traveling Salesman Problem) solver for multi-store shopping trips
 */

import { calculateDistance, type GeoPosition } from './geoLocation';

export interface StoreWithDistance {
  id: string;
  name?: string;
  enseigne?: string;
  lat: number;
  lon: number;
  distance: number;
  type_magasin?: string;
  [key: string]: any;
}

export interface OptimalRoute {
  stores: StoreWithDistance[];
  totalDistance: number;
  totalTime: number;
  order: number[];
  savings: {
    distance: number;
    fuel: number;
    co2: number;
  };
}

/**
 * Estimate travel time based on distance
 * Assumes average urban speed of 30 km/h
 */
function estimateTravelTime(distanceKm: number): number {
  const AVERAGE_SPEED_KMH = 30;
  return Math.round((distanceKm / AVERAGE_SPEED_KMH) * 60); // minutes
}

/**
 * Calculate fuel consumption and CO2 emissions
 */
function calculateImpact(distanceKm: number) {
  const FUEL_CONSUMPTION_L_PER_100KM = 6;
  const CO2_PER_LITER = 2.3; // kg CO2 per liter of fuel
  
  const fuelLiters = (distanceKm * FUEL_CONSUMPTION_L_PER_100KM) / 100;
  const co2Kg = fuelLiters * CO2_PER_LITER;
  
  return { fuelLiters, co2Kg };
}

/**
 * Solve TSP using Nearest Neighbor algorithm (Greedy approach)
 * Simple but efficient for small number of stores (< 20)
 * 
 * @param userPos User's starting position
 * @param stores Array of stores to visit
 * @returns Optimal route with metrics
 */
export function solveShoppingRoute(
  userPos: GeoPosition,
  stores: StoreWithDistance[]
): OptimalRoute {
  if (stores.length === 0) {
    return {
      stores: [],
      totalDistance: 0,
      totalTime: 0,
      order: [],
      savings: { distance: 0, fuel: 0, co2: 0 }
    };
  }

  if (stores.length === 1) {
    const distance = stores[0].distance * 2; // round trip
    const impact = calculateImpact(distance);
    return {
      stores,
      totalDistance: distance,
      totalTime: estimateTravelTime(distance),
      order: [0],
      savings: { distance: 0, fuel: 0, co2: 0 }
    };
  }

  // Greedy Nearest Neighbor algorithm
  const route: StoreWithDistance[] = [];
  const visited = new Set<string>();
  let current = userPos;
  let totalDistance = 0;

  while (route.length < stores.length) {
    let nearest: StoreWithDistance | null = null;
    let minDist = Infinity;

    for (const store of stores) {
      if (!visited.has(store.id)) {
        const dist = calculateDistance(
          current.lat,
          current.lon,
          store.lat,
          store.lon
        );
        if (dist < minDist) {
          minDist = dist;
          nearest = store;
        }
      }
    }

    if (nearest) {
      route.push(nearest);
      visited.add(nearest.id);
      totalDistance += minDist;
      current = { lat: nearest.lat, lon: nearest.lon };
    } else {
      break;
    }
  }

  // Add return distance
  const returnDist = calculateDistance(
    current.lat,
    current.lon,
    userPos.lat,
    userPos.lon
  );
  totalDistance += returnDist;

  // Calculate unoptimized distance (each store round trip individually)
  const unoptimizedDistance = stores.reduce((sum, store) => sum + (store.distance * 2), 0);
  const distanceSaved = unoptimizedDistance - totalDistance;
  const impact = calculateImpact(distanceSaved);

  return {
    stores: route,
    totalDistance: Math.round(totalDistance * 10) / 10,
    totalTime: estimateTravelTime(totalDistance),
    order: route.map((_, i) => i),
    savings: {
      distance: Math.round(distanceSaved * 10) / 10,
      fuel: Math.round(impact.fuelLiters * 10) / 10,
      co2: Math.round(impact.co2Kg * 10) / 10
    }
  };
}

/**
 * Get route instructions as human-readable steps
 */
export function getRouteInstructions(route: OptimalRoute, userPos: GeoPosition): string[] {
  const instructions: string[] = [];
  
  instructions.push(`🏠 Départ de votre position`);
  
  route.stores.forEach((store, index) => {
    const storeName = store.enseigne || store.name || `Magasin ${index + 1}`;
    instructions.push(`${index + 1}. ${storeName} (${store.distance.toFixed(1)} km)`);
  });
  
  instructions.push(`🏠 Retour à votre position`);
  
  return instructions;
}
