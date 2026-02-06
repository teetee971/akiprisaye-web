/**
 * Base de données d'ingrédients cosmétiques officiels
 * 
 * Sources: CosIng (EU Cosmetic Ingredients Database), ECHA, ANSES
 * Règlement CE 1223/2009
 * 
 * Cette base contient uniquement des ingrédients réels avec leurs données officielles.
 * Aucune donnée fictive.
 */

/**
 * Ingrédients cosmétiques communs avec données officielles
 * Source principale: CosIng Database (Commission Européenne)
 */
export const OFFICIAL_INGREDIENTS = {
  // Eau et solvants
  'AQUA': {
    inciName: 'AQUA',
    commonName: 'Eau',
    casNumber: '7732-18-5',
    einecs: '231-791-2',
    function: ['SOLVENT'],
    riskLevel: 'LOW',
    sources: [
      {
        name: 'CosIng',
        url: 'https://ec.europa.eu/growth/tools-databases/cosing/index.cfm?fuseaction=search.details_v2&id=75790',
        type: 'COSING',
      },
    ],
  },
  'WATER': {
    inciName: 'WATER',
    commonName: 'Eau',
    casNumber: '7732-18-5',
    einecs: '231-791-2',
    function: ['SOLVENT'],
    riskLevel: 'LOW',
    sources: [
      {
        name: 'CosIng',
        url: 'https://ec.europa.eu/growth/tools-databases/cosing/index.cfm?fuseaction=search.details_v2&id=75790',
        type: 'COSING',
      },
    ],
  },

  // Glycérine
  'GLYCERIN': {
    inciName: 'GLYCERIN',
    commonName: 'Glycérine',
    casNumber: '56-81-5',
    einecs: '200-289-5',
    function: ['HUMECTANT', 'SKIN_CONDITIONING', 'SOLVENT'],
    riskLevel: 'LOW',
    sources: [
      {
        name: 'CosIng',
        url: 'https://ec.europa.eu/growth/tools-databases/cosing/index.cfm?fuseaction=search.details_v2&id=34103',
        type: 'COSING',
      },
    ],
  },

  // Conservateurs
  'PHENOXYETHANOL': {
    inciName: 'PHENOXYETHANOL',
    commonName: 'Phénoxyéthanol',
    casNumber: '122-99-6',
    einecs: '204-589-7',
    function: ['PRESERVATIVE'],
    riskLevel: 'MODERATE',
    restrictions: 'Concentration maximale: 1% (Annexe V, Règlement CE 1223/2009)',
    sources: [
      {
        name: 'CosIng',
        url: 'https://ec.europa.eu/growth/tools-databases/cosing/index.cfm?fuseaction=search.details_v2&id=56052',
        type: 'COSING',
      },
      {
        name: 'Règlement CE 1223/2009 - Annexe V',
        url: 'https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32009R1223',
        type: 'EU_REGULATION',
      },
    ],
    regulatoryReferences: ['Annexe V - Conservateurs autorisés'],
  },

  'METHYLPARABEN': {
    inciName: 'METHYLPARABEN',
    commonName: 'Méthylparabène',
    casNumber: '99-76-3',
    einecs: '202-785-7',
    function: ['PRESERVATIVE'],
    riskLevel: 'MODERATE',
    restrictions: 'Concentration maximale: 0,4% (seul), 0,8% (mélange de parabènes) - Annexe V',
    sources: [
      {
        name: 'CosIng',
        url: 'https://ec.europa.eu/growth/tools-databases/cosing/index.cfm?fuseaction=search.details_v2&id=75148',
        type: 'COSING',
      },
      {
        name: 'Règlement CE 1223/2009 - Annexe V',
        url: 'https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32009R1223',
        type: 'EU_REGULATION',
      },
    ],
    regulatoryReferences: ['Annexe V - Conservateurs autorisés'],
  },

  'PROPYLPARABEN': {
    inciName: 'PROPYLPARABEN',
    commonName: 'Propylparabène',
    casNumber: '94-13-3',
    einecs: '202-307-7',
    function: ['PRESERVATIVE'],
    riskLevel: 'MODERATE',
    restrictions: 'Concentration maximale: 0,4% (seul), 0,8% (mélange de parabènes) - Annexe V',
    sources: [
      {
        name: 'CosIng',
        url: 'https://ec.europa.eu/growth/tools-databases/cosing/index.cfm?fuseaction=search.details_v2&id=58166',
        type: 'COSING',
      },
      {
        name: 'Règlement CE 1223/2009 - Annexe V',
        url: 'https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32009R1223',
        type: 'EU_REGULATION',
      },
    ],
    regulatoryReferences: ['Annexe V - Conservateurs autorisés'],
  },

  // Filtres UV
  'TITANIUM DIOXIDE': {
    inciName: 'TITANIUM DIOXIDE',
    commonName: 'Dioxyde de titane',
    casNumber: '13463-67-7',
    einecs: '236-675-5',
    function: ['UV_FILTER', 'COLORANT', 'OPACIFYING'],
    riskLevel: 'LOW',
    restrictions: 'Autorisé comme filtre UV (Annexe VI) et colorant (Annexe IV)',
    sources: [
      {
        name: 'CosIng',
        url: 'https://ec.europa.eu/growth/tools-databases/cosing/index.cfm?fuseaction=search.details_v2&id=75246',
        type: 'COSING',
      },
      {
        name: 'Règlement CE 1223/2009 - Annexe VI',
        url: 'https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32009R1223',
        type: 'EU_REGULATION',
      },
    ],
    regulatoryReferences: ['Annexe VI - Filtres UV autorisés', 'Annexe IV - Colorants autorisés'],
  },

  'ZINC OXIDE': {
    inciName: 'ZINC OXIDE',
    commonName: 'Oxyde de zinc',
    casNumber: '1314-13-2',
    einecs: '215-222-5',
    function: ['UV_FILTER', 'COLORANT', 'BULKING'],
    riskLevel: 'LOW',
    restrictions: 'Autorisé comme filtre UV (Annexe VI)',
    sources: [
      {
        name: 'CosIng',
        url: 'https://ec.europa.eu/growth/tools-databases/cosing/index.cfm?fuseaction=search.details_v2&id=81880',
        type: 'COSING',
      },
      {
        name: 'Règlement CE 1223/2009 - Annexe VI',
        url: 'https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32009R1223',
        type: 'EU_REGULATION',
      },
    ],
    regulatoryReferences: ['Annexe VI - Filtres UV autorisés'],
  },

  'BUTYL METHOXYDIBENZOYLMETHANE': {
    inciName: 'BUTYL METHOXYDIBENZOYLMETHANE',
    commonName: 'Avobenzone',
    casNumber: '70356-09-1',
    einecs: '274-581-6',
    function: ['UV_FILTER'],
    riskLevel: 'MODERATE',
    restrictions: 'Concentration maximale: 5% - Annexe VI',
    sources: [
      {
        name: 'CosIng',
        url: 'https://ec.europa.eu/growth/tools-databases/cosing/index.cfm?fuseaction=search.details_v2&id=75695',
        type: 'COSING',
      },
      {
        name: 'Règlement CE 1223/2009 - Annexe VI',
        url: 'https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32009R1223',
        type: 'EU_REGULATION',
      },
    ],
    regulatoryReferences: ['Annexe VI - Filtres UV autorisés'],
  },

  // Émollients
  'CETEARYL ALCOHOL': {
    inciName: 'CETEARYL ALCOHOL',
    commonName: 'Alcool cétéarylique',
    casNumber: '67762-27-0',
    einecs: '267-008-6',
    function: ['EMOLLIENT', 'EMULSIFYING', 'EMULSION_STABILISING', 'VISCOSITY_CONTROLLING'],
    riskLevel: 'LOW',
    sources: [
      {
        name: 'CosIng',
        url: 'https://ec.europa.eu/growth/tools-databases/cosing/index.cfm?fuseaction=search.details_v2&id=74969',
        type: 'COSING',
      },
    ],
  },

  'CAPRYLIC/CAPRIC TRIGLYCERIDE': {
    inciName: 'CAPRYLIC/CAPRIC TRIGLYCERIDE',
    commonName: 'Triglycérides caprylique/caprique',
    casNumber: '73398-61-5',
    einecs: '277-452-2',
    function: ['EMOLLIENT', 'SOLVENT'],
    riskLevel: 'LOW',
    sources: [
      {
        name: 'CosIng',
        url: 'https://ec.europa.eu/growth/tools-databases/cosing/index.cfm?fuseaction=search.details_v2&id=75238',
        type: 'COSING',
      },
    ],
  },

  // Émulsifiants
  'CETEARETH-20': {
    inciName: 'CETEARETH-20',
    commonName: 'Cétéareth-20',
    casNumber: '68439-49-6',
    einecs: '500-212-8',
    function: ['EMULSIFYING', 'SURFACTANT'],
    riskLevel: 'LOW',
    sources: [
      {
        name: 'CosIng',
        url: 'https://ec.europa.eu/growth/tools-databases/cosing/index.cfm?fuseaction=search.details_v2&id=74964',
        type: 'COSING',
      },
    ],
  },

  'POLYSORBATE 20': {
    inciName: 'POLYSORBATE 20',
    commonName: 'Polysorbate 20',
    casNumber: '9005-64-5',
    einecs: '500-018-3',
    function: ['EMULSIFYING', 'SURFACTANT'],
    riskLevel: 'LOW',
    sources: [
      {
        name: 'CosIng',
        url: 'https://ec.europa.eu/growth/tools-databases/cosing/index.cfm?fuseaction=search.details_v2&id=57600',
        type: 'COSING',
      },
    ],
  },

  // Actifs
  'TOCOPHEROL': {
    inciName: 'TOCOPHEROL',
    commonName: 'Vitamine E',
    casNumber: '59-02-9',
    einecs: '200-412-2',
    function: ['ANTIOXIDANT', 'SKIN_CONDITIONING'],
    riskLevel: 'LOW',
    sources: [
      {
        name: 'CosIng',
        url: 'https://ec.europa.eu/growth/tools-databases/cosing/index.cfm?fuseaction=search.details_v2&id=75251',
        type: 'COSING',
      },
    ],
  },

  'PANTHENOL': {
    inciName: 'PANTHENOL',
    commonName: 'Panthénol (Provitamine B5)',
    casNumber: '16485-10-2',
    einecs: '240-540-6',
    function: ['HUMECTANT', 'SKIN_CONDITIONING'],
    riskLevel: 'LOW',
    sources: [
      {
        name: 'CosIng',
        url: 'https://ec.europa.eu/growth/tools-databases/cosing/index.cfm?fuseaction=search.details_v2&id=56014',
        type: 'COSING',
      },
    ],
  },

  'NIACINAMIDE': {
    inciName: 'NIACINAMIDE',
    commonName: 'Niacinamide (Vitamine B3)',
    casNumber: '98-92-0',
    einecs: '202-713-4',
    function: ['SKIN_CONDITIONING'],
    riskLevel: 'LOW',
    sources: [
      {
        name: 'CosIng',
        url: 'https://ec.europa.eu/growth/tools-databases/cosing/index.cfm?fuseaction=search.details_v2&id=55641',
        type: 'COSING',
      },
    ],
  },

  'HYALURONIC ACID': {
    inciName: 'HYALURONIC ACID',
    commonName: 'Acide hyaluronique',
    casNumber: '9004-61-9',
    einecs: '618-620-0',
    function: ['HUMECTANT', 'SKIN_CONDITIONING'],
    riskLevel: 'LOW',
    sources: [
      {
        name: 'CosIng',
        url: 'https://ec.europa.eu/growth/tools-databases/cosing/index.cfm?fuseaction=search.details_v2&id=34909',
        type: 'COSING',
      },
    ],
  },

  // Substances à surveiller
  'SODIUM LAURYL SULFATE': {
    inciName: 'SODIUM LAURYL SULFATE',
    commonName: 'Laurylsulfate de sodium',
    casNumber: '151-21-3',
    einecs: '205-788-1',
    function: ['SURFACTANT', 'CLEANSING', 'FOAMING'],
    riskLevel: 'MODERATE',
    restrictions: 'Peut être irritant pour certaines peaux sensibles',
    sources: [
      {
        name: 'CosIng',
        url: 'https://ec.europa.eu/growth/tools-databases/cosing/index.cfm?fuseaction=search.details_v2&id=74994',
        type: 'COSING',
      },
    ],
  },

  'PARFUM': {
    inciName: 'PARFUM',
    commonName: 'Parfum',
    casNumber: null,
    einecs: null,
    function: ['FRAGRANCE'],
    riskLevel: 'MODERATE',
    restrictions: 'Peut contenir des allergènes. Les 26 allergènes doivent être indiqués séparément selon le Règlement CE 1223/2009',
    sources: [
      {
        name: 'CosIng',
        url: 'https://ec.europa.eu/growth/tools-databases/cosing/',
        type: 'COSING',
      },
      {
        name: 'Règlement CE 1223/2009',
        url: 'https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32009R1223',
        type: 'EU_REGULATION',
      },
    ],
    regulatoryReferences: ['Article 19 - Étiquetage des allergènes'],
  },

  'FRAGRANCE': {
    inciName: 'FRAGRANCE',
    commonName: 'Parfum',
    casNumber: null,
    einecs: null,
    function: ['FRAGRANCE'],
    riskLevel: 'MODERATE',
    restrictions: 'Peut contenir des allergènes. Les 26 allergènes doivent être indiqués séparément selon le Règlement CE 1223/2009',
    sources: [
      {
        name: 'CosIng',
        url: 'https://ec.europa.eu/growth/tools-databases/cosing/',
        type: 'COSING',
      },
      {
        name: 'Règlement CE 1223/2009',
        url: 'https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32009R1223',
        type: 'EU_REGULATION',
      },
    ],
    regulatoryReferences: ['Article 19 - Étiquetage des allergènes'],
  },

  // Exemples de substances interdites (Annexe II)
  'FORMALDEHYDE': {
    inciName: 'FORMALDEHYDE',
    commonName: 'Formaldéhyde',
    casNumber: '50-00-0',
    einecs: '200-001-8',
    function: ['PRESERVATIVE'],
    riskLevel: 'RESTRICTED',
    restrictions: 'Concentration maximale: 0,2% (0,1% pour produits bucco-dentaires). Libérateurs de formaldéhyde autorisés avec restrictions - Annexe V',
    sources: [
      {
        name: 'CosIng',
        url: 'https://ec.europa.eu/growth/tools-databases/cosing/index.cfm?fuseaction=search.details_v2&id=33213',
        type: 'COSING',
      },
      {
        name: 'Règlement CE 1223/2009 - Annexe V',
        url: 'https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32009R1223',
        type: 'EU_REGULATION',
      },
    ],
    regulatoryReferences: ['Annexe V - Conservateurs autorisés avec restrictions'],
  },
};

/**
 * Catégories de produits cosmétiques
 */
export const COSMETIC_CATEGORIES = [
  'Crème visage',
  'Crème corps',
  'Shampoing',
  'Après-shampoing',
  'Gel douche',
  'Savon',
  'Déodorant',
  'Dentifrice',
  'Bain de bouche',
  'Maquillage',
  'Vernis à ongles',
  'Crème solaire',
  'Après-rasage',
  'Parfum',
  'Eau de toilette',
  'Masque visage',
  'Sérum',
  'Démaquillant',
  'Autre',
];
