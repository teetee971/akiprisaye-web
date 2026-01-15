/**
 * Boat/Ferry Price Service
 * 
 * Service de comparaison des prix de bateaux/ferries
 * Données simulées structurées pour démonstration
 * 
 * IMPORTANT:
 * - Données publiques uniquement
 * - Aucun tracking utilisateur
 * - Aucune affiliation
 * - Usage informatif
 */

export interface BoatPrice {
  compagnie: string;
  ligne: string;
  prix: number;
  mois: string;
  source: string;
  dateReleve: string;
  depart: string;
  arrivee: string;
}

export interface BoatSearchParams {
  depart: string;
  arrivee: string;
  mois?: string;
}

/**
 * Données simulées structurées
 * Sources: Données publiques d'observation citoyenne
 */
const SIMULATED_DATA: BoatPrice[] = [
  // Route Guadeloupe -> Martinique
  {
    compagnie: "L'Express des Îles",
    ligne: 'Guadeloupe ↔ Martinique',
    prix: 79,
    mois: '2026-02',
    source: 'Observation publique',
    dateReleve: '2026-01-06',
    depart: 'Guadeloupe',
    arrivee: 'Martinique',
  },
  {
    compagnie: 'Jeans for Freedom',
    ligne: 'Guadeloupe ↔ Martinique',
    prix: 75,
    mois: '2026-02',
    source: 'Observation publique',
    dateReleve: '2026-01-05',
    depart: 'Guadeloupe',
    arrivee: 'Martinique',
  },
  {
    compagnie: "L'Express des Îles",
    ligne: 'Guadeloupe ↔ Martinique',
    prix: 95,
    mois: '2026-07',
    source: 'Observation publique',
    dateReleve: '2026-01-03',
    depart: 'Guadeloupe',
    arrivee: 'Martinique',
  },
  {
    compagnie: 'Jeans for Freedom',
    ligne: 'Guadeloupe ↔ Martinique',
    prix: 89,
    mois: '2026-07',
    source: 'Observation publique',
    dateReleve: '2026-01-04',
    depart: 'Guadeloupe',
    arrivee: 'Martinique',
  },
  // Route Guadeloupe -> Saintes
  {
    compagnie: "Val'Ferry",
    ligne: 'Guadeloupe ↔ Les Saintes',
    prix: 22,
    mois: '2026-02',
    source: 'Observation publique',
    dateReleve: '2026-01-06',
    depart: 'Guadeloupe',
    arrivee: 'Les Saintes',
  },
  {
    compagnie: 'IGS Antilles',
    ligne: 'Guadeloupe ↔ Les Saintes',
    prix: 25,
    mois: '2026-02',
    source: 'Observation publique',
    dateReleve: '2026-01-05',
    depart: 'Guadeloupe',
    arrivee: 'Les Saintes',
  },
  {
    compagnie: "Val'Ferry",
    ligne: 'Guadeloupe ↔ Les Saintes',
    prix: 28,
    mois: '2026-07',
    source: 'Observation publique',
    dateReleve: '2026-01-04',
    depart: 'Guadeloupe',
    arrivee: 'Les Saintes',
  },
  // Route Guadeloupe -> Saint-Martin
  {
    compagnie: "L'Express des Îles",
    ligne: 'Guadeloupe ↔ Saint-Martin',
    prix: 65,
    mois: '2026-03',
    source: 'Observation publique',
    dateReleve: '2026-01-07',
    depart: 'Guadeloupe',
    arrivee: 'Saint-Martin',
  },
  {
    compagnie: "L'Express des Îles",
    ligne: 'Guadeloupe ↔ Saint-Martin',
    prix: 75,
    mois: '2026-07',
    source: 'Observation publique',
    dateReleve: '2026-01-03',
    depart: 'Guadeloupe',
    arrivee: 'Saint-Martin',
  },
  // Route Saint-Martin -> Saint-Barthélemy
  {
    compagnie: 'Jeans for Freedom',
    ligne: 'Saint-Martin ↔ Saint-Barthélemy',
    prix: 45,
    mois: '2026-03',
    source: 'Observation publique',
    dateReleve: '2026-01-07',
    depart: 'Saint-Martin',
    arrivee: 'Saint-Barthélemy',
  },
  {
    compagnie: 'Jeans for Freedom',
    ligne: 'Saint-Martin ↔ Saint-Barthélemy',
    prix: 55,
    mois: '2026-07',
    source: 'Observation publique',
    dateReleve: '2026-01-06',
    depart: 'Saint-Martin',
    arrivee: 'Saint-Barthélemy',
  },
  // Route Guadeloupe -> La Désirade
  {
    compagnie: 'IGS Antilles',
    ligne: 'Guadeloupe ↔ La Désirade',
    prix: 18,
    mois: '2026-02',
    source: 'Observation publique',
    dateReleve: '2026-01-05',
    depart: 'Guadeloupe',
    arrivee: 'La Désirade',
  },
  {
    compagnie: 'IGS Antilles',
    ligne: 'Guadeloupe ↔ La Désirade',
    prix: 22,
    mois: '2026-07',
    source: 'Observation publique',
    dateReleve: '2026-01-03',
    depart: 'Guadeloupe',
    arrivee: 'La Désirade',
  },
];

/**
 * Recherche des prix de bateaux/ferries
 * Tri par: 1. Prix, 2. Date de relevé
 */
export function searchBoatPrices(params: BoatSearchParams): BoatPrice[] {
  let results = SIMULATED_DATA.filter(
    (boat) =>
      boat.depart === params.depart &&
      boat.arrivee === params.arrivee
  );

  // Filtrer par mois si spécifié
  if (params.mois) {
    results = results.filter((boat) => boat.mois === params.mois);
  }

  // Tri par: 1. Prix (croissant), 2. Date de relevé (décroissant)
  results.sort((a, b) => {
    if (a.prix !== b.prix) {
      return a.prix - b.prix;
    }
    return new Date(b.dateReleve).getTime() - new Date(a.dateReleve).getTime();
  });

  return results;
}

/**
 * Obtenir les mois disponibles pour une ligne
 */
export function getAvailableMonths(depart: string, arrivee: string): string[] {
  const months = new Set<string>();
  SIMULATED_DATA.filter(
    (boat) => boat.depart === depart && boat.arrivee === arrivee
  ).forEach((boat) => months.add(boat.mois));
  
  return Array.from(months).sort();
}

/**
 * Obtenir les lieux de départ disponibles
 */
export function getDepartureLocations(): string[] {
  const locations = new Set<string>();
  SIMULATED_DATA.forEach((boat) => locations.add(boat.depart));
  return Array.from(locations).sort();
}

/**
 * Obtenir les lieux d'arrivée disponibles
 */
export function getArrivalLocations(): string[] {
  const locations = new Set<string>();
  SIMULATED_DATA.forEach((boat) => locations.add(boat.arrivee));
  return Array.from(locations).sort();
}

/**
 * Calculer les données pour le graphique de prix par mois
 */
export function getPricesByMonth(depart: string, arrivee: string): {
  mois: string;
  prixMoyen: number;
  prixMin: number;
  prixMax: number;
}[] {
  const pricesByMonth = new Map<string, number[]>();
  
  SIMULATED_DATA.filter(
    (boat) => boat.depart === depart && boat.arrivee === arrivee
  ).forEach((boat) => {
    if (!pricesByMonth.has(boat.mois)) {
      pricesByMonth.set(boat.mois, []);
    }
    pricesByMonth.get(boat.mois)!.push(boat.prix);
  });

  return Array.from(pricesByMonth.entries())
    .map(([mois, prices]) => ({
      mois,
      prixMoyen: Math.round(prices.reduce((sum, p) => sum + p, 0) / prices.length),
      prixMin: Math.min(...prices),
      prixMax: Math.max(...prices),
    }))
    .sort((a, b) => a.mois.localeCompare(b.mois));
}
