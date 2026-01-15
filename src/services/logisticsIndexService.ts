/**
 * Service de l'Indice Logistique DOM (ILD)
 * 
 * Fournit des indicateurs DESCRIPTIFS sur les contraintes structurelles
 * de l'acheminement des marchandises vers les territoires ultramarins.
 * 
 * AUCUN CALCUL DE PRIX
 * AUCUN SCORE GLOBAL
 * AUCUNE RECOMMANDATION
 * 
 * Sources : Rapports publics, ports autonomes, observatoires économiques
 */

export interface TerritoryLogisticsProfile {
  territory: 'GP' | 'MQ' | 'GF' | 'RE' | 'YT';
  territoryName: string;
  distance_metropole: 'courte' | 'moyenne' | 'longue';
  dependance_maritime: 'faible' | 'moyenne' | 'forte';
  dependance_aerienne: 'faible' | 'moyenne' | 'forte';
  capacite_portuaire: 'limitée' | 'standard' | 'élevée';
  capacite_aeroportuaire: 'limitée' | 'standard' | 'élevée';
  ruptures_charge: number; // Nombre de points de rupture (sans coût)
  delais_typiques: 'courts' | 'moyens' | 'longs';
  exposition_risques: string[]; // Météo, grèves, saturation, etc.
  sources_publiques: string[];
  date_reference: string;
}

export interface LogisticsFactorDescription {
  factorName: string;
  description: string;
  levelLabel: string;
  explanation: string;
}

/**
 * Données QUALITATIVES sur les contraintes logistiques des DOM
 */
const logisticsProfiles: TerritoryLogisticsProfile[] = [
  {
    territory: 'GP',
    territoryName: 'Guadeloupe',
    distance_metropole: 'longue',
    dependance_maritime: 'forte',
    dependance_aerienne: 'moyenne',
    capacite_portuaire: 'standard',
    capacite_aeroportuaire: 'standard',
    ruptures_charge: 3,
    delais_typiques: 'longs',
    exposition_risques: [
      'Cyclones (juin-novembre)',
      'Saturation portuaire ponctuelle',
      'Dépendance imports métropole'
    ],
    sources_publiques: [
      'Port autonome de Guadeloupe',
      'CCI Îles de Guadeloupe',
      'Observatoire des prix et des revenus'
    ],
    date_reference: '2024-12-01'
  },
  {
    territory: 'MQ',
    territoryName: 'Martinique',
    distance_metropole: 'longue',
    dependance_maritime: 'forte',
    dependance_aerienne: 'moyenne',
    capacite_portuaire: 'standard',
    capacite_aeroportuaire: 'standard',
    ruptures_charge: 3,
    delais_typiques: 'longs',
    exposition_risques: [
      'Cyclones (juin-novembre)',
      'Relief montagneux (distribution)',
      'Dépendance imports métropole'
    ],
    sources_publiques: [
      'Grand Port Maritime de Martinique',
      'CCI Martinique',
      'Observatoire des prix et des marges'
    ],
    date_reference: '2024-12-01'
  },
  {
    territory: 'GF',
    territoryName: 'Guyane',
    distance_metropole: 'longue',
    dependance_maritime: 'forte',
    dependance_aerienne: 'forte',
    capacite_portuaire: 'limitée',
    capacite_aeroportuaire: 'limitée',
    ruptures_charge: 4,
    delais_typiques: 'longs',
    exposition_risques: [
      'Fleuve Maroni (accès difficile)',
      'Forêt amazonienne (distribution complexe)',
      'Infrastructures routières limitées',
      'Dépendance imports métropole et Suriname'
    ],
    sources_publiques: [
      'Grand Port Maritime de Guyane',
      'CCI de Guyane',
      'Direction des entreprises (DIECCTE)'
    ],
    date_reference: '2024-12-01'
  },
  {
    territory: 'RE',
    territoryName: 'La Réunion',
    distance_metropole: 'longue',
    dependance_maritime: 'forte',
    dependance_aerienne: 'moyenne',
    capacite_portuaire: 'standard',
    capacite_aeroportuaire: 'élevée',
    ruptures_charge: 3,
    delais_typiques: 'longs',
    exposition_risques: [
      'Cyclones (novembre-avril)',
      'Éloignement extrême (9 200 km)',
      'Relief volcanique (distribution)',
      'Dépendance imports métropole et Asie'
    ],
    sources_publiques: [
      'Grand Port Maritime de La Réunion',
      'CCI Réunion',
      'Observatoire des prix et des revenus'
    ],
    date_reference: '2024-12-01'
  },
  {
    territory: 'YT',
    territoryName: 'Mayotte',
    distance_metropole: 'longue',
    dependance_maritime: 'forte',
    dependance_aerienne: 'forte',
    capacite_portuaire: 'limitée',
    capacite_aeroportuaire: 'limitée',
    ruptures_charge: 4,
    delais_typiques: 'longs',
    exposition_risques: [
      'Cyclones (novembre-avril)',
      'Infrastructures en développement',
      'Capacité portuaire limitée',
      'Éloignement extrême (8 000 km)',
      'Insularité renforcée'
    ],
    sources_publiques: [
      'Port de Longoni',
      'CCI de Mayotte',
      'Direction des finances publiques'
    ],
    date_reference: '2024-12-01'
  }
];

/**
 * Descriptions pédagogiques des facteurs logistiques
 */
export const factorDescriptions: Record<string, Record<string, LogisticsFactorDescription>> = {
  distance_metropole: {
    courte: {
      factorName: 'Distance à la métropole',
      description: 'Éloignement géographique',
      levelLabel: 'Courte (< 2 000 km)',
      explanation: 'Proximité relative facilitant les échanges'
    },
    moyenne: {
      factorName: 'Distance à la métropole',
      description: 'Éloignement géographique',
      levelLabel: 'Moyenne (2 000 - 5 000 km)',
      explanation: 'Éloignement modéré impactant les délais'
    },
    longue: {
      factorName: 'Distance à la métropole',
      description: 'Éloignement géographique',
      levelLabel: 'Longue (> 5 000 km)',
      explanation: 'Éloignement significatif allongeant les délais de transport'
    }
  },
  dependance_maritime: {
    faible: {
      factorName: 'Dépendance au maritime',
      description: 'Part du fret acheminé par voie maritime',
      levelLabel: 'Faible',
      explanation: 'Alternatives terrestres ou aériennes significatives'
    },
    moyenne: {
      factorName: 'Dépendance au maritime',
      description: 'Part du fret acheminé par voie maritime',
      levelLabel: 'Moyenne',
      explanation: 'Transport maritime important mais pas exclusif'
    },
    forte: {
      factorName: 'Dépendance au maritime',
      description: 'Part du fret acheminé par voie maritime',
      levelLabel: 'Forte',
      explanation: 'Essentiel pour produits lourds et non périssables'
    }
  },
  dependance_aerienne: {
    faible: {
      factorName: 'Dépendance au fret aérien',
      description: 'Part du fret acheminé par voie aérienne',
      levelLabel: 'Faible',
      explanation: 'Utilisé uniquement pour urgences'
    },
    moyenne: {
      factorName: 'Dépendance au fret aérien',
      description: 'Part du fret acheminé par voie aérienne',
      levelLabel: 'Moyenne',
      explanation: 'Important pour produits frais et urgents'
    },
    forte: {
      factorName: 'Dépendance au fret aérien',
      description: 'Part du fret acheminé par voie aérienne',
      levelLabel: 'Forte',
      explanation: 'Crucial pour produits sensibles et urgences'
    }
  },
  capacite_portuaire: {
    limitée: {
      factorName: 'Capacité portuaire',
      description: 'Infrastructure portuaire disponible',
      levelLabel: 'Limitée',
      explanation: 'Infrastructures en développement ou contraintes'
    },
    standard: {
      factorName: 'Capacité portuaire',
      description: 'Infrastructure portuaire disponible',
      levelLabel: 'Standard',
      explanation: 'Port fonctionnel adapté aux besoins courants'
    },
    élevée: {
      factorName: 'Capacité portuaire',
      description: 'Infrastructure portuaire disponible',
      levelLabel: 'Élevée',
      explanation: 'Port moderne avec capacités importantes'
    }
  },
  capacite_aeroportuaire: {
    limitée: {
      factorName: 'Capacité aéroportuaire',
      description: 'Infrastructure aéroportuaire disponible',
      levelLabel: 'Limitée',
      explanation: 'Capacité de traitement du fret contrainte'
    },
    standard: {
      factorName: 'Capacité aéroportuaire',
      description: 'Infrastructure aéroportuaire disponible',
      levelLabel: 'Standard',
      explanation: 'Aéroport fonctionnel pour fret courant'
    },
    élevée: {
      factorName: 'Capacité aéroportuaire',
      description: 'Infrastructure aéroportuaire disponible',
      levelLabel: 'Élevée',
      explanation: 'Aéroport moderne avec forte capacité fret'
    }
  },
  delais_typiques: {
    courts: {
      factorName: 'Délais typiques',
      description: 'Durée habituelle d\'acheminement',
      levelLabel: 'Courts (< 10 jours)',
      explanation: 'Acheminement rapide depuis la métropole'
    },
    moyens: {
      factorName: 'Délais typiques',
      description: 'Durée habituelle d\'acheminement',
      levelLabel: 'Moyens (10-20 jours)',
      explanation: 'Délai standard pour transport maritime'
    },
    longs: {
      factorName: 'Délais typiques',
      description: 'Durée habituelle d\'acheminement',
      levelLabel: 'Longs (> 20 jours)',
      explanation: 'Éloignement impliquant délais étendus'
    }
  }
};

/**
 * Récupère le profil logistique d'un territoire
 */
export function getTerritoryProfile(territory: string): TerritoryLogisticsProfile | null {
  return logisticsProfiles.find(p => p.territory === territory) || null;
}

/**
 * Récupère tous les profils logistiques
 */
export function getAllProfiles(): TerritoryLogisticsProfile[] {
  return [...logisticsProfiles];
}

/**
 * Récupère la description d'un facteur
 */
export function getFactorDescription(factor: string, level: string): LogisticsFactorDescription | null {
  return factorDescriptions[factor]?.[level] || null;
}
