export type TerritoryCode = 'gp' | 'mq' | 'fr' | 'gf' | 're' | 'yt';

export type PromoSource = {
  id: string;
  name: string;
  territory: TerritoryCode;
  storeId?: string;
  title: string;
  periodStart: string;
  periodEnd: string;
  url: string;
  tags?: string[];
};

export type AlertSeverity = 'info' | 'warning' | 'critical';

export type Alert = {
  id: string;
  severity: AlertSeverity;
  territory?: TerritoryCode;
  storeId?: string;
  title: string;
  message: string;
  sourceName: string;
  sourceUrl?: string;
  startsAt: string;
  endsAt?: string;
};

export type ObservationDataStatus = 'OK' | 'PARTIAL' | 'NO_DATA';

export type NormalizedPriceObservation = {
  id: string;
  barcode: string;
  productName: string;
  territory: TerritoryCode;
  storeId?: string;
  storeName: string;
  price: number;
  currency: 'EUR';
  observedAt: string;
  source: string;
  reliability: 'high' | 'medium' | 'low';
};
