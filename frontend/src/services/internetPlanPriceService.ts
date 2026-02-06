/**
 * Internet Plan Price Service
 * 
 * Service de comparaison des prix des abonnements Internet
 * Données simulées structurées pour démonstration
 * 
 * IMPORTANT:
 * - Données publiques uniquement
 * - Aucun tracking utilisateur
 * - Aucune affiliation
 * - Usage informatif
 */

export interface InternetPlanPrice {
  operateur: string;
  technologie: string;      // "ADSL", "Fibre", "4G Box", "Satellite"
  prixMensuel: number;
  debitDescendant: string;  // e.g., "100 Mb/s", "1 Gb/s"
  engagement: string;       // "Oui" ou "Non"
  territoire: string;
  source: string;
  dateReleve: string;
}

export interface InternetPlanSearchParams {
  territoire: string;
  technologie?: string;
}

/**
 * Données simulées structurées
 * Sources: Données publiques d'observation citoyenne
 */
const SIMULATED_DATA: InternetPlanPrice[] = [
  // Guadeloupe - Fibre
  {
    operateur: 'Orange Caraïbe',
    technologie: 'Fibre',
    prixMensuel: 42.99,
    debitDescendant: '500 Mb/s',
    engagement: 'Non',
    territoire: 'Guadeloupe',
    source: 'Observation publique',
    dateReleve: '2026-01-07',
  },
  {
    operateur: 'SFR Antilles-Guyane',
    technologie: 'Fibre',
    prixMensuel: 39.99,
    debitDescendant: '400 Mb/s',
    engagement: 'Non',
    territoire: 'Guadeloupe',
    source: 'Observation publique',
    dateReleve: '2026-01-06',
  },
  {
    operateur: 'Free DOM',
    technologie: 'Fibre',
    prixMensuel: 29.99,
    debitDescendant: '1 Gb/s',
    engagement: 'Non',
    territoire: 'Guadeloupe',
    source: 'Observation publique',
    dateReleve: '2026-01-08',
  },
  {
    operateur: 'Digicel',
    technologie: 'Fibre',
    prixMensuel: 44.99,
    debitDescendant: '300 Mb/s',
    engagement: 'Non',
    territoire: 'Guadeloupe',
    source: 'Observation publique',
    dateReleve: '2026-01-05',
  },
  // Guadeloupe - ADSL
  {
    operateur: 'Orange Caraïbe',
    technologie: 'ADSL',
    prixMensuel: 32.99,
    debitDescendant: '20 Mb/s',
    engagement: 'Non',
    territoire: 'Guadeloupe',
    source: 'Observation publique',
    dateReleve: '2026-01-07',
  },
  {
    operateur: 'SFR Antilles-Guyane',
    technologie: 'ADSL',
    prixMensuel: 29.99,
    debitDescendant: '15 Mb/s',
    engagement: 'Non',
    territoire: 'Guadeloupe',
    source: 'Observation publique',
    dateReleve: '2026-01-06',
  },
  // Guadeloupe - 4G Box
  {
    operateur: 'Orange Caraïbe',
    technologie: '4G Box',
    prixMensuel: 37.99,
    debitDescendant: '50 Mb/s',
    engagement: 'Non',
    territoire: 'Guadeloupe',
    source: 'Observation publique',
    dateReleve: '2026-01-07',
  },
  {
    operateur: 'Digicel',
    technologie: '4G Box',
    prixMensuel: 34.99,
    debitDescendant: '40 Mb/s',
    engagement: 'Non',
    territoire: 'Guadeloupe',
    source: 'Observation publique',
    dateReleve: '2026-01-05',
  },
  // Martinique - Fibre
  {
    operateur: 'Orange Caraïbe',
    technologie: 'Fibre',
    prixMensuel: 43.99,
    debitDescendant: '500 Mb/s',
    engagement: 'Non',
    territoire: 'Martinique',
    source: 'Observation publique',
    dateReleve: '2026-01-07',
  },
  {
    operateur: 'SFR Antilles-Guyane',
    technologie: 'Fibre',
    prixMensuel: 40.99,
    debitDescendant: '400 Mb/s',
    engagement: 'Non',
    territoire: 'Martinique',
    source: 'Observation publique',
    dateReleve: '2026-01-06',
  },
  {
    operateur: 'Digicel',
    technologie: 'Fibre',
    prixMensuel: 45.99,
    debitDescendant: '300 Mb/s',
    engagement: 'Non',
    territoire: 'Martinique',
    source: 'Observation publique',
    dateReleve: '2026-01-05',
  },
  // Martinique - ADSL
  {
    operateur: 'Orange Caraïbe',
    technologie: 'ADSL',
    prixMensuel: 33.99,
    debitDescendant: '20 Mb/s',
    engagement: 'Non',
    territoire: 'Martinique',
    source: 'Observation publique',
    dateReleve: '2026-01-07',
  },
  {
    operateur: 'SFR Antilles-Guyane',
    technologie: 'ADSL',
    prixMensuel: 30.99,
    debitDescendant: '15 Mb/s',
    engagement: 'Non',
    territoire: 'Martinique',
    source: 'Observation publique',
    dateReleve: '2026-01-06',
  },
  // Guyane - Fibre
  {
    operateur: 'Orange Caraïbe',
    technologie: 'Fibre',
    prixMensuel: 44.99,
    debitDescendant: '500 Mb/s',
    engagement: 'Non',
    territoire: 'Guyane',
    source: 'Observation publique',
    dateReleve: '2026-01-07',
  },
  {
    operateur: 'SFR Antilles-Guyane',
    technologie: 'Fibre',
    prixMensuel: 41.99,
    debitDescendant: '400 Mb/s',
    engagement: 'Non',
    territoire: 'Guyane',
    source: 'Observation publique',
    dateReleve: '2026-01-06',
  },
  // Guyane - ADSL
  {
    operateur: 'Orange Caraïbe',
    technologie: 'ADSL',
    prixMensuel: 34.99,
    debitDescendant: '20 Mb/s',
    engagement: 'Non',
    territoire: 'Guyane',
    source: 'Observation publique',
    dateReleve: '2026-01-07',
  },
  // Guyane - Satellite
  {
    operateur: 'Orange Caraïbe',
    technologie: 'Satellite',
    prixMensuel: 59.99,
    debitDescendant: '30 Mb/s',
    engagement: 'Oui',
    territoire: 'Guyane',
    source: 'Observation publique',
    dateReleve: '2026-01-07',
  },
  // Réunion - Fibre
  {
    operateur: 'Orange Réunion',
    technologie: 'Fibre',
    prixMensuel: 40.99,
    debitDescendant: '500 Mb/s',
    engagement: 'Non',
    territoire: 'Réunion',
    source: 'Observation publique',
    dateReleve: '2026-01-07',
  },
  {
    operateur: 'SFR Réunion',
    technologie: 'Fibre',
    prixMensuel: 38.99,
    debitDescendant: '400 Mb/s',
    engagement: 'Non',
    territoire: 'Réunion',
    source: 'Observation publique',
    dateReleve: '2026-01-06',
  },
  {
    operateur: 'Free Réunion',
    technologie: 'Fibre',
    prixMensuel: 29.99,
    debitDescendant: '1 Gb/s',
    engagement: 'Non',
    territoire: 'Réunion',
    source: 'Observation publique',
    dateReleve: '2026-01-08',
  },
  // Réunion - ADSL
  {
    operateur: 'Orange Réunion',
    technologie: 'ADSL',
    prixMensuel: 31.99,
    debitDescendant: '20 Mb/s',
    engagement: 'Non',
    territoire: 'Réunion',
    source: 'Observation publique',
    dateReleve: '2026-01-07',
  },
  {
    operateur: 'SFR Réunion',
    technologie: 'ADSL',
    prixMensuel: 28.99,
    debitDescendant: '15 Mb/s',
    engagement: 'Non',
    territoire: 'Réunion',
    source: 'Observation publique',
    dateReleve: '2026-01-06',
  },
  // Réunion - 4G Box
  {
    operateur: 'Orange Réunion',
    technologie: '4G Box',
    prixMensuel: 36.99,
    debitDescendant: '50 Mb/s',
    engagement: 'Non',
    territoire: 'Réunion',
    source: 'Observation publique',
    dateReleve: '2026-01-07',
  },
];

/**
 * Recherche des prix d'abonnements Internet
 * Tri par: 1. Prix, 2. Date de relevé
 */
export function searchInternetPlanPrices(params: InternetPlanSearchParams): InternetPlanPrice[] {
  let results = SIMULATED_DATA.filter(
    (plan) => plan.territoire === params.territoire
  );

  // Filtrer par technologie si spécifiée
  if (params.technologie) {
    results = results.filter((plan) => plan.technologie === params.technologie);
  }

  // Tri par: 1. Prix (croissant), 2. Date de relevé (décroissant)
  results.sort((a, b) => {
    if (a.prixMensuel !== b.prixMensuel) {
      return a.prixMensuel - b.prixMensuel;
    }
    return new Date(b.dateReleve).getTime() - new Date(a.dateReleve).getTime();
  });

  return results;
}

/**
 * Obtenir les territoires disponibles
 */
export function getTerritories(): string[] {
  const territories = new Set<string>();
  SIMULATED_DATA.forEach((plan) => territories.add(plan.territoire));
  return Array.from(territories).sort();
}

/**
 * Obtenir les technologies disponibles
 */
export function getTechnologies(): string[] {
  return ['ADSL', 'Fibre', '4G Box', 'Satellite'];
}
