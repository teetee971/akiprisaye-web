// src/data/taxes/taxDefinitions.ts
/**
 * Pedagogical definitions of taxes and indirect levies
 * All definitions are neutral, institutional, and sourced
 */

export interface TaxDefinition {
  id: string;
  name: string;
  shortDescription: string;
  officialRole: string;
  legalFramework: string;
  knownLimitations: string;
  pedagogicalExample: string;
}

/**
 * Tax definitions with pedagogical content
 * Each tax has a neutral explanation of its purpose and legal framework
 */
export const TAX_DEFINITIONS: Record<string, TaxDefinition> = {
  tva: {
    id: 'tva',
    name: 'TVA (Taxe sur la Valeur Ajoutée)',
    shortDescription:
      'Taxe indirecte sur la consommation appliquée sur la plupart des biens et services',
    officialRole:
      "Principale ressource fiscale de l'État français, finance les services publics et les infrastructures",
    legalFramework:
      'Code général des impôts - Articles 256 et suivants. Directive européenne 2006/112/CE',
    knownLimitations:
      'Les taux de TVA diffèrent entre la métropole et les territoires ultramarins. Certains produits bénéficient de taux réduits.',
    pedagogicalExample:
      "Un produit vendu 10€ HT avec une TVA à 20% coûtera 12€ TTC. La TVA de 2€ est collectée par le vendeur pour le compte de l'État.",
  },
  octroi_de_mer: {
    id: 'octroi_de_mer',
    name: 'Octroi de Mer',
    shortDescription:
      'Taxe locale appliquée dans les DOM sur les produits importés et certains produits locaux',
    officialRole:
      'Finance les collectivités territoriales ultramarines et protège la production locale en favorisant les produits fabriqués localement',
    legalFramework:
      "Code général des impôts - Articles 1er à 10 de l'annexe IV. Loi du 2 juillet 2004",
    knownLimitations:
      'Son impact varie significativement selon les territoires (Guadeloupe, Martinique, Guyane, La Réunion, Mayotte) et les catégories de produits. Certains produits de première nécessité peuvent être exonérés.',
    pedagogicalExample:
      "L'octroi de mer peut représenter entre 0% et 30% du prix selon le produit et le territoire. Un produit importé peut être taxé à 15%, tandis qu'un produit local similaire sera exonéré ou taxé à un taux réduit.",
  },
  octroi_de_mer_regional: {
    id: 'octroi_de_mer_regional',
    name: 'Octroi de Mer Régional (OMR)',
    shortDescription: "Taxe additionnelle à l'octroi de mer, affectée aux régions ultramarines",
    officialRole:
      'Finance les budgets régionaux dans les DOM pour les infrastructures et le développement économique local',
    legalFramework:
      "Code général des impôts - Articles 1er à 10 de l'annexe IV. Créé par la loi du 2 juillet 2004",
    knownLimitations:
      "S'ajoute à l'octroi de mer classique. Les taux varient selon les régions et les produits.",
    pedagogicalExample:
      "L'OMR s'ajoute à l'octroi de mer. Si l'octroi de mer est de 10% et l'OMR de 2,5%, le produit subira une taxation totale de 12,5% au titre de ces deux taxes.",
  },
  taxe_speciale_consommation: {
    id: 'taxe_speciale_consommation',
    name: 'Taxe Spéciale de Consommation',
    shortDescription: 'Taxes spécifiques sur certains produits (carburants, alcools, tabacs)',
    officialRole:
      'Finance les collectivités locales et régule la consommation de produits spécifiques pour des raisons de santé publique ou environnementales',
    legalFramework:
      'Code général des impôts - Articles divers selon les produits. Directives européennes sur les accises',
    knownLimitations:
      'Les montants varient fortement selon le type de produit et le territoire. Ces taxes peuvent représenter une part importante du prix final.',
    pedagogicalExample:
      "Sur un litre d'essence à 1,50€, la taxe spéciale de consommation peut représenter 0,60€, soit 40% du prix de vente.",
  },
  droits_douane: {
    id: 'droits_douane',
    name: 'Droits de Douane',
    shortDescription:
      "Taxes perçues sur les marchandises importées depuis l'extérieur de l'Union Européenne",
    officialRole:
      "Protègent l'économie européenne et génèrent des recettes pour le budget de l'UE. Particulièrement pertinents pour les DOM éloignés des circuits d'approvisionnement européens.",
    legalFramework:
      "Code des douanes de l'Union - Règlement (UE) n° 952/2013. Tarif douanier commun européen",
    knownLimitations:
      "Les taux varient selon l'origine des produits et leur catégorie. Des accords commerciaux peuvent réduire ou supprimer ces droits. L'application peut différer selon les territoires ultramarins.",
    pedagogicalExample:
      "Un produit électronique importé de Chine peut être soumis à des droits de douane de 5% à 14% selon sa catégorie, auxquels s'ajoutent ensuite la TVA et l'octroi de mer.",
  },
  tgap: {
    id: 'tgap',
    name: 'TGAP (Taxe Générale sur les Activités Polluantes)',
    shortDescription:
      'Taxe environnementale sur les activités polluantes (déchets, émissions, carburants)',
    officialRole:
      'Incite à réduire les pollutions et finance des actions environnementales. Appliquée notamment sur la mise en décharge de déchets et les émissions polluantes.',
    legalFramework: 'Code des douanes - Articles 266 sexies à 266 quaterdecies. Loi de finances',
    knownLimitations:
      "Son application dans les DOM peut différer de la métropole en raison des spécificités locales de gestion des déchets et d'énergie. Les taux peuvent être adaptés aux réalités territoriales.",
    pedagogicalExample:
      "La TGAP sur les déchets enfouis peut représenter 50€ à 65€ par tonne, ce qui se répercute sur les coûts de produits générant beaucoup d'emballages.",
  },
  contribution_audiovisuel: {
    id: 'contribution_audiovisuel',
    name: "Contribution à l'Audiovisuel Public",
    shortDescription:
      "Contribution au financement de l'audiovisuel public, intégrée dans certains équipements",
    officialRole:
      'Finance les chaînes de télévision et radio publiques (France Télévisions, Radio France, Arte, INA)',
    legalFramework:
      "Code général des impôts - Article 1605. Supprimée en métropole en 2022, maintenue sous d'autres formes dans certains DOM",
    knownLimitations:
      "Le mode de financement de l'audiovisuel public a évolué. Dans les DOM, des dispositifs spécifiques peuvent s'appliquer, notamment via France Télévisions et La 1ère.",
    pedagogicalExample:
      "Historiquement intégrée dans les factures d'électricité ou dans le prix de certains équipements audiovisuels, son montant était d'environ 138€/an.",
  },
  taxe_soda: {
    id: 'taxe_soda',
    name: 'Taxe sur les Boissons Sucrées',
    shortDescription: 'Taxe sur les boissons contenant des sucres ajoutés ou édulcorants',
    officialRole:
      "Objectif de santé publique visant à réduire la consommation de sucre et prévenir l'obésité et le diabète, problématiques importantes dans les DOM",
    legalFramework:
      'Code général des impôts - Article 1613 ter. Loi de financement de la Sécurité sociale',
    knownLimitations:
      "Le taux varie selon la teneur en sucre. Les boissons avec édulcorants sont également concernées. L'impact sanitaire dans les DOM justifie une attention particulière.",
    pedagogicalExample:
      'Une boisson sucrée peut supporter une taxe de 7,53€ par hectolitre si elle contient plus de 8g de sucres par litre, soit environ 0,08€ par litre.',
  },
  taxe_alcool: {
    id: 'taxe_alcool',
    name: "Droits d'Accises sur les Alcools",
    shortDescription: 'Taxes sur les boissons alcoolisées (vins, bières, spiritueux)',
    officialRole:
      'Double objectif de santé publique et de recettes fiscales. Les taux peuvent différer entre métropole et DOM.',
    legalFramework:
      'Code général des impôts - Articles 402 bis à 520 A. Directives européennes sur les accises',
    knownLimitations:
      "Les taux varient selon le type d'alcool et le degré. Les productions locales (rhum des DOM) peuvent bénéficier de régimes spécifiques. Certaines exonérations existent pour les petits producteurs.",
    pedagogicalExample:
      "Un litre de rhum à 40° peut supporter environ 15€ de droits d'accises, soit plus de 50% du prix final. Le rhum produit dans les DOM bénéficie d'exonérations partielles dans certains cas.",
  },
};

/**
 * Get tax definition by ID
 */
export function getTaxDefinition(taxId: string): TaxDefinition | undefined {
  return TAX_DEFINITIONS[taxId];
}

/**
 * Get all tax definitions as array
 */
export function getAllTaxDefinitions(): TaxDefinition[] {
  return Object.values(TAX_DEFINITIONS);
}
