// src/components/ExportDataButton.tsx
// PR-04: Data Export Component
// Factual data export with format selection

import React, { useState } from 'react'
import type { PriceObservation } from '../types/priceObservation'
import { exportToCSV, exportToJSON, exportToText, getSanitizedFilename } from '../utils/exportData'

type ExportFormat = 'csv' | 'json' | 'txt'

type ExportDataButtonProps = {
  observations: PriceObservation[]
  disabled?: boolean
  label?: string
}

export default function ExportDataButton({ observations, disabled = false, label = 'Exporter les données' }: ExportDataButtonProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [exporting, setExporting] = useState(false)

  // Feature flag check
  const isFeatureEnabled = import.meta.env.VITE_FEATURE_DATA_EXPORT === 'true'

  if (!isFeatureEnabled) {
    return null
  }

  const handleExport = async (format: ExportFormat) => {
    if (observations.length === 0) {
      alert('Aucune donnée à exporter')
      return
    }

    setExporting(true)
    setShowMenu(false)

    try {
      const filename = getSanitizedFilename('observations-prix', format)

      switch (format) {
        case 'csv':
          exportToCSV(observations, filename)
          break
        case 'json':
          exportToJSON(observations, filename)
          break
        case 'txt':
          exportToText(observations, filename)
          break
      }

      // Small delay to show feedback
      await new Promise(resolve => setTimeout(resolve, 500))
    } catch (error) {
      console.error('Export error:', error)
      alert('Erreur lors de l\'export des données')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setShowMenu(!showMenu)}
        disabled={disabled || exporting || observations.length === 0}
        className="px-4 py-2 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center gap-2"
        aria-label={label}
        aria-expanded={showMenu}
      >
        {exporting ? (
          <>
            <span className="animate-spin">⏳</span>
            <span>Export...</span>
          </>
        ) : (
          <>
            <span>📥</span>
            <span>{label}</span>
          </>
        )}
      </button>

      {showMenu && !exporting && (
        <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-white/[0.22] rounded-lg shadow-lg z-10">
          <div className="py-2">
            <button
              onClick={() => handleExport('csv')}
              className="w-full px-4 py-2 text-left text-white hover:bg-white/[0.1] transition-colors flex items-center gap-2"
              aria-label="Exporter au format CSV"
            >
              <span>📊</span>
              <span>CSV (Excel)</span>
            </button>
            
            <button
              onClick={() => handleExport('json')}
              className="w-full px-4 py-2 text-left text-white hover:bg-white/[0.1] transition-colors flex items-center gap-2"
              aria-label="Exporter au format JSON"
            >
              <span>📄</span>
              <span>JSON</span>
            </button>
            
            <button
              onClick={() => handleExport('txt')}
              className="w-full px-4 py-2 text-left text-white hover:bg-white/[0.1] transition-colors flex items-center gap-2"
              aria-label="Exporter au format texte"
            >
              <span>📝</span>
              <span>Texte (.txt)</span>
            </button>
          </div>

          <div className="border-t border-white/[0.12] px-4 py-2">
            <p className="text-xs text-white/50">
              {observations.length} observation{observations.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {showMenu && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowMenu(false)}
        />
      )}
    </div>
  )
}
