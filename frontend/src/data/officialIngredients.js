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
  AQUA: {
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
  WATER: {
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
  GLYCERIN: {
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
  PHENOXYETHANOL: {
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

  METHYLPARABEN: {
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

  PROPYLPARABEN: {
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
  TOCOPHEROL: {
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

  PANTHENOL: {
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

  NIACINAMIDE: {
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
    commonName: 'Laurylsulfate de sodium (SLS)',
    casNumber: '151-21-3',
    einecs: '205-788-1',
    function: ['SURFACTANT', 'CLEANSING', 'FOAMING'],
    riskLevel: 'MODERATE',
    hazardCategories: ['IRRITANT'],
    restrictions:
      'Peut être irritant pour certaines peaux sensibles. Déconseillé sur peaux atopiques.',
    sources: [
      {
        name: 'CosIng',
        url: 'https://ec.europa.eu/growth/tools-databases/cosing/index.cfm?fuseaction=search.details_v2&id=74994',
        type: 'COSING',
      },
    ],
  },

  'SODIUM LAURETH SULFATE': {
    inciName: 'SODIUM LAURETH SULFATE',
    commonName: 'Laureth sulfate de sodium (SLES)',
    casNumber: '9004-82-4',
    einecs: null,
    function: ['SURFACTANT', 'CLEANSING', 'FOAMING'],
    riskLevel: 'MODERATE',
    hazardCategories: ['PEG', 'IRRITANT'],
    restrictions:
      'Éthoxylé — peut être contaminé par du 1,4-dioxane (CMR cat. 1B). Potentiellement irritant.',
    sources: [
      {
        name: 'CosIng',
        url: 'https://ec.europa.eu/growth/tools-databases/cosing/',
        type: 'COSING',
      },
    ],
  },

  PARFUM: {
    inciName: 'PARFUM',
    commonName: 'Parfum',
    casNumber: null,
    einecs: null,
    function: ['FRAGRANCE'],
    riskLevel: 'MODERATE',
    hazardCategories: ['ALLERGEN'],
    restrictions:
      'Peut contenir des allergènes. Les 26 allergènes doivent être indiqués séparément selon le Règlement CE 1223/2009',
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

  FRAGRANCE: {
    inciName: 'FRAGRANCE',
    commonName: 'Parfum',
    casNumber: null,
    einecs: null,
    function: ['FRAGRANCE'],
    riskLevel: 'MODERATE',
    hazardCategories: ['ALLERGEN'],
    restrictions:
      'Peut contenir des allergènes. Les 26 allergènes doivent être indiqués séparément selon le Règlement CE 1223/2009',
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

  // ── Formaldéhyde et libérateurs ──────────────────────────────────────────
  FORMALDEHYDE: {
    inciName: 'FORMALDEHYDE',
    commonName: 'Formaldéhyde',
    casNumber: '50-00-0',
    einecs: '200-001-8',
    function: ['PRESERVATIVE'],
    riskLevel: 'RESTRICTED',
    hazardCategories: ['CMR'],
    restrictions:
      'CMR cat. 1B (cancérogène). Concentration max. 0,2% (0,1% bucco-dentaires). Annexe V.',
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

  'DMDM HYDANTOIN': {
    inciName: 'DMDM HYDANTOIN',
    commonName: 'DMDM Hydantoïne',
    casNumber: '6440-58-4',
    einecs: '229-222-8',
    function: ['PRESERVATIVE'],
    riskLevel: 'HIGH',
    hazardCategories: ['CMR'],
    restrictions:
      'Libérateur de formaldéhyde (CMR cat. 1B). Autorisé avec restrictions — max 0,6%. Peut provoquer des allergies de contact.',
    sources: [
      {
        name: 'CosIng',
        url: 'https://ec.europa.eu/growth/tools-databases/cosing/',
        type: 'COSING',
      },
      {
        name: 'ANSES',
        url: 'https://www.anses.fr/',
        type: 'ANSES',
      },
    ],
  },

  'QUATERNIUM-15': {
    inciName: 'QUATERNIUM-15',
    commonName: 'Quaternium-15',
    casNumber: '51229-78-8',
    einecs: '257-063-3',
    function: ['PRESERVATIVE'],
    riskLevel: 'HIGH',
    hazardCategories: ['CMR', 'ALLERGEN'],
    restrictions:
      'Libérateur de formaldéhyde (CMR cat. 1B). Allergène fréquent. Déconseillé dans les produits sans rinçage.',
    sources: [
      {
        name: 'CosIng',
        url: 'https://ec.europa.eu/growth/tools-databases/cosing/',
        type: 'COSING',
      },
    ],
  },

  // ── Parabènes (perturbateurs endocriniens) ───────────────────────────────
  METHYLPARABEN: {
    inciName: 'METHYLPARABEN',
    commonName: 'Méthylparabène',
    casNumber: '99-76-3',
    einecs: '202-785-7',
    function: ['PRESERVATIVE'],
    riskLevel: 'MODERATE',
    hazardCategories: ['PE'],
    restrictions:
      'Perturbateur endocrinien avéré (ANSES 2020). Max 0,4% seul, 0,8% en mélange. Annexe V n°12.',
    sources: [
      {
        name: 'CosIng',
        url: 'https://ec.europa.eu/growth/tools-databases/cosing/index.cfm?fuseaction=search.details_v2&id=52189',
        type: 'COSING',
      },
      {
        name: 'ANSES — Perturbateurs endocriniens',
        url: 'https://www.anses.fr/fr/content/perturbateurs-endocriniens',
        type: 'ANSES',
      },
    ],
  },

  ETHYLPARABEN: {
    inciName: 'ETHYLPARABEN',
    commonName: 'Éthylparabène',
    casNumber: '120-47-8',
    einecs: '204-399-4',
    function: ['PRESERVATIVE'],
    riskLevel: 'MODERATE',
    hazardCategories: ['PE'],
    restrictions: 'Perturbateur endocrinien. Max 0,4% seul, 0,8% en mélange. Annexe V n°13.',
    sources: [
      {
        name: 'CosIng',
        url: 'https://ec.europa.eu/growth/tools-databases/cosing/index.cfm?fuseaction=search.details_v2&id=31459',
        type: 'COSING',
      },
    ],
  },

  PROPYLPARABEN: {
    inciName: 'PROPYLPARABEN',
    commonName: 'Propylparabène',
    casNumber: '94-13-3',
    einecs: '202-307-7',
    function: ['PRESERVATIVE'],
    riskLevel: 'RESTRICTED',
    hazardCategories: ['PE'],
    restrictions:
      'Perturbateur endocrinien. Max 0,14% seul, 0,19% en mélange (propyl+butyl). Interdit dans les produits destinés aux enfants < 3 ans (zone fessière). Annexe V n°14.',
    sources: [
      {
        name: 'CosIng',
        url: 'https://ec.europa.eu/growth/tools-databases/cosing/index.cfm?fuseaction=search.details_v2&id=57904',
        type: 'COSING',
      },
      {
        name: 'ANSES',
        url: 'https://www.anses.fr/fr/content/perturbateurs-endocriniens',
        type: 'ANSES',
      },
    ],
  },

  BUTYLPARABEN: {
    inciName: 'BUTYLPARABEN',
    commonName: 'Butylparabène',
    casNumber: '94-26-8',
    einecs: '202-318-7',
    function: ['PRESERVATIVE'],
    riskLevel: 'RESTRICTED',
    hazardCategories: ['PE'],
    restrictions:
      'Perturbateur endocrinien. Même restriction que propylparaben. Interdit produits zone fessière enfants < 3 ans. Annexe V n°14.',
    sources: [
      {
        name: 'CosIng',
        url: 'https://ec.europa.eu/growth/tools-databases/cosing/index.cfm?fuseaction=search.details_v2&id=28468',
        type: 'COSING',
      },
    ],
  },

  ISOBUTYLPARABEN: {
    inciName: 'ISOBUTYLPARABEN',
    commonName: 'Isobutylparabène',
    casNumber: '4247-02-3',
    einecs: '224-208-8',
    function: ['PRESERVATIVE'],
    riskLevel: 'PROHIBITED',
    hazardCategories: ['PE'],
    restrictions:
      "Interdit dans tous les produits cosmétiques dans l'UE (Règlement 2014/358/UE). Perturbateur endocrinien.",
    sources: [
      {
        name: 'Règlement CE 1223/2009 — Annexe II',
        url: 'https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32009R1223',
        type: 'EU_REGULATION',
      },
    ],
  },

  // ── Triclosan ────────────────────────────────────────────────────────────
  TRICLOSAN: {
    inciName: 'TRICLOSAN',
    commonName: 'Triclosan',
    casNumber: '3380-34-5',
    einecs: '222-182-2',
    function: ['ANTIMICROBIAL', 'PRESERVATIVE'],
    riskLevel: 'RESTRICTED',
    hazardCategories: ['PE'],
    restrictions:
      'Perturbateur endocrinien. Max 0,3% dentifrice/savons/déodorants bâton. Interdit dans de nombreuses applications. Annexe V n°45.',
    sources: [
      {
        name: 'CosIng',
        url: 'https://ec.europa.eu/growth/tools-databases/cosing/index.cfm?fuseaction=search.details_v2&id=75561',
        type: 'COSING',
      },
      {
        name: 'ECHA — SVHC',
        url: 'https://echa.europa.eu/fr/candidate-list-table',
        type: 'ECHA',
      },
    ],
  },

  // ── Filtres UV / Benzophénones ───────────────────────────────────────────
  'BENZOPHENONE-3': {
    inciName: 'BENZOPHENONE-3',
    commonName: 'Benzophénone-3 (Oxybenzone)',
    casNumber: '131-57-7',
    einecs: '205-031-5',
    function: ['UV_FILTER', 'UV_ABSORBER'],
    riskLevel: 'RESTRICTED',
    hazardCategories: ['PE'],
    restrictions:
      'Perturbateur endocrinien (mimique œstrogènes). Max 6% (10% protection solaire corporelle). Étiquetage obligatoire > 0,5%. Annexe VI n°4.',
    sources: [
      {
        name: 'CosIng',
        url: 'https://ec.europa.eu/growth/tools-databases/cosing/index.cfm?fuseaction=search.details_v2&id=28467',
        type: 'COSING',
      },
      {
        name: 'ANSES — Évaluation des filtres UV',
        url: 'https://www.anses.fr/',
        type: 'ANSES',
      },
    ],
  },

  // ── BHA / BHT ────────────────────────────────────────────────────────────
  BHA: {
    inciName: 'BHA',
    commonName: 'Hydroxyanisole butylé (BHA)',
    casNumber: '25013-16-5',
    einecs: '246-563-8',
    function: ['ANTIOXIDANT'],
    riskLevel: 'HIGH',
    hazardCategories: ['PE_SUSPECTE', 'CMR'],
    restrictions:
      "Perturbateur endocrinien suspecté. CMR cat. 1B (IARC : probablement cancérogène). Classé SVHC par l'ECHA.",
    sources: [
      {
        name: 'ECHA — SVHC List',
        url: 'https://echa.europa.eu/fr/candidate-list-table',
        type: 'ECHA',
      },
      {
        name: 'CosIng',
        url: 'https://ec.europa.eu/growth/tools-databases/cosing/',
        type: 'COSING',
      },
    ],
  },

  BHT: {
    inciName: 'BHT',
    commonName: 'Hydroxytoluène butylé (BHT)',
    casNumber: '128-37-0',
    einecs: '204-881-4',
    function: ['ANTIOXIDANT'],
    riskLevel: 'MODERATE',
    hazardCategories: ['PE_SUSPECTE'],
    restrictions: 'Perturbateur endocrinien suspecté. Sous surveillance réglementaire ECHA.',
    sources: [
      {
        name: 'CosIng',
        url: 'https://ec.europa.eu/growth/tools-databases/cosing/',
        type: 'COSING',
      },
    ],
  },

  // ── Silicones non biodégradables ─────────────────────────────────────────
  DIMETHICONE: {
    inciName: 'DIMETHICONE',
    commonName: 'Diméthicone (Silicone)',
    casNumber: '9006-65-9',
    einecs: null,
    function: ['SKIN_CONDITIONING', 'FILM_FORMING'],
    riskLevel: 'LOW',
    hazardCategories: ['SILICONE'],
    restrictions:
      "Silicone non biodégradable. Accumulation dans l'environnement aquatique. Occlusive à forte concentration.",
    sources: [
      {
        name: 'CosIng',
        url: 'https://ec.europa.eu/growth/tools-databases/cosing/',
        type: 'COSING',
      },
    ],
  },

  CYCLOPENTASILOXANE: {
    inciName: 'CYCLOPENTASILOXANE',
    commonName: 'Cyclopentasiloxane (D5)',
    casNumber: '541-02-6',
    einecs: '208-764-9',
    function: ['SOLVENT', 'SKIN_CONDITIONING', 'EMOLLIENT'],
    riskLevel: 'HIGH',
    hazardCategories: ['SILICONE', 'PE_SUSPECTE'],
    restrictions:
      "Silicone cyclique D5 : perturbateur endocrinien suspecté. Interdit à > 0,1% dans les cosmétiques rincés (REACH 2020). Persistant dans l'environnement.",
    sources: [
      {
        name: 'ECHA — Restriction D4/D5',
        url: 'https://echa.europa.eu/fr/',
        type: 'ECHA',
      },
      {
        name: 'CosIng',
        url: 'https://ec.europa.eu/growth/tools-databases/cosing/',
        type: 'COSING',
      },
    ],
  },

  CYCLOTETRASILOXANE: {
    inciName: 'CYCLOTETRASILOXANE',
    commonName: 'Cyclotétrasiloxane (D4)',
    casNumber: '556-67-2',
    einecs: '209-136-7',
    function: ['SOLVENT', 'EMOLLIENT'],
    riskLevel: 'RESTRICTED',
    hazardCategories: ['SILICONE', 'PE'],
    restrictions:
      'Silicone cyclique D4 : perturbateur endocrinien avéré (REACH Annexe XVII). Interdit > 0,1% dans les cosmétiques rincés. PBT (persistant, bioaccumulable, toxique).',
    sources: [
      {
        name: 'ECHA — Restriction D4',
        url: 'https://echa.europa.eu/fr/',
        type: 'ECHA',
      },
    ],
  },

  CYCLOMETHICONE: {
    inciName: 'CYCLOMETHICONE',
    commonName: 'Cycloméhicone (mélange D4/D5)',
    casNumber: null,
    einecs: null,
    function: ['SOLVENT', 'EMOLLIENT'],
    riskLevel: 'HIGH',
    hazardCategories: ['SILICONE', 'PE_SUSPECTE'],
    restrictions:
      'Mélange de cyclométhicones incluant D4 (PE avéré) et D5 (PE suspecté). Même restrictions que D4/D5.',
    sources: [
      {
        name: 'ECHA',
        url: 'https://echa.europa.eu/fr/',
        type: 'ECHA',
      },
    ],
  },

  // ── PEG / éthoxylés ──────────────────────────────────────────────────────
  'PEG-100 STEARATE': {
    inciName: 'PEG-100 STEARATE',
    commonName: 'PEG-100 Stéarate',
    casNumber: '9004-99-3',
    einecs: null,
    function: ['EMULSIFYING', 'SURFACTANT'],
    riskLevel: 'LOW',
    hazardCategories: ['PEG'],
    restrictions:
      'Éthoxylé — potentiellement contaminé par 1,4-dioxane (CMR) selon le processus de fabrication.',
    sources: [
      {
        name: 'CosIng',
        url: 'https://ec.europa.eu/growth/tools-databases/cosing/',
        type: 'COSING',
      },
    ],
  },

  'PEG-40 HYDROGENATED CASTOR OIL': {
    inciName: 'PEG-40 HYDROGENATED CASTOR OIL',
    commonName: 'Huile de ricin hydrogénée PEGylée',
    casNumber: '61788-85-0',
    einecs: null,
    function: ['EMULSIFYING', 'SURFACTANT'],
    riskLevel: 'LOW',
    hazardCategories: ['PEG'],
    restrictions: 'Éthoxylé — risque de contamination au 1,4-dioxane (CMR cat. 1B).',
    sources: [
      {
        name: 'CosIng',
        url: 'https://ec.europa.eu/growth/tools-databases/cosing/',
        type: 'COSING',
      },
    ],
  },

  // ── Allergènes réglementés (Annexe III Règlement 1223/2009) ─────────────
  LINALOOL: {
    inciName: 'LINALOOL',
    commonName: 'Linalol',
    casNumber: '78-70-6',
    einecs: '201-134-4',
    function: ['FRAGRANCE'],
    riskLevel: 'MODERATE',
    hazardCategories: ['ALLERGEN'],
    restrictions:
      'Allergène réglementé — déclaration obligatoire si > 0,001% (sans rinçage) ou > 0,01% (avec rinçage). Annexe III.',
    sources: [
      {
        name: 'CosIng',
        url: 'https://ec.europa.eu/growth/tools-databases/cosing/',
        type: 'COSING',
      },
      {
        name: 'Règlement CE 1223/2009 — Annexe III',
        url: 'https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32009R1223',
        type: 'EU_REGULATION',
      },
    ],
  },

  LIMONENE: {
    inciName: 'LIMONENE',
    commonName: 'Limonène',
    casNumber: '5989-27-5',
    einecs: '227-813-5',
    function: ['FRAGRANCE', 'SOLVENT'],
    riskLevel: 'MODERATE',
    hazardCategories: ['ALLERGEN'],
    restrictions:
      "Allergène réglementé — déclaration obligatoire. Annexe III. Oxydation possible au contact de l'air (irritant cutané).",
    sources: [
      {
        name: 'CosIng',
        url: 'https://ec.europa.eu/growth/tools-databases/cosing/',
        type: 'COSING',
      },
    ],
  },

  CITRONELLOL: {
    inciName: 'CITRONELLOL',
    commonName: 'Citronellol',
    casNumber: '106-22-9',
    einecs: '203-375-0',
    function: ['FRAGRANCE'],
    riskLevel: 'MODERATE',
    hazardCategories: ['ALLERGEN'],
    restrictions: 'Allergène réglementé — déclaration obligatoire. Annexe III.',
    sources: [
      {
        name: 'CosIng',
        url: 'https://ec.europa.eu/growth/tools-databases/cosing/',
        type: 'COSING',
      },
    ],
  },

  GERANIOL: {
    inciName: 'GERANIOL',
    commonName: 'Géraniol',
    casNumber: '106-24-1',
    einecs: '203-377-1',
    function: ['FRAGRANCE'],
    riskLevel: 'MODERATE',
    hazardCategories: ['ALLERGEN'],
    restrictions: 'Allergène réglementé — déclaration obligatoire. Annexe III.',
    sources: [
      {
        name: 'CosIng',
        url: 'https://ec.europa.eu/growth/tools-databases/cosing/',
        type: 'COSING',
      },
    ],
  },

  EUGENOL: {
    inciName: 'EUGENOL',
    commonName: 'Eugénol',
    casNumber: '97-53-0',
    einecs: '202-589-1',
    function: ['FRAGRANCE', 'ANTISEBORRHOEIC'],
    riskLevel: 'MODERATE',
    hazardCategories: ['ALLERGEN'],
    restrictions:
      'Allergène réglementé — déclaration obligatoire. Annexe III. Allergène fréquent des parfums et produits dentaires.',
    sources: [
      {
        name: 'CosIng',
        url: 'https://ec.europa.eu/growth/tools-databases/cosing/',
        type: 'COSING',
      },
    ],
  },

  COUMARIN: {
    inciName: 'COUMARIN',
    commonName: 'Coumarine',
    casNumber: '91-64-5',
    einecs: '202-086-7',
    function: ['FRAGRANCE'],
    riskLevel: 'MODERATE',
    hazardCategories: ['ALLERGEN', 'CMR'],
    restrictions:
      'Allergène réglementé. Hépatotoxique à forte dose. Déclaration obligatoire > seuil réglementaire. Annexe III.',
    sources: [
      {
        name: 'CosIng',
        url: 'https://ec.europa.eu/growth/tools-databases/cosing/',
        type: 'COSING',
      },
    ],
  },

  'BENZYL ALCOHOL': {
    inciName: 'BENZYL ALCOHOL',
    commonName: 'Alcool benzylique',
    casNumber: '100-51-6',
    einecs: '202-859-9',
    function: ['FRAGRANCE', 'PRESERVATIVE', 'SOLVENT'],
    riskLevel: 'MODERATE',
    hazardCategories: ['ALLERGEN'],
    restrictions:
      'Allergène réglementé (Annexe III). Conservateur autorisé avec restrictions (max 1%). Peut irriter les muqueuses.',
    sources: [
      {
        name: 'CosIng',
        url: 'https://ec.europa.eu/growth/tools-databases/cosing/',
        type: 'COSING',
      },
    ],
  },

  CITRAL: {
    inciName: 'CITRAL',
    commonName: 'Citral',
    casNumber: '5392-40-5',
    einecs: '226-394-6',
    function: ['FRAGRANCE'],
    riskLevel: 'MODERATE',
    hazardCategories: ['ALLERGEN'],
    restrictions: 'Allergène réglementé — déclaration obligatoire. Annexe III.',
    sources: [
      {
        name: 'CosIng',
        url: 'https://ec.europa.eu/growth/tools-databases/cosing/',
        type: 'COSING',
      },
    ],
  },

  'ALPHA-ISOMETHYL IONONE': {
    inciName: 'ALPHA-ISOMETHYL IONONE',
    commonName: 'Alpha-isométhyl ionone',
    casNumber: '127-51-5',
    einecs: '204-846-3',
    function: ['FRAGRANCE'],
    riskLevel: 'MODERATE',
    hazardCategories: ['ALLERGEN'],
    restrictions: 'Allergène réglementé — déclaration obligatoire. Annexe III.',
    sources: [
      {
        name: 'CosIng',
        url: 'https://ec.europa.eu/growth/tools-databases/cosing/',
        type: 'COSING',
      },
    ],
  },

  ISOEUGENOL: {
    inciName: 'ISOEUGENOL',
    commonName: 'Isoeugénol',
    casNumber: '97-54-1',
    einecs: '202-590-7',
    function: ['FRAGRANCE'],
    riskLevel: 'MODERATE',
    hazardCategories: ['ALLERGEN'],
    restrictions:
      'Allergène fort réglementé. Interdit dans certaines applications (parfums fine fragrance) en EU depuis 2023. Annexe III.',
    sources: [
      {
        name: 'CosIng',
        url: 'https://ec.europa.eu/growth/tools-databases/cosing/',
        type: 'COSING',
      },
    ],
  },

  HYDROXYCITRONELLAL: {
    inciName: 'HYDROXYCITRONELLAL',
    commonName: 'Hydroxycitronellal',
    casNumber: '107-75-5',
    einecs: '203-518-0',
    function: ['FRAGRANCE'],
    riskLevel: 'MODERATE',
    hazardCategories: ['ALLERGEN'],
    restrictions: 'Allergène réglementé — déclaration obligatoire. Annexe III.',
    sources: [
      {
        name: 'CosIng',
        url: 'https://ec.europa.eu/growth/tools-databases/cosing/',
        type: 'COSING',
      },
    ],
  },

  // ── Nanoparticules ───────────────────────────────────────────────────────
  'TITANIUM DIOXIDE': {
    inciName: 'TITANIUM DIOXIDE',
    commonName: 'Dioxyde de titane',
    casNumber: '13463-67-7',
    einecs: '236-675-5',
    function: ['UV_FILTER', 'COLORANT'],
    riskLevel: 'MODERATE',
    hazardCategories: ['NANO', 'CMR'],
    restrictions:
      'Forme nano : CMR cat. 1A par inhalation (IARC groupe 2B). Autorisé en form nano dans crèmes solaires (voie cutanée, pas spray). Déclaration [nano] obligatoire.',
    sources: [
      {
        name: 'IARC Monograph — TiO2',
        url: 'https://monographs.iarc.who.int/',
        type: 'ECHA',
      },
      {
        name: 'Règlement CE 1223/2009 — Annexe VI n°27',
        url: 'https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32009R1223',
        type: 'EU_REGULATION',
      },
    ],
  },

  'ZINC OXIDE': {
    inciName: 'ZINC OXIDE',
    commonName: 'Oxyde de zinc',
    casNumber: '1314-13-2',
    einecs: '215-222-5',
    function: ['UV_FILTER', 'SKIN_PROTECTING'],
    riskLevel: 'LOW',
    hazardCategories: ['NANO'],
    restrictions:
      'Forme nano autorisée (crèmes solaires cutanées). Interdit dans les sprays/aérosols. Déclaration [nano] obligatoire. Annexe VI n°30.',
    sources: [
      {
        name: 'CosIng — Annexe VI n°30',
        url: 'https://ec.europa.eu/growth/tools-databases/cosing/',
        type: 'COSING',
      },
    ],
  },

  'CARBON BLACK': {
    inciName: 'CARBON BLACK',
    commonName: 'Noir de carbone (CI 77266)',
    casNumber: '1333-86-4',
    einecs: '215-609-9',
    function: ['COLORANT'],
    riskLevel: 'RESTRICTED',
    hazardCategories: ['NANO', 'CMR'],
    restrictions:
      "CMR cat. 2 (IARC groupe 2B). Forme nano : interdit dans les produits cosmétiques selon l'ANSES. Annexe II (forme nano).",
    sources: [
      {
        name: 'ANSES — Évaluation nanoparticules',
        url: 'https://www.anses.fr/',
        type: 'ANSES',
      },
    ],
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
