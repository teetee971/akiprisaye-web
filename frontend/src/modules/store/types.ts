export type ServiceMode = 'inStore' | 'drive' | 'delivery';

export interface Store {
  id: string;
  name: string;
  brand: string;
  territory: string;
  address?: string;
  city?: string;
  postalCode?: string;
  lat?: number;
  lon?: number;
  services: {
    inStore: boolean;
    drive: boolean;
    delivery: boolean;
  };
}

export interface StoreSelection {
  storeId: string;
  territory: string;
  serviceMode: ServiceMode;
  updatedAt: string;
}
