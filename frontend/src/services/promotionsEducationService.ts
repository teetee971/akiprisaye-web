/**
 * Service éducatif sur les promotions, remises et prix barrés
 *
 * Fournit des données PÉDAGOGIQUES pour expliquer :
 * - Ce qu'est une promotion
 * - Ce qu'est un prix barré
 * - Ce qui est comparable et ce qui ne l'est pas
 *
 * RÈGLES STRICTES :
 * - Aucun nom d'enseigne réel
 * - Aucun territoire noté ou évalué
 * - Aucun conseil consommateur
 * - Aucun jugement commercial
 * - Aucune prédiction
 * - Données SIMULÉES uniquement
 */

export interface PromotionExample {
  id: string;
  description: string;
  regular_price: number;
  promotional_price: number;
  discount_percentage: number;
  start_date: string; // Format fictif "JJ/MM"
  end_date: string;
  is_genuine: boolean;
  explanation: string;
}

export interface ComparableCase {
  id: string;
  title: string;
  description: string;
  why_comparable: string;
  icon: string;
}

export interface NonComparableCase {
  id: string;
  title: string;
  description: string;
  why_not_comparable: string;
  icon: string;
}

export interface InterpretationError {
  id: string;
  error_type: string;
  incorrect_thinking: string;
  correct_understanding: string;
}

/**
 * Exemples de promotions (données simulées)
 */
export const promotionExamples: PromotionExample[] = [
  {
    id: 'promo-1',
    description: 'Produit alimentaire A',
    regular_price: 3.2,
    promotional_price: 2.8,
    discount_percentage: 12.5,
    start_date: '05/03',
    end_date: '15/03',
    is_genuine: true,
    explanation:
      'Prix barré de 3,20 € affiché. Prix promotionnel de 2,80 € appliqué pendant 10 jours. Le prix barré correspond au prix observé précédemment.',
  },
  {
    id: 'promo-2',
    description: 'Produit ménager B',
    regular_price: 5.5,
    promotional_price: 4.95,
    discount_percentage: 10,
    start_date: '12/04',
    end_date: '22/04',
    is_genuine: true,
    explanation:
      'Réduction de 10% affichée. Le prix barré de 5,50 € correspond à une observation antérieure du même produit.',
  },
  {
    id: 'promo-3',
    description: 'Produit cosmétique C',
    regular_price: 8.9,
    promotional_price: 6.9,
    discount_percentage: 22,
    start_date: '01/05',
    end_date: '30/05',
    is_genuine: false,
    explanation:
      'Prix barré de 8,90 € affiché, mais aucune observation du produit à ce prix au cours des 30 jours précédents. Le prix observé avant promotion était de 6,90 €.',
  },
];

/**
 * Cas comparables (exemples pédagogiques)
 */
export const comparableCases: ComparableCase[] = [
  {
    id: 'comp-1',
    title: 'Même produit, même territoire, périodes différentes',
    description:
      'Produit X observé à 2,50 € le 10 mars et à 2,20 € le 25 mars dans le même territoire.',
    why_comparable:
      'Le produit est identique (même code-barres), le lieu est le même, seule la période change. La comparaison temporelle est possible.',
    icon: '✓',
  },
  {
    id: 'comp-2',
    title: 'Même produit en promotion vs hors promotion',
    description:
      "Produit Y à 4,50 € hors promotion et à 3,60 € en promotion, observés à une semaine d'intervalle.",
    why_comparable:
      'Le produit est identique. On peut observer la différence entre prix standard et prix promotionnel si les dates sont documentées.',
    icon: '✓',
  },
  {
    id: 'comp-3',
    title: "Historique de prix d'un même produit",
    description:
      'Produit Z observé chaque semaine pendant 3 mois dans le même lieu : évolution de 3,10 € à 3,45 €.',
    why_comparable:
      "L'historique temporel d'un même produit dans des conditions similaires permet d'observer une évolution.",
    icon: '✓',
  },
];

/**
 * Cas non comparables (exemples pédagogiques)
 */
export const nonComparableCases: NonComparableCase[] = [
  {
    id: 'non-comp-1',
    title: 'Prix barré sans date de référence',
    description:
      'Promotion affichée "Prix barré 5,00 €" sans indiquer quand ce prix a été appliqué.',
    why_not_comparable:
      'Sans date de référence, impossible de vérifier si le prix barré a réellement existé récemment. La comparaison manque de contexte temporel.',
    icon: '✗',
  },
  {
    id: 'non-comp-2',
    title: 'Promotions dans des territoires différents',
    description:
      'Produit A en promotion à 2,80 € dans le territoire 1 et à 3,10 € dans le territoire 2.',
    why_not_comparable:
      'Les contextes locaux diffèrent (logistique, approvisionnement, taxes locales). La comparaison directe ne tient pas compte de ces facteurs.',
    icon: '✗',
  },
  {
    id: 'non-comp-3',
    title: 'Promotion sur format modifié',
    description: 'Produit B de 500g à 4,20 € devient un format de 450g à 3,80 €.',
    why_not_comparable:
      "Le contenu a changé. Il faut comparer le prix au kilo, pas le prix unitaire. Ce n'est plus le même produit au sens strict.",
    icon: '✗',
  },
  {
    id: 'non-comp-4',
    title: 'Prix de lancement vs prix standard',
    description: 'Nouveau produit lancé à 2,90 € puis observé à 3,40 € deux mois plus tard.',
    why_not_comparable:
      'Le prix de lancement peut être temporaire. Il ne constitue pas nécessairement un "prix standard" de référence pour juger d\'une hausse.',
    icon: '✗',
  },
  {
    id: 'non-comp-5',
    title: 'Comparaison entre marques différentes',
    description:
      'Marque X à 3,50 € et marque Y à 2,90 € pour des produits similaires mais différents.',
    why_not_comparable:
      "Même si les produits semblent similaires, ils diffèrent (composition, marque, origine). La comparaison n'est pas directe.",
    icon: '✗',
  },
];

/**
 * Erreurs fréquentes d'interprétation
 */
export const interpretationErrors: InterpretationError[] = [
  {
    id: 'error-1',
    error_type: 'Confondre promotion et baisse structurelle',
    incorrect_thinking:
      'Le produit est en promotion à 2,50 €, donc son prix a baissé définitivement.',
    correct_understanding:
      'Une promotion est temporaire. Le prix observé après la période promotionnelle peut revenir au niveau précédent. Observer ≠ conclure sur la durée.',
  },
  {
    id: 'error-2',
    error_type: 'Ignorer la date du prix barré',
    incorrect_thinking: "Le prix barré est de 4,50 €, c'est forcément le prix d'avant.",
    correct_understanding:
      "Le prix barré doit être daté et vérifiable. Sans contexte temporel, on ne peut pas confirmer qu'il s'agissait du prix standard récent.",
  },
  {
    id: 'error-3',
    error_type: "Généraliser à partir d'une promotion",
    incorrect_thinking:
      'Ce produit est en promotion, donc tous les prix baissent dans ce territoire.',
    correct_understanding:
      "Chaque produit a sa propre évolution tarifaire. Une promotion sur un article ne signifie pas que l'ensemble des prix suivent la même tendance.",
  },
  {
    id: 'error-4',
    error_type: 'Comparer sans tenir compte du contexte',
    incorrect_thinking:
      "Le produit est moins cher en promotion dans ce territoire, donc c'est toujours moins cher là-bas.",
    correct_understanding:
      'Les promotions sont temporaires et locales. Comparer deux prix nécessite de connaître les dates, les lieux et les conditions (promotion ou non).',
  },
  {
    id: 'error-5',
    error_type: 'Juger une promotion sans vérification',
    incorrect_thinking: "Une réduction de 30% affichée, c'est forcément une vraie bonne affaire.",
    correct_understanding:
      "L'observatoire montre les prix observés. Seule la vérification du prix barré par rapport à l'historique permet de constater la réalité de la réduction.",
  },
];

/**
 * Définition neutre d'une promotion
 */
export const promotionDefinition = {
  title: "Ce qu'est une promotion",
  definition:
    "Une promotion est une réduction temporaire du prix de vente d'un produit, affichée pour une durée limitée.",
  characteristics: [
    'Durée limitée (dates de début et de fin)',
    "Affichage d'un prix promotionnel inférieur au prix standard",
    'Retour au prix standard après la période promotionnelle',
    "Peut s'appliquer à un ou plusieurs produits",
  ],
  note: "L'observatoire peut afficher les prix observés en période promotionnelle et hors promotion, sans juger de leur pertinence commerciale.",
};

/**
 * Définition neutre d'un prix barré
 */
export const strikethroughPriceDefinition = {
  title: "Ce qu'est un prix barré",
  definition:
    'Un prix barré est le prix de référence affiché à côté du prix promotionnel, généralement rayé ou barré.',
  purpose: "Il permet de visualiser l'écart entre le prix de référence et le prix promotionnel.",
  legal_context:
    'La réglementation impose généralement que le prix barré corresponde au prix le plus bas pratiqué au cours des 30 derniers jours (directive européenne 2019/2161).',
  observatory_role:
    "L'observatoire peut comparer les prix barrés affichés avec les prix historiques observés, sans porter de jugement.",
  note: "Un prix barré doit être vérifiable dans le temps. Sans historique, il n'est pas possible de confirmer sa validité.",
};

/**
 * Ce que l'observatoire montre
 */
export const observatoryCapabilities = [
  'Prix observés à différentes dates pour un même produit',
  'Historique temporel des prix (hors promotion et en promotion)',
  'Écart entre prix standard observé et prix promotionnel observé',
  "Fréquence des promotions pour un produit donné (nombre d'observations en promotion)",
  'Territoires où des observations ont été faites',
];

/**
 * Ce que l'observatoire ne montre PAS
 */
export const observatoryLimitations = [
  'Il ne juge pas si une promotion est "vraie" ou "fausse"',
  'Il ne note pas les enseignes',
  'Il ne recommande aucun achat',
  "Il n'analyse pas les stratégies commerciales",
  'Il ne prédit pas les prix futurs',
  'Il ne désigne aucune responsabilité',
  'Il ne qualifie pas les prix (cher/pas cher, abusif/normal)',
  "Il n'attribue aucun label de qualité",
];

/**
 * Pourquoi deux promotions peuvent sembler différentes
 */
export const promotionDifferences = [
  {
    factor: 'Période de référence',
    explanation:
      "Le prix barré peut se baser sur une période de référence différente (30 jours, 60 jours). Cela influence l'écart affiché.",
  },
  {
    factor: 'Contexte territorial',
    explanation:
      'Les prix standards varient selon les territoires. Une même réduction en pourcentage peut donner des écarts différents en valeur absolue.',
  },
  {
    factor: 'Fréquence des promotions',
    explanation:
      "Un produit souvent en promotion peut avoir un prix barré différent d'un produit rarement en promotion, même pour une réduction similaire.",
  },
  {
    factor: 'Saisonnalité',
    explanation:
      "Certains produits ont des prix qui varient selon les saisons. Une promotion en période haute peut sembler différente d'une promotion en période basse.",
  },
  {
    factor: 'Durée de la promotion',
    explanation:
      "Une promotion de 3 jours peut afficher un écart différent d'une promotion de 30 jours, selon la stratégie commerciale.",
  },
];

/**
 * Rôle de l'observatoire : observer ≠ juger
 */
export const observatoryRole = {
  mission: 'Afficher des observations de prix',
  approach: 'Descriptif et factuel',
  what_it_does: [
    'Collecte des prix observés dans le temps',
    "Affiche l'historique des prix pour un produit donné",
    'Permet de visualiser les évolutions temporelles',
    'Montre les écarts entre périodes différentes',
  ],
  what_it_does_not: [
    'Ne porte aucun jugement de valeur',
    'Ne qualifie pas les variations (normale, anormale, excessive, abusive)',
    "Ne recommande aucun comportement d'achat",
    'Ne note ni ne classe les enseignes',
    'Ne fait aucune prédiction',
    'Ne désigne aucune responsabilité',
  ],
  key_principle:
    "L'observatoire observe. L'utilisateur interprète librement, sans conseil de notre part.",
};
