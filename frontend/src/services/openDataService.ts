 
/**
 * Open Data Service
 * 
 * Provides public access to price and anomaly data
 * Formats: JSON, CSV
 * License: Etalab 2.0
 */

import type { PriceAnomaly } from './anomalyDetectionService';

export interface OpenDataMetadata {
  version: string;
  generatedAt: string;
  licence: string;
  source: string;
  methodology: string;
  updateFrequency: string;
  territories: string[];
  recordCount: number;
  dataHash?: string;
}

export interface OpenDataPriceRecord {
  ean?: string;
  productName: string;
  category: string;
  territory: string;
  price: number;
  priceUnit: string;
  observedAt: string;
  store?: string;
  commune?: string;
  source: string;
  qualityScore?: number;
}

export interface OpenDataPricesExport {
  metadata: OpenDataMetadata;
  records: OpenDataPriceRecord[];
}

export interface OpenDataAnomaliesExport {
  metadata: OpenDataMetadata;
  anomalies: PriceAnomaly[];
}

/**
 * Generate metadata for open data exports
 */
export function generateMetadata(
  territories: string[],
  recordCount: number,
  type: 'prices' | 'anomalies'
): OpenDataMetadata {
  return {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    licence: 'Licence Ouverte / Open Licence Version 2.0 (Etalab)',
    source: 'A KI PRI SA YÉ - Observatoire Citoyen des Prix',
    methodology: 'https://akiprisaye.pages.dev/methodologie',
    updateFrequency: type === 'prices' ? 'Temps réel (agrégation quotidienne)' : 'Quotidienne',
    territories,
    recordCount,
  };
}

/**
 * Generate SHA-256 hash for data integrity
 * Falls back to a simple hash for environments without SubtleCrypto
 */
export async function generateDataHash(data: string): Promise<string> {
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    // Production environments should have crypto.subtle
    // This fallback is for development/testing only
    console.warn('SubtleCrypto not available - using fallback hash (not suitable for production)');
    return `fallback-${Date.now()}-${data.length}`;
  }

  try {
    const msgBuffer = new TextEncoder().encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  } catch (error) {
    console.error('Failed to generate hash:', error);
    return `error-${Date.now()}-${data.length}`;
  }
}

/**
 * Export prices to JSON format
 */
export async function exportPricesToJSON(
  records: OpenDataPriceRecord[],
  territories: string[]
): Promise<OpenDataPricesExport> {
  const metadata = generateMetadata(territories, records.length, 'prices');
  
  const dataString = JSON.stringify(records);
  metadata.dataHash = await generateDataHash(dataString);

  return {
    metadata,
    records,
  };
}

/**
 * Export prices to CSV format
 */
export function exportPricesToCSV(records: OpenDataPriceRecord[]): string {
  const headers = [
    'EAN',
    'Produit',
    'Catégorie',
    'Territoire',
    'Prix (EUR)',
    'Date Observation',
    'Enseigne',
    'Commune',
    'Source',
    'Score Qualité',
  ];

  const rows = records.map(record => [
    record.ean || '',
    record.productName,
    record.category,
    record.territory,
    record.price.toFixed(2),
    record.observedAt,
    record.store || '',
    record.commune || '',
    record.source,
    record.qualityScore?.toFixed(2) || '',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');

  // Add BOM for Excel compatibility
  return '\ufeff' + csvContent;
}

/**
 * Export anomalies to JSON format
 */
export async function exportAnomaliesToJSON(
  anomalies: PriceAnomaly[],
  territories: string[]
): Promise<OpenDataAnomaliesExport> {
  const metadata = generateMetadata(territories, anomalies.length, 'anomalies');
  
  const dataString = JSON.stringify(anomalies);
  metadata.dataHash = await generateDataHash(dataString);

  return {
    metadata,
    anomalies,
  };
}

/**
 * Export anomalies to CSV format
 */
export function exportAnomaliesToCSV(anomalies: PriceAnomaly[]): string {
  const headers = [
    'Type',
    'Sévérité',
    'Produit',
    'EAN',
    'Description',
    'Date Détection',
    'Métadonnées',
  ];

  const rows = anomalies.map(anomaly => [
    anomaly.type,
    anomaly.severity,
    anomaly.productName,
    anomaly.ean || '',
    anomaly.description,
    anomaly.detectedAt,
    JSON.stringify(anomaly.metadata),
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');

  // Add BOM for Excel compatibility
  return '\ufeff' + csvContent;
}

/**
 * Download data as file
 */
export function downloadAsFile(content: string, filename: string, mimeType: string): void {
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
 * Download prices as JSON
 */
export async function downloadPricesJSON(records: OpenDataPriceRecord[], territories: string[]): Promise<void> {
  const data = await exportPricesToJSON(records, territories);
  const content = JSON.stringify(data, null, 2);
  const timestamp = new Date().toISOString().split('T')[0];
  downloadAsFile(content, `akiprisaye-prices-${timestamp}.json`, 'application/json');
}

/**
 * Download prices as CSV
 */
export function downloadPricesCSV(records: OpenDataPriceRecord[]): void {
  const content = exportPricesToCSV(records);
  const timestamp = new Date().toISOString().split('T')[0];
  downloadAsFile(content, `akiprisaye-prices-${timestamp}.csv`, 'text/csv;charset=utf-8');
}

/**
 * Download anomalies as JSON
 */
export async function downloadAnomaliesJSON(anomalies: PriceAnomaly[], territories: string[]): Promise<void> {
  const data = await exportAnomaliesToJSON(anomalies, territories);
  const content = JSON.stringify(data, null, 2);
  const timestamp = new Date().toISOString().split('T')[0];
  downloadAsFile(content, `akiprisaye-anomalies-${timestamp}.json`, 'application/json');
}

/**
 * Download anomalies as CSV
 */
export function downloadAnomaliesCSV(anomalies: PriceAnomaly[]): void {
  const content = exportAnomaliesToCSV(anomalies);
  const timestamp = new Date().toISOString().split('T')[0];
  downloadAsFile(content, `akiprisaye-anomalies-${timestamp}.csv`, 'text/csv;charset=utf-8');
}
