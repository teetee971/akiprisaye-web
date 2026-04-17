/**
 * Flight Price Service
 *
 * Service de comparaison des prix de billets d'avion
 * Données simulées structurées pour démonstration
 *
 * IMPORTANT:
 * - Données publiques uniquement
 * - Aucun tracking utilisateur
 * - Aucune affiliation
 * - Usage informatif
 */

export interface FlightPrice {
  compagnie: string;
  prix: number;
  mois: string;
  source: string;
  dateReleve: string;
  depart: string;
  arrivee: string;
  bookingUrl?: string;
  duree?: string;
  bagagesInclus?: boolean;
  modifiable?: boolean;
}

export interface FlightSearchParams {
  depart: string;
  arrivee: string;
  mois?: string;
}

const SIMULATED_DATA: FlightPrice[] = [
  // Route Guadeloupe -> Paris
  {
    compagnie: 'Air France',
    prix: 485,
    mois: '2026-05',
    source: 'Observation publique',
    dateReleve: '2026-03-01',
    depart: 'Guadeloupe',
    arrivee: 'Paris',
    bookingUrl:
      'https://www.airfrance.fr/search/offer?origin=PTP&destination=ORY&cabin=ECONOMY&adults=1',
    duree: '8h30',
    bagagesInclus: true,
    modifiable: true,
  },
  {
    compagnie: 'Air Caraïbes',
    prix: 425,
    mois: '2026-05',
    source: 'Observation publique',
    dateReleve: '2026-03-02',
    depart: 'Guadeloupe',
    arrivee: 'Paris',
    bookingUrl: 'https://www.aircaraibes.com/',
    duree: '8h45',
    bagagesInclus: true,
    modifiable: true,
  },
  {
    compagnie: 'Corsair',
    prix: 398,
    mois: '2026-05',
    source: 'Observation publique',
    dateReleve: '2026-03-03',
    depart: 'Guadeloupe',
    arrivee: 'Paris',
    bookingUrl: 'https://www.corsair.fr/vols/',
    duree: '8h35',
    bagagesInclus: false,
    modifiable: false,
  },
  {
    compagnie: 'Transavia France',
    prix: 359,
    mois: '2026-05',
    source: 'Observation publique',
    dateReleve: '2026-03-04',
    depart: 'Guadeloupe',
    arrivee: 'Paris',
    bookingUrl: 'https://www.transavia.com/fr-FR/fly/',
    duree: '9h00',
    bagagesInclus: false,
    modifiable: false,
  },
  {
    compagnie: 'Air France',
    prix: 785,
    mois: '2026-07',
    source: 'Observation publique',
    dateReleve: '2026-03-05',
    depart: 'Guadeloupe',
    arrivee: 'Paris',
    bookingUrl:
      'https://www.airfrance.fr/search/offer?origin=PTP&destination=ORY&cabin=ECONOMY&adults=1',
    duree: '8h30',
    bagagesInclus: true,
    modifiable: true,
  },
  {
    compagnie: 'Air Caraïbes',
    prix: 720,
    mois: '2026-07',
    source: 'Observation publique',
    dateReleve: '2026-03-06',
    depart: 'Guadeloupe',
    arrivee: 'Paris',
    bookingUrl: 'https://www.aircaraibes.com/',
    duree: '8h45',
    bagagesInclus: true,
    modifiable: true,
  },
  // Route Martinique -> Paris
  {
    compagnie: 'Air France',
    prix: 490,
    mois: '2026-05',
    source: 'Observation publique',
    dateReleve: '2026-03-01',
    depart: 'Martinique',
    arrivee: 'Paris',
    bookingUrl:
      'https://www.airfrance.fr/search/offer?origin=FDF&destination=ORY&cabin=ECONOMY&adults=1',
    duree: '8h30',
    bagagesInclus: true,
    modifiable: true,
  },
  {
    compagnie: 'Air Caraïbes',
    prix: 430,
    mois: '2026-05',
    source: 'Observation publique',
    dateReleve: '2026-03-02',
    depart: 'Martinique',
    arrivee: 'Paris',
    bookingUrl: 'https://www.aircaraibes.com/',
    duree: '8h40',
    bagagesInclus: true,
    modifiable: true,
  },
  // Route La Réunion -> Paris
  {
    compagnie: 'French Bee',
    prix: 469,
    mois: '2026-05',
    source: 'Observation publique',
    dateReleve: '2026-03-01',
    depart: 'La Réunion',
    arrivee: 'Paris',
    bookingUrl: 'https://www.frenchbee.com/',
    duree: '10h30',
    bagagesInclus: false,
    modifiable: false,
  },
  {
    compagnie: 'Air France',
    prix: 625,
    mois: '2026-05',
    source: 'Observation publique',
    dateReleve: '2026-03-02',
    depart: 'La Réunion',
    arrivee: 'Paris',
    bookingUrl:
      'https://www.airfrance.fr/search/offer?origin=RUN&destination=CDG&cabin=ECONOMY&adults=1',
    duree: '11h00',
    bagagesInclus: true,
    modifiable: true,
  },
  {
    compagnie: 'Air Austral',
    prix: 595,
    mois: '2026-05',
    source: 'Observation publique',
    dateReleve: '2026-03-03',
    depart: 'La Réunion',
    arrivee: 'Paris',
    bookingUrl: 'https://www.air-austral.com/',
    duree: '10h45',
    bagagesInclus: true,
    modifiable: true,
  },
];

/**
 * Recherche des prix de vols
 * Tri par: 1. Prix, 2. Date de relevé
 */
export function searchFlightPrices(params: FlightSearchParams): FlightPrice[] {
  let results = SIMULATED_DATA.filter(
    (flight) => flight.depart === params.depart && flight.arrivee === params.arrivee
  );

  // Filtrer par mois si spécifié
  if (params.mois) {
    results = results.filter((flight) => flight.mois === params.mois);
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
 * Obtenir les mois disponibles pour une route
 */
export function getAvailableMonths(depart: string, arrivee: string): string[] {
  const months = new Set<string>();
  SIMULATED_DATA.filter((flight) => flight.depart === depart && flight.arrivee === arrivee).forEach(
    (flight) => months.add(flight.mois)
  );

  return Array.from(months).sort();
}

/**
 * Obtenir les lieux de départ disponibles
 */
export function getDepartureLocations(): string[] {
  const locations = new Set<string>();
  SIMULATED_DATA.forEach((flight) => locations.add(flight.depart));
  return Array.from(locations).sort();
}

/**
 * Obtenir les lieux d'arrivée disponibles
 */
export function getArrivalLocations(): string[] {
  const locations = new Set<string>();
  SIMULATED_DATA.forEach((flight) => locations.add(flight.arrivee));
  return Array.from(locations).sort();
}

/**
 * Calculer les données pour le graphique de prix par mois
 */
export function getPricesByMonth(
  depart: string,
  arrivee: string
): {
  mois: string;
  prixMoyen: number;
  prixMin: number;
  prixMax: number;
}[] {
  const pricesByMonth = new Map<string, number[]>();

  SIMULATED_DATA.filter((flight) => flight.depart === depart && flight.arrivee === arrivee).forEach(
    (flight) => {
      if (!pricesByMonth.has(flight.mois)) {
        pricesByMonth.set(flight.mois, []);
      }
      pricesByMonth.get(flight.mois)!.push(flight.prix);
    }
  );

  return Array.from(pricesByMonth.entries())
    .map(([mois, prices]) => ({
      mois,
      prixMoyen: Math.round(prices.reduce((sum, p) => sum + p, 0) / prices.length),
      prixMin: Math.min(...prices),
      prixMax: Math.max(...prices),
    }))
    .sort((a, b) => a.mois.localeCompare(b.mois));
}
