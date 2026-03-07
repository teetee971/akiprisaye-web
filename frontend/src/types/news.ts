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
  imageUrl?: string;
}

// Legacy civic exports kept for compatibility with existing components
export type NewsCategory = 'PRIX' | 'POLITIQUE' | 'ALERTE' | 'INNOVATION';

export interface OfficialSource {
  name: string;
  url: string;
  logo?: string;
}

export interface CivicNewsItem {
  id: string;
  title: string;
  summary: string;
  category: NewsCategory;
  territory: string;
  publishedAt: string;
  source: OfficialSource;
}

export const AUTHORIZED_SOURCES = [
  'data.gouv.fr',
  'insee.fr',
  'economie.gouv.fr',
  'outre-mer.gouv.fr',
  'guadeloupe.pref.gouv.fr',
  'martinique.pref.gouv.fr',
  'guyane.pref.gouv.fr',
  'reunion.pref.gouv.fr',
  'mayotte.pref.gouv.fr',
] as const;

function extractHostname(url: string): string | null {
  try {
    return new URL(url).hostname;
  } catch {
    try {
      return new URL(`https://${url}`).hostname;
    } catch {
      return null;
    }
  }
}

export function isAuthorizedSource(url: string): boolean {
  const hostname = extractHostname(url);
  if (!hostname) return false;

  return AUTHORIZED_SOURCES.some((source) => hostname === source || hostname.endsWith(`.${source}`));
}

export interface CategoryConfig {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
}

export const categoryConfigs: Record<NewsCategory, CategoryConfig> = {
  PRIX: { label: 'PRIX', color: 'text-green-400', bgColor: 'bg-green-500/10', borderColor: 'border-green-500/30', icon: '📉' },
  POLITIQUE: { label: 'POLITIQUE', color: 'text-purple-400', bgColor: 'bg-purple-500/10', borderColor: 'border-purple-500/30', icon: '🏛️' },
  ALERTE: { label: 'ALERTE', color: 'text-red-400', bgColor: 'bg-red-500/10', borderColor: 'border-red-500/30', icon: '⚠️' },
  INNOVATION: { label: 'INNOVATION', color: 'text-blue-400', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/30', icon: '💡' },
};
