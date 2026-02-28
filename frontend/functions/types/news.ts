export type NewsType = 'bons_plans' | 'rappels' | 'reglementaire' | 'indice' | 'dossiers' | 'press' | 'partner' | 'user';
export type NewsTerritory = 'gp' | 'mq' | 'gf' | 're' | 'yt' | 'fr' | 'all';
export type NewsImpact = 'fort' | 'moyen' | 'info';
export type NewsConfidence = 'official' | 'partner' | 'press' | 'user';

export interface NewsItem {
  id: string;
  type: NewsType;
  territory: NewsTerritory;
  title: string;
  summary: string;
  source_name: string;
  source_url: string;
  published_at: string;
  impact: NewsImpact;
  isSponsored: boolean;
  confidence: NewsConfidence;
  tags?: string[];
  evidence?: Record<string, unknown>;
  canonical_url?: string;
  expires_at?: string;
  verified: boolean;
}

export interface Ingester {
  id: string;
  confidence: 'official' | 'press' | 'partner';
  fetch(): Promise<NewsItem[]>;
}
