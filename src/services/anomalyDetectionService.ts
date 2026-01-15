/**
 * Anomaly Detection Service
 * 
 * Detects price anomalies using transparent statistical methods
 * - Sudden price increases
 * - Excessive territorial gaps
 * - Shrinkflation
 * - Data series breaks
 * 
 * NO OPAQUE AI - All methods are explainable and auditable
 */

export type AnomalyType = 'hausse_brutale' | 'ecart_territorial' | 'shrinkflation' | 'rupture_serie';

export type AnomalySeverity = 'low' | 'medium' | 'high';

export interface PriceAnomaly {
  type: AnomalyType;
  severity: AnomalySeverity;
  productName: string;
  ean?: string;
  description: string;
  detectedAt: string;
  metadata: Record<string, any>;
}

export interface PriceDataPoint {
  date: string;
  price: number;
  territory?: string;
  store?: string;
}

/**
 * Detect sudden price increase over a time period
 * 
 * @param data - Array of price data points (chronologically sorted)
 * @param productName - Name of the product
 * @param windowDays - Time window to check (default: 7 days)
 * @returns Anomaly if detected, null otherwise
 */
export function detectSuddenIncrease(
  data: PriceDataPoint[],
  productName: string,
  ean?: string,
  windowDays: number = 7
): PriceAnomaly | null {
  if (data.length < 2) return null;

  // Get most recent and previous price within window
  const recent = data[data.length - 1];
  const windowStart = new Date(recent.date);
  windowStart.setDate(windowStart.getDate() - windowDays);

  const previousInWindow = data
    .filter(d => new Date(d.date) >= windowStart && new Date(d.date) < new Date(recent.date))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (previousInWindow.length === 0) return null;

  const previous = previousInWindow[0];
  const variation = ((recent.price - previous.price) / previous.price) * 100;

  // Thresholds
  let severity: AnomalySeverity | null = null;
  if (variation >= 20) severity = 'high';
  else if (variation >= 10) severity = 'medium';
  else if (variation >= 5) severity = 'low';

  if (severity === null) return null;

  return {
    type: 'hausse_brutale',
    severity,
    productName,
    ean,
    description: `Hausse de ${variation.toFixed(1)}% observée sur ${windowDays} jours (de ${previous.price.toFixed(2)}€ à ${recent.price.toFixed(2)}€)`,
    detectedAt: new Date().toISOString(),
    metadata: {
      previousPrice: previous.price,
      currentPrice: recent.price,
      variationPercent: variation,
      windowDays,
      previousDate: previous.date,
      currentDate: recent.date,
    },
  };
}

/**
 * Detect excessive territorial price gap compared to mainland France
 * 
 * @param territorialPrice - Price in the territory
 * @param mainlandPrice - Price in mainland France
 * @param productName - Name of the product
 * @param territory - Territory code
 * @returns Anomaly if detected, null otherwise
 */
export function detectTerritorialGap(
  territorialPrice: number,
  mainlandPrice: number,
  productName: string,
  territory: string,
  ean?: string
): PriceAnomaly | null {
  if (mainlandPrice <= 0) return null;

  const gap = ((territorialPrice - mainlandPrice) / mainlandPrice) * 100;

  // Thresholds for territorial gaps
  let severity: AnomalySeverity | null = null;
  if (gap >= 30) severity = 'high';
  else if (gap >= 20) severity = 'medium';
  else if (gap >= 10) severity = 'low';

  if (severity === null) return null;

  return {
    type: 'ecart_territorial',
    severity,
    productName,
    ean,
    description: `Écart de ${gap.toFixed(1)}% par rapport à l'Hexagone (${territorialPrice.toFixed(2)}€ vs ${mainlandPrice.toFixed(2)}€)`,
    detectedAt: new Date().toISOString(),
    metadata: {
      territorialPrice,
      mainlandPrice,
      gapPercent: gap,
      territory,
    },
  };
}

/**
 * Detect shrinkflation (price stable but quantity decreased)
 * 
 * @param oldQuantity - Previous product quantity
 * @param newQuantity - Current product quantity
 * @param oldPrice - Previous price
 * @param newPrice - Current price
 * @param productName - Name of the product
 * @returns Anomaly if detected, null otherwise
 */
export function detectShrinkflation(
  oldQuantity: number,
  newQuantity: number,
  oldPrice: number,
  newPrice: number,
  productName: string,
  ean?: string
): PriceAnomaly | null {
  if (oldQuantity <= 0 || newQuantity <= 0 || oldPrice <= 0 || newPrice <= 0) return null;

  const quantityChange = ((newQuantity - oldQuantity) / oldQuantity) * 100;
  const priceChange = ((newPrice - oldPrice) / oldPrice) * 100;

  // Detect shrinkflation: quantity decreased significantly while price stayed stable or increased slightly
  const isShrinkflation = quantityChange < -5 && priceChange >= -5 && priceChange <= 10;

  if (!isShrinkflation) return null;

  // Calculate effective price per unit increase
  const oldPricePerUnit = oldPrice / oldQuantity;
  const newPricePerUnit = newPrice / newQuantity;
  const unitPriceIncrease = ((newPricePerUnit - oldPricePerUnit) / oldPricePerUnit) * 100;

  let severity: AnomalySeverity = 'low';
  if (unitPriceIncrease >= 15) severity = 'high';
  else if (unitPriceIncrease >= 10) severity = 'medium';

  return {
    type: 'shrinkflation',
    severity,
    productName,
    ean,
    description: `Réduction de quantité de ${Math.abs(quantityChange).toFixed(1)}% avec prix quasi stable (+${unitPriceIncrease.toFixed(1)}% au kg/L)`,
    detectedAt: new Date().toISOString(),
    metadata: {
      oldQuantity,
      newQuantity,
      oldPrice,
      newPrice,
      quantityChangePercent: quantityChange,
      priceChangePercent: priceChange,
      unitPriceIncreasePercent: unitPriceIncrease,
    },
  };
}

/**
 * Detect data series break (significant gap in observations)
 * 
 * @param data - Array of price data points (chronologically sorted)
 * @param productName - Name of the product
 * @param maxGapDays - Maximum acceptable gap between observations (default: 60 days)
 * @returns Anomaly if detected, null otherwise
 */
export function detectSeriesBreak(
  data: PriceDataPoint[],
  productName: string,
  ean?: string,
  maxGapDays: number = 60
): PriceAnomaly | null {
  if (data.length < 2) return null;

  // Check for gaps in the time series
  for (let i = 1; i < data.length; i++) {
    const current = new Date(data[i].date);
    const previous = new Date(data[i - 1].date);
    const gapDays = (current.getTime() - previous.getTime()) / (1000 * 60 * 60 * 24);

    if (gapDays > maxGapDays) {
      return {
        type: 'rupture_serie',
        severity: 'medium',
        productName,
        ean,
        description: `Absence d'observations pendant ${Math.round(gapDays)} jours (du ${previous.toLocaleDateString('fr-FR')} au ${current.toLocaleDateString('fr-FR')})`,
        detectedAt: new Date().toISOString(),
        metadata: {
          gapDays: Math.round(gapDays),
          startDate: data[i - 1].date,
          endDate: data[i].date,
        },
      };
    }
  }

  return null;
}

/**
 * Get all anomalies for a product
 * 
 * @param data - Price data for the product
 * @param productName - Name of the product
 * @param ean - EAN code
 * @param options - Detection options
 * @returns Array of detected anomalies
 */
export function getAllAnomalies(
  data: PriceDataPoint[],
  productName: string,
  ean?: string,
  options?: {
    enableSuddenIncrease?: boolean;
    enableTerritorialGap?: boolean;
    enableShrinkflation?: boolean;
    enableSeriesBreak?: boolean;
    mainlandPrice?: number;
    territory?: string;
    oldQuantity?: number;
    newQuantity?: number;
  }
): PriceAnomaly[] {
  const anomalies: PriceAnomaly[] = [];

  const {
    enableSuddenIncrease = true,
    enableTerritorialGap = false,
    enableShrinkflation = false,
    enableSeriesBreak = true,
    mainlandPrice,
    territory,
    oldQuantity,
    newQuantity,
  } = options || {};

  // Sort data chronologically
  const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Detect sudden increase
  if (enableSuddenIncrease && sortedData.length >= 2) {
    const anomaly = detectSuddenIncrease(sortedData, productName, ean);
    if (anomaly) anomalies.push(anomaly);
  }

  // Detect territorial gap
  if (enableTerritorialGap && mainlandPrice && territory && sortedData.length > 0) {
    const currentPrice = sortedData[sortedData.length - 1].price;
    const anomaly = detectTerritorialGap(currentPrice, mainlandPrice, productName, territory, ean);
    if (anomaly) anomalies.push(anomaly);
  }

  // Detect shrinkflation
  if (enableShrinkflation && oldQuantity && newQuantity && sortedData.length >= 2) {
    const oldPrice = sortedData[0].price;
    const newPrice = sortedData[sortedData.length - 1].price;
    const anomaly = detectShrinkflation(oldQuantity, newQuantity, oldPrice, newPrice, productName, ean);
    if (anomaly) anomalies.push(anomaly);
  }

  // Detect series break
  if (enableSeriesBreak) {
    const anomaly = detectSeriesBreak(sortedData, productName, ean);
    if (anomaly) anomalies.push(anomaly);
  }

  return anomalies;
}

/**
 * Format anomaly for display with color badge
 */
export function formatAnomalyDisplay(anomaly: PriceAnomaly): {
  badge: string;
  color: string;
  message: string;
} {
  const severityColors = {
    low: '#3b82f6', // blue
    medium: '#f59e0b', // amber
    high: '#ef4444', // red
  };

  const typeLabels: Record<AnomalyType, string> = {
    hausse_brutale: '📈 Hausse brutale',
    ecart_territorial: '🌍 Écart territorial',
    shrinkflation: '📉 Shrinkflation',
    rupture_serie: '⚠️ Rupture de série',
  };

  return {
    badge: typeLabels[anomaly.type],
    color: severityColors[anomaly.severity],
    message: anomaly.description,
  };
}

/**
 * Format date for anomaly display (standardized format)
 */
export function formatAnomalyDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  } catch {
    return dateString;
  }
}
