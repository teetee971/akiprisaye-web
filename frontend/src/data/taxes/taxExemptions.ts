// src/data/taxes/taxExemptions.ts
/**
 * Tax exemptions and special regimes
 * Documents which products benefit from reduced rates or exemptions
 * All information sourced from official tax codes
 */

export interface TaxExemption {
  id: string
  taxType: 'tva' | 'octroi_de_mer' | 'octroi_de_mer_regional' | 'taxe_soda' | 'taxe_alcool' | 'droits_douane'
  category: string
  description: string
  beneficiaries: string
  legalBasis: string
  territoryApplicability: 'all' | 'dom' | 'metropole' | 'specific'
  specificTerritories?: string[]
  exemptionRate: number // 0-100, where 100 = full exemption
  conditions: string
  examples: string[]
}

/**
 * Documented tax exemptions and special regimes
 * Essential for understanding which essential goods have reduced fiscal burden
 */
export const TAX_EXEMPTIONS: TaxExemption[] = [
  // TVA EXEMPTIONS - Essential goods
  {
    id: 'tva_produits_premiere_necessite',
    taxType: 'tva',
    category: 'Produits de première nécessité',
    description: 'Taux réduits de TVA pour les produits alimentaires essentiels',
    beneficiaries: 'Consommateurs de produits de base (pain, lait, fruits, légumes, etc.)',
    legalBasis: 'Code général des impôts - Article 278-0 bis et suivants',
    territoryApplicability: 'all',
    exemptionRate: 72.5, // 5.5% au lieu de 20% = réduction de 72.5%
    conditions: 'Produits non transformés ou transformation minimale. Liste précise définie par la loi.',
    examples: [
      'Pain et produits de boulangerie de base',
      'Lait et produits laitiers frais',
      'Fruits et légumes frais',
      'Viandes, poissons non préparés',
      'Œufs',
    ],
  },
  {
    id: 'tva_medicaments',
    taxType: 'tva',
    category: 'Médicaments remboursables',
    description: 'TVA à taux super réduit pour les médicaments remboursés par la Sécurité sociale',
    beneficiaries: 'Patients avec prescription médicale',
    legalBasis: 'Code général des impôts - Article 281 quater',
    territoryApplicability: 'all',
    exemptionRate: 89.5, // 2.1% au lieu de 20%
    conditions: 'Médicaments remboursables inscrits sur la liste de la Sécurité sociale',
    examples: [
      'Médicaments sur prescription',
      'Médicaments génériques remboursables',
      'Certains dispositifs médicaux',
    ],
  },
  {
    id: 'tva_livres',
    taxType: 'tva',
    category: 'Livres et presse',
    description: 'Taux réduit pour favoriser l\'accès à la culture et à l\'information',
    beneficiaries: 'Lecteurs et étudiants',
    legalBasis: 'Code général des impôts - Article 278-0 bis A',
    territoryApplicability: 'all',
    exemptionRate: 72.5, // 5.5% au lieu de 20%
    conditions: 'Livres imprimés et numériques, presse d\'information',
    examples: [
      'Livres scolaires et universitaires',
      'Romans, essais, bandes dessinées',
      'Presse quotidienne et magazines d\'actualité',
    ],
  },

  // OCTROI DE MER EXEMPTIONS - Local production protection
  {
    id: 'octroi_production_locale',
    taxType: 'octroi_de_mer',
    category: 'Production locale',
    description: 'Exonération ou taux réduit pour les produits fabriqués localement dans les DOM',
    beneficiaries: 'Producteurs locaux ultramarins et consommateurs de produits locaux',
    legalBasis: 'Code général des impôts - Annexe IV, Articles 1er à 10. Loi du 2 juillet 2004',
    territoryApplicability: 'dom',
    exemptionRate: 100, // Exonération totale possible
    conditions: 'Produit fabriqué localement avec un pourcentage minimum de valeur ajoutée locale (généralement 50%)',
    examples: [
      'Rhum agricole produit en Martinique',
      'Fruits et légumes cultivés localement',
      'Produits transformés localement (jus, confitures)',
      'Artisanat local',
    ],
  },
  {
    id: 'octroi_premiere_necessite',
    taxType: 'octroi_de_mer',
    category: 'Produits de première nécessité',
    description: 'Taux réduit ou exonération pour les produits essentiels importés',
    beneficiaries: 'Population générale pour les biens essentiels',
    legalBasis: 'Délibérations des collectivités territoriales DOM',
    territoryApplicability: 'dom',
    exemptionRate: 100, // Peut être total
    conditions: 'Décision de chaque collectivité. Liste variable selon territoire.',
    examples: [
      'Riz, pâtes, farine',
      'Lait en poudre',
      'Médicaments essentiels',
      'Produits d\'hygiène de base',
    ],
  },

  // DROITS DE DOUANE EXEMPTIONS
  {
    id: 'douane_origine_ue',
    taxType: 'droits_douane',
    category: 'Origine Union Européenne',
    description: 'Exemption totale pour les produits originaires de l\'UE',
    beneficiaries: 'Tous les consommateurs pour produits UE',
    legalBasis: 'Traité sur le fonctionnement de l\'Union européenne (TFUE)',
    territoryApplicability: 'all',
    exemptionRate: 100,
    conditions: 'Le produit doit être originaire d\'un État membre de l\'UE ou avoir été mis en libre pratique dans l\'UE',
    examples: [
      'Tous produits fabriqués en France métropolitaine',
      'Produits fabriqués en Allemagne, Italie, Espagne, etc.',
      'Produits en libre circulation dans l\'UE',
    ],
  },
  {
    id: 'douane_accords_commerciaux',
    taxType: 'droits_douane',
    category: 'Accords commerciaux préférentiels',
    description: 'Réduction ou suppression des droits pour les pays ayant des accords avec l\'UE',
    beneficiaries: 'Consommateurs de produits des pays partenaires',
    legalBasis: 'Accords commerciaux bilatéraux et multilatéraux de l\'UE',
    territoryApplicability: 'all',
    exemptionRate: 0, // Variable selon accord
    conditions: 'Certificat d\'origine requis. Conditions spécifiques à chaque accord.',
    examples: [
      'Certains produits du Canada (CETA)',
      'Produits de pays ACP (Afrique, Caraïbes, Pacifique)',
      'Produits couverts par accords de partenariat économique',
    ],
  },

  // TAXE ALCOOL - DOM RUM SPECIAL REGIME
  {
    id: 'alcool_rhum_traditionnel_dom',
    taxType: 'taxe_alcool',
    category: 'Rhum traditionnel des DOM',
    description: 'Régime fiscal favorable pour le rhum produit traditionnellement dans les DOM',
    beneficiaries: 'Producteurs de rhum des DOM et filière canne à sucre locale',
    legalBasis: 'Code général des impôts - Article 403. Programme POSEI (UE)',
    territoryApplicability: 'specific',
    specificTerritories: ['Martinique', 'Guadeloupe', 'Guyane', 'La Réunion'],
    exemptionRate: 50, // Jusqu\'à 50% de réduction
    conditions: 'Contingents annuels fixés. Rhum produit traditionnellement (rhum agricole ou traditionnel de sucrerie). Respect des normes de production.',
    examples: [
      'Rhum agricole AOC Martinique',
      'Rhum traditionnel de Guadeloupe',
      'Dans la limite des contingents fixés annuellement par l\'UE',
    ],
  },
  {
    id: 'alcool_petits_producteurs',
    taxType: 'taxe_alcool',
    category: 'Petits producteurs indépendants',
    description: 'Taux réduit pour les petites distilleries et brasseries',
    beneficiaries: 'Micro-distilleries, brasseries artisanales',
    legalBasis: 'Code général des impôts - Articles 317 et suivants. Directive UE 92/83/CEE',
    territoryApplicability: 'all',
    exemptionRate: 50, // Jusqu\'à 50% de réduction
    conditions: 'Production annuelle inférieure à certains seuils. Indépendance juridique et économique.',
    examples: [
      'Brasseries artisanales < 200 000 hl/an',
      'Distilleries < 10 hl alcool pur/an',
      'Bouilleurs de cru (régime spécial)',
    ],
  },
]

/**
 * Get exemptions for a specific tax type
 */
export function getExemptionsByTaxType(
  taxType: TaxExemption['taxType']
): TaxExemption[] {
  return TAX_EXEMPTIONS.filter((exemption) => exemption.taxType === taxType)
}

/**
 * Get exemptions applicable to a specific territory
 */
export function getExemptionsByTerritory(
  territoryCode: string
): TaxExemption[] {
  return TAX_EXEMPTIONS.filter((exemption) => {
    if (exemption.territoryApplicability === 'all') return true
    if (exemption.territoryApplicability === 'dom' && territoryCode.startsWith('FR-97')) return true
    if (exemption.territoryApplicability === 'metropole' && territoryCode === 'FR-MET') return true
    if (exemption.territoryApplicability === 'specific' && exemption.specificTerritories) {
      return exemption.specificTerritories.some(t => territoryCode.includes(t))
    }
    return false
  })
}

/**
 * Check if a product category has exemptions
 */
export function hasExemptions(category: string): boolean {
  return TAX_EXEMPTIONS.some((exemption) =>
    exemption.category.toLowerCase().includes(category.toLowerCase())
  )
}

/**
 * Get all exemption categories
 */
export function getAllExemptionCategories(): string[] {
  return [...new Set(TAX_EXEMPTIONS.map((e) => e.category))]
}
