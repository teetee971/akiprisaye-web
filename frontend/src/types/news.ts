/**
 * Civic News Types for A KI PRI SA YÉ
 * All news items MUST have verifiable official sources
 */

export type NewsCategory = "PRIX" | "POLITIQUE" | "ALERTE" | "INNOVATION";

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

/**
 * Authorized official sources only
 * Any news without these sources should be rejected
 */
export const AUTHORIZED_SOURCES = [
  'data.gouv.fr',
  'insee.fr',
  'economie.gouv.fr', // DGCCRF
  'outre-mer.gouv.fr',
  'guadeloupe.pref.gouv.fr',
  'martinique.pref.gouv.fr',
  'guyane.pref.gouv.fr',
  'reunion.pref.gouv.fr',
  'mayotte.pref.gouv.fr',
] as const;

/**
 * Fixed: Use proper URL parsing to prevent false positives
 * e.g., "fake-insee.fr.malicious.com" should be rejected
 */
function extractHostname(url: string): string | null {
  try {
    // Try parsing as a full URL first
    return new URL(url).hostname;
  } catch {
    try {
      // Fallback: allow hostnames without protocol (e.g. "insee.fr")
      return new URL(`https://${url}`).hostname;
    } catch {
      return null;
    }
  }
}

export function isAuthorizedSource(url: string): boolean {
  const hostname = extractHostname(url);
  if (!hostname) return false;

  return AUTHORIZED_SOURCES.some((source) => {
    return hostname === source || hostname.endsWith(`.${source}`);
  });
}

/**
 * Legacy NewsItem interface for backward compatibility
 * @deprecated Use CivicNewsItem instead
 */
export interface NewsItem extends CivicNewsItem {}

/**
 * Category configuration for visual display
 */
export interface CategoryConfig {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
}

export const categoryConfigs: Record<NewsCategory, CategoryConfig> = {
  PRIX: {
    label: 'PRIX',
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
    icon: '📉'
  },
  POLITIQUE: {
    label: 'POLITIQUE',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    icon: '🏛️'
  },
  ALERTE: {
    label: 'ALERTE',
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    icon: '⚠️'
  },
  INNOVATION: {
    label: 'INNOVATION',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    icon: '💡'
  }
};
