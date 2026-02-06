// src/utils/__tests__/dataReliability.test.ts
import { describe, it, expect } from 'vitest'
import {
  computeReliabilityScore,
  getReliabilityLabel,
  getReliabilityColor,
  getReliabilityEmoji,
} from '../dataReliability'

describe('dataReliability', () => {
  describe('computeReliabilityScore', () => {
    it('should return high reliability for good data (10+ observations, recent, coherent)', () => {
      const values = [5.99, 6.0, 5.95, 6.05, 5.98, 6.0, 5.97, 6.02, 5.99, 6.01, 5.98]
      const lastUpdated = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days ago

      const result = computeReliabilityScore({ values, lastUpdated })

      expect(result.level).toBe('high')
      expect(result.score).toBeGreaterThanOrEqual(70)
      expect(result.details.observations).toBe(11)
    })

    it('should return medium reliability for moderate data (5-9 observations, acceptable age)', () => {
      const values = [5.99, 6.5, 6.2, 5.8, 6.1, 6.0, 5.95]
      const lastUpdated = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString() // 15 days ago

      const result = computeReliabilityScore({ values, lastUpdated })

      expect(result.level).toBe('medium')
      expect(result.score).toBeGreaterThanOrEqual(40)
      expect(result.score).toBeLessThan(70)
    })

    it('should return low reliability for poor data (few observations, old, incoherent)', () => {
      const values = [5.99, 12.5, 3.2]
      const lastUpdated = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString() // 45 days ago

      const result = computeReliabilityScore({ values, lastUpdated })

      expect(result.level).toBe('low')
      expect(result.score).toBeLessThan(40)
      expect(result.details.observations).toBe(3)
    })

    it('should handle single observation with neutral coherence score', () => {
      const values = [5.99]
      const lastUpdated = new Date().toISOString()

      const result = computeReliabilityScore({ values, lastUpdated })

      expect(result.details.observations).toBe(1)
      expect(result.details.coherenceScore).toBe(15) // Neutral score
      expect(result.details.coherence).toContain('insuffisantes')
    })

    it('should give maximum observation score for 10+ observations', () => {
      const values = Array(12).fill(6.0)
      const lastUpdated = new Date().toISOString()

      const result = computeReliabilityScore({ values, lastUpdated })

      expect(result.details.observationScore).toBe(40)
      expect(result.details.observations).toBe(12)
    })

    it('should give maximum recency score for data less than 7 days old', () => {
      const values = [5.99, 6.0, 5.95]
      const lastUpdated = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() // 5 days ago

      const result = computeReliabilityScore({ values, lastUpdated })

      expect(result.details.recencyScore).toBe(30)
      expect(result.details.recency).toContain('récent')
    })

    it('should give lower recency score for data older than 30 days', () => {
      const values = [5.99, 6.0, 5.95]
      const lastUpdated = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString() // 60 days ago

      const result = computeReliabilityScore({ values, lastUpdated })

      expect(result.details.recencyScore).toBe(10)
      expect(result.details.recency).toContain('ancien')
    })

    it('should give maximum coherence score for very consistent values', () => {
      const values = [6.0, 6.01, 5.99, 6.0, 6.02, 5.98] // CV < 10%
      const lastUpdated = new Date().toISOString()

      const result = computeReliabilityScore({ values, lastUpdated })

      expect(result.details.coherenceScore).toBe(30)
      expect(result.details.coherence).toContain('élevée')
    })

    it('should give lower coherence score for highly variable values', () => {
      const values = [5.0, 8.0, 4.5, 9.0, 6.0] // High CV
      const lastUpdated = new Date().toISOString()

      const result = computeReliabilityScore({ values, lastUpdated })

      expect(result.details.coherenceScore).toBeLessThan(20)
      expect(result.details.coherence).toContain('Variation')
    })

    it('should calculate total score correctly as sum of components', () => {
      const values = [6.0, 6.01, 5.99, 6.0, 6.02, 5.98, 6.0, 5.99, 6.01, 6.0]
      const lastUpdated = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()

      const result = computeReliabilityScore({ values, lastUpdated })

      const expectedTotal = 
        result.details.observationScore + 
        result.details.recencyScore + 
        result.details.coherenceScore

      expect(result.score).toBe(expectedTotal)
    })
  })

  describe('getReliabilityLabel', () => {
    it('should return correct French label for high reliability', () => {
      expect(getReliabilityLabel('high')).toBe('Fiabilité élevée')
    })

    it('should return correct French label for medium reliability', () => {
      expect(getReliabilityLabel('medium')).toBe('Fiabilité moyenne')
    })

    it('should return correct French label for low reliability', () => {
      expect(getReliabilityLabel('low')).toBe('Fiabilité limitée')
    })
  })

  describe('getReliabilityColor', () => {
    it('should return green color for high reliability', () => {
      const color = getReliabilityColor('high')
      expect(color).toBe('#059669')
    })

    it('should return amber color for medium reliability', () => {
      const color = getReliabilityColor('medium')
      expect(color).toBe('#d97706')
    })

    it('should return red color for low reliability', () => {
      const color = getReliabilityColor('low')
      expect(color).toBe('#dc2626')
    })
  })

  describe('getReliabilityEmoji', () => {
    it('should return green circle for high reliability', () => {
      expect(getReliabilityEmoji('high')).toBe('🟢')
    })

    it('should return yellow circle for medium reliability', () => {
      expect(getReliabilityEmoji('medium')).toBe('🟡')
    })

    it('should return red circle for low reliability', () => {
      expect(getReliabilityEmoji('low')).toBe('🔴')
    })
  })
})
