/**
 * FAQ Étendue - A KI PRI SA YÉ v1.6.0
 * Questions / Réponses du public lambda à l'institutionnel
 * ~20 Q/R couvrant tous les cas d'usage
 */

export interface FAQItem {
  id: string;
  category: 'general' | 'abonnements' | 'donnees' | 'technique' | 'institutionnel' | 'journalist';
  question: string;
  answer: string;
  tags: string[];
}

export const FAQ_DATA: FAQItem[] = [
  // GÉNÉRAL (Public lambda)
  {
    id: 'faq-001',
    category: 'general',
    question: 'Qu\'est-ce que A KI PRI SA YÉ ?',
    answer: 'A KI PRI SA YÉ est un observatoire citoyen indépendant qui compare les prix des produits et services dans les territoires ultramarins (DOM, ROM, COM). Le service repose uniquement sur des données observées, sourcées et vérifiables, sans publicité ni recommandations commerciales.',
    tags: ['présentation', 'observatoire', 'mission']
  },
  {
    id: 'faq-002',
    category: 'general',
    question: 'Pourquoi une inscription est-elle obligatoire ?',
    answer: 'L\'inscription gratuite garantit la traçabilité des usages, la fiabilité statistique et la protection des données publiques. Elle permet de lutter contre les abus et d\'assurer un service de qualité pour tous.',
    tags: ['inscription', 'compte', 'accès']
  },
  {
    id: 'faq-003',
    category: 'general',
    question: 'Le service est-il vraiment gratuit ?',
    answer: 'Oui. L\'accès public permet de consulter gratuitement les comparateurs, les prix observés et l\'historique simple. L\'inscription est gratuite et sans engagement.',
    tags: ['gratuit', 'prix', 'accès']
  },
  {
    id: 'faq-004',
    category: 'general',
    question: 'D\'où viennent les données ?',
    answer: 'Toutes les données proviennent de sources officielles publiques : INSEE, OPMR, DGCCRF, data.gouv.fr. Elles sont observées, datées et sourcées. Aucune donnée n\'est estimée ou simulée.',
    tags: ['sources', 'données', 'fiabilité']
  },
  {
    id: 'faq-005',
    category: 'general',
    question: 'Mes données personnelles sont-elles exploitées ?',
    answer: 'Non. Aucune donnée personnelle n\'est revendue, utilisée à des fins publicitaires ou commerciales. Seuls l\'email et le niveau d\'accès sont enregistrés pour la facturation éventuelle. Aucun tracking utilisateur.',
    tags: ['rgpd', 'confidentialité', 'données personnelles']
  },

  // ABONNEMENTS (Citoyen)
  {
    id: 'faq-006',
    category: 'abonnements',
    question: 'Puis-je accéder gratuitement aux données ?',
    answer: 'Oui. L\'inscription gratuite permet d\'accéder aux comparateurs de base, à l\'historique simple et aux données publiques en lecture seule.',
    tags: ['gratuit', 'accès', 'données']
  },
  {
    id: 'faq-007',
    category: 'abonnements',
    question: 'Pourquoi certains accès sont payants ?',
    answer: 'Les contributions financent l\'infrastructure, la maintenance, l\'agrégation des données et l\'ouverture des données à long terme. Le service reste sans publicité et indépendant grâce à ces contributions.',
    tags: ['abonnement', 'tarifs', 'financement']
  },
  {
    id: 'faq-008',
    category: 'abonnements',
    question: 'Quelle est la différence entre Citoyen et Professionnel ?',
    answer: 'Citoyen (3,99€/mois) donne accès au scan EAN illimité, OCR ingrédients, fiche produit enrichie, alertes prix locales et historique personnel. Professionnel (19€/mois) ajoute les comparaisons temporelles multi-marques, historique long (12-36 mois), exports CSV/JSON et agrégations territoriales.',
    tags: ['citoyen', 'professionnel', 'différences']
  },
  {
    id: 'faq-009',
    category: 'abonnements',
    question: 'Comment annuler mon abonnement ?',
    answer: 'En 1 clic depuis votre compte. Aucune justification requise. Aucune relance commerciale. Votre accès reste actif jusqu\'à la fin de la période payée.',
    tags: ['résiliation', 'annulation', 'abonnement']
  },
  {
    id: 'faq-010',
    category: 'abonnements',
    question: 'Le paiement est-il activé ?',
    answer: 'Non, le paiement n\'est pas encore activé. L\'accès aux niveaux Citoyen+ et Pro se fait actuellement sur demande ou par convention. Les tarifs affichés sont indicatifs.',
    tags: ['paiement', 'facturation', 'activation']
  },

  // DONNÉES (Technique / Chercheurs)
  {
    id: 'faq-011',
    category: 'donnees',
    question: 'Comment sont vérifiées les données ?',
    answer: 'Toutes les données proviennent de sources officielles (INSEE, OPMR, DGCCRF, data.gouv.fr). La méthodologie est publique et auditable. Chaque donnée est datée et sourcée.',
    tags: ['vérification', 'méthodologie', 'audit']
  },
  {
    id: 'faq-012',
    category: 'donnees',
    question: 'Les données sont-elles en temps réel ?',
    answer: 'Les données sont mises à jour régulièrement selon la fréquence de publication des sources officielles. L\'horodatage de la dernière mise à jour est toujours visible.',
    tags: ['mise à jour', 'fréquence', 'temps réel']
  },
  {
    id: 'faq-013',
    category: 'donnees',
    question: 'Puis-je exporter les données ?',
    answer: 'Oui, selon votre niveau d\'accès. Citoyen+ permet des exports basiques. Pro et Institution permettent des exports CSV/JSON complets avec méthodologie.',
    tags: ['export', 'téléchargement', 'données']
  },
  {
    id: 'faq-014',
    category: 'donnees',
    question: 'Y a-t-il une API disponible ?',
    answer: 'L\'API open-data est réservée aux licences institutionnelles pour garantir un usage responsable et traçable. Contactez-nous pour plus d\'informations.',
    tags: ['api', 'développeurs', 'intégration']
  },
  {
    id: 'faq-015',
    category: 'donnees',
    question: 'Quelle est la couverture géographique ?',
    answer: 'Le service couvre tous les territoires ultramarins : DOM (Départements d\'Outre-Mer), ROM (Régions d\'Outre-Mer) et COM (Collectivités d\'Outre-Mer).',
    tags: ['territoires', 'couverture', 'géographie']
  },

  // TECHNIQUE
  {
    id: 'faq-016',
    category: 'technique',
    question: 'Le service fonctionne-t-il sur mobile ?',
    answer: 'Oui, le service est optimisé mobile-first et fonctionne sur tous les appareils (smartphone, tablette, ordinateur).',
    tags: ['mobile', 'responsive', 'compatibilité']
  },
  {
    id: 'faq-017',
    category: 'technique',
    question: 'Que faire en cas de problème technique ?',
    answer: 'Contactez-nous via la page Contact. Pour les institutions et partenaires, un support technique dédié est disponible.',
    tags: ['support', 'aide', 'problème']
  },

  // INSTITUTIONNEL
  {
    id: 'faq-018',
    category: 'institutionnel',
    question: 'Les institutions ont-elles accès à des données différentes ?',
    answer: 'Non. Les données sont identiques pour tous. Les licences institutionnelles donnent accès à des formats, outils et exports supplémentaires (API, rapports), mais jamais à des données exclusives.',
    tags: ['institution', 'données', 'équité']
  },
  {
    id: 'faq-019',
    category: 'institutionnel',
    question: 'Comment obtenir une licence institutionnelle ?',
    answer: 'Contactez-nous via le formulaire dédié. Une convention sera établie selon vos besoins (collectivité, université, centre de recherche, administration).',
    tags: ['institution', 'licence', 'convention']
  },
  {
    id: 'faq-020',
    category: 'institutionnel',
    question: 'Le service est-il compatible INSEE / Eurostat ?',
    answer: 'Oui. Les exports institutionnels sont normalisés selon les standards INSEE et Eurostat. La méthodologie est conforme aux exigences de traçabilité et d\'auditabilité du secteur public.',
    tags: ['insee', 'eurostat', 'compatibilité', 'standards']
  },

  // QUESTIONS JOURNALISTES & RÉPONSES OFFICIELLES
  {
    id: 'faq-j01',
    category: 'journalist',
    question: 'Quel est l\'objectif réel de votre outil ?',
    answer: 'L\'objectif est de donner aux citoyens une information pratique et locale sur l\'accès aux commerces : localisation, distance et temps estimé pour s\'y rendre. L\'outil aide à se repérer, pas à orienter les choix économiques.',
    tags: ['objectif', 'mission', 'information']
  },
  {
    id: 'faq-j02',
    category: 'journalist',
    question: 'Est-ce que vous recommandez un magasin plutôt qu\'un autre ?',
    answer: 'Non. L\'outil ne recommande aucun commerce. Il affiche uniquement des données factuelles (distance, temps estimé, localisation). Le choix final appartient toujours à l\'utilisateur.',
    tags: ['recommandation', 'neutralité', 'choix']
  },
  {
    id: 'faq-j03',
    category: 'journalist',
    question: 'Comment sont calculés les temps de trajet ? Sont-ils fiables ?',
    answer: 'Les temps sont des estimations basées sur la distance géographique et des vitesses moyennes standards. Ils ne tiennent pas compte du trafic, des embouteillages ou des conditions réelles. Ils sont fournis à titre indicatif uniquement.',
    tags: ['calcul', 'trajet', 'fiabilité', 'estimation']
  },
  {
    id: 'faq-j04',
    category: 'journalist',
    question: 'Collectez-vous la position GPS des utilisateurs ?',
    answer: 'Non. La position est utilisée uniquement de manière temporaire par le navigateur, avec l\'accord explicite de l\'utilisateur. Aucune donnée GPS n\'est stockée, transmise ou exploitée.',
    tags: ['gps', 'localisation', 'vie privée', 'rgpd']
  },
  {
    id: 'faq-j05',
    category: 'journalist',
    question: 'Est-ce que certaines enseignes vous paient pour apparaître ?',
    answer: 'Non. Il n\'y a ni publicité, ni mise en avant payante, ni partenariat commercial à ce stade.',
    tags: ['publicité', 'partenariat', 'indépendance']
  },
  {
    id: 'faq-j06',
    category: 'journalist',
    question: 'Pourquoi cet outil est utile concrètement ?',
    answer: 'Il permet de comparer l\'accessibilité réelle des commerces autour de soi. Pour beaucoup de personnes, la distance et le temps sont aussi importants que le prix.',
    tags: ['utilité', 'accessibilité', 'pratique']
  },
  {
    id: 'faq-j07',
    category: 'journalist',
    question: 'Est-ce un comparateur de prix ?',
    answer: 'Pas actuellement. Aujourd\'hui, il s\'agit d\'un outil d\'observation et de navigation. Toute future évolution sera clairement annoncée et séparée.',
    tags: ['comparateur', 'prix', 'évolution']
  },
  {
    id: 'faq-j08',
    category: 'journalist',
    question: 'À qui s\'adresse ce projet ?',
    answer: 'À tous : particuliers, familles, personnes sans voiture, seniors, mais aussi collectivités et acteurs locaux qui veulent mieux comprendre l\'accessibilité commerciale.',
    tags: ['public', 'cible', 'inclusivité']
  },
  {
    id: 'faq-j09',
    category: 'journalist',
    question: 'Qui est derrière le projet ?',
    answer: 'Un projet indépendant, développé localement, avec une approche citoyenne et pragmatique. L\'objectif est l\'utilité publique avant toute logique commerciale.',
    tags: ['équipe', 'indépendance', 'citoyen']
  },
  {
    id: 'faq-j10',
    category: 'journalist',
    question: 'Quel est le risque principal que vous avez voulu éviter ?',
    answer: 'Le risque de manipulation ou de recommandation déguisée. C\'est pour cela que nous avons volontairement limité l\'outil à des données neutres et vérifiables.',
    tags: ['risque', 'éthique', 'transparence', 'neutralité']
  }
];

/**
 * Get FAQ items by category
 */
export const getFAQByCategory = (category: FAQItem['category']): FAQItem[] => {
  return FAQ_DATA.filter(item => item.category === category);
};

/**
 * Search FAQ items
 */
export const searchFAQ = (query: string): FAQItem[] => {
  const lowerQuery = query.toLowerCase();
  return FAQ_DATA.filter(
    item =>
      item.question.toLowerCase().includes(lowerQuery) ||
      item.answer.toLowerCase().includes(lowerQuery) ||
      item.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
};

/**
 * Get FAQ by ID
 */
export const getFAQById = (id: string): FAQItem | undefined => {
  return FAQ_DATA.find(item => item.id === id);
};

export default FAQ_DATA;
