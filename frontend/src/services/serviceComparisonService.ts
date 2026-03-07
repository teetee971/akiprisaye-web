 
// Service for handling services (transport, telecoms, utilities) comparison

import type {
  ServicesDatabase,
  ServiceCategory,
  TerritoryCode,
  FlightPrice,
  BoatPrice,
  InternetSubscription,
  MobileSubscription,
  WaterUtility,
  ElectricityUtility,
  ServiceProvider,
} from '../types/service';

let cachedDatabase: ServicesDatabase | null = null;

/**
 * Load services database
 */
export async function loadServicesDatabase(): Promise<ServicesDatabase> {
  if (cachedDatabase) {
    return cachedDatabase;
  }

  try {
    const response = await fetch(`${import.meta.env.BASE_URL}data/services-prices.json`);
    if (!response.ok) {
      throw new Error(`Failed to load services database: ${response.statusText}`);
    }
    cachedDatabase = await response.json() as ServicesDatabase;
    return cachedDatabase;
  } catch (error) {
    console.error('Error loading services database:', error);
    throw error;
  }
}

/**
 * Get all providers
 */
export async function getAllProviders(): Promise<ServiceProvider[]> {
  const db = await loadServicesDatabase();
  return db.providers;
}

/**
 * Get providers by territory
 */
export async function getProvidersByTerritory(territory: TerritoryCode): Promise<ServiceProvider[]> {
  const db = await loadServicesDatabase();
  return db.providers.filter((p) => p.territory === territory);
}

/**
 * Get providers by type
 */
export async function getProvidersByType(
  type: ServiceProvider['type']
): Promise<ServiceProvider[]> {
  const db = await loadServicesDatabase();
  return db.providers.filter((p) => p.type === type);
}

/**
 * Get all flights
 */
export async function getAllFlights(): Promise<FlightPrice[]> {
  const db = await loadServicesDatabase();
  return db.flights;
}

/**
 * Search flights by route
 */
export async function searchFlights(params: {
  from?: string;
  to?: string;
  territory?: TerritoryCode;
}): Promise<FlightPrice[]> {
  const db = await loadServicesDatabase();
  let results = db.flights;

  if (params.from) {
    const fromLower = params.from.toLowerCase();
    results = results.filter(
      (f) =>
        f.route.from.toLowerCase().includes(fromLower) ||
        f.route.fromCode.toLowerCase().includes(fromLower)
    );
  }

  if (params.to) {
    const toLower = params.to.toLowerCase();
    results = results.filter(
      (f) =>
        f.route.to.toLowerCase().includes(toLower) ||
        f.route.toCode.toLowerCase().includes(toLower)
    );
  }

  // Sort by price (average)
  return results.sort((a, b) => a.price.average - b.price.average);
}

/**
 * Get all boat/ferry prices
 */
export async function getAllBoats(): Promise<BoatPrice[]> {
  const db = await loadServicesDatabase();
  return db.boats;
}

/**
 * Search boat routes
 */
export async function searchBoats(params: {
  from?: string;
  to?: string;
}): Promise<BoatPrice[]> {
  const db = await loadServicesDatabase();
  let results = db.boats;

  if (params.from) {
    const fromLower = params.from.toLowerCase();
    results = results.filter((b) => b.route.from.toLowerCase().includes(fromLower));
  }

  if (params.to) {
    const toLower = params.to.toLowerCase();
    results = results.filter((b) => b.route.to.toLowerCase().includes(toLower));
  }

  return results.sort((a, b) => a.price.average - b.price.average);
}

/**
 * Get all internet subscriptions
 */
export async function getAllInternetSubscriptions(): Promise<InternetSubscription[]> {
  const db = await loadServicesDatabase();
  return db.internet;
}

/**
 * Search internet subscriptions
 */
export async function searchInternet(params: {
  territory?: TerritoryCode;
  minSpeed?: number;
  maxPrice?: number;
}): Promise<InternetSubscription[]> {
  const db = await loadServicesDatabase();
  let results = db.internet;

  if (params.territory) {
    const providers = await getProvidersByTerritory(params.territory);
    const providerIds = providers.map((p) => p.id);
    results = results.filter((i) => providerIds.includes(i.provider));
  }

  if (params.minSpeed !== undefined) {
    results = results.filter((i) => i.speed.download >= params.minSpeed!);
  }

  if (params.maxPrice !== undefined) {
    results = results.filter((i) => i.price.monthly <= params.maxPrice!);
  }

  return results.sort((a, b) => a.price.monthly - b.price.monthly);
}

/**
 * Get all mobile subscriptions
 */
export async function getAllMobileSubscriptions(): Promise<MobileSubscription[]> {
  const db = await loadServicesDatabase();
  return db.mobile;
}

/**
 * Search mobile subscriptions
 */
export async function searchMobile(params: {
  territory?: TerritoryCode;
  minData?: number;
  maxPrice?: number;
}): Promise<MobileSubscription[]> {
  const db = await loadServicesDatabase();
  let results = db.mobile;

  if (params.territory) {
    const providers = await getProvidersByTerritory(params.territory);
    const providerIds = providers.map((p) => p.id);
    results = results.filter((m) => providerIds.includes(m.provider));
  }

  if (params.minData !== undefined) {
    results = results.filter((m) => m.data >= params.minData!);
  }

  if (params.maxPrice !== undefined) {
    results = results.filter((m) => m.price.monthly <= params.maxPrice!);
  }

  return results.sort((a, b) => a.price.monthly - b.price.monthly);
}

/**
 * Get all water utilities
 */
export async function getAllWaterUtilities(): Promise<WaterUtility[]> {
  const db = await loadServicesDatabase();
  return db.water;
}

/**
 * Search water utilities by territory/commune
 */
export async function searchWater(params: {
  territory?: TerritoryCode;
  commune?: string;
}): Promise<WaterUtility[]> {
  const db = await loadServicesDatabase();
  let results = db.water;

  if (params.territory) {
    results = results.filter((w) => w.territory === params.territory);
  }

  if (params.commune) {
    const communeLower = params.commune.toLowerCase();
    results = results.filter((w) => w.commune.toLowerCase().includes(communeLower));
  }

  return results.sort((a, b) => a.averageMonthlyBill.average - b.averageMonthlyBill.average);
}

/**
 * Get all electricity utilities
 */
export async function getAllElectricityUtilities(): Promise<ElectricityUtility[]> {
  const db = await loadServicesDatabase();
  return db.electricity;
}

/**
 * Search electricity utilities
 */
export async function searchElectricity(params: {
  territory?: TerritoryCode;
  power?: number;
  offerType?: 'base' | 'heures_creuses' | 'tempo';
}): Promise<ElectricityUtility[]> {
  const db = await loadServicesDatabase();
  let results = db.electricity;

  if (params.territory) {
    results = results.filter((e) => e.territory === params.territory);
  }

  if (params.power) {
    results = results.filter((e) => e.power === params.power);
  }

  if (params.offerType) {
    results = results.filter((e) => e.offerType === params.offerType);
  }

  return results.sort((a, b) => a.averageMonthlyBill.average - b.averageMonthlyBill.average);
}

/**
 * Get service statistics
 */
export async function getServiceStatistics() {
  const db = await loadServicesDatabase();

  return {
    totalProviders: db.providers.length,
    totalFlights: db.flights.length,
    totalBoats: db.boats.length,
    totalInternetOffers: db.internet.length,
    totalMobileOffers: db.mobile.length,
    totalWaterServices: db.water.length,
    totalElectricityServices: db.electricity.length,
    territories: db.metadata.territories,
    categories: db.metadata.categories,
    version: db.metadata.version,
    lastUpdated: db.metadata.lastUpdated,
  };
}
