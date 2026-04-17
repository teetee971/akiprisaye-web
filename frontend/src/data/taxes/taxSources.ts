// src/data/taxes/taxSources.ts
/**
 * Official sources for tax data
 * All sources must be verifiable and institutional
 */

export interface TaxSource {
  id: string;
  name: string;
  type: 'official' | 'institutional' | 'estimated';
  url: string;
  description: string;
  reliability: 'high' | 'medium' | 'low';
  lastVerified: string; // ISO date format
}

/**
 * Official sources for tax information
 * Each source is documented with URL and verification date
 */
export const TAX_SOURCES: Record<string, TaxSource> = {
  insee: {
    id: 'insee',
    name: 'INSEE - Institut National de la Statistique et des Études Économiques',
    type: 'official',
    url: 'https://www.insee.fr',
    description: 'Organisme officiel de statistiques français',
    reliability: 'high',
    lastVerified: '2025-01-01',
  },
  dgddi: {
    id: 'dgddi',
    name: 'DGDDI - Direction Générale des Douanes et Droits Indirects',
    type: 'official',
    url: 'https://www.douane.gouv.fr',
    description: 'Administration des douanes et des taxes indirectes',
    reliability: 'high',
    lastVerified: '2025-01-01',
  },
  legifrance: {
    id: 'legifrance',
    name: 'Légifrance - Service Public de la Diffusion du Droit',
    type: 'official',
    url: 'https://www.legifrance.gouv.fr',
    description: 'Publication officielle des textes législatifs et réglementaires',
    reliability: 'high',
    lastVerified: '2025-01-01',
  },
  dgfip: {
    id: 'dgfip',
    name: 'DGFiP - Direction Générale des Finances Publiques',
    type: 'official',
    url: 'https://www.impots.gouv.fr',
    description: 'Administration fiscale française',
    reliability: 'high',
    lastVerified: '2025-01-01',
  },
  jo_officiel: {
    id: 'jo_officiel',
    name: 'Journal Officiel de la République Française',
    type: 'official',
    url: 'https://www.journal-officiel.gouv.fr',
    description: 'Publication officielle des lois et décrets',
    reliability: 'high',
    lastVerified: '2025-01-01',
  },
  collectivites_territoriales: {
    id: 'collectivites_territoriales',
    name: 'Collectivités Territoriales des DOM',
    type: 'institutional',
    url: '',
    description: 'Données publiées par les régions et départements ultramarins',
    reliability: 'high',
    lastVerified: '2025-01-01',
  },
  european_commission: {
    id: 'european_commission',
    name: 'Commission Européenne - DG TAXUD',
    type: 'official',
    url: 'https://taxation-customs.ec.europa.eu',
    description: "Direction générale de la fiscalité et de l'union douanière",
    reliability: 'high',
    lastVerified: '2025-01-01',
  },
};

/**
 * Get source by ID
 */
export function getTaxSource(sourceId: string): TaxSource | undefined {
  return TAX_SOURCES[sourceId];
}

/**
 * Get all sources
 */
export function getAllTaxSources(): TaxSource[] {
  return Object.values(TAX_SOURCES);
}
