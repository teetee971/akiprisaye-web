// src/components/PriceDataWarning.tsx
import React from 'react'

type PriceDataWarningProps = {
  hasOldData?: boolean
  storeCount?: number
  isIncomplete?: boolean
}

export default function PriceDataWarning({ hasOldData, storeCount, isIncomplete }: PriceDataWarningProps) {
  const warnings: string[] = []

  if (hasOldData) {
    warnings.push('Certaines données ont plus de 30 jours')
  }

  if (storeCount !== undefined && storeCount < 2) {
    warnings.push('Moins de 2 enseignes référencées')
  }

  if (isIncomplete) {
    warnings.push('Couverture territoriale incomplète')
  }

  if (warnings.length === 0) return null

  return (
    <div className="p-4 bg-orange-500/20 border border-orange-500/50 rounded-lg">
      <div className="flex items-start gap-2">
        <span className="text-orange-400 text-lg">⚠️</span>
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-orange-300 mb-1">Avertissement sur les données</h4>
          <ul className="text-xs text-orange-200 space-y-1">
            {warnings.map((warning, index) => (
              <li key={index}>• {warning}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
