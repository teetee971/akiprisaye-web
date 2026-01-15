// src/components/PriceSourceBadge.tsx
import React from 'react'
import type { PriceObservation } from '../types/priceObservation'

type PriceSourceBadgeProps = {
  observation: PriceObservation
}

const SOURCE_LABELS = {
  ticket_scan: 'Scan ticket',
  agent_public: 'Agent public',
  open_data: 'Open Data',
}

export default function PriceSourceBadge({ observation }: PriceSourceBadgeProps) {
  const sourceLabel = SOURCE_LABELS[observation.source]
  const date = new Date(observation.observationDate).toLocaleDateString('fr-FR')

  return (
    <div className="inline-flex items-center">
      <span
        className="px-2 py-1 text-xs rounded bg-blue-500/20 text-blue-300 cursor-help"
        title={`Source: ${sourceLabel}\nDate: ${date}${observation.sourceRef ? `\nRéférence: ${observation.sourceRef}` : ''}`}
      >
        {sourceLabel}
      </span>
    </div>
  )
}
