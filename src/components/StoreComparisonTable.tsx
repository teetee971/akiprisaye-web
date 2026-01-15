// src/components/StoreComparisonTable.tsx
import React from 'react'
import Sparkline from './Sparkline'
import { GlassCard } from './ui/glass-card'
import type { StoreComparison } from '../services/storeComparisonService'

type StoreComparisonTableProps = {
  comparisons: StoreComparison[]
  productName: string
  onAddToCart?: (store: string, price: number) => void
}

export default function StoreComparisonTable({
  comparisons,
  productName,
  onAddToCart,
}: StoreComparisonTableProps) {
  if (!comparisons || comparisons.length === 0) {
    return (
      <GlassCard>
        <p className="text-white/70">Aucune comparaison disponible pour ce produit.</p>
      </GlassCard>
    )
  }

  const formatPrice = (price: number) => price.toFixed(2) + ' €'
  const formatPercentage = (pct: number) => {
    const sign = pct > 0 ? '+' : ''
    return sign + pct.toFixed(1) + '%'
  }

  return (
    <div className="overflow-x-auto">
      <GlassCard>
        <table className="w-full min-w-[600px]" aria-label={`Comparaison des prix pour ${productName}`}>
          <caption className="sr-only">
            Tableau de comparaison des prix de {productName} entre différentes enseignes
          </caption>
          <thead>
            <tr className="border-b border-white/[0.22]">
              <th className="text-left py-3 px-4 text-white/90 font-semibold">Enseigne</th>
              <th className="text-right py-3 px-4 text-white/90 font-semibold">Prix actuel</th>
              <th className="text-right py-3 px-4 text-white/90 font-semibold">Écart</th>
              <th className="text-center py-3 px-4 text-white/90 font-semibold">Tendance 30j</th>
              <th className="text-center py-3 px-4 text-white/90 font-semibold">Historique</th>
              <th className="text-center py-3 px-4 text-white/90 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {comparisons.map((comp, idx) => {
              const prices = comp.observations
                .slice()
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                .map(obs => obs.price)

              return (
                <tr
                  key={idx}
                  className="border-b border-white/[0.12] hover:bg-white/[0.05] transition-colors"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className="text-white/90">{comp.store}</span>
                      {comp.isBestPrice && (
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-600 text-white"
                          aria-label="Meilleur prix"
                        >
                          Meilleur prix
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="text-lg font-bold text-blue-400">{formatPrice(comp.currentPrice)}</span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {comp.isBestPrice ? (
                      <span className="text-green-400 text-sm">—</span>
                    ) : (
                      <div className="text-sm">
                        <div className="text-red-400">+{formatPrice(comp.differenceFromBest.amount)}</div>
                        <div className="text-red-300 text-xs">
                          ({formatPercentage(comp.differenceFromBest.percentage)})
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`text-sm font-medium ${
                        comp.trend30d > 0 ? 'text-red-400' : comp.trend30d < 0 ? 'text-green-400' : 'text-white/60'
                      }`}
                      aria-label={`Tendance sur 30 jours: ${formatPercentage(comp.trend30d)}`}
                    >
                      {formatPercentage(comp.trend30d)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex justify-center" aria-label="Graphique de l'historique des prix">
                      <Sparkline
                        data={prices}
                        width={100}
                        height={30}
                        stroke={comp.trend30d > 0 ? '#f87171' : comp.trend30d < 0 ? '#4ade80' : '#60a5fa'}
                      />
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => onAddToCart?.(comp.store, comp.currentPrice)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded transition-colors"
                      aria-label={`Ajouter ${productName} de ${comp.store} au ti-panier`}
                    >
                      Ajouter au ti-panier
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </GlassCard>
    </div>
  )
}
