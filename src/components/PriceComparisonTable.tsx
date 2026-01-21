// src/components/PriceComparisonTable.tsx
import React, { useEffect, useMemo, useState } from 'react'
import type { PriceObservation } from '../types/PriceObservation'
import PriceSourceBadge from './PriceSourceBadge'
import PriceHistoryMiniChart from './PriceHistoryMiniChart'
import { safeLocalStorage } from '../utils/safeLocalStorage';

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

  const getTimestamp = (value: string) => {
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime()
  }

  const getDateLabel = (value: string) => {
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) {
      return 'Date inconnue'
    }
    return parsed.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const territoryLabels: Record<string, string> = {
    FR: 'France (métropole)',
    GP: 'Guadeloupe',
    MQ: 'Martinique',
    GF: 'Guyane',
    RE: 'La Réunion',
    YT: 'Mayotte',
  }

  const getConfidenceMeta = (observation: PriceObservation, history: PriceObservation[]) => {
    const sourcesCount = observation.observationsCount ?? history.length
    const observedAt = new Date(observation.observedAt)
    const freshnessDays = Number.isNaN(observedAt.getTime())
      ? 999
      : Math.floor((Date.now() - observedAt.getTime()) / (1000 * 60 * 60 * 24))

    const prices = history.map((item) => item.price)
    const max = prices.length > 0 ? Math.max(...prices) : observation.price
    const min = prices.length > 0 ? Math.min(...prices) : observation.price
    const average = prices.length > 0 ? prices.reduce((sum, value) => sum + value, 0) / prices.length : observation.price
    const spreadRatio = average === 0 ? 0 : (max - min) / average

    const sourceScore = sourcesCount >= 5 ? 2 : sourcesCount >= 2 ? 1 : 0
    const freshnessScore = freshnessDays <= 7 ? 2 : freshnessDays <= 30 ? 1 : 0
    const coherenceScore = spreadRatio <= 0.1 ? 2 : spreadRatio <= 0.25 ? 1 : 0
    const total = sourceScore + freshnessScore + coherenceScore

    if (total >= 5) {
      return { label: 'Confiance élevée', className: 'bg-emerald-500/20 text-emerald-200' }
    }
    if (total >= 3) {
      return { label: 'Confiance moyenne', className: 'bg-yellow-500/20 text-yellow-200' }
    }
    return { label: 'Confiance faible', className: 'bg-red-500/20 text-red-200' }
  }

  // Ordre chronologique par défaut
  const sorted = [...observations].sort(
    (a, b) => getTimestamp(a.observedAt) - getTimestamp(b.observedAt)
  )

  const bestPriceByTerritory = sorted.reduce<Record<string, number>>((acc, obs) => {
    if (!acc[obs.territory] || obs.price < acc[obs.territory]) {
      acc[obs.territory] = obs.price
    }
    return acc
  }, {})

  const STORAGE_KEY = 'comparateur:watched-prices:v1'

  const buildWatchKey = (observation: PriceObservation, storeLabel: string) =>
    `${observation.productId}:${storeLabel}:${observation.territory}`

  const readWatchedPrices = () => {
    if (typeof window === 'undefined') return {}
    try {
      const raw = safeLocalStorage.getItem(STORAGE_KEY)
      return raw ? (JSON.parse(raw) as Record<string, { price: number; observedAt: string }>) : {}
    } catch {
      return {}
    }
  }

  const [watchedPrices, setWatchedPrices] = useState<Record<string, { price: number; observedAt: string }>>(
    () => readWatchedPrices()
  )

  const persistWatchedPrices = (payload: Record<string, { price: number; observedAt: string }>) => {
    if (typeof window === 'undefined') return
    safeLocalStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  }

  const toggleWatch = (key: string, observation: PriceObservation) => {
    setWatchedPrices((prev) => {
      const next = { ...prev }
      if (next[key]) {
        delete next[key]
      } else {
        next[key] = { price: observation.price, observedAt: observation.observedAt }
      }
      persistWatchedPrices(next)
      return next
    })
  }

  const watchedKeys = useMemo(() => new Set(Object.keys(watchedPrices)), [watchedPrices])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (observations.length === 0) return
    setWatchedPrices((prev) => {
      const next = { ...prev }
      let updated = false
      observations.forEach((obs) => {
        const storeLabel = obs.storeLabel ?? 'Enseigne inconnue'
        const key = buildWatchKey(obs, storeLabel)
        if (next[key] && next[key].price !== obs.price) {
          next[key] = { price: obs.price, observedAt: obs.observedAt }
          updated = true
        }
      })
      if (updated) {
        persistWatchedPrices(next)
      }
      return next
    })
  }, [observations])

  const getPriceStatus = (observation: PriceObservation, history: PriceObservation[]) => {
    const now = Date.now()
    const windowStart = now - 30 * 24 * 60 * 60 * 1000
    const recent = history.filter((item) => {
      const ts = getTimestamp(item.observedAt)
      return ts >= windowStart
    })
    const baseline = recent.length >= 3 ? recent : history
    const prices = baseline.map((item) => item.price).sort((a, b) => a - b)
    if (prices.length === 0) {
      return {
        label: 'Prix habituel',
        className: 'bg-slate-500/20 text-slate-200',
        note: 'Pas assez d’historique pour qualifier ce prix.',
      }
    }

    const medianIndex = Math.floor(prices.length / 2)
    const median =
      prices.length % 2 === 0
        ? (prices[medianIndex - 1] + prices[medianIndex]) / 2
        : prices[medianIndex]
    const deviation = median === 0 ? 0 : (observation.price - median) / median
    const basisLabel = baseline === recent ? '30 derniers jours' : 'historique disponible'

    if (deviation <= -0.1) {
      return {
        label: 'Prix bas',
        className: 'bg-emerald-500/15 text-emerald-200',
        reason: 'Prix inférieur à la médiane récente',
        opportunity: 'Moment favorable pour acheter',
        note: `Ce prix est inférieur à la moyenne observée sur les ${basisLabel}.`,
      }
    }
    if (deviation >= 0.1) {
      return {
        label: 'Prix élevé',
        className: 'bg-orange-500/15 text-orange-200',
        reason: 'Prix supérieur aux dernières observations',
        opportunity: 'Prix au-dessus des niveaux récents',
        note: `Ce prix est supérieur à la moyenne observée sur les ${basisLabel}.`,
      }
    }
    return {
      label: 'Prix habituel',
      className: 'bg-blue-500/15 text-blue-200',
      reason: 'Prix aligné sur la tendance observée',
      opportunity: 'Prix stable récemment',
      note: `Ce prix est proche de la moyenne observée sur les ${basisLabel}.`,
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[840px]" aria-label="Tableau de comparaison des prix observés">
        <caption className="sr-only">
          Comparaison des prix observés entre enseignes pour ce produit
        </caption>
        <thead>
          <tr className="border-b border-white/[0.22]">
            <th className="text-left py-3 px-4 text-white/90 font-semibold">Enseigne</th>
            <th className="text-right py-3 px-4 text-white/90 font-semibold">Prix</th>
            <th className="text-center py-3 px-4 text-white/90 font-semibold">Statut</th>
            <th className="text-center py-3 px-4 text-white/90 font-semibold">Date observation</th>
            <th className="text-center py-3 px-4 text-white/90 font-semibold">Source</th>
            <th className="text-center py-3 px-4 text-white/90 font-semibold">Territoire</th>
            <th className="text-center py-3 px-4 text-white/90 font-semibold">Historique</th>
            <th className="text-center py-3 px-4 text-white/90 font-semibold">Confiance</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((obs, index) => {
            const storeLabel = obs.storeLabel ?? 'Enseigne inconnue'
            const storeHistory = groupedByStore[storeLabel] || []
            const currency = obs.currency ?? 'EUR'
            const confidence = getConfidenceMeta(obs, storeHistory)
            const territoryLabel = territoryLabels[obs.territory] ?? obs.territory
            const bestPrice = bestPriceByTerritory[obs.territory]
            const isBestPrice = bestPrice !== undefined && obs.price === bestPrice
            const priceStatus = getPriceStatus(obs, storeHistory)
            const watchKey = buildWatchKey(obs, storeLabel)
            const watched = watchedKeys.has(watchKey)
            const previousPrice = watchedPrices[watchKey]?.price
            const hasPriceChange = watched && previousPrice !== undefined && previousPrice !== obs.price
            
            return (
              <React.Fragment key={`${obs.productId}-${storeLabel}-${obs.observedAt}-${index}`}>
                <tr className="border-b border-white/[0.12] hover:bg-white/[0.05] transition-colors">
                  <td className="py-3 px-4 text-white/90">{storeLabel}</td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-lg font-semibold text-blue-400">
                        {obs.price.toFixed(2)} {currency}
                      </span>
                      {isBestPrice && (
                        <span className="text-xs text-emerald-200 bg-emerald-500/20 px-2 py-1 rounded-full">
                          Meilleur prix aujourd’hui en {territoryLabel}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${priceStatus.className}`}
                        title={priceStatus.note}
                      >
                        {priceStatus.label}
                      </span>
                      <span className="text-[11px] text-white/60">{priceStatus.reason}</span>
                      <span className="text-[11px] text-white/50">{priceStatus.opportunity}</span>
                      {hasPriceChange && (
                        <span className="text-[11px] text-emerald-200">Prix en évolution depuis votre dernière visite</span>
                      )}
                      <button
                        type="button"
                        onClick={() => toggleWatch(watchKey, obs)}
                        className={`mt-1 px-2 py-1 text-[11px] rounded-full border ${
                          watched
                            ? 'border-emerald-400/60 text-emerald-200 bg-emerald-500/10'
                            : 'border-white/20 text-white/60 hover:text-white'
                        }`}
                      >
                        {watched ? 'Surveillé' : 'Surveiller ce prix'}
                      </button>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center text-sm text-white/70">
                    {getDateLabel(obs.observedAt)}
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
                    <div className="flex flex-col items-center gap-1">
                      <PriceHistoryMiniChart observations={storeHistory} width={120} height={48} />
                      <span className="text-[10px] text-white/50">
                        {storeHistory.length} obs.
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${confidence.className}`}>
                      {confidence.label}
                    </span>
                  </td>
                </tr>
                <tr className="border-b border-white/[0.08]">
                  <td colSpan={8} className="px-4 pb-4">
                    <div className="bg-slate-900/70 border border-white/[0.08] rounded-lg p-3 text-xs text-white/70 space-y-1">
                      <p>
                        <span className="font-semibold text-white/90">Lecture du prix :</span> {priceStatus.note}
                      </p>
                      <span className="font-semibold text-white/90">Pourquoi ce prix ?</span>{' '}
                      Sources utilisées : {obs.observationsCount ?? storeHistory.length} • Dernière observation :{' '}
                      {getDateLabel(obs.observedAt)} • Territoire : {territoryLabel}. Données issues de sources ouvertes
                      et d’observations citoyennes, consolidées pour éviter les écarts isolés.
                    </div>
                  </td>
                </tr>
              </React.Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
