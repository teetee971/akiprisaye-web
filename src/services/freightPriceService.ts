/**
 * Freight Price Service
 * 
 * Service de comparaison des coûts de fret / transport de conteneurs
 * Données simulées structurées pour démonstration
 * 
 * IMPORTANT:
 * - Données publiques/professionnelles uniquement
 * - Sources: Ports, autorités maritimes, rapports logistiques, opérateurs publics
 * - Aucun tracking utilisateur
 * - Aucune affiliation
 * - Aucune estimation personnalisée
 * - Usage informatif et pédagogique
 */

export interface FreightPrice {
  operateurLogistique: string;
  typeTransport: string;       // "Maritime", "Roulier", "Conteneur"
  typeConteneur: string;        // "20 pieds", "40 pieds", "Palette", "Vrac"
  portDepart: string;
  portArrivee: string;
  prixEstime: number;           // Prix en €
  devise: string;               // "EUR"
  source: string;
  dateReleve: string;
}

export interface FreightPriceSearchParams {
  portDepart: string;
  portArrivee: string;
  typeTransport?: string;
}

/**
 * Données simulées structurées
 * Sources: Données publiques (ports, autorités maritimes, rapports logistiques)
 */
const SIMULATED_DATA: FreightPrice[] = [
  // Métropole → Guadeloupe
  {
    operateurLogistique: 'CMA CGM',
    typeTransport: 'Conteneur',
    typeConteneur: '20 pieds',
    portDepart: 'Le Havre',
    portArrivee: 'Pointe-à-Pitre',
    prixEstime: 2850,
    devise: 'EUR',
    source: 'Tarifs publics ports - Observation 2026',
    dateReleve: '2026-01-05',
  },
  {
    operateurLogistique: 'CMA CGM',
    typeTransport: 'Conteneur',
    typeConteneur: '40 pieds',
    portDepart: 'Le Havre',
    portArrivee: 'Pointe-à-Pitre',
    prixEstime: 4200,
    devise: 'EUR',
    source: 'Tarifs publics ports - Observation 2026',
    dateReleve: '2026-01-05',
  },
  {
    operateurLogistique: 'Marfret',
    typeTransport: 'Conteneur',
    typeConteneur: '20 pieds',
    portDepart: 'Le Havre',
    portArrivee: 'Pointe-à-Pitre',
    prixEstime: 2950,
    devise: 'EUR',
    source: 'Observation publique',
    dateReleve: '2026-01-04',
  },
  {
    operateurLogistique: 'Marfret',
    typeTransport: 'Roulier',
    typeConteneur: 'Palette',
    portDepart: 'Le Havre',
    portArrivee: 'Pointe-à-Pitre',
    prixEstime: 850,
    devise: 'EUR',
    source: 'Observation publique',
    dateReleve: '2026-01-04',
  },
  
  // Métropole → Martinique
  {
    operateurLogistique: 'CMA CGM',
    typeTransport: 'Conteneur',
    typeConteneur: '20 pieds',
    portDepart: 'Le Havre',
    portArrivee: 'Fort-de-France',
    prixEstime: 2900,
    devise: 'EUR',
    source: 'Tarifs publics ports - Observation 2026',
    dateReleve: '2026-01-05',
  },
  {
    operateurLogistique: 'CMA CGM',
    typeTransport: 'Conteneur',
    typeConteneur: '40 pieds',
    portDepart: 'Le Havre',
    portArrivee: 'Fort-de-France',
    prixEstime: 4300,
    devise: 'EUR',
    source: 'Tarifs publics ports - Observation 2026',
    dateReleve: '2026-01-05',
  },
  {
    operateurLogistique: 'Marfret',
    typeTransport: 'Conteneur',
    typeConteneur: '20 pieds',
    portDepart: 'Le Havre',
    portArrivee: 'Fort-de-France',
    prixEstime: 3000,
    devise: 'EUR',
    source: 'Observation publique',
    dateReleve: '2026-01-04',
  },
  {
    operateurLogistique: 'Marfret',
    typeTransport: 'Roulier',
    typeConteneur: 'Palette',
    portDepart: 'Le Havre',
    portArrivee: 'Fort-de-France',
    prixEstime: 870,
    devise: 'EUR',
    source: 'Observation publique',
    dateReleve: '2026-01-04',
  },
  
  // Métropole → Guyane
  {
    operateurLogistique: 'CMA CGM',
    typeTransport: 'Conteneur',
    typeConteneur: '20 pieds',
    portDepart: 'Le Havre',
    portArrivee: 'Dégrad des Cannes',
    prixEstime: 3150,
    devise: 'EUR',
    source: 'Tarifs publics ports - Observation 2026',
    dateReleve: '2026-01-05',
  },
  {
    operateurLogistique: 'CMA CGM',
    typeTransport: 'Conteneur',
    typeConteneur: '40 pieds',
    portDepart: 'Le Havre',
    portArrivee: 'Dégrad des Cannes',
    prixEstime: 4650,
    devise: 'EUR',
    source: 'Tarifs publics ports - Observation 2026',
    dateReleve: '2026-01-05',
  },
  {
    operateurLogistique: 'Marfret',
    typeTransport: 'Conteneur',
    typeConteneur: '20 pieds',
    portDepart: 'Le Havre',
    portArrivee: 'Dégrad des Cannes',
    prixEstime: 3250,
    devise: 'EUR',
    source: 'Observation publique',
    dateReleve: '2026-01-04',
  },
  
  // Métropole → Réunion
  {
    operateurLogistique: 'CMA CGM',
    typeTransport: 'Conteneur',
    typeConteneur: '20 pieds',
    portDepart: 'Marseille',
    portArrivee: 'Port-Réunion',
    prixEstime: 3850,
    devise: 'EUR',
    source: 'Tarifs publics ports - Observation 2026',
    dateReleve: '2026-01-06',
  },
  {
    operateurLogistique: 'CMA CGM',
    typeTransport: 'Conteneur',
    typeConteneur: '40 pieds',
    portDepart: 'Marseille',
    portArrivee: 'Port-Réunion',
    prixEstime: 5800,
    devise: 'EUR',
    source: 'Tarifs publics ports - Observation 2026',
    dateReleve: '2026-01-06',
  },
  {
    operateurLogistique: 'MSC',
    typeTransport: 'Conteneur',
    typeConteneur: '20 pieds',
    portDepart: 'Marseille',
    portArrivee: 'Port-Réunion',
    prixEstime: 3950,
    devise: 'EUR',
    source: 'Observation publique',
    dateReleve: '2026-01-05',
  },
  {
    operateurLogistique: 'MSC',
    typeTransport: 'Conteneur',
    typeConteneur: '40 pieds',
    portDepart: 'Marseille',
    portArrivee: 'Port-Réunion',
    prixEstime: 5950,
    devise: 'EUR',
    source: 'Observation publique',
    dateReleve: '2026-01-05',
  },
  
  // Inter-DOM: Guadeloupe ↔ Martinique
  {
    operateurLogistique: 'CMA CGM Antilles',
    typeTransport: 'Conteneur',
    typeConteneur: '20 pieds',
    portDepart: 'Pointe-à-Pitre',
    portArrivee: 'Fort-de-France',
    prixEstime: 680,
    devise: 'EUR',
    source: 'Tarifs publics inter-îles - Observation 2026',
    dateReleve: '2026-01-05',
  },
  {
    operateurLogistique: 'Marfret Antilles',
    typeTransport: 'Roulier',
    typeConteneur: 'Palette',
    portDepart: 'Pointe-à-Pitre',
    portArrivee: 'Fort-de-France',
    prixEstime: 210,
    devise: 'EUR',
    source: 'Observation publique',
    dateReleve: '2026-01-04',
  },
  {
    operateurLogistique: 'CMA CGM Antilles',
    typeTransport: 'Conteneur',
    typeConteneur: '20 pieds',
    portDepart: 'Fort-de-France',
    portArrivee: 'Pointe-à-Pitre',
    prixEstime: 690,
    devise: 'EUR',
    source: 'Tarifs publics inter-îles - Observation 2026',
    dateReleve: '2026-01-05',
  },
];

/**
 * Recherche des coûts de fret
 * Tri par: 1. Prix, 2. Date de relevé
 */
export function searchFreightPrices(params: FreightPriceSearchParams): FreightPrice[] {
  let results = SIMULATED_DATA.filter(
    (price) => 
      price.portDepart === params.portDepart && 
      price.portArrivee === params.portArrivee
  );

  // Filtrer par type de transport si spécifié
  if (params.typeTransport) {
    results = results.filter((price) => price.typeTransport === params.typeTransport);
  }

  // Tri par: 1. Prix (croissant), 2. Date de relevé (décroissant)
  results.sort((a, b) => {
    if (a.prixEstime !== b.prixEstime) {
      return a.prixEstime - b.prixEstime;
    }
    return new Date(b.dateReleve).getTime() - new Date(a.dateReleve).getTime();
  });

  return results;
}

/**
 * Obtenir les ports disponibles
 */
export function getPorts(): { departure: string[]; arrival: string[] } {
  const departurePorts = new Set<string>();
  const arrivalPorts = new Set<string>();
  
  SIMULATED_DATA.forEach((price) => {
    departurePorts.add(price.portDepart);
    arrivalPorts.add(price.portArrivee);
  });
  
  return {
    departure: Array.from(departurePorts).sort(),
    arrival: Array.from(arrivalPorts).sort(),
  };
}

/**
 * Obtenir les types de transport disponibles
 */
export function getTransportTypes(): string[] {
  return ['Maritime', 'Roulier', 'Conteneur'];
}

/**
 * Vérifier si la route est inter-DOM
 */
export function isInterDOM(portDepart: string, portArrivee: string): boolean {
  const domPorts = ['Pointe-à-Pitre', 'Fort-de-France', 'Dégrad des Cannes', 'Port-Réunion'];
  return domPorts.includes(portDepart) && domPorts.includes(portArrivee);
}
