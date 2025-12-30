/**
 * Official Database Constants
 * Sources officielles pour l'évaluation cosmétique
 * 
 * Toutes les données proviennent de bases publiques officielles:
 * - CosIng (EU Cosmetic Ingredients Database)
 * - ANSES (Agence nationale de sécurité sanitaire)
 * - ECHA (European Chemicals Agency)
 * - Règlement CE 1223/2009
 */

export const OFFICIAL_DATABASES = {
  COSING: {
    name: 'CosIng - EU Cosmetic Ingredients Database',
    url: 'https://ec.europa.eu/growth/tools-databases/cosing/',
    description: 'Base de données officielle de la Commission Européenne des ingrédients cosmétiques',
  },
  ANSES: {
    name: 'ANSES - Agence nationale de sécurité sanitaire',
    url: 'https://www.anses.fr/',
    description: 'Agence française de sécurité sanitaire de l\'alimentation, de l\'environnement et du travail',
  },
  ECHA: {
    name: 'ECHA - European Chemicals Agency',
    url: 'https://echa.europa.eu/',
    description: 'Agence européenne des produits chimiques',
  },
  EU_REGULATION: {
    name: 'Règlement CE 1223/2009',
    url: 'https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32009R1223',
    description: 'Règlement européen relatif aux produits cosmétiques',
  },
};

/**
 * Références réglementaires officielles
 */
export const REGULATORY_REFERENCES = {
  MAIN_REGULATION: {
    name: 'Règlement (CE) n° 1223/2009',
    description: 'Règlement du Parlement européen et du Conseil relatif aux produits cosmétiques',
    url: 'https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32009R1223',
  },
  ANNEX_II: {
    name: 'Annexe II - Substances interdites',
    description: 'Liste des substances interdites dans les produits cosmétiques',
    url: 'https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32009R1223#d1e32-72-1',
  },
  ANNEX_III: {
    name: 'Annexe III - Substances soumises à restrictions',
    description: 'Liste des substances que les produits cosmétiques ne peuvent contenir en dehors des restrictions et conditions prévues',
    url: 'https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32009R1223#d1e32-76-1',
  },
  ANNEX_IV: {
    name: 'Annexe IV - Colorants autorisés',
    description: 'Liste des colorants autorisés dans les produits cosmétiques',
    url: 'https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32009R1223#d1e32-80-1',
  },
  ANNEX_V: {
    name: 'Annexe V - Conservateurs autorisés',
    description: 'Liste des conservateurs autorisés dans les produits cosmétiques',
    url: 'https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32009R1223#d1e32-84-1',
  },
  ANNEX_VI: {
    name: 'Annexe VI - Filtres UV autorisés',
    description: 'Liste des filtres ultraviolets autorisés dans les produits cosmétiques',
    url: 'https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32009R1223#d1e32-88-1',
  },
};

/**
 * Disclaimer légal obligatoire
 */
export const LEGAL_DISCLAIMER = `
AVERTISSEMENT IMPORTANT:

Cette évaluation est basée uniquement sur des données publiques officielles (CosIng, ANSES, ECHA) 
et le Règlement CE 1223/2009. Elle a un but informatif et éducatif.

Cette évaluation NE CONSTITUE PAS:
- Un avis médical
- Une recommandation thérapeutique
- Une garantie d'innocuité absolue
- Une certification de conformité

En cas de doute, consultez un professionnel de santé qualifié.
Les personnes allergiques ou sensibles doivent toujours vérifier la liste complète des ingrédients.

Données officielles uniquement - Aucune donnée fictive.
`;

/**
 * Catégories de fonctions cosmétiques (selon CosIng)
 */
export const COSMETIC_FUNCTIONS = {
  ABRASIVE: 'Abrasif',
  ABSORBENT: 'Absorbant',
  ANTICAKING: 'Antiagglomérant',
  ANTICORROSIVE: 'Anticorrosif',
  ANTIDANDRUFF: 'Antipelliculaire',
  ANTIFOAMING: 'Antimousse',
  ANTIMICROBIAL: 'Antimicrobien',
  ANTIOXIDANT: 'Antioxydant',
  ANTIPERSPIRANT: 'Antitranspirant',
  ANTIPLAQUE: 'Antiplaque',
  ANTISEBORRHOEIC: 'Antiséborréique',
  ANTISTATIC: 'Antistatique',
  ASTRINGENT: 'Astringent',
  BINDING: 'Liant',
  BLEACHING: 'Blanchissant',
  BUFFERING: 'Tampon',
  BULKING: 'Agent de charge',
  CHELATING: 'Chélateur',
  CLEANSING: 'Nettoyant',
  COLORANT: 'Colorant',
  DEODORANT: 'Déodorant',
  DEPILATORY: 'Dépilatoire',
  EMOLLIENT: 'Émollient',
  EMULSIFYING: 'Émulsifiant',
  EMULSION_STABILISING: 'Stabilisant d\'émulsion',
  FILM_FORMING: 'Filmogène',
  FOAMING: 'Moussant',
  FRAGRANCE: 'Parfum',
  HUMECTANT: 'Humectant',
  OPACIFYING: 'Opacifiant',
  OXIDISING: 'Oxydant',
  PRESERVATIVE: 'Conservateur',
  REDUCING: 'Réducteur',
  SKIN_CONDITIONING: 'Agent d\'entretien de la peau',
  SKIN_PROTECTING: 'Protecteur cutané',
  SMOOTHING: 'Lissant',
  SOLVENT: 'Solvant',
  SURFACTANT: 'Agent de surface',
  UV_ABSORBER: 'Filtre UV',
  UV_FILTER: 'Filtre UV',
  VISCOSITY_CONTROLLING: 'Contrôle de la viscosité',
};
