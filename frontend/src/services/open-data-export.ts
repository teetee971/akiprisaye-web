/**
 * Open Data Export Service
 * "A KI PRI SA YÉ" - Export observations, anomalies, and alerts in open formats
 *
 * Compliance with open data standards (Etalab 2.0)
 * Multiple formats: JSON, CSV
 * Anonymized and transparent
 */

import type { Observation } from '../schemas/observation';
import type { PriceAnomaly } from './anomaly-detection';
import type { Alert } from './alerts';

/**
 * Export format
 */
export type ExportFormat = 'json' | 'csv';

/**
 * Open data metadata (Etalab 2.0 compliant)
 */
export interface OpenDataMetadata {
  titre: string;
  description: string;
  licence: string;
  source: string;
  producteur: string;
  date_creation: string;
  date_modification: string;
  frequence_maj: string;
  couverture_temporelle: string;
  couverture_spatiale: string[];
  mots_cles: string[];
  format: ExportFormat;
  url_source: string;
}

/**
 * Observations export schema
 */
export interface ObservationsExport {
  metadata: OpenDataMetadata;
  donnees: Observation[];
  statistiques: {
    total_observations: number;
    territoires: string[];
    periode: { debut: string; fin: string };
    categories: string[];
  };
}

/**
 * Anomalies export schema (anonymized)
 */
export interface AnomaliesExport {
  metadata: OpenDataMetadata;
  donnees: Array<
    Omit<PriceAnomaly, 'observation_id'> & {
      /** Anonymized: only date, not observation ID */
      date_detection: string;
    }
  >;
  statistiques: {
    total_anomalies: number;
    par_niveau: Record<string, number>;
    par_territoire: Record<string, number>;
    methode_detection: string;
  };
}

/**
 * Alerts export schema (fully anonymized)
 */
export interface AlertesExport {
  metadata: OpenDataMetadata;
  donnees: Array<{
    /** Anonymized: no user identifiable info */
    type: string;
    produit: string;
    territoire: string;
    ecart_pourcent: number;
    date_observation: string;
    niveau: string;
  }>;
  statistiques: {
    total_alertes: number;
    par_type: Record<string, number>;
    par_territoire: Record<string, number>;
  };
}

/**
 * Create base metadata
 */
function createBaseMetadata(
  titre: string,
  description: string,
  format: ExportFormat
): OpenDataMetadata {
  return {
    titre,
    description,
    licence: 'Licence Ouverte / Open Licence version 2.0 (Etalab)',
    source: 'A KI PRI SA YÉ - Observatoire Citoyen des Prix',
    producteur: 'A KI PRI SA YÉ',
    date_creation: new Date().toISOString(),
    date_modification: new Date().toISOString(),
    frequence_maj: 'temps réel (ajout citoyen)',
    couverture_temporelle: 'depuis 2025',
    couverture_spatiale: [
      'Guadeloupe',
      'Martinique',
      'Guyane',
      'La Réunion',
      'Mayotte',
      'Saint-Pierre-et-Miquelon',
      'Saint-Barthélemy',
      'Saint-Martin',
      'Wallis-et-Futuna',
      'Polynésie française',
      'Nouvelle-Calédonie',
    ],
    mots_cles: [
      'prix',
      'outre-mer',
      'transparence',
      'observatoire',
      'ticket de caisse',
      'open data',
    ],
    format,
    url_source: 'https://akiprisaye.fr',
  };
}

/**
 * Export observations to JSON
 */
export function exportObservationsJSON(observations: Observation[]): ObservationsExport {
  const territories = [...new Set(observations.map((obs) => obs.territoire))].sort();
  const categories = new Set<string>();

  for (const obs of observations) {
    for (const product of obs.produits) {
      if (product.categorie) categories.add(product.categorie);
    }
  }

  const dates = observations.map((obs) => obs.date).sort();

  return {
    metadata: createBaseMetadata(
      'Observations de prix réels - A KI PRI SA YÉ',
      "Prix réels observés sur tickets de caisse dans les territoires d'Outre-mer. " +
        'Données citoyennes vérifiées, sans estimation ni extrapolation.',
      'json'
    ),
    donnees: observations,
    statistiques: {
      total_observations: observations.length,
      territoires: territories,
      periode: {
        debut: dates[0] || '',
        fin: dates[dates.length - 1] || '',
      },
      categories: Array.from(categories).sort(),
    },
  };
}

/**
 * Export anomalies to JSON (anonymized)
 */
export function exportAnomaliesJSON(anomalies: PriceAnomaly[]): AnomaliesExport {
  // Anonymize: remove observation_id
  const donneesAnonymisees = anomalies.map((anomaly) => ({
    produit: anomaly.produit,
    territoire: anomaly.territoire,
    commune: anomaly.commune,
    // enseigne removed for privacy
    date: anomaly.date,
    prix_observe: anomaly.prix_observe,
    prix_reference: anomaly.prix_reference,
    ecart_absolu: anomaly.ecart_absolu,
    ecart_pourcent: anomaly.ecart_pourcent,
    methode: anomaly.methode,
    seuil: anomaly.seuil,
    niveau: anomaly.niveau,
    observations_historiques: anomaly.observations_historiques,
    explication: anomaly.explication,
    date_detection: new Date().toISOString().split('T')[0],
  }));

  const parNiveau: Record<string, number> = {};
  const parTerritoire: Record<string, number> = {};

  for (const anomaly of anomalies) {
    parNiveau[anomaly.niveau] = (parNiveau[anomaly.niveau] || 0) + 1;
    parTerritoire[anomaly.territoire] = (parTerritoire[anomaly.territoire] || 0) + 1;
  }

  return {
    metadata: createBaseMetadata(
      'Anomalies de prix détectées - A KI PRI SA YÉ',
      'Anomalies de prix détectées automatiquement par analyse statistique des observations réelles. ' +
        'Méthodes explicables et reproductibles.',
      'json'
    ),
    donnees: donneesAnonymisees,
    statistiques: {
      total_anomalies: anomalies.length,
      par_niveau: parNiveau,
      par_territoire: parTerritoire,
      methode_detection: 'relative_deviation',
    },
  };
}

/**
 * Export alerts to JSON (fully anonymized)
 */
export function exportAlertesJSON(alerts: Alert[]): AlertesExport {
  // Fully anonymize: only aggregate data
  const donneesAnonymisees = alerts.map((alert) => ({
    type: alert.type,
    produit: alert.produit,
    territoire: alert.territoire,
    ecart_pourcent: alert.ecart_pourcent,
    date_observation: alert.date_observation,
    niveau:
      alert.type === 'hausse_anormale'
        ? Math.abs(alert.ecart_pourcent) >= 50
          ? 'forte'
          : Math.abs(alert.ecart_pourcent) >= 30
            ? 'moyenne'
            : 'faible'
        : 'info',
  }));

  const parType: Record<string, number> = {};
  const parTerritoire: Record<string, number> = {};

  for (const alert of alerts) {
    parType[alert.type] = (parType[alert.type] || 0) + 1;
    parTerritoire[alert.territoire] = (parTerritoire[alert.territoire] || 0) + 1;
  }

  return {
    metadata: createBaseMetadata(
      'Alertes citoyennes agrégées - A KI PRI SA YÉ',
      'Alertes citoyennes anonymisées déclenchées par des règles définies par les utilisateurs. ' +
        'Données agrégées, sans information personnelle.',
      'json'
    ),
    donnees: donneesAnonymisees,
    statistiques: {
      total_alertes: alerts.length,
      par_type: parType,
      par_territoire: parTerritoire,
    },
  };
}

/**
 * Convert observations to CSV
 */
export function exportObservationsCSV(observations: Observation[]): string {
  const headers = [
    'id',
    'territoire',
    'commune',
    'enseigne',
    'magasin_id',
    'date',
    'heure',
    'produit_nom',
    'produit_quantite',
    'produit_prix_unitaire',
    'produit_prix_total',
    'produit_tva_pct',
    'produit_categorie',
    'total_ttc',
    'source',
    'fiabilite',
    'verifie',
    'created_at',
  ];

  let csv = headers.join(',') + '\n';

  for (const obs of observations) {
    for (const product of obs.produits) {
      const row = [
        obs.id,
        obs.territoire,
        obs.commune,
        obs.enseigne,
        obs.magasin_id || '',
        obs.date,
        obs.heure,
        `"${product.nom.replace(/"/g, '""')}"`, // Escape quotes
        product.quantite,
        product.prix_unitaire,
        product.prix_total,
        product.tva_pct,
        product.categorie || '',
        obs.total_ttc,
        obs.source,
        obs.fiabilite,
        obs.verifie,
        obs.created_at,
      ];
      csv += row.join(',') + '\n';
    }
  }

  return csv;
}

/**
 * Convert anomalies to CSV (anonymized)
 */
export function exportAnomaliesCSV(anomalies: PriceAnomaly[]): string {
  const headers = [
    'produit',
    'territoire',
    'commune',
    'date',
    'prix_observe',
    'prix_reference',
    'ecart_absolu',
    'ecart_pourcent',
    'methode',
    'seuil',
    'niveau',
    'observations_historiques',
    'explication',
  ];

  let csv = headers.join(',') + '\n';

  for (const anomaly of anomalies) {
    const row = [
      `"${anomaly.produit.replace(/"/g, '""')}"`,
      anomaly.territoire,
      anomaly.commune,
      anomaly.date,
      anomaly.prix_observe,
      anomaly.prix_reference,
      anomaly.ecart_absolu,
      anomaly.ecart_pourcent,
      anomaly.methode,
      anomaly.seuil,
      anomaly.niveau,
      anomaly.observations_historiques,
      `"${anomaly.explication.replace(/"/g, '""')}"`,
    ];
    csv += row.join(',') + '\n';
  }

  return csv;
}

/**
 * Convert alerts to CSV (fully anonymized)
 */
export function exportAlertesCSV(alerts: Alert[]): string {
  const headers = ['type', 'produit', 'territoire', 'ecart_pourcent', 'date_observation', 'niveau'];

  let csv = headers.join(',') + '\n';

  for (const alert of alerts) {
    const niveau =
      alert.type === 'hausse_anormale'
        ? Math.abs(alert.ecart_pourcent) >= 50
          ? 'forte'
          : Math.abs(alert.ecart_pourcent) >= 30
            ? 'moyenne'
            : 'faible'
        : 'info';

    const row = [
      alert.type,
      `"${alert.produit.replace(/"/g, '""')}"`,
      alert.territoire,
      alert.ecart_pourcent,
      alert.date_observation,
      niveau,
    ];
    csv += row.join(',') + '\n';
  }

  return csv;
}

/**
 * Download file helper (browser)
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export observations (auto-detect format from extension)
 */
export function exportObservations(observations: Observation[], format: ExportFormat): void {
  if (format === 'json') {
    const data = exportObservationsJSON(observations);
    const content = JSON.stringify(data, null, 2);
    downloadFile(content, 'observations-akiprisaye.json', 'application/json');
  } else {
    const content = exportObservationsCSV(observations);
    downloadFile(content, 'observations-akiprisaye.csv', 'text/csv');
  }
}

/**
 * Export anomalies
 */
export function exportAnomalies(anomalies: PriceAnomaly[], format: ExportFormat): void {
  if (format === 'json') {
    const data = exportAnomaliesJSON(anomalies);
    const content = JSON.stringify(data, null, 2);
    downloadFile(content, 'anomalies-akiprisaye.json', 'application/json');
  } else {
    const content = exportAnomaliesCSV(anomalies);
    downloadFile(content, 'anomalies-akiprisaye.csv', 'text/csv');
  }
}

/**
 * Export alerts
 */
export function exportAlertes(alerts: Alert[], format: ExportFormat): void {
  if (format === 'json') {
    const data = exportAlertesJSON(alerts);
    const content = JSON.stringify(data, null, 2);
    downloadFile(content, 'alertes-akiprisaye.json', 'application/json');
  } else {
    const content = exportAlertesCSV(alerts);
    downloadFile(content, 'alertes-akiprisaye.csv', 'text/csv');
  }
}
