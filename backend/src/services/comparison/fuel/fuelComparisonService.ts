/**
 * Fuel Comparison Service - Backend
 * Version: 1.0.0
 * 
 * Implements backend service for fuel price comparison
 * Integrates with prix-carburants.gouv.fr API
 */

import { ServiceComparisonCore } from '../ServiceComparisonCore.js';
import {
  ServiceOffer,
  ServiceFilters,
  Territory,
  DataSource,
} from '../types.js';

/**
 * Fuel types
 */
export enum FuelType {
  SP95 = 'SP95',
  SP98 = 'SP98',
  E10 = 'E10',
  E85 = 'E85',
  DIESEL = 'DIESEL',
  GPL = 'GPL',
}

/**
 * Fuel-specific specifications
 */
export interface FuelSpecifications {
  fuelType: FuelType;
  pricePerLiter: number;
  stationId: string;
  stationName: string;
  stationAddress: string;
  stationCity: string;
  stationBrand?: string;
  isPriceCap: boolean;
  location?: {
    lat: number;
    lng: number;
  };
}

/**
 * Fuel comparison filters
 */
export interface FuelFilters extends Omit<ServiceFilters, 'specificFilters'> {
  fuelType?: FuelType;
  maxDistanceKm?: number;
  userLocation?: {
    lat: number;
    lng: number;
  };
  onlyPriceCap?: boolean;
  brand?: string;
  city?: string;
}

/**
 * Mapping DOM-TOM departments
 * Uses same territory codes as frontend for consistency
 */
const TERRITORY_TO_DEPARTMENT: Record<string, string> = {
  GP: '971', // Guadeloupe
  MQ: '972', // Martinique  
  GY: '973', // Guyane
  RE: '974', // La Réunion
  YT: '976', // Mayotte
};

/**
 * Fuel Comparison Service
 */
export class FuelComparisonService extends ServiceComparisonCore {
  private static instance: FuelComparisonService;
  private mockData: ServiceOffer[] = [];

  private constructor() {
    super('fuel');
  }

  /**
   * Singleton pattern
   */
  public static getInstance(): FuelComparisonService {
    if (!FuelComparisonService.instance) {
      FuelComparisonService.instance = new FuelComparisonService();
    }
    return FuelComparisonService.instance;
  }

  /**
   * Configure mock data (for development/test)
   */
  public setMockData(offers: ServiceOffer[]): void {
    this.mockData = offers;
  }

  /**
   * Fetch offers from data source
   * In production, this would call the prix-carburants.gouv.fr API
   */
  protected async fetchOffers(filters: ServiceFilters): Promise<ServiceOffer[]> {
    // For now, use mock data
    // In production, this would fetch from API:
    // const department = this.getDepartmentFromTerritory(filters.territories?.[0]);
    // const apiData = await this.fetchFromGovernmentAPI(department);
    
    let offers = [...this.mockData];

    // Filtrage par territoire
    if (filters.territories && filters.territories.length > 0) {
      offers = offers.filter((o) => filters.territories!.includes(o.territory));
    }

    // Filtrage par prix
    if (filters.minPrice !== undefined) {
      offers = offers.filter((o) => o.priceIncludingTax >= filters.minPrice!);
    }
    if (filters.maxPrice !== undefined) {
      offers = offers.filter((o) => o.priceIncludingTax <= filters.maxPrice!);
    }

    // Filtrage par date
    if (filters.startDate) {
      offers = offers.filter((o) => o.validFrom >= filters.startDate!);
    }
    if (filters.endDate) {
      offers = offers.filter(
        (o) => !o.validUntil || o.validUntil <= filters.endDate!,
      );
    }

    // Filtres spécifiques au carburant
    if (filters.specificFilters) {
      const fuelFilters = filters.specificFilters as Partial<FuelFilters>;

      if (fuelFilters.fuelType) {
        offers = offers.filter((o) => {
          const specs = o.specifications as unknown as FuelSpecifications;
          return specs.fuelType === fuelFilters.fuelType;
        });
      }

      if (fuelFilters.onlyPriceCap) {
        offers = offers.filter((o) => {
          const specs = o.specifications as unknown as FuelSpecifications;
          return specs.isPriceCap;
        });
      }

      if (fuelFilters.brand) {
        offers = offers.filter((o) => {
          const specs = o.specifications as unknown as FuelSpecifications;
          return (
            specs.stationBrand &&
            specs.stationBrand
              .toLowerCase()
              .includes(fuelFilters.brand!.toLowerCase())
          );
        });
      }

      if (fuelFilters.city) {
        offers = offers.filter((o) => {
          const specs = o.specifications as unknown as FuelSpecifications;
          return (
            specs.stationCity &&
            specs.stationCity
              .toLowerCase()
              .includes(fuelFilters.city!.toLowerCase())
          );
        });
      }

      if (fuelFilters.userLocation && fuelFilters.maxDistanceKm) {
        offers = offers.filter((o) => {
          const specs = o.specifications as unknown as FuelSpecifications;
          if (!specs.location) return false;
          const distance = this.calculateDistance(
            fuelFilters.userLocation!.lat,
            fuelFilters.userLocation!.lng,
            specs.location.lat,
            specs.location.lng
          );
          return distance <= fuelFilters.maxDistanceKm!;
        });
      }
    }

    // Validation des offres
    offers = offers.filter((o) => this.validateOffer(o));

    return offers;
  }

  /**
   * Get department code from territory
   */
  private getDepartmentFromTerritory(territory?: Territory): string | null {
    if (!territory) return null;
    return TERRITORY_TO_DEPARTMENT[territory] || null;
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  private calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Fetch from government API (placeholder for future implementation)
   */
  private async fetchFromGovernmentAPI(department: string | null): Promise<any[]> {
    // TODO: Implement actual API call to prix-carburants.gouv.fr
    // Example:
    // const response = await fetch(`https://www.prix-carburants.gouv.fr/api/stations/${department}`);
    // return await response.json();
    console.log(`Would fetch fuel prices for department: ${department}`);
    return [];
  }
}

/**
 * Helper to create a fuel offer
 */
export function createFuelOffer(
  id: string,
  stationName: string,
  territory: Territory,
  specifications: FuelSpecifications,
  source: DataSource,
  validFrom: Date = new Date()
): ServiceOffer {
  return {
    id,
    providerName: stationName,
    offerName: `${specifications.fuelType} - ${specifications.stationCity}`,
    priceIncludingTax: specifications.pricePerLiter,
    territory,
    specifications: specifications as unknown as Record<
      string,
      string | number | boolean
    >,
    source,
    validFrom,
  };
}
