// Types for services (transport, telecoms, utilities)

export type ServiceCategory =
  | 'transport_aerien'
  | 'transport_maritime'
  | 'telecoms_internet'
  | 'telecoms_mobile'
  | 'utilities_eau'
  | 'utilities_electricite';

export type TerritoryCode = 'GP' | 'MQ' | 'GF' | 'RE';

export interface ServiceProvider {
  id: string;
  name: string;
  type: 'airline' | 'ferry' | 'isp' | 'mobile_operator' | 'water_utility' | 'electricity_utility';
  territory: TerritoryCode;
  logo?: string;
  website?: string;
  phone?: string;
  description?: string;
}

export interface FlightPrice {
  id: string;
  provider: string; // Provider ID
  route: {
    from: string;
    to: string;
    fromCode: string; // Airport code
    toCode: string;
  };
  price: {
    min: number; // Minimum price (economy)
    max: number; // Maximum price (business/first)
    average: number;
    currency: 'EUR';
  };
  duration: string; // e.g., "8h30"
  frequency: string; // e.g., "daily", "3x/week"
  lastUpdated: string; // ISO date
  reliability: {
    score: number; // 0-100
    level: 'high' | 'medium' | 'low';
    confirmations: number;
  };
}

export interface BoatPrice {
  id: string;
  provider: string;
  route: {
    from: string;
    to: string;
  };
  price: {
    min: number; // Passenger ticket
    max: number; // With vehicle
    average: number;
    currency: 'EUR';
  };
  duration: string;
  frequency: string;
  lastUpdated: string;
  reliability: {
    score: number;
    level: 'high' | 'medium' | 'low';
    confirmations: number;
  };
}

export interface InternetSubscription {
  id: string;
  provider: string;
  name: string; // Offer name
  speed: {
    download: number; // Mbps
    upload: number; // Mbps
  };
  price: {
    monthly: number;
    installation?: number;
    currency: 'EUR';
  };
  features: string[]; // e.g., ["TV incluse", "Appels illimités"]
  commitment: string; // e.g., "12 mois", "sans engagement"
  lastUpdated: string;
  reliability: {
    score: number;
    level: 'high' | 'medium' | 'low';
    confirmations: number;
  };
}

export interface MobileSubscription {
  id: string;
  provider: string;
  name: string;
  data: number; // GB per month
  price: {
    monthly: number;
    currency: 'EUR';
  };
  features: string[]; // e.g., ["Appels illimités", "SMS illimités"]
  commitment: string;
  lastUpdated: string;
  reliability: {
    score: number;
    level: 'high' | 'medium' | 'low';
    confirmations: number;
  };
}

export interface WaterUtility {
  id: string;
  provider: string;
  territory: TerritoryCode;
  commune: string;
  price: {
    fixedMonthly: number; // Abonnement mensuel
    perCubicMeter: number; // Prix par m³
    currency: 'EUR';
  };
  averageMonthlyBill: {
    min: number; // Small household
    average: number; // Average household
    max: number; // Large household
  };
  lastUpdated: string;
  reliability: {
    score: number;
    level: 'high' | 'medium' | 'low';
    confirmations: number;
  };
}

export interface ElectricityUtility {
  id: string;
  provider: string;
  territory: TerritoryCode;
  offerType: 'base' | 'heures_creuses' | 'tempo';
  price: {
    subscription: number; // Monthly subscription
    perKwh: number; // Price per kWh
    perKwhOffPeak?: number; // For heures creuses
    currency: 'EUR';
  };
  power: number; // kVA (3, 6, 9, 12 kVA)
  averageMonthlyBill: {
    min: number; // Low consumption
    average: number; // Average consumption
    max: number; // High consumption
  };
  lastUpdated: string;
  reliability: {
    score: number;
    level: 'high' | 'medium' | 'low';
    confirmations: number;
  };
}

export interface ServicesDatabase {
  metadata: {
    version: string;
    lastUpdated: string;
    territories: TerritoryCode[];
    categories: ServiceCategory[];
  };
  providers: ServiceProvider[];
  flights: FlightPrice[];
  boats: BoatPrice[];
  internet: InternetSubscription[];
  mobile: MobileSubscription[];
  water: WaterUtility[];
  electricity: ElectricityUtility[];
}
