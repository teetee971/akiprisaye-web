import type { Territory } from '../types';

export type ConnectorType = 'partner_api' | 'open_data' | 'backoffice';

export interface ConnectorPrice {
  ean: string;
  retailer: string;
  priceCents: number;
  currency: 'EUR';
  unit?: string;
  observedAt?: string;
  rawRef?: string;
  rawPayload?: Record<string, unknown>;
}

export interface FetchContext {
  territory: Territory;
  eans: string[];
  env: {
    PRICE_DB: D1Database;
  };
}

export interface Connector {
  id: string;
  name: string;
  type: ConnectorType;
  enabledByDefault: boolean;
  supportsTerritory(territory: Territory): boolean;
  fetchPrices(context: FetchContext): Promise<ConnectorPrice[]>;
}
