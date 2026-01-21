import { safeLocalStorage } from '../utils/safeLocalStorage';
// src/services/priceUpdateScheduler.ts
// Planificateur de mise à jour automatique des données de prix
// Refresh automatique toutes les 24h, fallback local

const UPDATE_INTERVAL_MS = 24 * 60 * 60 * 1000 // 24 heures
const LAST_UPDATE_KEY = 'price-data:last-update'

/**
 * Récupère la date de dernière mise à jour
 */
export function getLastUpdateDate(): Date | null {
  if (typeof window === 'undefined' || !safeLocalStorage) return null

  try {
    const stored = safeLocalStorage.getItem(LAST_UPDATE_KEY)
    if (!stored) return null
    return new Date(stored)
  } catch {
    return null
  }
}

/**
 * Enregistre la date de mise à jour
 */
export function setLastUpdateDate(date: Date = new Date()): void {
  if (typeof window === 'undefined' || !safeLocalStorage) return

  try {
    safeLocalStorage.setItem(LAST_UPDATE_KEY, date.toISOString())
  } catch {
    // ignore quota errors
  }
}

/**
 * Vérifie si une mise à jour est nécessaire
 */
export function needsUpdate(): boolean {
  const lastUpdate = getLastUpdateDate()
  if (!lastUpdate) return true

  const now = Date.now()
  const lastUpdateTime = lastUpdate.getTime()
  return now - lastUpdateTime > UPDATE_INTERVAL_MS
}

/**
 * Charge les données de prix (local ou distant)
 */
export async function loadPriceData(): Promise<boolean> {
  try {
    // Tentative de chargement depuis un fichier JSON public versionné
    // ou depuis open-data public (sans clé API)
    const response = await fetch('/data/price-observations.json')
    
    if (response.ok) {
      const data = await response.json()
      // Les données sont déjà gérées par priceObservationService
      // On met juste à jour la date
      setLastUpdateDate()
      return true
    }
  } catch (error) {
    console.info('Fallback sur données locales')
  }

  // Fallback: les données locales sont toujours disponibles
  return false
}

/**
 * Initialise le système de mise à jour automatique
 */
export function initAutoUpdate(): void {
  // Vérifier et charger au démarrage
  if (needsUpdate()) {
    loadPriceData()
  }

  // Planifier les mises à jour ultérieures
  setInterval(() => {
    if (needsUpdate()) {
      loadPriceData()
    }
  }, UPDATE_INTERVAL_MS)
}

/**
 * Force une mise à jour immédiate
 */
export async function forceUpdate(): Promise<boolean> {
  return await loadPriceData()
}

export default {
  getLastUpdateDate,
  setLastUpdateDate,
  needsUpdate,
  loadPriceData,
  initAutoUpdate,
  forceUpdate,
}
