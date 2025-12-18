// backend/src/services/DistanceCalculator.ts
/**
 * DistanceCalculator Service
 * 
 * Calculates distances and optimizes routes for shopping trips
 * Used for multi-trip optimization feature
 */

interface Location {
  lat: number;
  lng: number;
}

interface Store {
  id: string;
  name: string;
  location: Location;
  address?: string;
}

interface RouteOptimization {
  totalDistance: number; // in km
  totalTime: number; // in minutes
  estimatedFuelCost: number; // in euros
  stores: Array<{
    store: Store;
    distance: number; // from previous point
    order: number;
  }>;
  route: Location[]; // Ordered list of coordinates
}

export class DistanceCalculator {
  // Average fuel consumption in L/100km
  // TODO: Make territory-specific - urban vs rural, terrain differences
  private readonly AVG_FUEL_CONSUMPTION = 7.5;
  
  // Average speed in km/h
  // TODO: Make territory-specific - traffic conditions vary by territory
  private readonly AVG_SPEED = 40;

  /**
   * Calculate distance between two points using Haversine formula
   * Returns distance in kilometers
   */
  calculateDistance(point1: Location, point2: Location): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(point2.lat - point1.lat);
    const dLng = this.toRad(point2.lng - point1.lng);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(point1.lat)) * 
      Math.cos(this.toRad(point2.lat)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return parseFloat(distance.toFixed(2));
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Find nearest stores to user location
   */
  findNearestStores(
    userLocation: Location,
    stores: Store[],
    maxDistance?: number,
    limit?: number
  ): Array<Store & { distance: number }> {
    const storesWithDistance = stores.map(store => ({
      ...store,
      distance: this.calculateDistance(userLocation, store.location),
    }));

    let filtered = storesWithDistance;
    
    if (maxDistance) {
      filtered = filtered.filter(s => s.distance <= maxDistance);
    }

    filtered.sort((a, b) => a.distance - b.distance);

    if (limit) {
      filtered = filtered.slice(0, limit);
    }

    return filtered;
  }

  /**
   * Calculate fuel cost for a trip
   * @param distance - Distance in km
   * @param fuelPrice - Price per liter (from DGCCRF data)
   * @param consumption - L/100km (optional, uses average if not provided)
   */
  calculateFuelCost(
    distance: number,
    fuelPrice: number,
    consumption?: number
  ): number {
    const fuelUsed = (distance / 100) * (consumption || this.AVG_FUEL_CONSUMPTION);
    const cost = fuelUsed * fuelPrice;
    return parseFloat(cost.toFixed(2));
  }

  /**
   * Calculate estimated time for a trip
   * @param distance - Distance in km
   * @param speed - Average speed in km/h (optional, uses default if not provided)
   */
  calculateTripTime(distance: number, speed?: number): number {
    const timeInHours = distance / (speed || this.AVG_SPEED);
    const timeInMinutes = timeInHours * 60;
    return Math.ceil(timeInMinutes);
  }

  /**
   * Optimize multi-store route using nearest neighbor algorithm
   * Not the optimal solution, but fast and good enough for small number of stores
   */
  optimizeRoute(
    startLocation: Location,
    stores: Store[],
    returnToStart: boolean = true,
    fuelPrice?: number
  ): RouteOptimization {
    if (stores.length === 0) {
      return {
        totalDistance: 0,
        totalTime: 0,
        estimatedFuelCost: 0,
        stores: [],
        route: [startLocation],
      };
    }

    // Nearest neighbor algorithm
    const visited: Store[] = [];
    const remaining = [...stores];
    let currentLocation = startLocation;
    let totalDistance = 0;
    const route: Location[] = [startLocation];

    while (remaining.length > 0) {
      // Find nearest unvisited store
      let nearestIndex = 0;
      let nearestDistance = this.calculateDistance(currentLocation, remaining[0].location);

      for (let i = 1; i < remaining.length; i++) {
        const distance = this.calculateDistance(currentLocation, remaining[i].location);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = i;
        }
      }

      // Visit nearest store
      const nearestStore = remaining[nearestIndex];
      visited.push(nearestStore);
      totalDistance += nearestDistance;
      currentLocation = nearestStore.location;
      route.push(nearestStore.location);
      remaining.splice(nearestIndex, 1);
    }

    // Return to start if needed
    if (returnToStart) {
      const returnDistance = this.calculateDistance(currentLocation, startLocation);
      totalDistance += returnDistance;
      route.push(startLocation);
    }

    const totalTime = this.calculateTripTime(totalDistance);
    const estimatedFuelCost = fuelPrice 
      ? this.calculateFuelCost(totalDistance, fuelPrice)
      : 0;

    const storesWithDetails = visited.map((store, index) => {
      const prevLocation = index === 0 ? startLocation : visited[index - 1].location;
      return {
        store,
        distance: this.calculateDistance(prevLocation, store.location),
        order: index + 1,
      };
    });

    return {
      totalDistance: parseFloat(totalDistance.toFixed(2)),
      totalTime,
      estimatedFuelCost,
      stores: storesWithDetails,
      route,
    };
  }

  /**
   * Compare single-store vs multi-store shopping scenarios
   * Helps user decide if it's worth visiting multiple stores
   */
  compareShoppingScenarios(
    userLocation: Location,
    scenarios: Array<{
      name: string;
      stores: Store[];
      totalSavings: number; // Savings on products
    }>,
    fuelPrice: number
  ): Array<{
    name: string;
    distance: number;
    time: number;
    fuelCost: number;
    productSavings: number;
    netSavings: number; // productSavings - fuelCost
    worthIt: boolean;
  }> {
    return scenarios.map(scenario => {
      const optimization = this.optimizeRoute(
        userLocation,
        scenario.stores,
        true,
        fuelPrice
      );

      const netSavings = scenario.totalSavings - optimization.estimatedFuelCost;
      const worthIt = netSavings > 0;

      return {
        name: scenario.name,
        distance: optimization.totalDistance,
        time: optimization.totalTime,
        fuelCost: optimization.estimatedFuelCost,
        productSavings: scenario.totalSavings,
        netSavings: parseFloat(netSavings.toFixed(2)),
        worthIt,
      };
    });
  }
}

export const distanceCalculator = new DistanceCalculator();
export default DistanceCalculator;
