// src/components/PriceComparisonTable.tsx
import React from 'react'
import type { PriceObservation } from '../types/priceObservation'
import PriceSourceBadge from './PriceSourceBadge'
import PriceHistoryMiniChart from './PriceHistoryMiniChart'

type PriceComparisonTableProps = {
  observations: PriceObservation[]
  groupedByStore: Record<string, PriceObservation[]>
}

export default function PriceComparisonTable({ observations, groupedByStore }: PriceComparisonTableProps) {
  if (observations.length === 0) {
    return (
      <div className="text-center py-8 text-white/60">
        Aucune observation disponible pour ce produit.
      </div>
    )
  }

  // Ordre chronologique par défaut
  const sorted = [...observations].sort(
    (a, b) => new Date(a.observationDate).getTime() - new Date(b.observationDate).getTime()
  )

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[700px]" aria-label="Tableau de comparaison des prix observés">
        <caption className="sr-only">
          Comparaison des prix observés entre enseignes pour ce produit
        </caption>
        <thead>
          <tr className="border-b border-white/[0.22]">
            <th className="text-left py-3 px-4 text-white/90 font-semibold">Enseigne</th>
            <th className="text-right py-3 px-4 text-white/90 font-semibold">Prix</th>
            <th className="text-center py-3 px-4 text-white/90 font-semibold">Date observation</th>
            <th className="text-center py-3 px-4 text-white/90 font-semibold">Source</th>
            <th className="text-center py-3 px-4 text-white/90 font-semibold">Territoire</th>
            <th className="text-center py-3 px-4 text-white/90 font-semibold">Historique</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((obs, index) => {
            const storeHistory = groupedByStore[obs.store] || []
            
            return (
              <tr
                key={`${obs.ean}-${obs.store}-${obs.observationDate}-${index}`}
                className="border-b border-white/[0.12] hover:bg-white/[0.05] transition-colors"
              >
                <td className="py-3 px-4 text-white/90">{obs.store}</td>
                <td className="py-3 px-4 text-right">
                  <span className="text-lg font-semibold text-blue-400">
                    {obs.price.toFixed(2)} {obs.currency}
                  </span>
                </td>
                <td className="py-3 px-4 text-center text-sm text-white/70">
                  {new Date(obs.observationDate).toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </td>
                <td className="py-3 px-4 text-center">
                  <PriceSourceBadge observation={obs} />
                </td>
                <td className="py-3 px-4 text-center">
                  <span className="px-2 py-1 text-xs rounded bg-white/[0.1] text-white/80">
                    {obs.territory}
                  </span>
                </td>
                <td className="py-3 px-4 text-center">
                  <div className="flex justify-center">
                    <PriceHistoryMiniChart observations={storeHistory} />
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
