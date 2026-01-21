// src/services/priceAggregationService.ts
// Service d'agrégation factuelle des observations de prix
// Calculs statistiques uniquement, aucune interprétation commerciale

import type { PriceObservation } from '../types/PriceObservation'

export interface PriceAggregation {
  productId: string
  productLabel: string
  minPrice: number
  maxPrice: number
  averagePrice: number
  observationCount: number
  periodStart: string
  periodEnd: string
  observations: PriceObservation[]
}

/**
 * Agrège les observations pour un produit donné
 * Calcule uniquement des statistiques factuelles
 */
export function aggregateObservations(observations: PriceObservation[]): PriceAggregation | null {
  if (observations.length === 0) return null

  const prices = observations.map((obs) => obs.price)
  const dates = observations.map((obs) => new Date(obs.observedAt).getTime())

  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)
  const averagePrice = prices.reduce((sum, price) => sum + price, 0) / prices.length
  const periodStart = new Date(Math.min(...dates)).toISOString()
  const periodEnd = new Date(Math.max(...dates)).toISOString()

  return {
    productId: observations[0].productId,
    productLabel: observations[0].productLabel,
    minPrice,
    maxPrice,
    averagePrice,
    observationCount: observations.length,
    periodStart,
    periodEnd,
    observations,
  }
}

/**
 * Groupe les observations par enseigne
 */
export function groupByStore(observations: PriceObservation[]): Record<string, PriceObservation[]> {
  const grouped: Record<string, PriceObservation[]> = {}

  observations.forEach((obs) => {
    if (!grouped[obs.storeLabel]) {
      grouped[obs.storeLabel] = []
    }
    grouped[obs.storeLabel].push(obs)
  })

  return grouped
}

/**
 * Groupe les observations par territoire
 */
export function groupByTerritory(observations: PriceObservation[]): Record<string, PriceObservation[]> {
  const grouped: Record<string, PriceObservation[]> = {}

  observations.forEach((obs) => {
    if (!grouped[obs.territory]) {
      grouped[obs.territory] = []
    }
    grouped[obs.territory].push(obs)
  })

  return grouped
}

/**
 * Tri les observations par date (ordre chronologique)
 */
export function sortByDate(observations: PriceObservation[], ascending = true): PriceObservation[] {
  return [...observations].sort((a, b) => {
    const dateA = new Date(a.observedAt).getTime()
    const dateB = new Date(b.observedAt).getTime()
    return ascending ? dateA - dateB : dateB - dateA
  })
}

/**
 * Vérifie si les données sont anciennes (> 30 jours)
 */
export function hasOldData(observations: PriceObservation[], thresholdDays = 30): boolean {
  if (observations.length === 0) return false

  const now = Date.now()
  const threshold = thresholdDays * 24 * 60 * 60 * 1000

  return observations.some((obs) => {
    const obsDate = new Date(obs.observedAt).getTime()
    return now - obsDate > threshold
  })
}

/**
 * Compte le nombre d'enseignes uniques
 */
export function countUniqueStores(observations: PriceObservation[]): number {
  const stores = new Set(observations.map((obs) => obs.storeLabel))
  return stores.size
}

/**
 * Compte le nombre de territoires uniques
 */
export function countUniqueTerritories(observations: PriceObservation[]): number {
  const territories = new Set(observations.map((obs) => obs.territory))
  return territories.size
}

export default {
  aggregateObservations,
  groupByStore,
  groupByTerritory,
  sortByDate,
  hasOldData,
  countUniqueStores,
  countUniqueTerritories,
}
