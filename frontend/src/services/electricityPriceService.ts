/**
 * Electricity Price Service
 *
 * Service de comparaison des prix de l'électricité
 * Données simulées structurées pour démonstration
 *
 * IMPORTANT:
 * - Données publiques uniquement
 * - Sources: CRE, EDF, autorités locales, rapports officiels
 * - Aucun tracking utilisateur
 * - Aucune affiliation
 * - Aucune estimation personnalisée
 * - Usage informatif
 */

export interface ElectricityPrice {
  fournisseur: string;
  typeTarif: string; // "Tarif réglementé" ou "Offre de marché"
  prixKWh: number; // Prix du kWh en € TTC
  abonnementMensuel: number; // Abonnement mensuel en € TTC
  territoire: string;
  source: string;
  dateReleve: string;
}

export interface ElectricityPriceSearchParams {
  territoire: string;
  typeTarif?: string;
}

/**
 * Données simulées structurées
 * Sources: Données publiques (CRE, EDF, autorités locales, rapports officiels)
 */
const SIMULATED_DATA: ElectricityPrice[] = [
  // Métropole - Référence
  {
    fournisseur: 'EDF',
    typeTarif: 'Tarif réglementé',
    prixKWh: 0.2276,
    abonnementMensuel: 12.44,
    territoire: 'Métropole',
    source: 'CRE - Tarifs réglementés 2026',
    dateReleve: '2026-01-01',
  },
  {
    fournisseur: 'Engie',
    typeTarif: 'Offre de marché',
    prixKWh: 0.2156,
    abonnementMensuel: 11.99,
    territoire: 'Métropole',
    source: 'Observation publique',
    dateReleve: '2026-01-05',
  },
  {
    fournisseur: 'TotalEnergies',
    typeTarif: 'Offre de marché',
    prixKWh: 0.2198,
    abonnementMensuel: 12.15,
    territoire: 'Métropole',
    source: 'Observation publique',
    dateReleve: '2026-01-04',
  },

  // Guadeloupe
  {
    fournisseur: 'EDF Archipel Guadeloupe',
    typeTarif: 'Tarif réglementé',
    prixKWh: 0.1871,
    abonnementMensuel: 11.62,
    territoire: 'Guadeloupe',
    source: 'CRE - Tarifs réglementés DOM 2026',
    dateReleve: '2026-01-01',
  },
  {
    fournisseur: 'EDF Archipel Guadeloupe',
    typeTarif: 'Offre de marché',
    prixKWh: 0.1921,
    abonnementMensuel: 12.1,
    territoire: 'Guadeloupe',
    source: 'Observation publique',
    dateReleve: '2026-01-06',
  },
  {
    fournisseur: 'Albioma',
    typeTarif: 'Offre de marché',
    prixKWh: 0.1895,
    abonnementMensuel: 11.85,
    territoire: 'Guadeloupe',
    source: 'Observation publique',
    dateReleve: '2026-01-05',
  },

  // Martinique
  {
    fournisseur: 'EDF Archipel Guadeloupe',
    typeTarif: 'Tarif réglementé',
    prixKWh: 0.1871,
    abonnementMensuel: 11.62,
    territoire: 'Martinique',
    source: 'CRE - Tarifs réglementés DOM 2026',
    dateReleve: '2026-01-01',
  },
  {
    fournisseur: 'EDF Archipel Guadeloupe',
    typeTarif: 'Offre de marché',
    prixKWh: 0.1931,
    abonnementMensuel: 12.15,
    territoire: 'Martinique',
    source: 'Observation publique',
    dateReleve: '2026-01-06',
  },
  {
    fournisseur: 'Albioma',
    typeTarif: 'Offre de marché',
    prixKWh: 0.1905,
    abonnementMensuel: 11.9,
    territoire: 'Martinique',
    source: 'Observation publique',
    dateReleve: '2026-01-05',
  },

  // Guyane
  {
    fournisseur: 'EDF Guyane',
    typeTarif: 'Tarif réglementé',
    prixKWh: 0.1522,
    abonnementMensuel: 10.73,
    territoire: 'Guyane',
    source: 'CRE - Tarifs réglementés DOM 2026',
    dateReleve: '2026-01-01',
  },
  {
    fournisseur: 'EDF Guyane',
    typeTarif: 'Offre de marché',
    prixKWh: 0.1572,
    abonnementMensuel: 11.2,
    territoire: 'Guyane',
    source: 'Observation publique',
    dateReleve: '2026-01-06',
  },

  // Réunion
  {
    fournisseur: 'EDF Réunion',
    typeTarif: 'Tarif réglementé',
    prixKWh: 0.1993,
    abonnementMensuel: 11.98,
    territoire: 'Réunion',
    source: 'CRE - Tarifs réglementés DOM 2026',
    dateReleve: '2026-01-01',
  },
  {
    fournisseur: 'EDF Réunion',
    typeTarif: 'Offre de marché',
    prixKWh: 0.2043,
    abonnementMensuel: 12.45,
    territoire: 'Réunion',
    source: 'Observation publique',
    dateReleve: '2026-01-06',
  },
  {
    fournisseur: 'Albioma',
    typeTarif: 'Offre de marché',
    prixKWh: 0.2018,
    abonnementMensuel: 12.2,
    territoire: 'Réunion',
    source: 'Observation publique',
    dateReleve: '2026-01-05',
  },
];

/**
 * Recherche des prix de l'électricité
 * Tri par: 1. Prix du kWh, 2. Date de relevé
 */
export function searchElectricityPrices(params: ElectricityPriceSearchParams): ElectricityPrice[] {
  let results = SIMULATED_DATA.filter((price) => price.territoire === params.territoire);

  // Filtrer par type de tarif si spécifié
  if (params.typeTarif) {
    results = results.filter((price) => price.typeTarif === params.typeTarif);
  }

  // Tri par: 1. Prix du kWh (croissant), 2. Date de relevé (décroissant)
  results.sort((a, b) => {
    if (a.prixKWh !== b.prixKWh) {
      return a.prixKWh - b.prixKWh;
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
 * Obtenir les types de tarifs disponibles
 */
export function getTariffTypes(): string[] {
  return ['Tarif réglementé', 'Offre de marché'];
}

/**
 * Calculer l'écart entre DOM et Métropole
 */
export function calculateDOMMetropoleGap(territoire: string): number | null {
  if (territoire === 'Métropole') {
    return null;
  }

  const metropoleRegulated = SIMULATED_DATA.find(
    (p) => p.territoire === 'Métropole' && p.typeTarif === 'Tarif réglementé'
  );
  const territoireRegulated = SIMULATED_DATA.find(
    (p) => p.territoire === territoire && p.typeTarif === 'Tarif réglementé'
  );

  if (!metropoleRegulated || !territoireRegulated) {
    return null;
  }

  const gap =
    ((territoireRegulated.prixKWh - metropoleRegulated.prixKWh) / metropoleRegulated.prixKWh) * 100;
  return Math.round(gap * 100) / 100;
}
