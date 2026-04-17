/**
 * Snapshot Generation Service - v3.0.0
 *
 * Génère des snapshots publics d'indicateurs
 * Versionnés, horodatés, traçables
 *
 * @module snapshotGenerationService
 */

import type { PriceObservation, TerritoryCode } from '../types/PriceObservation';
import { safeLocalStorage } from '../utils/safeLocalStorage';
import type {
  IndicatorSnapshot,
  IndicatorCalculationConfig,
  ObservatoryGlobalStats,
} from '../types/observatoryIndicators';
import {
  calculateAveragePrices,
  calculateDomHexagoneGaps,
  calculateIVC,
  calculateTemporalEvolution,
  calculateStoreDispersion,
} from './indicatorCalculationService';
import { filterByQuality } from './dataValidationService';

/**
 * Generate a complete indicator snapshot
 */
export async function generateSnapshot(
  observations: PriceObservation[],
  territoire?: TerritoryCode,
  minQualityScore: number = 50
): Promise<IndicatorSnapshot> {
  const version = '3.0.0';
  const dateSnapshot = new Date().toISOString();

  // Filter by quality
  const qualityFiltered = filterByQuality(observations, minQualityScore);

  // Filter by territory if specified
  const filtered = territoire
    ? qualityFiltered.filter((obs) => obs.territory === territoire)
    : qualityFiltered;

  // Determine period covered
  const dates = filtered.map((obs) => new Date(obs.observedAt).getTime());
  const periodStart = new Date(Math.min(...dates)).toISOString().split('T')[0];
  const periodEnd = new Date(Math.max(...dates)).toISOString().split('T')[0];

  const config: IndicatorCalculationConfig = {
    territoire,
    periode_debut: periodStart,
    periode_fin: periodEnd,
    qualite_minimale: minQualityScore,
    agregation: 'moyenne',
  };

  // Calculate all indicators
  const prixMoyens = await calculateAveragePrices(filtered, config);
  const ecartsDomHexagone = await calculateDomHexagoneGaps(observations, config);

  // Calculate IVC for all territories
  const indicesVieChere = [];
  const territoires: TerritoryCode[] = Array.from(new Set(filtered.map((obs) => obs.territory)));

  for (const terr of territoires) {
    if (terr !== 'FR') {
      const ivcResult = await calculateIVC(observations, terr, periodEnd);
      if (ivcResult.success && ivcResult.data) {
        indicesVieChere.push(ivcResult.data);
      }
    }
  }

  // Calculate temporal evolutions for top products
  const evolutionsTemporelles = [];
  const topProducts = prixMoyens.data?.slice(0, 20) || [];

  for (const product of topProducts) {
    const key = product.ean || product.produit;
    const evolutionResult = await calculateTemporalEvolution(observations, key, product.territoire);
    if (evolutionResult.success && evolutionResult.data) {
      evolutionsTemporelles.push(evolutionResult.data);
    }
  }

  // Calculate dispersions for top products with store data
  const dispersionsEnseignes = [];
  const productsWithStores = topProducts.filter((p) =>
    filtered.some(
      (obs) => (obs.barcode === p.ean || obs.productLabel === p.produit) && obs.storeLabel
    )
  );

  for (const product of productsWithStores.slice(0, 10)) {
    const key = product.ean || product.produit;
    const dispersionResult = await calculateStoreDispersion(
      observations,
      key,
      product.territoire,
      30
    );
    if (dispersionResult.success && dispersionResult.data) {
      dispersionsEnseignes.push(dispersionResult.data);
    }
  }

  // Extract sources
  const sources = Array.from(
    new Set(filtered.map((obs) => obs.source ?? obs.sourceType ?? 'inconnue'))
  );

  // Calculate average quality
  const qualityScores = filtered
    .map((obs) => obs.confidenceScore)
    .filter((score): score is number => score !== undefined);
  const qualiteMoyenne =
    qualityScores.length > 0
      ? qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length
      : 0;

  return {
    version,
    date_snapshot: dateSnapshot,
    territoire,
    indicateurs: {
      prix_moyens: prixMoyens.data || [],
      ecarts_dom_hexagone: ecartsDomHexagone.data || [],
      indices_vie_chere: indicesVieChere,
      evolutions_temporelles: evolutionsTemporelles,
      dispersions_enseignes: dispersionsEnseignes,
    },
    metadata: {
      nombre_observations_total: filtered.length,
      periode_couverte: {
        debut: periodStart,
        fin: periodEnd,
      },
      sources,
      qualite_moyenne: Math.round(qualiteMoyenne * 100) / 100,
    },
  };
}

/**
 * Generate global observatory statistics
 */
export async function generateGlobalStats(
  observations: PriceObservation[]
): Promise<ObservatoryGlobalStats> {
  const dateCalcul = new Date().toISOString();

  // Extract unique territories
  const territoiresCouvertsSet = new Set<TerritoryCode>();
  observations.forEach((obs) => territoiresCouvertsSet.add(obs.territory));
  const territoiresCouvertes = Array.from(territoiresCouvertsSet);

  // Extract unique products
  const produitsUniques = new Set<string>();
  observations.forEach((obs) => {
    const key = obs.barcode || obs.productLabel;
    produitsUniques.add(key);
  });

  // Extract unique categories
  const categoriesCouvertesSet = new Set(
    observations.map((obs) => obs.productCategory ?? 'Autres')
  );
  const categoriesCouvertes = Array.from(categoriesCouvertesSet);

  // Determine historical period
  const dates = observations.map((obs) => obs.observedAt);
  const premiereObservation = dates.reduce((min, date) => (date < min ? date : min), dates[0]);
  const derniereObservation = dates.reduce((max, date) => (date > max ? date : max), dates[0]);

  // Calculate quality statistics
  const observationsVerifiees = observations.filter(
    (obs) => (obs.confidenceScore ?? 0) >= 80
  ).length;
  const observationsProbables = observations.filter(
    (obs) => (obs.confidenceScore ?? 0) >= 60 && (obs.confidenceScore ?? 0) < 80
  ).length;
  const observationsAVerifier = observations.filter(
    (obs) => (obs.confidenceScore ?? 0) < 60
  ).length;

  const qualityScores = observations
    .map((obs) => obs.confidenceScore)
    .filter((score): score is number => score !== undefined);
  const scoreMoyen =
    qualityScores.length > 0
      ? qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length
      : 0;

  return {
    date_calcul: dateCalcul,
    territoires_couverts: territoiresCouvertes,
    nombre_total_observations: observations.length,
    nombre_produits_uniques: produitsUniques.size,
    categories_couvertes: categoriesCouvertes,
    periode_historique: {
      premiere_observation: premiereObservation,
      derniere_observation: derniereObservation,
    },
    qualite: {
      score_moyen: Math.round(scoreMoyen * 100) / 100,
      observations_verifiees: observationsVerifiees,
      observations_probables: observationsProbables,
      observations_a_verifier: observationsAVerifier,
    },
  };
}

/**
 * Export snapshot to JSON
 */
export function exportSnapshotToJSON(snapshot: IndicatorSnapshot, pretty: boolean = true): string {
  if (pretty) {
    return JSON.stringify(snapshot, null, 2);
  }
  return JSON.stringify(snapshot);
}

/**
 * Save snapshot to safeLocalStorage with version
 */
export function saveSnapshotLocally(
  snapshot: IndicatorSnapshot,
  key: string = 'observatory_snapshot'
): void {
  try {
    const data = JSON.stringify(snapshot);
    safeLocalStorage.setItem(key, data);
    safeLocalStorage.setItem(`${key}_version`, snapshot.version);
    safeLocalStorage.setItem(`${key}_date`, snapshot.date_snapshot);
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Failed to save snapshot:', error);
    }
  }
}

/**
 * Load snapshot from safeLocalStorage
 */
export function loadSnapshotLocally(
  key: string = 'observatory_snapshot'
): IndicatorSnapshot | null {
  try {
    const data = safeLocalStorage.getItem(key);
    if (!data) return null;

    return JSON.parse(data) as IndicatorSnapshot;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Failed to load snapshot:', error);
    }
    return null;
  }
}

/**
 * Check if snapshot is stale (older than specified hours)
 */
export function isSnapshotStale(snapshot: IndicatorSnapshot, maxAgeHours: number = 24): boolean {
  const snapshotDate = new Date(snapshot.date_snapshot);
  const now = new Date();
  const ageHours = (now.getTime() - snapshotDate.getTime()) / (1000 * 60 * 60);

  return ageHours > maxAgeHours;
}

/**
 * Generate snapshot archive metadata
 */
export function generateArchiveMetadata(snapshot: IndicatorSnapshot): {
  id: string;
  version: string;
  date: string;
  territoire?: string;
  size_bytes: number;
  indicators_count: number;
} {
  const json = exportSnapshotToJSON(snapshot, false);
  const sizeBytes = new Blob([json]).size;

  const indicatorsCount =
    snapshot.indicateurs.prix_moyens.length +
    snapshot.indicateurs.ecarts_dom_hexagone.length +
    snapshot.indicateurs.indices_vie_chere.length +
    snapshot.indicateurs.evolutions_temporelles.length +
    snapshot.indicateurs.dispersions_enseignes.length;

  return {
    id: `snapshot_${snapshot.date_snapshot.replace(/[:.]/g, '_')}`,
    version: snapshot.version,
    date: snapshot.date_snapshot,
    territoire: snapshot.territoire,
    size_bytes: sizeBytes,
    indicators_count: indicatorsCount,
  };
}
