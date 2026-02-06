// src/components/PriceSourceBadge.tsx
import React from 'react'
import type { PriceObservation } from '../types/PriceObservation'

type PriceSourceBadgeProps = {
  observation: PriceObservation
}

const SOURCE_LABELS: Record<NonNullable<PriceObservation['sourceType']>, string> = {
  citizen: 'Signalement citoyen',
  open_data: 'Open Data',
  partner: 'Partenaire',
}

export default function PriceSourceBadge({ observation }: PriceSourceBadgeProps) {
  const sourceType = observation.sourceType
  const sourceLabel = sourceType ? SOURCE_LABELS[sourceType] : 'Source inconnue'
  const date = new Date(observation.observedAt).toLocaleDateString('fr-FR')
  const confidence =
    typeof observation.confidenceScore === 'number'
      ? Math.round(observation.confidenceScore)
      : null

  return (
    <div className="inline-flex items-center">
      <span
        className="px-2 py-1 text-xs rounded bg-blue-500/20 text-blue-300 cursor-help"
        title={`Source: ${sourceLabel}\nDate: ${date}\nObservations: ${
          observation.observationsCount ?? '—'
        }\nConfiance: ${confidence !== null ? `${confidence}%` : '—'}`}
      >
        {sourceLabel}
      </span>
    </div>
  )
}
