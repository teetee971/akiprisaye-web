/**
 * Mobile Plan Price Service
 * 
 * Service de comparaison des prix des abonnements mobiles
 * Données simulées structurées pour démonstration
 * 
 * IMPORTANT:
 * - Données publiques uniquement
 * - Aucun tracking utilisateur
 * - Aucune affiliation
 * - Usage informatif
 */

export interface MobilePlanPrice {
  operateur: string;
  prixMensuel: number;
  donnees: string;          // e.g., "50 Go", "Illimité"
  appelsSMS: string;        // e.g., "Illimités", "2h"
  dateReleve: string;
  territoire: string;
  typeOffre: string;        // "Forfait seul" ou "Avec engagement"
  source: string;
}

export interface MobilePlanSearchParams {
  territoire: string;
  typeOffre?: string;
}

/**
 * Données simulées structurées
 * Sources: Données publiques d'observation citoyenne
 */
const SIMULATED_DATA: MobilePlanPrice[] = [
  // Guadeloupe - Forfait seul
  {
    operateur: 'Orange Caraïbe',
    prixMensuel: 35.99,
    donnees: '50 Go',
    appelsSMS: 'Illimités',
    dateReleve: '2026-01-07',
    territoire: 'Guadeloupe',
    typeOffre: 'Forfait seul',
    source: 'Observation publique',
  },
  {
    operateur: 'SFR Antilles-Guyane',
    prixMensuel: 32.99,
    donnees: '40 Go',
    appelsSMS: 'Illimités',
    dateReleve: '2026-01-06',
    territoire: 'Guadeloupe',
    typeOffre: 'Forfait seul',
    source: 'Observation publique',
  },
  {
    operateur: 'Digicel',
    prixMensuel: 29.99,
    donnees: '30 Go',
    appelsSMS: 'Illimités',
    dateReleve: '2026-01-05',
    territoire: 'Guadeloupe',
    typeOffre: 'Forfait seul',
    source: 'Observation publique',
  },
  {
    operateur: 'Free DOM',
    prixMensuel: 19.99,
    donnees: '210 Go',
    appelsSMS: 'Illimités',
    dateReleve: '2026-01-08',
    territoire: 'Guadeloupe',
    typeOffre: 'Forfait seul',
    source: 'Observation publique',
  },
  // Guadeloupe - Avec engagement
  {
    operateur: 'Orange Caraïbe',
    prixMensuel: 29.99,
    donnees: '50 Go',
    appelsSMS: 'Illimités',
    dateReleve: '2026-01-07',
    territoire: 'Guadeloupe',
    typeOffre: 'Avec engagement',
    source: 'Observation publique',
  },
  {
    operateur: 'SFR Antilles-Guyane',
    prixMensuel: 27.99,
    donnees: '40 Go',
    appelsSMS: 'Illimités',
    dateReleve: '2026-01-06',
    territoire: 'Guadeloupe',
    typeOffre: 'Avec engagement',
    source: 'Observation publique',
  },
  // Martinique - Forfait seul
  {
    operateur: 'Orange Caraïbe',
    prixMensuel: 36.99,
    donnees: '50 Go',
    appelsSMS: 'Illimités',
    dateReleve: '2026-01-07',
    territoire: 'Martinique',
    typeOffre: 'Forfait seul',
    source: 'Observation publique',
  },
  {
    operateur: 'SFR Antilles-Guyane',
    prixMensuel: 33.99,
    donnees: '40 Go',
    appelsSMS: 'Illimités',
    dateReleve: '2026-01-06',
    territoire: 'Martinique',
    typeOffre: 'Forfait seul',
    source: 'Observation publique',
  },
  {
    operateur: 'Digicel',
    prixMensuel: 30.99,
    donnees: '30 Go',
    appelsSMS: 'Illimités',
    dateReleve: '2026-01-05',
    territoire: 'Martinique',
    typeOffre: 'Forfait seul',
    source: 'Observation publique',
  },
  // Guyane - Forfait seul
  {
    operateur: 'Orange Caraïbe',
    prixMensuel: 37.99,
    donnees: '50 Go',
    appelsSMS: 'Illimités',
    dateReleve: '2026-01-07',
    territoire: 'Guyane',
    typeOffre: 'Forfait seul',
    source: 'Observation publique',
  },
  {
    operateur: 'SFR Antilles-Guyane',
    prixMensuel: 34.99,
    donnees: '40 Go',
    appelsSMS: 'Illimités',
    dateReleve: '2026-01-06',
    territoire: 'Guyane',
    typeOffre: 'Forfait seul',
    source: 'Observation publique',
  },
  {
    operateur: 'Digicel',
    prixMensuel: 31.99,
    donnees: '30 Go',
    appelsSMS: 'Illimités',
    dateReleve: '2026-01-05',
    territoire: 'Guyane',
    typeOffre: 'Forfait seul',
    source: 'Observation publique',
  },
  // Réunion - Forfait seul
  {
    operateur: 'Orange Réunion',
    prixMensuel: 34.99,
    donnees: '50 Go',
    appelsSMS: 'Illimités',
    dateReleve: '2026-01-07',
    territoire: 'Réunion',
    typeOffre: 'Forfait seul',
    source: 'Observation publique',
  },
  {
    operateur: 'SFR Réunion',
    prixMensuel: 31.99,
    donnees: '40 Go',
    appelsSMS: 'Illimités',
    dateReleve: '2026-01-06',
    territoire: 'Réunion',
    typeOffre: 'Forfait seul',
    source: 'Observation publique',
  },
  {
    operateur: 'Free Réunion',
    prixMensuel: 19.99,
    donnees: '210 Go',
    appelsSMS: 'Illimités',
    dateReleve: '2026-01-08',
    territoire: 'Réunion',
    typeOffre: 'Forfait seul',
    source: 'Observation publique',
  },
];

/**
 * Recherche des prix d'abonnements mobiles
 * Tri par: 1. Prix, 2. Date de relevé
 */
export function searchMobilePlanPrices(params: MobilePlanSearchParams): MobilePlanPrice[] {
  let results = SIMULATED_DATA.filter(
    (plan) => plan.territoire === params.territoire
  );

  // Filtrer par type d'offre si spécifié
  if (params.typeOffre) {
    results = results.filter((plan) => plan.typeOffre === params.typeOffre);
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
 * Obtenir les types d'offre disponibles
 */
export function getOfferTypes(): string[] {
  return ['Forfait seul', 'Avec engagement'];
}
