/**
 * Corporate Service
 *
 * Gestion des comptes B2B corporate : centres sociaux, écoles, collectivités, ONG.
 * Tarification sur devis avec packages adaptés à chaque type d'organisation.
 */

export type CorporateType = 'social_center' | 'school' | 'collectivity' | 'ngo';

export interface CorporatePackage {
  type: CorporateType;
  label: string;
  description: string;
  targetAudience: string;
  monthlyFee: number;
  annualFee: number;
  features: string[];
  potentialRevenue: string;
  examples: string[];
}

export const CORPORATE_PACKAGES: Record<CorporateType, CorporatePackage> = {
  social_center: {
    type: 'social_center',
    label: 'Centres Sociaux',
    description: 'Programme "Aide course économe" pour accompagner les ménages précaires.',
    targetAudience: 'Centres sociaux, CCAS, associations d\'aide',
    monthlyFee: 1000,
    annualFee: 10000,
    features: [
      'Accès illimité pour les bénéficiaires',
      'Tableau de bord gestionnaire',
      'Ateliers numériques inclus',
      'Rapports d\'impact mensuels',
      'Support prioritaire',
    ],
    potentialRevenue: '10k€/mois (10 centres)',
    examples: ['Centre Social de Pointe-à-Pitre', 'CCAS Basse-Terre', 'CSCS Fort-de-France'],
  },
  school: {
    type: 'school',
    label: 'Écoles & Universités',
    description: 'Module "éducation financière" pour former les jeunes aux courses intelligentes.',
    targetAudience: 'Lycées, universités, instituts de formation',
    monthlyFee: 200,
    annualFee: 2000,
    features: [
      'Module pédagogique clé en main',
      'Comptes élèves illimités',
      'Exercices pratiques',
      'Données anonymisées pour cours',
      'Certificat de formation',
    ],
    potentialRevenue: '10k€/mois (50 établissements)',
    examples: ['Lycée Baimbridge', 'Université des Antilles', 'IUT Guadeloupe'],
  },
  collectivity: {
    type: 'collectivity',
    label: 'Collectivités Régionales',
    description: 'Observatoire local des prix pour les décideurs publics.',
    targetAudience: 'Régions, départements, communes, EPCI',
    monthlyFee: 2000,
    annualFee: 20000,
    features: [
      'Tableau de bord exécutif',
      'Rapports territoriaux personnalisés',
      'API d\'accès aux données',
      'Outil de veille concurrentielle',
      'Intégration portail citoyen',
      'Support SLA 99,9%',
    ],
    potentialRevenue: '10k€/mois (5 régions)',
    examples: ['Région Guadeloupe', 'Collectivité de Martinique', 'Région Guyane'],
  },
  ngo: {
    type: 'ngo',
    label: 'ONG & Associations',
    description: 'Programme anti-pauvreté avec tarification solidaire.',
    targetAudience: 'ONG, associations caritatives, fondations',
    monthlyFee: 42, // 500€/year
    annualFee: 500,
    features: [
      'Accès complet à tarif solidaire',
      'Badge "Partenaire Solidaire"',
      'Communication commune',
      'Données d\'impact partagées',
    ],
    potentialRevenue: '10k€/an (20 ONG)',
    examples: ['Secours Catholique Antilles', 'Restos du Cœur Réunion', 'Fondation Abbé Pierre'],
  },
};

export class CorporateService {
  static getAllPackages(): CorporatePackage[] {
    return Object.values(CORPORATE_PACKAGES);
  }

  static getPackageByType(type: CorporateType): CorporatePackage {
    return CORPORATE_PACKAGES[type];
  }

  /**
   * Compute annual savings vs. standard pricing.
   */
  static computeSavingsVsStandard(type: CorporateType, standardAnnualPrice: number): number {
    const pkg = CORPORATE_PACKAGES[type];
    return Math.max(0, standardAnnualPrice - pkg.annualFee);
  }

  /**
   * Estimate total MRR from corporate accounts.
   */
  static estimateMRR(accountCounts: Partial<Record<CorporateType, number>>): number {
    return Object.entries(accountCounts).reduce((total, [type, count]) => {
      const pkg = CORPORATE_PACKAGES[type as CorporateType];
      return total + pkg.monthlyFee * (count ?? 0);
    }, 0);
  }

  /**
   * Validate a corporate email (must be institutional).
   */
  static isInstitutionalEmail(email: string): boolean {
    const institutionalDomains = [
      '.gouv.fr',
      '.ac-',
      '.edu',
      '.univ-',
      '.rectorat.',
      '.asso.fr',
      '.org',
      '.gp',
      '.mq',
      '.re',
      '.gf',
    ];
    return institutionalDomains.some((domain) => email.toLowerCase().includes(domain));
  }

  /**
   * Generate a quote reference number.
   */
  static generateQuoteRef(): string {
    const year = new Date().getFullYear();
    const random = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `AKI-CORP-${year}-${random}`;
  }
}
