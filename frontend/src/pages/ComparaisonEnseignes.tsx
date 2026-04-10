// src/pages/ComparaisonEnseignes.tsx
// PR-02: Inter-Store Comparison in Factual Observation Mode
// Phase 2 - Strictly factual data, no predictions or recommendations

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Check, ChevronDown, Copy, Lock, Search, Share2, X } from 'lucide-react'
import { GlassCard } from '../components/ui/glass-card'
import { HeroImage } from '../components/ui/HeroImage'
import { PAGE_HERO_IMAGES } from '../config/imageAssets'
import { EmptyState } from '../components/ui/DataStateIndicator'
import PriceComparisonTable from '../components/PriceComparisonTable'
import PriceDataWarning from '../components/PriceDataWarning'
import ExportDataButton from '../components/ExportDataButton'
import DataReliabilityBadge from '../components/DataReliabilityBadge'
import LocalHistoryPanel from '../components/LocalHistoryPanel'
import PriceVariationAlert from '../components/PriceVariationAlert'
import SignalementCitoyenModal from '../components/SignalementCitoyenModal'
import TerritoryAdvancedFilter, {
  type TerritoryFilters,
  type Territory,
  type ZoneType,
  type DataCategory,
} from '../components/TerritoryAdvancedFilter'
import { EcartHexagone } from '../components/EcartHexagone'
import { useLocalHistory } from '../hooks/useLocalHistory'
import { priceObservationService } from '../services/priceObservationService'
import {
  aggregateObservations,
  groupByStore,
  hasOldData,
  countUniqueStores,
} from '../services/priceAggregationService'
import { initAutoUpdate, getLastUpdateDate } from '../services/priceUpdateScheduler'
import { computeScoreEnseigne, type EnseigneScore } from '../services/scoreEnseigneService'
import type { PriceObservation } from '../types/PriceObservation'

import { SEOHead } from '../components/ui/SEOHead';
type ProductOption = {
  id: string
  label: string
}

type FilterOption = {
  id: string
  label: string
}

type SelectorSheetProps = {
  label: string
  value: string
  onChange: (value: string) => void
  options: FilterOption[]
  placeholder: string
  allLabel?: string
  enableSearch?: boolean
  disabled?: boolean
}

function SelectorSheet({
  label,
  value,
  onChange,
  options,
  placeholder,
  allLabel,
  enableSearch = false,
  disabled = false,
}: SelectorSheetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const searchInputRef = useRef<HTMLInputElement | null>(null)

  const selectedLabel =
    value === 'all'
      ? allLabel ?? placeholder
      : options.find((option) => option.id === value)?.label ?? placeholder

  const filteredOptions = useMemo(() => {
    if (!enableSearch) return options
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) return options

    return options.filter((option) => option.label.toLowerCase().includes(normalizedQuery))
  }, [enableSearch, options, query])

  const handleSelect = (nextValue: string) => {
    onChange(nextValue)
    setIsOpen(false)
    setQuery('')
  }

  useEffect(() => {
    if (!isOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    if (enableSearch) {
      searchInputRef.current?.focus()
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
        setQuery('')
      }
    }

    window.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [enableSearch, isOpen])

  return (
    <>
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-white/90">{label}</label>
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="hidden w-full rounded-2xl border border-white/15 bg-white/[0.06] px-4 py-3 text-white outline-none transition focus:border-blue-400/60 md:block"
          aria-label={label}
          disabled={disabled}
        >
          {allLabel && (
            <option value="all" className="bg-slate-900 text-white">
              {allLabel}
            </option>
          )}
          {options.map((option) => (
            <option key={option.id} value={option.id} className="bg-slate-900 text-white">
              {option.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          disabled={disabled}
          className="flex w-full items-center justify-between gap-3 rounded-2xl border border-white/15 bg-white/[0.06] px-4 py-3 text-left text-white transition hover:border-blue-400/50 hover:bg-white/[0.09] disabled:cursor-not-allowed disabled:opacity-60 md:hidden"
          aria-haspopup="dialog"
          aria-expanded={isOpen}
        >
          <div className="min-w-0">
            <div className="text-xs uppercase tracking-[0.18em] text-white/45">{label}</div>
            <div className="truncate text-base font-medium text-white">
              {selectedLabel || placeholder}
            </div>
          </div>
          <ChevronDown className="h-5 w-5 shrink-0 text-white/65" />
        </button>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-[80] flex items-end" role="dialog" aria-modal="true" aria-label={label}>
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm"
            aria-label={`Fermer ${label.toLowerCase()}`}
            onClick={() => {
              setIsOpen(false)
              setQuery('')
            }}
          />
          <div
            className="relative w-full rounded-t-[28px] border border-white/10 bg-[#101726] px-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] pt-4 shadow-2xl"
          >
            <div className="mx-auto mb-4 h-1.5 w-16 rounded-full bg-white/15" />
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-blue-200/70">{label}</p>
                <h2 className="text-xl font-semibold text-white">{placeholder}</h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false)
                  setQuery('')
                }}
                className="rounded-full border border-white/10 p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
                aria-label={`Fermer ${label.toLowerCase()}`}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {enableSearch && (
              <div className="mb-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3">
                <Search className="h-4 w-4 text-white/50" />
                <input
                  ref={searchInputRef}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Rechercher..."
                  className="w-full bg-transparent text-white outline-none placeholder:text-white/35"
                />
              </div>
            )}

            <div className="max-h-[55vh] space-y-2 overflow-y-auto pr-1">
              {allLabel && (
                <button
                  type="button"
                  onClick={() => handleSelect('all')}
                  className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-left text-white transition hover:border-blue-400/40 hover:bg-blue-500/10"
                >
                  <div>
                    <div className="text-sm font-medium">{allLabel}</div>
                    <div className="text-xs text-white/50">Afficher l’ensemble des territoires</div>
                  </div>
                  {value === 'all' && <Check className="h-5 w-5 text-blue-300" />}
                </button>
              )}

              {filteredOptions.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 px-4 py-5 text-sm text-white/60">
                  Aucun résultat pour « {query} ».
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handleSelect(option.id)}
                    className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-left text-white transition hover:border-blue-400/40 hover:bg-blue-500/10"
                  >
                    <span className="pr-4 text-sm font-medium leading-6">{option.label}</span>
                    {value === option.id && <Check className="h-5 w-5 shrink-0 text-blue-300" />}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default function ComparaisonEnseignes() {
  // Feature flag check
  const isFeatureEnabled = import.meta.env.VITE_FEATURE_COMPARAISON_ENSEIGNES === 'true'
  const isCitizenReportEnabled = import.meta.env.VITE_FEATURE_CITIZEN_REPORT === 'true'

  const [selectedProduct, setSelectedProduct] = useState<string>('')
  const [selectedTerritory, setSelectedTerritory] = useState<string>('all')
  const [territoryFilters, setTerritoryFilters] = useState<TerritoryFilters>({
    territory: 'all',
    zone: 'all',
    category: 'all',
  })
  const [allObservations, setAllObservations] = useState<PriceObservation[]>([])
  const [observations, setObservations] = useState<PriceObservation[]>([])
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [initialProductFromUrl, setInitialProductFromUrl] = useState<string | null>(null)
  const [linkCopied, setLinkCopied] = useState(false)
  const [enseigneScores, setEnseigneScores] = useState<EnseigneScore[]>([])

  const products = useMemo<ProductOption[]>(() => {
    const map = new Map<string, ProductOption>()
    allObservations.forEach((observation) => {
      const label = observation.productLabel.trim()
      const key = label.toLowerCase()
      if (!map.has(key)) {
        map.set(key, { id: label, label })
      }
    })
    return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label, 'fr'))
  }, [allObservations])

  const territories = useMemo(() => {
    const unique = new Set(allObservations.map((observation) => observation.territory))
    return Array.from(unique).sort((a, b) => a.localeCompare(b, 'fr'))
  }, [allObservations])
  const territoryOptions = useMemo<FilterOption[]>(
    () => territories.map((territory) => ({ id: territory, label: territory })),
    [territories]
  )
  const { add: addToHistory } = useLocalHistory()

  // Initialiser la mise à jour automatique au montage
  useEffect(() => {
    if (isFeatureEnabled) {
      initAutoUpdate()
      setLastUpdate(getLastUpdateDate())
    }
  }, [isFeatureEnabled])

  // Restaurer les filtres depuis l'URL (liens partageables)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)

    const product = params.get('produit')
    const territory = params.get('territoire')
    const advancedTerritory = params.get('territoire_filtre')
    const zone = params.get('zone')
    const category = params.get('categorie')

    if (product) {
      setInitialProductFromUrl(product)
    }
    if (territory) {
      setSelectedTerritory(territory)
    }
    if (zone || category) {
      setTerritoryFilters((current) => ({
        ...current,
        territory: (advancedTerritory as Territory) ?? current.territory,
        zone: (zone as ZoneType) ?? current.zone,
        category: (category as DataCategory) ?? current.category,
      }))
    } else if (advancedTerritory) {
      setTerritoryFilters((current) => ({
        ...current,
        territory: advancedTerritory as Territory,
      }))
    }
  }, [])

  useEffect(() => {
    if (!isFeatureEnabled) {
      setAllObservations([])
      return
    }

    let cancelled = false

    const loadObservations = async () => {
      try {
        const data = await priceObservationService.search({
          query: '',
          territory: 'all',
          store: 'all',
          source: 'all',
          periodDays: 'all',
        })

        if (!cancelled) {
          setAllObservations(data)
        }
      } catch (error) {
        console.error('Erreur lors du chargement des observations:', error)
        if (!cancelled) {
          setAllObservations([])
        }
      }
    }

    loadObservations()

    return () => {
      cancelled = true
    }
  }, [isFeatureEnabled])

  // Charger les observations quand un produit est sélectionné
  useEffect(() => {
    if (!selectedProduct) {
      setObservations([])
      return
    }

    let obs = allObservations.filter((observation) => observation.productLabel === selectedProduct)

    // Apply advanced territory filter if enabled (PR-12)
    const effectiveTerritory =
      territoryFilters.territory !== 'all'
        ? territoryFilters.territory
        : selectedTerritory

    // Filtrer par territoire si sélectionné
    if (effectiveTerritory !== 'all') {
      obs = obs.filter((o) => o.territory === effectiveTerritory)
    }

    // Apply zone filter via metadata (observations may carry zone in metadata.zone)
    if (territoryFilters.zone !== 'all') {
      obs = obs.filter((o) => !o.metadata?.zone || o.metadata.zone === territoryFilters.zone)
    }

    // Apply category filter via metadata (observations may carry category in metadata.category)
    if (territoryFilters.category !== 'all') {
      obs = obs.filter((o) => !o.metadata?.category || o.metadata.category === territoryFilters.category)
    }

    setObservations(obs)

    // Add to local history (PR-09)
    const product = products.find((p) => p.id === selectedProduct)
    if (product) {
      addToHistory({
        id: `comparison-${selectedProduct}-${effectiveTerritory}`,
        label: product.label,
        type: 'comparison',
        territory: effectiveTerritory !== 'all' ? effectiveTerritory : undefined,
      })
    }
  }, [selectedProduct, selectedTerritory, territoryFilters, allObservations, products, addToHistory])

  // Sélectionner le premier produit par défaut
  useEffect(() => {
    if (products.length === 0) {
      setSelectedProduct('')
      return
    }

    if (initialProductFromUrl) {
      const fromUrl = products.find((product) => product.id === initialProductFromUrl)
      if (fromUrl) {
        setSelectedProduct(fromUrl.id)
        setInitialProductFromUrl(null)
        return
      }
      setInitialProductFromUrl(null)
    }

    if (!selectedProduct || !products.some((product) => product.id === selectedProduct)) {
      setSelectedProduct(products[0].id)
    }
  }, [products, selectedProduct, initialProductFromUrl])

  // Synchroniser les filtres dans l'URL (sans rechargement)
  useEffect(() => {
    if (typeof window === 'undefined') return

    const params = new URLSearchParams(window.location.search)

    if (selectedProduct) params.set('produit', selectedProduct)
    else params.delete('produit')

    if (selectedTerritory !== 'all') params.set('territoire', selectedTerritory)
    else params.delete('territoire')

    if (territoryFilters.zone !== 'all') params.set('zone', territoryFilters.zone)
    else params.delete('zone')

    if (territoryFilters.category !== 'all') params.set('categorie', territoryFilters.category)
    else params.delete('categorie')

    if (territoryFilters.territory !== 'all') params.set('territoire_filtre', territoryFilters.territory)
    else params.delete('territoire_filtre')

    const query = params.toString()
    const nextUrl = `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`
    window.history.replaceState({}, '', nextUrl)
  }, [selectedProduct, selectedTerritory, territoryFilters.zone, territoryFilters.category, territoryFilters.territory])

  // Load score enseigne data once on mount
  useEffect(() => {
    computeScoreEnseigne().then((result) => {
      setEnseigneScores(result.global.slice(0, 10))
    }).catch(() => {/* silently ignore — catalogue-prices.json may be absent */})
  }, [])

  const handleCopyShareLink = async () => {
    if (typeof window === 'undefined') return
    const shareUrl = window.location.href
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl)
      } else {
        const textarea = document.createElement('textarea')
        textarea.value = shareUrl
        textarea.setAttribute('readonly', 'true')
        textarea.style.position = 'absolute'
        textarea.style.left = '-9999px'
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
      }
      setLinkCopied(true)
      window.setTimeout(() => setLinkCopied(false), 2200)
    } catch (error) {
      console.error('Impossible de copier le lien de comparaison :', error)
      setLinkCopied(false)
    }
  }

  const handleNativeShare = async () => {
    if (typeof window === 'undefined') return
    const shareUrl = window.location.href

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Comparaison inter-enseignes',
          text: 'Consultez cette comparaison avec filtres appliqués',
          url: shareUrl,
        })
        return
      }
    } catch (error) {
      console.error('Partage natif interrompu :', error)
    }

    await handleCopyShareLink()
  }

  const aggregation = aggregateObservations(observations)
  const groupedStores = groupByStore(observations)
  const oldData = hasOldData(observations)
  const storeCount = countUniqueStores(observations)
  const priceSpread = aggregation ? aggregation.maxPrice - aggregation.minPrice : null

  // Feature disabled state
  if (!isFeatureEnabled) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-4">Comparaison inter-enseignes</h1>
        </div>
        <GlassCard>
          <div className="text-center py-8">
            <div className="flex justify-center mb-4">
              <Lock className="w-12 h-12 text-slate-400" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-4">
              Module de comparaison inter-enseignes désactivé dans cette phase.
            </h2>
            <p className="text-white/70">
              Ce module est en cours de déploiement progressif.
            </p>
          </div>
        </GlassCard>
      </div>
    )
  }

  return (
    <>
      <SEOHead
        title="Comparaison inter-enseignes — Prix Carrefour, E.Leclerc, Casino Outre-mer"
        description="Comparez les prix entre enseignes en Guadeloupe, Martinique, Guyane et La Réunion. Données observatoire citoyen."
        canonical="https://teetee971.github.io/akiprisaye-web/comparaison-enseignes"
      />
    <div className="container mx-auto max-w-7xl px-4 py-6 pb-28 sm:py-8 sm:pb-10">
      <div className="mb-6 animate-fade-in">
        <HeroImage
          src={PAGE_HERO_IMAGES.comparaisonEnseignes}
          alt="Comparaison inter-enseignes — rayons supermarché"
          gradient="from-slate-900 to-indigo-950"
          height="h-36 sm:h-48"
        >
          <h1 className="text-2xl font-bold text-white drop-shadow">Comparaison inter-enseignes</h1>
          <p className="text-slate-200 text-sm drop-shadow">Données factuelles — aucun classement, aucune recommandation</p>
        </HeroImage>
      </div>

      {/* Avertissement institutionnel obligatoire (PR-02) */}
      <div className="mb-6 rounded-2xl border border-blue-500/40 bg-blue-500/15 p-4 text-sm text-blue-100 shadow-[0_8px_24px_rgba(37,99,235,0.12)]">
        <strong className="block text-base font-semibold text-white">ℹ️ Information importante</strong>
        <p className="mt-2">
          Comparaison strictement factuelle entre enseignes, basée sur des observations déclarées ou ouvertes.
          Aucun classement, aucune recommandation, aucune analyse prédictive n'est réalisée.
        </p>
      </div>

      {lastUpdate && (
        <div className="text-xs text-white/50 mb-4">
          Dernière mise à jour: {lastUpdate.toLocaleString('fr-FR')}
        </div>
      )}

      {/* Filtres */}
      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <GlassCard>
          <SelectorSheet
            label="Produit"
            value={selectedProduct}
            onChange={setSelectedProduct}
            options={products}
            placeholder="Choisir un produit"
            enableSearch
            disabled={products.length === 0}
          />
        </GlassCard>

        <GlassCard>
          <SelectorSheet
            label="Territoire"
            value={selectedTerritory}
            onChange={setSelectedTerritory}
            options={territoryOptions}
            placeholder="Choisir un territoire"
            allLabel="Tous les territoires"
          />
        </GlassCard>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-2 text-xs text-white/70">
        <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5">
          Produit : <span className="font-semibold text-white">{selectedProduct || 'Aucun'}</span>
        </span>
        <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5">
          Territoire : <span className="font-semibold text-white">{selectedTerritory === 'all' ? 'Tous' : selectedTerritory}</span>
        </span>
        <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5">
          Enseignes comparées : <span className="font-semibold text-white">{storeCount}</span>
        </span>
        {(selectedTerritory !== 'all' || territoryFilters.zone !== 'all' || territoryFilters.category !== 'all') && (
          <button
            type="button"
            onClick={() => {
              setSelectedTerritory('all')
              setTerritoryFilters({
                territory: 'all',
                zone: 'all',
                category: 'all',
              })
            }}
            className="rounded-full border border-blue-400/30 bg-blue-500/10 px-3 py-1.5 font-medium text-blue-100 transition hover:bg-blue-500/20"
          >
            Réinitialiser les filtres
          </button>
        )}
        <button
          type="button"
          onClick={handleCopyShareLink}
          className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/35 bg-emerald-500/10 px-3 py-1.5 font-medium text-emerald-100 transition hover:bg-emerald-500/20"
          aria-label="Copier le lien avec les filtres actifs"
        >
          <Copy className="h-3.5 w-3.5" />
          {linkCopied ? 'Lien copié' : 'Partager ce filtre'}
        </button>
        <button
          type="button"
          onClick={handleNativeShare}
          className="inline-flex items-center gap-1.5 rounded-full border border-fuchsia-400/35 bg-fuchsia-500/10 px-3 py-1.5 font-medium text-fuchsia-100 transition hover:bg-fuchsia-500/20"
          aria-label="Partager la comparaison via les applications disponibles"
        >
          <Share2 className="h-3.5 w-3.5" />
          Partage rapide
        </button>
      </div>

      {/* Advanced Territory Filters (PR-12) */}
      <TerritoryAdvancedFilter
        filters={territoryFilters}
        onChange={setTerritoryFilters}
        className="mb-6"
      />

      {/* Local History Panel (PR-09) */}
      <LocalHistoryPanel />

      {/* Price Variation Alert (PR-10) */}
      {observations.length > 0 && (
        <div className="mb-6">
          <PriceVariationAlert
            prices={observations.map((o) => ({
              value: o.price,
              date: o.observedAt,
            }))}
          />
        </div>
      )}

      {/* Avertissements sur les données */}
      {(oldData || storeCount < 2) && (
        <div className="mb-6">
          <PriceDataWarning hasOldData={oldData} storeCount={storeCount} />
        </div>
      )}

      {/* Statistiques factuelles */}
      {aggregation && (
        <div className="mb-6">
          <GlassCard title="Statistiques factuelles">
            {/* Data Reliability Badge (PR-08) */}
            {observations.length > 0 && (
              <div className="mb-4 flex justify-end">
                <DataReliabilityBadge
                  values={observations.map((o) => o.price)}
                  lastUpdated={aggregation.periodEnd}
                />
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 text-center sm:grid-cols-2 xl:grid-cols-6">
              <div className="rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-4">
                <div className="mb-1 text-sm text-white/60">Prix minimum observé</div>
                <div className="text-2xl font-bold text-green-400">
                  {aggregation.minPrice.toFixed(2)} €
                </div>
              </div>

              <div className="rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-4">
                <div className="mb-1 text-sm text-white/60">Prix maximum observé</div>
                <div className="text-2xl font-bold text-red-400">
                  {aggregation.maxPrice.toFixed(2)} €
                </div>
              </div>

              <div className="rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-4">
                <div className="mb-1 text-sm text-white/60">Prix moyen</div>
                <div className="text-2xl font-bold text-blue-400">
                  {aggregation.averagePrice.toFixed(2)} €
                </div>
              </div>

              <div className="rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-4">
                <div className="mb-1 text-sm text-white/60">Nombre d'observations</div>
                <div className="text-2xl font-bold text-white">{aggregation.observationCount}</div>
              </div>

              <div className="rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-4">
                <div className="mb-1 text-sm text-white/60">Période couverte</div>
                <div className="text-sm text-white">
                  {new Date(aggregation.periodStart).toLocaleDateString('fr-FR')}
                  <br />→<br />
                  {new Date(aggregation.periodEnd).toLocaleDateString('fr-FR')}
                </div>
              </div>

              <div className="rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-4">
                <div className="mb-1 text-sm text-white/60">Dispersion min↔max</div>
                <div className="text-2xl font-bold text-amber-300">
                  {priceSpread !== null ? `${priceSpread.toFixed(2)} €` : '—'}
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Tableau de comparaison */}
      <div className="mb-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-2xl font-bold text-white">Observations de prix</h2>
          <div className="flex flex-wrap gap-3">
            {isCitizenReportEnabled && (
              <button
                onClick={() => setIsReportModalOpen(true)}
                className="px-4 py-2 text-sm font-medium text-white/80 hover:text-white bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] rounded-lg transition-colors"
                aria-label="Signaler une observation"
              >
                Signaler une observation
              </button>
            )}
            {observations.length > 0 && <ExportDataButton observations={observations} />}
          </div>
        </div>
        
        {observations.length === 0 ? (
          <EmptyState 
            title="Aucune donnée disponible"
            message="Ce produit n'est pas encore référencé pour ce territoire. Les données sont en cours de consolidation."
          />
        ) : (
          <GlassCard>
            <PriceComparisonTable observations={observations} groupedByStore={groupedStores} />
          </GlassCard>
        )}
      </div>

      {/* Score vie chère par enseigne */}
      {enseigneScores.length > 0 && (
        <div className="mb-6">
          <GlassCard>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              🏪 Score vie chère par enseigne
              <span className="text-sm font-normal text-white/50">(panier catalogue — moins cher en haut)</span>
            </h2>
            <div className="mb-3 text-xs text-white/60">
              <span className="font-semibold text-white/75">Méthodologie :</span>{' '}
              calcul basé sur un panier type de produits communs observés. Les prix peuvent varier selon la date de collecte, les arrivages et les promotions locales.
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-white/50 border-b border-white/10">
                    <th className="text-left pb-2 pr-4">Rang</th>
                    <th className="text-left pb-2 pr-4">Enseigne</th>
                    <th className="text-left pb-2 pr-4">Territoire</th>
                    <th className="text-right pb-2 pr-4">Coût panier</th>
                    <th className="text-right pb-2">Écart métropole</th>
                  </tr>
                </thead>
                <tbody>
                  {enseigneScores.map((s, i) => (
                    <tr key={`${s.retailer}-${s.territory}`} className="border-b border-white/5">
                      <td className="py-1.5 pr-4 text-white/40 font-mono">{i + 1}</td>
                      <td className="py-1.5 pr-4 text-white font-medium">{s.retailer}</td>
                      <td className="py-1.5 pr-4 text-white/60">{s.territory}</td>
                      <td className="py-1.5 pr-4 text-right text-white">{s.basketCost.toFixed(2)} €</td>
                      <td className="py-1.5 text-right">
                        {s.avgEcartPercent !== undefined ? (
                          <EcartHexagone ecartPercent={s.avgEcartPercent} size="xs" />
                        ) : (
                          <span className="text-white/30 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Citizen Report Modal (PR-11) */}
      <SignalementCitoyenModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        productContext={
          selectedProduct && products.find((p) => p.id === selectedProduct)
            ? {
                name: products.find((p) => p.id === selectedProduct)!.label,
              }
            : undefined
        }
      />
    </div>
    </>
  )
}
