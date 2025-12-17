/**
 * IEVR (Indice d'Écart de Vie Réelle) Calculation Utilities
 * 
 * This module provides functions to calculate the IEVR score for territories.
 * The IEVR measures the real cost of living gap between territories.
 * 
 * Score interpretation:
 * - 100: Reference territory (Hexagone)
 * - < 100: More difficult to live (higher costs relative to income)
 * - > 100: Easier to live (lower costs relative to income)
 */

/**
 * Calculate IEVR score from category scores and weights
 * 
 * Formula:
 * IEVR = Σ(category_score × category_weight)
 * 
 * @param {Object} categories - Category scores { alimentation: 65, hygiene: 68, ... }
 * @param {Object} weights - Category weights { alimentation: 0.40, hygiene: 0.15, ... }
 * @returns {number} Calculated IEVR score (0-100)
 */
export function calculateIEVRScore(categories, weights) {
  if (!categories || !weights) {
    throw new Error('Categories and weights are required');
  }

  let totalScore = 0;
  let totalWeight = 0;

  // Calculate weighted sum
  for (const [category, score] of Object.entries(categories)) {
    const weight = weights[category] || 0;
    totalScore += score * weight;
    totalWeight += weight;
  }

  // Ensure weights sum to 1 (100%)
  if (Math.abs(totalWeight - 1) > 0.001) {
    console.warn(`Total weight is ${totalWeight}, expected 1.0`);
  }

  // Round to nearest integer
  return Math.round(totalScore);
}

/**
 * Compare territory score to reference
 * 
 * @param {number} territoryScore - Territory IEVR score
 * @param {number} referenceScore - Reference score (default: 100)
 * @returns {Object} Comparison data { difference, percentDiff, interpretation }
 */
export function compareToReference(territoryScore, referenceScore = 100) {
  const difference = territoryScore - referenceScore;
  const percentDiff = ((territoryScore - referenceScore) / referenceScore) * 100;
  
  let interpretation;
  if (Math.abs(percentDiff) < 5) {
    interpretation = 'similaire';
  } else if (percentDiff < 0) {
    interpretation = 'plus difficile';
  } else {
    interpretation = 'plus facile';
  }

  return {
    difference: Math.round(difference),
    percentDiff: Math.round(percentDiff),
    interpretation,
  };
}

/**
 * Calculate temporal evolution
 * 
 * @param {number} currentScore - Current IEVR score
 * @param {number} previousScore - Previous period IEVR score
 * @returns {Object} Evolution data { change, percentChange, trend }
 */
export function calculateEvolution(currentScore, previousScore) {
  if (!previousScore) {
    return {
      change: 0,
      percentChange: 0,
      trend: 'stable',
    };
  }

  const change = currentScore - previousScore;
  const percentChange = ((currentScore - previousScore) / previousScore) * 100;

  let trend;
  if (Math.abs(percentChange) < 1) {
    trend = 'stable';
  } else if (change > 0) {
    trend = 'amélioration';
  } else {
    trend = 'dégradation';
  }

  return {
    change: Math.round(change * 10) / 10, // Round to 1 decimal
    percentChange: Math.round(percentChange * 10) / 10,
    trend,
  };
}

/**
 * Generate explanatory text for IEVR score
 * 
 * This function creates a neutral, factual explanation of the IEVR score
 * without naming brands or making accusations.
 * 
 * @param {string} territoryName - Name of the territory
 * @param {number} score - IEVR score
 * @param {number} referenceScore - Reference score (default: 100)
 * @returns {string} Explanatory text
 */
export function generateExplanation(territoryName, score, referenceScore = 100) {
  const comparison = compareToReference(score, referenceScore);
  const diffPercent = Math.abs(comparison.percentDiff);

  if (comparison.interpretation === 'similaire') {
    return `Avec un revenu standard, le coût de la vie en ${territoryName} est similaire à celui de la zone de référence.`;
  } else if (comparison.interpretation === 'plus difficile') {
    return `Avec un revenu standard, vivre en ${territoryName} est ${diffPercent}% plus difficile qu'en zone de référence.`;
  } else {
    return `Avec un revenu standard, vivre en ${territoryName} est ${diffPercent}% plus facile qu'en zone de référence.`;
  }
}

/**
 * Get territory status label based on IEVR score
 * 
 * Status categories:
 * - IEVR >= 90: Normal situation
 * - 75 <= IEVR < 90: Under pressure
 * - IEVR < 75: High pressure
 * 
 * @param {number} score - IEVR score
 * @returns {Object} Status data { label, level, color, icon, description }
 */
export function getTerritoryStatus(score) {
  if (score >= 90) {
    return {
      label: 'Situation normale',
      level: 'normal',
      color: '#10b981', // green
      icon: '✅',
      description: 'Écart faible avec le territoire de référence',
    };
  } else if (score >= 75) {
    return {
      label: 'Sous tension',
      level: 'pressure',
      color: '#f59e0b', // amber
      icon: '⚠️',
      description: 'Écart notable nécessitant une vigilance',
    };
  } else {
    return {
      label: 'Forte tension',
      level: 'high-pressure',
      color: '#ef4444', // red
      icon: '🔴',
      description: 'Écart important nécessitant une attention particulière',
    };
  }
}

/**
 * Get score color based on value
 * Used for visual representation
 * 
 * @param {number} score - IEVR score
 * @returns {string} Color class or hex value
 */
export function getScoreColor(score) {
  if (score >= 90) return '#10b981'; // green
  if (score >= 75) return '#3b82f6'; // blue
  if (score >= 60) return '#f59e0b'; // amber
  return '#ef4444'; // red
}

/**
 * Get trend icon based on evolution
 * 
 * @param {string} trend - Trend value ('amélioration', 'dégradation', 'stable')
 * @returns {string} Emoji icon
 */
export function getTrendIcon(trend) {
  switch (trend) {
    case 'amélioration':
      return '📈';
    case 'dégradation':
      return '📉';
    case 'stable':
    default:
      return '➡️';
  }
}

/**
 * Validate IEVR data structure
 * 
 * @param {Object} data - IEVR data object
 * @returns {boolean} True if valid
 * @throws {Error} If validation fails
 */
export function validateIEVRData(data) {
  if (!data.metadata) {
    throw new Error('Missing metadata');
  }

  if (!data.categories) {
    throw new Error('Missing categories');
  }

  if (!data.territories) {
    throw new Error('Missing territories');
  }

  // Validate category weights sum to 1
  let totalWeight = 0;
  for (const category of Object.values(data.categories)) {
    totalWeight += category.weight;
  }

  if (Math.abs(totalWeight - 1) > 0.001) {
    throw new Error(`Category weights sum to ${totalWeight}, expected 1.0`);
  }

  return true;
}
