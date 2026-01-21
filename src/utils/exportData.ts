// src/utils/exportData.ts
// PR-04: Data Export Utilities (CSV/PDF)
// Factual data export only, no transformations

import type { PriceObservation } from '../types/PriceObservation'

/**
 * Export price observations to CSV format
 * Strictly preserves original data without modifications
 */
export function exportToCSV(observations: PriceObservation[], filename: string = 'observations-prix.csv'): void {
  if (!observations || observations.length === 0) {
    console.warn('No data to export')
    return
  }

  // CSV Headers (French institutional)
  const headers = [
    'Identifiant produit',
    'Produit',
    'Enseigne',
    'Territoire',
    'Prix (EUR)',
    'Date Observation',
    'Source',
    'Observations',
    'Confiance (%)',
  ]

  // Convert observations to CSV rows
  const rows = observations.map(obs => [
    obs.productId,
    obs.productLabel,
    obs.storeLabel,
    obs.territory,
    obs.price.toFixed(2),
    obs.observedAt,
    obs.sourceType,
    obs.observationsCount,
    Math.round(obs.confidenceScore)
  ])

  // Build CSV content
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => {
      // Escape cells containing commas or quotes
      const cellStr = String(cell)
      if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
        return `"${cellStr.replace(/"/g, '""')}"`
      }
      return cellStr
    }).join(','))
  ].join('\n')

  // Add BOM for UTF-8 compatibility with Excel
  const BOM = '\uFEFF'
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
  
  // Trigger download
  downloadFile(blob, filename)
}

/**
 * Export price observations to JSON format
 * Raw data export without any processing
 */
export function exportToJSON(observations: PriceObservation[], filename: string = 'observations-prix.json'): void {
  if (!observations || observations.length === 0) {
    console.warn('No data to export')
    return
  }

  // Add metadata
  const exportData = {
    metadata: {
      exportDate: new Date().toISOString(),
      recordCount: observations.length,
      source: 'A KI PRI SA YÉ - Service Public Numérique',
      disclaimer: 'Données factuelles observées. Aucune garantie, aucune recommandation.'
    },
    observations: observations
  }

  const jsonContent = JSON.stringify(exportData, null, 2)
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' })
  
  downloadFile(blob, filename)
}

/**
 * Export price observations summary to simple text format
 */
export function exportToText(observations: PriceObservation[], filename: string = 'observations-prix.txt'): void {
  if (!observations || observations.length === 0) {
    console.warn('No data to export')
    return
  }

  const lines = [
    '═══════════════════════════════════════════════════════',
    'A KI PRI SA YÉ - Observations de Prix',
    'Service Public Numérique - Données Factuelles',
    '═══════════════════════════════════════════════════════',
    '',
    `Date d'export: ${new Date().toLocaleString('fr-FR')}`,
    `Nombre d'observations: ${observations.length}`,
    '',
    'Avertissement:',
    'Données factuelles observées uniquement.',
    'Aucune analyse prédictive, aucune recommandation.',
    '',
    '═══════════════════════════════════════════════════════',
    '',
    ...observations.map((obs, index) => [
      `[${index + 1}] ${obs.productLabel}`,
      `    ID produit: ${obs.productId}`,
      `    Enseigne: ${obs.storeLabel}`,
      `    Territoire: ${obs.territory}`,
      `    Prix: ${obs.price.toFixed(2)} EUR`,
      `    Date: ${new Date(obs.observedAt).toLocaleString('fr-FR')}`,
      `    Source: ${obs.sourceType}`,
      `    Observations: ${obs.observationsCount}`,
      `    Confiance: ${Math.round(obs.confidenceScore)}%`,
      ''
    ]).flat()
  ]

  const textContent = lines.join('\n')
  const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8;' })
  
  downloadFile(blob, filename)
}

/**
 * Helper function to trigger file download
 */
function downloadFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.style.display = 'none'
  
  document.body.appendChild(link)
  link.click()
  
  // Cleanup
  setTimeout(() => {
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, 100)
}

/**
 * Get sanitized filename with timestamp
 */
export function getSanitizedFilename(prefix: string, extension: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
  return `${prefix}-${timestamp}.${extension}`
}

export default {
  exportToCSV,
  exportToJSON,
  exportToText,
  getSanitizedFilename
}
