// src/hooks/useScanHistory.ts
// Gestion de l'historique des scans EAN (safeLocalStorage, max 10 entrées)

import { useCallback, useEffect, useState } from 'react'
import { safeLocalStorage } from '../utils/safeLocalStorage';

const HISTORY_KEY = 'scan-ean:history:v1'
const MAX_HISTORY = 10

export type ScanHistoryEntry = {
  ean: string
  productName?: string
  scannedAt: string
}

function readHistory(): ScanHistoryEntry[] {
  if (typeof window === 'undefined' || !safeLocalStorage) return []
  
  try {
    const raw = safeLocalStorage.getItem(HISTORY_KEY)
    if (!raw) return []
    
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    
    return parsed
      .filter((entry) => entry.ean && entry.scannedAt)
      .slice(0, MAX_HISTORY)
  } catch {
    return []
  }
}

function writeHistory(history: ScanHistoryEntry[]) {
  if (typeof window === 'undefined' || !safeLocalStorage) return
  
  try {
    safeLocalStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, MAX_HISTORY)))
  } catch {
    // ignore quota errors
  }
}

export function useScanHistory() {
  const [history, setHistory] = useState<ScanHistoryEntry[]>(() => readHistory())

  useEffect(() => {
    writeHistory(history)
  }, [history])

  const addToHistory = useCallback((entry: Omit<ScanHistoryEntry, 'scannedAt'>) => {
    setHistory((prev) => {
      const newEntry: ScanHistoryEntry = {
        ...entry,
        scannedAt: new Date().toISOString(),
      }
      
      // Remove duplicates based on EAN
      const filtered = prev.filter((e) => e.ean !== entry.ean)
      
      // Add new entry at the beginning
      return [newEntry, ...filtered].slice(0, MAX_HISTORY)
    })
  }, [])

  const removeFromHistory = useCallback((ean: string) => {
    setHistory((prev) => prev.filter((e) => e.ean !== ean))
  }, [])

  const clearHistory = useCallback(() => {
    setHistory([])
  }, [])

  return {
    history,
    addToHistory,
    removeFromHistory,
    clearHistory,
  } as const
}
