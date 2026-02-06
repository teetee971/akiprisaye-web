// src/components/StoreComparisonTable.tsx
import React, { useState } from 'react'
import { useFavorites } from '../hooks/useFavorites'
import Sparkline from './Sparkline'
import { GlassCard } from './ui/glass-card'
import type { StoreComparison } from '../services/storeComparisonService'

type StoreComparisonTableProps = {
  comparisons: StoreComparison[]
  productName: string
  onAddToCart?: (store: string, price: number) => void
  territoryLabel?: string
}

export default function StoreComparisonTable({
  comparisons,
  productName,
  onAddToCart,
  territoryLabel = 'Disponible dans votre territoire',
}: StoreComparisonTableProps) {
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  if (!comparisons || comparisons.length === 0) {
    return (
      <GlassCard>
        <p className="text-white/70">
          Aucune comparaison disponible pour ce produit. Essayez un autre produit ou changez de territoire.
        </p>
      </GlassCard>
    )
  }

  const formatPrice = (price: number) => price.toFixed(2) + ' €'
  const formatPercentage = (pct: number) => {
    const sign = pct > 0 ? '+' : ''
    return sign + pct.toFixed(1) + '%'
  }
  const { isFavorite, toggleFavorite } = useFavorites()
  const showToast = (message: string) => {
    setToastMessage(message)
    window.setTimeout(() => setToastMessage(null), 1400)
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

              const favoriteId = `comparison:${productName}:${comp.store}`
              const favoriteActive = isFavorite(favoriteId)

              const lastUpdated = comp.observations.reduce<Date | null>((latest, obs) => {
                const date = new Date(obs.date)
                if (Number.isNaN(date.getTime())) return latest
                if (!latest || date > latest) return date
                return latest
              }, null)
              const formattedUpdated = lastUpdated ? lastUpdated.toLocaleDateString('fr-FR') : '—'
              const daysSinceObservation = lastUpdated
                ? Math.floor((Date.now() - lastUpdated.getTime()) / 86400000)
                : null
              const freshnessLabel =
                daysSinceObservation === null
                  ? null
                  : daysSinceObservation <= 7
                  ? 'Récent'
                  : 'À vérifier'

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
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-white/60">
                      <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5">
                        🕒 {formattedUpdated}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-emerald-200">
                        📍 {territoryLabel}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="text-lg font-bold text-blue-400">{formatPrice(comp.currentPrice)}</span>
                    <div className="mt-1 text-xs text-white/60">
                      {lastUpdated ? `Prix observé le ${formattedUpdated}` : "Date d’observation non disponible"}
                    </div>
                    {freshnessLabel && (
                      <span
                        className={`mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-xs opacity-80 ${
                          freshnessLabel === 'Récent'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-orange-100 text-orange-700'
                        }`}
                      >
                        {freshnessLabel}
                      </span>
                    )}
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
                    <div className="flex flex-col items-center gap-2">
                      <button
                        onClick={() => onAddToCart?.(comp.store, comp.currentPrice)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded transition-colors"
                        aria-label={`Ajouter ${productName} de ${comp.store} au ti-panier`}
                      >
                        Ajouter au ti-panier
                      </button>
                      <button
                        onClick={() =>
                          (() => {
                            const message = favoriteActive ? 'Favori retiré' : '⭐ Ajouté aux favoris'
                            toggleFavorite({
                              id: favoriteId,
                              label: `${productName} • ${comp.store}`,
                              type: 'comparison',
                              productName,
                              store: comp.store,
                              route: `/comparaison-enseignes?product=${encodeURIComponent(productName)}`,
                            })
                            showToast(message)
                          })()
                        }
                        className={`px-3 py-1.5 text-sm rounded border transition-colors ${
                          favoriteActive
                            ? 'bg-amber-400/20 border-amber-400 text-amber-200'
                            : 'bg-white/5 border-white/20 text-white/70 hover:text-amber-200'
                        }`}
                        aria-pressed={favoriteActive}
                      >
                        {favoriteActive ? '⭐ Favori' : '☆ Favori'}
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </GlassCard>
      <p className="mt-2 text-xs text-white/60">Les prix peuvent varier selon les magasins.</p>
      {toastMessage && (
        <div
          className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-slate-900/90 border border-slate-700 text-slate-100 text-sm px-4 py-2 rounded-full shadow-lg"
          role="status"
          aria-live="polite"
        >
          {toastMessage}
        </div>
      )}
    </div>
  )
}
