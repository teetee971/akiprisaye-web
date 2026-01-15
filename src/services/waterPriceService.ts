/**
 * Water Price Service
 * 
 * Service de comparaison des prix de l'eau
 * Données simulées structurées pour démonstration
 * 
 * IMPORTANT:
 * - Données publiques uniquement
 * - Sources: Offices de l'eau, régies, syndicats, rapports publics
 * - Aucun tracking utilisateur
 * - Aucune affiliation
 * - Aucune estimation de facture personnalisée
 * - Usage informatif
 */

export interface WaterPrice {
  organismeGestionnaire: string;
  typeService: string;        // "Eau potable", "Assainissement", "Combiné"
  prixM3: number;             // Prix au m³ en € TTC
  abonnementMensuel: number;  // Abonnement mensuel en € TTC
  territoire: string;
  source: string;
  dateReleve: string;
}

export interface WaterPriceSearchParams {
  territoire: string;
  typeService?: string;
}

/**
 * Données simulées structurées
 * Sources: Données publiques (offices de l'eau, régies, syndicats, rapports publics)
 */
const SIMULATED_DATA: WaterPrice[] = [
  // Métropole - Référence
  {
    organismeGestionnaire: 'Veolia Eau Île-de-France',
    typeService: 'Eau potable',
    prixM3: 3.98,
    abonnementMensuel: 8.50,
    territoire: 'Métropole',
    source: 'Observatoire des services publics d\'eau et d\'assainissement',
    dateReleve: '2026-01-01',
  },
  {
    organismeGestionnaire: 'Veolia Eau Île-de-France',
    typeService: 'Assainissement',
    prixM3: 2.15,
    abonnementMensuel: 5.20,
    territoire: 'Métropole',
    source: 'Observatoire des services publics d\'eau et d\'assainissement',
    dateReleve: '2026-01-01',
  },
  {
    organismeGestionnaire: 'Suez Eau France',
    typeService: 'Combiné',
    prixM3: 6.25,
    abonnementMensuel: 13.80,
    territoire: 'Métropole',
    source: 'Observatoire des services publics d\'eau et d\'assainissement',
    dateReleve: '2026-01-02',
  },
  
  // Guadeloupe
  {
    organismeGestionnaire: 'Générale des Eaux Guadeloupe (GDEG)',
    typeService: 'Eau potable',
    prixM3: 4.85,
    abonnementMensuel: 9.75,
    territoire: 'Guadeloupe',
    source: 'Office de l\'Eau Guadeloupe - Rapport public 2026',
    dateReleve: '2026-01-03',
  },
  {
    organismeGestionnaire: 'Générale des Eaux Guadeloupe (GDEG)',
    typeService: 'Assainissement',
    prixM3: 2.45,
    abonnementMensuel: 6.10,
    territoire: 'Guadeloupe',
    source: 'Office de l\'Eau Guadeloupe - Rapport public 2026',
    dateReleve: '2026-01-03',
  },
  {
    organismeGestionnaire: 'Régie des Eaux - Basse-Terre',
    typeService: 'Eau potable',
    prixM3: 4.60,
    abonnementMensuel: 9.20,
    territoire: 'Guadeloupe',
    source: 'Régie municipale - Tarifs publics 2026',
    dateReleve: '2026-01-05',
  },
  {
    organismeGestionnaire: 'Générale des Eaux Guadeloupe (GDEG)',
    typeService: 'Combiné',
    prixM3: 7.30,
    abonnementMensuel: 15.85,
    territoire: 'Guadeloupe',
    source: 'Office de l\'Eau Guadeloupe - Rapport public 2026',
    dateReleve: '2026-01-03',
  },
  
  // Martinique
  {
    organismeGestionnaire: 'Société Martiniquaise des Eaux (SME)',
    typeService: 'Eau potable',
    prixM3: 5.12,
    abonnementMensuel: 10.20,
    territoire: 'Martinique',
    source: 'Office de l\'Eau Martinique - Rapport public 2026',
    dateReleve: '2026-01-04',
  },
  {
    organismeGestionnaire: 'Société Martiniquaise des Eaux (SME)',
    typeService: 'Assainissement',
    prixM3: 2.68,
    abonnementMensuel: 6.40,
    territoire: 'Martinique',
    source: 'Office de l\'Eau Martinique - Rapport public 2026',
    dateReleve: '2026-01-04',
  },
  {
    organismeGestionnaire: 'Société Martiniquaise des Eaux (SME)',
    typeService: 'Combiné',
    prixM3: 7.80,
    abonnementMensuel: 16.60,
    territoire: 'Martinique',
    source: 'Office de l\'Eau Martinique - Rapport public 2026',
    dateReleve: '2026-01-04',
  },
  
  // Guyane
  {
    organismeGestionnaire: 'Société Guyanaise des Eaux (SGDE)',
    typeService: 'Eau potable',
    prixM3: 5.45,
    abonnementMensuel: 11.30,
    territoire: 'Guyane',
    source: 'Office de l\'Eau Guyane - Rapport public 2026',
    dateReleve: '2026-01-05',
  },
  {
    organismeGestionnaire: 'Société Guyanaise des Eaux (SGDE)',
    typeService: 'Assainissement',
    prixM3: 2.90,
    abonnementMensuel: 6.80,
    territoire: 'Guyane',
    source: 'Office de l\'Eau Guyane - Rapport public 2026',
    dateReleve: '2026-01-05',
  },
  {
    organismeGestionnaire: 'Régie des Eaux - Cayenne',
    typeService: 'Eau potable',
    prixM3: 5.20,
    abonnementMensuel: 10.85,
    territoire: 'Guyane',
    source: 'Régie municipale - Tarifs publics 2026',
    dateReleve: '2026-01-06',
  },
  
  // Réunion
  {
    organismeGestionnaire: 'CISE Réunion',
    typeService: 'Eau potable',
    prixM3: 4.35,
    abonnementMensuel: 8.90,
    territoire: 'Réunion',
    source: 'Office de l\'Eau Réunion - Rapport public 2026',
    dateReleve: '2026-01-05',
  },
  {
    organismeGestionnaire: 'CISE Réunion',
    typeService: 'Assainissement',
    prixM3: 2.30,
    abonnementMensuel: 5.75,
    territoire: 'Réunion',
    source: 'Office de l\'Eau Réunion - Rapport public 2026',
    dateReleve: '2026-01-05',
  },
  {
    organismeGestionnaire: 'Veolia Eau Réunion',
    typeService: 'Eau potable',
    prixM3: 4.55,
    abonnementMensuel: 9.40,
    territoire: 'Réunion',
    source: 'Observation publique',
    dateReleve: '2026-01-04',
  },
  {
    organismeGestionnaire: 'CISE Réunion',
    typeService: 'Combiné',
    prixM3: 6.65,
    abonnementMensuel: 14.65,
    territoire: 'Réunion',
    source: 'Office de l\'Eau Réunion - Rapport public 2026',
    dateReleve: '2026-01-05',
  },
];

/**
 * Recherche des prix de l'eau
 * Tri par: 1. Prix au m³, 2. Date de relevé
 */
export function searchWaterPrices(params: WaterPriceSearchParams): WaterPrice[] {
  let results = SIMULATED_DATA.filter(
    (price) => price.territoire === params.territoire
  );

  // Filtrer par type de service si spécifié
  if (params.typeService) {
    results = results.filter((price) => price.typeService === params.typeService);
  }

  // Tri par: 1. Prix au m³ (croissant), 2. Date de relevé (décroissant)
  results.sort((a, b) => {
    if (a.prixM3 !== b.prixM3) {
      return a.prixM3 - b.prixM3;
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
  SIMULATED_DATA.forEach((price) => territories.add(price.territoire));
  return Array.from(territories).sort();
}

/**
 * Obtenir les types de service disponibles
 */
export function getServiceTypes(): string[] {
  return ['Eau potable', 'Assainissement', 'Combiné'];
}

/**
 * Calculer l'écart entre DOM et Métropole
 */
export function calculateDOMMetropoleGap(territoire: string): number | null {
  if (territoire === 'Métropole') {
    return null;
  }

  const metropoleWater = SIMULATED_DATA.find(
    (p) => p.territoire === 'Métropole' && p.typeService === 'Eau potable'
  );
  const territoireWater = SIMULATED_DATA.find(
    (p) => p.territoire === territoire && p.typeService === 'Eau potable'
  );

  if (!metropoleWater || !territoireWater) {
    return null;
  }

  const gap = ((territoireWater.prixM3 - metropoleWater.prixM3) / metropoleWater.prixM3) * 100;
  return Math.round(gap * 100) / 100;
}
