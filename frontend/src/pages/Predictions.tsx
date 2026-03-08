// src/pages/Predictions.tsx
import React, { useEffect, useState } from 'react'
import { GlassCard } from '../components/ui/glass-card'
import PredictionBadge from '../components/PredictionBadge'
import Sparkline from '../components/Sparkline'
import { HeroImage } from '../components/ui/HeroImage';
import { PAGE_HERO_IMAGES } from '../config/imageAssets';
import {
  analyzeCatalogue,
  filterByStatus,
  sortByProbability,
  type ProductPrediction,
  type PredictionScore,
} from '../services/predictivePricingService'

export default function Predictions() {
  const [predictions, setPredictions] = useState<ProductPrediction[]>([])
  const [filteredPredictions, setFilteredPredictions] = useState<ProductPrediction[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<PredictionScore['status'] | 'all'>('all')
  const [storeFilter, setStoreFilter] = useState<string>('all')
  const [stores, setStores] = useState<string[]>([])

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const response = await fetch(`${import.meta.env.BASE_URL}data/catalogue.json`)
        if (!response.ok) throw new Error('Erreur chargement catalogue')
        
        const data = await response.json()
        const analyzed = analyzeCatalogue(data)
        const sorted = sortByProbability(analyzed)
        
        setPredictions(sorted)
        setFilteredPredictions(sorted)
        
        // Extraire les enseignes uniques
        const uniqueStores = Array.from(new Set(sorted.map(p => p.store))).sort()
        setStores(uniqueStores)
      } catch (error) {
        console.error('Erreur lors de l\'analyse:', error)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
    let filtered = [...predictions]

    // Filtrer par statut
    if (statusFilter !== 'all') {
      filtered = filterByStatus(filtered, statusFilter)
    }

    // Filtrer par enseigne
    if (storeFilter !== 'all') {
      filtered = filtered.filter(p => p.store === storeFilter)
    }

    setFilteredPredictions(filtered)
  }, [statusFilter, storeFilter, predictions])

  const getStatusCount = (status: PredictionScore['status']) => {
    return predictions.filter(p => p.prediction.status === status).length
  }

  if (loading) {
    return (
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-white mb-8">Prédictions IA</h1>
        <GlassCard>
          <p className="text-white/70">Analyse des données en cours...</p>
        </GlassCard>
      </main>
    )
  }

  return (
    <main className="container mx-auto px-4 py-8" role="main">
      <div className="mb-8">
        <HeroImage
          src={PAGE_HERO_IMAGES.predictions}
          alt="Prédictions de prix"
          gradient="from-slate-950 to-cyan-900"
          height="h-40 sm:h-52"
        >
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#fff' }}>
            🔮 Prédictions de prix
          </h1>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.75)' }}>
            Anticipez l'évolution des prix dans votre territoire
          </p>
        </HeroImage>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <GlassCard>
          <div className="text-center">
            <div className="text-white/60 text-sm mb-1">Total produits</div>
            <div className="text-2xl font-bold text-white">{predictions.length}</div>
          </div>
        </GlassCard>
        
        <GlassCard>
          <div className="text-center">
            <div className="text-white/60 text-sm mb-1">Baisses probables</div>
            <div className="text-2xl font-bold text-green-400">{getStatusCount('baisse_probable')}</div>
          </div>
        </GlassCard>
        
        <GlassCard>
          <div className="text-center">
            <div className="text-white/60 text-sm mb-1">Surveillance</div>
            <div className="text-2xl font-bold text-orange-400">{getStatusCount('surveillance')}</div>
          </div>
        </GlassCard>
        
        <GlassCard>
          <div className="text-center">
            <div className="text-white/60 text-sm mb-1">Stables</div>
            <div className="text-2xl font-bold text-blue-400">{getStatusCount('stable')}</div>
          </div>
        </GlassCard>
      </div>

      {/* Filtres */}
      <GlassCard className="mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label htmlFor="status-filter" className="block text-white/90 text-sm mb-2">
              Statut
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as PredictionScore['status'] | 'all')}
              className="w-full px-3 py-2 bg-white/[0.1] border border-white/[0.22] rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Filtrer par statut"
            >
              <option value="all" className="bg-gray-800">Tous les statuts</option>
              <option value="baisse_probable" className="bg-gray-800">Baisse probable</option>
              <option value="surveillance" className="bg-gray-800">Surveillance</option>
              <option value="stable" className="bg-gray-800">Stable</option>
            </select>
          </div>

          <div className="flex-1">
            <label htmlFor="store-filter" className="block text-white/90 text-sm mb-2">
              Enseigne
            </label>
            <select
              id="store-filter"
              value={storeFilter}
              onChange={e => setStoreFilter(e.target.value)}
              className="w-full px-3 py-2 bg-white/[0.1] border border-white/[0.22] rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Filtrer par enseigne"
            >
              <option value="all" className="bg-gray-800">Toutes les enseignes</option>
              {stores.map(store => (
                <option key={store} value={store} className="bg-gray-800">
                  {store}
                </option>
              ))}
            </select>
          </div>
        </div>
      </GlassCard>

      {/* Liste des prédictions */}
      {filteredPredictions.length === 0 ? (
        <GlassCard>
          <p className="text-white/70 text-center">Aucun produit ne correspond aux filtres sélectionnés.</p>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {filteredPredictions.map((pred, idx) => {
            const prices = pred.observations
              .slice()
              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
              .map(obs => obs.price)

            return (
              <GlassCard key={`${pred.productId}-${idx}`}>
                <div className="flex flex-col md:flex-row gap-4 items-start">
                  {/* Info produit */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-3 mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-white truncate">
                          {pred.productName}
                        </h3>
                        <p className="text-sm text-white/60">{pred.store}</p>
                      </div>
                      <PredictionBadge prediction={pred.prediction} />
                    </div>

                    <div className="flex items-baseline gap-2 mb-3">
                      <span className="text-2xl font-bold text-blue-400">
                        {pred.currentPrice.toFixed(2)} €
                      </span>
                      {pred.prediction.estimatedTimeframe && (
                        <span className="text-xs text-white/60">
                          Baisse estimée: {pred.prediction.estimatedTimeframe}
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-white/70 mb-2">
                      {pred.prediction.justification}
                    </p>

                    {/* Métriques détaillées */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                      <div>
                        <span className="text-white/50">Tendance:</span>
                        <span className={`ml-1 font-medium ${pred.prediction.metrics.trend < 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {pred.prediction.metrics.trend.toFixed(2)}%/j
                        </span>
                      </div>
                      <div>
                        <span className="text-white/50">Volatilité:</span>
                        <span className="ml-1 text-white/80">
                          {pred.prediction.metrics.volatility.toFixed(1)}%
                        </span>
                      </div>
                      <div>
                        <span className="text-white/50">Accélération:</span>
                        <span className={`ml-1 font-medium ${pred.prediction.metrics.acceleration < 0 ? 'text-green-400' : 'text-white/80'}`}>
                          {pred.prediction.metrics.acceleration.toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <span className="text-white/50">Dernier Δ:</span>
                        <span className={`ml-1 font-medium ${pred.prediction.metrics.lastChangePercentage < 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {pred.prediction.metrics.lastChangePercentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Sparkline */}
                  <div className="flex flex-col items-center gap-2">
                    <div className="text-xs text-white/50">Historique</div>
                    <Sparkline
                      data={prices}
                      width={120}
                      height={50}
                      stroke={pred.prediction.status === 'baisse_probable' ? '#4ade80' : pred.prediction.status === 'surveillance' ? '#fb923c' : '#60a5fa'}
                    />
                    <div className="text-xs text-white/50">
                      {pred.observations.length} obs.
                    </div>
                  </div>
                </div>
              </GlassCard>
            )
          })}
        </div>
      )}
    </main>
  )
}
