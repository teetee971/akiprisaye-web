/**
 * Water Quality Service
 * Intégration données ARS (Agence Régionale de Santé)
 * 
 * Service de suivi de la qualité de l'eau potable
 */

import type {
  WaterQualityData,
  Territory,
  WaterAvailabilityDatabase,
} from '../types/waterComparison';

/**
 * Load water availability database
 */
async function loadDatabase(): Promise<WaterAvailabilityDatabase> {
  try {
    const response = await fetch('/data/water-availability.json');
    if (!response.ok) {
      throw new Error('Failed to load water availability data');
    }
    return await response.json();
  } catch (error) {
    console.error('Error loading water availability database:', error);
    return {
      metadata: {
        generated_at: new Date().toISOString(),
        source: 'A KI PRI SA YÉ',
        note: 'Error loading data',
      },
      providers: [],
      current_status: [],
      cut_history: [],
      pricing: [],
      quality: [],
      leaks: [],
    };
  }
}

/**
 * Get water quality data for a commune
 */
export async function getWaterQuality(
  commune: string,
  territory: Territory
): Promise<WaterQualityData | null> {
  const db = await loadDatabase();

  const quality = db.quality.find(
    (q) =>
      q.commune.toLowerCase() === commune.toLowerCase() &&
      q.territory === territory
  );

  return quality || null;
}

/**
 * Get all quality data for a territory
 */
export async function getAllQualityData(
  territory: Territory
): Promise<WaterQualityData[]> {
  const db = await loadDatabase();

  return db.quality.filter((q) => q.territory === territory);
}

/**
 * Parse ARS data format (placeholder for future integration)
 * In real implementation, this would parse official ARS data format
 */
export function parseARSData(arsData: any): WaterQualityData {
  // This is a placeholder for actual ARS data parsing
  // Real implementation would handle official ARS data structure
  return {
    id: arsData.id || `quality_${Date.now()}`,
    commune: arsData.commune || '',
    territory: arsData.territory || 'GP',
    quality: {
      overallScore: arsData.score || 'B',
      bacteriological: arsData.bacteriological || 'compliant',
      chemical: arsData.chemical || 'compliant',
      parameters: arsData.parameters || [],
    },
    analysisDate: arsData.analysisDate || new Date().toISOString(),
    nextAnalysisDate: arsData.nextAnalysisDate,
    restrictions: arsData.restrictions,
    source: {
      type: 'ARS',
      url: arsData.sourceUrl,
    },
  };
}

/**
 * Get quality trend from historical data
 */
export function getQualityTrend(
  history: WaterQualityData[]
): 'improving' | 'stable' | 'degrading' {
  if (history.length < 2) {
    return 'stable';
  }

  // Sort by analysis date
  const sorted = [...history].sort(
    (a, b) =>
      new Date(a.analysisDate).getTime() - new Date(b.analysisDate).getTime()
  );

  // Score mapping
  const scoreValues: Record<string, number> = {
    A: 5,
    B: 4,
    C: 3,
    D: 2,
    E: 1,
  };

  const scores = sorted.map((q) => scoreValues[q.quality.overallScore] || 3);

  // Calculate trend
  let improvements = 0;
  let degradations = 0;

  for (let i = 1; i < scores.length; i++) {
    const diff = scores[i] - scores[i - 1];
    if (diff > 0) improvements++;
    else if (diff < 0) degradations++;
  }

  if (improvements > degradations) return 'improving';
  if (degradations > improvements) return 'degrading';
  return 'stable';
}

/**
 * Check if water quality meets standards
 */
export function isWaterQualityCompliant(quality: WaterQualityData): boolean {
  return (
    quality.quality.bacteriological === 'compliant' &&
    quality.quality.chemical === 'compliant' &&
    quality.quality.parameters.every((p) => p.compliant)
  );
}

/**
 * Get quality score description
 */
export function getQualityScoreDescription(
  score: WaterQualityData['quality']['overallScore']
): string {
  const descriptions: Record<string, string> = {
    A: 'Excellente qualité - Eau conforme à toutes les normes',
    B: 'Bonne qualité - Eau potable conforme',
    C: 'Qualité acceptable - Surveillance renforcée recommandée',
    D: 'Qualité médiocre - Restrictions possibles',
    E: 'Qualité non conforme - Eau non potable',
  };

  return descriptions[score] || 'Qualité inconnue';
}

/**
 * Get communes with quality issues
 */
export async function getCommunesWithQualityIssues(
  territory: Territory
): Promise<WaterQualityData[]> {
  const db = await loadDatabase();

  return db.quality.filter(
    (q) =>
      q.territory === territory &&
      (q.quality.overallScore === 'D' ||
        q.quality.overallScore === 'E' ||
        q.quality.bacteriological === 'non_compliant' ||
        q.quality.chemical === 'non_compliant' ||
        q.restrictions)
  );
}

/**
 * Get next analysis due date for communes
 */
export async function getCommunesNeedingAnalysis(
  territory: Territory,
  daysAhead: number = 7
): Promise<WaterQualityData[]> {
  const db = await loadDatabase();
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + daysAhead);

  return db.quality.filter((q) => {
    if (!q.nextAnalysisDate || q.territory !== territory) return false;

    const nextDate = new Date(q.nextAnalysisDate);
    return nextDate <= targetDate;
  });
}
