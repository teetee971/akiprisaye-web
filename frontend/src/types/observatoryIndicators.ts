/**
 * Observatory Indicator Types - v3.0.0
 *
 * Types for priority indicators and calculations
 * Indicateurs prioritaires médiatiquement exploitables
 *
 * @module observatoryIndicators
 */

import type { TerritoryCode, ProductCategory } from './PriceObservation';

/**
 * Périodes temporelles pour les évolutions
 */
export type TemporalPeriod = 'J-30' | 'J-90' | 'J-365';

/**
 * Prix moyen par produit et territoire
 */
export interface AveragePriceIndicator {
  produit: string;
  ean?: string;
  categorie: ProductCategory;
  territoire: TerritoryCode;
  prix_moyen: number;
  nombre_observations: number;
  periode_debut: string;
  periode_fin: string;
  derniere_mise_a_jour: string;
}

/**
 * Écart DOM vs Hexagone
 */
export interface DomHexagoneGap {
  produit: string;
  ean?: string;
  categorie: ProductCategory;
  territoire_dom: TerritoryCode;
  prix_dom: number;
  prix_hexagone: number;
  ecart_absolu: number;
  ecart_pourcentage: number;
  periode: string;
  signification: 'plus_cher' | 'moins_cher' | 'equivalent';
}

/**
 * Indice Vie Chère (IVC) - base 100
 */
export interface IVCIndicator {
  territoire: TerritoryCode;
  indice_global: number;
  date_reference: string;
  date_calcul: string;
  par_categorie: {
    categorie: ProductCategory;
    indice: number;
    contribution: number;
  }[];
  methodologie: string;
}

/**
 * Évolution temporelle
 */
export interface TemporalEvolution {
  produit: string;
  ean?: string;
  territoire: TerritoryCode;
  prix_actuel: number;
  evolutions: {
    periode: TemporalPeriod;
    prix_anterieur: number;
    variation_absolue: number;
    variation_pourcentage: number;
  }[];
  tendance: 'hausse' | 'baisse' | 'stable';
}

/**
 * Dispersion par enseigne
 */
export interface StoreDispersion {
  produit: string;
  ean?: string;
  territoire: TerritoryCode;
  statistiques: {
    prix_min: number;
    prix_max: number;
    prix_median: number;
    prix_moyen: number;
    ecart_type: number;
  };
  par_enseigne: {
    enseigne: string;
    prix: number;
    position: 'min' | 'median' | 'max' | 'autre';
    ecart_vs_median: number;
  }[];
  nombre_enseignes: number;
  periode: string;
}

/**
 * Snapshot d'indicateurs publics
 */
export interface IndicatorSnapshot {
  version: string;
  date_snapshot: string;
  territoire?: TerritoryCode;
  indicateurs: {
    prix_moyens: AveragePriceIndicator[];
    ecarts_dom_hexagone: DomHexagoneGap[];
    indices_vie_chere: IVCIndicator[];
    evolutions_temporelles: TemporalEvolution[];
    dispersions_enseignes: StoreDispersion[];
  };
  metadata: {
    nombre_observations_total: number;
    periode_couverte: {
      debut: string;
      fin: string;
    };
    sources: string[];
    qualite_moyenne: number;
  };
}

/**
 * Configuration de calcul d'indicateur
 */
export interface IndicatorCalculationConfig {
  territoire?: TerritoryCode;
  categorie?: ProductCategory;
  periode_debut: string;
  periode_fin: string;
  qualite_minimale?: number;
  agregation: 'moyenne' | 'mediane' | 'ponderee';
}

/**
 * Résultat de calcul d'indicateur
 */
export interface IndicatorCalculationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  metadata: {
    observations_utilisees: number;
    observations_exclues: number;
    temps_calcul_ms: number;
  };
}

/**
 * Statistiques globales de l'observatoire
 */
export interface ObservatoryGlobalStats {
  date_calcul: string;
  territoires_couverts: TerritoryCode[];
  nombre_total_observations: number;
  nombre_produits_uniques: number;
  categories_couvertes: ProductCategory[];
  periode_historique: {
    premiere_observation: string;
    derniere_observation: string;
  };
  qualite: {
    score_moyen: number;
    observations_verifiees: number;
    observations_probables: number;
    observations_a_verifier: number;
  };
}
