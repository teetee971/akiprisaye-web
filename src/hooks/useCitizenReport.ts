// src/hooks/useCitizenReport.ts
// Citizen observation reporting hook - sessionStorage only, no backend
import { useState, useCallback } from 'react'

export type ObservationType = 
  | 'price_different'
  | 'product_absent'
  | 'reference_error'
  | 'other_observation'

export type CitizenReport = {
  id: string
  type: ObservationType
  description: string
  observationDate: string // ISO date
  store?: string
  createdAt: string // ISO date
}

const SESSION_KEY = 'akiprisaye:citizen_reports:session'

/**
 * Citizen observation reporting hook
 * - Stored only in sessionStorage (cleared on browser close)
 * - No backend persistence
 * - No authentication required
 * - No personal data collected
 */
export function useCitizenReport() {
  const [reports, setReports] = useState<CitizenReport[]>(() => {
    const isEnabled = import.meta.env.VITE_FEATURE_CITIZEN_REPORT === 'true'
    if (!isEnabled) {
      return []
    }

    try {
      const stored = sessionStorage.getItem(SESSION_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })

  // Add new citizen report
  const addReport = useCallback((
    report: Omit<CitizenReport, 'id' | 'createdAt'>
  ) => {
    const isEnabled = import.meta.env.VITE_FEATURE_CITIZEN_REPORT === 'true'
    if (!isEnabled) {
      return
    }

    const newReport: CitizenReport = {
      ...report,
      id: `report-${Date.now()}`,
      createdAt: new Date().toISOString(),
    }

    setReports((prev) => {
      const updated = [newReport, ...prev]
      
      try {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(updated))
      } catch (error) {
        console.warn('Failed to save citizen report:', error)
      }

      return updated
    })
  }, [])

  // Clear all reports (for testing or reset)
  const clearReports = useCallback(() => {
    setReports([])
    try {
      sessionStorage.removeItem(SESSION_KEY)
    } catch (error) {
      console.warn('Failed to clear citizen reports:', error)
    }
  }, [])

  return { reports, addReport, clearReports }
}
