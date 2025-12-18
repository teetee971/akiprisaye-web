/**
 * CORE MODULE 3: Price Indicators Utilities
 * 
 * ABSOLUTE RULE:
 * - NO PRICE PREDICTION
 * - NO FUTURE GUESSING
 * - NO SYNTHETIC DATA
 * - ONLY OBSERVED, TIMESTAMPED, SOURCE-IDENTIFIED DATA
 * 
 * All indicators are FACTUAL and based on HISTORICAL observations only.
 */

/**
 * Calculate Price Stability Index
 * Measures volatility over time using standard deviation
 * 
 * @param {Array} history - Price history entries
 * @returns {Object} { index: number (0-100), interpretation: string, dataPoints: number }
 */
export function calculatePriceStabilityIndex(history) {
  if (!history || history.length < 2) {
    return {
      index: null,
      interpretation: 'Données insuffisantes',
      dataPoints: history?.length || 0,
      confidenceLevel: 'LOW',
      methodology: 'Minimum 2 observations requises'
    };
  }

  const prices = history.map(h => h.price);
  const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
  const variance = prices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / prices.length;
  const stdDev = Math.sqrt(variance);
  
  // Coefficient of variation (CV) = (stdDev / mean) * 100
  const cv = (stdDev / mean) * 100;
  
  // Stability index: 100 - CV (higher = more stable)
  // Cap at 0-100 range
  const index = Math.max(0, Math.min(100, 100 - cv));
  
  let interpretation;
  if (index >= 90) interpretation = 'Très stable';
  else if (index >= 75) interpretation = 'Stable';
  else if (index >= 50) interpretation = 'Modérément volatile';
  else if (index >= 25) interpretation = 'Volatile';
  else interpretation = 'Très volatile';
  
  return {
    index: Math.round(index),
    interpretation,
    dataPoints: history.length,
    confidenceLevel: history.length >= 12 ? 'HIGH' : history.length >= 6 ? 'MEDIUM' : 'LOW',
    methodology: 'Calculé à partir de l\'écart-type / prix moyen'
  };
}

/**
 * Calculate Price Pressure Indicator
 * Measures frequency of increases vs decreases
 * 
 * @param {Array} history - Price history entries (must be sorted by date)
 * @returns {Object} { increases: number, decreases: number, stable: number, pressure: string }
 */
export function calculatePricePressureIndicator(history) {
  if (!history || history.length < 2) {
    return {
      increases: 0,
      decreases: 0,
      stable: 0,
      pressure: 'Données insuffisantes',
      dataPoints: history?.length || 0,
      confidenceLevel: 'LOW',
      methodology: 'Minimum 2 observations requises'
    };
  }

  // Sort by date (oldest first)
  const sorted = [...history].sort((a, b) => new Date(a.date) - new Date(b.date));
  
  let increases = 0;
  let decreases = 0;
  let stable = 0;
  
  for (let i = 1; i < sorted.length; i++) {
    const diff = sorted[i].price - sorted[i - 1].price;
    if (diff > 0.01) increases++;
    else if (diff < -0.01) decreases++;
    else stable++;
  }
  
  const total = increases + decreases + stable;
  let pressure;
  
  if (increases > decreases * 1.5) pressure = 'Pression à la hausse forte';
  else if (increases > decreases) pressure = 'Pression à la hausse';
  else if (decreases > increases * 1.5) pressure = 'Tendance à la baisse forte';
  else if (decreases > increases) pressure = 'Tendance à la baisse';
  else pressure = 'Relativement stable';
  
  return {
    increases,
    decreases,
    stable,
    pressure,
    dataPoints: total,
    confidenceLevel: total >= 10 ? 'HIGH' : total >= 5 ? 'MEDIUM' : 'LOW',
    methodology: `Basé sur ${total} variations observées`
  };
}

/**
 * Detect Shrinkflation
 * Quantity reduction without proportional price reduction
 * 
 * @param {Array} history - Price history entries (must include quantity)
 * @returns {Object} { detected: boolean, cases: Array, description: string }
 */
export function detectShrinkflation(history) {
  if (!history || history.length < 2) {
    return {
      detected: false,
      cases: [],
      description: 'Données insuffisantes pour détecter la réduflation',
      dataPoints: history?.length || 0,
      confidenceLevel: 'LOW',
      methodology: 'Minimum 2 observations requises'
    };
  }

  // Sort by date (oldest first)
  const sorted = [...history].sort((a, b) => new Date(a.date) - new Date(b.date));
  
  const cases = [];
  
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];
    
    // Check if quantity decreased
    if (curr.quantity && prev.quantity && curr.quantity < prev.quantity) {
      const quantityReduction = ((prev.quantity - curr.quantity) / prev.quantity) * 100;
      const priceChange = ((curr.price - prev.price) / prev.price) * 100;
      
      // Shrinkflation: quantity reduced but price didn't decrease proportionally
      // or even increased
      if (priceChange >= -quantityReduction * 0.5) {
        cases.push({
          date: curr.date,
          previousQuantity: prev.quantity,
          newQuantity: curr.quantity,
          quantityReduction: quantityReduction.toFixed(1),
          previousPrice: prev.price,
          newPrice: curr.price,
          priceChange: priceChange.toFixed(1),
          severity: priceChange >= 0 ? 'HAUTE' : 'MOYENNE'
        });
      }
    }
  }
  
  return {
    detected: cases.length > 0,
    cases,
    description: cases.length > 0 
      ? `${cases.length} cas de réduflation détectés`
      : 'Aucune réduflation détectée',
    dataPoints: sorted.length,
    confidenceLevel: sorted.length >= 6 ? 'HIGH' : sorted.length >= 3 ? 'MEDIUM' : 'LOW',
    methodology: 'Comparaison quantité/prix entre observations successives'
  };
}

/**
 * Calculate Territorial Gap Index
 * Difference between territories for the same product
 * 
 * @param {Array} history - Price history entries from multiple territories
 * @returns {Object} { gaps: Array, maxGap: number, interpretation: string }
 */
export function calculateTerritorialGapIndex(history) {
  if (!history || history.length < 2) {
    return {
      gaps: [],
      maxGap: 0,
      interpretation: 'Données insuffisantes',
      dataPoints: 0,
      confidenceLevel: 'LOW',
      methodology: 'Minimum 2 observations de territoires différents requises'
    };
  }

  // Group by territory
  const byTerritory = {};
  history.forEach(entry => {
    if (!byTerritory[entry.territory]) {
      byTerritory[entry.territory] = [];
    }
    byTerritory[entry.territory].push(entry);
  });

  const territories = Object.keys(byTerritory);
  
  if (territories.length < 2) {
    return {
      gaps: [],
      maxGap: 0,
      interpretation: 'Un seul territoire disponible',
      dataPoints: history.length,
      confidenceLevel: 'LOW',
      methodology: 'Comparaison multi-territoires non applicable'
    };
  }

  // Calculate average price per territory
  const avgPrices = {};
  territories.forEach(territory => {
    const prices = byTerritory[territory].map(h => h.price);
    avgPrices[territory] = prices.reduce((a, b) => a + b, 0) / prices.length;
  });

  // Calculate gaps between territories
  const gaps = [];
  for (let i = 0; i < territories.length; i++) {
    for (let j = i + 1; j < territories.length; j++) {
      const t1 = territories[i];
      const t2 = territories[j];
      const gap = Math.abs(avgPrices[t1] - avgPrices[t2]);
      const gapPercent = (gap / Math.min(avgPrices[t1], avgPrices[t2])) * 100;
      
      gaps.push({
        territory1: t1,
        territory2: t2,
        price1: avgPrices[t1].toFixed(2),
        price2: avgPrices[t2].toFixed(2),
        gap: gap.toFixed(2),
        gapPercent: gapPercent.toFixed(1),
        observations1: byTerritory[t1].length,
        observations2: byTerritory[t2].length
      });
    }
  }

  const maxGap = Math.max(...gaps.map(g => parseFloat(g.gap)));
  const maxGapPercent = Math.max(...gaps.map(g => parseFloat(g.gapPercent)));
  
  let interpretation;
  if (maxGapPercent < 5) interpretation = 'Écarts faibles entre territoires';
  else if (maxGapPercent < 10) interpretation = 'Écarts modérés entre territoires';
  else if (maxGapPercent < 20) interpretation = 'Écarts significatifs entre territoires';
  else interpretation = 'Écarts importants entre territoires';

  return {
    gaps,
    maxGap: maxGap.toFixed(2),
    maxGapPercent: maxGapPercent.toFixed(1),
    interpretation,
    dataPoints: history.length,
    confidenceLevel: history.length >= 10 ? 'HIGH' : history.length >= 5 ? 'MEDIUM' : 'LOW',
    methodology: 'Prix moyens observés par territoire'
  };
}

/**
 * Get all indicators for a product
 * 
 * @param {Array} history - Complete price history
 * @returns {Object} All calculated indicators
 */
export function getAllIndicators(history) {
  return {
    stability: calculatePriceStabilityIndex(history),
    pressure: calculatePricePressureIndicator(history),
    shrinkflation: detectShrinkflation(history),
    territorialGap: calculateTerritorialGapIndex(history)
  };
}
