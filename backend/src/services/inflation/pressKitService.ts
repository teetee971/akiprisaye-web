/**
 * Press Kit Service
 * Generates monthly inflation reports for media distribution
 */

import { Territory, getInflationColor } from '../../config/inflationConfig.js';
import { prisma } from '../../app.js';
import { exportToXLSX, InflationExportData } from './exportService.js';
import { getTopMovers } from './topMoversService.js';
import { calculateMetroComparison } from './metroComparisonService.js';
import { analyzeCategoryTrends } from './categoryAnalysisService.js';

/**
 * Press kit content
 */
export interface PressKitContent {
  territory: Territory;
  year: number;
  month: number;
  generatedAt: Date;
  
  // Summary metrics
  summary: {
    indexValue: number;
    inflationRate: number;
    monthlyChange: number;
    colorCode: string;
  };
  
  // Key findings
  keyFindings: string[];
  
  // Category highlights
  categoryHighlights: Array<{
    category: string;
    trend: 'rising' | 'falling' | 'stable';
    changePercent: number;
  }>;
  
  // Top price movers
  topIncreases: string[];
  topDecreases: string[];
  
  // Metro comparison
  metroComparison: {
    priceGapPercent: number;
    interpretation: string;
  };
  
  // Data files
  dataFiles: {
    excelUrl?: string;
    jsonUrl?: string;
  };
}

/**
 * Generate press kit for a territory and period
 */
export async function generatePressKit(
  territory: Territory,
  year: number,
  month: number
): Promise<PressKitContent> {
  try {
    console.log(`[PressKit] Generating press kit for ${territory} ${year}-${month}`);

    // Get price index
    const priceIndex = await prisma.priceIndex.findUnique({
      where: {
        territory_year_month: {
          territory,
          year,
          month,
        },
      },
    });

    if (!priceIndex) {
      throw new Error(`No price index found for ${territory} ${year}-${month}`);
    }

    // Get category trends
    const categoryTrends = await analyzeCategoryTrends(territory, year, month);
    
    // Get top movers
    const topMovers = await getTopMovers(territory, year, month, 5);
    
    // Get metro comparison
    const metroComparison = await calculateMetroComparison(territory, year, month);

    // Generate summary
    const summary = {
      indexValue: priceIndex.indexValue,
      inflationRate: priceIndex.inflationRate,
      monthlyChange: priceIndex.monthlyChange,
      colorCode: getInflationColor(priceIndex.inflationRate),
    };

    // Generate key findings
    const keyFindings = generateKeyFindings(priceIndex, categoryTrends, metroComparison);

    // Generate category highlights
    const categoryHighlights = categoryTrends.slice(0, 5).map(trend => ({
      category: trend.category,
      trend: trend.trend,
      changePercent: trend.changePercent,
    }));

    // Format top movers
    const topIncreases = topMovers.topIncreases.map(m => 
      `${m.productName}: +${m.changePercent.toFixed(1)}%`
    );
    const topDecreases = topMovers.topDecreases.map(m => 
      `${m.productName}: ${m.changePercent.toFixed(1)}%`
    );

    // Metro comparison interpretation
    const metroInterpretation = metroComparison
      ? interpretMetroGap(metroComparison.priceGapPercent)
      : 'Données de comparaison non disponibles';

    const pressKit: PressKitContent = {
      territory,
      year,
      month,
      generatedAt: new Date(),
      summary,
      keyFindings,
      categoryHighlights,
      topIncreases,
      topDecreases,
      metroComparison: {
        priceGapPercent: metroComparison?.priceGapPercent || 0,
        interpretation: metroInterpretation,
      },
      dataFiles: {},
    };

    // Store in database
    await storePressKit(pressKit);

    return pressKit;
  } catch (error) {
    console.error('[PressKit] Error generating press kit:', error);
    throw error;
  }
}

/**
 * Generate key findings text
 */
function generateKeyFindings(
  priceIndex: { indexValue: number; inflationRate: number; monthlyChange: number },
  categoryTrends: Array<{ category: string; changePercent: number; trend: string }>,
  metroComparison: { priceGapPercent: number } | null
): string[] {
  const findings: string[] = [];

  // Overall inflation finding
  if (Math.abs(priceIndex.inflationRate) >= 1) {
    const direction = priceIndex.inflationRate > 0 ? 'hausse' : 'baisse';
    findings.push(
      `Inflation annuelle de ${Math.abs(priceIndex.inflationRate).toFixed(1)}% (${direction})`
    );
  } else {
    findings.push('Inflation stable sur un an');
  }

  // Monthly change finding
  if (Math.abs(priceIndex.monthlyChange) >= 0.5) {
    const direction = priceIndex.monthlyChange > 0 ? 'augmentation' : 'diminution';
    findings.push(
      `${direction.charAt(0).toUpperCase() + direction.slice(1)} mensuelle de ${Math.abs(priceIndex.monthlyChange).toFixed(1)}%`
    );
  }

  // Category with highest change
  if (categoryTrends.length > 0) {
    const topCategory = categoryTrends.reduce((max, cat) => 
      Math.abs(cat.changePercent) > Math.abs(max.changePercent) ? cat : max
    );
    findings.push(
      `Catégorie la plus volatile: ${topCategory.category} (${topCategory.changePercent > 0 ? '+' : ''}${topCategory.changePercent.toFixed(1)}%)`
    );
  }

  // Metro comparison finding
  if (metroComparison && Math.abs(metroComparison.priceGapPercent) >= 5) {
    findings.push(
      `Écart avec la métropole: ${metroComparison.priceGapPercent > 0 ? '+' : ''}${metroComparison.priceGapPercent.toFixed(1)}%`
    );
  }

  return findings;
}

/**
 * Interpret metro price gap
 */
function interpretMetroGap(gapPercent: number): string {
  const absGap = Math.abs(gapPercent);
  
  if (absGap < 5) {
    return 'Prix relativement alignés avec la métropole';
  } else if (absGap < 15) {
    return gapPercent > 0 
      ? 'Prix modérément supérieurs à la métropole'
      : 'Prix modérément inférieurs à la métropole';
  } else {
    return gapPercent > 0
      ? 'Prix significativement supérieurs à la métropole'
      : 'Prix significativement inférieurs à la métropole';
  }
}

/**
 * Store press kit in database
 */
async function storePressKit(pressKit: PressKitContent): Promise<void> {
  try {
    await prisma.inflationReport.upsert({
      where: {
        territory_year_month: {
          territory: pressKit.territory,
          year: pressKit.year,
          month: pressKit.month,
        },
      },
      update: {
        reportData: pressKit as any, // Prisma Json type
        generatedAt: pressKit.generatedAt,
      },
      create: {
        territory: pressKit.territory,
        year: pressKit.year,
        month: pressKit.month,
        reportData: pressKit as any,
        generatedAt: pressKit.generatedAt,
      },
    });

    console.log(`[PressKit] Stored press kit for ${pressKit.territory} ${pressKit.year}-${pressKit.month}`);
  } catch (error) {
    console.error('[PressKit] Error storing press kit:', error);
    throw error;
  }
}

/**
 * Get stored press kit
 */
export async function getPressKit(
  territory: Territory,
  year: number,
  month: number
): Promise<PressKitContent | null> {
  try {
    const report = await prisma.inflationReport.findUnique({
      where: {
        territory_year_month: {
          territory,
          year,
          month,
        },
      },
    });

    if (!report) {
      return null;
    }

    return report.reportData as any as PressKitContent;
  } catch (error) {
    console.error('[PressKit] Error getting press kit:', error);
    throw error;
  }
}

/**
 * Generate press kits for all territories
 */
export async function generateAllPressKits(
  year: number,
  month: number
): Promise<Map<Territory, PressKitContent>> {
  const territories: Territory[] = ['GP', 'MQ', 'GF', 'RE', 'YT'];
  const results = new Map<Territory, PressKitContent>();

  for (const territory of territories) {
    try {
      const pressKit = await generatePressKit(territory, year, month);
      results.set(territory, pressKit);
    } catch (error) {
      console.error(`[PressKit] Error generating for ${territory}:`, error);
    }
  }

  return results;
}
