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

export function isAuthorizedSource(url: string): boolean {
  return AUTHORIZED_SOURCES.some(source => url.includes(source));
}
