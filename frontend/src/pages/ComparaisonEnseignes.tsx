// src/pages/ComparaisonEnseignes.tsx
// PR-02: Inter-Store Comparison in Factual Observation Mode
// Phase 2 - Strictly factual data, no predictions or recommendations

import React, { useEffect, useMemo, useState } from 'react'
import { Lock } from 'lucide-react'
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
import TerritoryAdvancedFilter, { type TerritoryFilters } from '../components/TerritoryAdvancedFilter'
import { useLocalHistory } from '../hooks/useLocalHistory'
import { priceObservationService } from '../services/priceObservationService'
import {
  aggregateObservations,
  groupByStore,
  hasOldData,
  countUniqueStores,
} from '../services/priceAggregationService'
import { initAutoUpdate, getLastUpdateDate } from '../services/priceUpdateScheduler'
import type { PriceObservation } from '../types/PriceObservation'

import { SEOHead } from '../components/ui/SEOHead';
type ProductOption = {
  id: string
  label: string
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
  const { add: addToHistory } = useLocalHistory()

  // Initialiser la mise à jour automatique au montage
  useEffect(() => {
    if (isFeatureEnabled) {
      initAutoUpdate()
      setLastUpdate(getLastUpdateDate())
    }
  }, [isFeatureEnabled])

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

    if (!selectedProduct || !products.some((product) => product.id === selectedProduct)) {
      setSelectedProduct(products[0].id)
    }
  }, [products, selectedProduct])

  const aggregation = aggregateObservations(observations)
  const groupedStores = groupByStore(observations)
  const oldData = hasOldData(observations)
  const storeCount = countUniqueStores(observations)

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
    <div className="container mx-auto px-4 py-8 max-w-7xl">
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
      <div className="p-4 bg-blue-500/20 border border-blue-500/50 rounded-lg text-sm text-blue-200 mb-6">
        <strong>ℹ️ Information importante</strong>
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
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <GlassCard title="Sélection du produit">
          <select
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            className="w-full px-4 py-3 bg-white/[0.1] border border-white/[0.22] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Sélectionner un produit"
            disabled={products.length === 0}
          >
            {products.length === 0 && (
              <option value="" className="bg-gray-800">
                Aucun produit disponible
              </option>
            )}
            {products.map((product) => (
              <option key={product.id} value={product.id} className="bg-gray-800">
                {product.label}
              </option>
            ))}
          </select>
        </GlassCard>

        <GlassCard title="Territoire">
          <select
            value={selectedTerritory}
            onChange={(e) => setSelectedTerritory(e.target.value)}
            className="w-full px-4 py-3 bg-white/[0.1] border border-white/[0.22] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Filtrer par territoire"
          >
            <option value="all" className="bg-gray-800">
              Tous les territoires
            </option>
            {territories.map((territory) => (
              <option key={territory} value={territory} className="bg-gray-800">
                {territory}
              </option>
            ))}
          </select>
        </GlassCard>
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

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
              <div>
                <div className="text-white/60 text-sm mb-1">Prix minimum observé</div>
                <div className="text-2xl font-bold text-green-400">
                  {aggregation.minPrice.toFixed(2)} €
                </div>
              </div>

              <div>
                <div className="text-white/60 text-sm mb-1">Prix maximum observé</div>
                <div className="text-2xl font-bold text-red-400">
                  {aggregation.maxPrice.toFixed(2)} €
                </div>
              </div>

              <div>
                <div className="text-white/60 text-sm mb-1">Prix moyen</div>
                <div className="text-2xl font-bold text-blue-400">
                  {aggregation.averagePrice.toFixed(2)} €
                </div>
              </div>

              <div>
                <div className="text-white/60 text-sm mb-1">Nombre d'observations</div>
                <div className="text-2xl font-bold text-white">{aggregation.observationCount}</div>
              </div>

              <div>
                <div className="text-white/60 text-sm mb-1">Période couverte</div>
                <div className="text-sm text-white">
                  {new Date(aggregation.periodStart).toLocaleDateString('fr-FR')}
                  <br />→<br />
                  {new Date(aggregation.periodEnd).toLocaleDateString('fr-FR')}
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Tableau de comparaison */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white">Observations de prix</h2>
          <div className="flex gap-3">
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
