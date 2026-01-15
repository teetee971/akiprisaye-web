/**
 * Service d'explication des délais logistiques par catégorie de produits
 * 
 * Fournit des explications PÉDAGOGIQUES sur les facteurs logistiques généraux
 * pouvant influencer les délais d'acheminement de certains produits vers les DOM.
 * 
 * AUCUNE DONNÉE CHIFFRÉE
 * AUCUNE DURÉE PRÉCISE
 * AUCUN IMPACT PRIX
 * AUCUNE PRÉDICTION
 * 
 * Sources : Documentation logistique publique, guides professionnels
 */

export interface LogisticsExplanation {
  product_category: string;
  category_icon: string; // Pour l'affichage
  description: string;
  typical_logistics_path: string[];
  common_delay_factors: string[];
  transport_dependency: ('maritime' | 'aerien' | 'mixte')[];
  sensitivity_level: 'faible' | 'moyenne' | 'élevée';
  explanatory_note: string;
}

/**
 * Explications pédagogiques par catégorie de produits
 * Données QUALITATIVES uniquement
 */
const logisticsExplanations: LogisticsExplanation[] = [
  {
    product_category: 'Produits frais',
    category_icon: '🥬',
    description: 'Fruits, légumes, produits laitiers frais, viandes fraîches',
    typical_logistics_path: [
      'Production ou plateforme métropole',
      'Conditionnement réfrigéré',
      'Transport prioritaire (aérien ou maritime réfrigéré)',
      'Contrôles sanitaires',
      'Distribution locale réfrigérée'
    ],
    common_delay_factors: [
      'Nécessité de transport rapide ou en température contrôlée',
      'Priorisation selon disponibilité des vols ou navires équipés',
      'Contrôles sanitaires renforcés',
      'Dépendance aux conditions météorologiques',
      'Capacité limitée en transport réfrigéré'
    ],
    transport_dependency: ['aerien', 'maritime'],
    sensitivity_level: 'élevée',
    explanatory_note: 'Les produits frais nécessitent des conditions de transport spécifiques (chaîne du froid, rapidité) qui peuvent limiter les options logistiques disponibles. Leur acheminement dépend de la disponibilité de solutions adaptées.'
  },
  {
    product_category: 'Produits surgelés',
    category_icon: '🧊',
    description: 'Aliments surgelés, glaces, produits congelés',
    typical_logistics_path: [
      'Entrepôt frigorifique métropole',
      'Conteneur frigorifique',
      'Transport maritime avec maintien du froid',
      'Entrepôt frigorifique local',
      'Distribution en chaîne du froid continue'
    ],
    common_delay_factors: [
      'Nécessité de conteneurs frigorifiques spécifiques',
      'Groupage avec d\'autres produits surgelés',
      'Maintien obligatoire de la chaîne du froid',
      'Disponibilité limitée des équipements frigorifiques',
      'Planification par rotation pour optimiser le remplissage'
    ],
    transport_dependency: ['maritime'],
    sensitivity_level: 'élevée',
    explanatory_note: 'Le transport de surgelés nécessite des équipements spécialisés en nombre limité. Les envois sont souvent groupés pour optimiser l\'utilisation des conteneurs frigorifiques, ce qui peut allonger les délais d\'attente avant départ.'
  },
  {
    product_category: 'Produits volumineux',
    category_icon: '📦',
    description: 'Meubles, électroménager, matériaux de construction',
    typical_logistics_path: [
      'Entrepôt fabricant ou distributeur',
      'Plateforme de groupage',
      'Transport maritime en conteneur ou palette',
      'Port de destination',
      'Distribution locale par transporteur'
    ],
    common_delay_factors: [
      'Groupage nécessaire pour optimiser l\'espace de transport',
      'Attente d\'un volume suffisant avant expédition',
      'Priorisation du transport maritime pour raisons économiques',
      'Manipulation et stockage plus complexes',
      'Dépendance aux rotations maritimes régulières'
    ],
    transport_dependency: ['maritime'],
    sensitivity_level: 'moyenne',
    explanatory_note: 'Les produits volumineux sont généralement acheminés par voie maritime. Leur acheminement peut nécessiter d\'attendre un groupage suffisant ou une rotation maritime programmée, ce qui explique des délais variables.'
  },
  {
    product_category: 'Produits dangereux (ADR)',
    category_icon: '⚠️',
    description: 'Produits chimiques, batteries, aérosols, certains cosmétiques',
    typical_logistics_path: [
      'Entrepôt spécialisé certifié',
      'Conditionnement selon normes ADR',
      'Transport par opérateur certifié',
      'Contrôles réglementaires renforcés',
      'Stockage local certifié'
    ],
    common_delay_factors: [
      'Nécessité d\'emballages et étiquetages spécifiques',
      'Nombre limité de transporteurs certifiés',
      'Contrôles réglementaires approfondis',
      'Restrictions de transport (certains navires/avions uniquement)',
      'Documentation administrative renforcée'
    ],
    transport_dependency: ['maritime', 'aerien'],
    sensitivity_level: 'élevée',
    explanatory_note: 'Les produits classés dangereux selon la réglementation ADR nécessitent des procédures spécifiques, des transporteurs certifiés et des contrôles renforcés. Ces exigences de sécurité peuvent allonger les délais de traitement et limiter les options de transport.'
  },
  {
    product_category: 'Produits techniques / pièces détachées',
    category_icon: '🔧',
    description: 'Pièces automobiles, composants électroniques, équipements spécialisés',
    typical_logistics_path: [
      'Fabricant ou distributeur spécialisé',
      'Plateforme logistique',
      'Transport selon urgence (aérien si urgent, maritime sinon)',
      'Dédouanement',
      'Livraison finale vers client ou réparateur'
    ],
    common_delay_factors: [
      'Commande à la demande (pas de stock local)',
      'Provenance internationale variable',
      'Choix du transport selon l\'urgence',
      'Passage par plateformes de distribution spécialisées',
      'Volume unitaire faible (attente de groupage)'
    ],
    transport_dependency: ['aerien', 'maritime', 'mixte'],
    sensitivity_level: 'moyenne',
    explanatory_note: 'Les pièces techniques sont souvent commandées à la demande et proviennent de réseaux de distribution spécialisés. Les délais dépendent du choix du mode de transport (aérien pour urgence, maritime pour optimisation) et de la disponibilité chez le fournisseur.'
  },
  {
    product_category: 'Produits saisonniers',
    category_icon: '🎄',
    description: 'Décorations, articles festifs, équipements saisonniers',
    typical_logistics_path: [
      'Fabricant (souvent Asie)',
      'Importateur métropole',
      'Planification anticipée par saison',
      'Transport maritime groupé',
      'Distribution locale avant la période'
    ],
    common_delay_factors: [
      'Importation en grande quantité sur période concentrée',
      'Saturation des flux logistiques en haute saison',
      'Planification anticipée nécessaire',
      'Priorisation des volumes importants',
      'Concurrence avec autres flux saisonniers'
    ],
    transport_dependency: ['maritime'],
    sensitivity_level: 'moyenne',
    explanatory_note: 'Les produits saisonniers sont importés en volumes importants sur des périodes concentrées. Cette saisonnalité peut créer des saturations ponctuelles des chaînes logistiques, particulièrement lors des périodes de fêtes ou de rentrée scolaire.'
  },
  {
    product_category: 'Produits à faible rotation',
    category_icon: '📚',
    description: 'Livres spécialisés, articles de niche, collections limitées',
    typical_logistics_path: [
      'Éditeur ou distributeur spécialisé',
      'Plateforme de distribution',
      'Groupage avec autres commandes',
      'Transport maritime',
      'Livraison finale'
    ],
    common_delay_factors: [
      'Pas de stock local (commande à la demande)',
      'Attente de groupage pour optimiser le transport',
      'Volume insuffisant pour justifier un envoi dédié',
      'Passage par plusieurs intermédiaires',
      'Priorisation des produits à forte rotation'
    ],
    transport_dependency: ['maritime'],
    sensitivity_level: 'faible',
    explanatory_note: 'Les produits à faible demande ne sont généralement pas stockés localement. Leur acheminement nécessite une commande spécifique et un groupage avec d\'autres produits, ce qui peut allonger les délais mais permet de maintenir leur disponibilité.'
  },
  {
    product_category: 'Produits pharmaceutiques',
    category_icon: '💊',
    description: 'Médicaments, dispositifs médicaux, produits de santé',
    typical_logistics_path: [
      'Laboratoire ou grossiste pharmaceutique',
      'Transport sous température contrôlée si nécessaire',
      'Contrôles réglementaires stricts',
      'Agrément sanitaire',
      'Distribution via circuit pharmaceutique'
    ],
    common_delay_factors: [
      'Contrôles réglementaires renforcés',
      'Respect strict des conditions de transport',
      'Circuit de distribution spécialisé et sécurisé',
      'Traçabilité complète obligatoire',
      'Priorisation selon urgence sanitaire'
    ],
    transport_dependency: ['aerien', 'maritime'],
    sensitivity_level: 'élevée',
    explanatory_note: 'Les produits de santé suivent des circuits logistiques spécifiques avec des exigences réglementaires strictes. Ces normes de sécurité et de traçabilité, essentielles pour la santé publique, peuvent influencer les délais d\'acheminement.'
  }
];

/**
 * Facteurs généraux de délai (transversaux)
 */
export const generalDelayFactors = [
  {
    factor: 'Priorisation du fret',
    explanation: 'Dans un même transport, certains produits peuvent être prioritaires (périssables, urgents) sur d\'autres. Cette priorisation est un choix logistique standard.',
    applies_to: ['tous produits']
  },
  {
    factor: 'Contraintes de stockage',
    explanation: 'Les capacités de stockage (notamment frigorifique) sont limitées. Les flux sont organisés pour optimiser l\'utilisation de ces espaces.',
    applies_to: ['frais', 'surgelés', 'volumineux']
  },
  {
    factor: 'Normes spécifiques',
    explanation: 'Certains produits doivent respecter des normes de transport particulières (température, sécurité, sanitaires) qui nécessitent des équipements et procédures spécialisés.',
    applies_to: ['frais', 'surgelés', 'dangereux', 'pharmaceutiques']
  },
  {
    factor: 'Mutualisation des flux',
    explanation: 'Pour optimiser l\'utilisation des transports, les produits peuvent être groupés. Cela nécessite parfois d\'attendre un volume suffisant avant expédition.',
    applies_to: ['volumineux', 'faible rotation', 'pièces détachées']
  },
  {
    factor: 'Dépendance à un seul mode de transport',
    explanation: 'Certains produits ne peuvent être acheminés que par un mode de transport spécifique (maritime pour volumineux, aérien pour ultra-frais), ce qui limite les alternatives.',
    applies_to: ['volumineux', 'frais', 'surgelés']
  },
  {
    factor: 'Contraintes locales',
    explanation: 'Les infrastructures locales (portuaires, aéroportuaires, routières, frigorifiques) ont des capacités définies qui influencent l\'organisation des flux.',
    applies_to: ['tous produits']
  }
];

/**
 * Récupère toutes les explications
 */
export function getAllExplanations(): LogisticsExplanation[] {
  return [...logisticsExplanations];
}

/**
 * Récupère une explication par catégorie
 */
export function getExplanationByCategory(category: string): LogisticsExplanation | null {
  return logisticsExplanations.find(exp => exp.product_category === category) || null;
}

/**
 * Récupère les facteurs généraux
 */
export function getGeneralDelayFactors() {
  return [...generalDelayFactors];
}
