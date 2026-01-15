/**
 * Service du Glossaire Logistique DOM
 * 
 * Fournit des définitions PÉDAGOGIQUES des termes fréquemment utilisés
 * dans la logistique et le transport vers les territoires ultramarins.
 * 
 * AUCUN PRIX
 * AUCUNE COMPARAISON
 * AUCUNE ATTRIBUTION DE RESPONSABILITÉ
 * AUCUNE PRÉDICTION
 * 
 * Objectif : Expliquer des MOTS de manière accessible
 */

export interface GlossaryTerm {
  term: string;
  definition: string;
  context_dom: string;
  category: 'transport' | 'portuaire' | 'aerien' | 'douane' | 'stockage' | 'distribution' | 'reglementation' | 'general';
  related_terms?: string[];
  pedagogical_note?: string;
}

/**
 * Glossaire des termes logistiques DOM
 * Contenu PÉDAGOGIQUE et ACCESSIBLE
 */
const glossaryTerms: GlossaryTerm[] = [
  // Catégorie TRANSPORT
  {
    term: 'Fret',
    definition: 'Ensemble des marchandises transportées par voie maritime, aérienne, routière ou ferroviaire. Le terme désigne à la fois les produits transportés et le service de transport lui-même.',
    context_dom: 'Dans les DOM, le fret désigne principalement les marchandises acheminées depuis la métropole ou l\'international. La majorité des produits de consommation courante arrivent par fret maritime.',
    category: 'transport',
    related_terms: ['Fret maritime', 'Fret aérien', 'Chaîne logistique'],
    pedagogical_note: 'À ne pas confondre avec le coût du transport, qui est une notion économique distincte.'
  },
  {
    term: 'Fret maritime',
    definition: 'Transport de marchandises par bateau. C\'est le mode de transport privilégié pour les volumes importants et les produits non périssables.',
    context_dom: 'Le fret maritime est le principal mode d\'acheminement des marchandises vers les DOM. Les délais sont généralement plus longs que le fret aérien mais permettent de transporter des volumes importants.',
    category: 'transport',
    related_terms: ['Conteneur', 'Port de transbordement', 'Terminal portuaire'],
    pedagogical_note: 'Adapté aux produits volumineux, surgelés en conteneur frigorifique, et marchandises non urgentes.'
  },
  {
    term: 'Fret aérien',
    definition: 'Transport de marchandises par avion. Utilisé pour les produits urgents, périssables ou de faible volume mais de forte valeur.',
    context_dom: 'Le fret aérien est privilégié pour les produits frais, les médicaments urgents et les pièces détachées nécessitant une livraison rapide vers les DOM.',
    category: 'transport',
    related_terms: ['Soute', 'Vol cargo', 'Priorisation du fret'],
    pedagogical_note: 'Plus rapide que le maritime mais avec une capacité plus limitée.'
  },
  {
    term: 'Mutualisation des flux',
    definition: 'Regroupement de plusieurs envois de marchandises pour optimiser l\'utilisation d\'un moyen de transport. Permet de mieux remplir les conteneurs ou les espaces de transport.',
    context_dom: 'Dans les DOM, la mutualisation permet d\'acheminer des produits même lorsque les volumes individuels sont faibles. Cela peut nécessiter d\'attendre qu\'un groupage suffisant soit constitué.',
    category: 'transport',
    related_terms: ['Flux massifié', 'Plateforme logistique'],
    pedagogical_note: 'Pratique courante pour optimiser l\'utilisation des transports disponibles.'
  },
  {
    term: 'Chaîne logistique',
    definition: 'Ensemble des étapes et des acteurs impliqués dans l\'acheminement d\'un produit depuis son point d\'origine jusqu\'au consommateur final.',
    context_dom: 'Pour les DOM, la chaîne logistique inclut généralement : le fabricant, la plateforme métropole, le transport maritime ou aérien, le port ou aéroport DOM, l\'entrepôt local et la distribution finale.',
    category: 'transport',
    related_terms: ['Rupture de charge', 'Dernier kilomètre', 'Plateforme logistique']
  },

  // Catégorie PORTUAIRE
  {
    term: 'Port de transbordement',
    definition: 'Port où les marchandises sont déchargées d\'un navire pour être rechargées sur un autre navire. Étape intermédiaire dans certains parcours maritimes.',
    context_dom: 'Certaines routes vers les DOM peuvent passer par des ports de transbordement en Europe ou dans les Caraïbes, ce qui ajoute une étape au parcours.',
    category: 'portuaire',
    related_terms: ['Terminal portuaire', 'Rupture de charge']
  },
  {
    term: 'Terminal portuaire',
    definition: 'Zone spécialisée d\'un port où les navires sont chargés et déchargés. Peut être équipé pour différents types de marchandises (conteneurs, vrac, etc.).',
    context_dom: 'Les ports des DOM disposent de terminaux adaptés aux différents types de marchandises reçues. Leur capacité influence les volumes pouvant être traités simultanément.',
    category: 'portuaire',
    related_terms: ['Quai', 'Conteneur', 'Capacité disponible']
  },
  {
    term: 'Quai',
    definition: 'Infrastructure où les navires accostent pour charger ou décharger des marchandises. Le nombre et la taille des quais déterminent la capacité d\'accueil d\'un port.',
    context_dom: 'La disponibilité des quais peut influencer les horaires d\'arrivée et de traitement des navires dans les ports DOM.',
    category: 'portuaire',
    related_terms: ['Terminal portuaire', 'Port de transbordement']
  },
  {
    term: 'Conteneur',
    definition: 'Grande boîte métallique standardisée utilisée pour transporter des marchandises par bateau, train ou camion. Les tailles standards sont de 20 ou 40 pieds.',
    context_dom: 'Les conteneurs sont le principal moyen d\'acheminement des marchandises vers les DOM par voie maritime. Ils permettent un transport sécurisé et une manipulation facilitée.',
    category: 'portuaire',
    related_terms: ['Conteneur frigorifique', 'Terminal portuaire', 'Fret maritime'],
    pedagogical_note: 'Un conteneur de 20 pieds mesure environ 6 mètres de long.'
  },
  {
    term: 'Conteneur frigorifique',
    definition: 'Conteneur équipé d\'un système de réfrigération permettant de maintenir une température contrôlée pendant le transport. Indispensable pour les produits nécessitant le respect de la chaîne du froid.',
    context_dom: 'Les conteneurs frigorifiques sont essentiels pour acheminer les produits surgelés et certains produits frais vers les DOM. Leur nombre est limité, ce qui nécessite une planification du fret.',
    category: 'portuaire',
    related_terms: ['Chaîne du froid', 'Fret maritime'],
    pedagogical_note: 'Aussi appelés "reefer" dans le jargon professionnel.'
  },

  // Catégorie AÉRIEN
  {
    term: 'Soute',
    definition: 'Compartiment situé sous le plancher d\'un avion, utilisé pour transporter des bagages et du fret. Dans les vols passagers, une partie de la soute peut être réservée au transport de marchandises.',
    context_dom: 'Les vols passagers vers les DOM transportent souvent du fret en soute. Cette capacité est limitée et partagée avec les bagages des voyageurs.',
    category: 'aerien',
    related_terms: ['Vol cargo', 'Fret aérien', 'Priorisation du fret']
  },
  {
    term: 'Priorisation du fret',
    definition: 'Choix d\'accorder la priorité à certaines catégories de marchandises lors du chargement d\'un transport. Basé sur l\'urgence, la nature des produits ou d\'autres critères logistiques.',
    context_dom: 'Dans les transports vers les DOM, les produits périssables ou urgents (médicaux, par exemple) peuvent être prioritaires sur d\'autres marchandises.',
    category: 'aerien',
    related_terms: ['Soute', 'Fret aérien', 'Capacité disponible']
  },
  {
    term: 'Vol cargo',
    definition: 'Vol d\'avion dédié exclusivement au transport de marchandises, sans passagers. Offre une capacité de fret supérieure aux vols passagers.',
    context_dom: 'Les vols cargo vers les DOM sont moins fréquents que les vols passagers. Ils sont utilisés pour les volumes importants ou les périodes de forte demande.',
    category: 'aerien',
    related_terms: ['Fret aérien', 'Soute'],
    pedagogical_note: 'Les vols cargo peuvent transporter plusieurs tonnes de marchandises.'
  },
  {
    term: 'Capacité disponible',
    definition: 'Espace ou poids restant disponible dans un moyen de transport (avion, navire, camion) après chargement partiel. Détermine ce qui peut encore être embarqué.',
    context_dom: 'La capacité disponible varie selon les rotations et peut influencer le moment où une marchandise peut être embarquée vers les DOM.',
    category: 'aerien',
    related_terms: ['Vol cargo', 'Soute', 'Mutualisation des flux']
  },

  // Catégorie DOUANE
  {
    term: 'Dédouanement',
    definition: 'Ensemble des formalités administratives permettant à une marchandise de franchir une frontière douanière et d\'entrer sur un territoire. Inclut la vérification des documents et le paiement des éventuelles taxes.',
    context_dom: 'Bien que les DOM fassent partie du territoire français, certaines marchandises peuvent nécessiter des formalités douanières, notamment pour les produits venant de pays tiers.',
    category: 'douane',
    related_terms: ['Contrôle documentaire', 'Contrôle physique', 'Réglementation spécifique DOM']
  },
  {
    term: 'Contrôle documentaire',
    definition: 'Vérification des documents accompagnant une marchandise (factures, certificats, autorisations) lors du passage en douane.',
    context_dom: 'Les contrôles documentaires font partie des procédures standard lors de l\'arrivée de marchandises dans les ports et aéroports DOM.',
    category: 'douane',
    related_terms: ['Dédouanement', 'Contrôle physique']
  },
  {
    term: 'Contrôle physique',
    definition: 'Inspection visuelle ou par scanner d\'une marchandise par les autorités douanières pour vérifier sa conformité avec les documents déclarés.',
    context_dom: 'Les contrôles physiques peuvent être effectués de manière aléatoire ou ciblée sur certains types de marchandises arrivant dans les DOM.',
    category: 'douane',
    related_terms: ['Dédouanement', 'Contrôle documentaire']
  },
  {
    term: 'Réglementation spécifique DOM',
    definition: 'Ensemble de règles particulières applicables aux territoires d\'outre-mer, notamment en matière sanitaire, phytosanitaire ou commerciale.',
    context_dom: 'Certains produits peuvent être soumis à des règles spécifiques lors de leur entrée dans les DOM, notamment pour protéger les écosystèmes locaux.',
    category: 'douane',
    related_terms: ['Normes sanitaires', 'Produits réglementés']
  },

  // Catégorie STOCKAGE
  {
    term: 'Plateforme logistique',
    definition: 'Entrepôt où les marchandises sont reçues, triées, stockées temporairement et préparées pour leur distribution finale. Point central dans la chaîne logistique.',
    context_dom: 'Les plateformes logistiques dans les DOM reçoivent les marchandises des ports et aéroports pour les redistribuer vers les commerces et consommateurs.',
    category: 'stockage',
    related_terms: ['Stock tampon', 'Distribution locale', 'Dernier kilomètre']
  },
  {
    term: 'Stock tampon',
    definition: 'Quantité de marchandises stockées de manière préventive pour faire face aux variations de demande ou aux éventuelles perturbations d\'approvisionnement.',
    context_dom: 'Dans les DOM, compte tenu de l\'éloignement, le maintien de stocks tampons peut être important pour assurer la continuité de l\'approvisionnement.',
    category: 'stockage',
    related_terms: ['Plateforme logistique', 'Rupture de stock']
  },
  {
    term: 'Chaîne du froid',
    definition: 'Maintien ininterrompu d\'une température contrôlée pour des produits sensibles, depuis leur production jusqu\'à leur consommation.',
    context_dom: 'La chaîne du froid est cruciale pour l\'acheminement des produits frais et surgelés vers les DOM. Elle nécessite des équipements spécialisés à chaque étape.',
    category: 'stockage',
    related_terms: ['Conteneur frigorifique', 'Produits périssables'],
    pedagogical_note: 'Toute rupture de la chaîne du froid peut rendre un produit impropre à la consommation.'
  },
  {
    term: 'Rupture de stock',
    definition: 'Situation où un produit n\'est temporairement plus disponible dans un point de vente ou un entrepôt.',
    context_dom: 'Dans les DOM, les ruptures de stock peuvent survenir lors de perturbations des chaînes d\'approvisionnement ou de variations importantes de la demande.',
    category: 'stockage',
    related_terms: ['Stock tampon', 'Plateforme logistique']
  },

  // Catégorie DISTRIBUTION
  {
    term: 'Dernier kilomètre',
    definition: 'Dernière étape de la livraison, depuis l\'entrepôt local ou le point de distribution jusqu\'au consommateur final ou au magasin.',
    context_dom: 'Le dernier kilomètre dans les DOM peut présenter des particularités liées à la géographie (îles, relief) et aux infrastructures routières.',
    category: 'distribution',
    related_terms: ['Réseau de distribution', 'Livraison locale']
  },
  {
    term: 'Réseau de distribution',
    definition: 'Ensemble des points de vente, entrepôts et moyens de transport permettant d\'acheminer les produits jusqu\'aux consommateurs sur un territoire donné.',
    context_dom: 'Les réseaux de distribution dans les DOM doivent s\'adapter aux spécificités géographiques de chaque territoire (insularité, relief, dispersion de la population).',
    category: 'distribution',
    related_terms: ['Dernier kilomètre', 'Livraison locale', 'Plateforme logistique']
  },
  {
    term: 'Livraison locale',
    definition: 'Transport final des marchandises depuis un point de distribution local vers le destinataire (commerce, entreprise ou particulier).',
    context_dom: 'La livraison locale dans les DOM peut être influencée par les distances, les infrastructures routières et les spécificités de chaque île ou zone.',
    category: 'distribution',
    related_terms: ['Dernier kilomètre', 'Réseau de distribution']
  },

  // Catégorie RÉGLEMENTATION
  {
    term: 'Normes sanitaires',
    definition: 'Règles établies pour garantir la sécurité et la salubrité des produits alimentaires et de santé. Encadrent leur production, transport et commercialisation.',
    context_dom: 'Les normes sanitaires s\'appliquent aux produits entrant dans les DOM, avec des contrôles pouvant être renforcés pour protéger les populations et écosystèmes locaux.',
    category: 'reglementation',
    related_terms: ['Réglementation spécifique DOM', 'Contrôle physique']
  },
  {
    term: 'Produits réglementés',
    definition: 'Marchandises soumises à des règles spécifiques de transport, stockage ou commercialisation en raison de leur nature (médicaments, produits dangereux, denrées spécifiques).',
    context_dom: 'L\'entrée de certains produits réglementés dans les DOM peut nécessiter des autorisations particulières ou suivre des procédures spécifiques.',
    category: 'reglementation',
    related_terms: ['Normes sanitaires', 'Matières dangereuses']
  },
  {
    term: 'Matières dangereuses (ADR)',
    definition: 'Produits présentant un risque en raison de leurs propriétés chimiques ou physiques (inflammables, toxiques, corrosifs, etc.). Leur transport est strictement réglementé.',
    context_dom: 'Le transport de matières dangereuses vers les DOM suit des règles strictes. Seuls des transporteurs certifiés peuvent les acheminer, avec des procédures de sécurité renforcées.',
    category: 'reglementation',
    related_terms: ['Produits réglementés', 'Réglementation spécifique DOM'],
    pedagogical_note: 'ADR signifie "Accord relatif au transport international des marchandises Dangereuses par Route".'
  },

  // Catégorie GÉNÉRAL
  {
    term: 'Flux tendu',
    definition: 'Organisation logistique visant à réduire au maximum les stocks en synchronisant étroitement production, transport et distribution.',
    context_dom: 'Le flux tendu est plus difficile à appliquer dans les DOM en raison de l\'éloignement et des délais de transport. Il est souvent nécessaire de maintenir des stocks plus importants.',
    category: 'general',
    related_terms: ['Stock tampon', 'Flux massifié']
  },
  {
    term: 'Flux massifié',
    definition: 'Transport de grandes quantités de marchandises regroupées, généralement de manière régulière et planifiée.',
    context_dom: 'Les flux massifiés permettent d\'optimiser les transports vers les DOM en regroupant des volumes importants sur des rotations maritimes ou aériennes régulières.',
    category: 'general',
    related_terms: ['Mutualisation des flux', 'Fret maritime']
  },
  {
    term: 'Saisonnalité',
    definition: 'Variations récurrentes de la demande ou de l\'activité selon les périodes de l\'année (fêtes, vacances, récoltes, etc.).',
    context_dom: 'La saisonnalité influence les flux logistiques vers les DOM, notamment lors des périodes de fêtes, des vacances scolaires ou de la saison cyclonique.',
    category: 'general',
    related_terms: ['Flux massifié', 'Plateforme logistique']
  },
  {
    term: 'Rupture de charge',
    definition: 'Étape où des marchandises sont déchargées d\'un moyen de transport pour être rechargées sur un autre (changement de bateau, passage du maritime au routier, etc.).',
    context_dom: 'Les marchandises vers les DOM connaissent généralement plusieurs ruptures de charge : du camion au bateau en métropole, du bateau au camion dans le DOM, etc.',
    category: 'general',
    related_terms: ['Chaîne logistique', 'Port de transbordement', 'Terminal portuaire']
  }
];

/**
 * Récupère tous les termes du glossaire
 */
export function getAllTerms(): GlossaryTerm[] {
  return [...glossaryTerms];
}

/**
 * Récupère les termes par catégorie
 */
export function getTermsByCategory(category: string): GlossaryTerm[] {
  if (category === 'tous') {
    return getAllTerms();
  }
  return glossaryTerms.filter(term => term.category === category);
}

/**
 * Recherche de termes (insensible à la casse et aux accents)
 */
export function searchTerms(query: string): GlossaryTerm[] {
  if (!query || query.trim() === '') {
    return getAllTerms();
  }
  
  const normalizedQuery = query
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  
  return glossaryTerms.filter(term => {
    const normalizedTerm = term.term
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    
    const normalizedDefinition = term.definition
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    
    return normalizedTerm.includes(normalizedQuery) || 
           normalizedDefinition.includes(normalizedQuery);
  });
}

/**
 * Récupère un terme spécifique
 */
export function getTerm(termName: string): GlossaryTerm | null {
  return glossaryTerms.find(t => 
    t.term.toLowerCase() === termName.toLowerCase()
  ) || null;
}

/**
 * Récupère les catégories disponibles
 */
export function getCategories() {
  return [
    { id: 'tous', label: 'Tous', icon: '📚' },
    { id: 'transport', label: 'Transport', icon: '🚚' },
    { id: 'portuaire', label: 'Portuaire', icon: '🚢' },
    { id: 'aerien', label: 'Aérien', icon: '✈️' },
    { id: 'douane', label: 'Douane', icon: '🛃' },
    { id: 'stockage', label: 'Stockage', icon: '📦' },
    { id: 'distribution', label: 'Distribution', icon: '🚛' },
    { id: 'reglementation', label: 'Réglementation', icon: '📋' },
    { id: 'general', label: 'Général', icon: '🔧' }
  ];
}
