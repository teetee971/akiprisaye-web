/**
 * Service de FAQ Logistique DOM
 * 
 * Fournit des réponses PÉDAGOGIQUES aux questions fréquemment posées
 * par les citoyens concernant la logistique et l'acheminement
 * des marchandises vers les territoires ultramarins.
 * 
 * AUCUNE ANALYSE DE PRIX
 * AUCUNE ATTRIBUTION DE RESPONSABILITÉ
 * AUCUNE OPINION
 * AUCUNE PRÉDICTION
 * 
 * Objectif : Expliquer des MÉCANISMES de manière neutre
 */

export interface FaqItem {
  id: number;
  category: 'delais' | 'transport' | 'stockage' | 'ultramarine' | 'situations';
  question: string;
  answer: string;
}

/**
 * Questions et réponses pédagogiques
 * Langage SIMPLE et NEUTRE
 */
const faqItems: FaqItem[] = [
  // SECTION — DÉLAIS
  {
    id: 1,
    category: 'delais',
    question: 'Pourquoi certains produits mettent plus de temps à arriver ?',
    answer: 'L\'acheminement vers les territoires ultramarins implique plusieurs étapes logistiques et des distances importantes. Chaque étape (préparation, transport principal, dédouanement, distribution locale) peut influencer les délais. La nature du produit et ses contraintes de transport jouent également un rôle.'
  },
  {
    id: 2,
    category: 'delais',
    question: 'Les délais sont-ils toujours les mêmes ?',
    answer: 'Non. Les délais peuvent varier selon la période de l\'année, les volumes transportés, les conditions météorologiques et les contraintes logistiques du moment. Certaines périodes (fêtes, vacances) peuvent connaître une activité plus intense.'
  },
  {
    id: 3,
    category: 'delais',
    question: 'Pourquoi les délais varient-ils selon les produits ?',
    answer: 'Chaque type de produit peut avoir des contraintes spécifiques : les produits frais nécessitent un transport rapide, les produits volumineux sont généralement acheminés par voie maritime, les produits réglementés suivent des procédures particulières. Ces différences influencent les choix logistiques et donc les délais.'
  },
  {
    id: 4,
    category: 'delais',
    question: 'Peut-on prévoir exactement quand un produit arrivera ?',
    answer: 'Les délais peuvent être estimés de manière générale, mais de nombreux facteurs peuvent les influencer : rotations maritimes ou aériennes, procédures administratives, organisation de la distribution locale. C\'est pourquoi les délais ne sont généralement pas garantis de manière précise.'
  },

  // SECTION — TRANSPORT
  {
    id: 5,
    category: 'transport',
    question: 'Tous les produits arrivent-ils par bateau ?',
    answer: 'Non. Certains produits peuvent être transportés par avion, notamment lorsqu\'ils sont sensibles au temps (produits frais) ou au stockage (médicaments urgents). Le choix du mode de transport dépend de la nature du produit et de ses contraintes d\'acheminement.'
  },
  {
    id: 6,
    category: 'transport',
    question: 'Pourquoi le transport aérien n\'est-il pas utilisé pour tout ?',
    answer: 'Le transport aérien répond à des usages spécifiques : produits urgents, périssables ou de faible volume. Il n\'est pas adapté à tous les types de marchandises, notamment les produits volumineux, lourds ou nécessitant des conteneurs spécialisés. Chaque mode de transport a ses caractéristiques propres.'
  },
  {
    id: 7,
    category: 'transport',
    question: 'Les produits passent-ils toujours par le même chemin ?',
    answer: 'Non nécessairement. Selon l\'origine du produit, sa destination finale et les contraintes logistiques, différents itinéraires peuvent être empruntés. Certains produits peuvent transiter par des plateformes intermédiaires avant d\'arriver dans le territoire.'
  },
  {
    id: 8,
    category: 'transport',
    question: 'Y a-t-il des transports directs depuis la métropole ?',
    answer: 'Il existe des lignes maritimes et aériennes régulières entre la métropole et les territoires ultramarins. Cependant, selon les produits et leur provenance, certains peuvent transiter par des plateformes logistiques ou des ports de transbordement.'
  },
  {
    id: 9,
    category: 'transport',
    question: 'Qu\'est-ce qu\'un conteneur frigorifique ?',
    answer: 'C\'est un conteneur équipé d\'un système de réfrigération permettant de maintenir une température contrôlée pendant le transport maritime. Il est indispensable pour les produits surgelés et certains produits frais nécessitant le respect de la chaîne du froid.'
  },

  // SECTION — STOCKAGE
  {
    id: 10,
    category: 'stockage',
    question: 'Les produits sont-ils stockés longtemps à l\'arrivée ?',
    answer: 'Les durées de stockage peuvent varier selon l\'organisation logistique locale, la demande et les flux de distribution. Certains produits passent rapidement en magasin, tandis que d\'autres peuvent nécessiter un stockage temporaire dans des plateformes logistiques.'
  },
  {
    id: 11,
    category: 'stockage',
    question: 'Les stocks sont-ils toujours disponibles ?',
    answer: 'Les niveaux de stock dépendent de nombreux paramètres : fréquence des livraisons, demande locale, capacités de stockage et organisation commerciale. Les variations de stock sont une réalité logistique courante.'
  },
  {
    id: 12,
    category: 'stockage',
    question: 'Pourquoi certains produits sont-ils parfois indisponibles ?',
    answer: 'L\'indisponibilité temporaire peut avoir plusieurs origines : variation de la demande, perturbation des flux logistiques, réorganisation des circuits d\'approvisionnement ou choix commerciaux. Ces situations sont généralement temporaires.'
  },
  {
    id: 13,
    category: 'stockage',
    question: 'Qu\'est-ce qu\'une plateforme logistique ?',
    answer: 'C\'est un entrepôt où les marchandises sont reçues, triées, stockées temporairement et préparées pour leur distribution finale vers les commerces. C\'est un point central dans la chaîne d\'approvisionnement local.'
  },

  // SECTION — LOGISTIQUE ULTRAMARINE
  {
    id: 14,
    category: 'ultramarine',
    question: 'La logistique est-elle différente dans les DOM ?',
    answer: 'Oui. Les territoires ultramarins présentent des contraintes géographiques spécifiques : éloignement de la métropole, insularité, relief parfois complexe. Ces caractéristiques influencent l\'organisation des flux logistiques et les choix d\'acheminement.'
  },
  {
    id: 15,
    category: 'ultramarine',
    question: 'Les mêmes circuits sont-ils utilisés partout ?',
    answer: 'Non. Les circuits logistiques peuvent varier selon le territoire (Guadeloupe, Martinique, Guyane, Réunion, Mayotte) et le type de marchandise. Chaque territoire a ses spécificités en termes d\'infrastructures portuaires, aéroportuaires et de distribution.'
  },
  {
    id: 16,
    category: 'ultramarine',
    question: 'Pourquoi parle-t-on de "rupture de charge" ?',
    answer: 'Une rupture de charge désigne une étape où des marchandises sont déchargées d\'un moyen de transport pour être rechargées sur un autre (du bateau au camion, par exemple). Ces étapes sont nécessaires dans la chaîne logistique mais ajoutent des phases de manutention.'
  },
  {
    id: 17,
    category: 'ultramarine',
    question: 'Les infrastructures portuaires sont-elles les mêmes partout ?',
    answer: 'Non. Chaque port ultramarin a ses propres caractéristiques en termes de capacité d\'accueil, d\'équipements disponibles et de types de marchandises traités. Ces différences influencent l\'organisation des flux logistiques.'
  },
  {
    id: 18,
    category: 'ultramarine',
    question: 'Qu\'est-ce que le "dernier kilomètre" ?',
    answer: 'C\'est la dernière étape de la livraison, depuis l\'entrepôt local ou le point de distribution jusqu\'au magasin ou au consommateur final. Dans les territoires ultramarins, cette étape peut présenter des particularités liées à la géographie locale.'
  },

  // SECTION — SITUATIONS PARTICULIÈRES
  {
    id: 19,
    category: 'situations',
    question: 'Que se passe-t-il en cas de perturbation logistique ?',
    answer: 'Des événements externes (météo, grèves, tensions internationales, crises sanitaires) peuvent perturber les flux logistiques et entraîner des ajustements temporaires : reports de navires, réorganisation des rotations, allongement des délais.'
  },
  {
    id: 20,
    category: 'situations',
    question: 'Ces situations sont-elles visibles immédiatement ?',
    answer: 'Pas toujours. Les effets d\'une perturbation logistique peuvent apparaître avec un décalage, selon les stocks disponibles et les circuits d\'approvisionnement. C\'est pourquoi l\'impact peut se manifester quelques jours ou semaines après l\'événement.'
  },
  {
    id: 21,
    category: 'situations',
    question: 'Comment les cyclones affectent-ils la logistique ?',
    answer: 'Les cyclones peuvent entraîner la fermeture préventive des ports et aéroports, le report des rotations maritimes ou aériennes, et des difficultés de distribution locale. Ces mesures de sécurité sont nécessaires mais peuvent temporairement perturber les flux.'
  },
  {
    id: 22,
    category: 'situations',
    question: 'Les périodes de fêtes changent-elles quelque chose ?',
    answer: 'Oui. Les périodes de forte demande (fêtes de fin d\'année, rentrée scolaire, vacances) génèrent des volumes logistiques plus importants. Cette intensification peut influencer l\'organisation des flux et les délais d\'acheminement.'
  },
  {
    id: 23,
    category: 'situations',
    question: 'Peut-on anticiper toutes les perturbations ?',
    answer: 'Certaines perturbations sont prévisibles (saison cyclonique, périodes de forte demande) et permettent une adaptation logistique. D\'autres événements (grèves, pannes, événements internationaux) peuvent survenir de manière plus inattendue.'
  }
];

/**
 * Récupère toutes les questions
 */
export function getAllFaqItems(): FaqItem[] {
  return [...faqItems];
}

/**
 * Récupère les questions par catégorie
 */
export function getFaqItemsByCategory(category: string): FaqItem[] {
  if (category === 'toutes') {
    return getAllFaqItems();
  }
  return faqItems.filter(item => item.category === category);
}

/**
 * Recherche dans les questions et réponses
 */
export function searchFaqItems(query: string): FaqItem[] {
  if (!query || query.trim() === '') {
    return getAllFaqItems();
  }
  
  const normalizedQuery = query
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  
  return faqItems.filter(item => {
    const normalizedQuestion = item.question
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    
    const normalizedAnswer = item.answer
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    
    return normalizedQuestion.includes(normalizedQuery) || 
           normalizedAnswer.includes(normalizedQuery);
  });
}

/**
 * Récupère les catégories disponibles
 */
export function getCategories() {
  return [
    { id: 'toutes', label: 'Toutes les questions', icon: '📚' },
    { id: 'delais', label: 'Délais', icon: '⏱️' },
    { id: 'transport', label: 'Transport', icon: '🚢' },
    { id: 'stockage', label: 'Stockage', icon: '📦' },
    { id: 'ultramarine', label: 'Logistique ultramarine', icon: '🌴' },
    { id: 'situations', label: 'Situations particulières', icon: '⚠️' }
  ];
}
