// src/utils/dataReliability.ts
// Data Reliability Score Calculator - Factual Quality Indicator
// Based on observable metrics: observation count, recency, and coherence

export type ReliabilityLevel = 'high' | 'medium' | 'low'

export type ReliabilityScore = {
  score: number // 0-100
  level: ReliabilityLevel
  details: {
    observations: number
    recency: string
    coherence: string
    observationScore: number // 0-40
    recencyScore: number // 0-30
    coherenceScore: number // 0-30
  }
}

export type ReliabilityParams = {
  values: number[]
  lastUpdated: string // ISO date
}

/**
 * Compute reliability score based on factual criteria:
 * - Number of observations (0-40 points)
 * - Data recency (0-30 points)
 * - Value coherence/consistency (0-30 points)
 * 
 * This is NOT an AI prediction or commercial score.
 * It is a factual indicator of data quality for public information.
 */
export function computeReliabilityScore(params: ReliabilityParams): ReliabilityScore {
  const { values, lastUpdated } = params

  // 1. Observation Score (0-40 points)
  const observationCount = values.length
  let observationScore = 0
  let observationText = ''

  if (observationCount >= 10) {
    observationScore = 40
    observationText = `${observationCount} observations (bon)`
  } else if (observationCount >= 5) {
    observationScore = 20
    observationText = `${observationCount} observations (moyen)`
  } else {
    observationScore = Math.min(observationCount * 5, 20)
    observationText = `${observationCount} observations (faible)`
  }

  // 2. Recency Score (0-30 points)
  const lastUpdateDate = new Date(lastUpdated)
  const now = new Date()
  const daysSinceUpdate = Math.floor(
    (now.getTime() - lastUpdateDate.getTime()) / (1000 * 60 * 60 * 24)
  )

  let recencyScore = 0
  let recencyText = ''

  if (daysSinceUpdate < 7) {
    recencyScore = 30
    recencyText = `< 7 jours (récent)`
  } else if (daysSinceUpdate <= 30) {
    recencyScore = 15
    recencyText = `${daysSinceUpdate} jours (acceptable)`
  } else {
    recencyScore = 10
    recencyText = `${daysSinceUpdate} jours (ancien)`
  }

  // 3. Coherence Score (0-30 points)
  // Based on standard deviation relative to mean
  let coherenceScore = 0
  let coherenceText = ''

  if (values.length < 2) {
    coherenceScore = 15 // Neutral score for single value
    coherenceText = 'Données insuffisantes pour évaluer'
  } else {
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length
    const stdDev = Math.sqrt(variance)
    const coefficientOfVariation = mean > 0 ? (stdDev / mean) * 100 : 0

    // Lower variation = more coherent
    if (coefficientOfVariation < 10) {
      coherenceScore = 30
      coherenceText = 'Cohérence élevée'
    } else if (coefficientOfVariation < 25) {
      coherenceScore = 20
      coherenceText = 'Cohérence moyenne'
    } else {
      coherenceScore = 10
      coherenceText = 'Variation importante'
    }
  }

  // Total Score
  const totalScore = observationScore + recencyScore + coherenceScore

  // Level Classification
  let level: ReliabilityLevel
  if (totalScore >= 70) {
    level = 'high'
  } else if (totalScore >= 40) {
    level = 'medium'
  } else {
    level = 'low'
  }

  return {
    score: totalScore,
    level,
    details: {
      observations: observationCount,
      recency: recencyText,
      coherence: coherenceText,
      observationScore,
      recencyScore,
      coherenceScore,
    },
  }
}

/**
 * Get reliability level label in French (institutional tone)
 */
export function getReliabilityLabel(level: ReliabilityLevel): string {
  switch (level) {
    case 'high':
      return 'Fiabilité élevée'
    case 'medium':
      return 'Fiabilité moyenne'
    case 'low':
      return 'Fiabilité limitée'
  }
}

/**
 * Get reliability level color (neutral, institutional)
 */
export function getReliabilityColor(level: ReliabilityLevel): string {
  switch (level) {
    case 'high':
      return '#059669' // Green-600
    case 'medium':
      return '#d97706' // Amber-600
    case 'low':
      return '#dc2626' // Red-600
  }
}

/**
 * Get reliability level emoji (visual indicator)
 */
export function getReliabilityEmoji(level: ReliabilityLevel): string {
  switch (level) {
    case 'high':
      return '🟢'
    case 'medium':
      return '🟡'
    case 'low':
      return '🔴'
  }
}
