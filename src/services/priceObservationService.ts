// src/services/priceObservationService.ts
// Service pour gérer les observations de prix factuelles
// Données observées uniquement, aucune interprétation

import type { PriceObservation } from '../types/priceObservation'

// Données observées locales (peuvent être étendues avec open-data)
const LOCAL_OBSERVATIONS: PriceObservation[] = [
  {
    ean: '3017620422003',
    productName: 'Nutella 750g',
    territory: 'GP',
    store: 'Supermarché A',
    price: 5.99,
    currency: 'EUR',
    observationDate: '2025-11-15T10:00:00Z',
    source: 'agent_public',
    sourceRef: 'OBS-GP-2025-001',
  },
  {
    ean: '3017620422003',
    productName: 'Nutella 750g',
    territory: 'MQ',
    store: 'Épicerie B',
    price: 6.50,
    currency: 'EUR',
    observationDate: '2025-11-18T10:00:00Z',
    source: 'agent_public',
    sourceRef: 'OBS-MQ-2025-002',
  },
  {
    ean: '3017620422003',
    productName: 'Nutella 750g',
    territory: 'RE',
    store: 'Carrefour',
    price: 5.85,
    currency: 'EUR',
    observationDate: '2025-11-20T10:00:00Z',
    source: 'ticket_scan',
  },
  {
    ean: '3228857000852',
    productName: 'Riz Basmati 1kg',
    territory: 'GP',
    store: 'Supermarché A',
    price: 2.50,
    currency: 'EUR',
    observationDate: '2025-11-22T10:00:00Z',
    source: 'agent_public',
    sourceRef: 'OBS-GP-2025-003',
  },
  {
    ean: '3228857000852',
    productName: 'Riz Basmati 1kg',
    territory: 'GP',
    store: 'Leader Price',
    price: 2.35,
    currency: 'EUR',
    observationDate: '2025-11-23T10:00:00Z',
    source: 'ticket_scan',
  },
  {
    ean: '3228857000852',
    productName: 'Riz Basmati 1kg',
    territory: 'RE',
    store: 'Super U',
    price: 2.60,
    currency: 'EUR',
    observationDate: '2025-11-24T10:00:00Z',
    source: 'open_data',
    sourceRef: 'OPENDATA-RE-001',
  },
  {
    ean: '3019081238957',
    productName: 'Lait UHT Demi-écrémé 1L',
    territory: 'RE',
    store: 'Carrefour',
    price: 1.20,
    currency: 'EUR',
    observationDate: '2025-11-25T10:00:00Z',
    source: 'agent_public',
    sourceRef: 'OBS-RE-2025-004',
  },
  {
    ean: '3019081238957',
    productName: 'Lait UHT Demi-écrémé 1L',
    territory: 'MQ',
    store: 'Super U',
    price: 1.35,
    currency: 'EUR',
    observationDate: '2025-11-26T10:00:00Z',
    source: 'ticket_scan',
  },
  {
    ean: '3019081238957',
    productName: 'Lait UHT Demi-écrémé 1L',
    territory: 'GP',
    store: 'Supermarché A',
    price: 1.25,
    currency: 'EUR',
    observationDate: '2025-11-27T10:00:00Z',
    source: 'agent_public',
    sourceRef: 'OBS-GP-2025-005',
  },
]

/**
 * Récupère toutes les observations
 */
export function getAllObservations(): PriceObservation[] {
  return [...LOCAL_OBSERVATIONS]
}

/**
 * Filtre les observations par EAN
 */
export function getObservationsByEAN(ean: string): PriceObservation[] {
  return LOCAL_OBSERVATIONS.filter((obs) => obs.ean === ean)
}

/**
 * Filtre les observations par territoire
 */
export function getObservationsByTerritory(territory: string): PriceObservation[] {
  return LOCAL_OBSERVATIONS.filter((obs) => obs.territory === territory)
}

/**
 * Filtre les observations par EAN et territoire
 */
export function getObservationsByEANAndTerritory(ean: string, territory: string): PriceObservation[] {
  return LOCAL_OBSERVATIONS.filter((obs) => obs.ean === ean && obs.territory === territory)
}

/**
 * Liste tous les EAN uniques
 */
export function getUniqueEANs(): string[] {
  const eans = new Set(LOCAL_OBSERVATIONS.map((obs) => obs.ean))
  return Array.from(eans).sort()
}

/**
 * Liste tous les territoires uniques
 */
export function getUniqueTerritories(): string[] {
  const territories = new Set(LOCAL_OBSERVATIONS.map((obs) => obs.territory))
  return Array.from(territories).sort()
}

/**
 * Liste toutes les enseignes uniques
 */
export function getUniqueStores(): string[] {
  const stores = new Set(LOCAL_OBSERVATIONS.map((obs) => obs.store))
  return Array.from(stores).sort()
}

/**
 * Récupère les noms de produits uniques avec leur EAN
 */
export function getProductList(): Array<{ ean: string; name: string }> {
  const products = new Map<string, string>()
  LOCAL_OBSERVATIONS.forEach((obs) => {
    if (!products.has(obs.ean)) {
      products.set(obs.ean, obs.productName)
    }
  })
  
  return Array.from(products.entries())
    .map(([ean, name]) => ({ ean, name }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

export default {
  getAllObservations,
  getObservationsByEAN,
  getObservationsByTerritory,
  getObservationsByEANAndTerritory,
  getUniqueEANs,
  getUniqueTerritories,
  getUniqueStores,
  getProductList,
}
