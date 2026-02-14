import type { TerritoryCode } from '../constants/territories';

export type OpeningDay = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export interface Store {
  id: string;
  name: string;
  territory: TerritoryCode;
  city: string;
  postalCode: string;
  address: string;
  lat: number;
  lon: number;
  phone?: string;
  openingHours?: Partial<Record<OpeningDay, string[]>>;
}
