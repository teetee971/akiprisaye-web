export type TerritoryCode = 'fr' | 'gp' | 'mq' | 'gf' | 're' | 'yt' | 'pm' | 'bl' | 'mf';

export type AlertSeverity = 'info' | 'important' | 'critical';

export type AlertStatus = 'active' | 'resolved';

export interface SanitaryAlert {
  id: string;
  territory: TerritoryCode;
  severity: AlertSeverity;
  status: AlertStatus;
  title: string;
  productName?: string;
  brand?: string;
  category?: string;
  ean?: string;
  lot?: string;
  bestBefore?: string;
  recalledAt?: string;
  publishedAt?: string;
  reason?: string;
  risk?: string;
  instructions?: string;
  sourceName: string;
  sourceUrl?: string;
  updatedAt?: string;
}
